import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { exteriorHotspots, siteContent } from "../assets/scripts/content-data.js";

const root = new URL("../", import.meta.url);

async function readProjectFile(path) {
  return readFile(new URL(path, root), "utf8");
}

const appScript = await readProjectFile("assets/scripts/app.js");
const turntableScript = await readProjectFile("assets/scripts/turntable-viewer.js");
const indexHtml = await readProjectFile("index.html");
const styles = await readProjectFile("assets/styles/main.css");

const expectedIds = ["main-door", "services-window", "group-window", "blogs-sign", "team-sign", "mailbox", "staff-side-door"];
const expectedTargets = ["welcome", "services", "groups", "library", "team", "contact", "work-with-us"];

assert.deepEqual(exteriorHotspots.map((hotspot) => hotspot.id), expectedIds);
assert.deepEqual(exteriorHotspots.map((hotspot) => hotspot.targetRoom), expectedTargets);
assert.deepEqual(siteContent.rooms.exterior.hotspots.map((hotspot) => hotspot.id), expectedIds);

for (const hotspot of exteriorHotspots) {
  assert.equal(typeof hotspot.label, "string");
  assert.equal(typeof hotspot.ariaLabel, "string");
  assert.equal(typeof hotspot.position.x, "number");
  assert.equal(typeof hotspot.position.y, "number");
  assert.equal(typeof hotspot.position.width, "number");
  assert.equal(typeof hotspot.position.height, "number");
  assert.equal(typeof hotspot.position.shiftX, "number");
}

assert.match(indexHtml, /id="exteriorHotspotLayer"/);
assert.match(styles, /\.exterior-hotspot-layer/);
assert.match(styles, /\.exterior-hotspot/);
assert.match(turntableScript, /exteriorHotspotLayer/);
assert.match(turntableScript, /exteriorHotspots/);
assert.match(turntableScript, /function renderExteriorHotspots/);
assert.match(turntableScript, /function updateExteriorHotspots/);
assert.match(appScript, /exteriorHotspots/);
assert.match(appScript, /onExteriorHotspot/);
