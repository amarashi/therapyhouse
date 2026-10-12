import { withBase } from './base.js';

/**
 * A short piece of CMS text as HTML: everything escaped, except links written
 * the Markdown way, `[contact the clinic](/contact/)`. Used for the headings
 * and sentences staff edit in the CMS that sit inside a page's template rather
 * than in its Markdown body (the "Headings and short text" forms, and
 * src/data/shared-text.json), where a sentence sometimes needs a link in the
 * middle of it.
 *
 * A link may go to a page on this site (`/fees/`, rebased like every internal
 * link), a heading on the same page (`#fees`), another website (`https://`),
 * an email address (`mailto:`) or a phone number (`tel:`). Anything else is
 * left as the text it was typed as, so a typo shows on the Preview instead of
 * becoming a broken link.
 */
const LINK = /\[([^\]]+)\]\(([^)\s]+)\)/g;
const ALLOWED = /^(\/|#|https?:\/\/|mailto:|tel:)/;

const escape = (text) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function inlineHtml(text) {
  if (typeof text !== 'string') return '';
  let html = '';
  let last = 0;
  for (const match of text.matchAll(LINK)) {
    const [whole, label, href] = match;
    html += escape(text.slice(last, match.index));
    html += ALLOWED.test(href) ? `<a href="${escape(withBase(href))}">${escape(label)}</a>` : escape(whole);
    last = match.index + whole.length;
  }
  return html + escape(text.slice(last));
}
