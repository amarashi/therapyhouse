import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";

import { roomSceneDefaults } from "../public/assets/scripts/content-data.js";

/*
 * Every reading page opens on a picture of one of the house's rooms, and that
 * picture is the door into it. The failure mode is silent and only shows up to
 * a visitor: a page names a room that does not exist, the house shrugs and
 * drops them in the entry hall, and the picture they clicked turns out to have
 * been a picture of somewhere else.
 */

const root = new URL("../", import.meta.url);

async function readProjectFile(path) {
  return readFile(new URL(path, root), "utf8");
}

async function pageSources() {
  const dir = new URL("src/pages/", root);
  const entries = await readdir(dir, { recursive: true, withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".astro"))
    .map((entry) => {
      const parent = entry.parentPath.replace(/\\/g, "/").split("src/pages/")[1];
      return parent ? `${parent}/${entry.name}` : entry.name;
    });

  return Promise.all(
    files.map(async (name) => [name, await readProjectFile(`src/pages/${name}`)])
  );
}

const knownRooms = new Set([...Object.keys(roomSceneDefaults.rooms), "exterior"]);
const pages = await pageSources();

let doorCount = 0;
for (const [name, source] of pages) {
  for (const [, room] of source.matchAll(/\n\s+room="([^"]+)"/g)) {
    doorCount += 1;
    assert.ok(knownRooms.has(room), `${name} opens a door onto "${room}", which the house has no room for`);
  }
}

/* Every page that carries a hero carries a door — the affordance is either
   everywhere or it is a curiosity nobody learns to look for. */
const heroPages = pages.filter(([, source]) => source.includes("<HeroReveal"));
assert.equal(doorCount, heroPages.length, "every page with a hero should name the room behind it");
assert.ok(heroPages.length >= 9, "expected a hero on the home page and every room page");

/* The accessible name is `enterLabel` plus `roomName`, so a page that leaves the
   label at its "Step inside" default has to supply the half that finishes the
   sentence — otherwise the link is announced as "Step inside" and nothing else,
   which is the same name on nine different pages. A page that writes its own
   whole label needs no second half, and stapling one on produces the nonsense
   the homepage was briefly announcing: "Explore the house the Therapy House
   exterior". */
for (const [name, source] of pages) {
  if (!source.includes("\n    room=")) continue;
  const named = /\n\s+roomName="[^"]+"/.test(source);
  const relabelled = /\n\s+enterLabel="[^"]+"/.test(source);
  assert.ok(
    named !== relabelled,
    `${name} should give its door either a room name or a whole label of its own, not both and not neither`
  );
}

/* And the house end of the same contract. */
const appScript = await readProjectFile("public/assets/scripts/app.js");
assert.match(appScript, /new URLSearchParams\(window\.location\.search\)\.get\("room"\)/);
assert.match(
  appScript,
  /roomSceneDefaults\.rooms\[requested\]/,
  "an unknown ?room= should fall through to the exterior rather than being trusted"
);
assert.match(appScript, /entranceVideo\.enterInsideView\(requestedRoom\)/);

/* The way back out. `from` is a same-origin path or it is ignored — a bare
   `//host` would otherwise send a visitor off the site from inside the house. */
assert.match(appScript, /\/\^\\\/\(\?!\\\/\)\//, "?from= should be constrained to same-origin paths");

const houseMarkup = await readProjectFile("src/pages/house.astro");
assert.match(houseMarkup, /id="houseExit"/, "the house needs a way back to the page it was entered from");

/*
 * The front door is a door like the others and has to name the room it opens
 * onto. It used to say nothing: the entrance video's `ended` handler passed its
 * own Event object through as the room id, and the house reached the entry hall
 * only because an Event matches no room and the fallback caught it. Anyone who
 * walked out of a room and back to the front door — or double-clicked to skip
 * the video, which asks for no room at all — was relying on that accident.
 */
const entranceScript = await readProjectFile("public/assets/scripts/entrance-video.js");
assert.doesNotMatch(
  entranceScript,
  /addEventListener\("ended", enterInsideView\)/,
  "the ended handler must not hand its Event to enterInsideView as a room id"
);
assert.match(entranceScript, /addEventListener\("ended", \(\) => enterInsideView\(\)\)/);
assert.match(
  entranceScript,
  /function enterInsideView\(roomId = frontDoorRoom\(\)\)/,
  "asking for no room should mean the front door's room, not whichever room was open last"
);
assert.match(entranceScript, /doorHotspot\.dataset\.targetRoom/);

/* And the turntable is what puts that room on the button, from the same
   content model every other door is read out of. */
const turntableScript = await readProjectFile("public/assets/scripts/turntable-viewer.js");
assert.match(turntableScript, /doorHotspot\.dataset\.targetRoom = mainDoorHotspot\.targetRoom/);
