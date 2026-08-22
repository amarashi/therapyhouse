/**
 * The web ladder for the room illustrations.
 *
 * Every plain page opens on one of these, so on six of the site's pages this
 * file *is* the largest contentful paint — which makes its encoding a load-time
 * decision rather than an asset-pipeline one. Masters are the 1448px renders in
 * `art-src/rooms/`; nothing serves them directly.
 *
 * Three steps:
 *
 *   360w  — the home page's "What we do" thumbnails
 *   724w  — phones and tablets (`-720` in the filename, which is what the
 *           pages already reference)
 *  1448w  — the masters' native width, and the top of the ladder because the
 *           hero never paints wider than ~1150 CSS px
 *
 * Quality 78: the previous files were encoded around 82 and were 250–295 KB
 * apiece. These are soft-shaded illustrations with no fine texture to lose, so
 * the step down is invisible at any size the page paints them and takes about
 * 70 KB off each page's LCP.
 *
 * Re-run after re-rendering a room:
 *   node tools/rooms.mjs
 */
import { createRequire } from 'node:module';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/* sharp is Astro's dependency, not ours, so under pnpm it is only reachable
   from inside Astro's own package directory. */
const sharp = createRequire(createRequire(import.meta.url).resolve('astro/package.json'))('sharp');

const SRC = 'art-src/rooms';
const OUT = 'public/assets/rooms';
const QUALITY = 78;
const EFFORT = 6;

/** `[width, filename suffix]` — the suffix is what the pages already ask for. */
const STEPS = [
  [360, '-360'],
  [724, '-720'],
  [1448, ''],
];

let before = 0;
let after = 0;

for (const file of readdirSync(SRC).filter((f) => f.endsWith('.png')).sort()) {
  const base = file.replace(/\.png$/, '');
  const rows = [];

  for (const [width, suffix] of STEPS) {
    const out = join(OUT, `${base}${suffix}.webp`);
    if (existsSync(out)) before += statSync(out).size;
    const info = await sharp(join(SRC, file))
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: QUALITY, effort: EFFORT })
      .toFile(out);
    after += info.size;
    rows.push(`${String(info.width).padStart(4)}w ${(info.size / 1024).toFixed(0)}KB`);
  }

  console.log(`${base.padEnd(26)} ${rows.join('   ')}`);
}

console.log(`\n${(before / 1024).toFixed(0)}KB -> ${(after / 1024).toFixed(0)}KB across the ladder.`);
