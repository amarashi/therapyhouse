import { clamp, formatNumber } from "./utils.js";

function cloneDocument(documentValue) {
  return JSON.parse(JSON.stringify(documentValue));
}

function normaliseEye(eye, index, fields) {
  const fallback = {
    key: `dog-eye-${index + 1}`,
    label: `Dog eye ${index + 1}`
  };
  const normalisedEye = {
    key: typeof eye?.key === "string" && eye.key.trim() ? eye.key.trim() : fallback.key,
    label: typeof eye?.label === "string" && eye.label.trim() ? eye.label.trim() : fallback.label
  };

  fields.forEach((field) => {
    const value = Number(eye?.[field.key]);
    normalisedEye[field.key] = Number.isFinite(value) ? clamp(value, field.min, field.max) : field.min;
  });

  return normalisedEye;
}

export function normaliseDogEyeDocument({ documentValue, fallbackDocument, fields, insideImageSize }) {
  const sourceEyes = Array.isArray(documentValue?.eyes) && documentValue.eyes.length
    ? documentValue.eyes
    : fallbackDocument.eyes;

  return {
    generatedAt: documentValue?.generatedAt || fallbackDocument.generatedAt || new Date().toISOString(),
    insideImageSize,
    eyes: sourceEyes.slice(0, 4).map((eye, index) => normaliseEye(eye, index, fields))
  };
}

export function readStoredDogEyeSettings(storageKey) {
  try {
    const storedValue = window.localStorage.getItem(storageKey);
    return storedValue ? JSON.parse(storedValue) : null;
  } catch (error) {
    return null;
  }
}

export function createDogEyeController({
  layer,
  insideView,
  defaultSettings,
  fields,
  insideImageSize,
  storageKey,
  sourceUrl
}) {
  let currentSettings = normaliseDogEyeDocument({
    documentValue: defaultSettings,
    fallbackDocument: defaultSettings,
    fields,
    insideImageSize
  });

  function getSettings() {
    return cloneDocument(currentSettings);
  }

  function renderEye(eye) {
    const element = document.createElement("span");
    element.className = "dog-eye";
    element.dataset.eyeKey = eye.key;
    element.setAttribute("aria-hidden", "true");
    element.title = eye.label;

    const eyeSize = Math.max(eye.size, 1);
    element.style.setProperty("--eye-x", `${formatNumber(eye.x / insideImageSize.width * 100)}%`);
    element.style.setProperty("--eye-y", `${formatNumber(eye.y / insideImageSize.height * 100)}%`);
    element.style.setProperty("--eye-size", `${formatNumber(eye.size / insideImageSize.width * 100)}%`);
    element.style.setProperty("--pupil-size", `${formatNumber(eye.pupilSize / eyeSize * 100)}%`);
    element.style.setProperty("--pupil-x", "0%");
    element.style.setProperty("--pupil-y", "0%");
    element.hidden = eye.visible < 0.5;

    return element;
  }

  function applyDocument(documentValue) {
    currentSettings = normaliseDogEyeDocument({
      documentValue,
      fallbackDocument: defaultSettings,
      fields,
      insideImageSize
    });

    if (layer) {
      layer.replaceChildren(...currentSettings.eyes.map(renderEye));
    }

    return getSettings();
  }

  function resetPupils() {
    if (!layer) return;
    layer.querySelectorAll(".dog-eye").forEach((eyeElement) => {
      eyeElement.style.setProperty("--pupil-x", "0%");
      eyeElement.style.setProperty("--pupil-y", "0%");
    });
  }

  function updatePupils(clientX, clientY) {
    if (!insideView || !layer) return;

    const rect = insideView.getBoundingClientRect();
    const imageX = (clientX - rect.left) / Math.max(rect.width, 1) * insideImageSize.width;
    const imageY = (clientY - rect.top) / Math.max(rect.height, 1) * insideImageSize.height;

    currentSettings.eyes.forEach((eye) => {
      const eyeElement = layer.querySelector(`[data-eye-key="${eye.key}"]`);
      if (!eyeElement || eye.visible < 0.5) return;

      const deltaX = imageX - eye.x;
      const deltaY = imageY - eye.y;
      const distance = Math.hypot(deltaX, deltaY) || 1;
      const pupilX = clamp(deltaX / distance * eye.maxX, -eye.maxX, eye.maxX);
      const pupilY = clamp(deltaY / distance * eye.maxY, -eye.maxY, eye.maxY);
      const eyeSize = Math.max(eye.size, 1);

      eyeElement.style.setProperty("--pupil-x", `${formatNumber(pupilX / eyeSize * 100)}%`);
      eyeElement.style.setProperty("--pupil-y", `${formatNumber(pupilY / eyeSize * 100)}%`);
    });
  }

  async function loadExternalSettings() {
    if (!sourceUrl || readStoredDogEyeSettings(storageKey)) return getSettings();

    try {
      const response = await fetch(sourceUrl, { cache: "no-store" });
      if (!response.ok) return getSettings();
      return applyDocument(await response.json());
    } catch (error) {
      return getSettings();
    }
  }

  function init() {
    applyDocument(readStoredDogEyeSettings(storageKey) || defaultSettings);
    loadExternalSettings();
    insideView?.addEventListener("pointermove", (event) => updatePupils(event.clientX, event.clientY));
    insideView?.addEventListener("pointerleave", resetPupils);
  }

  return {
    applyDocument,
    getSettings,
    init,
    loadExternalSettings,
    resetPupils,
    updatePupils
  };
}
