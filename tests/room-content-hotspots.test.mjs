import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { roomSceneDefaults } from "../public/assets/scripts/content-data.js";
import { builtHouseContent } from "./helpers/house-content.mjs";

const root = new URL("../", import.meta.url);

async function readProjectFile(path) {
  return readFile(new URL(path, root), "utf8");
}

// Every sign that opens a preview finds one in what /house/ builds from the
// plain pages' files, and every preview leads on to a page.
const { previews } = builtHouseContent();
const getContentByKey = (contentKey) => previews[contentKey];
for (const [key, preview] of Object.entries(previews)) {
  assert.ok(preview.link?.href && preview.link?.label, `${key} has no link to a page`);
}

const appScript = await readProjectFile("public/assets/scripts/app.js");
const indexHtml = await readProjectFile("src/pages/house.astro");
const styles = await readProjectFile("public/assets/styles/main.css");

for (const [roomId, roomScene] of Object.entries(roomSceneDefaults.rooms)) {
  for (const hotspot of roomScene.hotspots) {
    if (["back", "about", "philosophy", "contact"].includes(hotspot.action)) continue;
    if (hotspot.targetRoom) continue;

    assert.ok(hotspot.contentKey, `${roomId}.${hotspot.id} should define a contentKey`);
    assert.notEqual(getContentByKey(hotspot.contentKey), undefined, `${roomId}.${hotspot.id} should resolve ${hotspot.contentKey}`);
  }
}

const contactRoomHotspots = roomSceneDefaults.rooms.contact.hotspots
  .filter((hotspot) => hotspot.id !== "back")
  .map((hotspot) => hotspot.action);
assert.deepEqual(contactRoomHotspots, ["content", "content", "content", "content", "content"]);

const assessmentRoomEntry = roomSceneDefaults.rooms.services.hotspots.find((hotspot) => hotspot.id === "assessment-room");
assert.equal(assessmentRoomEntry.targetRoom, "assessments");
assert.equal(assessmentRoomEntry.contentKey, "rooms.assessments");

assert.match(indexHtml, /id="contentModal"/);
assert.match(appScript, /previews/);
assert.match(appScript, /function renderContentModal/);
assert.match(appScript, /contentDialog\.open/);
assert.match(styles, /\.content-modal__panel/);
assert.match(styles, /\.content-modal__button/);
