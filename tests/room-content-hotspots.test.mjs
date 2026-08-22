import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { roomSceneDefaults, siteContent } from "../public/assets/scripts/content-data.js";

const root = new URL("../", import.meta.url);

async function readProjectFile(path) {
  return readFile(new URL(path, root), "utf8");
}

function getContentByKey(contentKey) {
  return contentKey.split(".").reduce((value, key) => {
    if (value && typeof value === "object" && key in value) return value[key];
    return undefined;
  }, siteContent);
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
assert.match(appScript, /siteContent/);
assert.match(appScript, /function renderContentModal/);
assert.match(appScript, /contentDialog\.open/);
assert.match(styles, /\.content-modal__panel/);
assert.match(styles, /\.content-modal__button/);
