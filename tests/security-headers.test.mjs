import assert from "node:assert/strict";
import test from "node:test";

import {
  contentSecurityPolicy,
  headersFile,
  headersFor,
  inlineScriptHashes,
  parseHeadersFile,
} from "../src/lib/security-headers.js";

/**
 * Issue #44: the Cloudflare `_headers` file. These are the checks that need
 * no build; production-build.test.mjs checks the generated file against the
 * real pages (every inline script hashed, every external origin allowed).
 */

const rules = parseHeadersFile(headersFile({ scriptHashes: ["'sha256-abc='"] }));

test("every response carries the security headers", () => {
  for (const path of ["/", "/team/", "/_astro/page.abc123.js", "/assets/media/logo3d.png"]) {
    const h = headersFor(rules, path);
    assert.match(h["Strict-Transport-Security"], /max-age=31536000/);
    assert.equal(h["X-Content-Type-Options"], "nosniff");
    assert.equal(h["Referrer-Policy"], "strict-origin-when-cross-origin");
    assert.match(h["Permissions-Policy"], /camera=\(\)/);
    assert.match(h["Content-Security-Policy"], /frame-ancestors 'none'/);
  }
});

test("hashed assets are cached for a year, pages only until revalidated", () => {
  assert.equal(headersFor(rules, "/_astro/page.abc123.js")["Cache-Control"], "public, max-age=31536000, immutable");
  for (const page of ["/", "/team/", "/team/rani-banks/"]) {
    assert.equal(headersFor(rules, page)["Cache-Control"], "public, max-age=0, must-revalidate");
  }
  // Unhashed files get no Cache-Control from us, so never a joined pair.
  assert.equal(headersFor(rules, "/assets/media/logo3d.png")["Cache-Control"], undefined);
});

test("the rules follow the base path on the Preview", () => {
  const preview = parseHeadersFile(headersFile({ base: "/therapyhouse/" }));
  assert.deepEqual(
    preview.map((r) => r.pattern),
    ["/therapyhouse/*", "/therapyhouse/_astro/*", "/therapyhouse/", "/therapyhouse/*/"]
  );
});

test("the CSP allows only the site, Analytics, booking and the video frame", () => {
  const csp = contentSecurityPolicy(["'sha256-abc='"]);
  assert.match(csp, /default-src 'self'/);
  assert.match(csp, /script-src 'self' 'sha256-abc=' https:\/\/www\.googletagmanager\.com;/);
  assert.match(csp, /object-src 'none'/);
  assert.doesNotMatch(csp.match(/script-src[^;]*/)[0], /unsafe-inline|unsafe-eval|\*/);
});

test("the parser rejects a malformed file", () => {
  assert.throws(() => parseHeadersFile("team/\n  X: y\n"), /not a path pattern/);
  assert.throws(() => parseHeadersFile("/*\n  no colon here\n"), /not a header/);
  assert.throws(() => parseHeadersFile("/*\n  X: a\n  X: b\n"), /set twice/);
});

test("only executable inline scripts are hashed", () => {
  const hashes = inlineScriptHashes([
    '<script>a()</script><script type="module">b()</script>',
    '<script type="application/ld+json">{}</script><script src="/x.js"></script><script>a()</script>',
  ]);
  assert.equal(hashes.length, 2);
  for (const hash of hashes) assert.match(hash, /^'sha256-[A-Za-z0-9+/]+=*'$/);
});
