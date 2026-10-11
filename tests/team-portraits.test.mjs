import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildSite } from "../tools/build-site.mjs";
import { generateTeamPortraits, portraitName, teamPortrait } from "../src/lib/team-portraits.js";

/**
 * Team portraits from one upload (issue #96). Clinic staff add a person
 * through the CMS with a single photograph; the build makes the 560 and 280
 * steps of the photo and of its illustrated twin, and a hand-made file always
 * wins over a generated one.
 */

const root = fileURLToPath(new URL("..", import.meta.url));
const sharp = createRequire(createRequire(join(root, "package.json")).resolve("astro/package.json"))("sharp");

/** A phone-shaped photograph: taller than the site's portraits and much bigger. */
const photo = () =>
  sharp({ create: { width: 1200, height: 1800, channels: 3, background: "#a07850" } }).jpeg().toBuffer();

/* Read into memory: sharp holds files it opens, which on Windows stops the
   scratch folders from being removed. */
const metadata = (file) => sharp(readFileSync(file)).metadata();
const widthOf = async (file) => (await metadata(file)).width;

test("an upload's file name becomes the portrait name the image field uses", () => {
  assert.equal(portraitName("/assets/team/Jane Doe.JPG"), "jane-doe");
  assert.equal(portraitName("/assets/team/samson.webp"), "samson");
  assert.equal(portraitName("IMG_2041 (1).jpeg"), "img-2041-1");
});

test("the build fills only the sizes nobody made by hand", async () => {
  const scratch = mkdtempSync(join(tmpdir(), "therapyhouse-portraits-"));
  try {
    mkdirSync(join(scratch, "src/assets/team"), { recursive: true });
    mkdirSync(join(scratch, "public/assets/team"), { recursive: true });
    writeFileSync(join(scratch, "src/assets/team/New Starter.jpg"), await photo());
    writeFileSync(join(scratch, "src/assets/team/drawn.png"), await photo());
    // Someone already drawn by hand: their photograph and illustration stay.
    writeFileSync(join(scratch, "public/assets/team/drawn.webp"), "hand-made");
    writeFileSync(join(scratch, "public/assets/team/drawn-pix.webp"), "hand-made");

    const written = await generateTeamPortraits(scratch);
    assert.deepEqual(written.sort(), [
      "drawn-280.webp",
      "drawn-pix-280.webp",
      "new-starter-280.webp",
      "new-starter-pix-280.webp",
      "new-starter-pix.webp",
      "new-starter.webp",
    ]);

    const fresh = teamPortrait("/assets/team/New Starter.jpg", scratch);
    assert.deepEqual(fresh, {
      photo: "/assets/team/generated/new-starter.webp",
      photo280: "/assets/team/generated/new-starter-280.webp",
      pix: "/assets/team/generated/new-starter-pix.webp",
      pix280: "/assets/team/generated/new-starter-pix-280.webp",
    });
    const generated = join(scratch, "public/assets/team/generated");
    assert.equal(await widthOf(join(generated, "new-starter.webp")), 560);
    assert.equal(await widthOf(join(generated, "new-starter-280.webp")), 280);
    assert.equal((await metadata(join(generated, "new-starter.webp"))).height, 760);

    assert.deepEqual(teamPortrait("/assets/team/drawn.png", scratch), {
      photo: "/assets/team/drawn.webp",
      photo280: "/assets/team/generated/drawn-280.webp",
      pix: "/assets/team/drawn-pix.webp",
      pix280: "/assets/team/generated/drawn-pix-280.webp",
    });
    assert.equal(readFileSync(join(scratch, "public/assets/team/drawn.webp"), "utf8"), "hand-made");

    // Nothing changed, so a second run (an `astro dev` restart) encodes nothing.
    assert.deepEqual(await generateTeamPortraits(scratch), []);

    // An upload that is removed takes its generated files with it.
    rmSync(join(scratch, "src/assets/team/New Starter.jpg"));
    await generateTeamPortraits(scratch);
    assert.ok(!existsSync(join(generated, "new-starter.webp")));
    assert.equal(teamPortrait("/assets/team/New Starter.jpg", scratch).photo, null);
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
});

/* ---- A real build with a person who has nothing but an upload ---- */

const SLUG = "portrait-fixture";
const entry = join(root, "src/content/team", `${SLUG}.md`);
const upload = join(root, "src/assets/team", "Portrait Fixture.JPG");
let out;

function removeFixture() {
  rmSync(entry, { force: true });
  rmSync(upload, { force: true });
  for (const suffix of ["", "-280", "-pix", "-pix-280"]) {
    rmSync(join(root, "public/assets/team/generated", `${SLUG}${suffix}.webp`), { force: true });
  }
}

before(async () => {
  removeFixture();
  mkdirSync(join(root, "src/assets/team"), { recursive: true });
  writeFileSync(upload, await photo());
  writeFileSync(
    entry,
    [
      "---",
      'name: "Portrait Fixture"',
      'role: "Test fixture"',
      "kind: support",
      "order: 99",
      'image: "/assets/team/Portrait Fixture.JPG"',
      'imageAlt: "Portrait of the test fixture"',
      'summary: "A person who exists only for the duration of one test build."',
      "---",
      "",
      "Added and removed by tests/team-portraits.test.mjs.",
      "",
    ].join("\n")
  );
  try {
    out = buildSite("preview");
  } finally {
    removeFixture();
  }
});

after(() => {
  removeFixture();
  if (out) rmSync(out, { recursive: true, force: true });
});

test("a team member with only an uploaded photo gets all four sizes in the build", async () => {
  const dir = join(out, "assets/team/generated");
  const widths = {};
  for (const suffix of ["", "-280", "-pix", "-pix-280"]) {
    const file = join(dir, `${SLUG}${suffix}.webp`);
    assert.ok(existsSync(file), `the build has no ${SLUG}${suffix}.webp`);
    widths[suffix] = await widthOf(file);
  }
  assert.deepEqual(widths, { "": 560, "-280": 280, "-pix": 560, "-pix-280": 280 });

  // The upload itself is a source file, not something a visitor downloads.
  assert.ok(!existsSync(join(out, "assets/team/Portrait Fixture.JPG")));
});

test("the uploaded person's pages point at the generated sizes", () => {
  const prefix = "/therapyhouse/assets/team/generated";
  const profile = readFileSync(join(out, "team", SLUG, "index.html"), "utf8");
  assert.ok(
    profile.includes(`${prefix}/${SLUG}-280.webp 280w, ${prefix}/${SLUG}.webp 560w`),
    "the profile photo's srcset should be the two generated steps"
  );

  const team = readFileSync(join(out, "team", "index.html"), "utf8");
  assert.ok(team.includes(`${prefix}/${SLUG}-pix-280.webp 280w, ${prefix}/${SLUG}-pix.webp 560w`));
  assert.ok(team.includes(`${prefix}/${SLUG}-280.webp 280w, ${prefix}/${SLUG}.webp 560w`));

  // Hand-made portraits are still served from where they always were.
  assert.ok(team.includes("/therapyhouse/assets/team/kaya-beinke-pix-280.webp 280w"));
});
