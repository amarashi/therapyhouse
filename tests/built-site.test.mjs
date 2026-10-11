import assert from "node:assert/strict";
import { before, after, test } from "node:test";

import { buildPages, cleanUp, textOf } from "./helpers/built-site.mjs";
import { TITLE_MAX, DESCRIPTION_MAX } from "../src/lib/seo.js";
import { nearbySuburbs } from "../src/data/site.js";

/**
 * Checks on the built HTML of the Preview build (see the helper).
 */

let preview;

before(() => {
  preview = buildPages("preview");
});

after(cleanUp);

/** Real pages: a redirect stub has no title or description of its own. */
const realPages = (pages) => [...pages].filter(([, p]) => !p.isRedirect);

test("every built page has a title under 60 characters, and no two share one", () => {
  const seen = new Map();
  for (const [path, page] of realPages(preview)) {
    assert.ok(page.title, `${path} has no <title>`);
    assert.ok(
      page.title.length <= TITLE_MAX,
      `${path} title is ${page.title.length} characters: "${page.title}"`
    );
    assert.ok(!seen.has(page.title), `${path} and ${seen.get(page.title)} share the title "${page.title}"`);
    seen.set(page.title, path);
  }
  assert.ok(seen.size > 10, "expected the whole site to be checked");
});

test("every built page has a description under 160 characters, and no two share one", () => {
  const seen = new Map();
  for (const [path, page] of realPages(preview)) {
    assert.ok(page.description, `${path} has no meta description`);
    assert.ok(
      page.description.length <= DESCRIPTION_MAX,
      `${path} description is ${page.description.length} characters: "${page.description}"`
    );
    assert.ok(!seen.has(page.description), `${path} and ${seen.get(page.description)} share a description`);
    seen.set(page.description, path);
  }
});

test("the home page says psychologist and The Gap in its title and its heading", () => {
  const home = preview.get("/");
  assert.equal(home.title, "Psychologist The Gap, Brisbane | Therapy House");
  assert.match(home.h1, /psychologist/i);
  assert.match(home.h1, /The Gap/);
  for (const word of ["children", "adults", "couples", "assessments", "video"]) {
    assert.match(home.description, new RegExp(word, "i"), `home description should name ${word}`);
  }
});

test("the home and contact pages name The Gap and the neighbouring suburbs in plain text", () => {
  for (const path of ["/", "/contact/"]) {
    const text = textOf(preview.get(path));
    for (const suburb of ["The Gap", ...nearbySuburbs]) {
      assert.ok(text.includes(suburb), `${path} should name ${suburb}`);
    }
  }
});

test("practitioner pages are titled with the person's name and profession", () => {
  const kaya = preview.get("/team/kaya-beinke/");
  assert.match(kaya.title, /^Dr Kaya Beinke, Clinical Psychologist \| Therapy House/);
  const jazmin = preview.get("/team/jazmin-squire/");
  assert.equal(jazmin.title, "Jazmin Squire, Psychologist | Therapy House, The Gap");
});
