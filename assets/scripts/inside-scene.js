import { clamp, getImageHeight, getImageWidth } from "./utils.js";

const defaultImageSize = { width: 1672, height: 940 };
const defaultEdgeFallbackColors = {
  top: "#34231a",
  right: "#2d211a",
  bottom: "#24170f",
  left: "#31231b"
};
const defaultParallaxDepths = [
  { x: -3, y: 0 },
  { x: 5, y: 0 },
  { x: 14, y: 1.5 }
];

function colorChannelToHex(value) {
  return clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0");
}

function rgbToHex(red, green, blue) {
  return `#${colorChannelToHex(red)}${colorChannelToHex(green)}${colorChannelToHex(blue)}`;
}

function toDatasetValue(value, fallback = 0) {
  return String(Number.isFinite(Number(value)) ? value : fallback);
}

export function createInsideScene({
  stage,
  insideView,
  insideParallax,
  insideParallaxLayers: initialInsideParallaxLayers = [],
  insideLightLayers = [],
  insideEyeLayers = [],
  sceneSignLayer,
  sceneSigns: initialSceneSigns = [],
  cursorSparkleLayer,
  insideImageSize = defaultImageSize,
  edgeFallbackColors = defaultEdgeFallbackColors,
  parallaxDepths = defaultParallaxDepths,
  roomScenes = null,
  reducedMotionQuery
}) {
  let active = false;
  let parallaxFrameId = 0;
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let lastSparkleTime = 0;
  let actionHandler = null;
  const cursorSparklesEnabled = false;
  const sceneSigns = [...initialSceneSigns];
  const roomSceneMap = roomScenes?.rooms || {};
  const fallbackRoomId = roomScenes?.initialRoomId || Object.keys(roomSceneMap)[0] || "welcome";
  let activeRoomId = fallbackRoomId;
  let currentInsideImageSize = insideImageSize;
  let currentEdgeFallbackColors = edgeFallbackColors;
  let currentParallaxDepths = parallaxDepths;
  let insideParallaxLayers = [...initialInsideParallaxLayers];

  function getActiveRoomScene() {
    return roomSceneMap[activeRoomId] || roomSceneMap[fallbackRoomId] || null;
  }

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
    applyEdgeColors(currentEdgeFallbackColors);
    if (!baseLayer) return;

    try {
      if (!baseLayer.complete && typeof baseLayer.decode === "function") {
        await baseLayer.decode();
      }

      const sampledColors = {};
      ["top", "right", "bottom", "left"].forEach((edge) => {
        sampledColors[edge] = getAverageEdgeColor(baseLayer, edge) || currentEdgeFallbackColors[edge];
      });
      applyEdgeColors(sampledColors);
    } catch (error) {
      applyEdgeColors(currentEdgeFallbackColors);
    }
  }

  function getInsideImageRect() {
    const rect = insideView.getBoundingClientRect();
    const viewRatio = rect.width / rect.height;
    const imageRatio = currentInsideImageSize.width / currentInsideImageSize.height;
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
      const x = imageRect.x + imageRect.width * imageX / currentInsideImageSize.width;
      const y = imageRect.y + imageRect.height * imageY / currentInsideImageSize.height;
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

  function renderRoomBackground(roomScene) {
    if (!insideParallax || !roomScene?.background?.layers) return;

    insideParallax.querySelectorAll(".inside-parallax__layer").forEach((layer) => layer.remove());

    const nextLayers = roomScene.background.layers.map((layerConfig, index) => {
      const image = document.createElement("img");
      image.className = ["inside-parallax__layer", layerConfig.className].filter(Boolean).join(" ");
      image.src = layerConfig.src;
      image.alt = layerConfig.alt || "";
      image.draggable = false;
      image.decoding = "async";
      image.dataset.roomId = roomScene.id;
      image.dataset.layerIndex = String(index);
      image.style.zIndex = String(layerConfig.zIndex ?? index);
      insideParallax.appendChild(image);
      return image;
    });

    insideParallaxLayers.splice(0, insideParallaxLayers.length, ...nextLayers);
  }

  function createRoomHotspotButton(hotspotConfig) {
    const button = document.createElement("button");
    const position = hotspotConfig.position || {};
    button.className = ["scene-sign", hotspotConfig.className].filter(Boolean).join(" ");
    button.type = "button";
    button.dataset.roomHotspotId = hotspotConfig.id;
    button.dataset.action = hotspotConfig.action || hotspotConfig.id || "content";
    button.dataset.contentKey = hotspotConfig.contentKey || "";
    button.dataset.targetRoom = hotspotConfig.targetRoom || "";
    button.dataset.x = toDatasetValue(position.x);
    button.dataset.y = toDatasetValue(position.y);
    button.dataset.perspective = toDatasetValue(position.perspective, 900);
    button.dataset.depth = toDatasetValue(position.depth);
    button.dataset.rotateX = toDatasetValue(position.rotateX);
    button.dataset.rotateY = toDatasetValue(position.rotateY);
    button.dataset.rotate = toDatasetValue(position.rotate);
    button.dataset.skewX = toDatasetValue(position.skewX);
    button.dataset.skewY = toDatasetValue(position.skewY);
    button.dataset.scale = toDatasetValue(position.scale, 1);
    button.dataset.scaleX = toDatasetValue(position.scaleX, 1);
    button.dataset.scaleY = toDatasetValue(position.scaleY, 1);
    button.setAttribute("aria-label", hotspotConfig.ariaLabel || hotspotConfig.label || hotspotConfig.id);

    const title = document.createElement("span");
    title.className = "scene-sign__title";
    title.textContent = hotspotConfig.label || hotspotConfig.id;
    button.appendChild(title);
    return button;
  }

  function renderRoomHotspots(roomScene) {
    if (!sceneSignLayer || !Array.isArray(roomScene?.hotspots)) return;

    const buttons = roomScene.hotspots.map(createRoomHotspotButton);
    sceneSignLayer.replaceChildren(...buttons);
    sceneSigns.splice(0, sceneSigns.length, ...buttons);
  }

  function applyRoomEffects(roomScene) {
    const effects = roomScene?.effects || {};
    insideLightLayers.forEach((layer) => {
      layer.hidden = effects.firelight === false;
    });
    insideEyeLayers.forEach((layer) => {
      layer.hidden = effects.dogEyes === false;
    });
  }

  function setActiveRoom(roomId) {
    const nextRoom = roomSceneMap[roomId] || roomSceneMap[fallbackRoomId];
    if (!nextRoom) return false;

    activeRoomId = nextRoom.id;
    currentInsideImageSize = nextRoom.imageSize || insideImageSize;
    currentEdgeFallbackColors = nextRoom.edgeFallbackColors || edgeFallbackColors;
    currentParallaxDepths = nextRoom.parallaxDepths || parallaxDepths;
    insideView.dataset.room = activeRoomId;
    stage.dataset.room = activeRoomId;
    renderRoomBackground(nextRoom);
    renderRoomHotspots(nextRoom);
    applyRoomEffects(nextRoom);
    resetParallax(true);
    updateSceneSigns();
    updateEdgeColors();
    return true;
  }

  function applyParallaxTransform(layer, depth, useMotion) {
    const offsetX = useMotion ? currentX * depth.x : 0;
    const offsetY = useMotion ? currentY * depth.y : 0;
    layer.style.transform = `translate3d(${offsetX.toFixed(2)}px, ${offsetY.toFixed(2)}px, 0)`;
  }

  function applyParallax() {
    const useMotion = !reducedMotionQuery.matches;
    insideParallaxLayers.forEach((layer, index) => {
      const depth = currentParallaxDepths[index] || currentParallaxDepths[currentParallaxDepths.length - 1] || { x: 0, y: 0 };
      applyParallaxTransform(layer, depth, useMotion);
    });

    insideLightLayers.forEach((layer) => {
      applyParallaxTransform(layer, currentParallaxDepths[0] || { x: 0, y: 0 }, useMotion);
    });

    insideEyeLayers.forEach((layer) => {
      applyParallaxTransform(layer, currentParallaxDepths[1] || { x: 0, y: 0 }, useMotion);
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

  function handleSceneSignClick(event) {
    const sign = event.target.closest(".scene-sign");
    if (!sign || !sceneSignLayer?.contains(sign)) return;
    actionHandler?.(sign.dataset.action, sign, activeRoomId);
  }

  function setSceneActionHandler(handler) {
    actionHandler = typeof handler === "function" ? handler : null;
  }

  function enter({ roomId = activeRoomId, onReady } = {}) {
    setActiveRoom(roomId);
    if (active) {
      onReady?.();
      return;
    }

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
    setActiveRoom(activeRoomId);

    insideView.addEventListener("pointermove", (event) => {
      updateParallaxTarget(event.clientX, event.clientY);
    });

    insideView.addEventListener("pointerleave", () => {
      resetParallax();
    });

    sceneSignLayer?.addEventListener("click", handleSceneSignClick);

    stage.addEventListener("pointermove", (event) => {
      spawnCursorSparkle(event.clientX, event.clientY);
    });

    if (typeof reducedMotionQuery.addEventListener === "function") {
      reducedMotionQuery.addEventListener("change", () => {
        resetParallax(true);
      });
    }
  }

  setActiveRoom(activeRoomId);

  return {
    enter,
    get activeRoomId() {
      return activeRoomId;
    },
    get isActive() {
      return active;
    },
    getSceneSigns() {
      return sceneSigns;
    },
    init,
    leave,
    resetParallax,
    setActiveRoom,
    setSceneActionHandler,
    updateEdgeColors,
    updateSceneSigns
  };
}
