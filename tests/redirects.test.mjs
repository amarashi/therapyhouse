import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import {
  ancestors,
  builtIn,
  fileOrder,
  landingPath,
  mapProblems,
  parseRedirectsDoc,
  redirectsFile,
  resolve,
  settleRules,
} from "../src/lib/redirects.js";
import { redirectsFileIntegration } from "../src/integrations/redirects-file.js";
import { buildSite } from "../tools/build-site.mjs";

/**
 * The launch redirect map (issue #41): docs/redirects.md becomes Cloudflare's
 * `_redirects`, every Current Site address lands somewhere, and no redirect
 * leads to another redirect. A line whose target is a draft (not built in
 * production) is written as a 302 to its fallback, and the build fails if a
 * redirect would land on a page that is not built (issue #90).
 */

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const rules = parseRedirectsDoc(read("docs/redirects.md"));

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


/* ---- Targets that are not built (issue #90) ---- */

test("a fallback is read from the To cell", () => {
  const [rule] = parseRedirectsDoc("| `/relationship/` | `/therapy/couples/` (fallback `/therapy/`) | 301 | why | 11 Oct 2026 |");
  assert.deepEqual(rule, { from: "/relationship/", to: "/therapy/couples/", status: 301, fallback: "/therapy/" });
  assert.equal(resolve(rules, "/relationship/"), "/therapy/couples/");
});

test("folders above a path, nearest first, never the home page", () => {
  assert.deepEqual(ancestors("/assessments/learning/"), ["/assessments/"]);
  assert.deepEqual(ancestors("/a/b/c/#x"), ["/a/b/", "/a/"]);
  assert.deepEqual(ancestors("/children/"), []);
});

test("a built target keeps its 301; a missing one gets a 302 to its fallback or nearest built folder", () => {
  const built = new Set(["/therapy/", "/assessments/", "/team/", "/fees/"]);
  const isBuilt = (path) => built.has(path);
  const table = [
    { from: "/about/", to: "/team/", status: 301 },
    { from: "/relationship/", to: "/therapy/couples/", status: 301, fallback: "/therapy/" },
    { from: "/old-learning/", to: "/assessments/learning/", status: 301 },
    { from: "/ndis/", to: "/ndis/", status: 301, fallback: "/fees/#ndis" },
  ];
  const settled = settleRules(table, isBuilt);
  assert.deepEqual(settled.problems, []);
  assert.deepEqual(settled.rules, [
    { from: "/about/", to: "/team/", status: 301 },
    { from: "/relationship/", to: "/therapy/", status: 302 },
    { from: "/old-learning/", to: "/assessments/", status: 302 },
    { from: "/ndis/", to: "/fees/#ndis", status: 302 },
  ]);
  assert.deepEqual(settled.fallbacks.map((f) => f.waitingFor), ["/therapy/couples/", "/assessments/learning/", "/ndis/"]);

  // Once the pages are signed off and built, the same table gives 301s and
  // the holding line for /ndis/ is left out.
  ["/therapy/couples/", "/assessments/learning/", "/ndis/"].forEach((p) => built.add(p));
  assert.deepEqual(settleRules(table, isBuilt).rules, [
    { from: "/about/", to: "/team/", status: 301 },
    { from: "/relationship/", to: "/therapy/couples/", status: 301 },
    { from: "/old-learning/", to: "/assessments/learning/", status: 301 },
  ]);
});

test("a target with no built page to fall back to is a problem that names the line", () => {
  const isBuilt = (path) => path === "/therapy/";
  const { problems } = settleRules(
    [
      { from: "/child-psychologists/", to: "/children/", status: 301 },
      { from: "/x/", to: "/children/", status: 301, fallback: "/also-missing/" },
    ],
    isBuilt
  );
  assert.equal(problems.length, 2);
  assert.match(problems[0], /^\/child-psychologists\/ -> \/children\/: target is not built/);
  assert.match(problems[1], /neither is its fallback \/also-missing\//);
});

test("a line to itself needs a fallback, and a fallback must not be redirected", () => {
  assert.match(mapProblems([{ from: "/a/", to: "/a/", status: 301 }]).join("\n"), /itself without a fallback/);
  const viaFallback = [
    { from: "/a/", to: "/b/", status: 301, fallback: "/c/" },
    { from: "/c/", to: "/d/", status: 301 },
  ];
  assert.match(mapProblems(viaFallback).join("\n"), /chain: \/a\/ -> \/c\/ -> \/d\//);
  // A line pointing at a holding page is not a chain: the holding line is
  // only written while that page is missing, and then this line falls back too.
  const toHolding = [
    { from: "/x/", to: "/ndis/", status: 301, fallback: "/fees/" },
    { from: "/ndis/", to: "/ndis/", status: 301, fallback: "/fees/#ndis" },
  ];
  assert.deepEqual(mapProblems(toHolding), []);
});

test("the build stops when a redirect would land on a page it does not have", () => {
  const empty = mkdtempSync(join(tmpdir(), "therapyhouse-empty-"));
  try {
    const integration = redirectsFileIntegration();
    integration.hooks["astro:config:done"]({ config: { base: "/" } });
    const logger = { info() {}, warn() {} };
    assert.throws(
      () => integration.hooks["astro:build:done"]({ dir: pathToFileURL(`${empty}/`), logger }),
      /docs\/redirects\.md cannot be published:[\s\S]*\/about\/ -> \/team\/: target is not built/
    );
  } finally {
    rmSync(empty, { recursive: true, force: true });
  }
});

/* ---- Against a real production build ---- */

let outDir;
let served;
let published;
before(() => {
  outDir = buildSite("production");
  served = builtIn(outDir);
  published = readFileSync(join(outDir, "_redirects"), "utf8")
    .split("\n")
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const [from, to, status] = line.split(" ");
      return { from, to, status: Number(status) };
    });
});
after(() => rmSync(outDir, { recursive: true, force: true }));

test("the build writes _redirects from the table, settled against what it built", () => {
  const settled = settleRules(rules, served);
  assert.deepEqual(settled.problems, []);
  assert.equal(readFileSync(join(outDir, "_redirects"), "utf8"), redirectsFile(settled.rules, "/"));
});

test("every _redirects target is a built page", () => {
  const broken = published.filter((r) => !served(landingPath(r.to))).map((r) => `${r.from} -> ${r.to}`);
  assert.deepEqual(broken, []);
});

test("a built target gets a 301, a draft target a 302 to its fallback", () => {
  for (const rule of rules) {
    const line = published.find((r) => r.from === rule.from);
    if (served(landingPath(rule.to))) {
      if (landingPath(rule.to) === rule.from) assert.equal(line, undefined, `${rule.from} is built, so its holding line must go`);
      else assert.deepEqual(line, { from: rule.from, to: rule.to, status: 301 });
    } else {
      assert.equal(line?.status, 302, `${rule.from}: ${rule.to} is not built, expected a 302`);
      assert.notEqual(line.to, rule.to);
    }
  }
});

test("the Current Site's draft addresses land on a built page in production", () => {
  for (const [from, page] of [
    ["/relationship/", "/therapy/couples/"],
    ["/category/relationship/", "/therapy/couples/"],
    ["/child-psychologists/", "/children/"],
    ["/category/child-psychologists/", "/children/"],
    ["/assessments/is-your-child-learning-to-the-best-of-their-capacity/", "/assessments/learning/"],
  ]) {
    const to = resolve(published, from);
    assert.ok(to && served(landingPath(to)), `${from} -> ${to}`);
    if (served(page)) assert.equal(to, page);
  }
});

test("every Current Site address is a page of the new site or redirects to one", () => {
  const missing = [];
  for (const path of currentSite) {
    const to = resolve(published, path);
    const landing = to === null ? path : landingPath(to);
    if (served(landing)) continue;
    missing.push(to === null ? `${path} (no redirect, no page)` : `${path} -> ${to} (target not built)`);
  }
  assert.deepEqual(missing, []);
});
