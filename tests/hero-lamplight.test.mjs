import assert from "node:assert/strict";
import test from "node:test";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";

/*
 * The home page's welcome: "Welcome to" set small over "Therapy House", the
 * words rising in once, and lamplight drifting across them (chosen from the
 * welcome prototype, which is gone).
 */
const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const hero = await read("src/components/HeroReveal.astro");
const home = await read("src/pages/index.astro");

test("the home page uses the greeting and the lamp, and the prototype is gone", () => {
  assert.match(home, /greeting="Welcome to"/);
  assert.match(home, /title="Therapy House"/);
  assert.match(home, /\blamplight\b/);
  assert.ok(!existsSync(new URL("../src/components/WelcomeHeroPrototype.astro", import.meta.url)));
  assert.doesNotMatch(home, /WelcomeHeroPrototype/);
});

test("the heading is written once; the lamp's warm copy exists only in the browser", () => {
  // The copy is cloned by the script, so the HTML, a search snippet and a
  // screen reader all read the heading once.
  assert.doesNotMatch(hero, /class="hero__words hero__words--lit"/);
  assert.match(hero, /words\.cloneNode\(true\)/);
  assert.match(hero, /lit\.setAttribute\('aria-hidden', 'true'\)/);
});

test("nothing moves under reduced motion, and the lamp stops off screen", () => {
  const script = hero.slice(hero.indexOf("Lamplight on the words (chosen"));
  assert.match(script, /if \(reduced\.matches\) return;/);
  assert.match(script, /IntersectionObserver/);
  // The heading is simply there on arrival: its words no longer rise in.
  assert.doesNotMatch(hero, /hero-word-rise/);
});
