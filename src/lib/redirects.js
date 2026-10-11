/**
 * The launch redirect map, read from docs/redirects.md.
 *
 * docs/redirects.md is the one list a person edits. The build turns it into
 * Cloudflare's `_redirects` file (src/integrations/redirects-file.js), so the
 * table and the file can never disagree. Plain functions, so `node --test` can
 * check the map without Astro.
 *
 * Cloudflare rules, from https://developers.cloudflare.com/pages/configuration/redirects/:
 * one rule per line, `source destination status`; the top-most matching rule
 * wins; static rules must come before rules with a `*` (splat); a splat
 * matches any characters, slashes included; the source never matches on a
 * query string, so `/?utm_source=…` is served by `/` with its query intact;
 * redirects run before static files are served.
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Rows of the table: | `/from/` | `/to/` | 301 | why | added |. The To cell
 * may add a fallback, `/to/` (fallback `/other/`), used while the target
 * page is not built (see `settleRules`).
 */
export function parseRedirectsDoc(markdown) {
  const rules = [];
  for (const line of markdown.split(/\r?\n/)) {
    const match = line.match(
      /^\|\s*`([^`]+)`\s*\|\s*`([^`]+)`(?:\s*\(fallback\s+`([^`]+)`\))?\s*\|\s*(\d{3})\s*\|/
    );
    if (!match) continue;
    const rule = { from: match[1], to: match[2], status: Number(match[4]) };
    if (match[3]) rule.fallback = match[3];
    rules.push(rule);
  }
  return rules;
}

export const isSplat = (rule) => rule.from.includes('*');

/** The path a destination lands on, without its #fragment or ?query. */
export const landingPath = (to) => to.replace(/[#?].*$/, '');

/**
 * A holding rule names the page's own address as its target: the page lives
 * there, and until it is built the visitor goes to the fallback instead.
 * Once the page is built the rule is dropped, because Cloudflare runs
 * redirects before serving files and would otherwise hide the page.
 */
export const isHolding = (rule) => landingPath(rule.to) === rule.from;

/** Whether one rule's source matches a request path, the way Cloudflare does. */
export function sourceMatches(from, path) {
  if (!from.includes('*')) return from === path;
  const [head, tail] = from.split('*');
  return path.startsWith(head) && path.endsWith(tail) && path.length >= head.length + tail.length;
}

/**
 * The address a request path ends up on after one redirect, or null when no
 * rule matches. The first matching rule in file order wins, as on Cloudflare.
 */
export function resolve(rules, path) {
  const rule = fileOrder(rules).find((r) => sourceMatches(r.from, path));
  return rule ? rule.to : null;
}

/**
 * Rules in the order they are written to the file: static rules first, then
 * splats, each group in table order. A static source written with a trailing
 * slash also gets its slash-less twin, because Cloudflare matches the path
 * exactly and `/about` is as likely in an old link as `/about/`.
 */
export function fileOrder(rules) {
  const out = [];
  const seen = new Set();
  const add = (rule) => {
    if (seen.has(rule.from)) return;
    seen.add(rule.from);
    out.push(rule);
  };
  for (const rule of rules.filter((r) => !isSplat(r))) {
    add(rule);
    if (rule.from.length > 1 && rule.from.endsWith('/')) add({ ...rule, from: rule.from.slice(0, -1) });
  }
  rules.filter(isSplat).forEach(add);
  return out;
}

/** Problems that make a map unsafe to publish. Empty means it is fine. */
export function mapProblems(rules) {
  const problems = [];
  const sources = new Map();
  for (const rule of rules) {
    if (!rule.from.startsWith('/') || !rule.to.startsWith('/')) {
      problems.push(`${rule.from} -> ${rule.to}: both sides must be site paths`);
    }
    if (rule.fallback !== undefined && !rule.fallback.startsWith('/')) {
      problems.push(`${rule.from}: fallback ${rule.fallback} must be a site path`);
    }
    if (isHolding(rule) && rule.fallback === undefined) {
      problems.push(`${rule.from} redirects to itself without a fallback`);
    }
    if (rule.status !== 301) problems.push(`${rule.from}: status ${rule.status}, expected 301`);
    if ((rule.from.match(/\*/g) ?? []).length > 1) problems.push(`${rule.from}: more than one *`);
    if (sources.has(rule.from) && sources.get(rule.from) !== rule.to) {
      problems.push(`${rule.from} has two targets: ${sources.get(rule.from)} and ${rule.to}`);
    }
    sources.set(rule.from, rule.to);
  }
  // A chain is a destination that is itself redirected; a loop is a chain
  // that comes back. Either way the target (and any fallback) must not match
  // any source. Holding rules are left out: one is only written while its
  // page is not built, and then every rule pointing at that page falls back
  // as well.
  const moving = rules.filter((r) => !isHolding(r));
  for (const rule of fileOrder(rules)) {
    const targets = isHolding(rule) ? [rule.fallback] : [rule.to, rule.fallback];
    for (const to of targets.filter((t) => t !== undefined)) {
      const next = resolve(moving, landingPath(to));
      if (next !== null) problems.push(`chain: ${rule.from} -> ${to} -> ${next}`);
    }
  }
  return problems;
}

/**
 * A test of whether a build in `dir` serves a page or file at a site path
 * (written without the base). Astro's redirect stubs, the small pages with a
 * meta refresh, do not count: they are redirects, not pages.
 */
export function builtIn(dir) {
  return (path) => {
    const clean = decodeURIComponent(path);
    const candidates = clean.endsWith('/')
      ? [join(dir, clean, 'index.html')]
      : [join(dir, clean), join(dir, clean, 'index.html')];
    const file = candidates.find((f) => existsSync(f) && statSync(f).isFile());
    if (!file) return false;
    return !(file.endsWith('.html') && /http-equiv="refresh"/i.test(readFileSync(file, 'utf8')));
  };
}

/** Folders above a path, nearest first, not counting the home page. */
export function ancestors(path) {
  const parts = landingPath(path).split('/').filter(Boolean);
  const out = [];
  for (let i = parts.length - 1; i > 0; i--) out.push(`/${parts.slice(0, i).join('/')}/`);
  return out;
}

/**
 * The rules one build actually publishes, given `isBuilt` (see `builtIn`).
 *
 * Drafts are built on the Preview but left out of production, so a table
 * line can point at a page this build does not have. Such a line is written
 * as a 302 (temporary) to its declared fallback, or, without one, to the
 * nearest built folder above the target (never the home page). A 302 tells
 * search engines the move is not final, so the permanent 301 to the real
 * page is written by the first build that has it. A holding rule (see
 * `isHolding`) is dropped when its page is built.
 *
 * `problems` names every line with no built page to land on; the build
 * stops on any of them, so a redirect to a missing page can never ship.
 */
export function settleRules(rules, isBuilt) {
  const settled = [];
  const fallbacks = [];
  const problems = [];
  for (const rule of rules) {
    const target = landingPath(rule.to);
    if (isBuilt(target)) {
      if (!isHolding(rule)) settled.push({ from: rule.from, to: rule.to, status: rule.status });
      continue;
    }
    const candidates = rule.fallback !== undefined ? [rule.fallback] : ancestors(target);
    const to = candidates.find((path) => isBuilt(landingPath(path)));
    if (to === undefined) {
      problems.push(
        rule.fallback !== undefined
          ? `${rule.from} -> ${rule.to}: target is not built, and neither is its fallback ${rule.fallback}`
          : `${rule.from} -> ${rule.to}: target is not built and has no built folder above it; add "(fallback \`/path/\`)" after the target in docs/redirects.md`
      );
      continue;
    }
    const fallback = { from: rule.from, to, status: 302 };
    settled.push(fallback);
    fallbacks.push({ ...fallback, waitingFor: rule.to });
  }
  return { rules: settled, fallbacks, problems };
}

/** The `_redirects` file for a base path ('/' in production). */
export function redirectsFile(rules, base = '/') {
  const prefix = base.replace(/\/+$/, '');
  const lines = fileOrder(rules).map((r) => `${prefix}${r.from} ${prefix}${r.to} ${r.status}`);
  return [
    '# Generated from docs/redirects.md at build time. Edit that table, not this file.',
    ...lines,
    '',
  ].join('\n');
}
