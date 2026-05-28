import { clamp, formatNumber } from "./utils.js";
import { isDebugModeRequested } from "./sign-position-debugger.js";

function getEyeKey(eye, index) {
  return eye.key || `dog-eye-${index + 1}`;
}

function getEyeLabel(eye, index) {
  return eye.label || getEyeKey(eye, index);
}

export function createDogEyeDebugger({
  elements,
  controller,
  fields,
  insideImageSize,
  storageKey,
  downloadName
}) {
  const { select, controls, confirmButton, status, output } = elements;
  let activeKey = "";

  function collectDocument() {
    const settings = controller.getSettings();
    return {
      generatedAt: new Date().toISOString(),
      insideImageSize,
      eyes: settings.eyes
    };
  }

  function setStatus(message) {
    if (status) {
      status.textContent = message;
    }
  }

  function updateOutput(documentValue = collectDocument()) {
    if (output) {
      output.textContent = JSON.stringify(documentValue, null, 2);
    }
  }

  function getActiveEye() {
    const settings = controller.getSettings();
    return settings.eyes.find((eye, index) => getEyeKey(eye, index) === activeKey) || settings.eyes[0] || null;
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

  function syncSelect() {
    if (!select) return;

    const settings = controller.getSettings();
    select.replaceChildren();
    settings.eyes.forEach((eye, index) => {
      const option = document.createElement("option");
      option.value = getEyeKey(eye, index);
      option.textContent = getEyeLabel(eye, index);
      select.appendChild(option);
    });

    if (!settings.eyes.some((eye, index) => getEyeKey(eye, index) === activeKey)) {
      activeKey = getEyeKey(settings.eyes[0] || {}, 0);
    }

    select.value = activeKey;
  }

  function syncControls() {
    const activeEye = getActiveEye();
    if (!activeEye) return;

    fields.forEach((field) => {
      syncField(field, activeEye[field.key]);
    });

    updateOutput();
  }

  function applyEyes(eyes) {
    const documentValue = {
      generatedAt: new Date().toISOString(),
      insideImageSize,
      eyes
    };

    controller.applyDocument(documentValue);
    syncSelect();
    syncControls();
  }

  function updateEye(field, rawValue) {
    const settings = controller.getSettings();
    const eyes = settings.eyes.map((eye, index) => {
      if (getEyeKey(eye, index) !== activeKey) return eye;
      const value = clamp(Number(rawValue), field.min, field.max);
      return { ...eye, [field.key]: value };
    });

    applyEyes(eyes);
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

  function confirmSettings() {
    const documentValue = collectDocument();

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(documentValue));
      downloadDocument(documentValue);
      setStatus(`Saved to browser storage and downloaded ${downloadName}.`);
    } catch (error) {
      downloadDocument(documentValue);
      setStatus("Could not write to browser storage; downloaded the JSON snapshot instead.");
    }

    updateOutput(documentValue);
  }

  function init() {
    if (!select || !controls || !confirmButton || !isDebugModeRequested()) return false;

    select.replaceChildren();
    controls.replaceChildren();

    fields.forEach((field) => {
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
      rangeInput.addEventListener("input", () => updateEye(field, rangeInput.value));
      numberInput.addEventListener("input", () => updateEye(field, numberInput.value));
      controls.appendChild(control);
    });

    activeKey = getEyeKey(controller.getSettings().eyes[0] || {}, 0);
    select.addEventListener("change", () => {
      activeKey = select.value;
      syncControls();
    });
    confirmButton.addEventListener("click", confirmSettings);

    syncSelect();
    syncControls();
    setStatus("Adjust each dog eye live, then save and replace the JSON file.");
    return true;
  }

  return {
    init,
    syncControls,
    updateOutput
  };
}
