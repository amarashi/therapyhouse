export function createEntranceVideoController({
  stage,
  doorHotspot,
  doorVideo,
  turntable,
  insideScene,
  playbackRate = 1,
  onEnterInside
}) {
  let playing = false;
  const transitionPlaybackRate = Math.max(0.25, Math.min(playbackRate, 1));

  function prepareVideo() {
    doorVideo.defaultPlaybackRate = transitionPlaybackRate;
    doorVideo.playbackRate = transitionPlaybackRate;
  }

  function skip() {
    if (!playing || insideScene.isActive) return;
    enterInsideView();
  }

  function enterInsideView() {
    if (insideScene.isActive) return;

    playing = false;
    turntable.lockInteraction();
    doorVideo.pause();
    doorVideo.currentTime = 0;
    prepareVideo();
    stage.classList.remove("is-playing");
    onEnterInside?.();
    insideScene.enter();
  }

  function reset() {
    playing = false;
    doorVideo.pause();
    doorVideo.currentTime = 0;
    prepareVideo();
    stage.classList.remove("is-playing");
  }

  function init() {
    prepareVideo();

    doorHotspot.addEventListener("click", async () => {
      if (playing || insideScene.isActive) return;

      playing = true;
      turntable.lockInteraction();
      turntable.setTargetAngle(turntable.centreAngle);
      await turntable.waitForCentre();

      doorVideo.currentTime = 0;
      prepareVideo();
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
    doorVideo.addEventListener("ended", enterInsideView);
  }

  return {
    enterInsideView,
    init,
    reset
  };
}
