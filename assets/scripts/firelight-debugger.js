import { clamp, formatNumber } from "./utils.js";
import { isDebugModeRequested } from "./sign-position-debugger.js";

function getLightLabel(light, index) {
  return light.label || light.key || `Light ${index + 1}`;
}

function getLightKey(light, index) {
  return light.key || `light-${index + 1}`;
}

export function createFirelightDebugger({
  elements,
  controller,
  fields,
  insideImageSize,
  storageKey,
  downloadName
}) {
  const { select, controls, addButton, removeButton, confirmButton, status, output } = elements;
  let activeKey = "";

  function collectDocument() {
    const settings = controller.getSettings();
    return {
      generatedAt: new Date().toISOString(),
      insideImageSize,
      lights: settings.lights
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

  function getActiveLight() {
    const settings = controller.getSettings();
    return settings.lights.find((light) => getLightKey(light) === activeKey) || settings.lights[0] || null;
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
    settings.lights.forEach((light, index) => {
      const option = document.createElement("option");
      option.value = getLightKey(light, index);
      option.textContent = getLightLabel(light, index);
      select.appendChild(option);
    });

    if (!settings.lights.some((light, index) => getLightKey(light, index) === activeKey)) {
      activeKey = getLightKey(settings.lights[0] || {}, 0);
    }

    select.value = activeKey;
  }

  function syncControls() {
    const activeLight = getActiveLight();
    if (!activeLight) return;

    fields.forEach((field) => {
      syncField(field, activeLight[field.key]);
    });

    updateOutput();
  }

  function applyLights(lights) {
    const documentValue = {
      generatedAt: new Date().toISOString(),
      insideImageSize,
      lights
    };

    controller.applyDocument(documentValue);
    syncSelect();
    syncControls();
  }

  function updateLight(field, rawValue) {
    const settings = controller.getSettings();
    const lights = settings.lights.map((light, index) => {
      if (getLightKey(light, index) !== activeKey) return light;
      const value = clamp(Number(rawValue), field.min, field.max);
      return { ...light, [field.key]: value };
    });

    applyLights(lights);
  }

  function addLight() {
    const settings = controller.getSettings();
    const nextNumber = settings.lights.length + 1;
    const source = getActiveLight() || {
      x: insideImageSize.width / 2,
      y: insideImageSize.height / 2,
      width: 120,
      height: 120,
      intensity: 0.3,
      coreIntensity: 0.3,
      blur: 10
    };
    const newLight = {
      ...source,
      key: `custom-light-${nextNumber}`,
      label: `Custom light ${nextNumber}`,
      x: clamp(source.x + 36, 0, insideImageSize.width),
      y: clamp(source.y + 24, 0, insideImageSize.height)
    };

    activeKey = newLight.key;
    applyLights([...settings.lights, newLight]);
    setStatus("Added a new editable light. Adjust sliders, then save the JSON.");
  }

  function removeLight() {
    const settings = controller.getSettings();
    if (settings.lights.length <= 1) {
      setStatus("Keep at least one light in the scene.");
      return;
    }

    const lights = settings.lights.filter((light, index) => getLightKey(light, index) !== activeKey);
    activeKey = getLightKey(lights[0] || {}, 0);
    applyLights(lights);
    setStatus("Removed the selected light. Save the JSON if this is the layout you want.");
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
      rangeInput.addEventListener("input", () => updateLight(field, rangeInput.value));
      numberInput.addEventListener("input", () => updateLight(field, numberInput.value));
      controls.appendChild(control);
    });

    activeKey = getLightKey(controller.getSettings().lights[0] || {}, 0);
    select.addEventListener("change", () => {
      activeKey = select.value;
      syncControls();
    });
    addButton?.addEventListener("click", addLight);
    removeButton?.addEventListener("click", removeLight);
    confirmButton.addEventListener("click", confirmSettings);

    syncSelect();
    syncControls();
    setStatus("Adjust firelight positions live, then save and replace the JSON file.");
    return true;
  }

  return {
    init,
    syncControls,
    updateOutput
  };
}
