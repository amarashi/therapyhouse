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
  site: 'https://www.therapyhouse.com.au',
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
