import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

/*
 * docs/house-plan.md, phase F. Every word a visitor reads in the house comes
 * from a file staff edit in the CMS: the plain pages' own content (built into
 * previews by src/lib/house-content.js), house-copy.json, house-rooms.json or
 * clinic.json. Text typed straight into the template is how the welcome
 * room's philosophy and contact pop-ups drifted from their pages, so this
 * fails if any comes back.
 *
 * It reads the body of house.astro, takes out comments, `{…}` expressions and
 * tags, and expects no words to be left. Attributes (aria-label, alt) are
 * outside its reach: they are tags, and are left to review.
 */
const source = await readFile(new URL("../src/pages/house.astro", import.meta.url), "utf8");

/** The text between the tags of the page body, with Astro's expressions taken out. */
function visibleText(astro) {
  let body = astro.slice(astro.indexOf("<body>"), astro.indexOf("</body>"));
  body = body.replace(/\{\/\*[\s\S]*?\*\/\}/g, " ");
  // Expressions nest ({rooms.map((r) => (<li>{r.name}</li>))}), so peel the innermost first.
  for (let before = ""; before !== body; ) {
    before = body;
    body = body.replace(/\{[^{}]*\}/g, " ");
  }
  return body
    .replace(/<[^>]+>/g, " ")
    .replace(/&times;|&larr;|&rarr;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

test("the house template types out no words of its own", () => {
  assert.equal(visibleText(source), "", "move this wording into house-copy.json (and .pages.yml)");
});

test("the check finds typed-out words", () => {
  assert.equal(visibleText("<body><p>Hello</p>{/* note */}<p>{x}</p></body>"), "Hello");
});
