import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { roomIds, roomSceneDefaults } from "../public/assets/scripts/content-data.js";

const root = new URL("../", import.meta.url);

async function readProjectFile(path) {
  return readFile(new URL(path, root), "utf8");
}

const insideSceneScript = await readProjectFile("public/assets/scripts/inside-scene.js");
const appScript = await readProjectFile("public/assets/scripts/app.js");

assert.equal(roomSceneDefaults.initialRoomId, "welcome");
assert.deepEqual(Object.keys(roomSceneDefaults.rooms), roomIds.filter((roomId) => roomId !== "exterior"));

for (const [roomId, roomScene] of Object.entries(roomSceneDefaults.rooms)) {
  assert.equal(roomScene.id, roomId);
  assert.ok(roomScene.imageSize, `${roomId} should define an image size`);
  assert.ok(roomScene.background, `${roomId} should define a background`);
  assert.ok(Array.isArray(roomScene.background.layers), `${roomId} should define background layers`);
  assert.ok(roomScene.background.layers.length >= 1, `${roomId} should define at least one background layer`);
  assert.ok(Array.isArray(roomScene.hotspots), `${roomId} should define hotspots`);
  assert.ok(roomScene.hotspots.length >= 1, `${roomId} should define at least one hotspot`);
}

assert.equal(roomSceneDefaults.rooms.welcome.background.layers.length, 3);
assert.equal(roomSceneDefaults.rooms.services.background.layers[0].src, "assets/rooms/consulting-room.webp");
assert.equal(roomSceneDefaults.rooms["work-with-us"].background.layers[0].src, "assets/rooms/work-with-us-room.webp");

assert.match(insideSceneScript, /roomScenes/);
assert.match(insideSceneScript, /function setActiveRoom/);
assert.match(insideSceneScript, /function renderRoomBackground/);
assert.match(insideSceneScript, /function renderRoomHotspots/);
assert.match(insideSceneScript, /get activeRoomId\(\)/);
assert.match(appScript, /roomSceneDefaults/);
assert.match(appScript, /setSceneActionHandler/);
