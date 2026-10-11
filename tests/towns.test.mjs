import assert from "node:assert/strict";
import test from "node:test";
import { readFile, readdir } from "node:fs/promises";

import { MIN_TOWN_FACTS, assertTownPage, sharedShare, splitTowns, townPath } from "../src/lib/towns.js";
import { frontmatter } from "./helpers/markdown.mjs";

/**
 * The Telehealth Room and the regional towns (issues #25 to #29). A town gets
 * a page only with three sourced facts about it; the rest are sections of
 * /telehealth/. These checks guard that rule and the sources behind it.
 */

const townsDir = new URL("../src/content/towns/", import.meta.url);

const readTowns = async () => {
  const files = (await readdir(townsDir)).filter((f) => f.endsWith(".md"));
  return Promise.all(
    files.map(async (file) => ({ id: file.replace(/\.md$/, ""), text: await readFile(new URL(file, townsDir), "utf8") }))
  );
};

// Parsed, not matched as text: Pages CMS re-wraps front matter when staff save.
const factCount = (text) => (frontmatter(text).facts ?? []).length;
const field = (text, name) => frontmatter(text)[name];

test("a town needs three sourced facts before it may have a page", () => {
  const facts = [{ text: "a", sourceName: "s", sourceUrl: "https://example.org" }];
  const page = { kind: "page", title: "t", h1: "h", description: "d", lede: "l" };
  assert.throws(() => assertTownPage("x", { ...page, facts }), /needs at least 3/);
  assert.doesNotThrow(() => assertTownPage("x", { ...page, facts: [facts[0], facts[0], facts[0]] }));
  assert.doesNotThrow(() => assertTownPage("x", { kind: "section", facts }));
  assert.equal(MIN_TOWN_FACTS, 3);
});

test("towns split into pages and sections, in order", () => {
  const e = (id, kind, order) => ({ id, data: { kind, order } });
  const { pages, sections } = splitTowns([e("b", "section", 6), e("a", "page", 1), e("c", "section", 5)]);
  assert.deepEqual(pages.map((p) => p.id), ["a"]);
  assert.deepEqual(sections.map((p) => p.id), ["c", "b"]);
  assert.equal(townPath("cairns"), "/telehealth/cairns/");
});

test("shared text is measured in runs of words, ignoring case and punctuation", () => {
  const a = "one two three four five six seven eight nine ten";
  assert.equal(sharedShare(a, a), 1);
  assert.equal(sharedShare(a, "something else entirely, with nothing in common at all here"), 0);
  assert.equal(sharedShare(a, a.toUpperCase().replace(/ /g, ", ")), 1);
  assert.equal(sharedShare("too short", "too short"), 0);
});

test("the four section towns are on /telehealth/, each with a sourced fact", async () => {
  const towns = await readTowns();
  for (const name of ["mackay", "bundaberg", "gladstone", "mount-isa"]) {
    const town = towns.find((t) => t.id === name);
    assert.ok(town, `src/content/towns/${name}.md is missing`);
    assert.equal(field(town.text, "kind"), "section");
    assert.ok(factCount(town.text) >= 1, `${name} has no sourced fact`);
  }
});

test("every town fact names a source URL", async () => {
  for (const town of await readTowns()) {
    const facts = factCount(town.text);
    const urls = (frontmatter(town.text).facts ?? []).filter((f) => /^https?:\/\/\S+$/.test(f.sourceUrl ?? "")).length;
    assert.equal(urls, facts, `${town.id}: every fact needs a sourceUrl`);
  }
});

test("telehealth page title and description fit a search result and carry its phrases", async () => {
  const page = await readFile(new URL("../src/content/pages/telehealth.md", import.meta.url), "utf8");
  // Staff reword the heading and description in the CMS; what the issue asks
  // for is the length a search result shows and the phrases below.
  const title = field(page, "documentTitle");
  const description = field(page, "description");
  assert.match(title, /online psychologist/i);
  assert.ok(field(page, "title")?.trim(), "telehealth: no heading");
  assert.ok(title.length < 60);
  assert.ok(description?.trim() && description.length < 160, "telehealth: the description must be under 160 characters");
  assert.match(description, /Australia/, 'telehealth: the description must say "Australia"');

  const body = page.split(/^---$/m)[2];
  const first = body.trim().split(/\n\s*\n/)[0].replace(/\s+/g, " ");
  assert.match(first, /psychologist/i);
  assert.match(first, /video/);
  assert.match(first, /online psychologist/i);
});

test("telehealth is linked from the footer, the therapy hub and the home page", async () => {
  const { footerNav } = await import("../src/data/site.js");
  assert.ok(footerNav.some((item) => item.href === "/telehealth/"));
  const hub = await readFile(new URL("../src/pages/therapy/index.astro", import.meta.url), "utf8");
  assert.match(hub, /withBase\('\/telehealth\/'\)/);
  const home = await readFile(new URL("../src/content/pages/home.md", import.meta.url), "utf8");
  assert.match(home, /href: \/telehealth\//);
});
