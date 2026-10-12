import assert from "node:assert/strict";
import test from "node:test";

import { includeInBuild, shownEntries, shownItems } from "../src/lib/drafts.js";
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
  // /house/ builds its previews from what the build shows (src/pages/house.astro),
  // so a switched-off item is simply not there, and its sign goes with it.
  const { builtHouseContent, collection, loadHouse } = await import("./helpers/house-content.mjs");
  const { houseContent } = await import("../src/lib/house-content.js");
  const { books, videos } = await import("../src/data/library-shelf.js");
  const { readFileSync } = await import("node:fs");
  const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  const pages = Object.fromEntries(collection("pages").map((entry) => [entry.id, entry.data]));
  const off = { team: ["laura-storey", "reea"], packages: ["adhd", "schoolObservations"], programs: ["legoClub"] };
  pages.assessments = { ...pages.assessments, packages: pages.assessments.packages.filter((p) => !off.packages.includes(p.id)) };
  pages["group-therapy"] = { ...pages["group-therapy"], programs: pages["group-therapy"].programs.filter((p) => !off.programs.includes(p.id)) };
  const content = houseContent({
    pages,
    services: collection("services"),
    articles: collection("articles"),
    team: collection("team").filter((entry) => !off.team.includes(entry.id)),
    books,
    videos,
    clinic: JSON.parse(read("public/assets/content/clinic.json")),
    links: JSON.parse(read("public/assets/content/house-copy.json")).links,
    medicare,
  });
  const { roomSceneDefaults, teamMembers } = await loadHouse(content);

  const carousel = teamMembers.map((m) => m.name);
  assert.ok(!carousel.includes("Laura Storey") && !carousel.includes("Reea"));
  assert.equal(teamMembers.length, builtHouseContent().team.length - 2);
  assert.ok(!content.previews["team.availability"].items.some((i) => i.title === "Laura Storey"));
  assert.deepEqual(content.previews["team.dogs"].items.map((i) => i.title), ["Samson"]);

  const signs = (room) => roomSceneDefaults.rooms[room].hotspots.map((h) => h.id);
  assert.ok(!signs("assessments").includes("adhd-assessment"));
  assert.ok(!signs("assessments").includes("school-observations"));
  assert.ok(signs("assessments").includes("autism-assessment"));
  assert.ok(!signs("groups").includes("lego-club"));
  assert.ok(signs("groups").includes("hunter-remote"));
});

test("every package and program sign in the house names a page item by its id", async () => {
  // The house joins a sign to its item by the item's `id` in assessments.md
  // and group-therapy.md, so a title can be reworded in the CMS freely.
  const { collection } = await import("./helpers/house-content.mjs");
  const { roomSceneDefaults } = await import("../public/assets/scripts/content-data.js");
  const pages = Object.fromEntries(collection("pages").map((entry) => [entry.id, entry.data]));
  const ids = (items) => items.map((item) => item.id).filter(Boolean).sort();
  const keys = (room, pattern) =>
    roomSceneDefaults.rooms[room].hotspots
      .map((h) => h.contentKey.match(pattern)?.[1])
      .filter(Boolean)
      .sort();

  assert.deepEqual(keys("assessments", /^assessments\.(?:packages\.)?(\w+)$/).filter((k) => !["process", "documents", "faq"].includes(k)), ids(pages.assessments.packages));
  assert.deepEqual(keys("groups", /^groups\.programs\.(\w+)$/), ids(pages["group-therapy"].programs));
});

test("with nothing hidden the house keeps every sign", async () => {
  const { loadHouse } = await import("./helpers/house-content.mjs");
  const { roomSceneDefaults: built } = await loadHouse();
  const { roomSceneDefaults: plain } = await import(`../public/assets/scripts/content-data.js?none=${Date.now()}`);
  for (const [id, room] of Object.entries(plain.rooms)) {
    assert.deepEqual(built.rooms[id].hotspots.map((h) => h.id), room.hotspots.map((h) => h.id), id);
  }
});
