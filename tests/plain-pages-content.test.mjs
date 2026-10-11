import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { siteContent } from "../public/assets/scripts/content-data.js";

/**
 * The house and the plain pages are two presentations of one content model.
 * These tests guard the seam: if a fee changes in `content-data.js` but not in
 * the page's frontmatter (or the reverse), a parent could be quoted one price
 * in a room and a different price on the page it links to.
 *
 * Frontmatter is read as text rather than parsed — the project has no YAML
 * dependency, and substring checks are enough to catch drift.
 */

const readPage = async (name) =>
  readFile(fileURLToPath(new URL(`../src/content/pages/${name}.md`, import.meta.url)), "utf8");

const services = await readPage("services");
const assessments = await readPage("assessments");
// The fee table moved from /therapy/ (services.md) to /fees/ in issue #30.
const fees = await readPage("fees");

test("services page lists every service offering from the content model", () => {
  for (const offering of siteContent.services.offerings) {
    assert.ok(
      services.includes(offering),
      `services.md is missing the offering: ${offering}`
    );
  }
});

test("services page lists every therapy model from the content model", () => {
  for (const model of siteContent.services.therapyModels) {
    assert.ok(services.includes(model), `services.md is missing the therapy model: ${model}`);
  }
});

test("session fees on the fees page match the content model", () => {
  // The assessment-package range is deliberately absent: `content-data.js`
  // quotes $1,200–$3,000 while the itemised packages on /assessments/ total
  // $846–$2,400. Rather than publish both, the services page links through to
  // the itemised list. Remove this filter once the clinic confirms which is
  // correct.
  const sessionFees = siteContent.services.fees.filter(
    (fee) => !/assessment packages/i.test(fee.label)
  );

  for (const fee of sessionFees) {
    const amount = fee.value.replace(/^\$?/, "").split(" ")[0];
    assert.ok(
      fees.includes(amount),
      `fees.md is missing the fee amount ${fee.value} (${fee.label})`
    );
  }
});

test("the therapy hub no longer carries its own fee table", () => {
  assert.ok(!/^fees:/m.test(services), "services.md still has a fees block; fees live in fees.md");
});

test("every rebate and report note reaches the fees page", () => {
  // The first rebate note ("via GP referral and Mental Health Care Plan") is
  // replaced on /fees/ by the Medicare section, which states the rebate in
  // dollars from src/data/medicare.js and uses the plan's current name.
  const [, ...rebateNotes] = siteContent.services.rebates;
  for (const note of [...rebateNotes, ...siteContent.services.reports]) {
    const plain = note.replace(/\.$/, "");
    assert.ok(fees.includes(plain), `fees.md is missing: ${note.slice(0, 50)}…`);
  }
});

test("fees page has the title, H1 and description the issue asks for", () => {
  const field = (name) => fees.match(new RegExp(`^${name}: (.+)$`, "m"))?.[1].trim();
  const title = field("documentTitle");
  const h1 = field("title");
  const description = field("description");

  assert.equal(title, "Psychologist Fees & Medicare Rebates | Therapy House");
  assert.equal(h1, "Fees and Medicare rebates");
  assert.ok(title.length < 60, `title is ${title.length} characters`);
  assert.ok(description.length < 160, `description is ${description.length} characters`);
  assert.match(description, /Medicare rebates/);

  // The target phrase in the first paragraph of the body.
  const body = fees.split(/^---$/m)[2];
  const firstParagraph = body.trim().split(/\n\s*\n/)[0];
  assert.match(firstParagraph.replace(/\s+/g, " "), /fees and Medicare rebates/i);
});

test("the fees page states plainly that the clinic does not bulk bill", () => {
  assert.match(fees, /does not bulk bill/);
});

test("assessment process steps appear in order on the assessments page", () => {
  let cursor = 0;
  for (const step of siteContent.assessments.process) {
    const at = assessments.indexOf(step, cursor);
    assert.notEqual(at, -1, `assessments.md is missing or misorders the step: ${step}`);
    cursor = at;
  }
});

test("assessment documents list is complete", () => {
  for (const doc of siteContent.assessments.documents) {
    assert.ok(assessments.includes(doc), `assessments.md is missing the document: ${doc}`);
  }
});

test("every assessment package price reaches the assessments page", () => {
  const packages = Object.values(siteContent.assessments.packages);
  assert.ok(packages.length > 0, "content model has no assessment packages");

  for (const pkg of packages) {
    assert.ok(
      assessments.includes(pkg.title),
      `assessments.md is missing the package: ${pkg.title}`
    );
    // "From $2,400; provisional from $1,900" -> both amounts must be published.
    for (const amount of pkg.price.match(/\$[\d,]+/g) ?? []) {
      assert.ok(
        assessments.includes(amount),
        `assessments.md is missing ${amount} for ${pkg.title}`
      );
    }
  }
});

test("school observation add-on is published with its price", () => {
  const { title, price } = siteContent.assessments.schoolObservations;
  assert.ok(assessments.includes(title), `assessments.md is missing: ${title}`);
  assert.ok(assessments.includes(price.match(/\$[\d,]+/)[0]), "school observation price missing");
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
  assert.ok(siteData.includes("tel:+61733002170"), "site.js lost the phone link");
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

  // Whatever the clinic writes, the count must match the published statuses.
  const expected = siteContent.team.availability.filter((a) =>
    isAcceptingNewClients(a.status)
  ).length;
  assert.equal(expected, 2, "expected exactly 2 practitioners accepting new clients");
});

test("every team member has a profile file with a photo that exists", async () => {
  const { readdir, access } = await import("node:fs/promises");
  const teamDir = fileURLToPath(new URL("../src/content/team", import.meta.url));
  const files = (await readdir(teamDir)).filter((f) => f.endsWith(".md"));

  assert.equal(files.length, 12, "expected 12 team profiles");

  for (const file of files) {
    const md = await readFile(`${teamDir}/${file}`, "utf8");
    const image = md.match(/^image: "(.+)"$/m)?.[1];
    assert.ok(image, `${file} has no image path`);
    const onDisk = fileURLToPath(new URL(`../public${image}`, import.meta.url));
    await access(onDisk).catch(() => {
      throw new Error(`${file} points at a missing photo: public${image}`);
    });
  }
});

test("every team photo has its illustrated twin beside it", async () => {
  // The card opens as the illustration and dissolves to the photograph on
  // hover. A missing `-pix.webp` fails silently — the card just renders the
  // photo — so the way this goes wrong is one person quietly not taking part.
  // Usually it means a new master landed in art-src/team-pix/ and nobody ran
  // `node tools/portraits.mjs`.
  const { readdir, access } = await import("node:fs/promises");
  const teamDir = fileURLToPath(new URL("../src/content/team", import.meta.url));
  const files = (await readdir(teamDir)).filter((f) => f.endsWith(".md"));

  for (const file of files) {
    const md = await readFile(`${teamDir}/${file}`, "utf8");
    const image = md.match(/^image: "(.+)"$/m)?.[1];
    const pix = image.replace(/\.(webp|png|jpe?g)$/, "-pix.webp");
    const onDisk = fileURLToPath(new URL(`../public${pix}`, import.meta.url));
    await access(onDisk).catch(() => {
      throw new Error(`${file} has no illustrated portrait: public${pix}`);
    });
  }
});

test("every portrait ships both steps of the responsive ladder", async () => {
  // `PersonPortrait` and the profile page publish `srcset="…-280.webp 280w,
  // ….webp 560w"`. A missing `-280` is the worst kind of broken: 2x screens
  // never ask for it, so it looks fine to whoever built it, and every 1x
  // visitor gets a blank square. Run `node tools/portraits.mjs` after adding
  // anyone.
  const { readdir, access } = await import("node:fs/promises");
  const teamDir = fileURLToPath(new URL("../src/content/team", import.meta.url));
  const files = (await readdir(teamDir)).filter((f) => f.endsWith(".md"));

  for (const file of files) {
    const md = await readFile(`${teamDir}/${file}`, "utf8");
    const image = md.match(/^image: "(.+)"$/m)?.[1];
    const steps = [image, image.replace(/\.(webp|png|jpe?g)$/, "-pix.webp")].map((f) =>
      f.replace(/\.webp$/, "-280.webp")
    );

    for (const step of steps) {
      const onDisk = fileURLToPath(new URL(`../public${step}`, import.meta.url));
      await access(onDisk).catch(() => {
        throw new Error(`${file} has no 280w step: public${step}`);
      });
    }
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
    reea.includes("not a certified therapy dog"),
    "reea.md must keep the clinic's not-certified wording"
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

const frontValue = (markdown, key) => {
  const front = markdown.split(/^---$/m)[1] ?? "";
  const line = front.match(new RegExp(`^${key}:\s*(.+)$`, "m"));
  return line ? line[1].trim().replace(/^"(.*)"$/, "$1") : undefined;
};

const assessmentPages = [
  {
    file: "child-adhd",
    title: "Child ADHD Assessment Brisbane | Therapy House, The Gap",
    h1: "ADHD assessment for children and teenagers",
    description:
      "ADHD assessment for children and teens in The Gap, Brisbane: the process, what to bring, report timing and cost from $1,000.",
    phrase: "ADHD assessment",
  },
  {
    file: "child-autism",
    title: "Child Autism Assessment Brisbane | Therapy House, The Gap",
    h1: "Autism assessment for children and teenagers",
    description:
      "Autism assessment for children and teens in The Gap, Brisbane: the process, what to bring, report timing and cost from $1,000.",
    phrase: "Autism assessment",
  },
  {
    file: "adult-adhd",
    title: "Adult ADHD Assessment Brisbane | Therapy House, The Gap",
    h1: "Adult ADHD assessment and diagnosis",
    description:
      "Adult ADHD assessment in The Gap, Brisbane: the steps, who assesses you, what to bring, how long the report takes, cost and what Medicare covers.",
    phrase: "ADHD assessment",
  },
  {
    file: "adult-autism",
    title: "Adult Autism Assessment Brisbane | Therapy House",
    h1: "Adult autism assessment",
    description:
      "Adult autism assessment in The Gap, Brisbane: the steps, who assesses you, what to bring, report timing, cost and what Medicare covers.",
    phrase: "autism assessment",
  },
];

test("adult assessment pages publish no fee until the clinic gives one", async () => {
  for (const file of ["adult-adhd", "adult-autism"]) {
    const text = await readService(file);
    assert.match(text, /^feeStatus: quote$/m, `${file} must say call for a quote`);
    assert.doesNotMatch(text.split(/^---$/m)[1], /^fees:/m, `${file} must not carry fee rows`);
  }
});

for (const page of assessmentPages) {
  test(`${page.file}: title, H1 and description are the ones the issue specifies`, async () => {
    const text = await readService(page.file);
    assert.equal(frontValue(text, "title"), page.title);
    assert.equal(frontValue(text, "h1"), page.h1);
    assert.equal(frontValue(text, "description"), page.description);
    assert.ok(page.title.length < 60, "title must be under 60 characters");
    assert.ok(page.description.length < 160, "description must be under 160 characters");
  });

  test(`${page.file}: the target phrase is in the title, H1, opening and description`, async () => {
    const text = await readService(page.file);
    const has = (value) => value.toLowerCase().includes(page.phrase.toLowerCase());
    assert.ok(has(page.title), "title");
    assert.ok(has(page.h1), "h1");
    assert.ok(has(frontValue(text, "lede")), "lede (the opening paragraph)");
    assert.ok(has(page.description), "description");
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
