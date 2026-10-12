import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

import { roomIds, roomSceneDefaults } from "../public/assets/scripts/content-data.js";

/*
 * Moving through the house (docs/house-plan.md, phase C): every room has its
 * own address and history entry, the Back sign steps back one room, and the
 * rooms menu reaches every room without going outside.
 */
const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const app = await read("public/assets/scripts/app.js");
const house = await read("src/pages/house.astro");

test("room changes are history entries the browser's Back button follows", () => {
  assert.match(app, /history\.pushState\(/);
  assert.match(app, /history\.replaceState\(/);
  assert.match(app, /addEventListener\("popstate", followHistory\)/);
  assert.match(app, /searchParams\.set\("room", roomId\)/, "a room's address carries ?room=");
});

test("the Back sign steps back one room, and a sign to another room is a step", () => {
  assert.match(app, /if \(action === "back"\) \{\s*stepBack\(\);/);
  assert.match(app, /sign\.dataset\.targetRoom\) \{\s*goToRoom\(sign\.dataset\.targetRoom\);/);
  // Walking in from the exterior is recorded too, whichever door was used.
  assert.match(app, /onExteriorHotspot:[\s\S]*?goToRoom\(hotspot\.targetRoom\)/);
  assert.match(app, /onEnterInside: \(roomId\) => \{[\s\S]*?recordVisit\(roomId\)/);
});

test("the rooms menu lists the outside and every room, built from the room list", () => {
  assert.match(house, /id="roomMenuToggle"[^>]*aria-expanded="false"[^>]*aria-controls="roomMenuList"/);
  assert.match(house, /roomNavigation\.roomOrder\.map/);
  assert.match(house, /data-room=\{room\.id\}/);
  for (const id of roomIds) {
    assert.ok(id === "exterior" || roomSceneDefaults.rooms[id], `${id} is in the menu but has no scene`);
  }
});
