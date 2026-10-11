export function createEntranceVideoController({
  stage,
  doorHotspot,
  doorVideo,
  turntable,
  insideScene,
  onEnterInside,
  reducedMotionQuery
}) {
  let playing = false;

  /*
   * With `prefers-reduced-motion: reduce` the door opens straight onto the
   * room: no swing round to the door, no door-opening video, only the short
   * fade the interior has under reduced motion (main.css). PRODUCT.md
   * principle 2: ambient things stay skippable. Read at click time, so a
   * setting changed during the visit is respected (issue #70).
   */
  function motionReduced() {
    return reducedMotionQuery?.matches === true;
  }

  /*
   * Which room the front door opens onto. The turntable stamps it on the button
   * from the `main-door` hotspot, so the answer stays in the content model with
   * every other door instead of being spelled a second time here.
   *
   * It has to be asked for by name. The video's `ended` handler used to hand its
   * own Event object straight to `enterInsideView` as the room id, and the house
   * only ever landed in the welcome room because an Event matches no room and the
   * fallback caught it. Take the fallback away — or walk out of a room and come
   * back to the front door, which leaves the last room still active — and the
   * entrance video ends somewhere other than the entry hall.
   */
  function frontDoorRoom() {
    return doorHotspot.dataset.targetRoom || undefined;
  }

  function skip() {
    if (!playing || insideScene.isActive) return;
    enterInsideView();
  }

  function enterInsideView(roomId = frontDoorRoom()) {
    if (insideScene.isActive) return;

    playing = false;
    turntable.lockInteraction();
    doorVideo.pause();
    doorVideo.currentTime = 0;
    stage.classList.remove("is-playing");
    onEnterInside?.();
    insideScene.enter({ roomId });
  }

  function reset() {
    playing = false;
    doorVideo.pause();
    doorVideo.currentTime = 0;
    stage.classList.remove("is-playing");
  }

  function init() {
    doorHotspot.addEventListener("click", async () => {
      if (playing || insideScene.isActive) return;

      if (motionReduced()) {
        enterInsideView();
        return;
      }

      playing = true;
      turntable.lockInteraction();
      turntable.setTargetAngle(turntable.centreAngle);
      await turntable.waitForCentre();

      doorVideo.currentTime = 0;
      stage.classList.add("is-playing");

      try {
        await new Promise((resolve) => setTimeout(resolve, 360));
        if (!playing || insideScene.isActive) return;
        await doorVideo.play();
      } catch (error) {
        playing = false;
        stage.classList.remove("is-playing");
        turntable.unlockInteraction();
      }
    });

    doorVideo.addEventListener("dblclick", skip);
    doorVideo.addEventListener("ended", () => enterInsideView());
  }

  return {
    enterInsideView,
    init,
    reset
  };
}
