import assert from "node:assert/strict";
import test from "node:test";
import { access } from "node:fs/promises";

import { volumes, books, videos, youtubeChannel } from "../src/data/library-shelf.js";

const root = new URL("../", import.meta.url);
const publicFile = (path) => new URL(`public${path}`, root);

const exists = async (path) => {
  try {
    await access(publicFile(path));
    return true;
  } catch {
    return false;
  }
};

/* The shelf and the list underneath it read the same records, so a volume that
   is missing an asset is a volume that renders as a blank object on the shelf
   *and* a broken image in the list. Both consumers fail together, which is why
   this is checked once here rather than in either of them. */
test("every volume ships the artwork both the shelf and the list need", async () => {
  for (const volume of volumes) {
    const art = volume.kind === "book" ? volume.cover : volume.thumbnail;
    assert.ok(art, `${volume.id} should carry artwork`);
    assert.ok(await exists(art), `${volume.id} is missing ${art}`);
  }
});

test("every book's interior spreads are present", async () => {
  for (const book of books) {
    assert.ok(book.spreads?.length, `${book.id} should publish at least one spread`);
    for (const spread of book.spreads) {
      assert.ok(await exists(spread.image), `${book.id} is missing ${spread.image}`);
      assert.ok(spread.label, `${book.id} spread ${spread.image} needs a label for the page counter`);
    }
  }
});

/* Facts on this page are the ones the clinic has actually published — a page
   count, a trim size, a price. An empty string reads as a published fact that
   happens to be blank, which is worse than an absent row. */
test("published facts are real values, not empty rows", () => {
  for (const volume of volumes) {
    for (const fact of volume.facts ?? []) {
      assert.ok(fact.term?.trim(), `${volume.id} has a fact with no term`);
      assert.ok(fact.value?.trim(), `${volume.id} fact "${fact.term}" has no value`);
    }
  }
});

test("every volume can be reached without the shelf", () => {
  for (const volume of volumes) {
    const href = volume.kind === "book" ? volume.action?.href : volume.href;
    assert.ok(href, `${volume.id} needs a link that works with no script`);
    assert.ok(
      href.startsWith("https://") || href.startsWith("mailto:"),
      `${volume.id} link should be absolute or a mailto, got ${href}`
    );
    if (volume.kind === "book") {
      assert.ok(volume.action.label?.trim(), `${volume.id} needs an action label`);
    }
  }
});

/* A non-English title with no language tag is read aloud in English by a screen
   reader and rendered in the wrong direction. The gloss is what lets an English
   reader know what they are choosing. */
test("Persian titles carry a language tag and an English gloss", () => {
  for (const volume of volumes) {
    const hasArabicScript = /[؀-ۿ]/.test(volume.title);
    if (!hasArabicScript) continue;
    assert.equal(volume.titleLang, "fa", `${volume.id} should declare lang="fa"`);
    assert.ok(volume.gloss?.trim(), `${volume.id} should carry an English gloss`);
  }
});

test("the geometry the renderer reads is complete and positive", () => {
  for (const volume of volumes) {
    for (const axis of ["width", "height", "depth"]) {
      assert.equal(typeof volume[axis], "number", `${volume.id} needs a numeric ${axis}`);
      assert.ok(volume[axis] > 0, `${volume.id} ${axis} should be positive`);
    }
    for (const tone of ["wall", "floor", "light"]) {
      assert.match(
        volume.palette?.[tone] ?? "",
        /^#[0-9a-f]{6}$/i,
        `${volume.id} palette.${tone} should be a hex colour`
      );
    }
  }
});

/* The four Persian-language personal videos and the deleted Theory of Mind
   interview are deliberately off the shelf. If one is re-added it should be a
   decision, not a paste. */
test("the videos left off the shelf stay off", () => {
  const excluded = ["u1I282WHrtg", "6YFSEEwAHgI", "Y_LS55isu1w", "eM5wFSX0-KM", "ovUEyzBagPo"];
  for (const id of excluded) {
    assert.ok(
      !videos.some((video) => video.id === id),
      `${id} was excluded on purpose — see the note in library-shelf.js`
    );
  }
  assert.ok(youtubeChannel.startsWith("https://www.youtube.com/"), "the channel link should reach YouTube");
});

test("ids are unique, since the renderer seeds its textures from them", () => {
  const ids = volumes.map((volume) => volume.id);
  assert.equal(new Set(ids).size, ids.length, "duplicate volume id");
});
