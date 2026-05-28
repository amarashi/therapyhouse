import { clamp, getImageHeight, getImageWidth } from "./utils.js";

function colorChannelToHex(value) {
  return clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0");
}

function rgbToHex(red, green, blue) {
  return `#${colorChannelToHex(red)}${colorChannelToHex(green)}${colorChannelToHex(blue)}`;
}

export function createInsideScene({
  stage,
  insideView,
  insideParallax,
  insideParallaxLayers,
  insideLightLayers = [],
  sceneSigns,
  cursorSparkleLayer,
  insideImageSize,
  edgeFallbackColors,
  parallaxDepths,
  reducedMotionQuery
}) {
  let active = false;
  let parallaxFrameId = 0;
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let lastSparkleTime = 0;
  const cursorSparklesEnabled = false;

  function getAverageEdgeColor(image, edge) {
    const sourceWidth = getImageWidth(image);
    const sourceHeight = getImageHeight(image);
    const sampleWidth = 256;
    const sampleHeight = Math.max(1, Math.round(sampleWidth * sourceHeight / sourceWidth));
    const sampleCanvas = document.createElement("canvas");
    sampleCanvas.width = sampleWidth;
    sampleCanvas.height = sampleHeight;

    const sampleContext = sampleCanvas.getContext("2d", { willReadFrequently: true });
    if (!sampleContext) return null;

    sampleContext.drawImage(image, 0, 0, sampleWidth, sampleHeight);

    const edgeDepth = Math.max(1, Math.round(Math.min(sampleWidth, sampleHeight) * 0.035));
    let x = 0;
    let y = 0;
    let width = sampleWidth;
    let height = sampleHeight;

    if (edge === "top") {
      height = edgeDepth;
    } else if (edge === "bottom") {
      y = sampleHeight - edgeDepth;
      height = edgeDepth;
    } else if (edge === "left") {
      width = edgeDepth;
    } else if (edge === "right") {
      x = sampleWidth - edgeDepth;
      width = edgeDepth;
    }

    const pixels = sampleContext.getImageData(x, y, width, height).data;
    let red = 0;
    let green = 0;
    let blue = 0;
    let weight = 0;

    for (let index = 0; index < pixels.length; index += 4) {
      const alpha = pixels[index + 3] / 255;
      red += pixels[index] * alpha;
      green += pixels[index + 1] * alpha;
      blue += pixels[index + 2] * alpha;
      weight += alpha;
    }

    if (weight <= 0) return null;
    return rgbToHex(red / weight, green / weight, blue / weight);
  }

  function applyEdgeColors(colors) {
    if (!insideView) return;

    Object.entries(colors).forEach(([edge, color]) => {
      insideView.style.setProperty(`--inside-edge-${edge}-color`, color);
    });
  }

  async function updateEdgeColors() {
    const baseLayer = insideParallaxLayers[0];
    applyEdgeColors(edgeFallbackColors);
    if (!baseLayer) return;

    try {
      if (!baseLayer.complete && typeof baseLayer.decode === "function") {
        await baseLayer.decode();
      }

      const sampledColors = {};
      ["top", "right", "bottom", "left"].forEach((edge) => {
        sampledColors[edge] = getAverageEdgeColor(baseLayer, edge) || edgeFallbackColors[edge];
      });
      applyEdgeColors(sampledColors);
    } catch (error) {
      applyEdgeColors(edgeFallbackColors);
    }
  }

  function getInsideImageRect() {
    const rect = insideView.getBoundingClientRect();
    const viewRatio = rect.width / rect.height;
    const imageRatio = insideImageSize.width / insideImageSize.height;
    let width = rect.width;
    let height = rect.height;

    if (imageRatio > viewRatio) {
      width = rect.width;
      height = width / imageRatio;
    } else {
      height = rect.height;
      width = height * imageRatio;
    }

    return {
      x: (rect.width - width) / 2,
      y: (rect.height - height) / 2,
      width,
      height
    };
  }

  function updateFrameClip(imageRect = getInsideImageRect()) {
    if (!insideParallax) return;

    const viewRect = insideView.getBoundingClientRect();
    const frameLeft = Math.max(0, imageRect.x);
    const frameTop = Math.max(0, imageRect.y);
    const frameRight = Math.max(0, viewRect.width - imageRect.x - imageRect.width);
    const frameBottom = Math.max(0, viewRect.height - imageRect.y - imageRect.height);

    insideView.style.setProperty("--inside-frame-left", `${frameLeft}px`);
    insideView.style.setProperty("--inside-frame-top", `${frameTop}px`);
    insideView.style.setProperty("--inside-frame-right", `${frameRight}px`);
    insideView.style.setProperty("--inside-frame-bottom", `${frameBottom}px`);
    insideParallax.style.setProperty("--inside-frame-left", `${frameLeft}px`);
    insideParallax.style.setProperty("--inside-frame-top", `${frameTop}px`);
    insideParallax.style.setProperty("--inside-frame-right", `${frameRight}px`);
    insideParallax.style.setProperty("--inside-frame-bottom", `${frameBottom}px`);
  }

  function updateSceneSigns() {
    const imageRect = getInsideImageRect();
    const viewRect = insideView.getBoundingClientRect();
    const margin = 12;

    updateFrameClip(imageRect);

    sceneSigns.forEach((sign) => {
      const imageX = Number(sign.dataset.x);
      const imageY = Number(sign.dataset.y);
      if (!Number.isFinite(imageX) || !Number.isFinite(imageY)) return;

      const width = sign.offsetWidth || 160;
      const height = sign.offsetHeight || 58;
      const x = imageRect.x + imageRect.width * imageX / insideImageSize.width;
      const y = imageRect.y + imageRect.height * imageY / insideImageSize.height;
      const clampedX = clamp(x, margin + width / 2, Math.max(margin + width / 2, viewRect.width - margin - width / 2));
      const clampedY = clamp(y, margin + height / 2, Math.max(margin + height / 2, viewRect.height - margin - height / 2));

      sign.style.setProperty("--sign-x", `${clampedX}px`);
      sign.style.setProperty("--sign-y", `${clampedY}px`);
      sign.style.setProperty("--sign-perspective", `${Number(sign.dataset.perspective) || 900}px`);
      sign.style.setProperty("--sign-depth", `${Number(sign.dataset.depth) || 0}px`);
      sign.style.setProperty("--sign-rotate-x", `${Number(sign.dataset.rotateX) || 0}deg`);
      sign.style.setProperty("--sign-rotate-y", `${Number(sign.dataset.rotateY) || 0}deg`);
      sign.style.setProperty("--sign-rotate", `${Number(sign.dataset.rotate) || 0}deg`);
      sign.style.setProperty("--sign-skew-x", `${Number(sign.dataset.skewX) || 0}deg`);
      sign.style.setProperty("--sign-skew-y", `${Number(sign.dataset.skewY) || 0}deg`);
      sign.style.setProperty("--sign-scale", `${Number(sign.dataset.scale) || 1}`);
      sign.style.setProperty("--sign-scale-x", `${Number(sign.dataset.scaleX) || 1}`);
      sign.style.setProperty("--sign-scale-y", `${Number(sign.dataset.scaleY) || 1}`);
    });
  }

  function applyParallaxTransform(layer, depth, useMotion) {
    const offsetX = useMotion ? currentX * depth.x : 0;
    const offsetY = useMotion ? currentY * depth.y : 0;
    layer.style.transform = `translate3d(${offsetX.toFixed(2)}px, ${offsetY.toFixed(2)}px, 0)`;
  }

  function applyParallax() {
    const useMotion = !reducedMotionQuery.matches;
    insideParallaxLayers.forEach((layer, index) => {
      const depth = parallaxDepths[index] || parallaxDepths[parallaxDepths.length - 1] || { x: 0, y: 0 };
      applyParallaxTransform(layer, depth, useMotion);
    });

    insideLightLayers.forEach((layer) => {
      applyParallaxTransform(layer, parallaxDepths[0] || { x: 0, y: 0 }, useMotion);
    });
  }

  function scheduleParallaxUpdate() {
    if (parallaxFrameId) return;
    parallaxFrameId = requestAnimationFrame(updateParallax);
  }

  function updateParallax() {
    parallaxFrameId = 0;

    const easing = 0.14;
    currentX += (targetX - currentX) * easing;
    currentY += (targetY - currentY) * easing;
    applyParallax();

    const remainingX = Math.abs(targetX - currentX);
    const remainingY = Math.abs(targetY - currentY);
    if (active && (remainingX > 0.002 || remainingY > 0.002)) {
      scheduleParallaxUpdate();
    }
  }

  function updateParallaxTarget(clientX, clientY) {
    if (!active || !stage.classList.contains("inside-visible")) return;

    const rect = insideView.getBoundingClientRect();
    const width = Math.max(rect.width, 1);
    const height = Math.max(rect.height, 1);
    targetX = clamp((clientX - rect.left) / width * 2 - 1, -1, 1);
    targetY = clamp((clientY - rect.top) / height * 2 - 1, -1, 1);
    scheduleParallaxUpdate();
  }

  function resetParallax(immediate = false) {
    targetX = 0;
    targetY = 0;

    if (immediate) {
      if (parallaxFrameId) {
        cancelAnimationFrame(parallaxFrameId);
        parallaxFrameId = 0;
      }
      currentX = 0;
      currentY = 0;
      applyParallax();
      return;
    }

    scheduleParallaxUpdate();
  }

  function spawnCursorSparkle(clientX, clientY) {
    if (!cursorSparklesEnabled) return;
    if (!active || !stage.classList.contains("inside-visible") || !cursorSparkleLayer) return;

    const now = performance.now();
    if (now - lastSparkleTime < 24) return;
    lastSparkleTime = now;

    const rect = insideView.getBoundingClientRect();
    const sparkle = document.createElement("span");
    const size = 5 + Math.random() * 8;
    const driftX = (Math.random() - 0.5) * 36;
    const driftY = -18 - Math.random() * 34;
    const rotate = Math.random() * 180;

    sparkle.className = "cursor-sparkle";
    sparkle.style.setProperty("--sparkle-x", `${clientX - rect.left}px`);
    sparkle.style.setProperty("--sparkle-y", `${clientY - rect.top}px`);
    sparkle.style.setProperty("--sparkle-size", `${size}px`);
    sparkle.style.setProperty("--sparkle-drift-x", `${driftX}px`);
    sparkle.style.setProperty("--sparkle-drift-y", `${driftY}px`);
    sparkle.style.setProperty("--sparkle-rotate", `${rotate}deg`);

    cursorSparkleLayer.appendChild(sparkle);
    window.setTimeout(() => sparkle.remove(), 1000);
  }

  function enter({ onReady } = {}) {
    if (active) return;

    active = true;
    stage.classList.add("is-inside");
    resetParallax(true);
    updateSceneSigns();
    requestAnimationFrame(() => {
      updateSceneSigns();
      requestAnimationFrame(() => {
        updateSceneSigns();
        stage.classList.add("inside-visible");
        onReady?.();
      });
    });
  }

  function leave() {
    if (!active) return;

    active = false;
    stage.classList.remove("inside-visible", "is-inside", "is-playing");
    cursorSparkleLayer?.replaceChildren();
    resetParallax(true);
  }

  function init() {
    insideView.addEventListener("pointermove", (event) => {
      updateParallaxTarget(event.clientX, event.clientY);
    });

    insideView.addEventListener("pointerleave", () => {
      resetParallax();
    });

    stage.addEventListener("pointermove", (event) => {
      spawnCursorSparkle(event.clientX, event.clientY);
    });

    if (typeof reducedMotionQuery.addEventListener === "function") {
      reducedMotionQuery.addEventListener("change", () => {
        resetParallax(true);
      });
    }
  }

  return {
    enter,
    get isActive() {
      return active;
    },
    init,
    leave,
    resetParallax,
    updateEdgeColors,
    updateSceneSigns
  };
}
