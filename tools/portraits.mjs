/**
 * The web ladder for every team portrait — photograph and illustrated twin.
 *
 * Supersedes `pix-thumbs.mjs`, which only handled the illustrations and only
 * emitted one width. Both halves of a portrait share a component, a box and a
 * `sizes` attribute, so they belong to one ladder.
 *
 * Two steps, because there are only two boxes on the site:
 *
 *   280w — the thumbnails. 130px on a team card, ~172px on the home page.
 *          Covers every desktop at 1x and the cards on a phone.
 *   560w — the profile photograph, which paints at 288px, and the 2x step for
 *          the thumbnails above.
 *
 * Nothing on the site paints a portrait wider than 288 CSS px, so 560 is the
 * top of the ladder. Three photographs arrived from the old site at ~1080px
 * and were being shipped at that size into a 130px square; their originals now
 * live in `art-src/team-photo/` and the served file is the 560 step like every
 * other.
 *
 * Sources, in order of preference:
 *   art-src/team-pix/<name>-pix.png     illustrated masters (~2 MB each)
 *   art-src/team-photo/<name>.webp      the photographs, as delivered
 *
 * There were never photographic masters — the webp in `public/` was the
 * original. So the first run of this script moves each one into
 * `art-src/team-photo/` and encodes from there, which is what keeps a second
 * run from re-encoding its own output and stacking artefacts.
 *
 * Re-run after adding a person:
 *   node tools/portraits.mjs
 *
 * A person added through the CMS needs none of this: their one upload in
 * `src/assets/team/` is turned into the missing files by the build (see
 * src/lib/team-portraits.js). Files written here are hand-made and win.
 *
 * sharp comes in with Astro, so there is no dependency to add.
 */
import { createRequire } from 'node:module';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/* sharp is Astro's dependency, not ours, so under pnpm it is only reachable
   from inside Astro's own package directory. */
const sharp = createRequire(createRequire(import.meta.url).resolve('astro/package.json'))('sharp');

const PIX_SRC = 'art-src/team-pix';
const PHOTO_SRC = 'art-src/team-photo';
const OUT = 'public/assets/team';

/** The `-280` step, and the bare filename as the 560 step — see the header. */
const THUMB = 280;
const FULL = 560;

/* The illustrations are flat-shaded renders and hold up at a lower quality
   than a photograph does; the photographs are already once-encoded, so they
   get the gentler setting to avoid stacking artefacts. `effort: 6` is slower
   to encode and smaller to download, which is the right trade for a build
   step that runs when someone joins the clinic. */
const PIX_QUALITY = 72;
const PHOTO_QUALITY = 76;
const EFFORT = 6;

let before = 0;
let after = 0;

async function ladder(sourcePath, base) {
  // Read once: for the photographs the destination directory is where the
  // master used to live, and sharp will not stream a file onto itself.
  const source = readFileSync(sourcePath);
  const rows = [];
  for (const [width, name] of [
    [THUMB, `${base}-${THUMB}.webp`],
    [FULL, `${base}.webp`],
  ]) {
    const info = await sharp(source)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: base.endsWith('-pix') ? PIX_QUALITY : PHOTO_QUALITY, effort: EFFORT })
      .toFile(join(OUT, name));
    after += info.size;
    rows.push(`${info.width}x${info.height} ${(info.size / 1024).toFixed(1)}KB`);
  }
  return rows;
}

const people = new Set();
for (const file of readdirSync(OUT)) {
  const match = file.match(/^(.+?)(-pix)?\.webp$/);
  if (match && !/-\d+\.webp$/.test(file)) people.add(match[1]);
}

for (const person of [...people].sort()) {
  for (const suffix of ['', '-pix']) {
    const base = person + suffix;
    const served = join(OUT, `${base}.webp`);
    let master = join(PIX_SRC, `${base}.png`);

    if (!suffix) {
      master = join(PHOTO_SRC, `${base}.webp`);
      if (!existsSync(master) && existsSync(served)) {
        mkdirSync(PHOTO_SRC, { recursive: true });
        copyFileSync(served, master);
      }
    }
    if (!existsSync(master)) continue;

    before += existsSync(served) ? statSync(served).size : 0;
    const rows = await ladder(master, base);
    console.log(`${base.padEnd(28)} ${rows.join('   ')}`);
  }
}

console.log(
  `\n${((before) / 1024).toFixed(0)}KB served before -> ${(after / 1024).toFixed(0)}KB across both steps.`
);
