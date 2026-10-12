/*
 * Every asset path below is written the way the original single-page site was
 * built: relative to the document, because that document sat at the domain
 * root. It no longer does — the experience is served from `/house/`, and on
 * GitHub Pages from a `/therapyhouse` prefix on top of that — so a bare
 * `assets/…` now resolves against the wrong directory.
 *
 * `asset()` puts the paths back on the site root. The prefix comes from
 * `window.__ASSET_BASE__`, which `src/pages/house.astro` writes out from
 * Astro's configured `base` before this module is imported; with nothing set
 * (opening a file directly, a test) it falls back to the old relative
 * behaviour and nothing changes.
 */
export const assetBase =
  (typeof window !== "undefined" && window.__ASSET_BASE__) || "";

export const asset = (path) => `${assetBase}${path}`;

export const frameCount = 48;

export const frames = Array.from({ length: frameCount }, (_, index) => {
  const number = String(index + 1).padStart(3, "0");
  return asset(`assets/turntable/turntable_${number}.webp`);
});

export const insideImageSize = { width: 1672, height: 940 };

export const insideEdgeFallbackColors = {
  top: "#34231a",
  right: "#2d211a",
  bottom: "#24170f",
  left: "#31231b"
};

export const insideParallaxDepths = [
  { x: -3, y: 0 },
  { x: 5, y: 0 },
  { x: 14, y: 1.5 }
];

export const signPositionStorageKey = "therapyHouse.signPositions.v1";
export const signPositionDownloadName = "therapyhouse-button-positions.json";
export const firelightStorageKey = "therapyHouse.firelightSettings.v1";
export const firelightDownloadName = "therapyhouse-firelight-settings.json";
export const dogEyeStorageKey = "therapyHouse.dogEyeSettings.v1";
export const dogEyeDownloadName = "therapyhouse-dog-eye-settings.json";

export const signPositionFields = [
  { key: "x", datasetKey: "x", label: "data-x", min: 0, max: insideImageSize.width, step: 1 },
  { key: "y", datasetKey: "y", label: "data-y", min: 0, max: insideImageSize.height, step: 1 },
  { key: "perspective", datasetKey: "perspective", label: "data-perspective", min: 160, max: 2000, step: 10 },
  { key: "depth", datasetKey: "depth", label: "data-depth", min: -200, max: 220, step: 1 },
  { key: "rotateX", datasetKey: "rotateX", label: "data-rotate-x", min: -70, max: 70, step: 0.1 },
  { key: "rotateY", datasetKey: "rotateY", label: "data-rotate-y", min: -70, max: 70, step: 0.1 },
  { key: "rotate", datasetKey: "rotate", label: "data-rotate", min: -45, max: 45, step: 0.1 },
  { key: "skewX", datasetKey: "skewX", label: "data-skew-x", min: -35, max: 35, step: 0.1 },
  { key: "skewY", datasetKey: "skewY", label: "data-skew-y", min: -35, max: 35, step: 0.1 },
  { key: "scale", datasetKey: "scale", label: "data-scale", min: 0.3, max: 1.6, step: 0.01 },
  { key: "scaleX", datasetKey: "scaleX", label: "data-scale-x", min: 0.3, max: 1.8, step: 0.01 },
  { key: "scaleY", datasetKey: "scaleY", label: "data-scale-y", min: 0.3, max: 1.8, step: 0.01 }
];

export const firelightFields = [
  { key: "x", label: "x", min: 0, max: insideImageSize.width, step: 1 },
  { key: "y", label: "y", min: 0, max: insideImageSize.height, step: 1 },
  { key: "width", label: "width", min: 20, max: 420, step: 1 },
  { key: "height", label: "height", min: 20, max: 420, step: 1 },
  { key: "intensity", label: "glow", min: 0, max: 1, step: 0.01 },
  { key: "coreIntensity", label: "flame", min: 0, max: 1, step: 0.01 },
  { key: "blur", label: "blur", min: 0, max: 32, step: 1 }
];

export const dogEyeFields = [
  { key: "x", label: "x", min: 0, max: insideImageSize.width, step: 1 },
  { key: "y", label: "y", min: 0, max: insideImageSize.height, step: 1 },
  { key: "size", label: "eye size", min: 4, max: 36, step: 1 },
  { key: "pupilSize", label: "pupil size", min: 3, max: 30, step: 1 },
  { key: "maxX", label: "move x", min: 0, max: 14, step: 0.5 },
  { key: "maxY", label: "move y", min: 0, max: 14, step: 0.5 },
  { key: "visible", label: "visible", min: 0, max: 1, step: 1 }
];

export const defaultDogEyeSettings = {
  generatedAt: "2026-05-29T07:34:44.308Z",
  insideImageSize,
  eyes: [
    {
      key: "brown-dog-left-eye",
      label: "Brown dog left eye",
      x: 677,
      y: 673,
      size: 21,
      pupilSize: 13,
      maxX: 8,
      maxY: 11.5,
      visible: 1
    },
    {
      key: "brown-dog-right-eye",
      label: "Brown dog right eye",
      x: 719,
      y: 676,
      size: 18,
      pupilSize: 13,
      maxX: 6,
      maxY: 7,
      visible: 1
    },
    {
      key: "golden-dog-left-eye",
      label: "Golden dog left eye",
      x: 964,
      y: 630,
      size: 15,
      pupilSize: 13,
      maxX: 4,
      maxY: 4,
      visible: 1
    },
    {
      key: "golden-dog-right-eye",
      label: "Golden dog right eye",
      x: 994,
      y: 641,
      size: 19,
      pupilSize: 13,
      maxX: 7,
      maxY: 6,
      visible: 1
    }
  ]
};

export const defaultFirelightSettings = {
  generatedAt: "2026-05-29T07:03:43.557Z",
  insideImageSize,
  lights: [
    {
      key: "fireplace",
      label: "Fireplace",
      x: 491,
      y: 455,
      width: 183,
      height: 226,
      intensity: 1,
      coreIntensity: 1,
      blur: 11
    },
    {
      key: "left-shelf-candle",
      label: "Left shelf candle",
      x: 40,
      y: 484,
      width: 112,
      height: 114,
      intensity: 0.34,
      coreIntensity: 0.46,
      blur: 10
    },
    {
      key: "coffee-table-lantern",
      label: "Coffee table lantern",
      x: 1220,
      y: 298,
      width: 120,
      height: 130,
      intensity: 1,
      coreIntensity: 0.49,
      blur: 10
    },
    {
      key: "right-wall-lantern",
      label: "Right wall lantern",
      x: 1460,
      y: 261,
      width: 128,
      height: 150,
      intensity: 0.3,
      coreIntensity: 0.53,
      blur: 10
    },
    {
      key: "right-door-lantern",
      label: "Right door lantern",
      x: 1544,
      y: 372,
      width: 122,
      height: 154,
      intensity: 0.3,
      coreIntensity: 0.28,
      blur: 10
    },
    {
      key: "custom-light-6",
      label: "Custom light 6",
      x: 119,
      y: 395,
      width: 24,
      height: 69,
      intensity: 1,
      coreIntensity: 1,
      blur: 5
    }
  ]
};
