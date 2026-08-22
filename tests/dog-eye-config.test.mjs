import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);

async function readProjectFile(path) {
  return readFile(new URL(path, root), "utf8");
}

const settings = JSON.parse(await readProjectFile("public/therapyhouse-dog-eye-settings.json"));
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
assert.match(indexHtml, /id="debugDogEyeSelect"/);
assert.match(indexHtml, /id="debugDogEyeConfirm"/);
assert.match(siteData, /dogEyeFields/);
assert.match(siteData, /defaultDogEyeSettings/);
assert.match(appScript, /createDogEyeController/);
assert.match(appScript, /createDogEyeDebugger/);
assert.match(controllerScript, /eye\.size \/ insideImageSize\.width \* 100/);
assert.match(controllerScript, /eye\.pupilSize \/ eyeSize \* 100/);
assert.doesNotMatch(controllerScript, /eye\.pupilSize \/ insideImageSize\.width \* 100/);
assert.doesNotMatch(controllerScript, /formatNumber\(eye\.size\)}px/);
assert.match(styles, /aspect-ratio:\s*1/);
