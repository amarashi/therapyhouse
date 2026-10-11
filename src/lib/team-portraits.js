/**
 * Team portraits from one upload (issue #96).
 *
 * Every portrait on the site is four files: the photograph at 560 wide, its
 * 280 step, and the same two for the illustrated twin (`-pix`). They used to
 * be made by hand with `tools/portraits.mjs`. Clinic staff adding a person
 * through the CMS upload one photograph, so the build makes whatever is
 * missing:
 *
 *   src/assets/team/<photo>.<jpg|png|webp|…>   the upload (never served)
 *   public/assets/team/<name><suffix>.webp      hand-made — always wins
 *   public/assets/team/generated/…              made by the build (gitignored)
 *
 * `<name>` is the photograph's file name without its extension, lower-cased,
 * with anything that is not a letter or digit turned into a dash. The team
 * entry's `image` field names the portrait the same way: only the file name
 * counts, so `/assets/team/samson.webp` (hand-made) and
 * `/assets/team/Jane Doe.JPG` (a CMS upload) both work.
 *
 * The illustrated twins are drawn, not computed: each is a hand-made render
 * from a master in `art-src/team-pix/`. The build cannot draw one, so for an
 * upload the `-pix` files are the photograph itself at the same two sizes.
 * Drop a real `-pix` pair into `public/assets/team/` later and it wins.
 *
 * Paths are relative to the project root, which is the working directory for
 * `astro build`, `astro dev` and `pnpm test` alike (PersonPortrait has always
 * relied on that).
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { basename, extname, join } from 'node:path';

/** Where the CMS writes the one photograph per person. */
export const UPLOAD_DIR = 'src/assets/team';
const SERVED_DIR = 'public/assets/team';
const GENERATED_DIR = 'public/assets/team/generated';

/**
 * The four files a portrait needs. The photographs on the site are 560x760, so
 * an upload is cropped to that shape; the boxes that paint it are square
 * (`object-fit: cover`), so a few pixels either way do not matter.
 */
export const PORTRAIT_SIZES = [
  { key: 'photo', suffix: '', width: 560 },
  { key: 'photo280', suffix: '-280', width: 280 },
  { key: 'pix', suffix: '-pix', width: 560 },
  { key: 'pix280', suffix: '-pix-280', width: 280 },
];
const ASPECT = 760 / 560;

/** File types sharp can read without extra codecs. HEIC needs a licence it does not ship with. */
const ORIGINAL = /\.(jpe?g|png|webp|avif|tiff?|gif)$/i;

/** Same settings as `tools/portraits.mjs` uses for the photographs. */
const QUALITY = 76;

/** The portrait name a file or `image` path stands for. */
export function portraitName(file) {
  return basename(file, extname(file))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Every upload, keyed by portrait name. */
function uploads(root) {
  const dir = join(root, UPLOAD_DIR);
  const found = new Map();
  if (!existsSync(dir)) return found;
  for (const file of readdirSync(dir).sort()) {
    if (ORIGINAL.test(file)) found.set(portraitName(file), join(dir, file));
  }
  return found;
}

/**
 * The site paths (no base prefix) of a portrait's four files, for the team
 * entry's `image` field. A hand-made file is used where it exists; otherwise
 * the generated one, if there is an upload to make it from; otherwise `null`.
 *
 * This answers from the source files alone, so it gives the same answer
 * whether or not the build has generated anything yet.
 *
 * @param {string} image The entry's `image` field.
 * @returns {{ photo: string|null, photo280: string|null, pix: string|null, pix280: string|null }}
 */
export function teamPortrait(image, root = process.cwd()) {
  const name = portraitName(image);
  const hasUpload = uploads(root).has(name);
  const portrait = {};
  for (const { key, suffix } of PORTRAIT_SIZES) {
    const file = `${name}${suffix}.webp`;
    if (existsSync(join(root, SERVED_DIR, file))) portrait[key] = `/assets/team/${file}`;
    else if (hasUpload) portrait[key] = `/assets/team/generated/${file}`;
    else portrait[key] = null;
  }
  return /** @type {any} */ (portrait);
}

/**
 * Write every missing portrait file for every upload into the generated
 * folder. A file is only re-encoded when its upload is newer, so `astro dev`
 * restarts stay quick; files whose upload has gone are removed.
 *
 * @returns {Promise<string[]>} The files written, relative to the generated folder.
 */
export async function generateTeamPortraits(root = process.cwd()) {
  const outDir = join(root, GENERATED_DIR);
  const wanted = new Set();
  const written = [];
  let sharp;

  for (const [name, original] of uploads(root)) {
    const changed = statSync(original).mtimeMs;
    let source;
    for (const { suffix, width } of PORTRAIT_SIZES) {
      const file = `${name}${suffix}.webp`;
      if (existsSync(join(root, SERVED_DIR, file))) continue;
      wanted.add(file);
      const target = join(outDir, file);
      if (existsSync(target) && statSync(target).mtimeMs >= changed) continue;

      /* sharp is Astro's dependency, not ours, so under pnpm it is only
         reachable from inside Astro's own package directory. Found from the
         working directory (the project), not `root`, so a test can point
         `root` at a scratch folder. */
      sharp ??= createRequire(
        createRequire(join(process.cwd(), 'package.json')).resolve('astro/package.json')
      )('sharp');
      mkdirSync(outDir, { recursive: true });
      /* Read into memory first: sharp keeps a file it opened itself in its
         cache, which on Windows locks the upload until the process exits. */
      source ??= readFileSync(original);
      await sharp(source)
        .rotate() // phone photos carry their orientation in EXIF
        .resize({
          width,
          height: Math.round(width * ASPECT),
          fit: 'cover',
          position: sharp.strategy.attention,
          withoutEnlargement: true,
        })
        .webp({ quality: QUALITY, effort: 4 })
        .toFile(target);
      written.push(file);
    }
  }

  if (existsSync(outDir)) {
    for (const file of readdirSync(outDir)) {
      if (!wanted.has(file)) rmSync(join(outDir, file), { force: true });
    }
  }
  return written;
}
