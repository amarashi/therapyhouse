/**
 * Fee, rebate and assessment-price facts for the illustrated house (issue #80).
 *
 * The house's scripts live in `public/assets/scripts/` and are served as-is,
 * so they cannot import `src/`. Before #80 they carried their own copy of the
 * fee list, and it drifted from /fees/: the old "Mental Health Care Plan"
 * name, an assessment range that matched no published package, and no
 * provisional psychologist fees.
 *
 * Now `src/pages/house.astro` calls `houseFacts()` at build time with the same
 * data the plain pages read (src/content/pages/fees.md,
 * src/content/pages/assessments.md and src/data/medicare.js) and writes the
 * result into the page as JSON. `content-data.js` reads that JSON, so the
 * rooms and the plain pages show the same figures from the same files.
 *
 * The shapes returned are the ones the house's content modal already renders:
 * the session length as a plain sentence followed by a card per fee
 * ({ title, price, description }), and a list of sentences for the rebates.
 */
import { formatAsAt, formatRebate } from '../data/medicare.js';

/** The id of the JSON script element in /house/ that `content-data.js` reads. */
export const HOUSE_FACTS_ID = 'house-facts';

const capitalise = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/** "From $1,000, or from $846 with a provisional psychologist" — the /fees/ wording. */
export function packagePrice(pkg) {
  const price = capitalise(pkg.price);
  return pkg.provisionalPrice
    ? `${price}, or ${pkg.provisionalPrice} with a provisional psychologist`
    : price;
}

/**
 * @param {object} input
 * @param {Array<{label: string, amount: string, note?: string}>} input.fees  fees.md `fees`
 * @param {string} [input.sessionLength]  fees.md `sessionLength`
 * @param {string[]} [input.privateHealth]  fees.md `privateHealth`
 * @param {Array<{title: string, price: string, provisionalPrice?: string}>} input.packages  assessments.md `packages`
 * @param {object} input.medicare  src/data/medicare.js `medicare`
 */
export function houseFacts({ fees, sessionLength, privateHealth = [], packages, medicare }) {
  const feeCards = fees.map((row) => ({
    title: row.label,
    price: row.amount,
    ...(row.note ? { description: row.note } : {}),
  }));

  const rebates = [
    'Medicare pays a rebate (an amount paid back to you) through Better Access when your GP ' +
      'refers you with a Mental Health Treatment Plan (sometimes still called a Mental Health Care Plan).',
    ...medicare.rebates.map(
      (row) =>
        `${row.label}: ${formatRebate(row.rebate)} back per individual session of at least 50 minutes ` +
        `(as at ${formatAsAt(medicare.asAt)}, ${medicare.sourceName}).`
    ),
    `Medicare pays a rebate on up to ${medicare.sessionsPerYear} individual sessions each calendar year.`,
    'Medicare does not cover couple and family sessions.',
    'No Medicare rebate applies to sessions with a provisional psychologist.',
    ...privateHealth.slice(0, 1),
  ];

  const packagePrices = Object.fromEntries(packages.map((pkg) => [pkg.title, packagePrice(pkg)]));

  return {
    fees: sessionLength ? [sessionLength, ...feeCards] : feeCards,
    rebates,
    packagePrices,
  };
}

/** The JSON for a `<script type="application/json">`, safe against a stray "</script>". */
export function houseFactsJson(facts) {
  return JSON.stringify(facts).replace(/</g, '\\u003c');
}
