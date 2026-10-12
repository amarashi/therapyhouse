import {
  defaultFirelightSettings,
  defaultDogEyeSettings,
  dogEyeFields,
  dogEyeStorageKey,
  firelightFields,
  firelightStorageKey,
  frameCount,
  frames,
  insideEdgeFallbackColors,
  insideImageSize,
  insideParallaxDepths
} from "./site-data.js";
import { requestIdleTask } from "./utils.js";
import { exteriorHotspots, formerRoomIds, houseContent, previews, roomNavigation, roomSceneDefaults, teamMembers } from "./content-data.js?v=20261013-motion";
import { createDogEyeController } from "./dog-eye-controller.js?v=20261013-motion";
import { createEntranceVideoController } from "./entrance-video.js?v=20261013-rooms";
import { createFirelightController } from "./firelight-controller.js";
import { createInsideScene } from "./inside-scene.js?v=20261013-motion";
import { createModalDialog } from "./modal-dialog.js";
import { createTeamCarousel } from "./team-carousel.js?v=20261013-motion";
import { createTurntableViewer } from "./turntable-viewer.js?v=20261013-motion";

const stage = document.getElementById("stage");
const canvas = document.getElementById("viewerCanvas");
const doorHotspot = document.getElementById("doorHotspot");
const exteriorHotspotLayer = document.getElementById("exteriorHotspotLayer");
const doorVideo = document.getElementById("doorVideo");
const insideView = document.getElementById("insideView");
const insideParallax = document.getElementById("insideParallax");
const insideParallaxLayers = Array.from(document.querySelectorAll(".inside-parallax__layer"));
const insideLightLayers = Array.from(document.querySelectorAll(".inside-firelight-layer"));
const insideEyeLayers = Array.from(document.querySelectorAll(".dog-eye-layer"));
const insideFirelightLayer = document.getElementById("insideFirelightLayer");
const dogEyeLayer = document.getElementById("dogEyeLayer");
const sceneSignLayer = document.getElementById("sceneSignLayer");
const teamCarouselElement = document.getElementById("teamCarousel");
const teamCarouselDeck = document.getElementById("teamCarouselDeck");
const teamCarouselNav = teamCarouselElement.querySelector(".team-carousel__nav");
const teamCarouselCount = document.getElementById("teamCarouselCount");
const teamCarouselPrev = document.getElementById("teamCarouselPrev");
const teamCarouselNext = document.getElementById("teamCarouselNext");
const teamCarouselClose = document.getElementById("teamCarouselClose");
const contentModal = document.getElementById("contentModal");
const contentModalPanel = contentModal.querySelector(".content-modal__panel");
const contentModalClose = document.getElementById("contentModalClose");
const contentModalEyebrow = document.getElementById("contentModalEyebrow");
const contentModalTitle = document.getElementById("contentModalTitle");
const contentModalBody = document.getElementById("contentModalBody");
const contentModalActions = document.getElementById("contentModalActions");
const contactModal = document.getElementById("contactModal");
const contactModalClose = document.getElementById("contactModalClose");
const cursorSparkleLayer = document.getElementById("cursorSparkleLayer");
const houseExit = document.getElementById("houseExit");
const roomMenuToggle = document.getElementById("roomMenuToggle");
const roomMenuList = document.getElementById("roomMenuList");
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
/*
 * Save-Data is the browser passing on "this visitor is on a metered or slow
 * connection". With it, or with reduced motion, the exterior holds still on
 * one frame instead of fetching the 48-frame turntable, and with Save-Data
 * the interior waits to be walked into before it loads.
 */
const saveData = navigator.connection?.saveData === true;
const holdStill = saveData || reducedMotionQuery.matches;

const firelightController = createFirelightController({
  layer: insideFirelightLayer,
  defaultSettings: defaultFirelightSettings,
  fields: firelightFields,
  insideImageSize,
  storageKey: firelightStorageKey
});

const dogEyeController = createDogEyeController({
  layer: dogEyeLayer,
  insideView,
  defaultSettings: defaultDogEyeSettings,
  fields: dogEyeFields,
  insideImageSize,
  storageKey: dogEyeStorageKey
});

const turntable = createTurntableViewer({
  stage,
  canvas,
  doorHotspot,
  exteriorHotspotLayer,
  exteriorHotspots,
  onExteriorHotspot: (hotspot) => {
    if (!hotspot.targetRoom || insideScene.isActive) return;

    goToRoom(hotspot.targetRoom);
  },
  frames,
  frameCount,
  still: holdStill
});

const insideScene = createInsideScene({
  stage,
  insideView,
  insideParallax,
  insideParallaxLayers,
  insideLightLayers,
  insideEyeLayers,
  sceneSignLayer,
  sceneSigns: Array.from(document.querySelectorAll(".scene-sign")),
  cursorSparkleLayer,
  insideImageSize,
  edgeFallbackColors: insideEdgeFallbackColors,
  parallaxDepths: insideParallaxDepths,
  roomScenes: roomSceneDefaults,
  reducedMotionQuery
});
const sceneSigns = insideScene.getSceneSigns();

const teamCarousel = createTeamCarousel({
  carousel: teamCarouselElement,
  deck: teamCarouselDeck,
  nav: teamCarouselNav,
  count: teamCarouselCount,
  previousButton: teamCarouselPrev,
  nextButton: teamCarouselNext,
  closeButton: teamCarouselClose,
  // Everyone this build shows, from the team collection (src/lib/house-content.js).
  teamMembers,
  profileLabel: houseContent.profileLabel,
  canOpen: () => insideScene.isActive,
  fallbackFocus: () => insideScene.getSceneSigns().find((sign) => sign.dataset.action === "about")
});

const contentDialog = createModalDialog({
  modal: contentModal,
  closeButton: contentModalClose,
  fallbackFocus: () => insideScene.getSceneSigns().find((sign) => sign.dataset.action === "content"),
  onOpen: () => {
    teamCarousel.close();
    contactDialog.close();
  }
});

const contactDialog = createModalDialog({
  modal: contactModal,
  closeButton: contactModalClose,
  fallbackFocus: () => insideScene.getSceneSigns().find((sign) => sign.dataset.action === "contact"),
  onOpen: () => {
    teamCarousel.close();
    contentDialog.close();
  }
});

const entranceVideo = createEntranceVideoController({
  stage,
  doorHotspot,
  doorVideo,
  turntable,
  insideScene,
  onEnterInside: (roomId) => {
    teamCarousel.preloadImages();
    recordVisit(roomId);
    markMenuRoom(roomId);
    preloadNeighbours(roomId);
  },
  reducedMotionQuery
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

  closeDialogs();
  entranceVideo.reset();
  insideScene.leave();
  turntable.unlockInteraction();
  turntable.resizeCanvas();
}

function closeDialogs() {
  teamCarousel.close();
  contentDialog.close();
  contactDialog.close();
}

/*
 * Moving through the house (docs/house-plan.md, phase C). Each room has its
 * own address, `?room=<id>`, beside the `from` page the exit leads back to,
 * and every move is a browser history entry: the browser's Back button steps
 * back through the rooms, and so does the Back sign in a room. A visit that
 * began in a room has nothing behind it, so there the Back sign goes outside.
 *
 * `restoring` is set while the house is following the history (arriving on a
 * room's address, or the visitor pressing Back) so that following it does not
 * write a new entry on top.
 */
let restoring = false;

function houseAddress(roomId) {
  const url = new URL(window.location.href);
  if (roomId && roomId !== "exterior") url.searchParams.set("room", roomId);
  else url.searchParams.delete("room");
  return url;
}

function recordVisit(roomId) {
  if (restoring) return;
  const depth = (window.history.state?.house ? window.history.state.depth : 0) + 1;
  window.history.pushState({ house: true, room: roomId || "exterior", depth }, "", houseAddress(roomId));
}

function showRoom(roomId) {
  if (!roomSceneDefaults.rooms[roomId]) return;
  if (!insideScene.isActive) {
    entranceVideo.enterInsideView(roomId);
    return;
  }
  if (insideScene.activeRoomId === roomId) return;
  closeDialogs();
  insideScene.setActiveRoom(roomId);
  markMenuRoom(roomId);
  preloadNeighbours(roomId);
}

/*
 * The rooms a visitor can reach from this one load while the house is idle,
 * so the cross-fade into them starts at once (docs/house-plan.md, phase G).
 * Reaching for a door (hovering or focusing a sign or a menu item) loads
 * that room straight away.
 */
function preloadNeighbours(roomId) {
  const room = roomSceneDefaults.rooms[roomId];
  if (!room) return;
  requestIdleTask(() => {
    room.hotspots.filter((spot) => spot.targetRoom).forEach((spot) => insideScene.preloadRoom(spot.targetRoom));
  });
}

function bindDoorPreloading() {
  const reachFor = (event) => {
    const door = event.target.closest?.("[data-target-room], .room-menu__room");
    const roomId = door?.dataset.targetRoom || door?.dataset.room;
    if (roomId && roomId !== "exterior") insideScene.preloadRoom(roomId);
  };
  document.addEventListener("pointerover", reachFor, { passive: true });
  document.addEventListener("focusin", reachFor);
}

/** Go to a room, inside or from the exterior, as a step the visitor can take back. */
function goToRoom(roomId) {
  const wasInside = insideScene.isActive;
  showRoom(roomId);
  // Walking in from outside is recorded by `onEnterInside`.
  if (wasInside) recordVisit(roomId);
}

function goOutside() {
  if (!insideScene.isActive) return;
  returnToExteriorView();
  markMenuRoom("exterior");
  recordVisit("exterior");
}

/* The Back sign: one step back while there is a step inside the house to take. */
function stepBack() {
  if (window.history.state?.house && window.history.state.depth > 0) {
    window.history.back();
  } else {
    goOutside();
  }
}

function followHistory(event) {
  const state = event.state;
  if (!state?.house) return;
  restoring = true;
  try {
    if (state.room === "exterior") {
      returnToExteriorView();
      markMenuRoom("exterior");
    } else {
      showRoom(formerRoomIds[state.room] ?? state.room);
    }
  } finally {
    restoring = false;
  }
}

/* The rooms menu: a disclosure button and a list of rooms (house.astro). */
function markMenuRoom(roomId) {
  roomMenuList?.querySelectorAll(".room-menu__room").forEach((button) => {
    if (button.dataset.room === (roomId || "exterior")) button.setAttribute("aria-current", "location");
    else button.removeAttribute("aria-current");
  });
}

function setMenuOpen(open) {
  if (!roomMenuToggle || !roomMenuList) return;
  roomMenuToggle.setAttribute("aria-expanded", String(open));
  roomMenuList.hidden = !open;
}

function bindRoomMenu() {
  if (!roomMenuToggle || !roomMenuList) return;

  roomMenuToggle.addEventListener("click", () => {
    setMenuOpen(roomMenuList.hidden);
    if (!roomMenuList.hidden) roomMenuList.querySelector('[aria-current="location"], .room-menu__room')?.focus();
  });

  roomMenuList.addEventListener("click", (event) => {
    const button = event.target.closest(".room-menu__room");
    if (!button) return;
    setMenuOpen(false);
    roomMenuToggle.focus();
    if (button.dataset.room === "exterior") goOutside();
    else goToRoom(button.dataset.room);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !roomMenuList.hidden) {
      setMenuOpen(false);
      roomMenuToggle.focus();
    }
  });

  document.addEventListener("pointerdown", (event) => {
    if (!roomMenuList.hidden && !event.target.closest("#roomMenu")) setMenuOpen(false);
  });
}

function createTextElement(tagName, text, className) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  element.textContent = text;
  return element;
}

/* A link that leaves the site (the booking portal, a map) opens a new tab; the
   site's own pages, `tel:` and `mailto:` open where they are. */
function createLink(href, text, className) {
  const link = createTextElement("a", text, className);
  link.href = href;
  if (/^https?:\/\//i.test(href) && new URL(href, window.location.href).origin !== window.location.origin) {
    link.target = "_blank";
    link.rel = "noopener";
  }
  return link;
}

/*
 * A sign's preview (src/lib/house-content.js): a heading, perhaps a short fact
 * under it, a sentence or two, a short list, and the link to the plain page
 * that holds the whole answer. The house previews; the plain pages explain.
 */
function renderContentModal(sign) {
  const preview = previews[sign.dataset.contentKey];
  if (!preview) return false;

  const signLabel = sign.querySelector(".scene-sign__title")?.textContent?.trim() || sign.getAttribute("aria-label") || "Therapy House";
  contentModalTitle.textContent = preview.title || signLabel;
  contentModalEyebrow.textContent = insideScene.activeRoomId
    ? roomNavigation.rooms[insideScene.activeRoomId]?.title || "Therapy House"
    : "Therapy House";

  const body = [];
  if (preview.meta) body.push(createTextElement("p", preview.meta, "content-modal__meta"));
  (preview.text ?? []).forEach((paragraph) => body.push(createTextElement("p", paragraph)));

  if (preview.items?.length) {
    const list = document.createElement("ul");
    list.className = "content-modal__list";
    preview.items.forEach((item) => {
      const entry = document.createElement("li");
      entry.appendChild(item.href ? createLink(item.href, item.title) : createTextElement("span", item.title, "content-modal__item-title"));
      if (item.detail) entry.appendChild(createTextElement("span", item.detail, "content-modal__item-detail"));
      list.appendChild(entry);
    });
    body.push(list);
  }

  /* Booking and calling close every preview as an equal pair (PRODUCT.md,
     DESIGN.md: neither is rendered alone). A preview whose own link is one of
     the two, such as reception's phone sign, leans on the pair instead. */
  const actionHrefs = contentModalActions
    ? Array.from(contentModalActions.querySelectorAll("a"), (link) => link.getAttribute("href"))
    : [];
  if (preview.link && !actionHrefs.includes(preview.link.href)) {
    body.push(createLink(preview.link.href, preview.link.label, "content-modal__more"));
  }

  contentModalBody.replaceChildren(...body);
  contentDialog.open();
  contentModalPanel.scrollTop = 0;
  return true;
}

function bindSceneActions() {
  insideScene.setSceneActionHandler((action, sign) => {
    if (action === "back") {
      stepBack();
    } else if (action === "about") {
      teamCarousel.open();
    } else if (action === "contact") {
      if (insideScene.isActive) contactDialog.open();
    } else if (sign.dataset.targetRoom) {
      goToRoom(sign.dataset.targetRoom);
    } else if (sign.dataset.contentKey) {
      renderContentModal(sign);
    }
  });
}

function bindModalScrolling() {
  const bindPanel = (panel, dialog) => {
    panel.addEventListener("wheel", (event) => {
      if (!dialog.isOpen()) return;

      const maxScrollTop = panel.scrollHeight - panel.clientHeight;
      if (maxScrollTop <= 0) return;

      const modeScale = event.deltaMode === WheelEvent.DOM_DELTA_LINE
        ? 16
        : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
          ? panel.clientHeight
          : 1;
      const scrollDelta = event.deltaY * modeScale;
      if (scrollDelta === 0) return;

      panel.scrollTop = Math.max(0, Math.min(maxScrollTop, panel.scrollTop + scrollDelta));
      event.preventDefault();
      event.stopPropagation();
    }, { passive: false });
  };

  bindPanel(contentModalPanel, contentDialog);
}

function bindKeyboardShortcuts() {
  window.addEventListener("keydown", (event) => {
    if (contentDialog.isOpen()) {
      if (event.key === "Escape") {
        contentDialog.close();
      }
      return;
    }

    if (contactDialog.isOpen()) {
      if (event.key === "Escape") {
        contactDialog.close();
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

/*
 * The reading pages each open on a picture of one of these rooms, and that
 * picture is a door: `?room=services` walks a visitor straight into the
 * consulting room rather than making them find it from the exterior. Only ids
 * that exist are honoured — anything else, and the visit starts where it
 * always did, on the turntable.
 */
function readRequestedRoom() {
  const asked = new URLSearchParams(window.location.search).get("room");
  const requested = formerRoomIds[asked] ?? asked;
  if (!requested || requested === "exterior") return "";

  return roomSceneDefaults.rooms[requested] ? requested : "";
}

/*
 * And the way back out. A visitor who walked in from a page was reading
 * something before they got curious, and the house is a full screen with no
 * chrome — so the page they came from travels with them in `?from` and the
 * exit points at it. Same-origin paths only: `/…` but never `//host`, which
 * the browser would read as another site.
 */
function bindHouseExit() {
  if (!houseExit) return;

  const from = new URLSearchParams(window.location.search).get("from");
  if (from && /^\/(?!\/)/.test(from)) {
    houseExit.href = from;
  }
}

function init() {
  turntable.init();
  firelightController.init();
  dogEyeController.init();
  insideScene.init();
  teamCarousel.init();
  contentDialog.init();
  contactDialog.init();
  entranceVideo.init();
  bindSceneActions();
  bindModalScrolling();
  bindKeyboardShortcuts();

  insideScene.updateEdgeColors();

  window.addEventListener("resize", scheduleResize);
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", scheduleResize);
    window.visualViewport.addEventListener("scroll", scheduleResize);
  }

  updateAppViewportHeight();
  turntable.resizeCanvas();
  bindHouseExit();

  bindRoomMenu();
  bindDoorPreloading();
  const requestedRoom = readRequestedRoom();
  window.history.replaceState({ house: true, room: requestedRoom || "exterior", depth: 0 }, "", houseAddress(requestedRoom));
  window.addEventListener("popstate", followHistory);
  markMenuRoom(requestedRoom || "exterior");
  if (requestedRoom) {
    restoring = true;
    try {
      entranceVideo.enterInsideView(requestedRoom);
    } finally {
      restoring = false;
    }
  }
  turntable.stageFrameLoads();
  scheduleInteriorLoad();
  exposeDebugHooks();
}

/*
 * The interior layers are hidden on arrival, so they wait until the page has
 * painted and gone quiet, then load in the background so the room is ready
 * when the front door opens. Walking in sooner loads them at once (see
 * `insideScene.enter`). Under Save-Data they wait for that walk.
 */
function scheduleInteriorLoad() {
  if (saveData) return;

  const start = () => requestIdleTask(() => insideScene.loadLayers());
  if (document.readyState === "complete") {
    start();
  } else {
    window.addEventListener("load", start, { once: true });
  }
}

/*
 * The tuning panel (`src/house-debug/`) exists only on the dev server. When
 * its markup is on the page, hand it the pieces it adjusts; on the built site
 * there is no panel and nothing is exposed.
 */
function exposeDebugHooks() {
  if (!document.getElementById("debugPanel")) return;

  window.__houseDebugHooks = {
    dogEyeController,
    enterInside: () => entranceVideo.enterInsideView(),
    firelightController,
    insideScene,
    sceneSigns
  };
  document.dispatchEvent(new Event("house:debug-ready"));
}

init();
