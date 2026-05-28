import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);

async function readProjectFile(path) {
  return readFile(new URL(path, root), "utf8");
}

const settings = JSON.parse(await readProjectFile("therapyhouse-firelight-settings.json"));
const indexHtml = await readProjectFile("index.html");
const siteData = await readProjectFile("assets/scripts/site-data.js");
const appScript = await readProjectFile("assets/scripts/app.js");

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
assert.match(indexHtml, /<details class="debug-panel__section debug-panel__section--button-debugger"/);
assert.match(indexHtml, /<summary class="debug-panel__summary"[\s\S]*Button Position Debugger/);
assert.match(indexHtml, /id="debugFirelightSelect"/);
assert.match(indexHtml, /id="debugFirelightConfirm"/);
assert.match(siteData, /firelightFields/);
assert.match(siteData, /defaultFirelightSettings/);
assert.match(appScript, /createFirelightController/);
assert.match(appScript, /createFirelightDebugger/);
