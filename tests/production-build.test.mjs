import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";

import { buildSite } from "../tools/build-site.mjs";
import { headersFor, inlineScriptHashes, parseHeadersFile } from "../src/lib/security-headers.js";

/**
 * Launch day builds the site for the clinic's domain with no base path. The
 * Preview never does, so a break in that shape stays hidden until the day it
 * matters (issue #24: every team page failed with "Missing parameter: slug").
 * This builds the production shape on every `pnpm test` and checks the result
 * looks like a root-hosted site.
 */

const dist = buildSite("production");
test.after(() => rmSync(dist, { recursive: true, force: true }));

const page = (path) => readFileSync(join(dist, path, "index.html"), "utf8");
const teamIds = readdirSync(new URL("../src/content/team/", import.meta.url))
  .filter((file) => /\.mdx?$/.test(file))
  .map((file) => file.replace(/\.mdx?$/, ""));

test("every team member gets a profile page in the production build", () => {
  assert.ok(teamIds.length > 0, "no team files found");
  for (const id of teamIds) {
    assert.ok(existsSync(join(dist, "team", id, "index.html")), `missing /team/${id}/`);
  }
});

test("production pages point at the clinic's domain, not the Preview", () => {
  const html = page("team");
  assert.match(html, /<link rel="canonical" href="https:\/\/www\.therapyhouse\.com\.au\/team\/"/);
  assert.doesNotMatch(html, /noindex/, "production must not carry the Preview's noindex");
  assert.doesNotMatch(html, /github\.io/);
});

test("internal links have no Preview base path", () => {
  for (const path of ["", "team", "therapy", `team/${teamIds[0]}`]) {
    const html = page(path);
    assert.doesNotMatch(html, /(?:href|src)="\/therapyhouse\//, `/${path} links into /therapyhouse/`);
  }
});

test("the old /services/ address forwards to /therapy/ at the domain root", () => {
  const html = page("services");
  assert.match(html, /url=\/therapy\/"/);
  assert.doesNotMatch(html, /\/therapyhouse\//);
});

test("robots.txt and the sitemap use the clinic's domain", () => {
  const robots = readFileSync(join(dist, "robots.txt"), "utf8");
  assert.match(robots, /^Sitemap: https:\/\/www\.therapyhouse\.com\.au\/sitemap-index\.xml$/m);
  const locs = [...readFileSync(join(dist, "sitemap-0.xml"), "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)];
  assert.ok(locs.length > 10);
  for (const [, loc] of locs) assert.match(loc, /^https:\/\/www\.therapyhouse\.com\.au\//);
});

/* Issue #44: the generated _headers file against the real pages. */

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)]
  );
}
const files = walk(dist);
const htmlPages = files.filter((f) => f.endsWith(".html")).map((f) => readFileSync(f, "utf8"));
const headerRules = parseHeadersFile(readFileSync(join(dist, "_headers"), "utf8"));
const csp = headersFor(headerRules, "/")["Content-Security-Policy"];
const directive = (name) => (csp.match(new RegExp(`(?:^|; )${name} ([^;]*)`))?.[1] ?? "").split(" ");

/** Whether a CSP source list allows an origin (exact, or a `*.` wildcard). */
function allows(sources, origin) {
  const { protocol, hostname } = new URL(origin);
  return sources.some((source) => {
    if (!source.startsWith("https://") && !source.startsWith("http://")) return false;
    const allowed = new URL(source.replace("*.", "wildcard."));
    if (allowed.protocol !== protocol) return false;
    return source.includes("*.")
      ? hostname.endsWith(allowed.hostname.replace(/^wildcard/, ""))
      : hostname === allowed.hostname;
  });
}

test("_headers parses and every built file gets at most one Cache-Control", () => {
  assert.ok(headerRules.length >= 4);
  for (const file of files) {
    const path = `/${file.slice(dist.length + 1).split("\\").join("/")}`.replace(/index\.html$/, "");
    const cache = headersFor(headerRules, path)["Cache-Control"];
    if (cache) assert.doesNotMatch(cache, /, public/, `${path} gets two Cache-Control values`);
  }
});

test("the CSP lists the hash of every inline script on every page", () => {
  for (const hash of inlineScriptHashes(htmlPages)) assert.ok(directive("script-src").includes(hash), hash);
});

test("the CSP allows every external origin the built pages load from", () => {
  const checks = [
    // [directive, regex capturing a URL] for each way an HTML page loads something.
    ["script-src", /<script[^>]*\ssrc="(https?:[^"]+)"/g],
    ["style-src", /<link[^>]*rel="stylesheet"[^>]*href="(https?:[^"]+)"/g],
    ["img-src", /<img[^>]*\ssrc="(https?:[^"]+)"/g],
    ["frame-src", /<iframe[^>]*\ssrc="(https?:[^"]+)"/g],
    ["media-src", /<(?:video|audio|source)[^>]*\ssrc="(https?:[^"]+)"/g],
    ["form-action", /<form[^>]*\saction="(https?:[^"]+)"/g],
  ];
  for (const html of htmlPages) {
    for (const [name, pattern] of checks) {
      for (const [, url] of html.matchAll(pattern)) {
        const { origin } = new URL(url);
        if (origin === "https://www.therapyhouse.com.au") continue;
        assert.ok(allows(directive(name), origin), `${name} does not allow ${origin}`);
      }
    }
  }
  /* Scripts can also load things (the Library's video frame). Every origin a
     bundle names must be allowed somewhere in the CSP, or be listed here as a
     plain link the visitor follows, which CSP does not govern. */
  const linksOnly = new Set([
    "https://www.therapyhouse.com.au",
    "https://my.powerdiary.com",
    "https://www.youtube.com",
    "https://www.google.com",
    "https://checkout.square.site",
    "http://www.w3.org",
  ]);
  const allSources = csp.split("; ").flatMap((d) => d.split(" ").slice(1));
  for (const file of files.filter((f) => f.endsWith(".js"))) {
    for (const [origin] of readFileSync(file, "utf8").matchAll(/https?:\/\/[a-zA-Z0-9.-]+\.[a-z]{2,}/g)) {
      if (linksOnly.has(origin)) continue;
      assert.ok(allows(allSources, origin), `${file} uses ${origin}, which the CSP does not allow`);
    }
  }
  assert.ok(allows(directive("frame-src"), "https://www.youtube-nocookie.com"));
});

/* ---- Analytics (issue #35) ---- */

const GA_SRC = 'src="https://www.googletagmanager.com/gtag/js?id=G-XZ6REXQCZ8"';

test("production pages, the house included, load the Analytics tag once", () => {
  for (const path of ["", "team", "contact", `team/${teamIds[0]}`, "house"]) {
    const html = page(path);
    assert.equal(html.split(GA_SRC).length - 1, 1, `/${path} should load gtag exactly once`);
    assert.match(html, /gtag\('config', measurementId\)/);
  }
});

test("the Analytics script sends the four events from links and forms", () => {
  /* Run the page's own inline script against a stand-in document, then fire
     clicks and a submit through the listeners it registered. */
  const html = page("contact");
  const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
    .map((m) => m[1])
    .find((s) => s.includes("gtag('config'"));
  assert.ok(script, "inline Analytics script not found");

  const listeners = {};
  const window = { dataLayer: [] };
  const document = { addEventListener: (type, fn) => (listeners[type] = fn) };
  new Function("window", "document", script)(window, document);

  const sent = () => window.dataLayer.filter((args) => args[0] === "event").map((args) => args[1]);
  const link = (href) => ({
    getAttribute: () => href,
    href,
    textContent: "x",
  });
  const click = (href) =>
    listeners.click({ target: { closest: () => (href ? link(href) : null) } });

  click("tel:+61733002170");
  click("mailto:admin@therapyhouse.com.au");
  click("https://my.powerdiary.com/clientportal/3cjz0");
  click("https://www.therapyhouse.com.au/team/");
  click(null);
  listeners.submit({ target: { id: "enquiry", getAttribute: () => null } });

  assert.deepEqual(sent(), ["phone_click", "email_click", "booking_click", "form_submit"]);
});
