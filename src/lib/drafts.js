/**
 * The "Show on the live website" switch (issue #95), in one place.
 *
 * Every entry (a service, an article, a town, a team member) and every
 * repeatable item inside a page (a fee row, an assessment package, a group
 * program, a home route card) can carry `draft: true`. A draft is built on the
 * Preview, where the clinic reviews it, and left out of the production build,
 * so staff can switch something off without deleting it.
 *
 * Every page, layout and list that decides what a visitor sees goes through
 * these functions rather than testing `draft` itself, so a list can never
 * disagree with another list about what is switched off. Plain functions, so
 * `node --test` can load them (it cannot load `astro:content`).
 */

/**
 * Whether a build is for the clinic's real domain.
 *
 * The same hostname test the preview `noindex` uses in PlainLayout: GitHub
 * Pages is the preview and anything else is production. Reading the
 * configured site rather than an environment flag means there is no second
 * switch to forget on launch day — pointing `astro.config.mjs` at
 * therapyhouse.com.au flips this and the noindex together.
 */
export function isProductionSite(site) {
  if (!site) return false;
  const hostname = typeof site === 'string' ? new URL(site).hostname : site.hostname;
  return !hostname.endsWith('github.io');
}

/**
 * Whether one entry's data, or one item inside a page, is shown by this build.
 * Drafts are visible on the preview and absent from production. A draft that
 * leaked into production would be something nobody signed off.
 */
export function includeInBuild(data, production) {
  return !(data?.draft && production);
}

/**
 * The items of a page's list (fee rows, packages, programs, routes) that this
 * build shows, in their order. A missing list is an empty one.
 */
export function shownItems(items, production) {
  return (items ?? []).filter((item) => includeInBuild(item, production));
}

/**
 * The collection entries (`{ id, data }`) this build shows. The same rule as
 * `getCollection(name, (entry) => includeInBuild(entry.data, production))`,
 * for entries that arrive another way: `getEntries` on a reference list, such
 * as a service's `clinicians`. Unknown references (`undefined`) are dropped.
 */
export function shownEntries(entries, production) {
  return (entries ?? []).filter((entry) => entry && includeInBuild(entry.data, production));
}

/**
 * Whether a Markdown file's front matter switches it off (`draft: true`).
 * For code that runs before Astro has loaded the collections, such as the
 * sitemap filter in astro.config.mjs.
 */
export function isDraftFrontMatter(frontMatter) {
  return /^draft:\s*true\s*$/m.test(frontMatter);
}
