# Redirects inside the Rebuild

Addresses the Rebuild itself has moved. These are inputs to the launch redirect
map (gap register R-24), which also has to forward every Current Site address.
On GitHub Pages, Astro's `redirects` setting in `astro.config.mjs` writes a page
that forwards the visitor. On Cloudflare each line below must become a real
301 (permanent) redirect in `public/_redirects` or Bulk Redirects.

| From | To | Status | Why | Added |
|---|---|---|---|---|
| `/services/` | `/therapy/` | 301 | The Services floor became the Therapy hub (issue #4). The fee table stays on `/therapy/` until `/fees/` exists. | 11 Oct 2026 |
