import assert from "node:assert/strict";
import test from "node:test";
import { readFile, readdir, stat } from "node:fs/promises";

/**
 * Image weight, alt text and the favicon (issue #36, register rows R-13 to
 * R-15). The 300 KB ceiling is the audit's limit for any single image a page
 * loads; the frame sequences under `assets/rooms` and `assets/turntable` are
 * the house experience's own and are handled by #43.
 */

const root = new URL("../", import.meta.url);
const LIMIT = 300 * 1024;
const IMAGE = /\.(webp|avif|png|jpe?g|gif|svg)$/i;

test("no image under public/assets/media is over 300 KB", async () => {
  const dir = new URL("public/assets/media/", root);
  const heavy = [];
  for (const name of await readdir(dir)) {
    if (!IMAGE.test(name)) continue;
    const { size } = await stat(new URL(name, dir));
    if (size > LIMIT) heavy.push(`${name} (${Math.round(size / 1024)} KB)`);
  }
  assert.deepEqual(heavy, [], `re-encode these at their displayed size: ${heavy.join(", ")}`);
});

test("public/favicon.ico carries 16, 32 and 48 px images", async () => {
  const ico = await readFile(new URL("public/favicon.ico", root));
  // ICONDIR: reserved 0, type 1 (icon), then the image count.
  assert.equal(ico.readUInt16LE(0), 0);
  assert.equal(ico.readUInt16LE(2), 1);
  const count = ico.readUInt16LE(4);
  // Each ICONDIRENTRY is 16 bytes; a width byte of 0 means 256.
  const widths = Array.from({ length: count }, (_, i) => ico[6 + i * 16] || 256);
  assert.deepEqual(widths.sort((a, b) => a - b), [16, 32, 48]);
});

test("every layout links the favicon", async () => {
  for (const file of ["src/layouts/PlainLayout.astro", "src/pages/house.astro"]) {
    const src = await readFile(new URL(file, root), "utf8");
    assert.match(src, /rel="icon"[^>]*withBase\("\/favicon\.ico"\)/, file);
  }
});

/**
 * Empty alt text is right only for an image that adds nothing a screen reader
 * user would miss. Each one below was reviewed in #36: either the same link
 * already names the person or page, or the image is a decorative twin of one
 * that is described. A new `alt=""` must be reviewed and added here, or given
 * a description.
 */
const DECORATIVE = {
  // The lift car on the side rail: ornament beside the floor links.
  "src/components/SideRail.astro": 1,
  // The illustrated twin of a portrait, aria-hidden over the photograph.
  "src/components/PersonPortrait.astro": 1,
  // The team card's portrait link is aria-hidden; the name link follows.
  "src/components/PersonCard.astro": 1,
  // Home page: room art inside a link whose heading names the page, and
  // faces inside a link that carries the person's name. Plus three vignettes
  // (the reading nook, the coat rack, the garden gate) that carry no
  // information the words beside them do not.
  "src/pages/index.astro": 5,
  // The telephone over "Talk to us" and the garden strip on the footer rule:
  // atmosphere only, next to a heading and links that say everything.
  "src/layouts/PlainLayout.astro": 2,
  // The object beside each service link (a teddy, two teacups): the link
  // beside it already names the page.
  "src/components/ServiceList.astro": 1,
  // The section objects on /therapy/ and /assessments/: each stands beside a
  // heading and words that say everything.
  "src/components/Vignette.astro": 1,
};

async function* astroFiles(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const url = new URL(entry.name + (entry.isDirectory() ? "/" : ""), dir);
    if (entry.isDirectory()) yield* astroFiles(url);
    else if (entry.name.endsWith(".astro")) yield url;
  }
}

test("empty alt text appears only on reviewed decorative images", async () => {
  const found = {};
  for await (const url of astroFiles(new URL("src/", root))) {
    const count = ((await readFile(url, "utf8")).match(/\balt=""/g) ?? []).length;
    if (count) found[url.href.slice(root.href.length)] = count;
  }
  assert.deepEqual(found, DECORATIVE);
});
