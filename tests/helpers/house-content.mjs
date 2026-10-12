import { readdirSync, readFileSync } from "node:fs";

import { houseContent } from "../../src/lib/house-content.js";
import { medicare } from "../../src/data/medicare.js";
import { books, videos } from "../../src/data/library-shelf.js";
import { frontmatter } from "./markdown.mjs";

/**
 * The house's previews built from the real content files, the way
 * src/pages/house.astro builds them, for tests that cannot load
 * `astro:content`. Every entry is included, as on the Preview.
 */
const root = new URL("../../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

export function collection(name) {
  return readdirSync(new URL(`src/content/${name}/`, root))
    .filter((file) => file.endsWith(".md"))
    .map((file) => ({ id: file.slice(0, -3), data: frontmatter(read(`src/content/${name}/${file}`)) }));
}

export function builtHouseContent() {
  const pages = Object.fromEntries(collection("pages").map((entry) => [entry.id, entry.data]));
  return houseContent({
    pages,
    services: collection("services"),
    articles: collection("articles"),
    team: collection("team"),
    books,
    videos,
    clinic: JSON.parse(read("public/assets/content/clinic.json")),
    links: JSON.parse(read("public/assets/content/house-copy.json")).links,
    medicare,
  });
}

/**
 * Loads content-data.js as /house/ does: with the built content in the page.
 * A fresh copy each call, so one test's page does not leak into another's.
 */
export async function loadHouse(content = builtHouseContent()) {
  const { HOUSE_CONTENT_ID, houseContentJson } = await import("../../src/lib/house-content.js");
  const json = houseContentJson(content);
  globalThis.document = { getElementById: (id) => (id === HOUSE_CONTENT_ID ? { textContent: json } : null) };
  try {
    return await import(`../../public/assets/scripts/content-data.js?house=${Date.now()}${Math.random()}`);
  } finally {
    delete globalThis.document;
  }
}
