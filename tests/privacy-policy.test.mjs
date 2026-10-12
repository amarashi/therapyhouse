import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

import { footerNav } from "../src/data/site.js";
import { readableText } from "./helpers/markdown.mjs";

/**
 * The privacy policy (issue #42) is the clinic's legal text, migrated word for
 * word from the Current Site. These tests guard that it stays linked from
 * every page and that it keeps what the policy has to contain. The clinic
 * may reword it in the CMS (issue #97), so the test checks the facts every
 * version must state, not the sentences they are stated in.
 */

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const policy = await read("src/content/pages/privacy-policy.md");
// Sentences are looked for in what a reader sees, not in the raw file, which
// Pages CMS re-wraps when staff save it.
const policyText = readableText(policy);

test("the footer links the privacy policy", () => {
  assert.ok(footerNav.some((item) => item.href === "/privacy-policy/"));
});

test("the policy keeps what it has to state", () => {
  // One required fact from each section of the published policy.
  for (const [fact, pattern] of [
    ["the law it follows", /Australian Privacy Principles/i],
    ["the professional code it follows", /Code of Ethics/i],
    ["what personal information is", /personal information/i],
    ["that clients may stay anonymous or use a pseudonym", /pseudonym/i],
    ["that information is not sold or passed on", /not be used, sold|not .*sold/i],
    ["who complaints go to first", /Therapy House Management/i],
    ["the regulator's phone number", /1300 363 992/],
    ["the regulator's postal address", /GPO Box 5218, Sydney,? NSW 2001/i],
  ]) {
    assert.match(policyText, pattern, `privacy-policy.md must still state ${fact}`);
  }
});

test("the policy carries the date it was last reviewed", () => {
  assert.match(policy, /^lastReviewed: \d{4}-\d{2}-\d{2}$/m);
});
