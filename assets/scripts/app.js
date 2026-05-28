import {
  defaultFirelightSettings,
  defaultDogEyeSettings,
  dogEyeDownloadName,
  dogEyeFields,
  dogEyeStorageKey,
  firelightDownloadName,
  firelightFields,
  firelightStorageKey,
  frameCount,
  frames,
  insideEdgeFallbackColors,
  insideImageSize,
  insideParallaxDepths,
  signPositionDownloadName,
  signPositionFields,
  signPositionStorageKey,
  teamMembers
} from "./site-data.js";
import { createDogEyeController } from "./dog-eye-controller.js";
import { createDogEyeDebugger } from "./dog-eye-debugger.js";
import { createEntranceVideoController } from "./entrance-video.js";
import { createFirelightController } from "./firelight-controller.js";
import { createFirelightDebugger } from "./firelight-debugger.js";
import { createInsideScene } from "./inside-scene.js";
import { createModalDialog } from "./modal-dialog.js";
import { createSignPositionDebugger } from "./sign-position-debugger.js";
import { createTeamCarousel } from "./team-carousel.js";
import { createTurntableViewer } from "./turntable-viewer.js";

const stage = document.getElementById("stage");
const canvas = document.getElementById("viewerCanvas");
const doorHotspot = document.getElementById("doorHotspot");
const doorVideo = document.getElementById("doorVideo");
const insideView = document.getElementById("insideView");
const insideParallax = document.getElementById("insideParallax");
const insideParallaxLayers = Array.from(document.querySelectorAll(".inside-parallax__layer"));
const insideLightLayers = Array.from(document.querySelectorAll(".inside-firelight-layer"));
const insideEyeLayers = Array.from(document.querySelectorAll(".dog-eye-layer"));
const insideFirelightLayer = document.getElementById("insideFirelightLayer");
const dogEyeLayer = document.getElementById("dogEyeLayer");
const sceneSigns = Array.from(document.querySelectorAll(".scene-sign"));
const teamCarouselElement = document.getElementById("teamCarousel");
const teamCarouselDeck = document.getElementById("teamCarouselDeck");
const teamCarouselNav = teamCarouselElement.querySelector(".team-carousel__nav");
const teamCarouselCount = document.getElementById("teamCarouselCount");
const teamCarouselPrev = document.getElementById("teamCarouselPrev");
const teamCarouselNext = document.getElementById("teamCarouselNext");
const teamCarouselClose = document.getElementById("teamCarouselClose");
const philosophyModal = document.getElementById("philosophyModal");
const philosophyModalPanel = philosophyModal.querySelector(".philosophy-modal__panel");
const philosophyModalClose = document.getElementById("philosophyModalClose");
const contactModal = document.getElementById("contactModal");
const contactModalClose = document.getElementById("contactModalClose");
const cursorSparkleLayer = document.getElementById("cursorSparkleLayer");
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

const firelightController = createFirelightController({
  layer: insideFirelightLayer,
  defaultSettings: defaultFirelightSettings,
  fields: firelightFields,
  insideImageSize,
  storageKey: firelightStorageKey,
  sourceUrl: firelightDownloadName
});

const dogEyeController = createDogEyeController({
  layer: dogEyeLayer,
  insideView,
  defaultSettings: defaultDogEyeSettings,
  fields: dogEyeFields,
  insideImageSize,
  storageKey: dogEyeStorageKey,
  sourceUrl: dogEyeDownloadName
});

const turntable = createTurntableViewer({
  stage,
  canvas,
  doorHotspot,
  frames,
  frameCount
});

const insideScene = createInsideScene({
  stage,
  insideView,
  insideParallax,
  insideParallaxLayers,
  insideLightLayers,
  insideEyeLayers,
  sceneSigns,
  cursorSparkleLayer,
  insideImageSize,
  edgeFallbackColors: insideEdgeFallbackColors,
  parallaxDepths: insideParallaxDepths,
  reducedMotionQuery
});

const teamCarousel = createTeamCarousel({
  carousel: teamCarouselElement,
  deck: teamCarouselDeck,
  nav: teamCarouselNav,
  count: teamCarouselCount,
  previousButton: teamCarouselPrev,
  nextButton: teamCarouselNext,
  closeButton: teamCarouselClose,
  teamMembers,
  canOpen: () => insideScene.isActive,
  fallbackFocus: () => sceneSigns.find((sign) => sign.dataset.action === "about")
});

const philosophyDialog = createModalDialog({
  modal: philosophyModal,
  closeButton: philosophyModalClose,
  fallbackFocus: () => sceneSigns.find((sign) => sign.dataset.action === "philosophy"),
  onOpen: () => {
    teamCarousel.close();
    contactDialog.close();
  }
});

const contactDialog = createModalDialog({
  modal: contactModal,
  closeButton: contactModalClose,
  fallbackFocus: () => sceneSigns.find((sign) => sign.dataset.action === "contact"),
  onOpen: () => {
    teamCarousel.close();
    philosophyDialog.close();
  }
});

const entranceVideo = createEntranceVideoController({
  stage,
  doorHotspot,
  doorVideo,
  turntable,
  insideScene,
  onEnterInside: () => {
    teamCarousel.preloadImages();
  }
});

const debuggerPanel = createSignPositionDebugger({
  elements: {
    panel: document.getElementById("debugPanel"),
    signSelect: document.getElementById("debugSignSelect"),
    controls: document.getElementById("debugControls"),
    confirmButton: document.getElementById("debugConfirm"),
    status: document.getElementById("debugStatus"),
    output: document.getElementById("debugOutput")
  },
  sceneSigns,
  signPositionFields,
  insideImageSize,
  storageKey: signPositionStorageKey,
  downloadName: signPositionDownloadName,
  updateSceneSigns: insideScene.updateSceneSigns
});

const firelightDebugger = createFirelightDebugger({
  elements: {
    select: document.getElementById("debugFirelightSelect"),
    controls: document.getElementById("debugFirelightControls"),
    addButton: document.getElementById("debugFirelightAdd"),
    removeButton: document.getElementById("debugFirelightRemove"),
    confirmButton: document.getElementById("debugFirelightConfirm"),
    status: document.getElementById("debugFirelightStatus"),
    output: document.getElementById("debugFirelightOutput")
  },
  controller: firelightController,
  fields: firelightFields,
  insideImageSize,
  storageKey: firelightStorageKey,
  downloadName: firelightDownloadName
});

const dogEyeDebugger = createDogEyeDebugger({
  elements: {
    select: document.getElementById("debugDogEyeSelect"),
    controls: document.getElementById("debugDogEyeControls"),
    confirmButton: document.getElementById("debugDogEyeConfirm"),
    status: document.getElementById("debugDogEyeStatus"),
    output: document.getElementById("debugDogEyeOutput")
  },
  controller: dogEyeController,
  fields: dogEyeFields,
  insideImageSize,
  storageKey: dogEyeStorageKey,
  downloadName: dogEyeDownloadName
});

let resizeFrameId = 0;

function updateAppViewportHeight() {
  const viewportHeight = window.visualViewport?.height || window.innerHeight || document.documentElement.clientHeight;
  document.documentElement.style.setProperty("--app-viewport-height", `${Math.max(1, viewportHeight)}px`);
}

function scheduleResize() {
  if (resizeFrameId) return;
  resizeFrameId = requestAnimationFrame(() => {
    resizeFrameId = 0;
    updateAppViewportHeight();
    turntable.resizeCanvas();
    insideScene.updateSceneSigns();
  });
}

function returnToExteriorView() {
  if (!insideScene.isActive) return;

  teamCarousel.close();
  philosophyDialog.close();
  contactDialog.close();
  entranceVideo.reset();
  insideScene.leave();
  turntable.unlockInteraction();
  turntable.resizeCanvas();
}

function bindSceneActions() {
  sceneSigns.forEach((sign) => {
    if (sign.dataset.action === "back") {
      sign.addEventListener("click", returnToExteriorView);
    } else if (sign.dataset.action === "about") {
      sign.addEventListener("click", teamCarousel.open);
    } else if (sign.dataset.action === "philosophy") {
      sign.addEventListener("click", () => {
        if (insideScene.isActive) philosophyDialog.open();
      });
    } else if (sign.dataset.action === "contact") {
      sign.addEventListener("click", () => {
        if (insideScene.isActive) contactDialog.open();
      });
    }
  });
}

function bindModalScrolling() {
  philosophyModalPanel.addEventListener("wheel", (event) => {
    if (!philosophyDialog.isOpen()) return;

    const maxScrollTop = philosophyModalPanel.scrollHeight - philosophyModalPanel.clientHeight;
    if (maxScrollTop <= 0) return;

    const modeScale = event.deltaMode === WheelEvent.DOM_DELTA_LINE
      ? 16
      : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
        ? philosophyModalPanel.clientHeight
        : 1;
    const scrollDelta = event.deltaY * modeScale;
    if (scrollDelta === 0) return;

    philosophyModalPanel.scrollTop = Math.max(0, Math.min(maxScrollTop, philosophyModalPanel.scrollTop + scrollDelta));
    event.preventDefault();
    event.stopPropagation();
  }, { passive: false });
}

function bindKeyboardShortcuts() {
  window.addEventListener("keydown", (event) => {
    if (contactDialog.isOpen()) {
      if (event.key === "Escape") {
        contactDialog.close();
      }
      return;
    }

    if (philosophyDialog.isOpen()) {
      if (event.key === "Escape") {
        philosophyDialog.close();
      }
      return;
    }

    if (!teamCarousel.isOpen()) return;

    if (event.key === "Escape") {
      teamCarousel.close();
    } else if (event.key === "ArrowLeft") {
      teamCarousel.showMember(-1);
    } else if (event.key === "ArrowRight") {
      teamCarousel.showMember(1);
    }
  });
}

function init() {
  turntable.init();
  firelightController.init();
  dogEyeController.init();
  insideScene.init();
  teamCarousel.init();
  philosophyDialog.init();
  contactDialog.init();
  entranceVideo.init();
  bindSceneActions();
  bindModalScrolling();
  bindKeyboardShortcuts();

  debuggerPanel.applyStoredPositions();
  insideScene.updateEdgeColors();
  const debugMode = debuggerPanel.init();
  firelightDebugger.init();
  dogEyeDebugger.init();

  window.addEventListener("resize", scheduleResize);
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", scheduleResize);
    window.visualViewport.addEventListener("scroll", scheduleResize);
  }

  updateAppViewportHeight();
  turntable.resizeCanvas();
  if (debugMode) {
    entranceVideo.enterInsideView();
  }
  turntable.stageFrameLoads();
}

init();
