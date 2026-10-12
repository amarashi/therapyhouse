import { parse } from "yaml";

/**
 * Reading content files the way the build does, whoever wrote them.
 *
 * Clinic staff save content through Pages CMS (issue #97), which rewrites a
 * file's front matter in its own YAML style: quotes dropped, flow lists
 * (`[a, b]`) turned into block lists, and any value longer than 80 characters
 * folded onto several lines. A test that reads front matter as text breaks on
 * the first save. These helpers parse it instead.
 */

/** The front matter (parsed) and the body of a Markdown content file. */
export function splitMarkdown(text) {
  const match = text.replace(/\r\n/g, "\n").match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) throw new Error("no front matter");
  return { data: parse(match[1]) ?? {}, body: match[2] };
}

/** The parsed front matter of a Markdown content file. */
export const frontmatter = (text) => splitMarkdown(text).data;

/**
 * Every word a reader can see in a content file: each text value in the
 * front matter on its own line, then the body. For checks that a sentence is
 * on a page, which must not depend on where YAML wrapped a long line.
 */
export function readableText(text) {
  const { data, body } = splitMarkdown(text);
  const words = [];
  (function collect(value) {
    if (typeof value === "string") words.push(value);
    else if (Array.isArray(value)) value.forEach(collect);
    else if (value && typeof value === "object") Object.values(value).forEach(collect);
  })(data);
  return [...words, body].join("\n");
}
