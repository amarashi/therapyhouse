import assert from "node:assert/strict";
import { before, after, test } from "node:test";

import { buildPages, cleanUp, textOf, schemaTypes } from "./helpers/built-site.mjs";
import { sharedShare } from "../src/lib/towns.js";

/**
 * Town Pages (issues #26 to #29), checked on the built Preview.
 *
 * The doorway rule: no Town Page may share more than a third of its body text
 * with another. Body text is everything in <main> before the site's closing
 * "Talk to us" block, which every page carries. Shared text is measured in
 * runs of eight words, in both directions for every pair of Town Pages.
 */

const MAX_SHARED = 1 / 3;

/** Title, H1 and description each Town Page must carry (from its issue). */
const EXPECTED = {
  toowoomba: {
    title: "Psychologist Toowoomba by Video | Therapy House",
    h1: "A psychologist for Toowoomba, by video",
  },
  townsville: {
    title: "Psychologist Townsville by Video | Therapy House",
    h1: "A psychologist for Townsville, by video",
  },
  cairns: {
    title: "Psychologist Cairns by Video | Therapy House",
    h1: "A psychologist for Cairns, by video",
  },
  rockhampton: {
    title: "Psychologist Rockhampton by Video | Therapy House",
    h1: "A psychologist for Rockhampton, by video",
  },
};

let pages;
let telehealthHtml = "";

before(() => {
  const all = buildPages("preview");
  telehealthHtml = all.get("/telehealth/")?.html ?? "";
  pages = new Map(
    [...all].filter(([path, page]) => /^\/telehealth\/[^/]+\/$/.test(path) && !page.isRedirect)
  );
});

after(cleanUp);

const townOf = (path) => path.split("/")[2];

const bodyText = (page) => {
  const main = page.html.slice(page.html.indexOf("<main"), page.html.indexOf("</main>"));
  const body = main.split('<section class="wrap closing"')[0];
  return textOf({ html: body });
};

test("at least one Town Page is built", () => {
  assert.ok(pages.size >= 1, "no pages under /telehealth/<town>/");
});

test("each Town Page has its issue's title, H1 and description", () => {
  for (const [path, page] of pages) {
    const town = townOf(path);
    const expected = EXPECTED[town];
    assert.ok(expected, `${path} is not one of the agreed Town Pages`);
    assert.equal(page.title, expected.title);
    assert.equal(page.h1, expected.h1);
    assert.equal((page.html.match(/<h1[\s>]/g) ?? []).length, 1, `${path} has more than one H1`);
    const name = expected.h1.match(/for (.+), by video/)[1];
    assert.equal(
      page.description,
      `Video sessions with Therapy House psychologists for people in ${name}: children, teens, adults and couples. Medicare rebates with a GP referral.`
    );
    assert.ok(page.title.length < 60 && page.description.length < 160);
  }
});

test("each Town Page names its town in the first paragraph and the GP referral section", () => {
  for (const [path, page] of pages) {
    const name = EXPECTED[townOf(path)].h1.match(/for (.+), by video/)[1];
    const body = bodyText(page);
    assert.ok(body.includes(`A GP referral in ${name}`), `${path} has no GP referral section naming ${name}`);
    const firstParagraph = page.html.match(/data-town-body[^>]*>\s*<p>([\s\S]*?)<\/p>/)?.[1] ?? "";
    assert.ok(firstParagraph.includes(name), `${path}: the first paragraph should name ${name}`);
    assert.match(firstParagraph, /psychologist/i);
  }
});

test("each Town Page links to the Telehealth Room and the fees page, and lists its sources", () => {
  for (const [path, page] of pages) {
    assert.match(page.html, /href="[^"]*\/telehealth\/"/, `${path} does not link to /telehealth/`);
    assert.match(page.html, /href="[^"]*\/fees\/"/, `${path} does not link to /fees/`);
    const sources = page.html.match(/<ul class="town-page__sources[^"]*"[^>]*>([\s\S]*?)<\/ul>/)?.[1] ?? "";
    assert.ok((sources.match(/<li/g) ?? []).length >= 3, `${path} lists fewer than three sourced facts`);
  }
});

test("each Town Page is a Service for its city, provided by the clinic", () => {
  for (const [path, page] of pages) {
    assert.ok(schemaTypes(page).includes("Service"), `${path} has no Service`);
    const service = page.jsonLd.find((node) => node["@type"] === "Service");
    assert.equal(service.areaServed["@type"], "City");
    assert.equal(service.areaServed.name, EXPECTED[townOf(path)].h1.match(/for (.+), by video/)[1]);
    assert.match(service.provider["@id"], /#business$/);
  }
});

test("no two Town Pages share more than a third of their body text", () => {
  const entries = [...pages].map(([path, page]) => [path, bodyText(page)]);
  for (const [pathA, textA] of entries) {
    for (const [pathB, textB] of entries) {
      if (pathA === pathB) continue;
      const share = sharedShare(textA, textB);
      assert.ok(
        share <= MAX_SHARED,
        `${pathA} shares ${(share * 100).toFixed(0)}% of its text with ${pathB} (limit 33%)`
      );
    }
  }
});

test("the Telehealth Room links to every Town Page", () => {
  for (const path of pages.keys()) {
    assert.ok(telehealthHtml.includes(`${path}"`), `/telehealth/ does not link to ${path}`);
  }
});

test("every Town Page is in the footer map", () => {
  const home = telehealthHtml;
  for (const path of pages.keys()) {
    const footer = home.slice(home.indexOf('<footer'));
    assert.ok(footer.includes(`${path}"`), `the footer does not link to ${path}`);
  }
});
