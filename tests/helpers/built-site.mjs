import { existsSync, readdirSync, readFileSync, statSync, rmSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { buildSite } from "../../tools/build-site.mjs";

/**
 * Build the site into a temporary folder and read its pages back.
 *
 * The checks that matter for search (every title unique and short, structured
 * data present, the Analytics tag only in production) are properties of the
 * built HTML, not of any one source file, so they are tested against a real
 * build. CI runs `pnpm test` before `pnpm build`, so the tests build for
 * themselves instead of reading `dist/`.
 *
 * Astro keeps one content cache per project, so `pnpm test` runs test files
 * one at a time (`--test-concurrency=1`) and two builds never write it at
 * once.
 */

const root = fileURLToPath(new URL("../..", import.meta.url));

const made = [];

/**
 * Build for a deploy target ("preview" or "production", see astro.config.mjs)
 * and return its pages. Uses the same builder as `tests/production-build`.
 */
export function buildPages(target) {
  const outDir = buildSite(target);
  made.push(outDir);
  return readPages(outDir);
}

export function cleanUp() {
  for (const dir of made.splice(0)) rmSync(dir, { recursive: true, force: true });
}

/**
 * Every page Astro built, keyed by its path inside the output folder (the
 * base is not part of the folder, so the home page is "/"). HTML files copied
 * through from public/ are not pages Astro renders and are left out.
 */
function readPages(outDir) {
  const pages = new Map();
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) {
        // Copied straight from public/: the house experience's own files.
        if (name === "assets") continue;
        walk(full);
      } else if (name.endsWith(".html")) {
        const rel = relative(outDir, full);
        if (existsSync(join(root, "public", rel))) continue;
        const path = "/" + rel.split(sep).join("/").replace(/index\.html$/, "");
        pages.set(path, parsePage(readFileSync(full, "utf8")));
      }
    }
  };
  walk(outDir);
  return pages;
}

const decode = (s) =>
  s
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");

function parsePage(html) {
  const meta = (attr, value) => {
    const tag = html.match(new RegExp(`<meta[^>]*${attr}="${value}"[^>]*>`, "i"))?.[0];
    const content = tag?.match(/content="([^"]*)"/i)?.[1];
    return content === undefined ? undefined : decode(content);
  };
  const jsonLd = [
    ...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi),
  ].map((m) => JSON.parse(m[1]));
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? "";
  return {
    html,
    title: decode(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? ""),
    description: meta("name", "description"),
    canonical: html.match(/<link[^>]*rel="canonical"[^>]*>/i)?.[0],
    h1: decode(h1.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()),
    jsonLd,
    isRedirect: /http-equiv="refresh"/i.test(html),
  };
}

/** Visible text of a page: scripts and styles removed, tags turned to spaces. */
export function textOf(page) {
  return decode(
    page.html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
  );
}

/** Every `@type` in a page's JSON-LD, including nodes inside an `@graph`. */
export function schemaTypes(page) {
  const types = [];
  const visit = (node) => {
    if (Array.isArray(node)) return node.forEach(visit);
    if (!node || typeof node !== "object") return;
    if (node["@type"]) types.push(...[].concat(node["@type"]));
    if (node["@graph"]) visit(node["@graph"]);
  };
  page.jsonLd.forEach(visit);
  return types;
}
