/**
 * What the sitemap leaves out, as plain functions so `node --test` can check
 * them and astro.config.mjs can use them before any page is built.
 *
 * The sitemap lists pages a search engine should index. Left out:
 * - pages switched off with `draft: true` ("Show on the live website": built
 *   on the Preview for review, never in production): services, team members,
 *   articles and town pages;
 * - redirect stubs (the small pages Astro writes for `redirects` in the config);
 * - the 404 page.
 * The house experience's `?from=` and `?room=` variants are never separate
 * pages, so they cannot appear; the sitemap lists the bare `/house/` only.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { articlePath } from './articles.js';
import { isDraftFrontMatter } from './drafts.js';
import { servicePath } from './services.js';
import { townPath } from './towns.js';

/**
 * Site paths of the draft entries in one collection folder, read from their
 * Markdown front matter. `pathOf(id, field)` gives an entry's address, where
 * `field(name)` reads one plain `name: value` line; returning null means the
 * entry has no page of its own. Only those lines are read; the schema in
 * src/content.config.ts is what validates the rest.
 */
function draftsIn(dir, pathOf) {
  return readdirSync(dir)
    .filter((file) => file.endsWith('.md'))
    .flatMap((file) => {
      const frontMatter = readFileSync(join(dir, file), 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/);
      if (!frontMatter || !isDraftFrontMatter(frontMatter[1])) return [];
      const field = (name) => frontMatter[1].match(new RegExp(`^${name}:\\s*['"]?([^'"\\s]+)`, 'm'))?.[1];
      const path = pathOf(file.replace(/\.md$/, ''), field);
      return path ? [path] : [];
    });
}

/** Site paths of every draft service page, from src/content/services. */
export function draftServicePaths(dir) {
  return draftsIn(dir, (id, field) => servicePath(field('kind'), id, field('path')));
}

/**
 * Site paths of every draft page under the content folder (src/content):
 * services, team members, articles and town pages. A town `section` has no
 * page of its own, so it is not listed.
 */
export function draftPaths(contentDir) {
  return [
    ...draftServicePaths(join(contentDir, 'services')),
    ...draftsIn(join(contentDir, 'team'), (id) => `/team/${id}/`),
    ...draftsIn(join(contentDir, 'articles'), (id) => articlePath(id)),
    ...draftsIn(join(contentDir, 'towns'), (id, field) => (field('kind') === 'page' ? townPath(id) : null)),
  ];
}

/** `/services` and `/services/` are the same page; compare with the slash. */
const withSlash = (path) => (path.endsWith('/') ? path : `${path}/`);

/**
 * The `filter` for @astrojs/sitemap. It is given full URLs that include the
 * deploy base (`https://amarashi.github.io/therapyhouse/team/`), so the base
 * is stripped before comparing with the clean site paths in `excluded`.
 */
export function sitemapFilter({ base, excluded }) {
  const prefix = base.replace(/\/+$/, '');
  const skip = new Set(['/404/', ...excluded].map(withSlash));
  return (page) => {
    let path = new URL(page).pathname;
    if (prefix && path.startsWith(`${prefix}/`)) path = path.slice(prefix.length);
    return !skip.has(withSlash(path));
  };
}
