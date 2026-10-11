import assert from "node:assert/strict";
import test from "node:test";
import { readFile, readdir } from "node:fs/promises";

/**
 * Issue #43 (register rows R-27, R-28): nothing development-only ships from
 * `public/`, the house has one canonical address, and its heavy media waits
 * until it is wanted.
 */

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("public/ holds no development files", async () => {
  const top = await readdir(new URL("public/", root));
  assert.ok(!top.includes("rooms-preview.html"), "rooms-preview.html belongs in dev/room-orbits/");
  assert.deepEqual(top.filter((name) => name.endsWith(".json")), [], "tuning JSON belongs in site-data.js");

  const scripts = await readdir(new URL("public/assets/scripts/", root));
  assert.deepEqual(scripts.filter((name) => /debugger/.test(name)), [], "debuggers belong in src/house-debug/");

  const rooms = await readdir(new URL("public/assets/rooms/", root), { withFileTypes: true });
  assert.deepEqual(
    rooms.filter((entry) => entry.isDirectory() || entry.name.endsWith(".json") || /-poster\.webp$/.test(entry.name)).map((entry) => entry.name),
    [],
    "room-orbit frames, rooms.json and posters belong in dev/room-orbits/"
  );

  const assets = await readdir(new URL("public/assets/", root));
  assert.deepEqual(assets.filter((name) => name.endsWith(".md")), []);
});

test("every script in public/assets/scripts is reachable from app.js", async () => {
  const seen = new Set();
  const queue = ["app.js"];
  while (queue.length) {
    const name = queue.shift();
    if (seen.has(name)) continue;
    seen.add(name);
    const source = await read(`public/assets/scripts/${name}`);
    for (const [, dep] of source.matchAll(/from\s+"\.\/([\w-]+\.js)(?:\?[^"]*)?"/g)) queue.push(dep);
  }
  const shipped = (await readdir(new URL("public/assets/scripts/", root))).filter((name) => name.endsWith(".js"));
  assert.deepEqual(shipped.filter((name) => !seen.has(name)), []);
});

test("the house page has one canonical address, without the query string", async () => {
  const house = await read("src/pages/house.astro");
  assert.match(house, /const canonical = new URL\(Astro\.url\.pathname, Astro\.site\)\.href;/);
  assert.match(house, /<link rel="canonical" href=\{canonical\}>/);
  // The heroes keep their ?from= / ?room= doors into the house.
  const hero = await read("src/components/HeroReveal.astro");
  assert.match(hero, /\/house\/\?from=/);
  assert.match(hero, /\/house\/\?room=/);
});

test("the debug panel renders only on the dev server", async () => {
  const house = await read("src/pages/house.astro");
  assert.ok(house.includes("{import.meta.env.DEV && <DebugPanel />}"));
  assert.doesNotMatch(house, /id="debugPanel"/);
  const app = await read("public/assets/scripts/app.js");
  assert.doesNotMatch(app, /from "\.\/[\w-]*debugger\.js"/);
});

test("the hidden interior layers wait until after first paint", async () => {
  const house = await read("src/pages/house.astro");
  for (const n of [1, 2, 3]) {
    assert.ok(house.includes(`data-src={withBase("/assets/media/inside-layer-${n}.webp")}`), `layer ${n} has no eager src`);
    assert.ok(!house.includes(` src={withBase("/assets/media/inside-layer-${n}.webp")}`));
  }
  const scene = await read("public/assets/scripts/inside-scene.js");
  assert.match(scene, /image\.dataset\.src = layerConfig\.src;/);
  assert.match(scene, /function loadLayers\(\)/);
  assert.match(scene, /setActiveRoom\(roomId\);\s*loadLayers\(\);/, "walking in loads the layers at once");
  const app = await read("public/assets/scripts/app.js");
  assert.match(app, /window\.addEventListener\("load", start, \{ once: true \}\)/);
  assert.match(app, /if \(saveData\) return;/, "Save-Data waits for the visitor to walk in");
});

test("reduced motion and Save-Data hold the exterior on one frame", async () => {
  const app = await read("public/assets/scripts/app.js");
  assert.match(app, /const saveData = navigator\.connection\?\.saveData === true;/);
  assert.match(app, /const holdStill = saveData \|\| reducedMotionQuery\.matches;/);
  assert.match(app, /still: holdStill/);
  const viewer = await read("public/assets/scripts/turntable-viewer.js");
  assert.match(viewer, /if \(still\) \{\s*loadFrame\(centreIndex\)\.then\(\(\) => setTargetAngle\(centreAngle, true\)\);\s*return;/);
});
