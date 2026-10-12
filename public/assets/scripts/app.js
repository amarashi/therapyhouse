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
  insideParallaxDepths,
  teamMembers
} from "./site-data.js";
import { requestIdleTask } from "./utils.js";
import { exteriorHotspots, phoneHref, roomSceneDefaults, siteContent, teamOnSite } from "./content-data.js?v=20261012-show-on-site";
import { createDogEyeController } from "./dog-eye-controller.js?v=20260529-eye-scale";
import { createEntranceVideoController } from "./entrance-video.js?v=20261011-reduced-door";
import { createFirelightController } from "./firelight-controller.js";
import { createInsideScene } from "./inside-scene.js";
import { createModalDialog } from "./modal-dialog.js";
import { createTeamCarousel } from "./team-carousel.js";
import { createTurntableViewer } from "./turntable-viewer.js";

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
const philosophyModal = document.getElementById("philosophyModal");
const philosophyModalPanel = philosophyModal.querySelector(".philosophy-modal__panel");
const philosophyModalClose = document.getElementById("philosophyModalClose");
const contentModal = document.getElementById("contentModal");
const contentModalPanel = contentModal.querySelector(".content-modal__panel");
const contentModalClose = document.getElementById("contentModalClose");
const contentModalEyebrow = document.getElementById("contentModalEyebrow");
const contentModalTitle = document.getElementById("contentModalTitle");
const contentModalBody = document.getElementById("contentModalBody");
const contactModal = document.getElementById("contactModal");
const contactModalClose = document.getElementById("contactModalClose");
const cursorSparkleLayer = document.getElementById("cursorSparkleLayer");
const houseExit = document.getElementById("houseExit");
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

    entranceVideo.enterInsideView(hotspot.targetRoom);
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
  // Team members switched off for this build stay out of the carousel (issue #95).
  teamMembers: teamMembers.filter((member) => teamOnSite(member.id)),
  canOpen: () => insideScene.isActive,
  fallbackFocus: () => insideScene.getSceneSigns().find((sign) => sign.dataset.action === "about")
});

const philosophyDialog = createModalDialog({
  modal: philosophyModal,
  closeButton: philosophyModalClose,
  fallbackFocus: () => insideScene.getSceneSigns().find((sign) => sign.dataset.action === "philosophy"),
  onOpen: () => {
    teamCarousel.close();
    contentDialog.close();
    contactDialog.close();
  }
});

const contentDialog = createModalDialog({
  modal: contentModal,
  closeButton: contentModalClose,
  fallbackFocus: () => insideScene.getSceneSigns().find((sign) => sign.dataset.action === "content"),
  onOpen: () => {
    teamCarousel.close();
    philosophyDialog.close();
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

  teamCarousel.close();
  philosophyDialog.close();
  contentDialog.close();
  contactDialog.close();
  entranceVideo.reset();
  insideScene.leave();
  turntable.unlockInteraction();
  turntable.resizeCanvas();
}

function getContentByKey(contentKey) {
  if (!contentKey) return undefined;

  return contentKey.split(".").reduce((value, key) => {
    if (value && typeof value === "object" && key in value) {
      return value[key];
    }
    return undefined;
  }, siteContent);
}

function toReadableLabel(value) {
  return String(value || "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function createTextElement(tagName, text, className) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  element.textContent = text;
  return element;
}

function isHttpUrl(value) {
  return /^https?:\/\//i.test(String(value || ""));
}

function getContentLink(contentKey, value) {
  const text = String(value || "");

  if (contentKey === "contact.phone") {
    return { href: phoneHref(text), label: `Call Therapy House on ${text}` };
  }
  if (contentKey === "contact.email" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
    return { href: `mailto:${text}`, label: `Email ${text}` };
  }
  if (contentKey === "contact.bookingUrl") {
    return { href: text, label: "Book a Therapy House appointment online" };
  }
  if (contentKey === "contact.address") {
    const query = encodeURIComponent(text);
    return { href: `https://www.google.com/maps/search/?api=1&query=${query}`, label: "Open Therapy House in Google Maps" };
  }
  if (isHttpUrl(text)) {
    return { href: text, label: text.replace(/^https?:\/\//i, "") };
  }

  return null;
}

function appendLink(parent, href, label) {
  const link = document.createElement("a");
  link.className = "content-modal__button";
  link.href = href;
  link.textContent = label;
  if (isHttpUrl(href)) {
    link.target = "_blank";
    link.rel = "noopener";
  }
  parent.appendChild(link);
}

function appendStringContent(parent, value, contentKey) {
  const link = getContentLink(contentKey, value);
  if (link) {
    appendLink(parent, link.href, link.label);
    return;
  }

  parent.appendChild(createTextElement("p", value));
}

function appendStringList(parent, values) {
  const list = document.createElement("ul");
  values.forEach((value) => {
    const item = document.createElement("li");
    item.textContent = value;
    list.appendChild(item);
  });
  parent.appendChild(list);
}

function appendMeta(parent, source) {
  const metaFields = ["price", "audience", "status", "role", "credentials", "date", "email"];
  const fields = metaFields.filter((field) => typeof source[field] === "string" && source[field].trim());
  if (!fields.length) return;

  const list = document.createElement("dl");
  list.className = "content-modal__meta";
  fields.forEach((field) => {
    const item = document.createElement("div");
    item.appendChild(createTextElement("dt", toReadableLabel(field)));
    item.appendChild(createTextElement("dd", source[field]));
    list.appendChild(item);
  });
  parent.appendChild(list);
}

function appendObjectSummary(parent, source, contentKey) {
  const paragraphFields = ["description", "summary", "excerpt", "intro", "closing"];
  paragraphFields.forEach((field) => {
    const value = source[field];
    if (typeof value === "string" && value.trim()) {
      parent.appendChild(createTextElement("p", value));
    } else if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
      value.forEach((item) => parent.appendChild(createTextElement("p", item)));
    }
  });

  appendMeta(parent, source);

  if (typeof source.email === "string") {
    const link = getContentLink(`${contentKey}.email`, source.email);
    if (link) appendLink(parent, link.href, link.label);
  }

  if (source.link && typeof source.link.href === "string") {
    appendLink(parent, source.link.href, source.link.label || source.link.href);
  } else if (typeof source.url === "string") {
    appendLink(parent, source.url, "Read article");
  } else if (typeof source.sourceUrl === "string") {
    appendLink(parent, source.sourceUrl, "Open source page");
  }
}

function appendObjectCard(parent, source, label, contentKey) {
  const section = document.createElement("section");
  section.className = "content-modal__section";
  const title = source.title || source.name || source.label || label;
  if (title) {
    section.appendChild(createTextElement("h3", title, "content-modal__section-title"));
  }

  appendObjectSummary(section, source, contentKey);

  const nestedListFields = ["inclusions", "details", "topics", "items"];
  nestedListFields.forEach((field) => {
    const value = source[field];
    if (!Array.isArray(value) || !value.length) return;

    section.appendChild(createTextElement("h4", toReadableLabel(field), "content-modal__section-title"));
    if (value.every((item) => typeof item === "string")) {
      appendStringList(section, value);
    }
  });

  parent.appendChild(section);
}

function appendArrayContent(parent, values, contentKey) {
  if (!values.length) {
    parent.appendChild(createTextElement("p", "This section is being prepared."));
    return;
  }

  if (values.every((value) => typeof value === "string")) {
    appendStringList(parent, values);
    return;
  }

  values.forEach((value, index) => {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      appendObjectCard(parent, value, `Item ${index + 1}`, `${contentKey}.${index}`);
    } else {
      appendStringContent(parent, String(value), `${contentKey}.${index}`);
    }
  });
}

function appendObjectContent(parent, source, contentKey) {
  appendObjectSummary(parent, source, contentKey);

  Object.entries(source).forEach(([key, value]) => {
    if (["id", "title", "name", "label", "description", "summary", "excerpt", "intro", "closing", "price", "audience", "status", "role", "credentials", "date", "email", "url", "sourceUrl", "link", "slug"].includes(key)) {
      return;
    }

    const sectionTitle = toReadableLabel(key);
    if (Array.isArray(value)) {
      const section = document.createElement("section");
      section.className = "content-modal__section";
      section.appendChild(createTextElement("h3", sectionTitle, "content-modal__section-title"));
      appendArrayContent(section, value, `${contentKey}.${key}`);
      parent.appendChild(section);
    } else if (value && typeof value === "object") {
      appendObjectCard(parent, value, sectionTitle, `${contentKey}.${key}`);
    } else if (typeof value === "string" && value.trim()) {
      const section = document.createElement("section");
      section.className = "content-modal__section";
      section.appendChild(createTextElement("h3", sectionTitle, "content-modal__section-title"));
      appendStringContent(section, value, `${contentKey}.${key}`);
      parent.appendChild(section);
    }
  });
}

function renderContentModal(sign) {
  const contentKey = sign.dataset.contentKey;
  const contentValue = getContentByKey(contentKey);
  if (contentValue === undefined) return false;

  const signLabel = sign.querySelector(".scene-sign__title")?.textContent?.trim() || sign.getAttribute("aria-label") || "Therapy House";
  const title = contentValue && typeof contentValue === "object" && !Array.isArray(contentValue) && typeof contentValue.title === "string"
    ? contentValue.title
    : signLabel;

  contentModalTitle.textContent = title;
  contentModalEyebrow.textContent = insideScene.activeRoomId
    ? toReadableLabel(insideScene.activeRoomId)
    : "Therapy House";
  contentModalBody.replaceChildren();

  if (Array.isArray(contentValue)) {
    appendArrayContent(contentModalBody, contentValue, contentKey);
  } else if (contentValue && typeof contentValue === "object") {
    appendObjectContent(contentModalBody, contentValue, contentKey);
  } else {
    appendStringContent(contentModalBody, String(contentValue), contentKey);
  }

  contentDialog.open();
  contentModalPanel.scrollTop = 0;
  return true;
}

function bindSceneActions() {
  insideScene.setSceneActionHandler((action, sign) => {
    if (action === "back") {
      returnToExteriorView();
    } else if (action === "about") {
      teamCarousel.open();
    } else if (action === "philosophy") {
      if (insideScene.isActive) philosophyDialog.open();
    } else if (action === "contact") {
      if (insideScene.isActive) contactDialog.open();
    } else if (sign.dataset.targetRoom) {
      insideScene.setActiveRoom(sign.dataset.targetRoom);
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

  bindPanel(philosophyModalPanel, philosophyDialog);
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

/*
 * The reading pages each open on a picture of one of these rooms, and that
 * picture is a door: `?room=services` walks a visitor straight into the
 * consulting room rather than making them find it from the exterior. Only ids
 * that exist are honoured — anything else, and the visit starts where it
 * always did, on the turntable.
 */
function readRequestedRoom() {
  const requested = new URLSearchParams(window.location.search).get("room");
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
  philosophyDialog.init();
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

  const requestedRoom = readRequestedRoom();
  if (requestedRoom) {
    entranceVideo.enterInsideView(requestedRoom);
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
