/**
 * Writes Cloudflare's `_redirects` into the build output from
 * docs/redirects.md (issue #41). The build stops if the map has a duplicate
 * source, a chain or a loop, so a broken map can never be deployed.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { mapProblems, parseRedirectsDoc, redirectsFile } from '../lib/redirects.js';

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
      /** @param {{ dir: URL, logger: { info: (message: string) => void } }} options */
      'astro:build:done': ({ dir, logger }) => {
        const rules = parseRedirectsDoc(readFileSync(doc, 'utf8'));
        const problems = mapProblems(rules);
        if (problems.length) {
          throw new Error(`docs/redirects.md cannot be published:\n- ${problems.join('\n- ')}`);
        }
        writeFileSync(join(fileURLToPath(dir), '_redirects'), redirectsFile(rules, base));
        logger.info(`_redirects written with ${rules.length} rules from docs/redirects.md`);
      },
    },
  };
}
