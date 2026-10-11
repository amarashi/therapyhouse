import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { defaultFirelightSettings as settings } from "../public/assets/scripts/site-data.js";

const root = new URL("../", import.meta.url);

async function readProjectFile(path) {
  return readFile(new URL(path, root), "utf8");
}

// The tuned values ship in site-data.js; the panel that tunes them is dev-only (#43).
const debugPanel = await readProjectFile("src/house-debug/DebugPanel.astro");
const debugMount = await readProjectFile("src/house-debug/mount.js");
const indexHtml = await readProjectFile("src/pages/house.astro");
const siteData = await readProjectFile("public/assets/scripts/site-data.js");
const appScript = await readProjectFile("public/assets/scripts/app.js");

assert.equal(settings.insideImageSize.width, 1672);
assert.equal(settings.insideImageSize.height, 940);
assert.ok(Array.isArray(settings.lights), "firelight settings should contain a lights array");
assert.ok(settings.lights.length >= 3, "firelight settings should start with several editable lights");

for (const light of settings.lights) {
  assert.equal(typeof light.key, "string");
  assert.equal(typeof light.label, "string");
  for (const field of ["x", "y", "width", "height", "intensity", "coreIntensity", "blur"]) {
    assert.equal(typeof light[field], "number", `${light.key}.${field} should be numeric`);
  }
}

assert.match(indexHtml, /id="insideFirelightLayer"/);
assert.ok(indexHtml.includes("import.meta.env.DEV && <DebugPanel />"), "the tuning panel renders only on the dev server");
assert.match(debugPanel, /<details class="debug-panel__section debug-panel__section--button-debugger"/);
assert.match(debugPanel, /<summary class="debug-panel__summary"[\s\S]*Button Position Debugger/);
assert.match(debugPanel, /id="debugFirelightSelect"/);
assert.match(debugPanel, /<details class="debug-panel__section debug-panel__section--firelight-debugger"/);
assert.match(debugPanel, /<summary class="debug-panel__summary"[\s\S]*Firelight Debugger/);
assert.match(debugPanel, /id="debugFirelightConfirm"/);
assert.match(siteData, /firelightFields/);
assert.match(siteData, /defaultFirelightSettings/);
assert.match(appScript, /createFirelightController/);
assert.match(debugMount, /createFirelightDebugger/);
