# Therapy House Codebase Guide

A static site built with [Astro](https://astro.build) (a tool that turns
templates and Markdown into plain HTML at build time) and managed with `pnpm`.
It has two halves that share one palette:

- **The plain pages**: every page a visitor searches for and compares
  (therapy, assessments, fees, telehealth, towns, team, library, contact).
  They are Astro pages built from Markdown content, and ship almost no
  JavaScript.
- **The house** at `/house/`: the illustrated, full-screen walk-through. It
  is one Astro page (`src/pages/house.astro`) that loads hand-written ES
  modules from `public/assets/scripts/`, served as they are, with no bundling.

Clinic staff edit content through Pages CMS, which is configured in
`.pages.yml`.

## Running it

```powershell
pnpm install
pnpm dev          # http://localhost:4321/therapyhouse/
pnpm test         # node --test, including real Preview and production builds
pnpm build        # the Preview (GitHub Pages, under /therapyhouse)
node tools/build-site.mjs production   # the launch build (domain root)
```

Open `/house/?debug=1` on the dev server for the sign-position, firelight and
dog-eye tuning panel (`src/house-debug/`, never built).

## Where things live

| Path | What it holds |
| --- | --- |
| `src/content/` | The Markdown content: `pages/` (one file per page), `services/`, `team/`, `articles/`, `towns/`. Schemas are in `src/lib/content-schemas.js`. |
| `src/data/` | Shared data: `site.js` (contact details, calls to action, navigation), `medicare.js` (rebate amounts, developer-only), `library-shelf.json`/`.js`, `shared-text.json`. |
| `src/pages/` | The routes. `house.astro` is the house; everything else is a plain page. |
| `src/layouts/`, `src/components/` | The plain pages' layouts and parts. `HeroReveal.astro` is the hero picture that doubles as a door into the house. |
| `src/lib/` | Plain functions the pages and tests share: drafts, services, articles, towns, SEO, structured data, and `house-content.js`, which builds the house's previews. |
| `src/integrations/` | Build steps: team portraits from CMS uploads, `_headers` and `_redirects` for Cloudflare. |
| `public/assets/scripts/` | The house's ES modules (below). |
| `public/assets/content/` | The house's own JSON, edited in the CMS: `clinic.json` (also read by every plain page), `house-rooms.json`, `house-copy.json`. |
| `public/assets/styles/main.css` | The house's stylesheet. The plain pages use `src/styles/`. |
| `public/assets/rooms/`, `media/`, `turntable/`, `team/` | Images and video. Masters live in `art-src/`, which git ignores. |
| `tests/` | `node --test` files. `tests/helpers/house-content.mjs` builds the house's previews from the real content files. |
| `tools/` | One-off scripts: `build-site.mjs`, `rooms.mjs` (room image sizes), `portraits.mjs`. |
| `docs/` | Plans and records: `house-plan.md`, `redirects.md`, `deploy-failure-alerts.md` and others. |

## The house

| Module | Role |
| --- | --- |
| `app.js` | Entry point. Creates the controllers, renders sign previews in the pop-up, and moves the visit between rooms: history entries, the Back sign and the Rooms menu. |
| `content-data.js` | The house's content model: which rooms exist, each room's picture and signs (positions, what they open), joined by id to the wording in `house-rooms.json`. It reads the previews `house.astro` writes into the page. |
| `site-data.js` | Asset paths, the turntable frames, and tuning values for firelight and the dog's eyes. |
| `turntable-viewer.js` | The exterior: 61 WebP frames drawn on a canvas, with its door and window spots. |
| `entrance-video.js` | The door-opening video between the exterior and the welcome room (skipped under reduced motion). |
| `inside-scene.js` | A room: its picture layers, parallax, and signs positioned in the picture's own coordinates. |
| `team-carousel.js` | The team carousel, built from the team collection. |
| `modal-dialog.js` | Open, close and focus handling for the pop-ups. |
| `firelight-controller.js`, `dog-eye-controller.js` | The welcome room's two ambient effects. |

How a visit runs:

1. `house.astro` builds a short preview for every sign from the plain pages'
   files (`src/lib/house-content.js`) and writes it into the page as JSON. It
   also renders the welcome room's philosophy and contact pop-ups, the Rooms
   menu, and a screen-reader list of every room with a link to its page.
2. `app.js` starts on the exterior, or in the room named by `?room=`.
3. A spot on the exterior, a sign or the Rooms menu moves the visit. Each move
   is a history entry, so the browser's Back button steps back through rooms.
4. A sign opens its preview, which links on to its plain page and ends with
   the booking and calling buttons.

[HOTSPOT_CONTENT_MAP.md](HOTSPOT_CONTENT_MAP.md) lists every room and sign.

## Ignored or local folders

| Path | Purpose |
| --- | --- |
| `art-src/` | Full-size masters for served images (room pictures, portraits, the hero loop). Not served, not tracked. |
| `archive/` | The scraped WordPress site and older media. |
| `.playwright-mcp/` | Browser-testing screenshots and logs. |
| `dist/` | Build output. |

### `dev/room-orbits/` (not published)

The room-orbit prototype: `rooms-preview.html`, `assets/scripts/room-frames-viewer.js`, `assets/rooms/rooms.json`, and the 33-frame desktop and mobile sequences, depth maps and posters for each room (about 64 MB). Nothing on the site uses them yet, so they live outside `public/` and do not ship. Serve this folder with any static server to open the preview. `tools/roomfix/pack_*.py` write here.
