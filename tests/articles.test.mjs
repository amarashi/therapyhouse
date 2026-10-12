import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";

import { articleDocumentTitle, articlePath, articleSchema, groupByYear, sortArticles } from "../src/lib/articles.js";
import { buildPages, cleanUp } from "./helpers/built-site.mjs";
import { splitMarkdown } from "./helpers/markdown.mjs";
import { parseRedirectsDoc } from "../src/lib/redirects.js";

/**
 * The library (issue #39): the 25 posts from the Current Site, each at
 * /library/<slug>/, and no link anywhere on the new site still pointing at a
 * page of the Current Site.
 */

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const list = (path) => readdirSync(new URL(path, root));

/* Front matter is parsed (tests/helpers/markdown.mjs): staff create and save
   articles in Pages CMS, which writes it in its own style. */
const articles = list("src/content/articles/")
  .filter((file) => file.endsWith(".md"))
  .map((file) => ({ id: file.replace(/\.md$/, ""), ...splitMarkdown(read(`src/content/articles/${file}`)) }));

const CURRENT_SITE_PATH = /https?:\/\/(?:www\.)?therapyhouse\.com\.au\/[^\s"'()<>]+/g;

test("all 25 Current Site posts are migrated and not drafts", () => {
  const migrated = articles.filter((a) => a.data.sourceUrl);
  assert.equal(migrated.length, 25);
  for (const article of migrated) {
    assert.notEqual(article.data.draft, true, `${article.id} is a draft`);
    // The slug is the Current Site's final path segment.
    assert.equal(new URL(article.data.sourceUrl).pathname.split("/").filter(Boolean).at(-1), article.id);
  }
});

test("every article has a unique title and a unique description under 160 characters", () => {
  const titles = new Set();
  const descriptions = new Set();
  for (const { id, data } of articles) {
    assert.ok(data.title, `${id} has no title`);
    assert.ok(data.description, `${id} has no description`);
    assert.ok(data.description.length < 160, `${id} description is ${data.description.length} characters`);
    assert.ok(!titles.has(data.title), `duplicate title: ${data.title}`);
    assert.ok(!descriptions.has(data.description), `duplicate description in ${id}`);
    titles.add(data.title);
    descriptions.add(data.description);
  }
});

test("no article body links to a page of the Current Site", () => {
  for (const { id, body } of articles) {
    assert.deepEqual(body.match(CURRENT_SITE_PATH) ?? [], [], `${id} still links to the Current Site`);
  }
});

test("every image in an article exists, has alt text and is under 300 KB", () => {
  for (const { id, data, body } of articles) {
    const images = [...body.matchAll(/!\[([^\]]*)\]\(([^)\s]+)\)/g)].map(([, alt, src]) => ({ alt, src }));
    if (data.image) images.push({ alt: data.imageAlt, src: data.image });
    for (const { alt, src } of images) {
      assert.ok(src.startsWith("/assets/library/"), `${id}: ${src} is not a local library image`);
      assert.ok(alt && alt.trim(), `${id}: ${src} has no alt text`);
      const file = new URL(`public${src}`, root);
      assert.ok(existsSync(file), `${id}: ${src} is missing`);
      assert.ok(statSync(file).size < 300_000, `${id}: ${src} is over 300 KB`);
    }
  }
});

test("every old article address has a redirect to its library page", () => {
  const rules = parseRedirectsDoc(read("docs/redirects.md"));
  for (const { data } of articles.filter((a) => a.data.sourceUrl)) {
    const from = new URL(data.sourceUrl).pathname;
    assert.ok(rules.some((r) => r.from === from && r.status === 301), `no redirect line for ${from}`);
  }
});

/* Every address the new site has: its static pages, service pages, team profiles and articles. */
const { collection } = await import("./helpers/house-content.mjs");
const { servicePath } = await import("../src/lib/services.js");
const routes = new Set([
  ...collection("services").map((e) => servicePath(e.data.kind, e.id, e.data.path)),
  "/",
  ...list("src/pages/")
    .filter((f) => f.endsWith(".astro") && !["index.astro", "404.astro"].includes(f))
    .map((f) => `/${f.replace(/\.astro$/, "")}/`),
  ...list("src/pages/").filter((f) => existsSync(new URL(`src/pages/${f}/index.astro`, root))).map((f) => `/${f}/`),
  ...list("src/content/team/").map((f) => `/team/${f.replace(/\.md$/, "")}/`),
  ...articles.map((a) => articlePath(a.id)),
]);

test("the house content has no Current Site links, and every internal link resolves", async () => {
  const source = read("public/assets/scripts/content-data.js");
  const leftovers = (source.match(CURRENT_SITE_PATH) ?? []).filter((url) => url !== "https://www.therapyhouse.com.au/");
  assert.deepEqual(leftovers, []);

  // What the signs open, as /house/ builds it (src/lib/house-content.js), and
  // the rooms' own records of the pages they stand for.
  const { builtHouseContent } = await import("./helpers/house-content.mjs");
  const { siteContent } = await import("../public/assets/scripts/content-data.js");
  const built = builtHouseContent();
  const links = [];
  const walk = (value, key) => {
    if (typeof value === "string" && ["href", "sourceUrl", "sourceUrls"].includes(key)) links.push(value);
    else if (Array.isArray(value)) value.forEach((v) => walk(v, key));
    else if (value && typeof value === "object") Object.entries(value).forEach(([k, v]) => walk(v, k));
  };
  walk(built);
  walk(siteContent.rooms);
  // Under node there is no asset base: the built links are root paths and the
  // rooms' records bare relative ones.
  const internal = links.filter((url) => !/^[a-z]+:/.test(url)).map((url) => (url.startsWith("/") ? url : `/${url}`));
  assert.ok(internal.length >= 60, `expected the house's links, found ${internal.length}`);
  for (const url of internal) {
    assert.ok(routes.has(url), `the house links to ${url}, which is not a page`);
  }
});

test("the library lists articles newest first, grouped by year", () => {
  const entry = (id, date) => ({ id, data: { title: id, date: new Date(date) } });
  const sorted = sortArticles([entry("a", "2023-01-10"), entry("b", "2025-10-14"), entry("c", "2025-01-28")]);
  assert.deepEqual(sorted.map((e) => e.id), ["b", "c", "a"]);
  const years = groupByYear([entry("a", "2023-01-10"), entry("b", "2025-10-14"), entry("c", "2025-01-28")]);
  assert.deepEqual(years.map((y) => [y.year, y.items.length]), [["2025", 2], ["2023", 1]]);
});

test("BlogPosting names the author when there is one, otherwise the clinic", () => {
  const data = { title: "Conflict", description: "d", date: new Date("2024-11-11"), updated: new Date("2026-09-25"), category: "Therapy" };
  const url = "https://www.therapyhouse.com.au/library/conflict/";
  const origin = "https://www.therapyhouse.com.au";
  const withAuthor = articleSchema(data, { url, origin, author: { name: "Dr Amelia Shay", url: `${origin}/team/amelia-shay/` } });
  assert.equal(withAuthor["@type"], "BlogPosting");
  assert.equal(withAuthor.datePublished, "2024-11-11");
  assert.equal(withAuthor.dateModified, "2026-09-25");
  assert.equal(withAuthor.author.name, "Dr Amelia Shay");
  assert.equal(withAuthor.publisher["@id"], `${origin}/#business`);
  const noAuthor = articleSchema(data, { url, origin });
  assert.deepEqual(noAuthor.author, { "@id": `${origin}/#business` });
});

test("an article's document title fits a search result", () => {
  assert.equal(articleDocumentTitle("conflict", { title: "Conflict" }), "Conflict | Therapy House");
  const long = "Practicing Self-Compassion to Manage Uncomfortable Emotions";
  assert.equal(articleDocumentTitle("x", { title: long }), long);
  assert.throws(() => articleDocumentTitle("x", { title: "x".repeat(61) }), /documentTitle/);
  for (const { id, data } of articles) {
    assert.ok(articleDocumentTitle(id, data).length <= 60, `${id} title is too long`);
  }
});

/* The built Preview (the helper builds into a temporary folder). */
let preview;
before(() => {
  preview = buildPages("preview");
});
after(cleanUp);

test("the build has a page for every article and no link to a Current Site page", () => {
  for (const { id, data } of articles.filter((a) => !a.data.draft)) {
    const page = preview.get(`/library/${id}/`);
    assert.ok(page, `no built page for ${id}`);
    assert.equal(page.h1, data.title.replace(/\s+/g, " "));
    assert.ok(page.jsonLd.some((node) => node["@type"] === "BlogPosting"), `${id} has no BlogPosting`);
  }
  for (const [path, page] of preview) {
    const hrefs = [...page.html.matchAll(/\b(?:href|src)="(https?:\/\/(?:www\.)?therapyhouse\.com\.au\/[^"]+)"/g)].map((m) => m[1]);
    assert.deepEqual(hrefs, [], `${path} links to the Current Site`);
  }
});

test("the library page links to every article", () => {
  const library = preview.get("/library/");
  for (const { id } of articles.filter((a) => !a.data.draft)) {
    assert.ok(library.html.includes(`href="/therapyhouse/library/${id}/"`), `/library/ does not link to ${id}`);
  }
});
