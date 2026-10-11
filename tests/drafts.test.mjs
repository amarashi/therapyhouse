import assert from "node:assert/strict";
import test from "node:test";

import { includeInBuild, shownEntries, shownItems } from "../src/lib/drafts.js";
import { HOUSE_FACTS_ID, houseFacts, houseFactsJson } from "../src/lib/house-facts.js";
import { medicare } from "../src/data/medicare.js";

/**
 * Issue #95: "Show on the live website". The one helper every list filters
 * through (src/lib/drafts.js), and the house, which keeps its own copies of
 * the team, packages and programs and is told by /house/ which of them a
 * build switches off. tests/show-on-live-site.test.mjs checks the same rule
 * against real Preview and production builds.
 */

test("the helper keeps drafts on the Preview and drops them in production", () => {
  const items = [{ label: "on" }, { label: "off", draft: true }, { label: "explicitly on", draft: false }];
  assert.deepEqual(shownItems(items, false), items);
  assert.deepEqual(shownItems(items, true).map((i) => i.label), ["on", "explicitly on"]);
  assert.deepEqual(shownItems(undefined, true), []);
  assert.equal(includeInBuild(undefined, true), true);

  const entries = [{ id: "a", data: {} }, { id: "b", data: { draft: true } }, undefined];
  assert.deepEqual(shownEntries(entries, true).map((e) => e.id), ["a"]);
  assert.deepEqual(shownEntries(entries, false).map((e) => e.id), ["a", "b"]);
});

test("the house leaves out hidden team members, packages and programs, and their signs", async () => {
  const facts = houseFacts({
    fees: [],
    packages: [],
    medicare,
    hidden: { team: ["laura-storey", "reea"], titles: ["ADHD Assessment", "School Observations", "Lego Club"] },
  });
  const json = houseFactsJson(facts);
  globalThis.document = { getElementById: (id) => (id === HOUSE_FACTS_ID ? { textContent: json } : null) };
  try {
    const data = await import(`../public/assets/scripts/content-data.js?hidden=${Date.now()}`);
    const { siteContent, roomSceneDefaults, teamOnSite } = data;
    const names = (list) => list.map((item) => (typeof item === "string" ? item : item.name));

    assert.ok(!names(siteContent.team.members).includes("Laura Storey"));
    assert.ok(!names(siteContent.team.availability).includes("Laura Storey"));
    assert.deepEqual(siteContent.team.dogs, ["Samson"]);
    assert.ok(names(siteContent.team.members).includes("Rani Banks"));

    assert.equal(siteContent.assessments.packages.adhd, undefined);
    assert.ok(siteContent.assessments.packages.autism);
    assert.equal(siteContent.assessments.schoolObservations, undefined);
    assert.equal(siteContent.groups.programs.legoClub, undefined);
    assert.ok(siteContent.groups.programs.hunterRemote);

    const signs = (room) => roomSceneDefaults.rooms[room].hotspots.map((h) => h.id);
    assert.ok(!signs("assessments").includes("adhd-assessment"));
    assert.ok(!signs("assessments").includes("school-observations"));
    assert.ok(signs("assessments").includes("autism-assessment"));
    assert.ok(!signs("groups").includes("lego-club"));

    const { teamMembers } = await import("../public/assets/scripts/site-data.js");
    // Every carousel entry carries the team id the build hides by.
    assert.ok(teamMembers.every((m) => typeof m.id === "string" && m.id));
    const carousel = teamMembers.filter((m) => teamOnSite(m.id)).map((m) => m.name);
    assert.ok(!carousel.includes("Laura Storey") && !carousel.includes("Reea"));
    assert.equal(carousel.length, teamMembers.length - 2);
  } finally {
    delete globalThis.document;
  }
});

test("the house's team ids are the team collection's ids", async () => {
  const { readdirSync, readFileSync } = await import("node:fs");
  const ids = readdirSync(new URL("../src/content/team/", import.meta.url))
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.slice(0, -3))
    .sort();
  const copy = JSON.parse(readFileSync(new URL("../public/assets/content/house-copy.json", import.meta.url), "utf8"));
  const { teamMembers } = await import("../public/assets/scripts/site-data.js");
  assert.deepEqual(copy.team.members.map((m) => m.id).sort(), ids);
  assert.deepEqual(teamMembers.map((m) => m.id).sort(), ids);
  for (const row of copy.team.availability) assert.ok(ids.includes(row.id), `availability id ${row.id}`);
  for (const dog of copy.team.dogs) assert.ok(copy.team.members.some((m) => m.name === dog), `dog ${dog} has no member entry`);
});

test("with nothing hidden the house keeps everything", async () => {
  const { siteContent, roomSceneDefaults } = await import(`../public/assets/scripts/content-data.js?none=${Date.now()}`);
  assert.equal(siteContent.team.members.length, 12);
  assert.equal(Object.keys(siteContent.assessments.packages).length, 4);
  assert.equal(Object.keys(siteContent.groups.programs).length, 4);
  assert.ok(roomSceneDefaults.rooms.assessments.hotspots.some((h) => h.id === "adhd-assessment"));
});
