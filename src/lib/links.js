/**
 * Links to pages that may not exist yet.
 *
 * The SEO launch builds about thirty pages in parallel, and many of them link
 * to each other: /fees/ links to /ndis/ and /telehealth/, the Telehealth Room
 * links to /adults/ and /therapy/couples/. A link written before its target is
 * merged would be a 404 on the preview. So a page asks which addresses are
 * really built, and links a name only when the page behind it exists — the
 * link appears by itself on the next build after the target lands.
 *
 * Plain functions so `node --test` can check them; the `.astro` page supplies
 * the file list with `import.meta.glob`, which only exists under Vite.
 */
import { servicePath } from './services.js';

/**
 * The address a file under src/pages/ is served at, or null for a dynamic
 * route ("[slug].astro"), whose addresses come from a collection instead.
 *   /src/pages/fees.astro            -> /fees/
 *   /src/pages/telehealth/index.astro -> /telehealth/
 *   /src/pages/index.astro           -> /
 */
export function pagePathFromFile(file) {
  const rel = file.replace(/\\/g, '/').replace(/^.*\/pages\//, '');
  if (rel.includes('[')) return null;
  const bare = rel.replace(/\.(astro|md|mdx|html)$/, '').replace(/(^|\/)index$/, '');
  if (bare === '404') return null;
  return bare === '' ? '/' : `/${bare}/`;
}

/**
 * Every address the build will produce from page files plus service entries.
 * `serviceEntries` should already have drafts filtered out for production.
 */
export function builtPaths(pageFiles, serviceEntries = []) {
  const paths = new Set();
  for (const file of pageFiles) {
    const path = pagePathFromFile(file);
    if (path) paths.add(path);
  }
  for (const entry of serviceEntries) {
    // Therapy, assessment and audience hub (/adults/, /children/) pages.
    paths.add(servicePath(entry.data.kind, entry.id));
  }
  return paths;
}
