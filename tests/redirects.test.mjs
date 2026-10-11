import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { existsSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";

import {
  fileOrder,
  landingPath,
  mapProblems,
  parseRedirectsDoc,
  redirectsFile,
  resolve,
} from "../src/lib/redirects.js";
import { buildSite } from "../tools/build-site.mjs";

/**
 * The launch redirect map (issue #41): docs/redirects.md becomes Cloudflare's
 * `_redirects`, every Current Site address lands somewhere, and no redirect
 * leads to another redirect.
 */

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const rules = parseRedirectsDoc(read("docs/redirects.md"));

/**
 * Pages other issues are building at the address a redirect points to, or at
 * the Current Site's own address. Until they are merged a redirect to them
 * would be a 404, so the launch runbook (#45) checks this list is empty.
 * Remove a line when its page is built.
 */
const PENDING_PAGES = new Map([
  ["/children/", "#6 child and adolescent hub"],
  ["/therapy/couples/", "#11 couples and relationship therapy"],
  ["/assessments/learning/", "#21 learning assessment"],
  ["/ndis/", "#13 public NDIS page, at the Current Site's own address"],
  ["/group-therapy/circle-of-security-parenting-program/", "#14 Circle of Security, at its existing address"],
]);

const currentSite = read("tests/fixtures/current-site-urls.txt")
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith("#"));

/* ---- The rules themselves ---- */

test("the table parses into 301 rules", () => {
  assert.ok(rules.length >= 80, `only ${rules.length} rules`);
  assert.ok(rules.every((r) => r.status === 301));
});

test("the map has no duplicate source, chain or loop", () => {
  assert.deepEqual(mapProblems(rules), []);
});

test("a chain, a loop and a path with two targets are all caught", () => {
  const chain = [
    { from: "/a/", to: "/b/", status: 301 },
    { from: "/b/", to: "/c/", status: 301 },
  ];
  assert.match(mapProblems(chain).join("\n"), /chain: \/a\/ -> \/b\/ -> \/c\//);
  const loop = [
    { from: "/a/", to: "/b/", status: 301 },
    { from: "/b/", to: "/a/", status: 301 },
  ];
  const loopProblems = mapProblems(loop);
  assert.ok(loopProblems.length >= 2 && loopProblems.every((p) => p.startsWith("chain:")));
  const twice = [
    { from: "/a/", to: "/b/", status: 301 },
    { from: "/a/", to: "/c/", status: 301 },
  ];
  assert.match(mapProblems(twice).join("\n"), /two targets/);
  const viaSplat = [
    { from: "/x/", to: "/old/thing/", status: 301 },
    { from: "/old/*", to: "/new/", status: 301 },
  ];
  assert.match(mapProblems(viaSplat).join("\n"), /chain/);
});

test("static rules come first, each with its slash-less twin, then splats", () => {
  const ordered = fileOrder([
    { from: "/category/*", to: "/library/", status: 301 },
    { from: "/category/assessments/", to: "/assessments/", status: 301 },
  ]);
  assert.deepEqual(ordered.map((r) => r.from), ["/category/assessments/", "/category/assessments", "/category/*"]);
  assert.equal(resolve(rules, "/category/assessments/"), "/assessments/");
  assert.equal(resolve(rules, "/category/blog/page/2/"), "/library/");
  assert.equal(resolve(rules, "/about"), "/team/");
});

test("the file is written for the base path, one rule a line", () => {
  const sample = [{ from: "/about/", to: "/team/", status: 301 }];
  assert.equal(redirectsFile(sample, "/").split("\n")[1], "/about/ /team/ 301");
  assert.equal(redirectsFile(sample, "/therapyhouse").split("\n")[1], "/therapyhouse/about/ /therapyhouse/team/ 301");
});

test("the home page has no redirect, so the Business Profile link keeps its query", () => {
  // Cloudflare never matches on the query string, so this request is `/`.
  const gmb = new URL("https://www.therapyhouse.com.au/?utm_source=google&utm_medium=organic&utm_campaign=gmb");
  assert.equal(resolve(rules, gmb.pathname), null);
});

test("every service page's redirectFrom is in the table, pointing at that page", () => {
  const dir = new URL("src/content/services/", root);
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".md"))) {
    const source = readFileSync(new URL(file, dir), "utf8");
    const kind = source.match(/^kind:\s*(\w+)/m)?.[1];
    const block = source.match(/^redirectFrom:\s*\r?\n((?:\s+-\s+.*\r?\n)+)/m)?.[1] ?? "";
    const froms = [...block.matchAll(/-\s+['"]?([^'"\s]+)/g)].map((m) => m[1]);
    const id = file.replace(/\.md$/, "");
    const ownPath = source.match(/^path:\s*['"]?([^'"\s]+)/m)?.[1];
    const page = ownPath ? ownPath : kind === "assessment" ? `/assessments/${id}/` : kind === "hub" ? `/${id}/` : `/therapy/${id}/`;
    for (const from of froms) {
      assert.equal(resolve(rules, from), page, `${file}: ${from} is not redirected to ${page} in docs/redirects.md`);
    }
  }
});

/* ---- Against a real production build ---- */

let outDir;
before(() => {
  outDir = buildSite("production");
});
after(() => rmSync(outDir, { recursive: true, force: true }));

/** Whether the build serves a page or file at this path (and it is not a redirect stub). */
function served(path) {
  const clean = decodeURIComponent(path);
  const candidates = clean.endsWith("/") ? [join(outDir, clean, "index.html")] : [join(outDir, clean), join(outDir, clean, "index.html")];
  const file = candidates.find((f) => existsSync(f) && statSync(f).isFile());
  if (!file) return false;
  return !(file.endsWith(".html") && /http-equiv="refresh"/i.test(readFileSync(file, "utf8")));
}

test("the build writes _redirects from the table", () => {
  assert.equal(readFileSync(join(outDir, "_redirects"), "utf8"), redirectsFile(rules, "/"));
});

test("every Current Site address is a page of the new site or redirects to one", () => {
  const missing = [];
  for (const path of currentSite) {
    const to = resolve(rules, path);
    const landing = to === null ? path : landingPath(to);
    if (served(landing) || PENDING_PAGES.has(landing)) continue;
    missing.push(to === null ? `${path} (no redirect, no page)` : `${path} -> ${to} (target not built)`);
  }
  assert.deepEqual(missing, []);
});

test("every redirect target is built, or is a page another issue is building", () => {
  const broken = rules
    .map((r) => landingPath(r.to))
    .filter((to) => !served(to) && !PENDING_PAGES.has(to));
  assert.deepEqual([...new Set(broken)], []);
});
