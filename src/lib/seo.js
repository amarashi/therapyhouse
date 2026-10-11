/**
 * Titles and descriptions that are built rather than written.
 *
 * Search results cut a title at about 60 characters and a description at about
 * 160, so both limits are enforced here and checked against the whole built
 * site by `tests/built-pages.test.mjs`. Plain functions so `node --test` can
 * load them without Astro.
 */

export const TITLE_MAX = 60;
export const DESCRIPTION_MAX = 160;

/**
 * The part of a role that says what the person is: "Director, Developmental
 * Psychologist" becomes "Developmental Psychologist", because the profession is
 * what a search for a named clinician is checking. Roles that name no
 * profession (support staff, the dogs) keep their first part.
 */
export function professionOf(role) {
  const parts = role.split(',').map((p) => p.trim()).filter(Boolean);
  return parts.find((p) => /psycholog|counsell/i.test(p)) ?? parts[0] ?? role;
}

/**
 * `<Name>, <Role> | Therapy House, The Gap`, shortened step by step until it
 * fits: first the role is cut to its profession, then the place is dropped.
 * The name and the clinic always stay.
 */
export function practitionerTitle(name, role) {
  const candidates = [
    `${name}, ${role} | Therapy House, The Gap`,
    `${name}, ${professionOf(role)} | Therapy House, The Gap`,
    `${name}, ${professionOf(role)} | Therapy House`,
    `${name} | Therapy House, The Gap`,
  ];
  return candidates.find((t) => t.length <= TITLE_MAX) ?? `${name} | Therapy House`;
}

/**
 * Cut text to `max` characters at a word boundary, ending with an ellipsis
 * when anything was removed. Never cuts mid-word.
 */
export function clip(text, max = DESCRIPTION_MAX) {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const room = clean.slice(0, max - 1);
  const cut = room.slice(0, room.lastIndexOf(' ')).replace(/[\s,;:.—–-]+$/, '');
  return `${cut}…`;
}

/**
 * A practitioner's meta description: their own published summary, followed by
 * where they work when there is room. Each person's summary is different, so
 * each description is too.
 */
export function personDescription(summary, place = 'Therapy House, The Gap, Brisbane.') {
  const base = summary.trim().replace(/([^.!?])$/, '$1.');
  const withPlace = `${base} ${place}`;
  return withPlace.length <= DESCRIPTION_MAX ? withPlace : clip(base);
}

/** "A, B, C and D" in Australian English, for plain-text lists in copy. */
export function listOf(items) {
  return new Intl.ListFormat('en-AU', { style: 'long', type: 'conjunction' }).format(items);
}
