import { clamp, formatNumber } from "./utils.js";

export function getSignKey(sign) {
  return sign.dataset.action || sign.getAttribute("aria-label") || "button";
}

export function getSignLabel(sign) {
  return sign.getAttribute("aria-label") || sign.querySelector(".scene-sign__title")?.textContent?.trim() || getSignKey(sign);
}

export function getSignPositionValue(sign, field) {
  const value = Number(sign.dataset[field.datasetKey]);
  if (Number.isFinite(value)) return value;
  if (field.key === "perspective") return 900;
  if (field.key === "depth") return 60;
  return field.key === "scale" || field.key === "scaleX" || field.key === "scaleY" ? 1 : 0;
}

export function setSignPositionValue(sign, field, value) {
  const boundedValue = clamp(Number(value), field.min, field.max);
  sign.dataset[field.datasetKey] = formatNumber(boundedValue);
}

export function collectSignPositionDocument({ sceneSigns, signPositionFields, insideImageSize }) {
  const positions = {};
  const sortedSigns = [...sceneSigns].sort((first, second) => getSignKey(first).localeCompare(getSignKey(second)));

  sortedSigns.forEach((sign) => {
    const key = getSignKey(sign);
    positions[key] = { label: getSignLabel(sign) };
    signPositionFields.forEach((field) => {
      positions[key][field.key] = getSignPositionValue(sign, field);
    });
  });

  return {
    generatedAt: new Date().toISOString(),
    insideImageSize,
    positions
  };
}

export function applySignPositionDocument({ documentValue, sceneSigns, signPositionFields, updateSceneSigns }) {
  if (!documentValue || typeof documentValue !== "object" || !documentValue.positions) return false;

  sceneSigns.forEach((sign) => {
    const signPosition = documentValue.positions[getSignKey(sign)];
    if (!signPosition) return;

    signPositionFields.forEach((field) => {
      const value = Number(signPosition[field.key]);
      if (Number.isFinite(value)) {
        setSignPositionValue(sign, field, value);
      }
    });
  });

  updateSceneSigns();
  return true;
}

export function readStoredSignPositions(storageKey) {
  try {
    const storedValue = window.localStorage.getItem(storageKey);
    return storedValue ? JSON.parse(storedValue) : null;
  } catch (error) {
    return null;
  }
}

export function isDebugModeRequested() {
  const params = new URLSearchParams(window.location.search);
  return params.get("debug") === "1" || window.location.hash.toLowerCase().includes("debug");
}

export function createSignPositionDebugger({
  elements,
  sceneSigns,
  signPositionFields,
  insideImageSize,
  storageKey,
  downloadName,
  updateSceneSigns
}) {
  const { panel, signSelect, controls, confirmButton, status, output } = elements;

  function collectDocument() {
    return collectSignPositionDocument({ sceneSigns, signPositionFields, insideImageSize });
  }

  function applyStoredPositions() {
    applySignPositionDocument({
      documentValue: readStoredSignPositions(storageKey),
      sceneSigns,
      signPositionFields,
      updateSceneSigns
    });
  }

  function updateOutput(documentValue = collectDocument()) {
    if (!output) return;
    output.textContent = JSON.stringify(documentValue, null, 2);
  }

  function getActiveSign() {
    if (!signSelect) return sceneSigns[0] || null;
    return sceneSigns.find((sign) => getSignKey(sign) === signSelect.value) || sceneSigns[0] || null;
  }

  function setStatus(message) {
    if (status) {
      status.textContent = message;
    }
  }

  function syncField(field, value) {
    const control = controls?.querySelector(`[data-debug-field="${field.key}"]`);
    if (!control) return;

    const formattedValue = formatNumber(value);
    const rangeInput = control.querySelector("input[type='range']");
    const numberInput = control.querySelector("input[type='number']");
    const valueOutput = control.querySelector("output");

    if (rangeInput) rangeInput.value = formattedValue;
    if (numberInput) numberInput.value = formattedValue;
    if (valueOutput) valueOutput.value = formattedValue;
  }

  function syncControls() {
    const activeSign = getActiveSign();
    if (!activeSign) return;

    sceneSigns.forEach((sign) => {
      sign.classList.toggle("is-debug-selected", sign === activeSign);
    });

    signPositionFields.forEach((field) => {
      syncField(field, getSignPositionValue(activeSign, field));
    });

    updateOutput();
  }

  function updateSignPosition(field, rawValue) {
    const activeSign = getActiveSign();
    if (!activeSign) return;

    setSignPositionValue(activeSign, field, rawValue);
    syncField(field, getSignPositionValue(activeSign, field));
    updateSceneSigns();
    updateOutput();
  }

  function downloadDocument(documentValue) {
    const blob = new Blob([`${JSON.stringify(documentValue, null, 2)}\n`], { type: "application/json" });
    const link = document.createElement("a");
    const objectUrl = URL.createObjectURL(blob);

    link.href = objectUrl;
    link.download = downloadName;
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }

  function confirmPositions() {
    const documentValue = collectDocument();

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(documentValue));
      downloadDocument(documentValue);
      setStatus(`Saved to browser storage and downloaded ${downloadName}.`);
    } catch (error) {
      setStatus("Could not write to browser storage; downloaded the JSON snapshot instead.");
      downloadDocument(documentValue);
    }

    updateOutput(documentValue);
  }

  function init() {
    if (!panel || !signSelect || !controls || !confirmButton || !isDebugModeRequested()) return false;

    document.body.classList.add("debug-mode");
    panel.hidden = false;
    signSelect.replaceChildren();
    controls.replaceChildren();

    sceneSigns.forEach((sign) => {
      const option = document.createElement("option");
      option.value = getSignKey(sign);
      option.textContent = getSignLabel(sign);
      signSelect.appendChild(option);
    });

    signPositionFields.forEach((field) => {
      const control = document.createElement("label");
      control.className = "debug-control";
      control.dataset.debugField = field.key;
      control.innerHTML = `
        <span class="debug-control__label">
          <span>${field.label}</span>
          <output></output>
        </span>
        <input class="debug-control__range" type="range" min="${field.min}" max="${field.max}" step="${field.step}">
        <input class="debug-panel__number" type="number" min="${field.min}" max="${field.max}" step="${field.step}">
      `;

      const rangeInput = control.querySelector("input[type='range']");
      const numberInput = control.querySelector("input[type='number']");
      rangeInput.addEventListener("input", () => updateSignPosition(field, rangeInput.value));
      numberInput.addEventListener("input", () => updateSignPosition(field, numberInput.value));
      controls.appendChild(control);
    });

    signSelect.addEventListener("change", syncControls);
    confirmButton.addEventListener("click", confirmPositions);
    setStatus("Adjust sliders live, then confirm to save and export.");
    syncControls();
    return true;
  }

  return {
    applyStoredPositions,
    init,
    isRequested: isDebugModeRequested,
    syncControls,
    updateOutput
  };
}
