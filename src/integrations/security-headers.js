/**
 * Writes `_headers` into the build output once every page exists, so the
 * Content-Security-Policy can list the hash of each inline script. What the
 * file says is defined in src/lib/security-headers.js.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { headersFile, inlineScriptHashes } from '../lib/security-headers.js';

function htmlFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return htmlFiles(full);
    return entry.name.endsWith('.html') ? [full] : [];
  });
}

export function securityHeaders() {
  let base = '/';
  return {
    name: 'therapyhouse:security-headers',
    hooks: {
      /** @param {{ config: { base: string } }} options */
      'astro:config:done': ({ config }) => {
        base = config.base;
      },
      /** @param {{ dir: URL, logger: { info: (message: string) => void } }} options */
      'astro:build:done': ({ dir, logger }) => {
        const out = fileURLToPath(dir);
        const pages = htmlFiles(out).map((file) => readFileSync(file, 'utf8'));
        const scriptHashes = inlineScriptHashes(pages);
        writeFileSync(join(out, '_headers'), headersFile({ base, scriptHashes }));
        logger.info(`_headers written with ${scriptHashes.length} inline script hashes`);
      },
    },
  };
}
