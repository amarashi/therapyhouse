# Therapy House Codebase Guide

This project is a static, browser-served Therapy House experience. It does not currently use a bundler, framework, package manager, or build step. The page is composed from `index.html`, one stylesheet, ES modules in `assets/scripts/`, and media assets in `assets/`.

Because the JavaScript uses ES modules, preview the site through a local HTTP server instead of opening `index.html` directly with `file://`.

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

Then open:

```text
http://127.0.0.1:8765/index.html
```

For the sign-position debugging tools, open:

```text
http://127.0.0.1:8765/index.html?debug=1
```

## Top-level Files

| File | Purpose |
|---|---|
| `.gitignore` | Ignores archived source material and Playwright MCP test artefacts. This keeps generated or historical files out of normal git status. |
| `CODEBASE.md` | This guide. It explains the current source layout and the role of each active file. |
| `index.html` | The main page shell. It contains semantic markup for the orientation prompt, exterior turntable canvas, entrance hotspot, transition video, inside scene, interactive signs, team carousel, philosophy modal, contact modal, and debug panel. Styling and behaviour are now loaded externally. |
| `therapyhouse-button-positions.json` | Exported position snapshot for the inside-scene sign buttons. It records the x/y location, perspective, rotation, skew, scale, and label for About Us, Back, Contact Us, and Our Philosophy. The debug panel can export this shape. |

## Styles

| File | Purpose |
|---|---|
| `assets/styles/main.css` | All visual styling for the site. It includes global layout, full-screen stage behaviour, orientation lock styles, exterior turntable canvas, door hotspot, transition video, inside parallax view, interactive scene signs, debug panel, team carousel, team cards, philosophy modal, contact modal, cursor sparkle styling, responsive breakpoints, and reduced-motion handling. |

## JavaScript Modules

| File | Purpose |
|---|---|
| `assets/scripts/app.js` | Application entry point. It finds DOM elements, creates all feature controllers, wires scene actions, keyboard shortcuts, modal scrolling, resize handling, debug mode, and initial startup. This is the orchestration layer. |
| `assets/scripts/entrance-video.js` | Controls the entrance transition. It listens to the door hotspot, centres the turntable, plays `door-transition.mp4` at the configured reduced speed, skips on double-click, and enters the inside scene when the video ends or debug mode requests it. |
| `assets/scripts/inside-scene.js` | Manages the inside room experience. It calculates image framing, positions interactive signs against the inside image coordinate system, applies parallax movement, samples edge colours from the base layer, handles reduced motion, and manages entering/leaving the inside scene. |
| `assets/scripts/modal-dialog.js` | Small reusable modal helper. It handles open/close state, `inert`, `aria-hidden`, backdrop clicks, close button clicks, and focus restoration. It is used by the philosophy and contact dialogs. |
| `assets/scripts/sign-position-debugger.js` | Reusable sign-position debugging tool. It reads and writes sign datasets, builds slider/number controls, updates signs live, serialises the current position document, saves it to `localStorage`, and downloads JSON snapshots. |
| `assets/scripts/site-data.js` | Static configuration and content. It defines the 48 turntable frame paths, exterior frame dimensions, door hotspot track, transition playback speed, inside image dimensions, fallback edge colours, parallax depth settings, debug storage keys, editable sign fields, and team member data. |
| `assets/scripts/team-carousel.js` | Team carousel feature module. It preloads team images, builds team cards from `site-data.js`, handles next/previous navigation, click-to-advance cards, swipe gestures, open/close state, focus restoration, and the visible profile count. |
| `assets/scripts/turntable-viewer.js` | Exterior rotating house renderer. It renders WebP frames into the canvas, loads nearby frames first, lazily loads the remaining sequence, handles hover, drag, wheel, keyboard navigation, canvas resizing, hotspot positioning, and centring before the entrance video plays. |
| `assets/scripts/utils.js` | Shared low-level helpers: clamping numbers, formatting values, idle-task scheduling, reading image dimensions, and preloading images. |

## Active Media Assets

### `assets/media/`

| File | Used by | Purpose |
|---|---|---|
| `assets/media/bookworm.png` | `index.html` philosophy modal | Illustration displayed in the Our Philosophy modal. |
| `assets/media/door-transition.mp4` | `index.html`, `entrance-video.js` | Cropped transition video from `archive/move_to_door.mp4`, played at reduced speed after clicking the door hotspot. |
| `assets/media/inside-layer-1.webp` | `index.html`, `inside-scene.js` | Base inside-room parallax layer. Also sampled for edge colours. |
| `assets/media/inside-layer-2.webp` | `index.html`, `inside-scene.js` | Middle inside-room parallax layer. |
| `assets/media/inside-layer-3.webp` | `index.html`, `inside-scene.js` | Foreground inside-room parallax layer. |
| `assets/media/logo3d.png` | `index.html` | Favicon and orientation-lock logo image. |
| `assets/media/logo3d.webp` | Not currently referenced by active code | Optimised WebP version of the logo. Kept as an available asset for future use. |
| `assets/media/phone.webp` | `index.html` contact modal | Contact modal artwork. |

### `assets/team/`

| File | Used by | Purpose |
|---|---|---|
| `assets/team/amelia-shay.webp` | `site-data.js`, `team-carousel.js` | Team portrait for Dr Amelia Shay. |
| `assets/team/genevieve-hussey.webp` | `site-data.js`, `team-carousel.js` | Team portrait for Genevieve Hussey. |
| `assets/team/jazmin-squire.webp` | `site-data.js`, `team-carousel.js` | Team portrait for Jazmin Squire. |
| `assets/team/josie.webp` | `site-data.js`, `team-carousel.js` | Team portrait for Josie. |
| `assets/team/kaya-beinke.webp` | `site-data.js`, `team-carousel.js` | Team portrait for Dr Kaya Beinke. |
| `assets/team/laura-storey.webp` | `site-data.js`, `team-carousel.js` | Team portrait for Laura Storey. |
| `assets/team/letitia-mcvey.webp` | `site-data.js`, `team-carousel.js` | Team portrait for Letitia McVey. |
| `assets/team/natasha.webp` | `site-data.js`, `team-carousel.js` | Team portrait for Natasha. |
| `assets/team/rani-banks.webp` | `site-data.js`, `team-carousel.js` | Team portrait for Rani Banks. |
| `assets/team/reea.webp` | `site-data.js`, `team-carousel.js` | Team portrait for Reea. |
| `assets/team/sahar-fattahi.webp` | `site-data.js`, `team-carousel.js` | Team portrait for Sahar Fattahi. |
| `assets/team/samson.webp` | `site-data.js`, `team-carousel.js` | Team portrait for Samson. |
| `assets/team/ChatGPT Image May 27, 2026, 11_44_30 PM.png` | Not currently referenced by active code | Generated image kept in the team asset folder. It is not part of the current rendered team carousel. |

### `assets/turntable/`

`assets/turntable/turntable_001.webp` through `assets/turntable/turntable_048.webp` are the exterior rotation frames generated from `archive/turning_house.mp4`. `site-data.js` generates these paths programmatically and stores their `1108x756` frame size; `turntable-viewer.js` draws them into the canvas and positions the door hotspot against that exterior image coordinate space.

Each file is one frame in the same 48-frame sequence:

```text
turntable_001.webp
turntable_002.webp
turntable_003.webp
turntable_004.webp
turntable_005.webp
turntable_006.webp
turntable_007.webp
turntable_008.webp
turntable_009.webp
turntable_010.webp
turntable_011.webp
turntable_012.webp
turntable_013.webp
turntable_014.webp
turntable_015.webp
turntable_016.webp
turntable_017.webp
turntable_018.webp
turntable_019.webp
turntable_020.webp
turntable_021.webp
turntable_022.webp
turntable_023.webp
turntable_024.webp
turntable_025.webp
turntable_026.webp
turntable_027.webp
turntable_028.webp
turntable_029.webp
turntable_030.webp
turntable_031.webp
turntable_032.webp
turntable_033.webp
turntable_034.webp
turntable_035.webp
turntable_036.webp
turntable_037.webp
turntable_038.webp
turntable_039.webp
turntable_040.webp
turntable_041.webp
turntable_042.webp
turntable_043.webp
turntable_044.webp
turntable_045.webp
turntable_046.webp
turntable_047.webp
turntable_048.webp
```

The loader prioritises the centre frame first, then nearby frames, then the rest of the sequence during idle time.

## Asset Documentation

| File | Purpose |
|---|---|
| `assets/asset-report.md` | Documents asset optimisation work: source paths, optimised paths, old and new sizes, dimensions, and processing notes. This is useful when replacing or regenerating media. |

## Ignored Local or Archived Folders

These folders exist in the workspace but are ignored by `.gitignore`, so they are not treated as active source files.

| Path | Purpose |
|---|---|
| `.playwright-mcp/` | Local Playwright MCP snapshots and console logs created during browser testing. These are test artefacts and can be regenerated. |
| `archive/` | Historical, source, unused, or pre-optimisation media. This includes original concept images, GIF/MP4 experiments, old inside-room images, source parallax images, and unused optimised files. These files are useful as design/source history but are not loaded by the active site. |

## How The Runtime Fits Together

1. `index.html` loads `assets/styles/main.css` and `assets/scripts/app.js`.
2. `app.js` imports configuration from `site-data.js` and creates the feature controllers.
3. `turntable-viewer.js` renders the exterior house into the canvas from the 48 turntable frames.
4. Clicking the door hotspot triggers `entrance-video.js`, which centres the turntable and plays the transition video.
5. When the video ends, `inside-scene.js` reveals the layered inside room and positions the interactive signs.
6. The About Us sign opens `team-carousel.js`; the Our Philosophy and Contact Us signs open modals through `modal-dialog.js`.
7. Opening `?debug=1` activates `sign-position-debugger.js`, allowing live editing and export of sign positions.

## Reuse Notes

The most portable modules are:

- `modal-dialog.js` for accessible modal state and focus handling.
- `team-carousel.js` for a data-driven card carousel.
- `sign-position-debugger.js` for any coordinate-based visual-position editor.
- `turntable-viewer.js` for frame-sequence canvas rotation.
- `inside-scene.js` for image-coordinate overlays and parallax scene layers.

If reusing these modules in another project, prefer copying the module plus its direct data contract from `site-data.js`, rather than copying `app.js` wholesale.
