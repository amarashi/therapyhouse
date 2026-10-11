/**
 * Makes the missing team portrait files from the one photograph a person's
 * upload provides (issue #96). Runs at the start of both `astro dev` and
 * `astro build`, before any page renders, so the files are in `public/` when
 * Astro copies it into the build. What is made, and why, is in
 * src/lib/team-portraits.js.
 */
import { fileURLToPath } from 'node:url';

import { generateTeamPortraits } from '../lib/team-portraits.js';

export function teamPortraits() {
  return {
    name: 'therapyhouse:team-portraits',
    hooks: {
      /** @param {{ config: { root: URL }, logger: { info: (message: string) => void } }} options */
      'astro:config:setup': async ({ config, logger }) => {
        const written = await generateTeamPortraits(fileURLToPath(config.root));
        if (written.length) logger.info(`team portraits generated: ${written.join(', ')}`);
      },
    },
  };
}
