import assert from "node:assert/strict";

const { roomIds, roomNavigation, siteContent } = await import("../public/assets/scripts/content-data.js");

const expectedRoomIds = ["exterior", "welcome", "team", "services", "assessments", "groups", "library", "contact", "work-with-us"];

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
assert.equal(siteContent.library.blogArticles.length, 23);
assert.equal(siteContent.contact.phone, "07 3300 2170");
assert.equal(siteContent.contact.email, "admin@therapyhouse.com.au");
assert.match(siteContent.contact.address, /1290 Waterworks Rd/);

const assessmentHotspotIds = siteContent.rooms.assessments.hotspots.map((hotspot) => hotspot.id);
assert.deepEqual(
  assessmentHotspotIds,
  ["assessment-process", "assessment-documents", "psychoeducational-assessment", "cognitive-assessment", "adhd-assessment", "autism-assessment", "school-observations", "assessment-faq"]
);

const serviceLabels = siteContent.rooms.services.hotspots.map((hotspot) => hotspot.label);
assert.ok(serviceLabels.includes("Services"));
assert.ok(serviceLabels.includes("Fees"));
