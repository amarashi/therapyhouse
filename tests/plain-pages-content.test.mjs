import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { siteContent } from "../public/assets/scripts/content-data.js";
import houseCopy from "../public/assets/content/house-copy.json" with { type: "json" };
import { teamPortrait, UPLOAD_DIR } from "../src/lib/team-portraits.js";
import { frontmatter, readableText, splitMarkdown } from "./helpers/markdown.mjs";
import { DESCRIPTION_MAX, TITLE_MAX } from "../src/lib/seo.js";

const root = fileURLToPath(new URL("..", import.meta.url));

/**
 * The house and the plain pages are two presentations of one content model.
 * These tests guard the seam: if a fee changes in `content-data.js` but not in
 * the page's frontmatter (or the reverse), a parent could be quoted one price
 * in a room and a different price on the page it links to.
 *
 * Sentences are looked for in the page's readable text (tests/helpers/
 * markdown.mjs) rather than in the raw file, because Pages CMS re-wraps long
 * front matter values when staff save a page.
 */

const readPage = async (name) =>
  readFile(fileURLToPath(new URL(`../src/content/pages/${name}.md`, import.meta.url)), "utf8");

const services = await readPage("services");
const assessments = await readPage("assessments");
// The fee table moved from /therapy/ (services.md) to /fees/ in issue #30.
const fees = await readPage("fees");
const servicesText = readableText(services);
const assessmentsText = readableText(assessments);
const feesText = readableText(fees);

test("services page lists every service offering from the content model", () => {
  for (const offering of siteContent.services.offerings) {
    assert.ok(
      servicesText.includes(offering),
      `services.md is missing the offering: ${offering}`
    );
  }
});

test("services page lists every therapy model from the content model", () => {
  for (const model of siteContent.services.therapyModels) {
    assert.ok(servicesText.includes(model), `services.md is missing the therapy model: ${model}`);
  }
});

// Fees, rebates and assessment prices are no longer copied into
// content-data.js: the house reads them from fees.md, assessments.md and
// src/data/medicare.js (issue #80). tests/house-facts.test.mjs guards that.

test("the therapy hub no longer carries its own fee table", () => {
  assert.ok(!/^fees:/m.test(services), "services.md still has a fees block; fees live in fees.md");
});

test("every report note reaches the fees page", () => {
  for (const note of siteContent.services.reports) {
    const plain = note.replace(/\.$/, "");
    assert.ok(feesText.includes(plain), `fees.md is missing: ${note.slice(0, 50)}…`);
  }
});

test("fees page title, H1 and description fit a search result and carry its phrase", () => {
  // Issue #30's phrase is "fees and Medicare rebates". The heading is the
  // clinic's to word; the search title (developer-set) and the description
  // must name both, and the page must open with the phrase.
  const { data, body } = splitMarkdown(fees);
  fitsSearchResult("fees", data.documentTitle, data.description);
  assert.ok(data.title?.trim(), "fees: no heading");
  assert.match(data.documentTitle, /fees/i);
  assert.match(data.documentTitle, /medicare rebates/i);
  assert.match(data.description, /Medicare rebates/i, 'fees: the description must contain "Medicare rebates"');

  const firstParagraph = body.trim().split(/\n\s*\n/)[0];
  assert.match(firstParagraph.replace(/\s+/g, " "), /fees and Medicare rebates/i, 'fees: the page text must open with "fees and Medicare rebates"');
});

test("the fees page states plainly that the clinic does not bulk bill", () => {
  assert.match(feesText, /(does not|doesn.t) bulk.?bill/i, "fees.md must still say the clinic does not bulk bill");
});

test("assessment process steps appear in order on the assessments page", () => {
  let cursor = 0;
  for (const step of siteContent.assessments.process) {
    const at = assessmentsText.indexOf(step, cursor);
    assert.notEqual(at, -1, `assessments.md is missing or misorders the step: ${step}`);
    cursor = at;
  }
});

test("assessment documents list is complete", () => {
  for (const doc of siteContent.assessments.documents) {
    assert.ok(assessmentsText.includes(doc), `assessments.md is missing the document: ${doc}`);
  }
});

test("every assessment package in the house is published on the assessments page", () => {
  // Joined by id, not title (issue #97): the house's key for a package is the
  // `id` of its item in assessments.md, so either title can be reworded.
  const keys = [...Object.keys(siteContent.assessments.packages), "schoolObservations"];
  assert.ok(keys.length > 1, "content model has no assessment packages");
  for (const key of keys) {
    assert.match(assessments, new RegExp(`^\\s*-?\\s*id: ${key}\\s*$`, "m"), `assessments.md has no package with id ${key}`);
  }
});

test("both calls to action reach every plain page", async () => {
  // PRODUCT.md: booking and calling carry equal weight, and neither is the
  // fallback for the other — so neither may be missing from a page.
  const layout = await readFile(
    fileURLToPath(new URL("../src/layouts/PlainLayout.astro", import.meta.url)),
    "utf8"
  );
  const cta = await readFile(
    fileURLToPath(new URL("../src/components/CallToAction.astro", import.meta.url)),
    "utf8"
  );
  const siteData = await readFile(
    fileURLToPath(new URL("../src/data/site.js", import.meta.url)),
    "utf8"
  );

  assert.ok(cta.includes("book.href") && cta.includes("call.href"), "CallToAction lost a path");
  // The link is worked out from the one phone number in clinic.json (issue #94).
  const { callsToAction, businessFacts } = await import("../src/data/site.js");
  assert.equal(callsToAction.call.href, "tel:+61733002170", "site.js lost the phone link");
  assert.equal(businessFacts.telephone, "+61-7-3300-2170");
  assert.ok(!siteData.includes("3300"), "site.js types out the phone number instead of reading clinic.json");
  assert.ok(
    siteData.includes("bookingUrl"),
    "site.js should read the booking URL from the content model, not hardcode it"
  );
  assert.ok(layout.includes("CallToAction"), "PlainLayout no longer renders the calls to action");
});

test("availability status is read correctly, including the negative case", async () => {
  const { isAcceptingNewClients } = await import("../src/data/site.js");

  // The trap: "Not currently accepting new clients" contains "accepting", so a
  // bare substring test reports the exact opposite of the truth — and a parent
  // would be told a booked-out practitioner is free.
  assert.equal(isAcceptingNewClients("Accepting new clients"), true);
  assert.equal(isAcceptingNewClients("Not currently accepting new clients"), false);
  assert.equal(isAcceptingNewClients("Active waitlist for new clients"), false);
  assert.equal(isAcceptingNewClients("On leave"), false);
  assert.equal(isAcceptingNewClients(undefined), false);
  assert.equal(isAcceptingNewClients(""), false);

  // Whatever the clinic writes, the house and the team profiles must agree on
  // who is accepting. Staff change statuses in the CMS, so this compares the
  // two copies rather than a fixed count: the house's list
  // (house-copy.json) and each person's own profile (src/content/team).
  const { readdir } = await import("node:fs/promises");
  const teamDir = fileURLToPath(new URL("../src/content/team", import.meta.url));
  // Only the people the house lists: someone new is on the team page before
  // a developer places them in the house.
  const inHouse = new Set(houseCopy.team.members.map((m) => m.id));
  const fromProfiles = new Set();
  for (const file of (await readdir(teamDir)).filter((f) => f.endsWith(".md"))) {
    const id = file.replace(/\.md$/, "");
    const md = await readFile(`${teamDir}/${file}`, "utf8");
    const status = md.match(/^availability:\s*"?([^"\r\n]+?)"?\s*$/m)?.[1];
    if (inHouse.has(id) && isAcceptingNewClients(status)) fromProfiles.add(id);
  }
  const fromHouse = new Set(
    houseCopy.team.availability.filter((a) => isAcceptingNewClients(a.status)).map((a) => a.id)
  );
  assert.ok(fromProfiles.size > 0, "nobody is accepting new clients — check the parse");
  assert.deepEqual(
    [...fromHouse].sort(),
    [...fromProfiles].sort(),
    "house-copy.json (House > Team) and the team profiles disagree on who is accepting new clients"
  );
});

test("every team member has a profile file with a photo that exists", async () => {
  const entries = await teamImages();
  // Staff add people through the CMS, and switch them off rather than delete
  // them (the CMS does not offer delete), so the count only ever grows. The
  // twelve below are the people the site launched with.
  const files = entries.map((e) => e.file);
  for (const id of LAUNCH_TEAM) assert.ok(files.includes(`${id}.md`), `the team profile ${id}.md is missing`);

  for (const { file, image } of entries) {
    assert.ok(image, `${file} has no image path`);
    assert.ok(
      teamPortrait(image, root).photo,
      `${file} points at a missing photo: ${image} is neither in public/assets/team/ nor uploaded to ${UPLOAD_DIR}/`
    );
  }
});

const LAUNCH_TEAM = [
  "amelia-shay", "kaya-beinke", "letitia-mcvey", "sahar-fattahi", "rani-banks", "jazmin-squire",
  "laura-storey", "genevieve-hussey", "natasha", "josie", "reea", "samson",
];

/** Each team entry's `image` field. A CMS may write it quoted or bare. */
async function teamImages() {
  const { readdir } = await import("node:fs/promises");
  const teamDir = fileURLToPath(new URL("../src/content/team", import.meta.url));
  const files = (await readdir(teamDir)).filter((f) => f.endsWith(".md"));
  return Promise.all(
    files.map(async (file) => {
      const md = await readFile(`${teamDir}/${file}`, "utf8");
      return { file, image: md.match(/^image:\s*"?([^"\n]+?)"?\s*$/m)?.[1] };
    })
  );
}

test("every team photo has its illustrated twin beside it", async () => {
  // The card opens as the illustration and dissolves to the photograph on
  // hover. A missing `-pix.webp` fails silently — the card just renders the
  // photo — so the way this goes wrong is one person quietly not taking part.
  // Usually it means a new master landed in art-src/team-pix/ and nobody ran
  // `node tools/portraits.mjs`. A CMS upload always has one: the build stands
  // the photograph in for the drawing (src/lib/team-portraits.js).
  for (const { file, image } of await teamImages()) {
    assert.ok(teamPortrait(image, root).pix, `${file} has no illustrated portrait for ${image}`);
  }
});

test("every portrait ships both steps of the responsive ladder", async () => {
  // `PersonPortrait` and the profile page publish `srcset="…-280.webp 280w,
  // ….webp 560w"`. A missing `-280` is the worst kind of broken: 2x screens
  // never ask for it, so it looks fine to whoever built it, and every 1x
  // visitor gets a blank square. Run `node tools/portraits.mjs` after adding
  // anyone by hand; a CMS upload gets its steps from the build.
  for (const { file, image } of await teamImages()) {
    const portrait = teamPortrait(image, root);
    assert.ok(portrait.photo280, `${file} has no 280w step of its photo`);
    assert.ok(portrait.pix280, `${file} has no 280w step of its illustration`);
  }
});

test("the therapy dogs are not described as certified", async () => {
  // The clinic's own wording is that Reea is *not* a certified therapy dog.
  // Publishing a "Therapy Dog" credential next to that would contradict it.
  const reea = await readFile(
    fileURLToPath(new URL("../src/content/team/reea.md", import.meta.url)),
    "utf8"
  );
  assert.ok(
    /not (a )?certified/i.test(readableText(reea)),
    "reea.md must still say she is not certified"
  );
  assert.ok(!/^credentials:/m.test(reea), "reea.md must not claim a therapy-dog credential");
});

test("plain pages read contact details from the content model, not copies", async () => {
  const siteData = await readFile(
    fileURLToPath(new URL("../src/data/site.js", import.meta.url)),
    "utf8"
  );
  assert.ok(
    siteData.includes("content-data.js"),
    "site.js must import from content-data.js so the phone number has one home"
  );
  assert.ok(
    !siteData.includes(siteContent.contact.email),
    "site.js hardcodes the email address instead of reading it from the content model"
  );
});

test("homepage route notes restate figures published on the pages they link to", async () => {
  // The notes under each route on the homepage exist so a parent knows roughly
  // what a route costs before clicking. They must never introduce a number of
  // their own — if a fee moves on the destination page, this fails.
  const home = await readPage("home");

  const noteFor = (title) => {
    const block = home.slice(home.indexOf(`- title: ${title}`));
    return block.match(/^\s+note: (.+)$/m)?.[1].trim();
  };

  // The Therapy route lands on /therapy/, whose fee link leads to /fees/.
  const therapy = noteFor("Therapy");
  for (const amount of therapy.match(/\$[\d,]+/g)) {
    assert.ok(
      fees.includes(amount),
      `homepage quotes ${amount} for therapy, which is not in the fees on fees.md`
    );
  }

  const assessment = noteFor("Assessments");
  for (const amount of assessment.match(/\$[\d,]+/g)) {
    assert.ok(
      assessments.includes(amount),
      `homepage quotes ${amount} for assessment, which is not on assessments.md`
    );
  }

  // Group programs have no published price, so the note carries ages instead.
  // A dollar figure appearing here would be invented.
  const groups = noteFor("Group programs");
  assert.equal(
    groups.match(/\$[\d,]+/g),
    null,
    "group programs have no published price; the homepage must not quote one"
  );
});

test("every group program still publishes an age range the scale can read", async () => {
  // The programs section lays the four age bands on one scale, and it builds
  // that scale by reading the numbers back out of the authored audience line
  // ("Children aged 7–12"). Reworded to "primary school age", a program would
  // silently drop off the scale and fall back to a pill — correct, but a
  // quieter failure than it deserves. Same pattern as the page's own.
  const groupTherapy = await readPage("group-therapy");
  const AGE_RANGE = /(\d+)\s*(?:–|—|-|to)\s*(\d+)/;

  const audiences = [...groupTherapy.matchAll(/^\s+audience:\s*(.+)$/gm)]
    .map((line) => line[1].trim())
    // The Circle of Security audience belongs to the parents' panel, which
    // carries a pill rather than a band and spans months rather than years.
    .filter((audience) => !audience.startsWith("Parents"));

  assert.ok(audiences.length > 1, "an age scale needs at least two programs on it");

  for (const audience of audiences) {
    const found = audience.match(AGE_RANGE);
    assert.ok(found, `no age range in "${audience}" — the program loses its band`);
    assert.ok(
      Number(found[2]) > Number(found[1]),
      `"${audience}" runs backwards; a band cannot be drawn from it`
    );
  }
});

/* ---- Assessment pages (issues #17 to #22) ----
   Each page's title, H1 and description are the ones its issue specifies:
   they were chosen for the searches the page is meant to answer, so a quiet
   edit should fail here rather than drift. Read as text, like the rest of
   this file. */

const readService = async (name) =>
  readFile(fileURLToPath(new URL(`../src/content/services/${name}.md`, import.meta.url)), "utf8");

const frontValue = (markdown, key) => frontmatter(markdown)[key];

/**
 * Search limits every page's title and description must keep. Staff reword
 * these in the CMS (issue #97), so the tests check the rules the SEO issues
 * set rather than the wording they started with: the length a search result
 * shows, and the phrase each page is written to be found by.
 */
const fitsSearchResult = (where, title, description) => {
  assert.ok(title?.trim(), `${where}: no title`);
  assert.ok(description?.trim(), `${where}: no description`);
  assert.ok(title.length <= TITLE_MAX, `${where}: the title is ${title.length} characters; ${TITLE_MAX} fit a search result`);
  assert.ok(
    description.length <= DESCRIPTION_MAX,
    `${where}: the description is ${description.length} characters; ${DESCRIPTION_MAX} fit a search result`
  );
};

/** Each assessment page's search phrase: in its title, H1, opening sentence and description. */
const assessmentPages = [
  { file: "child-adhd", phrase: "ADHD assessment" },
  { file: "child-autism", phrase: "autism assessment" },
  { file: "adult-adhd", phrase: "ADHD assessment" },
  { file: "adult-autism", phrase: "autism assessment" },
  { file: "learning", phrase: "dyslexia" },
  { file: "cognitive", phrase: "cognitive" },
];

test("the learning page has an anchored section for each learning disorder", async () => {
  const text = await readService("learning");
  for (const heading of ["Dyslexia", "Dysgraphia", "Dyscalculia"]) {
    assert.match(text, new RegExp(`^#+ ${heading}$`, "m"), `missing the ${heading} section`);
  }
});

test("adult assessment pages publish no fee until the clinic gives one", async () => {
  for (const file of ["adult-adhd", "adult-autism"]) {
    const text = await readService(file);
    assert.match(text, /^feeStatus: quote$/m, `${file} must say call for a quote`);
    assert.doesNotMatch(text.split(/^---$/m)[1], /^fees:/m, `${file} must not carry fee rows`);
  }
});

for (const page of assessmentPages) {
  test(`${page.file}: the title, H1 and description fit a search result`, async () => {
    const text = await readService(page.file);
    fitsSearchResult(page.file, frontValue(text, "title"), frontValue(text, "description"));
    assert.ok(frontValue(text, "h1")?.trim(), `${page.file}: no H1`);
  });

  test(`${page.file}: the target phrase is in the title, H1, opening and description`, async () => {
    const text = await readService(page.file);
    const has = (key) => (frontValue(text, key) ?? "").toLowerCase().includes(page.phrase.toLowerCase());
    for (const key of ["title", "h1", "lede", "description"]) {
      assert.ok(has(key), `${page.file}: the ${key} must contain "${page.phrase}"`);
    }
  });

  test(`${page.file}: every fee it shows is one /assessments/ already publishes`, async () => {
    const text = await readService(page.file);
    const front = text.split(/^---$/m)[1] ?? "";
    for (const amount of front.match(/\$[\d,]+/g) ?? []) {
      assert.ok(assessments.includes(amount), `${page.file} shows ${amount}, which assessments.md does not publish`);
    }
  });
}

test("service page titles and descriptions are unique across the site", async () => {
  const { readdir } = await import("node:fs/promises");
  const seen = new Map();
  for (const dir of ["services", "pages"]) {
    const base = new URL(`../src/content/${dir}/`, import.meta.url);
    for (const file of (await readdir(base)).filter((f) => f.endsWith(".md"))) {
      const text = await readFile(new URL(file, base), "utf8");
      for (const key of ["title", "documentTitle", "description"]) {
        const value = frontValue(text, key);
        if (!value) continue;
        const where = `${dir}/${file} ${key}`;
        // A title and a documentTitle compete in the same search result slot.
        const slot = `${key === "description" ? "description" : "title"}:${value}`;
        assert.ok(!seen.has(slot), `${where} repeats ${seen.get(slot)}`);
        seen.set(slot, where);
      }
    }
  }
});

/* ---- Service pages: the search phrase each issue chose ----
   One row per page. Staff may reword the title, H1 and description in the
   CMS; the target phrase must still reach the title, the description and the
   opening of the page (the lede or first paragraph), because that is what a
   search result and the first screen show. The same list is in the help text
   of .pages.yml (Therapy and assessment pages). */

/** The lede and the first paragraph of the body, lower-cased: the page's opening. */
const opening = (text) => {
  const body = text.split(/^---$/m).slice(2).join("---").trim();
  return `${frontValue(text, "lede")} ${body.split(/\n\s*\n/)[0]}`.replace(/\s+/g, " ").toLowerCase();
};

const SERVICE_PAGES = [
  {
    id: "adults",
    phrase: "psychologist for adults",
  },
  {
    id: "children",
    phrase: "child psychologist",
    h1Word: "children",
  },
  {
    id: "trauma",
    phrase: "trauma therapy",
    h1Word: "trauma",
  },
  {
    id: "anxiety",
    phrase: "anxiety psychologist",
    h1Word: "anxiety",
  },
  {
    id: "depression",
    phrase: "depression counselling",
    // The issue's description leads with the topic and the profession.
    descWords: ["depression", "psychologist"],
  },
  {
    id: "grief",
    phrase: "grief counselling",
    h1Word: "grief",
  },
  {
    id: "couples",
    phrase: "couples counselling",
    h1Word: "couples",
  },
  {
    id: "approaches",
    phrase: "cbt",
    h1Word: "therap",
  },
  {
    id: "ndis",
    phrase: "ndis psychologist",
    h1Word: "ndis",
    // The issue's description says "NDIS psychology".
    descWords: ["ndis", "psycholog"],
  },
  {
    id: "circle-of-security",
    phrase: "circle of security parenting program",
    h1Word: "circle of security",
  },
  {
    id: "family",
    phrase: "family therapy",
    h1Word: "family",
  },
];

test("approaches: every approach has the anchor the condition pages link to", async () => {
  const text = await readService("approaches");
  for (const id of ["cbt", "act", "emdr", "eft", "schema", "psychodynamic"]) {
    assert.match(text, new RegExp(`<h2 id="${id}">`), `approaches.md has no #${id} section`);
  }
});

test("couples: the fee and the Medicare line are the ones /fees/ publishes", async () => {
  const couples = await readService("couples");
  const fees = await readPage("fees");
  for (const amount of couples.split(/^---$/m)[1].match(/\$[\d,]+/g) ?? []) {
    assert.ok(fees.includes(amount), `couples.md shows ${amount}, which fees.md does not publish`);
  }
  assert.match(readableText(couples), /Medicare (does not|doesn.t) cover couple/i, "couples.md must still say Medicare does not cover couple and family sessions");
});

for (const page of SERVICE_PAGES) {
  test(`${page.id}: the title, H1 and description fit a search result and carry the page's phrase`, async () => {
    const text = (await readService(page.id)).replace(/\r\n/g, "\n");
    const title = frontValue(text, "title");
    const h1 = frontValue(text, "h1") ?? "";
    const description = frontValue(text, "description");
    fitsSearchResult(page.id, title, description);
    const phrase = page.phrase.toLowerCase();
    // Title and description: every word of the phrase (a plural still counts).
    for (const word of phrase.split(" ")) {
      assert.ok(title.toLowerCase().includes(word), `${page.id}: the title lacks "${word}" of "${page.phrase}"`);
    }
    for (const word of page.descWords ?? phrase.split(" ")) {
      assert.ok(description.toLowerCase().includes(word), `${page.id}: the description lacks "${word}" of "${page.phrase}"`);
    }
    const topic = page.h1Word ?? phrase.split(" ").at(-1);
    assert.ok(h1.toLowerCase().includes(topic), `${page.id}: the H1 must contain "${topic}"`);
    assert.ok(opening(text).includes(phrase), `the opening of ${page.id} lacks "${page.phrase}"`);
    // No second H1 in the body: the layout renders the only one.
    assert.ok(!/^# /m.test(text.split(/^---$/m).slice(2).join("---")), `${page.id} body has its own H1`);
  });
}

test("circle-of-security: keeps its Current Site address and the fees /group-therapy/ publishes", async () => {
  const cos = (await readService("circle-of-security")).replace(/\r\n/g, "\n");
  assert.match(cos, /^path: \/group-therapy\/circle-of-security-parenting-program\/$/m);
  const groups = await readPage("group-therapy");
  for (const amount of cos.split(/^---$/m)[1].match(/\$[\d,]+/g) ?? []) {
    assert.ok(groups.includes(amount), `circle-of-security.md shows ${amount}, which group-therapy.md does not publish`);
  }
});

test("group-therapy: title, H1 and description carry the phrases issue #15 chose", async () => {
  // "group therapy brisbane" and "therapy for emotional regulation".
  const { data, body } = splitMarkdown(await readPage("group-therapy"));
  fitsSearchResult("group-therapy", data.documentTitle, data.description);
  assert.ok(data.title?.trim(), "group-therapy: no heading");
  assert.match(data.documentTitle, /group therapy brisbane/i);
  assert.match(data.description, /emotion regulation/i, 'group-therapy: the description must contain "emotion regulation"');
  // The target phrase opens the body.
  assert.match(
    body.trim().split(/\n\s*\n/)[0].replace(/\s+/g, " "),
    /group therapy in The Gap, Brisbane/i,
    'group-therapy: the page text must open with "group therapy in The Gap, Brisbane"'
  );
});

test("group-therapy: links the Circle of Security page and the children's hub only where they are built", async () => {
  const source = await readFile(fileURLToPath(new URL("../src/pages/group-therapy.astro", import.meta.url)), "utf8");
  assert.match(source, /builtService\('circle-of-security'\)/);
  assert.match(source, /builtService\('children'\)/);
  assert.match(source, /includeInBuild\(/);
  assert.match(source, /serviceSchema\(/);
});

test("family: the fee and the Medicare line are the ones /fees/ publishes", async () => {
  const family = await readService("family");
  const fees = await readPage("fees");
  for (const amount of family.split(/^---$/m)[1].match(/\$[\d,]+/g) ?? []) {
    assert.ok(fees.includes(amount), `family.md shows ${amount}, which fees.md does not publish`);
  }
  assert.match(readableText(family), /Medicare (does not|doesn.t) cover couple/i, "family.md must still say Medicare does not cover couple and family sessions");
});
