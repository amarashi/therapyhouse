import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

import {
  assertRebatesCurrent,
  formatAsAt,
  formatRebate,
  medicare,
  rebatesAreCurrent,
} from "../src/data/medicare.js";
import { feeOffers, priceRange } from "../src/lib/fees.js";
import { builtPaths, pagePathFromFile } from "../src/lib/links.js";
import { footerNav, nav } from "../src/data/site.js";

/**
 * /fees/ (issue #30). The rebate amounts are the one thing on the site that
 * the government changes every July, so the data file carries its own date
 * and both the build and this suite refuse to run once it is a year old.
 */

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Medicare rebate data is less than twelve months old", () => {
  // Fails the test run (and, through the same function called by
  // src/pages/fees.astro, the build) on 2 July 2027 unless someone has
  // checked MBS Online and moved `asAt` forward.
  assert.ok(
    rebatesAreCurrent(medicare, new Date()),
    `src/data/medicare.js is dated ${medicare.asAt}; check MBS Online and update it`
  );
  assert.doesNotThrow(() => assertRebatesCurrent(medicare, new Date()));
});

test("the staleness check trips at twelve months, not before", () => {
  const data = { ...medicare, asAt: "2026-07-01" };
  assert.equal(rebatesAreCurrent(data, new Date("2027-07-01T00:00:00Z")), true);
  assert.equal(rebatesAreCurrent(data, new Date("2027-07-02T00:00:00Z")), false);
  assert.throws(() => assertRebatesCurrent(data, new Date("2027-08-01T00:00:00Z")), /twelve months/);
});

test("the build calls the staleness check", async () => {
  const page = await read("src/pages/fees.astro");
  assert.match(page, /assertRebatesCurrent\(medicare\)/);
});

test("rebate data names its source and every MBS item number", () => {
  assert.match(medicare.source, /^https:\/\/www9\.health\.gov\.au\/mbs\//);
  assert.match(medicare.asAt, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(medicare.checked, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(medicare.rebates.length >= 2);
  for (const row of medicare.rebates) {
    assert.match(row.items.inRoom, /^\d{5}$/, `${row.id} has no in-room item number`);
    assert.match(row.items.video, /^\d{5}$/, `${row.id} has no video item number`);
    // A rebate is 85% of the schedule fee, rounded to the 5 cents MBS uses.
    const expected = Math.round(row.scheduleFee * 0.85 * 20) / 20;
    assert.ok(Math.abs(row.rebate - expected) < 0.06, `${row.id}: ${row.rebate} is not 85% of ${row.scheduleFee}`);
  }
});

test("rebates and dates are formatted the way the page shows them", () => {
  assert.equal(formatRebate(101.55), "$101.55");
  assert.equal(formatRebate(149.05), "$149.05");
  assert.equal(formatAsAt("2026-07-01"), "1 July 2026");
});

test("no page states a rebate amount except through the data file", async () => {
  // Every dollar rebate on the site comes from src/data/medicare.js. A copy
  // typed into a content file would not move when the data does.
  const { readdir } = await import("node:fs/promises");
  const dirs = ["src/content/pages", "src/content/services"];
  for (const dir of dirs) {
    for (const file of await readdir(new URL(`../${dir}`, import.meta.url))) {
      if (!file.endsWith(".md")) continue;
      const text = await read(`${dir}/${file}`);
      for (const row of medicare.rebates) {
        assert.ok(
          !text.includes(formatRebate(row.rebate)),
          `${dir}/${file} types out the ${row.label} rebate; read it from src/data/medicare.js`
        );
      }
      assert.ok(!/\$98\.95|\$145\.25/.test(text), `${dir}/${file} has an outdated Medicare rebate`);
    }
  }
});

test("offers carry prices only once the clinic has confirmed its fees", () => {
  const fees = [
    { label: "Initial session", amount: "$320" },
    { label: "Couples", amount: "$280–$350" },
    { label: "Evening", amount: "+$10", adjustment: true },
  ];

  const unconfirmed = feeOffers(fees, { confirmed: false });
  assert.equal(unconfirmed.length, 2, "the evening surcharge is not a session");
  for (const offer of unconfirmed) {
    assert.equal(offer.price, undefined);
    assert.equal(offer.priceSpecification, undefined);
  }

  const confirmed = feeOffers(fees, { confirmed: true });
  assert.equal(confirmed[0].price, "320.00");
  assert.equal(confirmed[0].priceCurrency, "AUD");
  assert.equal(confirmed[1].priceSpecification.minPrice, "280.00");
  assert.equal(confirmed[1].priceSpecification.maxPrice, "350.00");
});

test("the price range spans session fees and ignores the evening surcharge", () => {
  assert.equal(
    priceRange([
      { amount: "$170" },
      { amount: "$280–$350" },
      { amount: "+$10", adjustment: true },
    ]),
    "$170–$350"
  );
});

test("a link is offered only to a page that is built", () => {
  assert.equal(pagePathFromFile("/src/pages/fees.astro"), "/fees/");
  assert.equal(pagePathFromFile("/src/pages/telehealth/index.astro"), "/telehealth/");
  assert.equal(pagePathFromFile("/src/pages/telehealth/toowoomba.astro"), "/telehealth/toowoomba/");
  assert.equal(pagePathFromFile("/src/pages/index.astro"), "/");
  assert.equal(pagePathFromFile("/src/pages/therapy/[slug].astro"), null);
  assert.equal(pagePathFromFile("/src/pages/404.astro"), null);

  const built = builtPaths(
    ["/src/pages/fees.astro", "/src/pages/therapy/[slug].astro"],
    [
      { id: "couples", data: { kind: "therapy" } },
      { id: "adult-adhd", data: { kind: "assessment" } },
      { id: "adults", data: { kind: "hub" } },
    ]
  );
  assert.ok(built.has("/adults/"));
  assert.ok(built.has("/fees/"));
  assert.ok(built.has("/therapy/couples/"));
  assert.ok(built.has("/assessments/adult-adhd/"));
  assert.ok(!built.has("/ndis/"));
});

test("/fees/ is in the footer map and the lift keeps its six floors", () => {
  assert.ok(footerNav.some((item) => item.href === "/fees/"));
  assert.equal(nav.filter((item) => item.ready).length, 6);
});

test("the therapy hub points at /fees/ where the fee table used to be", async () => {
  const hub = await read("src/pages/therapy/index.astro");
  assert.match(hub, /withBase\('\/fees\/'\)/);
  assert.ok(!hub.includes("fee-table"), "the fee table should have moved to /fees/");
  // The assessments page's pointer is a sentence staff edit in the CMS.
  const assessments = await read("src/content/pages/assessments.md");
  assert.match(assessments, /^  fundingNote: .*\]\(\/fees\/\)/m);
  const servicePage = await read("src/layouts/ServicePage.astro");
  assert.match(servicePage, /withBase\('\/fees\/'\)/);
});
