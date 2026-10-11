import assert from "node:assert/strict";
import test from "node:test";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { frontmatter } from "./helpers/markdown.mjs";

/**
 * `worksWith` and `worksOn` are rendered on the team cards as statements about
 * a named clinician's scope of practice. They carry the same weight as a fee,
 * so they get the same treatment as fees: a test that fails when they drift.
 *
 * The load-bearing one is the traceability test. Every published value must
 * appear in `docs/team-specialisms-review.md`, which is the clinic's sign-off
 * list and records the source sentence for each. Adding a specialism to a
 * profile without adding it to the review list fails the build.
 *
 * Frontmatter is parsed as YAML, not matched as text: Pages CMS rewrites a
 * file in its own style when staff save it (quotes dropped, lists re-indented).
 *
 * A practitioner switched off ("Show on the live website", `draft: true`) is
 * not published, so the sign-off rules wait until they are switched on. That
 * is how a new person is added through the CMS: their entry starts switched
 * off, and switching them on before docs/team-specialisms-review.md names
 * them fails here. The values themselves are checked for everyone.
 */

const teamDir = fileURLToPath(new URL("../src/content/team/", import.meta.url));
const files = (await readdir(teamDir)).filter((f) => f.endsWith(".md"));

const people = await Promise.all(
  files.map(async (file) => {
    const data = frontmatter(await readFile(join(teamDir, file), "utf8"));
    return {
      file,
      name: data.name,
      kind: data.kind,
      draft: data.draft === true,
      worksWith: data.worksWith ?? [],
      worksOn: data.worksOn ?? [],
    };
  })
);

const allPractitioners = people.filter((p) => p.kind === "practitioner");
const practitioners = allPractitioners.filter((p) => !p.draft);
const others = people.filter((p) => p.kind !== "practitioner");

const reviewList = await readFile(
  fileURLToPath(new URL("../docs/team-specialisms-review.md", import.meta.url)),
  "utf8"
);

test("every practitioner has both specialism rows populated", () => {
  assert.ok(allPractitioners.length >= 8, "expected at least 8 practitioners");
  for (const person of practitioners) {
    assert.ok(person.worksWith.length > 0, `${person.file} has no worksWith`);
    assert.ok(person.worksOn.length > 0, `${person.file} has no worksOn`);
  }
});

test("support staff and the dogs carry no clinical specialisms", () => {
  // A dog with a "Works on" row would read as clinical scope. The site already
  // states Reea is not a certified therapy dog; this keeps the cards honest.
  for (const person of others) {
    assert.equal(person.worksWith.length, 0, `${person.file} (${person.kind}) has worksWith`);
    assert.equal(person.worksOn.length, 0, `${person.file} (${person.kind}) has worksOn`);
  }
});

test("specialism rows stay short enough to scan", () => {
  for (const person of allPractitioners) {
    assert.ok(
      person.worksWith.length <= 4,
      `${person.file} lists ${person.worksWith.length} worksWith; 4 is the cap`
    );
    assert.ok(
      person.worksOn.length <= 5,
      `${person.file} lists ${person.worksOn.length} worksOn; 5 is the cap`
    );
  }
});

test("every published specialism is traceable to the clinic review list", () => {
  for (const person of allPractitioners) {
    for (const value of [...person.worksWith, ...person.worksOn]) {
      assert.ok(
        reviewList.includes(value),
        `"${value}" is published for ${person.name} but is not in ` +
          `docs/team-specialisms-review.md — the clinic cannot sign off what is not listed`
      );
    }
  }
});

test("the review list still names every practitioner", () => {
  for (const person of practitioners) {
    assert.ok(
      reviewList.includes(person.name),
      `${person.name} is missing a section in docs/team-specialisms-review.md`
    );
  }
});
