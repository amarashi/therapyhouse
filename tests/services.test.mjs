import assert from "node:assert/strict";
import test from "node:test";
import { readdir, readFile } from "node:fs/promises";

import {
  assertFeesPublishable,
  businessId,
  includeInBuild,
  isProductionSite,
  missingIds,
  serviceSchema,
  servicePath,
} from "../src/lib/services.js";

/**
 * The service pages (issue #3) make statements about fees and about which
 * clinician treats what. These tests guard the rules that keep an unconfirmed
 * statement off the clinic's real domain.
 */

const servicesDir = new URL("../src/content/services/", import.meta.url);
const teamDir = new URL("../src/content/team/", import.meta.url);

test("the preview is GitHub Pages and anything else is production", () => {
  assert.equal(isProductionSite("https://amarashi.github.io"), false);
  assert.equal(isProductionSite(new URL("https://amarashi.github.io/therapyhouse/")), false);
  assert.equal(isProductionSite("https://www.therapyhouse.com.au"), true);
  // No site configured at all is a local build, never production.
  assert.equal(isProductionSite(undefined), false);
});

test("drafts build on the preview and never in production", () => {
  assert.equal(includeInBuild({ draft: true }, false), true);
  assert.equal(includeInBuild({ draft: true }, true), false);
  assert.equal(includeInBuild({ draft: false }, true), true);
});

test("unconfirmed fees stop a production build and nothing else", () => {
  const page = { id: "adult-adhd", feeStatus: "needs-confirmation", fees: [{ label: "Adult ADHD" }] };
  assert.throws(() => assertFeesPublishable(page, true), /adult-adhd.*Adult ADHD/);
  assert.doesNotThrow(() => assertFeesPublishable(page, false));
  assert.doesNotThrow(() => assertFeesPublishable({ ...page, feeStatus: "published" }, true));
  assert.doesNotThrow(() => assertFeesPublishable({ ...page, feeStatus: "quote" }, true));
});

test("a service lives at the address its kind gives it", () => {
  assert.equal(servicePath("therapy", "trauma"), "/therapy/trauma/");
  assert.equal(servicePath("assessment", "adult-adhd"), "/assessments/adult-adhd/");
  // Hubs get their own routes in issue #4; until then a link to one is a bug.
  assert.throws(() => servicePath("hub", "adults"));
});

test("missing clinician ids are reported by name", () => {
  assert.deepEqual(missingIds(["rani-banks", "nobody"], ["rani-banks", "amelia-shay"]), ["nobody"]);
  assert.deepEqual(missingIds(undefined, ["rani-banks"]), []);
});

test("a therapy page is a Service provided by the clinic", () => {
  const origin = "https://www.therapyhouse.com.au";
  const url = `${origin}/therapy/trauma/`;
  const schema = serviceSchema(
    { kind: "therapy", h1: "Trauma", description: "d", formats: ["in-room"] },
    { url, origin }
  );
  assert.equal(schema["@graph"].length, 1);
  const [service] = schema["@graph"];
  assert.equal(service["@type"], "Service");
  assert.deepEqual(service.provider, { "@id": businessId(origin) });
  // In-room only: Brisbane, and no claim to serve the whole state.
  assert.deepEqual(service.areaServed.map((a) => a.name), ["Brisbane"]);
});

test("video widens the area served to Queensland", () => {
  const origin = "https://www.therapyhouse.com.au";
  const schema = serviceSchema(
    { kind: "therapy", h1: "Trauma", description: "d", formats: ["in-room", "video"] },
    { url: `${origin}/therapy/trauma/`, origin }
  );
  assert.deepEqual(schema["@graph"][0].areaServed.map((a) => a.name), ["Brisbane", "Queensland"]);
});

test("an assessment adds a MedicalTest naming what it diagnoses", () => {
  const origin = "https://www.therapyhouse.com.au";
  const schema = serviceSchema(
    { kind: "assessment", h1: "Adult ADHD assessment", description: "d", diagnoses: ["ADHD"] },
    { url: `${origin}/assessments/adult-adhd/`, origin }
  );
  const test = schema["@graph"].find((n) => n["@type"] === "MedicalTest");
  assert.ok(test, "no MedicalTest node");
  assert.deepEqual(test.usedToDiagnose, [{ "@type": "MedicalCondition", name: "ADHD" }]);
});

test("the business id the pages point at is the one the layout publishes", async () => {
  /* The layout and the house page publish the record businessSchema builds
     (src/lib/structured-data.js); tests/built-site.test.mjs checks the built
     page carries the same id. */
  const { businessSchema } = await import("../src/lib/structured-data.js");
  const { site: realSite, contact, businessFacts } = await import("../src/data/site.js");
  const record = businessSchema({ site: realSite, contact, facts: businessFacts, siteUrl: realSite.origin });
  assert.equal(record["@id"], businessId(realSite.origin), "the business record lost its @id");
  assert.equal(businessId("https://www.therapyhouse.com.au/"), "https://www.therapyhouse.com.au/#business");
});

/* Read as text, like the other content tests: the project has no YAML parser,
   and a list of slugs is simple enough to pull out with a pattern. Accepts both
   `clinicians: [a, b]` and a block list. */
function cliniciansIn(markdown) {
  const front = markdown.split(/^---$/m)[1] ?? "";
  const inline = front.match(/^clinicians:\s*\[(.*)\]\s*$/m);
  if (inline) return inline[1].split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
  const block = front.match(/^clinicians:\s*\n((?:\s+-\s+.+\n?)+)/m);
  if (!block) return [];
  return block[1].split("\n").map((l) => l.replace(/^\s+-\s+/, "").trim().replace(/^["']|["']$/g, "")).filter(Boolean);
}

test("every clinician named on a service page is on the team", async () => {
  const team = (await readdir(teamDir)).filter((f) => f.endsWith(".md")).map((f) => f.slice(0, -3));
  const files = (await readdir(servicesDir)).filter((f) => f.endsWith(".md"));
  assert.ok(files.length > 0, "no service files found");

  for (const file of files) {
    const text = await readFile(new URL(file, servicesDir), "utf8");
    const unknown = missingIds(cliniciansIn(text), team);
    assert.deepEqual(unknown, [], `${file} names clinicians not on the team: ${unknown.join(", ")}`);
  }
});

test("the fixtures are drafts, so they can never reach the clinic's domain", async () => {
  // A fixture is deleted once a real page of its kind lands, so check the ones
  // that are still here rather than a fixed list.
  const files = (await readdir(servicesDir)).filter((f) => /^example-.*\.md$/.test(f));
  for (const file of files) {
    const text = await readFile(new URL(file, servicesDir), "utf8");
    assert.match(text, /^draft: true$/m, `${file} must stay a draft`);
  }
});
