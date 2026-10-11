import assert from "node:assert/strict";

const { roomIds, roomNavigation, siteContent } = await import("../public/assets/scripts/content-data.js");

const expectedRoomIds = ["exterior", "welcome", "team", "services", "assessments", "groups", "library", "philosophy", "contact", "work-with-us"];

assert.equal(siteContent.source.name, "Therapy House current WordPress site");
assert.equal(siteContent.source.scrape.urlCount, 55);
assert.equal(siteContent.source.scrape.pageCount, 34);
assert.equal(siteContent.source.scrape.postCount, 23);
assert.deepEqual(roomIds, expectedRoomIds);
assert.equal(siteContent.navigation, roomNavigation);
assert.equal(roomNavigation.initialRoomId, "exterior");
assert.equal(roomNavigation.defaultInteriorRoomId, "welcome");
assert.deepEqual(roomNavigation.roomOrder, expectedRoomIds);

for (const roomId of expectedRoomIds) {
  assert.ok(roomNavigation.rooms[roomId], `missing ${roomId} navigation room`);
  assert.equal(roomNavigation.rooms[roomId].id, roomId);
  assert.ok(siteContent.rooms[roomId], `missing ${roomId} room content`);
  assert.equal(siteContent.rooms[roomId].id, roomId);
  assert.ok(Array.isArray(siteContent.rooms[roomId].hotspots), `${roomId} should define hotspots`);
}

assert.deepEqual(
  siteContent.rooms.exterior.hotspots.map((hotspot) => hotspot.targetRoom),
  ["welcome", "services", "groups", "library", "team", "contact", "work-with-us"]
);

assert.equal(siteContent.team.members.length, 12);
assert.equal(siteContent.library.blogArticles.length, 25);
// The clinic's details come from clinic.json, which staff edit in the CMS, so
// they are compared with that file rather than with a copy of today's values.
const { default: clinic } = await import("../public/assets/content/clinic.json", { with: { type: "json" } });
assert.equal(siteContent.contact.phone, clinic.phone);
assert.equal(siteContent.contact.email, clinic.email);
assert.equal(siteContent.contact.address, clinic.address);
assert.match(clinic.phone, /^0\d \d{4} \d{4}$/);
assert.match(clinic.email, /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/);

const assessmentHotspotIds = siteContent.rooms.assessments.hotspots.map((hotspot) => hotspot.id);
assert.deepEqual(
  assessmentHotspotIds,
  ["assessment-process", "assessment-documents", "psychoeducational-assessment", "cognitive-assessment", "adhd-assessment", "autism-assessment", "school-observations", "assessment-faq"]
);

// Sign wording comes from house-rooms.json, which staff edit in the CMS, so
// the check is that every sign has words, not which words.
const serviceSigns = siteContent.rooms.services.hotspots;
assert.ok(serviceSigns.some((hotspot) => hotspot.id === "fees"), "the consulting room lost its Fees sign");
for (const hotspot of serviceSigns) assert.ok(hotspot.label?.trim(), `services sign ${hotspot.id} has no label`);
