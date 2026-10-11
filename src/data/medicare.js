/**
 * Medicare rebates for psychology sessions: the one place the amounts live.
 *
 * Every page that states a rebate in dollars (/fees/, /telehealth/, the Town
 * Pages) reads it from here, so a change on 1 July each year is one edit.
 *
 * Every amount below was read off MBS Online, the Australian Government's
 * official list of Medicare items and rebates, on `checked`. The
 * schedule fees were last updated by the government on `asAt`. A rebate is
 * the "Benefit: 85%" figure on each item's page: what Medicare pays back for
 * one session, not what the session costs.
 *
 * `assertRebatesCurrent` stops a build once `asAt` is more than twelve months
 * old. That is deliberate: Medicare indexes these amounts every July, and a
 * stale rebate on a fees page is a wrong number a parent will budget with.
 * To clear it, open each item link below, copy the new benefit and the
 * "Schedule Fee Updated" date, and update `asAt` and `checked`.
 */

const item = (n) => `https://www9.health.gov.au/mbs/fullDisplay.cfm?type=item&q=${n}`;

export const medicare = {
  /** The date the government last updated the schedule fees ("Schedule Fee Updated" on MBS Online). */
  asAt: '2026-07-01',
  /** The date someone last compared every amount below with MBS Online. */
  checked: '2026-10-11',
  source: 'https://www9.health.gov.au/mbs/',
  sourceName: 'MBS Online',

  /** Better Access: individual sessions Medicare will pay a rebate on per calendar year (MBS note AN.0.78). */
  sessionsPerYear: 10,
  rulesSource: 'https://www9.health.gov.au/mbs/fullDisplay.cfm?type=note&q=AN.0.78&qt=noteID',

  /**
   * One row per registration type, for a session of at least 50 minutes (the
   * clinic's sessions are 50 minutes). The rebate is the same in the room and
   * by video; only the item number differs.
   */
  rebates: [
    {
      id: 'psychologist',
      label: 'Psychologist',
      detail: 'Focussed psychological strategies, at least 50 minutes',
      scheduleFee: 119.45,
      rebate: 101.55,
      items: { inRoom: '80110', video: '91170' },
    },
    {
      id: 'clinical-psychologist',
      label: 'Clinical psychologist',
      detail: 'Psychological therapy, at least 50 minutes',
      scheduleFee: 175.3,
      rebate: 149.05,
      items: { inRoom: '80010', video: '91167' },
    },
  ],

  /**
   * Assessment of a suspected complex neurodevelopmental disorder, such as
   * autism, for a person under 25 referred by a paediatrician or psychiatrist.
   * Up to four services per course, eight per lifetime (MBS note MN.10.1).
   * Stated on /fees/ as a pathway only: whether the clinic bills it is a
   * question for the clinic.
   */
  neurodevelopmental: {
    item: '82000',
    maxAge: 25,
    rebate: 101.55,
  },
};

/** The MBS Online page for one item number. */
export function itemUrl(itemNumber) {
  return item(itemNumber);
}

/** "$101.55" — rebates are always shown to the cent. */
export function formatRebate(amount) {
  return `$${amount.toFixed(2)}`;
}

/** "1 July 2026" */
export function formatAsAt(isoDate) {
  return new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${isoDate}T00:00:00Z`));
}

/**
 * Whether the rebate data is still within twelve months of `asAt` on `today`.
 * Calendar months, not 365 days, so the boundary is the same date next year.
 */
export function rebatesAreCurrent(data, today = new Date()) {
  const asAt = new Date(`${data.asAt}T00:00:00Z`);
  const limit = new Date(asAt);
  limit.setUTCFullYear(limit.getUTCFullYear() + 1);
  return today.getTime() <= limit.getTime();
}

/** Throws, and so fails the build, when the rebate amounts are more than a year old. */
export function assertRebatesCurrent(data = medicare, today = new Date()) {
  if (!rebatesAreCurrent(data, today)) {
    throw new Error(
      `Medicare rebates in src/data/medicare.js are dated ${data.asAt}, more than twelve months ` +
        `before ${today.toISOString().slice(0, 10)}. Check every item on ${data.source} and update ` +
        `the amounts, asAt and checked before building.`
    );
  }
}
