# Redirects inside the Rebuild

Addresses the Rebuild itself has moved. These are inputs to the launch redirect
map (gap register R-24), which also has to forward every Current Site address.
On GitHub Pages, Astro's `redirects` setting in `astro.config.mjs` writes a page
that forwards the visitor. On Cloudflare each line below must become a real
301 (permanent) redirect in `public/_redirects` or Bulk Redirects.

| From | To | Status | Why | Added |
|---|---|---|---|---|
| `/services/` | `/therapy/` | 301 | The Services floor became the Therapy hub (issue #4). The fee table has since moved to `/fees/`, linked from `/therapy/` (issue #30). | 11 Oct 2026 |
| `/policy/` | `/fees/#cancellation` | 301 | The Current Site's cancellation policy address. The policy is now a section of `/fees/` (issue #30). | 11 Oct 2026 |
