import assert from "node:assert/strict";
import test from "node:test";

import { rehypeBaseLinks } from "../src/lib/rehype-base-links.js";

/**
 * Links written in Markdown service pages must reach the preview's
 * `/therapyhouse` subpath, the same as `withBase` does for .astro files.
 */

const link = (href) => ({ type: "element", tagName: "a", properties: { href }, children: [] });
const run = (base, ...hrefs) => {
  const tree = { type: "root", children: [{ type: "element", tagName: "p", properties: {}, children: hrefs.map(link) }] };
  rehypeBaseLinks({ base })(tree);
  return tree.children[0].children.map((a) => a.properties.href);
};

test("root-absolute links get the base prefix", () => {
  assert.deepEqual(run("/therapyhouse", "/children/", "/assessments/child-adhd/"), [
    "/therapyhouse/children/",
    "/therapyhouse/assessments/child-adhd/",
  ]);
});

test("other links are left alone, and applying it twice is harmless", () => {
  assert.deepEqual(
    run("/therapyhouse", "https://www.health.gov.au/", "mailto:a@b.c", "#fees", "//cdn.example/x", "/therapyhouse/team/"),
    ["https://www.health.gov.au/", "mailto:a@b.c", "#fees", "//cdn.example/x", "/therapyhouse/team/"]
  );
});

test("a root deployment changes nothing", () => {
  assert.deepEqual(run("/", "/children/"), ["/children/"]);
});

test("article images get the base prefix too", () => {
  const img = { type: "element", tagName: "img", properties: { src: "/assets/library/conflict.webp", alt: "Conflict" }, children: [] };
  rehypeBaseLinks({ base: "/therapyhouse" })({ type: "root", children: [img] });
  assert.equal(img.properties.src, "/therapyhouse/assets/library/conflict.webp");
});
