import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { readFile } from "node:fs/promises";

import { buildPages, cleanUp } from "./helpers/built-site.mjs";
import { formatRebate, medicare } from "../src/data/medicare.js";
import { houseFacts, houseFactsJson, packagePrice } from "../src/lib/house-facts.js";
import { HOUSE_CONTENT_ID } from "../src/lib/house-content.js";
import { frontmatter } from "./helpers/markdown.mjs";

/**
 * Issue #80. The illustrated house used to carry its own copy of the fee list
 * in content-data.js, and it drifted from /fees/. Now /house/ is built with
 * the fees, rebates and assessment prices read from the same files as the
 * plain pages (src/lib/house-content.js). These tests check that wiring end
 * to end: the builder and the JSON in the built /house/ page.
 */

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

let previews;

before(() => {
  const house = buildPages("preview").get("/house/");
  assert.ok(house, "the build has no /house/ page");
  const json = house.html.match(
    new RegExp(`<script type="application/json" id="${HOUSE_CONTENT_ID}">([\\s\\S]*?)</script>`)
  )?.[1];
  assert.ok(json, "/house/ does not carry the house content JSON");
  previews = JSON.parse(json).previews;
});

after(cleanUp);

test("the house shows every session fee published on /fees/, provisional fees included", async () => {
  const fees = frontmatter(await read("src/content/pages/fees.md")).fees.filter((row) => !row.adjustment);
  const shown = previews["services.fees"].items;
  assert.ok(fees.length >= 7);
  assert.deepEqual(shown.map((item) => item.detail), fees.map((row) => row.amount));
  assert.ok(shown.some((item) => /provisional psychologist/i.test(item.title)), "no provisional psychologist fee");
  assert.match(previews["services.fees"].link.href, /\/fees\/$/);
});

test("the house rebates use the current plan name and the amounts in medicare.js", () => {
  const text = previews["services.rebates"].text.join(" ");
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
  const packages = frontmatter(assessmentsMd).packages;
  const priced = Object.entries(previews).filter(([key, preview]) => key.startsWith("assessments.") && preview.meta);
  assert.equal(priced.length, packages.length);
  for (const pkg of packages) {
    assert.ok(priced.some(([, preview]) => preview.meta === packagePrice(pkg)), `${pkg.title} is not priced as on /assessments/`);
  }
  const all = JSON.stringify(previews);
  assert.ok(!/\$1,?200|\$3,?000/.test(all), "the old $1,200 to $3,000 range is back");
});

test("the house's scripts carry no fee, rebate or assessment price of their own", async () => {
  for (const path of ["public/assets/scripts/content-data.js", "public/assets/content/house-copy.json"]) {
    assert.ok(!/\$\d/.test(await read(path)), `${path} types out a price`);
  }
});

test("the builder keeps notes, wording and provisional prices", () => {
  const built = houseFacts({
    fees: [{ label: "Initial session", amount: "$320" }, { label: "Provisional", amount: "$170", note: "No Medicare rebate applies" }],
    sessionLength: "Each appointment is 50 minutes.",
    packages: [{ id: "adhd", title: "ADHD Assessment", price: "from $1,000", provisionalPrice: "from $846" }, { title: "Add-on", price: "$250 plus travel" }],
    medicare,
  });
  assert.equal(built.fees[0], "Each appointment is 50 minutes.");
  assert.deepEqual(built.fees[2], { title: "Provisional", price: "$170", description: "No Medicare rebate applies" });
  assert.equal(built.packagePrices.adhd, "From $1,000, or from $846 with a provisional psychologist");
  assert.deepEqual(Object.keys(built.packagePrices), ["adhd"], "a package with no id is not in the house");
  assert.equal(packagePrice({ price: "$250 plus travel" }), "$250 plus travel");
  assert.ok(!houseFactsJson({ a: "</script>" }).includes("</script>"));
});
