/* The two helpers the tuning panel shares with the house's own scripts. A
   copy rather than an import: `public/` files are served as they are and
   cannot be bundled into a dev-server module. Keep in step with
   `public/assets/scripts/utils.js`. */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function formatNumber(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || Math.abs(number) < 0.0005) return "0";
  return number.toFixed(3).replace(/\.?0+$/, "");
}
