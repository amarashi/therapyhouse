import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { buildSite } from "../tools/build-site.mjs";
import { stringify } from "yaml";
import { HOUSE_CONTENT_ID } from "../src/lib/house-content.js";
import { splitMarkdown } from "./helpers/markdown.mjs";

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

/**
 * Content file → a change to its front matter. The front matter is parsed and
 * written back as YAML, so the edits work however the file is laid out (staff
 * save these files through Pages CMS, which re-wraps them).
 */
const EDITS = {
  "src/content/team/laura-storey.md": (data) => {
    data.draft = true;
  },
  "src/content/pages/fees.md": (data) => {
    data.fees.unshift({ label: FEE, amount: "$987", draft: true });
  },
  "src/content/pages/assessments.md": (data) => {
    data.packages.unshift({
      id: "fixturePackage",
      title: PACKAGE,
      price: "from $987",
      description: "A package that is switched off.",
      draft: true,
    });
  },
  "src/content/pages/group-therapy.md": (data) => {
    data.programs.unshift({
      id: "fixtureProgram",
      title: PROGRAM,
      audience: "Children aged 7–12",
      description: "A program that is switched off.",
      draft: true,
    });
  },
  "src/content/pages/home.md": (data) => {
    data.routes.unshift({
      title: ROUTE,
      description: "A route card that is switched off.",
      href: "/fees/",
      linkText: "Fixture route link",
      image: "/assets/rooms/consulting-room-out-360.webp",
      draft: true,
    });
  },
  "src/content/services/circle-of-security.md": (data) => {
    data.fees.unshift({ label: SERVICE_FEE, amount: "$987", draft: true });
    assert.ok(!data.clinicians?.length, "circle-of-security.md names clinicians; pick another fixture service");
    data.clinicians = [PERSON.id];
  },
};

const originals = new Map();
function restore() {
  for (const [path, text] of originals) writeFileSync(file(path), text);
}

function switchOff() {
  for (const [path, edit] of Object.entries(EDITS)) {
    const text = readFileSync(file(path), "utf8");
    originals.set(path, text);
    const { data, body } = splitMarkdown(text);
    edit(data);
    writeFileSync(file(path), `---\n${stringify(data)}---\n${body}`);
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
const houseContentIn = (dist) =>
  JSON.parse(
    page(dist, "house").match(
      new RegExp(`<script type="application/json" id="${HOUSE_CONTENT_ID}">([\\s\\S]*?)</script>`)
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

test("the house leaves out what production switches off, and quotes no switched-off price", () => {
  // /house/ builds its previews from what the build shows, so a switched-off
  // person, fee, package or program is simply not in production's previews.
  const previewHouse = houseContentIn(preview);
  const productionHouse = houseContentIn(production);
  const ids = (house) => house.team.map((member) => member.id);
  assert.ok(ids(previewHouse).includes(PERSON.id));
  assert.ok(!ids(productionHouse).includes(PERSON.id));

  const feeTitles = (house) => house.previews["services.fees"].items.map((item) => item.title);
  assert.ok(feeTitles(previewHouse).includes(FEE));
  assert.ok(!feeTitles(productionHouse).includes(FEE));
  assert.ok("assessments.packages.fixturePackage" in previewHouse.previews);
  assert.ok(!("assessments.packages.fixturePackage" in productionHouse.previews));
  assert.ok("groups.programs.fixtureProgram" in previewHouse.previews);
  assert.ok(!("groups.programs.fixtureProgram" in productionHouse.previews));
});

