import assert from "node:assert/strict";
import test from "node:test";
import { readdir, readFile } from "node:fs/promises";

import {
  assertFeesPublishable,
  businessId,
  hubLinks,
  hubMembers,
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
  // Audience hubs sit at the site root (issues #5, #6).
  assert.equal(servicePath("hub", "adults"), "/adults/");
  assert.throws(() => servicePath("article", "x"));
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

/* ---- Audience hubs (issues #5, #6) ---- */

const svc = (id, data) => ({
  id,
  data: { h1: id, description: `About ${id}.`, kind: "therapy", audiences: ["adult"], ...data },
});

test("a hub lists the pages that share its audience, therapy before assessments", () => {
  const hub = svc("adults", { kind: "hub", audiences: ["adult", "telehealth"] });
  const groups = hubMembers(hub, [
    hub,
    svc("trauma"),
    svc("anxiety", { audiences: ["adult", "local-family"] }),
    svc("adult-adhd", { kind: "assessment" }),
    svc("child-adhd", { kind: "assessment", audiences: ["local-family"] }),
    // Shares only `telehealth`, which says how, not who: not listed.
    svc("telehealth-only", { audiences: ["telehealth"] }),
    svc("children", { kind: "hub", audiences: ["local-family", "adult"] }),
  ]);
  assert.deepEqual(groups.map((g) => g.key), ["therapy", "assessments"]);
  assert.deepEqual(groups[0].links.map((l) => l.id), ["anxiety", "trauma"]);
  assert.deepEqual(groups[1].links.map((l) => l.href), ["/assessments/adult-adhd/"]);
});

test("a hub with nothing to list has no empty headings", () => {
  const hub = svc("adults", { kind: "hub" });
  assert.deepEqual(hubMembers(hub, [hub]), []);
});

test("hub links are the hubs only, at the site root", () => {
  const links = hubLinks([svc("trauma"), svc("children", { kind: "hub" }), svc("adults", { kind: "hub" })]);
  assert.deepEqual(links.map((l) => l.href), ["/adults/", "/children/"]);
});

test("a hub's structured data lists the pages it links to", () => {
  const origin = "https://www.therapyhouse.com.au";
  const schema = serviceSchema(
    { kind: "hub", h1: "Therapy for adults", description: "d", formats: ["in-room", "video"] },
    { url: `${origin}/adults/`, origin, items: [{ name: "Trauma", url: `${origin}/therapy/trauma/` }] }
  );
  const list = schema["@graph"].find((n) => n["@type"] === "ItemList");
  assert.ok(list, "no ItemList node");
  assert.deepEqual(list.itemListElement, [
    { "@type": "ListItem", position: 1, name: "Trauma", url: `${origin}/therapy/trauma/` },
  ]);
  assert.equal(schema["@graph"][0]["@type"], "Service");
});

/* ---- Links written in Markdown bodies (rebased by src/lib/rehype-base-links.js) ---- */

const frontmatter = (text) => text.replace(/\r\n/g, "\n").split(/^---$/m)[1] ?? "";
const field = (front, name) => front.match(new RegExp(`^${name}:\s*(.+)$`, "m"))?.[1].trim().replace(/^["']|["']$/g, "");

/** Every address the site builds, read from the file system. */
async function knownPaths() {
  const pagesDir = new URL("../src/pages/", import.meta.url);
  const paths = new Set(["/"]);
  for (const entry of await readdir(pagesDir, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith(".astro") && !entry.name.startsWith("[")) {
      const name = entry.name.slice(0, -6);
      if (name !== "index" && name !== "404") paths.add(`/${name}/`);
    }
    if (entry.isDirectory()) {
      const inner = await readdir(new URL(`${entry.name}/`, pagesDir));
      if (inner.includes("index.astro")) paths.add(`/${entry.name}/`);
    }
  }
  const services = {};
  for (const file of (await readdir(servicesDir)).filter((f) => f.endsWith(".md"))) {
    const front = frontmatter(await readFile(new URL(file, servicesDir), "utf8"));
    const id = file.slice(0, -3);
    const path = servicePath(field(front, "kind"), id);
    services[path] = { draft: /^draft: true$/m.test(front), id };
    paths.add(path);
  }
  return { paths, services };
}

/**
 * Pages an open issue is building, with its number. A draft may link to one
 * before it lands, because a draft only shows on the Preview and both arrive
 * before launch; a published page may not, because the link would 404 on the
 * clinic's domain. Delete a line when its page is built.
 */
const PLANNED = {
  "/therapy/trauma/": 7,
  "/therapy/anxiety/": 8,
  "/therapy/depression/": 9,
  "/therapy/grief/": 10,
  "/therapy/couples/": 11,
  "/therapy/approaches/": 12,
  "/ndis/": 13,
  "/group-therapy/circle-of-security-parenting-program/": 14,
  "/therapy/family/": 16,
  "/assessments/adult-adhd/": 17,
  "/assessments/adult-autism/": 18,
  "/assessments/learning/": 21,
  "/assessments/cognitive/": 22,
  "/telehealth/": 25,
  "/fees/": 30,
};

test("every link in a service page's body leads to a page the site builds", async () => {
  const { paths, services } = await knownPaths();
  for (const file of (await readdir(servicesDir)).filter((f) => f.endsWith(".md"))) {
    const text = (await readFile(new URL(file, servicesDir), "utf8")).replace(/\r\n/g, "\n");
    const body = text.split(/^---$/m).slice(2).join("---");
    const isDraft = /^draft: true$/m.test(frontmatter(text));
    for (const [, href] of body.matchAll(/\]\((\/[^)\s#]*)(?:#[^)]*)?\)/g)) {
      const planned = isDraft && PLANNED[href];
      assert.ok(paths.has(href) || planned, `${file} links to ${href}, which the site does not build`);
      // A published page linking to a draft would be a broken link in production.
      if (!isDraft) {
        assert.ok(!services[href]?.draft, `${file} is published but links to the draft ${href}`);
      }
    }
  }
});

