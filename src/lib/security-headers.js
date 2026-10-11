/**
 * The Cloudflare `_headers` file: security headers on every response, and a
 * cache policy that keeps hashed build assets for a year and makes browsers
 * check HTML on every visit.
 *
 * It is generated after the build (src/integrations/security-headers.js)
 * rather than hand-written in `public/`, for one reason: the site has a few
 * small inline scripts (the lift, the hero, the house's asset base), and the
 * Content-Security-Policy allows each one by the SHA-256 hash of its exact
 * text instead of allowing every inline script ('unsafe-inline'). Those
 * hashes change whenever a script is edited, so only the build can know them.
 *
 * Plain functions, so `node --test` can check them without a build.
 */
import { createHash } from 'node:crypto';

/**
 * Every external origin a page may load something from. The CSP allows these
 * and nothing else besides the site itself.
 */
export const EXTERNAL_ORIGINS = {
  /** Google Analytics 4 (gtag.js): the script, its beacons and its pixel. */
  analyticsScript: ['https://www.googletagmanager.com'],
  analyticsConnect: [
    'https://www.googletagmanager.com',
    'https://*.google-analytics.com',
    'https://*.analytics.google.com',
  ],
  analyticsImage: ['https://www.googletagmanager.com', 'https://*.google-analytics.com'],
  /** Power Diary, the booking system, in case its booking form is embedded. */
  booking: ['https://my.powerdiary.com'],
  /** The Library's video volumes play in a privacy-enhanced YouTube frame. */
  video: ['https://www.youtube-nocookie.com'],
};

/** SHA-256 hashes, in CSP form, of every inline script that runs. */
export function inlineScriptHashes(htmlPages) {
  const hashes = new Set();
  for (const html of htmlPages) {
    for (const [, attrs = '', body] of html.matchAll(/<script(\s[^>]*)?>([\s\S]*?)<\/script>/gi)) {
      if (/\bsrc\s*=/i.test(attrs)) continue;
      // JSON-LD and other data blocks are never executed, so CSP ignores them.
      const type = attrs.match(/\btype\s*=\s*["']?([^"'\s>]+)/i)?.[1]?.toLowerCase();
      if (type && type !== 'module' && type !== 'text/javascript') continue;
      hashes.add(`'sha256-${createHash('sha256').update(body).digest('base64')}'`);
    }
  }
  return [...hashes].sort();
}

/** The Content-Security-Policy value. */
export function contentSecurityPolicy(scriptHashes = []) {
  const o = EXTERNAL_ORIGINS;
  const directives = {
    'default-src': ["'self'"],
    'script-src': ["'self'", ...scriptHashes, ...o.analyticsScript],
    // Astro and the components set `style="…"` and small <style> blocks.
    'style-src': ["'self'", "'unsafe-inline'"],
    // three.js decodes some textures through blob: URLs.
    'img-src': ["'self'", 'data:', 'blob:', ...o.analyticsImage],
    'font-src': ["'self'"],
    'media-src': ["'self'"],
    'connect-src': ["'self'", ...o.analyticsConnect],
    'frame-src': [...o.video, ...o.booking],
    'form-action': ["'self'", ...o.booking],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': [],
  };
  return Object.entries(directives)
    .map(([name, values]) => [name, ...values].join(' '))
    .join('; ');
}

/** The whole `_headers` file for a site served from `base`. */
export function headersFile({ base = '/', scriptHashes = [] } = {}) {
  const prefix = base.replace(/\/+$/, '');
  return `# Generated at build time by src/integrations/security-headers.js; edit src/lib/security-headers.js.
# Cloudflare joins the values of a header that more than one matching rule
# sets, so Cache-Control is set only by rules that never overlap.

${prefix}/*
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  Content-Security-Policy: ${contentSecurityPolicy(scriptHashes)}
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()

# Hashed build assets: the file name changes whenever the content does.
${prefix}/_astro/*
  Cache-Control: public, max-age=31536000, immutable

# Pages (every page address ends in a slash): cached, but checked with the
# server on each visit, so a deploy shows at once.
${prefix}/
  Cache-Control: public, max-age=0, must-revalidate
${prefix}/*/
  Cache-Control: public, max-age=0, must-revalidate
`;
}

/**
 * Parse a `_headers` file into [{ pattern, headers: { name: value } }],
 * following Cloudflare's format: a pattern line at column 0, then indented
 * `Name: value` lines. Throws on anything else, so a malformed file fails a
 * test instead of being half-applied by Cloudflare.
 */
export function parseHeadersFile(text) {
  const rules = [];
  text.split(/\r?\n/).forEach((line, i) => {
    if (!line.trim() || line.trimStart().startsWith('#')) return;
    if (line.length > 2000) throw new Error(`line ${i + 1} is over Cloudflare's 2,000 characters`);
    if (!/^\s/.test(line)) {
      if (!line.startsWith('/') && !line.startsWith('https://')) {
        throw new Error(`line ${i + 1}: "${line}" is not a path pattern`);
      }
      rules.push({ pattern: line.trim(), headers: {} });
      return;
    }
    const match = line.trim().match(/^([A-Za-z0-9-]+):\s*(.+)$/);
    if (!match || rules.length === 0) throw new Error(`line ${i + 1}: "${line.trim()}" is not a header`);
    const { headers } = rules[rules.length - 1];
    if (headers[match[1]]) throw new Error(`line ${i + 1}: ${match[1]} is set twice in one rule`);
    headers[match[1]] = match[2];
  });
  if (rules.length > 100) throw new Error('Cloudflare allows at most 100 header rules');
  return rules;
}

/** Whether a Cloudflare pattern (at most one `*` splat) matches a path. */
export function patternMatches(pattern, path) {
  const parts = pattern.split('*').map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`^${parts.join('.*')}$`).test(path);
}

/** Every header Cloudflare would send for `path`, joining repeated values as it does. */
export function headersFor(rules, path) {
  const out = {};
  for (const rule of rules.filter((r) => patternMatches(r.pattern, path))) {
    for (const [name, value] of Object.entries(rule.headers)) {
      out[name] = out[name] ? `${out[name]}, ${value}` : value;
    }
  }
  return out;
}
