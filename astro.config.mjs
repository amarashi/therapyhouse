// @ts-check
import { defineConfig } from 'astro/config';

// Therapy House — static site.
//
// Step 1 of the migration is parity: the existing hand-written experience runs
// unchanged. Its stylesheet, ES modules and ~100 MB of frame sequences all live
// under `public/`, so Astro copies them through untouched and every existing
// `assets/...` URL still resolves. Nothing is bundled or rewritten yet.
//
// The plain content pages come next, and those are the ones that must ship zero
// JavaScript — hence static output and no framework integration here.

/* Where a build is going. The Preview (GitHub Pages) is the default; set
   DEPLOY_TARGET=production for the clinic's own domain, which is how launch
   day builds and how `tests/production-build.test.mjs` checks the launch
   shape on every `pnpm test`.

   The target is chosen with an environment variable rather than with
   `astro build --site … --base /` on purpose. On Windows, Git Bash rewrites a
   bare `/` argument into its own install path (`C:/Program Files/Git/`), and
   with that base no dynamic route can match its own pages, so the build dies
   with "Missing parameter: slug" (issue #24). */
const TARGETS = {
  preview: { site: 'https://amarashi.github.io', base: '/therapyhouse' },
  production: { site: 'https://www.therapyhouse.com.au', base: '/' },
};
const targetName = process.env.DEPLOY_TARGET || 'preview';
const target = TARGETS[/** @type {keyof typeof TARGETS} */ (targetName)];
if (!target) {
  throw new Error(
    `Unknown DEPLOY_TARGET "${targetName}". Use one of: ${Object.keys(TARGETS).join(', ')}.`
  );
}

/* One value for both the base and the redirect destinations: Astro does not
   prefix a redirect's destination with `base`, so a bare '/therapy' would send
   a preview visitor to the domain root. */
const base = target.base;

/* A base that is not a plain URL path (a drive letter, a backslash) is the
   shell-rewritten `--base /` described above. Stop with a message that names
   the cause instead of failing later on an unrelated-looking route. */
const guardBase = {
  name: 'therapyhouse:guard-base',
  hooks: {
    /** @param {{ config: { base: string } }} options */
    'astro:config:done': ({ config }) => {
      if (!config.base.startsWith('/') || /[:\\]/.test(config.base)) {
        throw new Error(
          `base is "${config.base}", which is not a URL path. A shell such as Git Bash ` +
            'rewrites `--base /`; build with DEPLOY_TARGET=production instead.'
        );
      }
    },
  },
};

export default defineConfig({
  // The Preview is published to GitHub Pages as a project site, so it hangs
  // off the `/therapyhouse` prefix rather than a domain root. `base` is what
  // every internal URL is built from — see `src/lib/base.js` — and it is also
  // what the legacy `/house` experience hands its scripts via
  // `__ASSET_BASE__`. Production is the domain root.
  site: target.site,
  base,
  integrations: [guardBase],
  output: 'static',
  /* Opt-in only: the rail's links carry `data-astro-prefetch`, so hovering a
     floor both calls the lift and fetches that floor. By the time the car has
     travelled and the page has faded, the next one is already in the cache —
     which is what keeps a deliberate transition from becoming a wait. Nothing
     else on the site prefetches. */
  prefetch: true,
  /* Addresses that moved inside the Rebuild. On GitHub Pages Astro writes a
     small page that forwards the visitor; on Cloudflare the same moves become
     real 301s, listed in docs/redirects.md for the launch redirect map. */
  redirects: {
    '/services': `${base.replace(/\/$/, '')}/therapy/`,
  },
  build: {
    // Emit `/services/index.html` rather than `/services.html` so the live URLs
    // match the WordPress paths we are inheriting (and their redirects).
    format: 'directory',
  },
});
