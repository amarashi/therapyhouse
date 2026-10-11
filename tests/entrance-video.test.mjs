import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

import { createEntranceVideoController } from "../public/assets/scripts/entrance-video.js";

/**
 * Issue #70. With `prefers-reduced-motion: reduce` the front door cuts
 * straight to the interior instead of swinging the house round and playing
 * the door-opening video. Without it, the video plays as before.
 *
 * The controller is driven with stand-ins for the page: the door is a real
 * EventTarget, and the video, turntable and interior record what was asked
 * of them.
 */

function setUp({ reduce }) {
  const calls = [];
  const doorHotspot = new EventTarget();
  doorHotspot.dataset = { targetRoom: "welcome" };
  const doorVideo = new EventTarget();
  Object.assign(doorVideo, {
    currentTime: 0,
    play: async () => calls.push("video.play"),
    pause: () => calls.push("video.pause"),
  });
  const classes = new Set();
  const stage = {
    classList: {
      add: (c) => classes.add(c),
      remove: (...cs) => cs.forEach((c) => classes.delete(c)),
    },
  };
  const turntable = {
    centreAngle: 0,
    lockInteraction: () => calls.push("turntable.lock"),
    unlockInteraction: () => calls.push("turntable.unlock"),
    setTargetAngle: () => calls.push("turntable.turn"),
    waitForCentre: async () => calls.push("turntable.waitForCentre"),
  };
  const insideScene = {
    isActive: false,
    enter: ({ roomId }) => {
      insideScene.isActive = true;
      calls.push(`inside.enter:${roomId}`);
    },
  };
  const controller = createEntranceVideoController({
    stage,
    doorHotspot,
    doorVideo,
    turntable,
    insideScene,
    reducedMotionQuery: { matches: reduce },
  });
  controller.init();
  return { calls, classes, doorHotspot, doorVideo };
}

const settle = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

test("with reduced motion, the door cuts straight to the room and no video plays", async () => {
  const { calls, classes, doorHotspot } = setUp({ reduce: true });
  doorHotspot.dispatchEvent(new Event("click"));
  await settle(450);

  assert.ok(calls.includes("inside.enter:welcome"), "the visitor was not taken inside");
  assert.ok(!calls.includes("video.play"), "the door video played under reduced motion");
  assert.ok(!calls.includes("turntable.turn"), "the house swung round under reduced motion");
  assert.ok(!classes.has("is-playing"), "the video layer was shown");
});

test("without reduced motion, the door video plays and ending it enters the room", async () => {
  const { calls, classes, doorHotspot, doorVideo } = setUp({ reduce: false });
  doorHotspot.dispatchEvent(new Event("click"));
  await settle(450);

  assert.ok(calls.includes("turntable.turn"));
  assert.ok(calls.includes("video.play"), "the door video did not play");
  assert.ok(classes.has("is-playing"));
  assert.ok(!calls.some((c) => c.startsWith("inside.enter")), "entered before the video ended");

  doorVideo.dispatchEvent(new Event("ended"));
  assert.ok(calls.includes("inside.enter:welcome"));
  assert.ok(!classes.has("is-playing"));
});

test("the page passes its reduced-motion query to the door, and the fade is short", async () => {
  const app = await readFile(new URL("../public/assets/scripts/app.js", import.meta.url), "utf8");
  const call = app.slice(app.indexOf("createEntranceVideoController({"));
  assert.match(call.slice(0, call.indexOf("});")), /reducedMotionQuery/);

  const css = await readFile(new URL("../public/assets/styles/main.css", import.meta.url), "utf8");
  const fade = css.match(
    /@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.inside-view\s*\{\s*transition-duration:\s*(\d+)ms/
  );
  assert.ok(fade, "no reduced-motion fade for the interior");
  assert.ok(Number(fade[1]) <= 300, `the reduced-motion fade is ${fade[1]}ms`);
});
