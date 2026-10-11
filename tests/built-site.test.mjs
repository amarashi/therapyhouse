import assert from "node:assert/strict";
import { before, after, test } from "node:test";

import { buildPages, cleanUp, schemaTypes, textOf } from "./helpers/built-site.mjs";
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

/* ---- Structured data (issue #34) ---- */

const businessOn = (page) => page.jsonLd.find((node) => node["@type"] === "MedicalBusiness");

test("the home page carries the full MedicalBusiness record", () => {
  const home = preview.get("/");
  assert.ok(schemaTypes(home).includes("MedicalBusiness"));
  const business = businessOn(home);
  assert.equal(business["@id"], "https://www.therapyhouse.com.au/#business");
  assert.equal(typeof business.geo.latitude, "number");
  assert.equal(typeof business.geo.longitude, "number");
  assert.equal(business.hasMap, "https://maps.google.com/?cid=9321164461524476520");
  assert.ok(business.sameAs.includes("https://www.facebook.com/Therapyhousethegap/"));
  for (const key of ["image", "logo", "priceRange", "areaServed", "availableService"]) {
    assert.ok(business[key], `MedicalBusiness is missing ${key}`);
  }
  assert.deepEqual(
    business.areaServed.map((a) => a.name),
    ["Brisbane", "Australia"]
  );
  assert.equal(business.openingHoursSpecification, undefined, "no hours until the clinic supplies them");
});

test("a service page carries its Service and the clinic it points to", () => {
  const [path, page] = [...preview].find(([p]) => /^\/(therapy|assessments)\/[^/]+\/$/.test(p));
  const types = schemaTypes(page);
  assert.ok(types.includes("Service"), `${path} has no Service`);
  assert.ok(types.includes("MedicalBusiness"), `${path} has no MedicalBusiness`);
});

test("a practitioner page carries a Person tied to the clinic by its id", () => {
  const page = preview.get("/team/kaya-beinke/");
  const person = page.jsonLd.find((node) => node["@type"] === "Person");
  assert.ok(person);
  assert.equal(person.name, "Dr Kaya Beinke");
  assert.ok(person.jobTitle);
  assert.ok(person.image);
  assert.deepEqual(person.worksFor, { "@id": "https://www.therapyhouse.com.au/#business" });
  assert.equal(person.hasOccupation.name, "Clinical Psychologist");
  assert.equal(person.identifier, undefined, "no AHPRA number until the clinic supplies it");
});

test("the 404 page has no canonical tag and no business structured data", () => {
  const notFound = preview.get("/404.html");
  assert.equal(notFound.canonical, undefined);
  assert.ok(!schemaTypes(notFound).includes("MedicalBusiness"));
});

/* ---- Analytics (issue #35) ---- */

test("no Preview page loads Google Analytics", () => {
  for (const [path, page] of preview) {
    assert.doesNotMatch(page.html, /googletagmanager|G-XZ6REXQCZ8|gtag\(/, `${path} carries the Analytics tag`);
  }
});
