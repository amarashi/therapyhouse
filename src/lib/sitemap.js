/**
 * What the sitemap leaves out, as plain functions so `node --test` can check
 * them and astro.config.mjs can use them before any page is built.
 *
 * The sitemap lists pages a search engine should index. Left out:
 * - service pages marked `draft: true` (built on the Preview for review, never
 *   in production);
 * - redirect stubs (the small pages Astro writes for `redirects` in the config);
 * - the 404 page.
 * The house experience's `?from=` and `?room=` variants are never separate
 * pages, so they cannot appear; the sitemap lists the bare `/house/` only.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { servicePath } from './services.js';

/**
 * Site paths of every draft service page, read from the Markdown front matter
 * in `dir` (src/content/services). Only `draft:` and `kind:` are read; the
 * schema in src/content.config.ts is what validates the rest.
 */
export function draftServicePaths(dir) {
  return readdirSync(dir)
    .filter((file) => file.endsWith('.md'))
    .flatMap((file) => {
      const frontMatter = readFileSync(join(dir, file), 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/);
      if (!frontMatter || !/^draft:\s*true\s*$/m.test(frontMatter[1])) return [];
      const kind = frontMatter[1].match(/^kind:\s*['"]?(\w+)/m)?.[1];
      return kind === 'hub' ? [] : [servicePath(kind, file.replace(/\.md$/, ''))];
    });
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
