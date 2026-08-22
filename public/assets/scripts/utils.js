export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function formatNumber(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || Math.abs(number) < 0.0005) return "0";
  return number.toFixed(3).replace(/\.?0+$/, "");
}

export function requestIdleTask(callback) {
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(callback, { timeout: 1600 });
    return;
  }

  window.setTimeout(callback, 80);
}

export function getImageWidth(image) {
  return image.naturalWidth || image.width || 1;
}

export function getImageHeight(image) {
  return image.naturalHeight || image.height || 1;
}

export function preloadImage(src) {
  const image = new Image();
  image.decoding = "async";
  image.src = src;
  const decodePromise = typeof image.decode === "function"
    ? image.decode().catch(() => null)
    : Promise.resolve(null);

  return { image, decodePromise };
}
