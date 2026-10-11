import assert from "node:assert/strict";
import test from "node:test";

import { practitionerTitle, professionOf, personDescription, clip, listOf } from "../src/lib/seo.js";

test("a practitioner title keeps the full role when it fits", () => {
  assert.equal(
    practitionerTitle("Jazmin Squire", "Psychologist"),
    "Jazmin Squire, Psychologist | Therapy House, The Gap"
  );
});

test("a long role is cut to the profession, then the place is dropped", () => {
  assert.equal(
    practitionerTitle(
      "Letitia McVey",
      "Psychologist, Educational and Developmental Registrar, Chief Operating Officer"
    ),
    "Letitia McVey, Psychologist | Therapy House, The Gap"
  );
  assert.equal(
    practitionerTitle("Dr Amelia Shay", "Director, Developmental Psychologist"),
    "Dr Amelia Shay, Developmental Psychologist | Therapy House"
  );
});

test("the profession is the part of the role that names one", () => {
  assert.equal(professionOf("Director, Developmental Psychologist"), "Developmental Psychologist");
  assert.equal(professionOf("Client Support and Marketing Coordinator"), "Client Support and Marketing Coordinator");
});

test("a person's description is their summary, with the place when there is room", () => {
  assert.equal(
    personDescription("Rani works across the lifespan."),
    "Rani works across the lifespan. Therapy House, The Gap, Brisbane."
  );
  const long = personDescription("word ".repeat(60));
  assert.ok(long.length <= 160);
  assert.ok(long.endsWith("…"));
});

test("clip never cuts a word in half", () => {
  assert.equal(clip("one two three", 9), "one two…");
  assert.equal(clip("short", 160), "short");
});

test("lists read as plain English", () => {
  assert.equal(listOf(["Ashgrove", "Bardon", "Keperra"]), "Ashgrove, Bardon and Keperra");
});
