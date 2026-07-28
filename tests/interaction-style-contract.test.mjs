import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { roomSceneDefaults } from "../assets/scripts/content-data.js";

const root = new URL("../", import.meta.url);

async function readProjectFile(path) {
  return readFile(new URL(path, root), "utf8");
}

const appScript = await readProjectFile("assets/scripts/app.js");
const styles = await readProjectFile("assets/styles/main.css");

for (const [roomId, roomScene] of Object.entries(roomSceneDefaults.rooms)) {
  const backHotspot = roomScene.hotspots.find((hotspot) => hotspot.id === "back");
  assert.ok(backHotspot, `${roomId} should keep clear back navigation`);
  assert.equal(backHotspot.action, "back", `${roomId} back hotspot should use the back action`);
}

assert.equal(roomSceneDefaults.rooms.welcome.hotspots.find((hotspot) => hotspot.id === "about").action, "about");
assert.equal(roomSceneDefaults.rooms.team.hotspots.find((hotspot) => hotspot.id === "team-carousel").action, "about");

assert.match(appScript, /createTeamCarousel/);
assert.match(appScript, /teamCarousel\.open/);
assert.match(appScript, /createModalDialog/);
assert.match(appScript, /philosophyDialog\.open/);
assert.match(appScript, /contactDialog\.open/);

assert.match(styles, /\.scene-sign::before/);
assert.match(styles, /\.scene-sign:hover/);
assert.match(styles, /\.exterior-hotspot::before/);
assert.match(styles, /\.exterior-hotspot:hover::before/);
assert.match(styles, /\.philosophy-modal__panel/);
assert.match(styles, /\.contact-modal__panel/);
