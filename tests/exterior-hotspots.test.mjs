import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { exteriorHotspots, siteContent } from "../public/assets/scripts/content-data.js";

const root = new URL("../", import.meta.url);

async function readProjectFile(path) {
  return readFile(new URL(path, root), "utf8");
}

const appScript = await readProjectFile("public/assets/scripts/app.js");
const turntableScript = await readProjectFile("public/assets/scripts/turntable-viewer.js");
const indexHtml = await readProjectFile("src/pages/house.astro");
const styles = await readProjectFile("public/assets/styles/main.css");

const expectedIds = ["main-door", "services-window", "group-window", "blogs-sign", "team-sign", "mailbox", "staff-side-door"];
const expectedTargets = ["welcome", "services", "groups", "library", "team", "welcome", "work-with-us"];

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

/*
 * The exterior doors are painted onto the turntable, at `z-index: 3` with hit
 * areas of their own. Nothing about opening a room moves them: unless the
 * stylesheet takes the layer out, six invisible rectangles keep sitting over
 * the room artwork, lighting up a label for a room the visitor is already
 * standing in and answering the Tab key from behind the scene. `display: none`
 * rather than `pointer-events: none`, because the tab order has to go too.
 */
const insideHiddenRule = styles.match(/\.stage\.is-inside[^{]*\{\s*display:\s*none;/);
assert.ok(insideHiddenRule, "expected a rule hiding the exterior chrome once a room is open");
assert.match(insideHiddenRule[0], /\.stage\.is-inside \.exterior-hotspot-layer/);
assert.match(insideHiddenRule[0], /\.stage\.is-inside \.door-hotspot/);

/* Same during the entrance video: the doors are mid-transition scenery, not
   something to click through. */
const playingInertRule = styles.match(/\.stage\.is-playing[^{]*\{\s*opacity:\s*0;\s*pointer-events:\s*none;/);
assert.ok(playingInertRule, "expected a rule making the exterior chrome inert while the door video plays");
assert.match(playingInertRule[0], /\.stage\.is-playing \.exterior-hotspot-layer/);
