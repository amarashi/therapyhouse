import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

/**
 * The four explainer articles (issue #40). Health information published under
 * the clinic's name needs a clinician author, so these stay drafts with no
 * author until one reviews and signs them. Their facts come only from
 * Australian government and peak-body sources, cited at the end.
 */

const read = (id) => readFileSync(new URL(`../src/content/articles/${id}.md`, import.meta.url), "utf8");

const EXPLAINERS = {
  "how-to-get-diagnosed-with-adhd-in-australia": ["/assessments/adult-adhd/", "/assessments/child-adhd/"],
  "adhd-signs-in-adult-women": ["/assessments/adult-adhd/"],
  "adhd-vs-autism": ["/assessments/adult-adhd/", "/assessments/child-adhd/", "/assessments/adult-autism/", "/assessments/child-autism/"],
  "cbt-for-separation-anxiety-in-children": ["/therapy/anxiety/"],
};

const TRUSTED_SOURCES = new Set([
  "www.healthdirect.gov.au",
  "adhdguideline.aadpa.com.au",
  "www.racgp.org.au",
  "www.health.gov.au",
  "www.rch.org.au",
]);

for (const [id, links] of Object.entries(EXPLAINERS)) {
  const source = read(id);
  const [, frontmatter, body] = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);

  test(`${id} is a draft with no author`, () => {
    assert.match(frontmatter, /^draft: true$/m);
    assert.doesNotMatch(frontmatter, /^author:/m);
  });

  test(`${id} links to its assessment or therapy page`, () => {
    for (const link of links) assert.ok(body.includes(`](${link})`), `missing link to ${link}`);
  });

  test(`${id} cites only Australian government and peak-body sources`, () => {
    const sources = body.split(/^## Sources$/m)[1];
    assert.ok(sources, "no Sources section");
    const hosts = [...sources.matchAll(/\]\((https:\/\/[^)]+)\)/g)].map(([, url]) => new URL(url).hostname);
    assert.ok(hosts.length > 0, "no cited sources");
    for (const host of hosts) assert.ok(TRUSTED_SOURCES.has(host), `untrusted source: ${host}`);
  });

  test(`${id} states no fee or rebate amount`, () => {
    assert.doesNotMatch(body, /\$\s?\d/);
  });
}
