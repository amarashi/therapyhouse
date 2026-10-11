import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { draftServicePaths, sitemapFilter } from "../src/lib/sitemap.js";
import { buildSite } from "../tools/build-site.mjs";

/**
 * Issue #32: the sitemap lists every page a search engine should index and
 * nothing else, and robots.txt names it without blocking anything. Built for
 * the Preview, because that is the build that contains drafts and redirect
 * stubs to leave out. The production addresses are checked in
 * production-build.test.mjs.
 */

test("the filter drops the 404 page and excluded paths, with or without the base", () => {
  const keep = sitemapFilter({ base: "/therapyhouse", excluded: ["/services", "/therapy/x/"] });
  assert.equal(keep("https://a.example/therapyhouse/team/"), true);
  assert.equal(keep("https://a.example/therapyhouse/services/"), false);
  assert.equal(keep("https://a.example/therapyhouse/therapy/x/"), false);
  assert.equal(keep("https://a.example/therapyhouse/404/"), false);
  const root = sitemapFilter({ base: "/", excluded: ["/services"] });
  assert.equal(root("https://www.example.com/services/"), false);
  assert.equal(root("https://www.example.com/"), true);
});

test("draft service pages are found from their front matter", () => {
  const dir = fileURLToPath(new URL("../src/content/services/", import.meta.url));
  for (const path of draftServicePaths(dir)) {
    // Audience hubs (/adults/, /children/) sit at the site root.
    assert.match(path, /^\/((therapy|assessments)\/)?[^/]+\/$/);
  }
});

const BASE = "/therapyhouse";
const dist = buildSite("preview");
test.after(() => rmSync(dist, { recursive: true, force: true }));

const sitemapPaths = new Set(
  [...readFileSync(join(dist, "sitemap-0.xml"), "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    ([, loc]) => new URL(loc).pathname.slice(BASE.length)
  )
);

/** Every built page as [site path, html]. */
function builtPages(dir = dist) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return builtPages(full);
    if (name !== "index.html") return [];
    const path = `/${relative(dist, dir).split(sep).join("/")}/`.replace(/^\/\/$/, "/");
    return [[path, readFileSync(full, "utf8")]];
  });
}
const pages = builtPages();
const isRedirectStub = (html) => /http-equiv="refresh"/i.test(html);
const isDraft = (html) => html.includes("Draft for review. This page is not on the clinic's website.");

test("the sitemap lists every built page that is not a draft or a redirect", () => {
  const indexable = pages.filter(([, html]) => !isRedirectStub(html) && !isDraft(html));
  assert.ok(indexable.length > 10);
  for (const [path] of indexable) assert.ok(sitemapPaths.has(path), `${path} missing from the sitemap`);
  assert.equal(sitemapPaths.size, indexable.length, "the sitemap lists a page that was not built");
});

test("no draft, redirect stub, 404 or query variant is in the sitemap", () => {
  const stubs = pages.filter(([, html]) => isRedirectStub(html)).map(([path]) => path);
  const drafts = pages.filter(([, html]) => isDraft(html)).map(([path]) => path);
  assert.ok(stubs.includes("/services/"), "expected /services/ to be a redirect stub");
  for (const path of [...stubs, ...drafts, "/404/"]) {
    assert.ok(!sitemapPaths.has(path), `${path} should not be in the sitemap`);
  }
  for (const path of sitemapPaths) assert.doesNotMatch(path, /[?#]/);
});

test("robots.txt allows everything and names the sitemap index", () => {
  const robots = readFileSync(join(dist, "robots.txt"), "utf8");
  assert.match(robots, /^User-agent: \*$/m);
  assert.doesNotMatch(robots, /^Disallow:\s*\S/m, "robots.txt must not block crawling");
  assert.match(robots, /^Sitemap: https:\/\/amarashi\.github\.io\/therapyhouse\/sitemap-index\.xml$/m);
  readFileSync(join(dist, "sitemap-index.xml"), "utf8");
});
