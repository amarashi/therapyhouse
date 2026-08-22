// Every internal URL on the site is written root-absolute (`/assets/…`,
// `/team/`) because that is what reads clearly at the call site. GitHub Pages
// serves us from a `/therapyhouse` prefix, though, so those URLs have to be
// rebased before they reach the HTML. Astro exposes the configured `base` as
// `import.meta.env.BASE_URL`; this is the one place that fact is consumed.
//
// The prefix is normalised without its trailing slash so that joining it to a
// path that already starts with `/` cannot produce a double slash.
// `import.meta.env` only exists under Vite. The data modules that import this
// helper are also loaded directly by `node --test`, where there is no bundler
// and no base path to apply, so fall back to an unprefixed site.
//
// The read is written out in full and guarded with try/catch rather than with
// `import.meta.env?.BASE_URL`: Vite substitutes the value by matching that
// exact expression as text, and optional chaining stops the match — which
// silently left the client bundles unprefixed while the server render was
// fine. Under Node the property access throws instead, and lands here.
let configuredBase = '/';
try {
  configuredBase = import.meta.env.BASE_URL || '/';
} catch {
  configuredBase = '/';
}

const PREFIX = configuredBase.replace(/\/+$/, '');

/**
 * Prefix a root-absolute site path with the deployment's base path.
 *
 * Anything that is not a root-absolute path — an external URL, a `mailto:`,
 * an in-page `#anchor`, a relative path — is returned untouched, so this is
 * safe to wrap around a value whose origin you are not sure of. Applying it
 * twice is a no-op for the same reason.
 */
export function withBase(path) {
  if (typeof path !== 'string' || !path.startsWith('/')) return path;
  if (PREFIX && (path === PREFIX || path.startsWith(`${PREFIX}/`))) return path;
  return `${PREFIX}${path}`;
}

/**
 * Rebase every URL in a `srcset`, leaving each descriptor (`480w`, `2x`) in
 * place. Splitting on commas is safe here because none of our asset paths
 * contain one.
 */
export function srcsetWithBase(srcset) {
  if (typeof srcset !== 'string') return srcset;
  return srcset
    .split(',')
    .map((candidate) => {
      const [url, ...descriptor] = candidate.trim().split(/\s+/);
      return [withBase(url), ...descriptor].join(' ');
    })
    .join(', ');
}

/** The base prefix itself, for the rare caller that needs to build its own URL. */
export const basePrefix = PREFIX;

/**
 * The inverse of `withBase`: turn a live request path back into the clean
 * site path the nav data is written in. Routing logic — "which floor is the
 * lift parked on", "is this the current page" — compares against those clean
 * paths, and stripping here keeps that comparison readable instead of pushing
 * the prefix into every equality test.
 */
export function stripBase(pathname) {
  if (typeof pathname !== 'string' || !PREFIX) return pathname;
  if (pathname === PREFIX) return '/';
  return pathname.startsWith(`${PREFIX}/`) ? pathname.slice(PREFIX.length) : pathname;
}
