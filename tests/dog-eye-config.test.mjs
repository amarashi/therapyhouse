import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);

async function readProjectFile(path) {
  return readFile(new URL(path, root), "utf8");
}

const settings = JSON.parse(await readProjectFile("therapyhouse-dog-eye-settings.json"));
const indexHtml = await readProjectFile("index.html");
const siteData = await readProjectFile("assets/scripts/site-data.js");
const appScript = await readProjectFile("assets/scripts/app.js");

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
