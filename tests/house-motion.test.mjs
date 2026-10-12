import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

/*
 * docs/house-plan.md, phase G: moving through the house is smooth and cheap.
 * These read the source, because the browser behaviour they protect (a
 * cross-fade after decode, no layout reads per pointer move) needs a real
 * browser to watch; the house was checked in one when this landed.
 */
const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const scene = await read("public/assets/scripts/inside-scene.js");
const app = await read("public/assets/scripts/app.js");
const dogEyes = await read("public/assets/scripts/dog-eye-controller.js");
const styles = await read("public/assets/styles/main.css");

/** The body of a function declared in `source`, up to the next one at the same depth. */
function body(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `no function ${name}`);
  const next = source.indexOf("\n  function ", start + 1);
  return source.slice(start, next === -1 ? undefined : next);
}

test("a room change decodes the next picture before fading it in over the last", () => {
  const render = body(scene, "renderRoomBackground");
  assert.match(render, /\.decode\(\)/);
  assert.match(render, /is-entering/);
  assert.match(render, /is-leaving/);
  assert.match(render, /transitionend/, "the old picture waits for the fade to finish");
  assert.match(render, /change !== roomChange/, "a later change wins over a slow earlier one");
  assert.match(body(scene, "setActiveRoom"), /crossFade = active && nextRoom\.id !== activeRoomId/);
});

test("the pointer never makes the house measure its layout on every move", () => {
  assert.doesNotMatch(body(scene, "updateParallaxTarget"), /getBoundingClientRect/);
  assert.match(body(scene, "updateParallax"), /Math\.pow\(1 - 0\.14, elapsed/, "easing is timed, not per frame");
  assert.match(dogEyes, /layer\.hidden\) return;/);
  assert.match(dogEyes, /requestAnimationFrame/);
  // Sizes are all read before any sign is moved.
  const signs = body(scene, "updateSceneSigns");
  assert.ok(signs.indexOf("offsetWidth") < signs.indexOf("setProperty"));
});

test("the rooms a visitor can reach next load ahead of them", () => {
  assert.match(scene, /function preloadRoom\(roomId\)/);
  assert.match(app, /function preloadNeighbours\(roomId\)/);
  assert.match(app, /addEventListener\("pointerover", reachFor/);
});

test("every new movement is opacity-only and stops under reduced motion", () => {
  assert.match(styles, /\.inside-parallax__layer \{\s*transition: opacity/);
  const reduced = styles.slice(styles.lastIndexOf("@media (prefers-reduced-motion: reduce)"));
  assert.match(reduced, /\.inside-parallax__layer,\s*\.scene-sign-layer,\s*\.scene-sign \{\s*transition: none;/);
});
