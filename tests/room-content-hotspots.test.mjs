import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { clinic, roomSceneDefaults } from "../public/assets/scripts/content-data.js";
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
    if (["back", "about", "contact"].includes(hotspot.action)) continue;
    if (hotspot.targetRoom) continue;

    assert.ok(hotspot.contentKey, `${roomId}.${hotspot.id} should define a contentKey`);
    assert.notEqual(getContentByKey(hotspot.contentKey), undefined, `${roomId}.${hotspot.id} should resolve ${hotspot.contentKey}`);
  }
}

// One front room (docs/house-plan.md): reception joined the welcome room, so
// booking and calling, finding the clinic and the way to the telehealth room
// are all in the first room a visitor walks into, and there is no reception.
assert.equal(roomSceneDefaults.rooms.contact, undefined);
const welcome = Object.fromEntries(roomSceneDefaults.rooms.welcome.hotspots.map((hotspot) => [hotspot.id, hotspot]));
assert.deepEqual(Object.keys(welcome), ["about", "philosophy", "contact", "find-us", "telehealth", "back"]);
assert.equal(welcome.contact.action, "contact");
assert.equal(previews[welcome["find-us"].contentKey].text[0], clinic.address);
assert.equal(welcome.philosophy.targetRoom, "philosophy");
assert.equal(welcome.telehealth.targetRoom, "telehealth");
assert.match(appScript, /formerRoomIds\[asked\]/, "an old ?room=contact address must still walk in");
for (const hotspot of roomSceneDefaults.rooms.telehealth.hotspots.filter((h) => h.action !== "back")) {
  assert.match(previews[hotspot.contentKey].link.href, /^\/telehealth\//, `${hotspot.id} should lead to /telehealth/`);
}

const assessmentRoomEntry = roomSceneDefaults.rooms.services.hotspots.find((hotspot) => hotspot.id === "assessment-room");
assert.equal(assessmentRoomEntry.targetRoom, "assessments");
assert.equal(assessmentRoomEntry.contentKey, "rooms.assessments");

assert.match(indexHtml, /id="contentModal"/);
assert.match(appScript, /previews/);
assert.match(appScript, /function renderContentModal/);
assert.match(appScript, /contentDialog\.open/);
assert.match(styles, /\.content-modal__panel/);
assert.match(styles, /\.content-modal__button/);

// Phase B (docs/house-plan.md): booking and calling close every pop-up as an
// equal pair, and neither is ever shown alone.
for (const id of ["contentModal", "contactModal"]) {
  const start = indexHtml.indexOf(`id="${id}"`);
  assert.notEqual(start, -1, `house.astro has no #${id}`);
  const dialog = indexHtml.slice(start, indexHtml.indexOf("</section>", start));
  const actions = dialog.match(/class="house-action"[^>]*href=\{([^}]+)\}|class="house-action" href=\{([^}]+)\}/g) ?? [];
  assert.equal(actions.length, 2, `#${id} should carry the booking and calling pair`);
}
assert.doesNotMatch(appScript, /contentModalActions\.hidden/, "the pair must never be hidden, leaving one action alone");
assert.match(styles, /\.house-action \{/);
