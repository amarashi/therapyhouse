/**
 * The rules for library articles, as plain functions so `node --test` can
 * check them without Astro (the same reason src/lib/services.js exists).
 */
import { businessId } from './services.js';
import { TITLE_MAX } from './seo.js';

/** Where an article lives. One function, so a link and a route never disagree. */
export function articlePath(id) {
  return `/library/${id}/`;
}

/** Newest first; ties broken by title so the order never depends on the disk. */
export function sortArticles(entries) {
  return [...entries].sort(
    (a, b) => b.data.date - a.data.date || a.data.title.localeCompare(b.data.title, 'en-AU')
  );
}

/**
 * Articles cut into years, newest year first. The one structure this content
 * genuinely has is its chronology, so the year is the group marker.
 */
export function groupByYear(entries) {
  const groups = [];
  for (const entry of sortArticles(entries)) {
    const year = String(entry.data.date.getUTCFullYear());
    const current = groups.at(-1);
    if (current?.year === year) current.items.push(entry);
    else groups.push({ year, items: [entry] });
  }
  return groups;
}

/**
 * The document title: the heading with the clinic's name when that fits in a
 * search result, the heading alone when only that fits, and otherwise the
 * article's own `documentTitle`. A title that fits none of these is a build
 * error rather than one cut off mid-phrase in search results.
 */
export function articleDocumentTitle(id, data, siteName = 'Therapy House') {
  if (data.documentTitle) return data.documentTitle;
  const full = `${data.title} | ${siteName}`;
  if (full.length <= TITLE_MAX) return full;
  if (data.title.length <= TITLE_MAX) return data.title;
  throw new Error(`Article "${id}" needs a documentTitle of ${TITLE_MAX} characters or fewer.`);
}

const isoDate = (date) => date.toISOString().slice(0, 10);

/**
 * `BlogPosting` structured data for one article.
 *
 * The publisher is the clinic, by reference to the site-wide business node.
 * The author is the named team member when the byline names one; otherwise
 * the clinic itself, because the Current Site published these under its name
 * and inventing a person would be a claim the page does not make.
 */
export function articleSchema(data, { url, origin, imageUrl, author }) {
  const business = { '@id': businessId(origin) };
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${url}#article`,
    headline: data.title,
    description: data.description,
    url,
    mainEntityOfPage: url,
    datePublished: isoDate(data.date),
    ...(data.updated ? { dateModified: isoDate(data.updated) } : {}),
    ...(imageUrl ? { image: imageUrl } : {}),
    articleSection: data.category,
    inLanguage: 'en-AU',
    author: author
      ? { '@type': 'Person', name: author.name, url: author.url, worksFor: business }
      : business,
    publisher: business,
  };
}
