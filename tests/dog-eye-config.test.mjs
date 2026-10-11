import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { defaultDogEyeSettings as settings } from "../public/assets/scripts/site-data.js";

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
const controllerScript = await readProjectFile("public/assets/scripts/dog-eye-controller.js");
const styles = await readProjectFile("public/assets/styles/main.css");

assert.equal(settings.insideImageSize.width, 1672);
assert.equal(settings.insideImageSize.height, 940);
assert.equal(settings.eyes.length, 4, "dog-eye settings should define four editable eyes");

for (const eye of settings.eyes) {
  assert.equal(typeof eye.key, "string");
  assert.equal(typeof eye.label, "string");
  for (const field of ["x", "y", "size", "pupilSize", "maxX", "maxY", "visible"]) {
    assert.equal(typeof eye[field], "number", `${eye.key}.${field} should be numeric`);
  }
}

assert.match(indexHtml, /id="dogEyeLayer"/);
assert.doesNotMatch(indexHtml, /Archived dog-eye cursor-follow experiment/);
assert.match(debugPanel, /id="debugDogEyeSelect"/);
assert.match(debugPanel, /id="debugDogEyeConfirm"/);
assert.match(siteData, /dogEyeFields/);
assert.match(siteData, /defaultDogEyeSettings/);
assert.match(appScript, /createDogEyeController/);
assert.match(debugMount, /createDogEyeDebugger/);
assert.match(controllerScript, /eye\.size \/ insideImageSize\.width \* 100/);
assert.match(controllerScript, /eye\.pupilSize \/ eyeSize \* 100/);
assert.doesNotMatch(controllerScript, /eye\.pupilSize \/ insideImageSize\.width \* 100/);
assert.doesNotMatch(controllerScript, /formatNumber\(eye\.size\)}px/);
assert.match(styles, /aspect-ratio:\s*1/);
