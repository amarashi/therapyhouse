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

/** Rows of the table: `| \`/from/\` | \`/to/\` | 301 | why | added |`. */
export function parseRedirectsDoc(markdown) {
  const rules = [];
  for (const line of markdown.split(/\r?\n/)) {
    const match = line.match(/^\|\s*`([^`]+)`\s*\|\s*`([^`]+)`\s*\|\s*(\d{3})\s*\|/);
    if (match) rules.push({ from: match[1], to: match[2], status: Number(match[3]) });
  }
  return rules;
}

export const isSplat = (rule) => rule.from.includes('*');

/** The path a destination lands on, without its #fragment or ?query. */
export const landingPath = (to) => to.replace(/[#?].*$/, '');

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
    if (rule.status !== 301) problems.push(`${rule.from}: status ${rule.status}, expected 301`);
    if ((rule.from.match(/\*/g) ?? []).length > 1) problems.push(`${rule.from}: more than one *`);
    if (sources.has(rule.from) && sources.get(rule.from) !== rule.to) {
      problems.push(`${rule.from} has two targets: ${sources.get(rule.from)} and ${rule.to}`);
    }
    sources.set(rule.from, rule.to);
  }
  // A chain is a destination that is itself redirected; a loop is a chain
  // that comes back. Either way the target must not match any source.
  for (const rule of fileOrder(rules)) {
    const next = resolve(rules, landingPath(rule.to));
    if (next !== null) problems.push(`chain: ${rule.from} -> ${rule.to} -> ${next}`);
  }
  return problems;
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
