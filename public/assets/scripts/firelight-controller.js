import { clamp, formatNumber } from "./utils.js";

function cloneDocument(documentValue) {
  return JSON.parse(JSON.stringify(documentValue));
}

function normaliseLight(light, index, fields) {
  const fallback = {
    key: `light-${index + 1}`,
    label: `Light ${index + 1}`
  };
  const normalisedLight = {
    key: typeof light?.key === "string" && light.key.trim() ? light.key.trim() : fallback.key,
    label: typeof light?.label === "string" && light.label.trim() ? light.label.trim() : fallback.label
  };

  fields.forEach((field) => {
    const value = Number(light?.[field.key]);
    normalisedLight[field.key] = Number.isFinite(value) ? clamp(value, field.min, field.max) : field.min;
  });

  return normalisedLight;
}

export function normaliseFirelightDocument({ documentValue, fallbackDocument, fields, insideImageSize }) {
  const sourceLights = Array.isArray(documentValue?.lights) && documentValue.lights.length
    ? documentValue.lights
    : fallbackDocument.lights;

  return {
    generatedAt: documentValue?.generatedAt || fallbackDocument.generatedAt || new Date().toISOString(),
    insideImageSize,
    lights: sourceLights.map((light, index) => normaliseLight(light, index, fields))
  };
}

export function readStoredFirelightSettings(storageKey) {
  try {
    const storedValue = window.localStorage.getItem(storageKey);
    return storedValue ? JSON.parse(storedValue) : null;
  } catch (error) {
    return null;
  }
}

export function createFirelightController({
  layer,
  defaultSettings,
  fields,
  insideImageSize,
  storageKey,
  sourceUrl
}) {
  let currentSettings = normaliseFirelightDocument({
    documentValue: defaultSettings,
    fallbackDocument: defaultSettings,
    fields,
    insideImageSize
  });

  function getSettings() {
    return cloneDocument(currentSettings);
  }

  function renderLight(light) {
    const element = document.createElement("span");
    element.className = "inside-firelight";
    element.dataset.firelightKey = light.key;
    element.setAttribute("aria-hidden", "true");
    element.title = light.label;

    element.style.setProperty("--firelight-x", `${formatNumber(light.x / insideImageSize.width * 100)}%`);
    element.style.setProperty("--firelight-y", `${formatNumber(light.y / insideImageSize.height * 100)}%`);
    element.style.setProperty("--firelight-width", `${formatNumber(light.width / insideImageSize.width * 100)}%`);
    element.style.setProperty("--firelight-height", `${formatNumber(light.height / insideImageSize.height * 100)}%`);
    element.style.setProperty("--firelight-intensity", formatNumber(light.intensity));
    element.style.setProperty("--firelight-core-intensity", formatNumber(light.coreIntensity));
    element.style.setProperty("--firelight-blur", `${formatNumber(light.blur)}px`);

    return element;
  }

  function applyDocument(documentValue) {
    currentSettings = normaliseFirelightDocument({
      documentValue,
      fallbackDocument: defaultSettings,
      fields,
      insideImageSize
    });

    if (layer) {
      layer.replaceChildren(...currentSettings.lights.map(renderLight));
    }

    return getSettings();
  }

  async function loadExternalSettings() {
    if (!sourceUrl || readStoredFirelightSettings(storageKey)) return getSettings();

    try {
      const response = await fetch(sourceUrl, { cache: "no-store" });
      if (!response.ok) return getSettings();
      return applyDocument(await response.json());
    } catch (error) {
      return getSettings();
    }
  }

  function init() {
    applyDocument(readStoredFirelightSettings(storageKey) || defaultSettings);
    loadExternalSettings();
  }

  return {
    applyDocument,
    getSettings,
    init,
    loadExternalSettings
  };
}
