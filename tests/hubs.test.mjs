import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

import { HUB_GROUPS, hubGroups, serviceLinks } from "../src/lib/services.js";
import { nav, footerNav } from "../src/data/site.js";

/**
 * The hubs (issue #4) are the only way into the service pages besides the
 * footer: the lift has six floors and no drop-downs. These tests guard that a
 * service page written as a Markdown file is always linked from its hub and
 * the footer, and that the old /services/ address still leads somewhere.
 */

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const entry = (id, data) => ({
  id,
  data: { h1: id, description: `About ${id}.`, kind: "therapy", ...data },
});

test("the hub lists therapy pages under their headings, in the hub's order", () => {
  const groups = hubGroups([
    entry("couples", { hubGroup: "couples" }),
    entry("trauma", { hubGroup: "adults" }),
    entry("anxiety", { hubGroup: "adults" }),
    entry("approaches", { hubGroup: "how-we-work" }),
  ]);
  assert.deepEqual(
    groups.map((g) => g.label),
    ["For adults", "For couples", "How we work"]
  );
  assert.deepEqual(groups[0].links.map((l) => l.id), ["anxiety", "trauma"]);
  assert.equal(groups[0].links[0].href, "/therapy/anxiety/");
});

test("a heading with nothing under it is left out", () => {
  const groups = hubGroups([entry("trauma", { hubGroup: "adults" })]);
  assert.equal(groups.length, 1);
  assert.equal(hubGroups([]).length, 0);
});

test("an ungrouped therapy page is still listed, under the last heading", () => {
  const groups = hubGroups([entry("grief", {})]);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].label, HUB_GROUPS.at(-1).label);
  assert.equal(groups[0].links[0].id, "grief");
});

test("assessments never appear on the therapy hub", () => {
  const groups = hubGroups([entry("adult-adhd", { kind: "assessment", hubGroup: "adults" })]);
  assert.equal(groups.length, 0);
});

test("assessment links point under /assessments/", () => {
  const [link] = serviceLinks([entry("adult-adhd", { kind: "assessment" })]);
  assert.equal(link.href, "/assessments/adult-adhd/");
});

test("the lift's former Services floor is now Therapy, still six floors", () => {
  const ready = nav.filter((item) => item.ready);
  assert.equal(ready.length, 6);
  assert.ok(ready.some((item) => item.label === "Therapy" && item.href === "/therapy/"));
  assert.ok(!nav.some((item) => item.href === "/services/"), "nothing should link to /services/");
  assert.ok(!footerNav.some((item) => item.href === "/services/"));
});

test("/services/ forwards to /therapy/ on the preview and is recorded for Cloudflare", async () => {
  const config = await read("astro.config.mjs");
  assert.match(config, /'\/services':\s*`\$\{base[^`]*\}\/therapy\/`/);
  const redirects = await read("docs/redirects.md");
  assert.match(redirects, /`\/services\/` \| `\/therapy\/` \| 301/);
});

test("no page or content file still links to /services/", async () => {
  for (const path of ["src/content/pages/home.md", "src/pages/therapy/index.astro", "src/pages/assessments.astro"]) {
    const source = await read(path);
    assert.ok(!/href[=:]\s*["'`]?\/services\//.test(source), `${path} still links to /services/`);
  }
});

test("the hubs and the footer read the collection and drop drafts in production", async () => {
  for (const path of ["src/pages/therapy/index.astro", "src/pages/assessments.astro", "src/layouts/PlainLayout.astro"]) {
    const source = await read(path);
    assert.match(source, /getCollection\(\s*'services'/, `${path} should read the services collection`);
    assert.match(source, /includeInBuild\(/, `${path} should filter drafts with includeInBuild`);
    assert.match(source, /isProductionSite\(Astro\.site\)/, `${path} should decide production from Astro.site`);
  }
});

test("the home page, the /therapy/ hub and the footer link the audience hubs from the collection", async () => {
  for (const path of ["src/pages/index.astro", "src/pages/therapy/index.astro", "src/layouts/PlainLayout.astro"]) {
    const source = await read(path);
    assert.match(source, /hubLinks\(/, `${path} should link the audience hubs with hubLinks`);
    assert.match(source, /includeInBuild\(/, `${path} should keep draft hubs off production`);
  }
  const route = await read("src/pages/[hub].astro");
  assert.match(route, /kind === 'hub'/);
  assert.match(route, /includeInBuild\(/);
});
