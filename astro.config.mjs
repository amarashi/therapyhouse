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
export default defineConfig({
  // Published to GitHub Pages as a project site, so the whole thing hangs off
  // the `/therapyhouse` prefix rather than a domain root. `base` is what every
  // internal URL is built from — see `src/lib/base.js` — and it is also what
  // the legacy `/house` experience hands its scripts via `__ASSET_BASE__`.
  // Swap these two lines for `site: 'https://www.therapyhouse.com.au'` with no
  // `base` on the day the custom domain is pointed here.
  site: 'https://amarashi.github.io',
  base: '/therapyhouse',
  output: 'static',
  /* Opt-in only: the rail's links carry `data-astro-prefetch`, so hovering a
     floor both calls the lift and fetches that floor. By the time the car has
     travelled and the page has faded, the next one is already in the cache —
     which is what keeps a deliberate transition from becoming a wait. Nothing
     else on the site prefetches. */
  prefetch: true,
  build: {
    // Emit `/services/index.html` rather than `/services.html` so the live URLs
    // match the WordPress paths we are inheriting (and their redirects).
    format: 'directory',
  },
});
