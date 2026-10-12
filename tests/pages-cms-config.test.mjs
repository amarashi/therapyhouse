import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { parse, stringify } from "yaml";
import { z } from "astro/zod";

import { contentSchemas } from "../src/lib/content-schemas.js";
import { isDraftFrontMatter } from "../src/lib/drafts.js";
import { UPLOAD_DIR } from "../src/lib/team-portraits.js";

/**
 * Issue #97: .pages.yml, the Pages CMS form clinic staff edit the site with,
 * kept in step with what the build accepts. Staff saves go straight to `main`
 * and deploy, and the test suite is the safety net, so every rule the build
 * enforces that the form can express is checked here to be in the form.
 *
 * The Markdown collections are compared with their real Zod schemas: those
 * live in src/lib/content-schemas.js as plain Zod (`astro/zod`) so this test
 * can walk them; src/content.config.ts only wires them to folders. `reference`
 * exists only inside Astro, so a stand-in string marked with the collection
 * name is passed for it. The JSON files have no schema, so their form is
 * compared with the keys actually in the file.
 *
 * Pages CMS facts this relies on (checked against the 2.1.8 source):
 *   - a field `component: x` is the component's definition with the field's
 *     own keys laid over it (lib/config.ts);
 *   - a boolean is one switch with no way to invert or relabel it;
 *   - `list: { min, max }`: at `max` the add button goes; below `min` the
 *     entry cannot be saved;
 *   - YAML front matter is written with the `yaml` package, so a boolean is
 *     a bare `true`/`false`.
 */

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const mdFiles = (dir) => readdirSync(new URL(`${dir}/`, root)).filter((f) => f.endsWith(".md"));
const frontmatter = (path) => parse(read(path).replace(/\r\n/g, "\n").split(/^---$/m)[1]) ?? {};

const config = parse(read(".pages.yml"));

/* ---------------------------------------------------------------- the form */

/** A field with its component applied, as Pages CMS resolves it. */
function resolve(field) {
  let resolved = field;
  if (field.component) {
    const definition = config.components?.[field.component];
    assert.ok(definition, `unknown component ${field.component}`);
    const { component: _, ...own } = field;
    resolved = { ...definition, ...own, type: definition.type };
  }
  if (resolved.fields) resolved = { ...resolved, type: resolved.type ?? "object", fields: resolved.fields.map(resolve) };
  return resolved;
}

const entries = [];
(function collect(items) {
  for (const item of items) {
    if (item.type === "group") collect(item.items);
    else entries.push({ ...item, fields: (item.fields ?? []).map(resolve) });
  }
})(config.content);
const entry = (name) => {
  const found = entries.find((e) => e.name === name);
  assert.ok(found, `.pages.yml has no entry "${name}"`);
  return found;
};
const optionValues = (field) => (field.options?.values ?? []).map((v) => (typeof v === "object" ? v.value : v));
const isList = (field) => Boolean(field.list);
const lockedDown = (field) => field.hidden === true || field.readonly === true;

/** Every field in a tree, with its dotted path ("routes[].href"). */
function* walk(fields, prefix = "") {
  for (const field of fields) {
    const path = `${prefix}${field.name}${isList(field) && field.type === "object" ? "[]" : ""}`;
    yield { field, path };
    if (field.fields) yield* walk(field.fields, `${path}.`);
  }
}

/* ------------------------------------------------------------- the schemas */

const schemas = contentSchemas((collection) => z.string().describe(`reference:${collection}`));

/** A Zod schema reduced to what the form has to mirror. */
function describe(schema) {
  let optional = false;
  let current = schema;
  while (["optional", "default", "nullable"].includes(current.def.type)) {
    optional = true;
    current = current.def.innerType;
  }
  const minLength = current.def.checks?.map((c) => c._zod.def).find((c) => c.check === "min_length")?.minimum ?? 0;
  const base = { optional, minLength };
  switch (current.def.type) {
    case "string":
      return current.description?.startsWith("reference:")
        ? { ...base, kind: "reference", collection: current.description.slice("reference:".length) }
        : { ...base, kind: "string", maxLength: current.maxLength ?? undefined };
    case "enum":
      return { ...base, kind: "enum", values: current.options };
    case "array":
      return { ...base, kind: "array", element: describe(current.def.element) };
    case "object":
      return { ...base, kind: "object", shape: current.shape };
    default:
      return { ...base, kind: current.def.type }; // boolean, number, date
  }
}

/**
 * Fields the schema has that the form leaves out on purpose. Anything else
 * missing from the form fails, so a new schema field cannot go unnoticed.
 */
const NOT_IN_FORM = {
  // No page renders these (src/pages/*.astro); a field staff could fill in
  // with nothing changing on the site would only confuse.
  pages: ["rebates", "books", "videoTopics"],
};

/** The form types a schema kind may be edited with. */
const FORM_TYPES = {
  string: ["string", "text", "rich-text", "image"],
  reference: ["select"],
  enum: ["select"],
  number: ["number"],
  boolean: ["boolean"],
  date: ["date"],
};

/** Compare one form field with its schema, recursively. */
function compareField(field, schema, where) {
  const d = describe(schema);
  const at = `${where}.${field.name}`;
  if (d.kind === "array") {
    assert.ok(isList(field) || field.options?.multiple, `${at}: the schema has a list, the form a single value`);
    const element = d.element;
    if (element.kind === "object") {
      assert.equal(field.type, "object", `${at}: a list of groups of fields in the schema`);
      assert.ok(isList(field), `${at}: should be a list`);
      compareFields(field.fields, element.shape, at);
    } else if (element.kind === "enum" || element.kind === "reference") {
      assert.equal(field.type, "select", `${at}: a fixed list of values in the schema`);
      assert.equal(field.options?.multiple, true, `${at}: more than one value may be chosen`);
      if (element.kind === "enum") assert.deepEqual(optionValues(field), element.values, `${at}: select options differ from the schema`);
    } else if (field.type === "select") {
      // Free text in the schema, a fixed list in the form because a test
      // enforces the values (team specialisms; checked below).
      assert.equal(field.options?.multiple, true, `${at}: more than one value may be chosen`);
    } else {
      assert.ok(isList(field), `${at}: should be a list`);
      assert.ok(FORM_TYPES[element.kind].includes(field.type), `${at}: ${field.type} for a list of ${element.kind}`);
    }
    if ((!d.optional || d.minLength > 0) && !lockedDown(field)) {
      assert.equal(field.required, true, `${at}: the schema needs at least one item, so the form should require one`);
    }
    return;
  }
  if (d.kind === "object") {
    assert.equal(field.type, "object", `${at}: a group of fields in the schema`);
    assert.ok(!isList(field), `${at}: one group, not a list`);
    compareFields(field.fields, d.shape, at);
    return;
  }
  assert.ok(!isList(field) && !field.options?.multiple, `${at}: one value in the schema, a list in the form`);
  assert.ok(FORM_TYPES[d.kind].includes(field.type), `${at}: form type ${field.type} for a schema ${d.kind}`);
  if (d.kind === "enum") assert.deepEqual(optionValues(field), d.values, `${at}: select options differ from the schema`);
  if (!d.optional && d.kind !== "boolean" && !lockedDown(field)) {
    assert.equal(field.required, true, `${at}: required in the schema, so the form should require it`);
  }
  if (d.maxLength !== undefined && !lockedDown(field)) {
    assert.equal(field.options?.maxlength, d.maxLength, `${at}: the schema allows ${d.maxLength} characters`);
  }
}

/**
 * @param {boolean} [options.markdown] the top level of a Markdown file, where
 *   `body` is the text under the front matter rather than a schema field.
 */
function compareFields(fields, shape, where, { markdown = false } = {}) {
  const own = markdown ? fields.filter((f) => f.name !== "body") : fields;
  const formNames = own.map((f) => f.name);
  for (const name of formNames) {
    assert.ok(name in shape, `${where}: the form has "${name}", which the schema does not`);
  }
  for (const name of Object.keys(shape)) {
    assert.ok(formNames.includes(name), `${where}: the schema field "${name}" is missing from .pages.yml`);
  }
  for (const field of own) compareField(field, shape[field.name], where);
}

/* --------------------------------------------------------------- the content */

/**
 * Whether existing content would pass the form's own checks, so that a staff
 * member opening an entry and pressing Save is never stopped by a value the
 * developer wrote (an option the select lacks, a pattern it fails, a length
 * over the limit). Also: every key in the content is a field in the form.
 */
function checkContent(data, fields, where) {
  for (const key of Object.keys(data)) {
    if (key === "body") continue;
    assert.ok(fields.some((f) => f.name === key), `${where}: "${key}" is in the file but not in the form`);
  }
  for (const field of fields) {
    const value = data[field.name];
    const at = `${where}.${field.name}`;
    if (value === undefined || value === null) continue;
    if (field.type === "object") {
      for (const [i, item] of (isList(field) ? value : [value]).entries()) checkContent(item, field.fields, `${at}[${i}]`);
      continue;
    }
    for (const v of Array.isArray(value) ? value : [value]) {
      if (field.type === "select") assert.ok(optionValues(field).includes(String(v)), `${at}: "${v}" is not an option`);
      if (field.pattern) {
        const regex = new RegExp(typeof field.pattern === "string" ? field.pattern : field.pattern.regex);
        assert.match(String(v), regex, `${at}: "${v}" fails the form's pattern`);
      }
      if (field.options?.maxlength) assert.ok(String(v).length <= field.options.maxlength, `${at} is over ${field.options.maxlength} characters`);
    }
  }
}

const COLLECTIONS = ["team", "articles", "services", "towns"];
const pageEntries = entries.filter((e) => e.type === "file" && e.path.startsWith("src/content/pages/"));

/* -------------------------------------------------------------------- tests */

test("every Markdown collection's form matches its schema field for field", () => {
  for (const name of COLLECTIONS) {
    const e = entry(name);
    assert.equal(e.type, "collection");
    assert.equal(e.path, `src/content/${name}`);
    compareFields(e.fields, schemas[name].shape, name, { markdown: true });
  }
});

test("every page has its own form, and together they cover the pages schema", () => {
  const pages = mdFiles("src/content/pages").map((f) => `src/content/pages/${f}`);
  assert.deepEqual(pageEntries.map((e) => e.path).sort(), pages.sort(), "one form per file in src/content/pages");
  const shape = schemas.pages.shape;
  const covered = new Set();
  for (const e of pageEntries) {
    assert.deepEqual(e.operations, { delete: false }, `${e.name}: a page cannot be deleted`);
    for (const field of e.fields) {
      if (field.name === "body") continue;
      assert.ok(field.name in shape, `${e.name}: "${field.name}" is not in the pages schema`);
      compareField(field, shape[field.name], e.name);
      covered.add(field.name);
    }
  }
  for (const name of Object.keys(shape)) {
    if (NOT_IN_FORM.pages.includes(name)) {
      assert.ok(!covered.has(name), `"${name}" is now in a form; take it off NOT_IN_FORM`);
      continue;
    }
    assert.ok(covered.has(name), `the pages schema field "${name}" is in no page's form`);
  }
});

test("existing Markdown content passes the form's own checks", () => {
  for (const name of COLLECTIONS) {
    const e = entry(name);
    for (const file of mdFiles(e.path)) checkContent(frontmatter(`${e.path}/${file}`), e.fields, `${e.path}/${file}`);
  }
  for (const e of pageEntries) checkContent(frontmatter(e.path), e.fields, e.path);
});

/** The key tree of a JSON value: for arrays, the union over their items. */
function keyTree(value) {
  if (Array.isArray(value)) {
    const objects = value.filter((v) => v && typeof v === "object" && !Array.isArray(v));
    if (!objects.length) return value.length ? "scalar[]" : "empty[]";
    const merged = {};
    for (const item of objects) for (const [k, v] of Object.entries(keyTree(item))) merged[k] = merged[k] ?? v;
    return { "[]": merged };
  }
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, keyTree(v)]));
  return "scalar";
}

/** Compare a form with the keys a JSON file actually has. */
function compareJson(fields, tree, where) {
  for (const key of Object.keys(tree)) {
    assert.ok(fields.some((f) => f.name === key), `${where}: the file has "${key}", which the form does not`);
  }
  for (const field of fields) {
    const at = `${where}.${field.name}`;
    const node = tree[field.name];
    if (node === undefined) {
      // Pages CMS leaves an empty value out of the file when it saves (an
      // empty list, a cleared sentence), so an optional field may be absent.
      assert.ok(!field.required, `${at}: required in the form but not in the file`);
    } else if (node === "empty[]") {
      // An empty list in the file shows nothing to compare with; the form
      // must still be a list. (clinic.json openingHours: the shape is the
      // OpeningHours typedef in src/data/site.js.)
      assert.ok(isList(field), `${at}: the file has a list`);
    } else if (node === "scalar[]") {
      assert.ok(isList(field) && field.type !== "object", `${at}: the file has a list of words`);
    } else if (node === "scalar") {
      assert.ok(!isList(field) && field.type !== "object", `${at}: the file has one value`);
    } else if (node["[]"]) {
      assert.ok(isList(field) && field.type === "object", `${at}: the file has a list of groups of fields`);
      compareJson(field.fields, node["[]"], `${at}[]`);
    } else {
      assert.ok(!isList(field) && field.type === "object", `${at}: the file has one group of fields`);
      compareJson(field.fields, node, at);
    }
  }
}

const JSON_FILES = {
  clinic: "public/assets/content/clinic.json",
  "house-copy": "public/assets/content/house-copy.json",
  "house-rooms": "public/assets/content/house-rooms.json",
  "library-shelf": "src/data/library-shelf.json",
  "shared-text": "src/data/shared-text.json",
};

test("every JSON file's form matches the keys in the file", () => {
  for (const [name, path] of Object.entries(JSON_FILES)) {
    const e = entry(name);
    assert.equal(e.type, "file");
    assert.equal(e.path, path);
    assert.equal(e.format, "json");
    assert.deepEqual(e.operations, { delete: false }, `${name}: the file cannot be deleted`);
    const data = JSON.parse(read(path));
    compareJson(e.fields, keyTree(data), name);
    checkContent(data, e.fields, path);
  }
});

test("keyed objects in the house text are fixed groups, not lists staff can add to", () => {
  const copy = entry("house-copy");
  const field = (path) => {
    let fields = copy.fields;
    let found;
    for (const name of path.split(".")) {
      found = fields.find((f) => f.name === name);
      assert.ok(found, `house-copy has no ${path}`);
      fields = found.fields;
    }
    return found;
  };
  const data = JSON.parse(read(JSON_FILES["house-copy"]));
  for (const path of ["assessments.packages", "groups.programs"]) {
    const group = field(path);
    assert.equal(group.type, "object");
    assert.ok(!isList(group), `${path} must not be a list`);
    const keys = path.split(".").reduce((o, k) => o[k], data);
    assert.deepEqual(group.fields.map((f) => f.name).sort(), Object.keys(keys).sort());
  }
});

test("lists the developer must grow are fixed at their current length", () => {
  const fixed = (entryName, path, length) => {
    const found = [...walk(entry(entryName).fields)].find((w) => w.path === path)?.field;
    assert.ok(found, `${entryName} has no ${path}`);
    assert.equal(typeof found.list, "object", `${entryName} ${path}: needs list min and max`);
    assert.equal(found.list.min, length, `${entryName} ${path}: min`);
    assert.equal(found.list.max, length, `${entryName} ${path}: max`);
  };
  const copy = JSON.parse(read(JSON_FILES["house-copy"]));
  const rooms = JSON.parse(read(JSON_FILES["house-rooms"]));
  const shelf = JSON.parse(read(JSON_FILES["library-shelf"]));
  // A volume needs a shape and colours in library-shelf.js; a room, a scene.
  fixed("library-shelf", "volumes[]", shelf.volumes.length);
  fixed("house-rooms", "rooms[]", rooms.rooms.length);
  // The house's copies match people, books and articles by id, and each
  // philosophy principle has its own sign.
  fixed("house-copy", "philosophy.principles[]", 5);
  fixed("house-copy", "team.availability[]", copy.team.availability.length);
  fixed("house-copy", "team.members[]", copy.team.members.length);
  fixed("house-copy", "library.products[]", copy.library.products.length);
  fixed("house-copy", "library.blogArticles[]", copy.library.blogArticles.length);
  // Each home card links to a section, which only the developer sets.
  fixed("page-home", "routes[]", frontmatter("src/content/pages/home.md").routes.length);
});

/**
 * Fields only the developer may change. Every field with one of these names,
 * anywhere in the form, is hidden or read-only, apart from the exceptions
 * below; and every path listed in DEVELOPER_ONLY is.
 */
const DEVELOPER_ONLY_NAMES = ["id", "sourceUrl", "documentTitle", "path", "redirectFrom", "href", "titleLang"];
const EDITABLE_EXCEPTIONS = [
  // A town fact's source is a citation the page prints, not an address on
  // this site. Staff adding a fact must be able to give its source.
  "towns facts[].sourceUrl",
];
const DEVELOPER_ONLY = [
  // The file name is the address; `kind` decides /therapy/ or /assessments/,
  // and for a town whether it has a page at all.
  "services kind",
  "towns kind",
  // The home cards' links and room pictures.
  "page-home routes[].image",
  // Not shown on the home page (src/pages/index.astro); kept for later.
  "page-home lede",
  "page-home headline",
  "page-home headlineAccent",
  "clinic bookingUrl",
  "clinic postalAddress.addressCountry",
  // Matched to the members list by name (content-data.js).
  "house-copy team.dogs",
];

test("ids, addresses and other developer-only fields cannot be edited", () => {
  for (const e of entries) {
    for (const { field, path } of walk(e.fields)) {
      const key = `${e.name} ${path}`;
      if (DEVELOPER_ONLY_NAMES.includes(field.name) && !EDITABLE_EXCEPTIONS.includes(key)) {
        assert.ok(lockedDown(field), `${key} must be hidden or read-only`);
      }
    }
  }
  for (const key of DEVELOPER_ONLY) {
    const [name, path] = key.split(" ");
    const found = [...walk(entry(name).fields)].find((w) => w.path === path);
    assert.ok(found, `${key} is not in .pages.yml`);
    assert.ok(lockedDown(found.field), `${key} must be hidden or read-only`);
  }
  for (const key of EDITABLE_EXCEPTIONS) {
    const [name, path] = key.split(" ");
    assert.ok([...walk(entry(name).fields)].some((w) => w.path === path), `${key} is not in .pages.yml`);
  }
  // Medicare amounts and redirects are not in the CMS at all.
  const everyPath = entries.map((e) => e.path).join("\n");
  assert.ok(!everyPath.includes("medicare"), "src/data/medicare.js is developer-only");
  assert.ok(!everyPath.includes("redirects"), "redirects are developer-only");
});

test('"Show on the live website" is a switch on every entry and every switchable page item', () => {
  const expected = [
    "team draft",
    "articles draft",
    "services draft",
    "services fees[].draft",
    "towns draft",
    "page-home routes[].draft",
    "page-fees fees[].draft",
    "page-assessments packages[].draft",
    "page-group-therapy programs[].draft",
  ];
  const found = [];
  for (const e of entries) {
    for (const { field, path } of walk(e.fields)) {
      if (field.name !== "draft") continue;
      found.push(`${e.name} ${path}`);
      assert.equal(field.type, "boolean", `${e.name} ${path}: a switch`);
      assert.equal(field.label, "Hidden from the live website", `${e.name} ${path}: label`);
      assert.match(field.description ?? "", /Preview/, `${e.name} ${path}: help text explains Preview and live`);
      assert.ok(!lockedDown(field), `${e.name} ${path}: staff must be able to use it`);
    }
  }
  assert.deepEqual(found.sort(), expected.sort());

  // Each switch is a boolean in the schema too.
  const shape = (name) => schemas[name].shape;
  const isBool = (s) => describe(s).kind === "boolean";
  for (const name of COLLECTIONS) assert.ok(isBool(shape(name).draft), `${name}.draft`);
  assert.ok(isBool(describe(shape("services").fees).element.shape.draft));
  for (const list of ["fees", "packages", "programs", "routes"]) {
    assert.ok(isBool(describe(shape("pages")[list]).element.shape.draft), `pages ${list}[].draft`);
  }

  // Pages CMS writes front matter with the `yaml` package: the switch lands
  // as a bare top-level boolean, which is what the sitemap filter reads.
  const written = stringify({ title: "A new article", draft: true });
  assert.match(written, /^draft: true$/m);
  assert.ok(isDraftFrontMatter(written));
  assert.ok(!isDraftFrontMatter(stringify({ title: "Live", draft: false })));
});

test("new team members and new articles start switched off", () => {
  const draftOf = (name) => entry(name).fields.find((f) => f.name === "draft");
  assert.equal(draftOf("team").default, true);
  assert.equal(draftOf("articles").default, true);
  // A default only applies where the file has no `draft`, so every existing
  // file must carry one or opening it would switch it off.
  for (const name of ["team", "articles"]) {
    for (const file of mdFiles(`src/content/${name}`)) {
      assert.equal(typeof frontmatter(`src/content/${name}/${file}`).draft, "boolean", `src/content/${name}/${file} has no draft`);
    }
  }
});

test("optional dates start empty, so opening an entry never stamps today's date on it", () => {
  // Pages CMS fills an empty date field with today unless a default is given.
  for (const e of entries) {
    for (const { field, path } of walk(e.fields)) {
      if (field.type === "date" && !field.required) assert.equal(field.default, "", `${e.name} ${path}`);
    }
  }
});

test("team specialisms offer exactly the values the clinic signed off", () => {
  const review = read("docs/team-specialisms-review.md");
  const signedOff = (key) =>
    [...new Set(
      [...review.matchAll(new RegExp(`^\\| ${key} \\| ([^|]+) \\|`, "gm"))].flatMap((m) => m[1].split(",").map((v) => v.trim()))
    )].sort();
  const team = entry("team").fields;
  for (const key of ["worksWith", "worksOn"]) {
    const field = team.find((f) => f.name === key);
    assert.deepEqual([...optionValues(field)].sort(), signedOff(key), `${key} options`);
  }
  // The caps tests/team-specialisms.test.mjs enforces.
  assert.equal(team.find((f) => f.name === "worksWith").options.max, 4);
  assert.equal(team.find((f) => f.name === "worksOn").options.max, 5);
});

test("links to team members and service pages offer only entries that exist", () => {
  const teamIds = mdFiles("src/content/team").map((f) => f.slice(0, -3));
  const serviceIds = mdFiles("src/content/services").map((f) => f.slice(0, -3));
  const option = (name, field) => optionValues(entry(name).fields.find((f) => f.name === field));
  // Team members cannot be deleted in the CMS (they are switched off
  // instead), so an option here can never point at a missing file. Someone
  // added in the CMS is offered once the developer adds them here.
  assert.deepEqual(entry("team").operations, { rename: false, delete: false });
  for (const id of [...option("articles", "author"), ...option("services", "clinicians")]) {
    assert.ok(teamIds.includes(id), `${id} is offered but has no file in src/content/team`);
  }
  // Service pages are created by the developer only, so the list is complete.
  assert.deepEqual(entry("services").operations, { create: false, rename: false, delete: false });
  assert.deepEqual([...option("services", "related")].sort(), serviceIds.sort());
});

test("staff may create and delete articles; nothing can be renamed", () => {
  assert.deepEqual(entry("articles").operations, { rename: false });
  assert.deepEqual(entry("towns").operations, { create: false, rename: false, delete: false });
  for (const e of entries.filter((e) => e.type === "collection")) {
    assert.equal(e.operations?.rename, false, `${e.name}: renaming a file changes a page's address`);
    assert.equal(e.subfolders, false, `${e.name}: the site reads one folder`);
  }
});

test("photos and pictures upload to the folders the site reads them from", () => {
  const media = Object.fromEntries(config.media.map((m) => [m.name, m]));
  assert.equal(media.team.input, UPLOAD_DIR);
  assert.equal(media.team.output, "/assets/team");
  assert.deepEqual(media.team.extensions, ["jpg", "jpeg", "png", "webp"]);
  assert.equal(media.library.input, "public/assets/library");
  // tests/articles.test.mjs: every article picture is under /assets/library/.
  assert.equal(media.library.output, "/assets/library");
  for (const m of config.media) assert.equal(m.rename, "safe", `${m.name}: lower-case, dash-separated file names`);

  const imageFields = entries.flatMap((e) => [...walk(e.fields)].filter((w) => w.field.type === "image").map((w) => `${e.name} ${w.path} ${w.field.options?.media}`));
  assert.deepEqual(imageFields.sort(), ["articles image library", "team image team"]);
  const body = entry("articles").fields.find((f) => f.name === "body");
  assert.equal(body.options?.media, "library");

  // Keys a form does not list survive a save (JSON and front matter alike).
  assert.equal(config.settings?.content?.merge, true);
});
