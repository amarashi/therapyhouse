/**
 * Everything a visitor reads inside the illustrated house, built from the
 * files the plain pages read (docs/house-plan.md, phase A).
 *
 * The house's scripts live in `public/assets/scripts/` and are served as-is,
 * so they cannot import `src/`. Before this module the house kept its own
 * copy of the team, the services, the articles and the philosophy, scraped
 * from the WordPress site, and the copy drifted: eight "offerings" against
 * seventeen therapy pages, no telehealth, no adult pages. Now
 * `src/pages/house.astro` calls `houseContent()` at build time with the
 * collections and writes the result into the page as JSON, and
 * `content-data.js` reads it. Whatever staff change in the CMS reaches the
 * house on the next build.
 *
 * The house previews and the plain pages explain. Every preview is a few
 * lines (a sentence or two, a short list) and ends with a link to the page
 * that holds the whole answer. The only words written for the house itself
 * are the link labels, which staff edit in public/assets/content/house-copy.json.
 *
 * Plain functions over plain data, so `node --test` can build the same
 * previews from the Markdown files (it cannot load `astro:content`).
 */
import { articlePath } from './articles.js';
import { servicePath } from './services.js';
import { houseFacts, packagePrice } from './house-facts.js';
import { formatRebate } from '../data/medicare.js';
import { townPath } from './towns.js';

/** The id of the JSON script element in /house/ that `content-data.js` reads. */
export const HOUSE_CONTENT_ID = 'house-content';

/** How many lines a list in a preview shows before it leaves the rest to the page. */
export const PREVIEW_ITEMS = 6;

const short = (list, count = PREVIEW_ITEMS) => (list ?? []).slice(0, count);
/* A CMS sentence may carry a link written [words](/page/); a preview keeps the words. */
const plainWords = (text) => String(text ?? '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
const asDate = (value) => (value instanceof Date ? value : new Date(value));
const dateLabel = (value) =>
  asDate(value).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

/**
 * @typedef {object} Preview  What one sign in a room opens.
 * @property {string} [title]  Heading; left out, the pop-up uses the sign's own words.
 * @property {string} [meta]   A short fact under the heading: a price, an age range.
 * @property {string[]} [text] A sentence or two.
 * @property {Array<{title: string, detail?: string, href?: string}>} [items] A short list.
 * @property {{href: string, label: string}} link  The page that holds the full answer.
 */

/**
 * @param {object} input
 * @param {Record<string, any>} input.pages  Page front matter by page id
 *   (services, fees, assessments, group-therapy, library, philosophy,
 *   work-with-us, contact), already filtered for this build.
 * @param {Array<{id: string, data: any}>} input.services  Service entries this build shows.
 * @param {Array<{id: string, data: any}>} input.articles  Articles this build shows.
 * @param {Array<{id: string, data: any}>} input.team  Team entries this build shows.
 * @param {Array<{id: string, data: any}>} [input.towns]  Town entries this build shows.
 * @param {Array<{title: string, note?: string}>} input.books
 * @param {Array<{title: string}>} input.videos
 * @param {any} input.clinic  public/assets/content/clinic.json
 * @param {Record<string, string>} input.links  house-copy.json `links`
 * @param {any} input.medicare  src/data/medicare.js `medicare`
 * @param {(path: string) => string} [input.href]  Adds the site's base to a path.
 * @param {(image: string) => string} [input.portrait]  A team `image` to the URL of its photograph.
 */
export function houseContent({
  pages,
  services,
  articles,
  team,
  towns = [],
  books = [],
  videos = [],
  clinic,
  links,
  medicare,
  href = (path) => path,
  portrait = (image) => image,
}) {
  const page = (id) => {
    if (!pages[id]) throw new Error(`houseContent: no page "${id}"`);
    return pages[id];
  };
  const label = (key) => {
    if (!links?.[key]) throw new Error(`house-copy.json has no link label "${key}"`);
    return links[key];
  };
  const to = (path, key) => ({ href: href(path), label: label(key) });

  const servicesPage = page('services');
  const feesPage = page('fees');
  const assessmentsPage = page('assessments');
  const groupsPage = page('group-therapy');
  const libraryPage = page('library');
  const philosophyPage = page('philosophy');
  const workPage = page('work-with-us');
  const telehealthPage = page('telehealth');

  const facts = houseFacts({
    fees: feesPage.fees ?? [],
    sessionLength: feesPage.sessionLength,
    privateHealth: feesPage.privateHealth,
    packages: assessmentsPage.packages ?? [],
    medicare,
  });

  const serviceHref = (id) => {
    const entry = services.find((candidate) => candidate.id === id);
    return entry ? servicePath(entry.data.kind, entry.id, entry.data.path) : undefined;
  };
  /* The audience pages (/children/, /adults/) first, then each therapy. */
  const serviceItem = (entry) => ({ title: entry.data.h1, href: href(servicePath(entry.data.kind, entry.id, entry.data.path)) });
  const byTitle = (a, b) => a.title.localeCompare(b.title, 'en-AU');
  const therapies = [
    ...services.filter((entry) => entry.data.kind === 'hub').map(serviceItem).sort(byTitle),
    ...services.filter((entry) => entry.data.kind === 'therapy').map(serviceItem).sort(byTitle),
  ];

  const people = [...team].sort((a, b) => a.data.order - b.data.order);
  const profile = (entry) => href(`/team/${entry.id}/`);

  /** @type {Record<string, Preview>} */
  const previews = {};

  /* ---- Team parlour ---- */
  previews['team.availability'] = {
    items: people
      .filter((entry) => entry.data.kind === 'practitioner' && entry.data.availability)
      .map((entry) => ({ title: entry.data.name, detail: entry.data.availability, href: profile(entry) })),
    link: to('/team/', 'team'),
  };
  previews['team.dogs'] = {
    items: people
      .filter((entry) => entry.data.kind === 'dog')
      .map((entry) => ({ title: entry.data.name, detail: entry.data.summary, href: profile(entry) })),
    link: to('/team/', 'team'),
  };

  /* ---- Consulting room ---- */
  previews['services.offerings'] = {
    text: [servicesPage.lede],
    items: therapies,
    link: to('/therapy/', 'therapy'),
  };
  previews['services.therapyModels'] = {
    items: (servicesPage.therapyModels ?? []).map((title) => ({ title })),
    link: { href: href(serviceHref('approaches') ?? '/therapy/'), label: label('approaches') },
  };
  previews['services.fees'] = {
    text: feesPage.sessionLength ? [feesPage.sessionLength] : [],
    items: (feesPage.fees ?? [])
      .filter((row) => !row.adjustment)
      .map((row) => ({ title: row.label, detail: row.amount })),
    link: to('/fees/', 'fees'),
  };
  previews['services.rebates'] = {
    text: facts.rebates,
    link: to('/fees/', 'fees'),
  };
  previews['services.reports'] = {
    text: short(servicesPage.reports, 2),
    link: to('/fees/', 'fees'),
  };

  /* ---- Assessment room ---- */
  previews['assessments.process'] = {
    text: [assessmentsPage.lede],
    items: short(assessmentsPage.process, 3).map((title) => ({ title })),
    link: to('/assessments/', 'assessments'),
  };
  previews['assessments.documents'] = {
    items: (assessmentsPage.documents ?? []).map((title) => ({ title })),
    link: to('/assessments/', 'assessments'),
  };
  for (const pkg of assessmentsPage.packages ?? []) {
    if (!pkg.id) continue;
    const key = pkg.addOn ? `assessments.${pkg.id}` : `assessments.packages.${pkg.id}`;
    previews[key] = {
      title: pkg.title,
      meta: packagePrice(pkg),
      ...(pkg.description ? { text: [pkg.description] } : {}),
      ...(pkg.inclusions?.length ? { items: pkg.inclusions.map((title) => ({ title })) } : {}),
      link: to('/assessments/', 'assessments'),
    };
  }
  previews['assessments.faq'] = {
    text: short(assessmentsPage.goodToKnow, 3),
    link: to('/assessments/', 'assessments'),
  };

  /* ---- Group room ---- */
  const programs = groupsPage.programs ?? [];
  previews['groups.overview'] = {
    text: [groupsPage.lede],
    items: programs.map((program) => ({ title: program.title, detail: program.audience })),
    link: to('/group-therapy/', 'groups'),
  };
  for (const program of programs) {
    if (!program.id) continue;
    previews[`groups.programs.${program.id}`] = {
      title: program.title,
      ...(program.audience ? { meta: program.audience } : {}),
      text: [program.description],
      link: to('/group-therapy/', 'groups'),
    };
  }
  if (groupsPage.circleOfSecurity) {
    const circle = groupsPage.circleOfSecurity;
    previews['groups.circleOfSecurity'] = {
      title: circle.title,
      ...(circle.audience ? { meta: circle.audience } : {}),
      text: [circle.description],
      items: circle.details.map((title) => ({ title })),
      link: { href: href(serviceHref('circle-of-security') ?? '/group-therapy/'), label: label('circleOfSecurity') },
    };
  }
  previews['groups.workshops'] = {
    items: (groupsPage.workshopTopics ?? []).map((title) => ({ title })),
    link: to('/group-therapy/', 'groups'),
  };

  /* ---- Library ---- */
  const newest = [...articles].sort(
    (a, b) => asDate(b.data.date) - asDate(a.data.date) || a.data.title.localeCompare(b.data.title, 'en-AU')
  );
  previews['library.blogArticles'] = {
    items: short(newest, 5).map((entry) => ({
      title: entry.data.title,
      detail: dateLabel(entry.data.date),
      href: href(articlePath(entry.id)),
    })),
    link: to('/library/', 'library'),
  };
  previews['library.products'] = {
    items: books.map((book) => ({ title: book.title, ...(book.note ? { detail: book.note } : {}) })),
    link: to('/library/', 'library'),
  };
  previews['library.videos'] = {
    items: short(videos).map((video) => ({ title: video.title })),
    link: to('/library/', 'library'),
  };
  previews['library.publications'] = {
    text: libraryPage.publicationsNote ? [libraryPage.publicationsNote] : [libraryPage.lede],
    link: to('/library/', 'library'),
  };
  previews['library.media'] = {
    items: short(libraryPage.mediaItems).map((title) => ({ title })),
    link: to('/library/', 'library'),
  };

  /* ---- Philosophy attic ---- */
  const principles = philosophyPage.principles ?? [];
  previews.philosophy = {
    title: philosophyPage.title,
    text: [philosophyPage.lede],
    items: principles.map((principle) => ({ title: principle.title })),
    link: to('/philosophy/', 'philosophy'),
  };
  principles.forEach((principle, index) => {
    previews[`philosophy.principles.${index}`] = {
      title: principle.title,
      text: [principle.body],
      link: to('/philosophy/', 'philosophy'),
    };
  });

  /* ---- Welcome room: finding the clinic ----
     Booking, calling and email have their own pop-up (the contact window in
     house.astro); this sign is the address and the parking. */
  previews['contact.findUs'] = {
    text: [clinic.address, ...short(clinic.intro, 2)],
    link: {
      href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinic.address)}`,
      label: label('map'),
    },
  };

  /* ---- Work with us ---- */
  previews['workWithUs.opportunities'] = { text: [workPage.lede], link: to('/work-with-us/', 'workWithUs') };
  previews['workWithUs.culture'] = { text: short(workPage.culture, 2), link: to('/work-with-us/', 'workWithUs') };
  previews['workWithUs.values'] = {
    items: (workPage.values ?? []).map((title) => ({ title })),
    link: to('/work-with-us/', 'workWithUs'),
  };
  previews['workWithUs.enquiry'] = {
    text: [clinic.email],
    link: { href: `mailto:${clinic.email}`, label: label('email') },
  };

  /* ---- Telehealth room (docs/house-plan.md, phase D) ----
     Every sign leads to /telehealth/, the page written for people who will
     see a psychologist by video and may never see the house. The Medicare
     sentence states figures, so it is written here beside them, as the
     /telehealth/ template writes its own (PRODUCT.md: the rebate is stated
     plainly wherever fees are discussed). */
  const tele = telehealthPage.telehealthText ?? {};
  const toTelehealth = (hash = '') => ({ href: href(`/telehealth/${hash}`), label: label('telehealth') });
  previews['telehealth.process'] = {
    title: tele.processHeading,
    text: [telehealthPage.lede],
    items: short(telehealthPage.process, 3).map((title) => ({ title })),
    link: toTelehealth(),
  };
  previews['telehealth.medicare'] = {
    title: tele.medicareHeading,
    text: [
      'Medicare pays the same rebate for a video session as for a session in the room. With a referral and ' +
        `a Mental Health Treatment Plan from your GP, Medicare pays back part of the fee for up to ${medicare.sessionsPerYear} ` +
        'individual sessions a calendar year.',
    ],
    items: medicare.rebates.map((row) => ({ title: row.label, detail: `${formatRebate(row.rebate)} a session` })),
    link: toTelehealth('#medicare'),
  };
  previews['telehealth.regional'] = {
    title: tele.regionalHeading,
    text: [tele.regionalText],
    items: towns
      .filter((entry) => entry.data.kind === 'page')
      .map((entry) => ({ title: entry.data.h1, href: href(townPath(entry.id)) }))
      .sort((a, b) => a.title.localeCompare(b.title, 'en-AU')),
    link: toTelehealth(),
  };
  previews['telehealth.clinicians'] = {
    title: tele.cliniciansHeading,
    text: [plainWords(tele.cliniciansText)],
    items: people
      .filter((entry) => entry.data.kind === 'practitioner')
      .map((entry) => ({ title: entry.data.name, detail: entry.data.availability ?? entry.data.role, href: profile(entry) })),
    link: toTelehealth('#who'),
  };
  previews['telehealth.booking'] = {
    title: tele.bookingHeading,
    text: [plainWords(tele.bookingText)],
    link: toTelehealth('#booking'),
  };

  /* The team carousel: everyone this build shows, in the team page's order. */
  const carousel = people.map((entry) => ({
    id: entry.id,
    name: entry.data.name,
    role: entry.data.role,
    image: portrait(entry.data.image),
    imageAlt: entry.data.imageAlt,
    summary: entry.data.summary,
    ...(entry.data.availability ? { availability: entry.data.availability } : {}),
    href: profile(entry),
  }));

  return { previews, team: carousel, profileLabel: label('profile') };
}

/** The JSON for a `<script type="application/json">`, safe against a stray "</script>". */
export function houseContentJson(content) {
  return JSON.stringify(content).replace(/</g, '\\u003c');
}
