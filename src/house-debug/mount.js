/*
 * Wires the tuning panel to the running house. Loaded only by
 * `DebugPanel.astro`, which `house.astro` renders only under `astro dev`.
 *
 * `app.js` hands over what the panel adjusts through
 * `window.__houseDebugHooks` once it has started; the field definitions and
 * storage keys come from the same `site-data.js` module the house uses.
 */
import { createDogEyeDebugger } from "./dog-eye-debugger.js";
import { createFirelightDebugger } from "./firelight-debugger.js";
import { createSignPositionDebugger } from "./sign-position-debugger.js";

const byId = (id) => document.getElementById(id);

async function mount(hooks) {
  const data = await import(/* @vite-ignore */ `${window.__ASSET_BASE__ || "/"}assets/scripts/site-data.js`);

  const signs = createSignPositionDebugger({
    elements: {
      panel: byId("debugPanel"),
      signSelect: byId("debugSignSelect"),
      controls: byId("debugControls"),
      confirmButton: byId("debugConfirm"),
      status: byId("debugStatus"),
      output: byId("debugOutput")
    },
    sceneSigns: hooks.sceneSigns,
    signPositionFields: data.signPositionFields,
    insideImageSize: data.insideImageSize,
    storageKey: data.signPositionStorageKey,
    downloadName: data.signPositionDownloadName,
    updateSceneSigns: hooks.insideScene.updateSceneSigns
  });

  const firelight = createFirelightDebugger({
    elements: {
      select: byId("debugFirelightSelect"),
      controls: byId("debugFirelightControls"),
      addButton: byId("debugFirelightAdd"),
      removeButton: byId("debugFirelightRemove"),
      confirmButton: byId("debugFirelightConfirm"),
      status: byId("debugFirelightStatus"),
      output: byId("debugFirelightOutput")
    },
    controller: hooks.firelightController,
    fields: data.firelightFields,
    insideImageSize: data.insideImageSize,
    storageKey: data.firelightStorageKey,
    downloadName: data.firelightDownloadName
  });

  const dogEyes = createDogEyeDebugger({
    elements: {
      select: byId("debugDogEyeSelect"),
      controls: byId("debugDogEyeControls"),
      confirmButton: byId("debugDogEyeConfirm"),
      status: byId("debugDogEyeStatus"),
      output: byId("debugDogEyeOutput")
    },
    controller: hooks.dogEyeController,
    fields: data.dogEyeFields,
    insideImageSize: data.insideImageSize,
    storageKey: data.dogEyeStorageKey,
    downloadName: data.dogEyeDownloadName
  });

  signs.applyStoredPositions();
  const debugMode = signs.init();
  firelight.init();
  dogEyes.init();
  if (debugMode) hooks.enterInside();
}

if (window.__houseDebugHooks) {
  mount(window.__houseDebugHooks);
} else {
  document.addEventListener("house:debug-ready", () => mount(window.__houseDebugHooks), { once: true });
}
