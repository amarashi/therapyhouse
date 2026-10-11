import assert from "node:assert/strict";
import test from "node:test";

import { businessSchema, personSchema, occupationOf } from "../src/lib/structured-data.js";
import { site, contact, businessFacts } from "../src/data/site.js";

const siteUrl = "https://amarashi.github.io";
const pageBase = (p) => `/therapyhouse${p}`;

const services = [
  { id: "child-adhd", data: { kind: "assessment", h1: "ADHD assessment for children" } },
  { id: "anxiety", data: { kind: "therapy", h1: "Anxiety therapy" } },
  { id: "therapy", data: { kind: "hub", h1: "Therapy" } },
];

test("availableService lists every therapy and assessment page, typed and addressed", () => {
  const b = businessSchema({ site, contact, facts: businessFacts, services, siteUrl, pageBase });
  assert.deepEqual(b.availableService, [
    {
      "@type": "MedicalTest",
      name: "ADHD assessment for children",
      url: "https://amarashi.github.io/therapyhouse/assessments/child-adhd/",
    },
    {
      "@type": "MedicalTherapy",
      name: "Anxiety therapy",
      url: "https://amarashi.github.io/therapyhouse/therapy/anxiety/",
    },
  ]);
});

test("with no published services, availableService is left out rather than empty", () => {
  const b = businessSchema({ site, contact, facts: businessFacts, services: [], siteUrl, pageBase });
  assert.equal(b.availableService, undefined);
});

test("opening hours appear only once the clinic has supplied them", () => {
  const none = businessSchema({ site, contact, facts: businessFacts, siteUrl, pageBase });
  assert.equal(none.openingHoursSpecification, undefined);
  const facts = {
    ...businessFacts,
    openingHours: [{ dayOfWeek: ["Monday"], opens: "08:00", closes: "18:00" }],
  };
  const some = businessSchema({ site, contact, facts, siteUrl, pageBase });
  assert.equal(some.openingHoursSpecification[0]["@type"], "OpeningHoursSpecification");
});

test("the clinic's coordinates are on Waterworks Road in The Gap", () => {
  const { latitude, longitude } = businessFacts.geo;
  assert.ok(latitude > -27.46 && latitude < -27.43, `latitude ${latitude}`);
  assert.ok(longitude > 152.92 && longitude < 152.95, `longitude ${longitude}`);
});

test("the occupation is the profession the role names, or nothing", () => {
  assert.equal(occupationOf("Clinical Psychologist, Chief Clinical Officer"), "Clinical Psychologist");
  assert.equal(occupationOf("Counsellor"), "Counsellor");
  assert.equal(occupationOf("Administrative Support"), undefined);
});

const person = {
  name: "Rani Banks",
  role: "Clinical Psychologist",
  kind: "practitioner",
  image: "/assets/team/rani-banks.webp",
};

test("a Person carries an AHPRA identifier only when the number is filled", () => {
  const without = personSchema(person, { id: "rani-banks", origin: site.origin, siteUrl, pageBase });
  assert.equal(without.identifier, undefined);
  const withNumber = personSchema(
    { ...person, ahpra: "PSY0000000000" },
    { id: "rani-banks", origin: site.origin, siteUrl, pageBase }
  );
  assert.equal(withNumber.identifier.value, "PSY0000000000");
});

test("the dogs get no Person record", () => {
  assert.equal(
    personSchema({ ...person, kind: "dog" }, { id: "reea", origin: site.origin, siteUrl, pageBase }),
    null
  );
});
