import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { buildSite } from "../tools/build-site.mjs";
import { HOUSE_FACTS_ID } from "../src/lib/house-facts.js";

/**
 * Issue #95: "Show on the live website". Staff switch a team member, or one
 * item inside a page (a fee row, an assessment package, a group program, a
 * home route card), off with `draft: true`. It must then be absent from the
 * production build and still present on the Preview, where the clinic
 * reviews it.
 *
 * Nothing in the content is switched off today, so this test switches things
 * off for the length of two builds: it edits the content files, builds the
 * Preview and production, and puts every file back before checking anything.
 * The helper itself, and the house's own copies of the lists, are checked
 * without a build in tests/drafts.test.mjs.
 *
 * Laura Storey stands in for a drafted team member because she is a real
 * entry the house, an article byline and the redirect map all name.
 */

const root = new URL("../", import.meta.url);
const file = (path) => new URL(path, root);

const FEE = "Fixture fee switched off";
const SERVICE_FEE = "Fixture service fee switched off";
const PACKAGE = "Fixture package switched off";
const PROGRAM = "Fixture program switched off";
const ROUTE = "Fixture route switched off";
const PERSON = { id: "laura-storey", name: "Laura Storey" };
const ARTICLE = "how-to-have-a-loving-relationship-with-your-body";
const SERVICE = "group-therapy/circle-of-security-parenting-program";

/** [content file, text to find once, text to put after it]. */
const EDITS = [
  ["src/content/team/laura-storey.md", "\nkind: practitioner\n", "draft: true\n"],
  ["src/content/pages/fees.md", "\nfees:\n", `  - label: ${FEE}\n    amount: $987\n    draft: true\n`],
  [
    "src/content/pages/assessments.md",
    "\npackages:\n",
    `  - title: ${PACKAGE}\n    price: from $987\n    description: A package that is switched off.\n    draft: true\n`,
  ],
  [
    "src/content/pages/group-therapy.md",
    "\nprograms:\n",
    `  - title: ${PROGRAM}\n    audience: Children aged 7–12\n    description: A program that is switched off.\n    draft: true\n`,
  ],
  [
    "src/content/pages/home.md",
    "\nroutes:\n",
    `  - title: ${ROUTE}\n    description: A route card that is switched off.\n    href: /fees/\n    linkText: Fixture route link\n` +
      `    image: /assets/rooms/consulting-room-out-360.webp\n    draft: true\n`,
  ],
  [
    "src/content/services/circle-of-security.md",
    "\nfees:\n",
    `  - label: ${SERVICE_FEE}\n    amount: $987\n    draft: true\n`,
  ],
  ["src/content/services/circle-of-security.md", "\nformats: [in-room]\n", `clinicians: [${PERSON.id}]\n`],
];

const originals = new Map();
function restore() {
  for (const [path, text] of originals) writeFileSync(file(path), text);
}

function switchOff() {
  for (const [path, anchor, insert] of EDITS) {
    if (!originals.has(path)) originals.set(path, readFileSync(file(path), "utf8"));
    const text = readFileSync(file(path), "utf8").replace(/\r\n/g, "\n");
    assert.equal(text.split(anchor).length, 2, `${path}: expected "${anchor.trim()}" exactly once`);
    writeFileSync(file(path), text.replace(anchor, anchor + insert));
  }
}

let preview;
let production;

before(() => {
  // A test killed mid-build must not leave the content switched off.
  process.once("exit", restore);
  try {
    switchOff();
    preview = buildSite("preview");
    production = buildSite("production");
  } finally {
    restore();
  }
});

after(() => {
  for (const dir of [preview, production]) if (dir) rmSync(dir, { recursive: true, force: true });
});

const page = (dist, path) => readFileSync(join(dist, path, "index.html"), "utf8");
const built = (dist, path) => existsSync(join(dist, path, "index.html"));
const houseFactsIn = (dist) =>
  JSON.parse(
    page(dist, "house").match(
      new RegExp(`<script type="application/json" id="${HOUSE_FACTS_ID}">([\\s\\S]*?)</script>`)
    )[1]
  );

test("the content files are back as they were", () => {
  for (const [path, text] of originals) assert.equal(readFileSync(file(path), "utf8"), text, path);
});

test("a switched-off team member has a marked page on the Preview and none in production", () => {
  assert.ok(built(preview, `team/${PERSON.id}`));
  assert.match(page(preview, `team/${PERSON.id}`), /Draft for review\. This page is not on the clinic's website\./);
  assert.ok(!built(production, `team/${PERSON.id}`), "production built the switched-off team member's page");
  // Everyone else is still there.
  assert.ok(built(production, "team/rani-banks"));
});

test("a switched-off team member is left off the team page and the telehealth page in production", () => {
  for (const path of ["team", "telehealth"]) {
    assert.ok(page(preview, path).includes(`/team/${PERSON.id}/`), `the Preview /${path}/ lost them`);
    assert.ok(!page(production, path).includes(`/team/${PERSON.id}/`), `production /${path}/ still links them`);
  }
});

test("a service naming a switched-off clinician still builds in production, without them", () => {
  assert.ok(page(preview, SERVICE).includes(`/team/${PERSON.id}/`), "the Preview service page lost the clinician");
  const html = page(production, SERVICE);
  assert.ok(!html.includes(`/team/${PERSON.id}/`), "production still shows the clinician");
  assert.ok(!html.includes(PERSON.name));
});

test("an article by a switched-off team member drops the byline in production", () => {
  assert.ok(page(preview, `library/${ARTICLE}`).includes(`/team/${PERSON.id}/`));
  const html = page(production, `library/${ARTICLE}`);
  assert.ok(!html.includes(`/team/${PERSON.id}/`), "production article still links the author");
  const jsonLd = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  assert.ok(jsonLd.some((s) => s.includes("BlogPosting")), "no BlogPosting structured data");
  assert.ok(!jsonLd.join("").includes(PERSON.name), "production structured data still names the author");
});

test("a switched-off team member is left out of the sitemap on both builds", () => {
  for (const dist of [preview, production]) {
    const sitemap = readFileSync(join(dist, "sitemap-0.xml"), "utf8");
    assert.ok(!sitemap.includes(`/team/${PERSON.id}/`));
    assert.ok(sitemap.includes("/team/rani-banks/"));
  }
});

test("a switched-off fee row is on the Preview /fees/ and absent in production, structured data included", () => {
  assert.ok(page(preview, "fees").includes(FEE));
  assert.ok(!page(production, "fees").includes(FEE));
  assert.ok(!page(production, "fees").includes("$987"), "the production price range or offers still count it");
});

test("a switched-off fee row on a service page is on the Preview only", () => {
  assert.ok(page(preview, SERVICE).includes(SERVICE_FEE));
  assert.ok(!page(production, SERVICE).includes(SERVICE_FEE));
});

test("a switched-off assessment package is on the Preview only, on /assessments/ and /fees/", () => {
  for (const path of ["assessments", "fees"]) {
    assert.ok(page(preview, path).includes(PACKAGE), `the Preview /${path}/ lost it`);
    assert.ok(!page(production, path).includes(PACKAGE), `production /${path}/ still shows it`);
  }
});

test("a switched-off group program is on the Preview only", () => {
  assert.ok(page(preview, "group-therapy").includes(PROGRAM));
  assert.ok(!page(production, "group-therapy").includes(PROGRAM));
});

test("a switched-off home route card is on the Preview only", () => {
  assert.ok(page(preview, "").includes(ROUTE));
  assert.ok(!page(production, "").includes(ROUTE));
});

test("the house is told what production switches off, and quotes no switched-off price", () => {
  const previewFacts = houseFactsIn(preview);
  const productionFacts = houseFactsIn(production);
  assert.equal(previewFacts.hidden, undefined, "the Preview hides nothing");
  assert.deepEqual(productionFacts.hidden, { team: [PERSON.id], titles: [PACKAGE, PROGRAM] });

  const feeTitles = (facts) => facts.fees.map((f) => f.title);
  assert.ok(feeTitles(previewFacts).includes(FEE));
  assert.ok(!feeTitles(productionFacts).includes(FEE));
  assert.ok(PACKAGE in previewFacts.packagePrices);
  assert.ok(!(PACKAGE in productionFacts.packagePrices));
});
