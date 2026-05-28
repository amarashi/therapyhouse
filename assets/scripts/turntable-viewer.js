import { clamp, getImageHeight, getImageWidth, requestIdleTask } from "./utils.js";

export function createTurntableViewer({ stage, canvas, doorHotspot, frames, frameCount }) {
  const context = canvas.getContext("2d", { alpha: false });
  const imageCache = new Array(frameCount);
  const imageLoadPromises = new Array(frameCount);
  const loadedFrameIndexes = new Set();
  const centreAngle = (frameCount - 1) / 2;
  const hoverMaxFramesPerSecond = 22;
  const hoverMinimumStrength = 0.22;
  const angleEase = 0.34;
  let remainingFrameLoadTimer = 0;
  let targetAngle = centreAngle;
  let displayAngle = targetAngle;
  let hoverVelocity = 0;
  let hoverActive = false;
  let isInteractionLocked = false;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartAngle = 0;
  let lastAnimationTime = performance.now();
  let lastRenderedFrame = "";
  let animationFrameId = 0;
  let lastHoverInputTime = 0;

  function getSceneRectCss() {
    const rect = stage.getBoundingClientRect();
    const effectiveImageWidth = 960 - 8 - 28;
    const effectiveImageHeight = 540 - 8 - 28;
    const stageRatio = rect.width / rect.height;
    const imageRatio = effectiveImageWidth / effectiveImageHeight;
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
    const progress = targetAngle / (frameCount - 1);
    const doorX = 0.56 - (progress - 0.5) * 0.14;
    const doorY = 0.53;
    const doorWidth = 0.16;
    const doorHeight = 0.28;

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

    const canvasRatio = canvas.width / canvas.height;
    const imageRatio = getImageWidth(image) / getImageHeight(image);
    let drawWidth = canvas.width;
    let drawHeight = canvas.height;

    if (imageRatio > canvasRatio) {
      drawHeight = drawWidth / imageRatio;
    } else {
      drawWidth = drawHeight * imageRatio;
    }

    const x = (canvas.width - drawWidth) / 2;
    const y = (canvas.height - drawHeight) / 2;
    const cropLeft = 8;
    const cropTop = 8;
    const cropRight = 28;
    const cropBottom = 28;
    const sourceWidth = Math.max(1, getImageWidth(image) - cropLeft - cropRight);
    const sourceHeight = Math.max(1, getImageHeight(image) - cropTop - cropBottom);
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
      renderFrame(displayAngle, true);
    } else {
      ensureAnimation();
    }
    updateHotspot();
  }

  function needsAnimation() {
    const hoverNeedsFrame = !isInteractionLocked && !isDragging && hoverActive && hoverVelocity !== 0;
    return hoverNeedsFrame || isDragging || Math.abs(targetAngle - displayAngle) > 0.015;
  }

  function ensureAnimation() {
    if (animationFrameId) return;
    lastAnimationTime = performance.now();
    animationFrameId = requestAnimationFrame(animate);
  }

  function animate(now = performance.now()) {
    animationFrameId = 0;
    const elapsed = Math.min(48, now - lastAnimationTime);
    lastAnimationTime = now;

    if (hoverActive && now - lastHoverInputTime > 420) {
      hoverActive = false;
      hoverVelocity = 0;
    }

    if (!isInteractionLocked && !isDragging && hoverActive && hoverVelocity !== 0) {
      targetAngle = clamp(targetAngle + hoverVelocity * hoverMaxFramesPerSecond * elapsed / 1000, 0, frameCount - 1);
      updateHotspot();
    }

    const delta = targetAngle - displayAngle;
    if (Math.abs(delta) > 0.015) {
      displayAngle += delta * angleEase;
    } else {
      displayAngle = targetAngle;
    }

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
      hoverActive = false;
      hoverVelocity = 0;

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
        setTargetAngle(dragStartAngle - dx * sensitivity);
        return;
      }

      const position = clamp((event.clientX - rect.left) / Math.max(rect.width, 1), 0, 1);
      const centred = position * 2 - 1;
      const deadZone = 0.18;

      hoverActive = true;
      lastHoverInputTime = performance.now();
      if (Math.abs(centred) <= deadZone) {
        hoverVelocity = 0;
      } else {
        const direction = Math.sign(centred);
        const strength = clamp((Math.abs(centred) - deadZone) / (1 - deadZone), 0, 1);
        const easedStrength = hoverMinimumStrength + (1 - hoverMinimumStrength) * Math.pow(strength, 0.8);
        hoverVelocity = direction * easedStrength;
      }
      ensureAnimation();
    });

    function endDrag(event) {
      isDragging = false;
      if (event.pointerId !== undefined && stage.hasPointerCapture(event.pointerId)) {
        stage.releasePointerCapture(event.pointerId);
      }
      ensureAnimation();
    }

    stage.addEventListener("pointerup", endDrag);
    stage.addEventListener("pointercancel", endDrag);
    stage.addEventListener("pointerleave", () => {
      isDragging = false;
      hoverActive = false;
      hoverVelocity = 0;
    });

    stage.addEventListener("wheel", (event) => {
      if (isInteractionLocked) return;

      event.preventDefault();
      hoverActive = false;
      hoverVelocity = 0;

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
