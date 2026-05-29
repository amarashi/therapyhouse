import { clamp, getImageHeight, getImageWidth, requestIdleTask } from "./utils.js";

export function createTurntableViewer({
  stage,
  canvas,
  doorHotspot,
  frames,
  frameCount,
  frameCrop = { left: 8, top: 8, right: 28, bottom: 28 },
  frameSize = { width: 960, height: 540 },
  doorHotspotTrack = { startX: 0.63, endX: 0.49, y: 0.53, width: 0.16, height: 0.28 }
}) {
  const context = canvas.getContext("2d", { alpha: false });
  const crop = {
    left: frameCrop.left || 0,
    top: frameCrop.top || 0,
    right: frameCrop.right || 0,
    bottom: frameCrop.bottom || 0
  };
  const effectiveFrameSize = {
    width: Math.max(1, frameSize.width - crop.left - crop.right),
    height: Math.max(1, frameSize.height - crop.top - crop.bottom)
  };
  const imageCache = new Array(frameCount);
  const imageLoadPromises = new Array(frameCount);
  const loadedFrameIndexes = new Set();
  const centreAngle = (frameCount - 1) / 2;
  const hoverMaxFramesPerSecond = 22;
  const hoverMinimumStrength = 0.22;
  const hoverVelocitySmoothing = 14;
  const springStiffness = 92;
  const springDamping = 15;
  const inertiaDecay = 4.8;
  const dragInertiaMinimum = 3;
  let remainingFrameLoadTimer = 0;
  let targetAngle = centreAngle;
  let displayAngle = targetAngle;
  let displayVelocity = 0;
  let hoverVelocity = 0;
  let hoverTargetVelocity = 0;
  let hoverActive = false;
  let inertialVelocity = 0;
  let isInteractionLocked = false;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartAngle = 0;
  let lastDragAngle = 0;
  let lastDragTime = 0;
  let dragVelocity = 0;
  let lastAnimationTime = performance.now();
  let lastRenderedFrame = "";
  let animationFrameId = 0;
  let lastHoverInputTime = 0;

  function getSceneRectCss() {
    const rect = stage.getBoundingClientRect();
    const stageRatio = rect.width / rect.height;
    const imageRatio = effectiveFrameSize.width / effectiveFrameSize.height;
    const isMobilePortrait = window.matchMedia("(max-width: 720px) and (orientation: portrait)").matches;
    let width = rect.width;
    let height = rect.height;

    if (imageRatio > stageRatio) {
      height = width / imageRatio;
    } else {
      width = height * imageRatio;
    }

    return {
      x: (rect.width - width) / 2,
      y: isMobilePortrait ? (rect.height - height) / 2 : rect.height - height,
      width,
      height
    };
  }

  function updateHotspot() {
    const scene = getSceneRectCss();
    const progress = displayAngle / (frameCount - 1);
    const doorX = doorHotspotTrack.startX + (doorHotspotTrack.endX - doorHotspotTrack.startX) * progress;
    const doorY = doorHotspotTrack.y;
    const doorWidth = doorHotspotTrack.width;
    const doorHeight = doorHotspotTrack.height;

    doorHotspot.style.left = `${scene.x + scene.width * (doorX - doorWidth / 2)}px`;
    doorHotspot.style.top = `${scene.y + scene.height * (doorY - doorHeight / 2)}px`;
    doorHotspot.style.width = `${scene.width * doorWidth}px`;
    doorHotspot.style.height = `${scene.height * doorHeight}px`;
  }

  function resizeCanvas() {
    const rect = stage.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(rect.width * ratio));
    const height = Math.max(1, Math.round(rect.height * ratio));

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      renderFrame(displayAngle, true);
    }
    updateHotspot();
  }

  function drawImageContain(image) {
    if (!image) return;
    if (image instanceof HTMLImageElement && image.naturalWidth === 0) return;

    const cropLeft = crop.left;
    const cropTop = crop.top;
    const cropRight = crop.right;
    const cropBottom = crop.bottom;
    const sourceWidth = Math.max(1, getImageWidth(image) - cropLeft - cropRight);
    const sourceHeight = Math.max(1, getImageHeight(image) - cropTop - cropBottom);
    const canvasRatio = canvas.width / canvas.height;
    const imageRatio = sourceWidth / sourceHeight;
    let drawWidth = canvas.width;
    let drawHeight = canvas.height;

    if (imageRatio > canvasRatio) {
      drawHeight = drawWidth / imageRatio;
    } else {
      drawWidth = drawHeight * imageRatio;
    }

    const x = (canvas.width - drawWidth) / 2;
    const y = (canvas.height - drawHeight) / 2;
    context.drawImage(image, cropLeft, cropTop, sourceWidth, sourceHeight, x, y, drawWidth, drawHeight);
  }

  function renderFrame(value, force = false) {
    const frameIndex = Math.round(clamp(value, 0, frameCount - 1));
    const renderKey = `${frameIndex}:${canvas.width}x${canvas.height}`;

    if (!force && renderKey === lastRenderedFrame) return;
    lastRenderedFrame = renderKey;

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    if (!imageCache[frameIndex]) {
      loadFrame(frameIndex);
    }
    drawImageContain(imageCache[frameIndex] || getNearestLoadedFrame(frameIndex));
  }

  function setTargetAngle(nextAngle, immediate = false) {
    targetAngle = clamp(nextAngle, 0, frameCount - 1);
    if (immediate) {
      displayAngle = targetAngle;
      displayVelocity = 0;
      renderFrame(displayAngle, true);
    } else {
      ensureAnimation();
    }
    updateHotspot();
  }

  function needsAnimation() {
    const hoverNeedsFrame = !isInteractionLocked && !isDragging && (hoverActive || Math.abs(hoverVelocity) > 0.001);
    const inertiaNeedsFrame = !isInteractionLocked && !isDragging && Math.abs(inertialVelocity) > 0.015;
    const springNeedsFrame = Math.abs(targetAngle - displayAngle) > 0.01 || Math.abs(displayVelocity) > 0.02;
    return hoverNeedsFrame || inertiaNeedsFrame || isDragging || springNeedsFrame;
  }

  function ensureAnimation() {
    if (animationFrameId) return;
    lastAnimationTime = performance.now();
    animationFrameId = requestAnimationFrame(animate);
  }

  function animate(now = performance.now()) {
    animationFrameId = 0;
    const elapsed = Math.min(48, now - lastAnimationTime);
    const elapsedSeconds = elapsed / 1000;
    lastAnimationTime = now;

    if (hoverActive && now - lastHoverInputTime > 420) {
      hoverActive = false;
      hoverTargetVelocity = 0;
    }

    if (!isInteractionLocked && !isDragging) {
      const velocityBlend = 1 - Math.exp(-hoverVelocitySmoothing * elapsedSeconds);
      hoverVelocity += (hoverTargetVelocity - hoverVelocity) * velocityBlend;

      if (Math.abs(hoverVelocity) > 0.001) {
        targetAngle = clamp(targetAngle + hoverVelocity * hoverMaxFramesPerSecond * elapsedSeconds, 0, frameCount - 1);
      }

      if (Math.abs(inertialVelocity) > 0.015) {
        const nextAngle = clamp(targetAngle + inertialVelocity * elapsedSeconds, 0, frameCount - 1);
        if (nextAngle === 0 || nextAngle === frameCount - 1) {
          inertialVelocity = 0;
        } else {
          inertialVelocity *= Math.exp(-inertiaDecay * elapsedSeconds);
        }
        targetAngle = nextAngle;
      }
    }

    const delta = targetAngle - displayAngle;
    if (Math.abs(delta) > 0.01 || Math.abs(displayVelocity) > 0.02) {
      displayVelocity += delta * springStiffness * elapsedSeconds;
      displayVelocity *= Math.exp(-springDamping * elapsedSeconds);
      displayAngle = clamp(displayAngle + displayVelocity * elapsedSeconds, 0, frameCount - 1);

      if (displayAngle === 0 || displayAngle === frameCount - 1) {
        displayVelocity = 0;
      }
    } else {
      displayAngle = targetAngle;
      displayVelocity = 0;
    }

    updateHotspot();
    renderFrame(displayAngle);
    if (needsAnimation()) {
      animationFrameId = requestAnimationFrame(animate);
    }
  }

  async function loadBitmap(src) {
    const image = new Image();
    image.decoding = "async";
    image.src = src;

    try {
      await image.decode();
    } catch (error) {
      await new Promise((resolve) => {
        image.onload = resolve;
        image.onerror = resolve;
      });
    }

    if ("createImageBitmap" in window && image.complete && image.naturalWidth > 0) {
      try {
        return await createImageBitmap(image);
      } catch (error) {
        return image;
      }
    }

    return image;
  }

  function getNearestLoadedFrame(frameIndex) {
    if (loadedFrameIndexes.size === 0) return null;

    let nearestIndex = null;
    let nearestDistance = Infinity;
    loadedFrameIndexes.forEach((index) => {
      const distance = Math.abs(index - frameIndex);
      if (distance < nearestDistance) {
        nearestIndex = index;
        nearestDistance = distance;
      }
    });

    return nearestIndex === null ? null : imageCache[nearestIndex];
  }

  function loadFrame(index) {
    const frameIndex = Math.round(clamp(index, 0, frameCount - 1));
    if (imageCache[frameIndex]) return Promise.resolve(imageCache[frameIndex]);
    if (imageLoadPromises[frameIndex]) return imageLoadPromises[frameIndex];

    imageLoadPromises[frameIndex] = loadBitmap(frames[frameIndex]).then((image) => {
      imageCache[frameIndex] = image;
      loadedFrameIndexes.add(frameIndex);
      imageLoadPromises[frameIndex] = null;
      if (Math.round(displayAngle) === frameIndex) {
        renderFrame(displayAngle, true);
      }
      return image;
    });

    return imageLoadPromises[frameIndex];
  }

  function loadRemainingFrames(indexes) {
    let cursor = 0;
    const loadChunk = () => {
      const chunkSize = 2;
      const chunk = indexes.slice(cursor, cursor + chunkSize);
      cursor += chunkSize;
      chunk.forEach((index) => loadFrame(index));
      if (cursor < indexes.length) {
        remainingFrameLoadTimer = window.setTimeout(loadChunk, 180);
      } else {
        remainingFrameLoadTimer = 0;
      }
    };

    remainingFrameLoadTimer = window.setTimeout(() => {
      requestIdleTask(loadChunk);
    }, 2200);
  }

  function stageFrameLoads() {
    const centreIndex = Math.round(centreAngle);
    const nearbyIndexes = [];
    for (let offset = 1; offset <= 4; offset += 1) {
      nearbyIndexes.push(centreIndex - offset, centreIndex + offset);
    }

    const remainingIndexes = frames
      .map((_, index) => index)
      .filter((index) => index !== centreIndex && !nearbyIndexes.includes(index));

    loadFrame(centreIndex).then(() => {
      setTargetAngle(centreAngle, true);
      nearbyIndexes.forEach((index) => {
        if (index >= 0 && index < frameCount) {
          loadFrame(index);
        }
      });
      loadRemainingFrames(remainingIndexes);
    });
  }

  function waitForCentre() {
    return new Promise((resolve) => {
      const startedAt = performance.now();
      const check = () => {
        const closeEnough = Math.abs(displayAngle - centreAngle) < 0.08;
        const timedOut = performance.now() - startedAt > 900;
        if (closeEnough || timedOut) {
          setTargetAngle(centreAngle, true);
          resolve();
        } else {
          requestAnimationFrame(check);
        }
      };
      check();
    });
  }

  function init() {
    stage.addEventListener("pointerdown", (event) => {
      if (isInteractionLocked) return;
      if (event.target.closest(".door-hotspot")) return;

      isDragging = true;
      dragStartX = event.clientX;
      dragStartAngle = targetAngle;
      lastDragAngle = targetAngle;
      lastDragTime = performance.now();
      dragVelocity = 0;
      hoverActive = false;
      hoverVelocity = 0;
      hoverTargetVelocity = 0;
      inertialVelocity = 0;

      try {
        stage.setPointerCapture(event.pointerId);
      } catch (error) {
        // Synthetic pointer events in automated tests may not have an active pointer.
      }
    });

    stage.addEventListener("pointermove", (event) => {
      if (isInteractionLocked) return;

      const rect = stage.getBoundingClientRect();

      if (isDragging) {
        const dx = event.clientX - dragStartX;
        const sensitivity = frameCount / Math.max(rect.width, 1);
        const nextAngle = clamp(dragStartAngle - dx * sensitivity, 0, frameCount - 1);
        const now = performance.now();
        const elapsedDragSeconds = Math.max((now - lastDragTime) / 1000, 0.001);
        const nextDragVelocity = (nextAngle - lastDragAngle) / elapsedDragSeconds;

        dragVelocity = dragVelocity * 0.55 + nextDragVelocity * 0.45;
        lastDragAngle = nextAngle;
        lastDragTime = now;
        setTargetAngle(nextAngle);
        return;
      }

      const position = clamp((event.clientX - rect.left) / Math.max(rect.width, 1), 0, 1);
      const centred = position * 2 - 1;
      const deadZone = 0.18;

      hoverActive = true;
      lastHoverInputTime = performance.now();
      if (Math.abs(centred) <= deadZone) {
        hoverTargetVelocity = 0;
      } else {
        const direction = Math.sign(centred);
        const strength = clamp((Math.abs(centred) - deadZone) / (1 - deadZone), 0, 1);
        const easedStrength = hoverMinimumStrength + (1 - hoverMinimumStrength) * Math.pow(strength, 0.8);
        hoverTargetVelocity = direction * easedStrength;
      }
      ensureAnimation();
    });

    function endDrag(event) {
      if (isDragging && Math.abs(dragVelocity) >= dragInertiaMinimum) {
        inertialVelocity = dragVelocity;
      }
      isDragging = false;
      if (event.pointerId !== undefined && stage.hasPointerCapture(event.pointerId)) {
        stage.releasePointerCapture(event.pointerId);
      }
      ensureAnimation();
    }

    stage.addEventListener("pointerup", endDrag);
    stage.addEventListener("pointercancel", endDrag);
    stage.addEventListener("pointerleave", () => {
      if (isDragging && Math.abs(dragVelocity) >= dragInertiaMinimum) {
        inertialVelocity = dragVelocity;
      }
      isDragging = false;
      hoverActive = false;
      hoverTargetVelocity = 0;
      ensureAnimation();
    });

    stage.addEventListener("wheel", (event) => {
      if (isInteractionLocked) return;

      event.preventDefault();
      hoverActive = false;
      hoverVelocity = 0;
      hoverTargetVelocity = 0;
      inertialVelocity = 0;

      const wheelAmount = Math.abs(event.deltaY) > Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
      const wheelStep = clamp(wheelAmount / 80, -3, 3);
      setTargetAngle(targetAngle + wheelStep);
    }, { passive: false });

    window.addEventListener("keydown", (event) => {
      if (isInteractionLocked) return;

      if (event.key === "ArrowLeft") {
        setTargetAngle(targetAngle - 4);
      } else if (event.key === "ArrowRight") {
        setTargetAngle(targetAngle + 4);
      } else if (event.key === "Home") {
        setTargetAngle(0);
      } else if (event.key === "End") {
        setTargetAngle(frameCount - 1);
      }
    });
  }

  return {
    get centreAngle() {
      return centreAngle;
    },
    clearQueuedLoads() {
      if (remainingFrameLoadTimer) {
        window.clearTimeout(remainingFrameLoadTimer);
        remainingFrameLoadTimer = 0;
      }
    },
    init,
    lockInteraction() {
      isInteractionLocked = true;
      hoverActive = false;
      hoverVelocity = 0;
      hoverTargetVelocity = 0;
      inertialVelocity = 0;
    },
    resizeCanvas,
    setTargetAngle,
    stageFrameLoads,
    unlockInteraction() {
      isInteractionLocked = false;
    },
    updateHotspot,
    waitForCentre
  };
}
