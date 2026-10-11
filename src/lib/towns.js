/**
 * The rules for Town Pages (issues #26 to #29), as plain functions so
 * `node --test` can check them without Astro.
 */

/** Facts a town needs before it may have a page of its own. */
export const MIN_TOWN_FACTS = 3;

/** Where a Town Page lives. */
export function townPath(id) {
  return `/telehealth/${id}/`;
}

/**
 * Throws when a town marked `page` cannot stand as a page: fewer than three
 * sourced facts, or a missing title, heading, description or lede. A thin
 * town page is a doorway page (one written only to catch a search), which is
 * what the spec rules out.
 */
export function assertTownPage(id, data) {
  if (data.kind !== 'page') return;
  const facts = data.facts ?? [];
  if (facts.length < MIN_TOWN_FACTS) {
    throw new Error(
      `Town "${id}" has ${facts.length} sourced facts; a Town Page needs at least ${MIN_TOWN_FACTS}. ` +
        'Make it a section of /telehealth/ (kind: section) instead.'
    );
  }
  for (const field of ['title', 'h1', 'description', 'lede']) {
    if (!data[field]) throw new Error(`Town page "${id}" has no ${field}.`);
  }
}

/** Town entries split into launch pages and /telehealth/ sections, in order. */
export function splitTowns(entries) {
  const sorted = [...entries].sort((a, b) => a.data.order - b.data.order);
  return {
    pages: sorted.filter((e) => e.data.kind === 'page'),
    sections: sorted.filter((e) => e.data.kind === 'section'),
  };
}

/**
 * The share of `a`'s text that also appears in `b`, measured in runs of
 * `size` consecutive words (shingles). 0 means nothing in common; 1 means
 * every run of words in `a` is somewhere in `b`. Case and punctuation are
 * ignored so a changed comma does not hide a copied sentence.
 */
export function sharedShare(a, b, size = 8) {
  const shingles = (text) => {
    const words = text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter(Boolean);
    const set = new Set();
    for (let i = 0; i + size <= words.length; i++) set.add(words.slice(i, i + size).join(' '));
    return set;
  };
  const sa = shingles(a);
  if (sa.size === 0) return 0;
  const sb = shingles(b);
  let shared = 0;
  for (const s of sa) if (sb.has(s)) shared++;
  return shared / sa.size;
}
