import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";

import { buildSite } from "../tools/build-site.mjs";

/**
 * Launch day builds the site for the clinic's domain with no base path. The
 * Preview never does, so a break in that shape stays hidden until the day it
 * matters (issue #24: every team page failed with "Missing parameter: slug").
 * This builds the production shape on every `pnpm test` and checks the result
 * looks like a root-hosted site.
 */

const dist = buildSite("production");
test.after(() => rmSync(dist, { recursive: true, force: true }));

const page = (path) => readFileSync(join(dist, path, "index.html"), "utf8");
const teamIds = readdirSync(new URL("../src/content/team/", import.meta.url))
  .filter((file) => /\.mdx?$/.test(file))
  .map((file) => file.replace(/\.mdx?$/, ""));

test("every team member gets a profile page in the production build", () => {
  assert.ok(teamIds.length > 0, "no team files found");
  for (const id of teamIds) {
    assert.ok(existsSync(join(dist, "team", id, "index.html")), `missing /team/${id}/`);
  }
});

test("production pages point at the clinic's domain, not the Preview", () => {
  const html = page("team");
  assert.match(html, /<link rel="canonical" href="https:\/\/www\.therapyhouse\.com\.au\/team\/"/);
  assert.doesNotMatch(html, /noindex/, "production must not carry the Preview's noindex");
  assert.doesNotMatch(html, /github\.io/);
});

test("internal links have no Preview base path", () => {
  for (const path of ["", "team", "therapy", `team/${teamIds[0]}`]) {
    const html = page(path);
    assert.doesNotMatch(html, /(?:href|src)="\/therapyhouse\//, `/${path} links into /therapyhouse/`);
  }
});

test("the old /services/ address forwards to /therapy/ at the domain root", () => {
  const html = page("services");
  assert.match(html, /url=\/therapy\/"/);
  assert.doesNotMatch(html, /\/therapyhouse\//);
});

test("robots.txt and the sitemap use the clinic's domain", () => {
  const robots = readFileSync(join(dist, "robots.txt"), "utf8");
  assert.match(robots, /^Sitemap: https:\/\/www\.therapyhouse\.com\.au\/sitemap-index\.xml$/m);
  const locs = [...readFileSync(join(dist, "sitemap-0.xml"), "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)];
  assert.ok(locs.length > 10);
  for (const [, loc] of locs) assert.match(loc, /^https:\/\/www\.therapyhouse\.com\.au\//);
});
