import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { readFile } from "node:fs/promises";

import { buildPages, cleanUp } from "./helpers/built-site.mjs";
import { formatRebate, medicare } from "../src/data/medicare.js";
import { HOUSE_FACTS_ID, houseFacts, houseFactsJson, packagePrice } from "../src/lib/house-facts.js";

/**
 * Issue #80. The illustrated house used to carry its own copy of the fee list
 * in content-data.js, and it drifted from /fees/. Now /house/ is built with
 * the fees, rebates and assessment prices read from the same files as the
 * plain pages. These tests check that wiring end to end: the builder, the
 * JSON in the built /house/ page, and content-data.js reading it.
 */

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

/** Frontmatter `amount:` / `price:` values, read as text (no YAML dependency). */
const values = (text, key) =>
  [...text.matchAll(new RegExp(`^\\s*-?\\s*${key}: (.+)$`, "gm"))].map((m) => m[1].trim());

let facts;

before(() => {
  const house = buildPages("preview").get("/house/");
  assert.ok(house, "the build has no /house/ page");
  const json = house.html.match(
    new RegExp(`<script type="application/json" id="${HOUSE_FACTS_ID}">([\\s\\S]*?)</script>`)
  )?.[1];
  assert.ok(json, "/house/ does not carry the fee facts JSON");
  facts = JSON.parse(json);
});

after(cleanUp);

test("the house shows every session fee published on /fees/, provisional fees included", async () => {
  const feesMd = await read("src/content/pages/fees.md");
  const prices = facts.fees.filter((f) => typeof f === "object").map((f) => f.price);
  const amounts = values(feesMd, "amount");
  assert.ok(amounts.length >= 7);
  assert.deepEqual(prices, amounts);
  const titles = facts.fees.map((f) => f.title ?? "");
  assert.ok(titles.some((t) => /provisional psychologist/i.test(t)), "no provisional psychologist fee");
});

test("the house rebates use the current plan name and the amounts in medicare.js", () => {
  const text = facts.rebates.join(" ");
  assert.match(text, /Mental Health Treatment Plan/);
  // The old name may appear only as the "sometimes still called" aside.
  assert.equal(text.replace(/sometimes still called a Mental Health Care Plan/g, "").includes("Mental Health Care Plan"), false);
  for (const row of medicare.rebates) {
    assert.ok(text.includes(formatRebate(row.rebate)), `missing the ${row.label} rebate`);
  }
  assert.match(text, /provisional psychologist/);
});

test("the house assessment prices are the packages published on /assessments/", async () => {
  const assessmentsMd = await read("src/content/pages/assessments.md");
  const titles = values(assessmentsMd, "title").filter((t) => t !== "Assessments");
  assert.deepEqual(Object.keys(facts.packagePrices).sort(), titles.sort());
  for (const price of Object.values(facts.packagePrices)) {
    for (const amount of price.match(/\$\d{1,3}(?:,\d{3})*/g) ?? []) {
      assert.ok(assessmentsMd.includes(amount), `${amount} is not on /assessments/`);
    }
  }
  const all = JSON.stringify(facts);
  assert.ok(!/\$1,?200|\$3,?000/.test(all), "the old $1,200 to $3,000 range is back");
});

test("content-data.js carries no fee, rebate or assessment price of its own", async () => {
  // The services and assessments content only: group programs have their own costs.
  const file = await read("public/assets/scripts/content-data.js");
  const source = file.slice(file.search(/^  services: {/m), file.search(/^  groups: {/m));
  assert.ok(source.length > 1000, "could not find the services and assessments content");
  assert.ok(!source.includes("Mental Health Care Plan"));
  assert.ok(!/Assessment packages/.test(source));
  const feesMd = await read("src/content/pages/fees.md");
  const assessmentsMd = await read("src/content/pages/assessments.md");
  for (const amount of [...values(feesMd, "amount"), ...values(assessmentsMd, "price")]) {
    for (const figure of amount.match(/\$\d{1,3}(?:,\d{3})*/g) ?? []) {
      assert.ok(!source.includes(`"${figure}`) && !source.includes(` ${figure}`), `content-data.js types out ${figure}`);
    }
  }
});

test("content-data.js reads the facts from the page and ends each list with a link to /fees/", async () => {
  const json = houseFactsJson(facts);
  globalThis.document = { getElementById: (id) => (id === HOUSE_FACTS_ID ? { textContent: json } : null) };
  try {
    const { siteContent } = await import(`../public/assets/scripts/content-data.js?facts=${Date.now()}`);
    const { fees, rebates } = siteContent.services;
    assert.deepEqual(fees.slice(0, -1), facts.fees);
    assert.deepEqual(rebates.slice(0, -1), facts.rebates);
    assert.match(fees.at(-1).link.href, /fees\/$/);
    assert.equal(siteContent.assessments.packages.adhd.price, facts.packagePrices["ADHD Assessment"]);
    assert.equal(siteContent.assessments.schoolObservations.price, facts.packagePrices["School Observations"]);
  } finally {
    delete globalThis.document;
  }
});

test("the builder keeps notes, wording and provisional prices", () => {
  const built = houseFacts({
    fees: [{ label: "Initial session", amount: "$320" }, { label: "Provisional", amount: "$170", note: "No Medicare rebate applies" }],
    sessionLength: "Each appointment is 50 minutes.",
    packages: [{ title: "ADHD Assessment", price: "from $1,000", provisionalPrice: "from $846" }, { title: "Add-on", price: "$250 plus travel" }],
    medicare,
  });
  assert.equal(built.fees[0], "Each appointment is 50 minutes.");
  assert.deepEqual(built.fees[2], { title: "Provisional", price: "$170", description: "No Medicare rebate applies" });
  assert.equal(built.packagePrices["ADHD Assessment"], "From $1,000, or from $846 with a provisional psychologist");
  assert.equal(packagePrice({ price: "$250 plus travel" }), "$250 plus travel");
  assert.ok(!houseFactsJson({ a: "</script>" }).includes("</script>"));
});
