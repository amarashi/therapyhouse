/**
 * Writes Cloudflare's `_redirects` into the build output from
 * docs/redirects.md (issue #41). The build stops if the map has a duplicate
 * source, a chain or a loop, or if a redirect would land on a page this build
 * does not have (issue #90), so a broken map can never be deployed.
 *
 * Drafts are left out of production, so a line whose target is a draft is
 * written as a 302 (temporary) to its fallback until the page is signed off
 * (see `settleRules` in src/lib/redirects.js). Runs after the sitemap
 * integration, so `/sitemap-index.xml` already exists when targets are checked.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { builtIn, mapProblems, parseRedirectsDoc, redirectsFile, settleRules } from '../lib/redirects.js';

const doc = fileURLToPath(new URL('../../docs/redirects.md', import.meta.url));

export function redirectsFileIntegration() {
  let base = '/';
  return {
    name: 'therapyhouse:redirects-file',
    hooks: {
      /** @param {{ config: { base: string } }} options */
      'astro:config:done': ({ config }) => {
        base = config.base;
      },
      /** @param {{ dir: URL, logger: { info: (message: string) => void, warn: (message: string) => void } }} options */
      'astro:build:done': ({ dir, logger }) => {
        const out = fileURLToPath(dir);
        const table = parseRedirectsDoc(readFileSync(doc, 'utf8'));
        const settled = settleRules(table, builtIn(out));
        const problems = [...mapProblems(table), ...settled.problems];
        if (problems.length) {
          throw new Error(`docs/redirects.md cannot be published:\n- ${problems.join('\n- ')}`);
        }
        writeFileSync(join(out, '_redirects'), redirectsFile(settled.rules, base));
        for (const f of settled.fallbacks) {
          logger.warn(`${f.from} -> ${f.to} 302 until ${f.waitingFor} is built`);
        }
        logger.info(
          `_redirects written with ${settled.rules.length} rules from docs/redirects.md ` +
            `(${settled.fallbacks.length} temporary fallbacks)`
        );
      },
    },
  };
}
