import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

import { footerNav } from "../src/data/site.js";

/**
 * The privacy policy (issue #42) is the clinic's legal text, migrated word for
 * word from the Current Site. These tests guard that it stays linked from
 * every page and that its wording is not quietly rewritten.
 */

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const policy = await read("src/content/pages/privacy-policy.md");

test("the footer links the privacy policy", () => {
  assert.ok(footerNav.some((item) => item.href === "/privacy-policy/"));
});

test("the policy keeps the Current Site wording", () => {
  // One sentence from each section of the published policy.
  for (const sentence of [
    "This document describes the privacy policy of Therapy House for the management of clients’ personal information.",
    "the Australian Privacy Principles 2014 and the Australian Psychological Society – Code of Ethics (2007)",
    "Personal information is any information which identifies you or could reasonably be used to identify you.",
    "Legal or offending history (in the case of medico-legal services).",
    "clients may request to be anonymous or to use a pseudonym",
    "Clients’ personal information will not be used, sold, rented, or disclosed for any other purpose.",
    "should be lodged with Therapy House Management Team.",
    "by phone on 1300 363 992",
    "GPO Box 5218, Sydney, NSW 2001.",
  ]) {
    assert.ok(policy.includes(sentence), `privacy-policy.md is missing: ${sentence}`);
  }
});

test("the policy carries the date it was last reviewed", () => {
  assert.match(policy, /^lastReviewed: \d{4}-\d{2}-\d{2}$/m);
});
