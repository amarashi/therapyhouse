import assert from "node:assert/strict";
import test from "node:test";

import { inlineHtml } from "../src/lib/inline-text.js";

/**
 * The short texts staff edit in the CMS go into the page as HTML, so
 * everything they type is escaped except a Markdown link to a safe address.
 */

test("plain text is escaped", () => {
  assert.equal(inlineHtml(`Fees & "rebates" <b>now</b>`), "Fees &amp; &quot;rebates&quot; &lt;b&gt;now&lt;/b&gt;");
});

test("links to this site, headings, other sites, email and phone become links", () => {
  assert.equal(
    inlineHtml("You can also [contact the clinic](/contact/) by email."),
    'You can also <a href="/contact/">contact the clinic</a> by email.'
  );
  assert.equal(inlineHtml("[fees](#fees)"), '<a href="#fees">fees</a>');
  assert.equal(inlineHtml("[MBS](https://www.mbsonline.gov.au/)"), '<a href="https://www.mbsonline.gov.au/">MBS</a>');
  assert.equal(inlineHtml("Call [13 11 14](tel:131114)."), 'Call <a href="tel:131114">13 11 14</a>.');
  assert.equal(inlineHtml("[email](mailto:a@b.au)"), '<a href="mailto:a@b.au">email</a>');
});

test("any other address stays as typed, so it shows up on the Preview", () => {
  assert.equal(inlineHtml("[click](javascript:alert(1))"), "[click](javascript:alert(1))");
  assert.equal(inlineHtml("[page](contact)"), "[page](contact)");
});

test("a link's words are escaped too", () => {
  assert.equal(inlineHtml("[<i>x</i>](/a/)"), '<a href="/a/">&lt;i&gt;x&lt;/i&gt;</a>');
});
