---
name: Therapy House
description: An illustrated house you walk into — warm, hand-drawn rooms with quiet furniture-like UI floating inside them.
colors:
  hedge-green: "#234f2f"
  hedge-green-deep: "#17391f"
  ink-green: "#203914"
  candle-gold: "#fff2ad"
  lamp-amber: "#ffd254"
  ember-amber: "#ffbe44"
  bark-ink: "#2b2118"
  wood-brown: "#3a2612"
  chestnut: "#7c4b27"
  lamplit-cream: "#fffcf4"
  warm-white: "#fffdf8"
  paper-white: "#ffffff"
  leaf-link: "#124c3a"
  leaf-link-deep: "#0b2f21"
  focus-blue: "#005fcc"
  room-light: "#f0e2c6"
  room-wall: "#ded0b4"
  room-floor: "#c2ad8b"
typography:
  display:
    fontFamily: "Georgia, 'TH Serif Fallback', 'Times New Roman', serif"
    fontSize: "clamp(2.375rem, 1.833rem + 2.41vw, 4rem)"
    fontWeight: 700
    lineHeight: 1.02
    letterSpacing: "-0.02em"
  hero:
    fontFamily: "Georgia, 'TH Serif Fallback', 'Times New Roman', serif"
    fontSize: "clamp(2.375rem, 1.583rem + 3.52vw, 4.75rem)"
    fontWeight: 700
    lineHeight: 1.02
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Georgia, 'TH Serif Fallback', 'Times New Roman', serif"
    fontSize: "clamp(1.75rem, 1.542rem + 0.93vw, 2.375rem)"
    fontWeight: 700
    lineHeight: 1.14
    letterSpacing: "-0.01em"
  subhead:
    fontFamily: "Georgia, 'TH Serif Fallback', 'Times New Roman', serif"
    fontSize: "clamp(1.375rem, 1.292rem + 0.37vw, 1.625rem)"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "normal"
  cardTitle:
    fontFamily: "Georgia, 'TH Serif Fallback', 'Times New Roman', serif"
    fontSize: "1.1875rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "normal"
  wordmark:
    fontFamily: "Georgia, 'TH Serif Fallback', 'Times New Roman', serif"
    fontSize: "clamp(1.1875rem, 1.104rem + 0.37vw, 1.4375rem)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.01em"
  sign:
    fontFamily: "Georgia, 'TH Serif Fallback', 'Times New Roman', serif"
    fontSize: "0.9375rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "normal"
  lede:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "clamp(1.125rem, 1.083rem + 0.19vw, 1.25rem)"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "normal"
  title:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "1rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "normal"
  body:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "clamp(1rem, 0.979rem + 0.09vw, 1.0625rem)"
    fontWeight: 500
    lineHeight: 1.55
    letterSpacing: "normal"
  secondary:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "normal"
  meta:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: "normal"
  label:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "0.75rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.14em"
rounded:
  sm: "6px"
  md: "16px"
  lg: "18px"
  xl: "24px"
  pill: "999px"
  circle: "50%"
spacing:
  xs: "6px"
  sm: "10px"
  md: "14px"
  lg: "18px"
  xl: "24px"
  panel: "clamp(28px, 4.2vw, 46px)"
components:
  button-primary:
    backgroundColor: "{colors.hedge-green}"
    textColor: "#fffdf7"
    rounded: "{rounded.pill}"
    padding: "0 18px"
    height: "44px"
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "#ffffffc7"
    textColor: "{colors.bark-ink}"
  button-secondary:
    backgroundColor: "#ffffffb8"
    textColor: "{colors.bark-ink}"
    rounded: "{rounded.pill}"
    padding: "0 18px"
    height: "44px"
    typography: "{typography.label}"
  button-quiet:
    backgroundColor: "#fffdf6c7"
    textColor: "#2e481c"
    rounded: "{rounded.pill}"
    padding: "10px 16px"
    height: "42px"
  button-close:
    backgroundColor: "#ffffff9e"
    textColor: "#301e0c"
    rounded: "{rounded.circle}"
    size: "42px"
  scene-sign:
    textColor: "#3a2612"
    rounded: "{rounded.lg}"
    padding: "12px 15px"
    typography: "{typography.sign}"
  modal-panel:
    textColor: "{colors.ink-green}"
    rounded: "{rounded.xl}"
    padding: "{spacing.panel}"
    width: "min(880px, 100%)"
  team-card:
    textColor: "{colors.bark-ink}"
    rounded: "{rounded.xl}"
    width: "min(840px, 74vw)"
    height: "min(440px, calc(100vh - 170px))"
  detail-tile:
    backgroundColor: "#ffffff29"
    textColor: "{colors.ink-green}"
    rounded: "{rounded.md}"
    padding: "12px 14px"
---

# Design System: Therapy House

## 1. Overview

**Creative North Star: "The Front Room"**

The best room in a family home. Good afternoon light, real furniture, a dog somewhere in it. Everything in this system answers to that image: the illustrated house is the product, and the interface is the furniture inside it — present, useful, and never the thing you notice first. A visitor does not read a page about a clinic; they stand in a room and look around.

The consequence is a system with an unusual centre of gravity. There is no page chrome, no header, no nav bar, no scroll. The 48-frame exterior turntable is the site map; doors, windows, signs and a mailbox are the navigation. Inside a room, the illustration owns the full viewport and the UI floats on top of it as small warm objects. That inversion is the identity — it is why the site cannot be mistaken for the psychology-clinic template, and it is also the system's main liability, because a worried parent reading a fee schedule is not helped by atmosphere.

So the system runs two temperatures. Ambient surfaces — signs, hotspots, glows, the parallax — are soft, translucent and quiet. Content surfaces — modal bodies, fee lists, team bios, the two CTAs — get firmer, flatter, higher-contrast treatment. Warmth is carried by the illustration and the light; legibility is never asked to pay for it. This rejects the corporate SaaS landing page (no gradient hero, no feature-card triptych, no testimonial carousel) and rejects the slow, heavy tech demo just as hard: nothing ambient may sit on the path to a phone number.

**Key Characteristics:**
- Illustration-first: hand-drawn rooms occupy 100% of the stage; UI is an overlay, never a layout
- Warm-neutral base (cream and bark brown) with exactly two committed colours: hedge green for action, candle gold for "this is clickable"
- Serif for the names of things, system sans for everything read in quantity
- Pill-shaped, soft-edged controls that recede into the scene and step forward on hover and focus
- Real depth — 3D-transformed signs, a perspective carousel, three parallax layers — used sparingly and always reversible under `prefers-reduced-motion`

## 2. Colors

A lamplit interior palette: cream and bark brown carry the surfaces, one deep green carries every action, one gold carries every invitation.

### Primary
- **Hedge Green** (`#234f2f`): Brisbane-leafy, deeply planted. Every committed action wears it — the primary booking button fill, and (as `#17391f`, **Hedge Green Deep**) that button's 2px border. It is the only saturated colour permitted on a solid fill.
- **Ink Green** (`#203914`): The near-black green of modal titles, detail values and section headings. Reads as ink, not as colour; it is what makes serif titles feel printed rather than branded.
- **Leaf Link** (`#124c3a`) / **Leaf Link Deep** (`#0b2f21`): Inline links at rest and on hover, always underlined at 2px with a 4px offset. Links are green because actions are green; the hierarchy is one idea, not two.

### Secondary
- **Candle Gold** (`#fff2ad`): The sparkle colour and the core of every interactive glow. Solid gold appears only at 5–6px — sparkle dots on the door hotspot and the cursor trail.
- **Lamp Amber** (`#ffd254`) / **Ember Amber** (`#ffbe44`): The radial glow behind door and window hotspots, and the outer bloom of their shadows. Always at low alpha (0.16–0.7), never as a fill, never as text.

### Neutral
- **Lamplit Cream** (`#fffcf4`): The warm surface of floating objects — hotspot labels, nav clusters, meta chips. The domestic base note.
- **Warm White** (`#fffdf8`) / **Paper White** (`#ffffff`): Body and canvas background. The illustration covers it; it is a backstop, not a design surface.
- **Bark Ink** (`#2b2118`): Default body text. Warm-black, never grey.
- **Wood Brown** (`#3a2612`): Text on signs and hotspot labels, where copy sits directly over illustration.
- **Chestnut** (`#7c4b27`): The `o` divider rule under modal titles and its two hairlines. The one decorative mark in the system, and it is allowed exactly one job.

### Room
Three tones that exist only inside a rendered interior — the library shelf's lit room, and any scene like it. They are deeper than the reading pages' cream because a lit room needs somewhere for the light to fall off to; a volume standing against `warm-white` has no shadow side and reads as a sticker.

- **Room Light** (`#f0e2c6`): The lit part of the back wall, where the key falls. Also the top stop of the stage's own gradient, so the CSS ground under the canvas matches the wall painted inside it.
- **Room Wall** (`#ded0b4`): The wall in its own light, and the scene's fog colour.
- **Room Floor** (`#c2ad8b`): The boards below the shelf, and the bottom stop of the stage gradient.

These never carry text and never appear on a reading page. Each volume shifts them a little further toward its own binding — honey behind the yellow picture book, a cooler stone behind the blue manual — but the range stays lamplit. **The reference this shelf came from re-lights its room to near-black per volume; that move is deliberately not carried over.** A dark room would make the shelf a showcase sitting in the middle of a clinic's library page, which is the slow, heavy tech demo this system rejects.

### Utility
- **Focus Blue** (`#005fcc`): A 3px focus ring at 2–3px offset on every interactive element. Deliberately outside the palette — it is an accessibility instrument, not a brand colour, and it must never be softened to fit the warm scheme.

### Named Rules

**The Glow Means Go Rule.** Candle gold and the ambers mark interactivity and nothing else. A gold glow on a door means the door opens. Gold used decoratively — a warm wash behind a heading, an amber divider, a sparkle for atmosphere alone — breaks the only wayfinding grammar this site has, because there is no menu to fall back on.

**The Green Is A Verb Rule.** Hedge green appears where a visitor can do something: book, call, follow a link, read a title that names a room. It never tints a background, never sits behind body text, never becomes a decorative accent.

**The Warm-Black Rule.** Text is `#2b2118` or `#3a2612`, never a neutral grey. Grey text on these cream and illustrated surfaces reads as washed out and as ill. Body copy at or below 15px must clear 4.5:1 against whatever is actually behind it — which, on a translucent panel, means against the *illustration*, not the panel.

## 3. Typography

**Display Font:** Georgia (with `'TH Serif Fallback', "Times New Roman", serif`)
**Body Font:** system-ui (with `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`)

**Character:** A deliberate contrast pairing — an old-style serif with real stroke modulation against a neutral system sans. The serif carries the house's age and warmth; the sans stays invisible so long-form clinical content reads fast on any device. Georgia is doing storybook work here, but with restraint: it appears at large sizes on titles, on the room signs, and on people's names, and nowhere else.

`TH Serif Fallback` is not a download. It is a `local()`-only `@font-face` in `tokens.css` that takes whatever generic serif the device already has — Noto Serif on Android, Liberation Serif or DejaVu on Linux — and corrects its metrics to Georgia's: `size-adjust: 94%` for the x-height, and ascent/descent overrides to replace a line box 20% taller than Georgia's. Georgia ships on Windows and macOS and on neither Android nor most Linux, so without it half of a phone audience reads a ramp measured against a face they do not have.

### Hierarchy

Two faces, one ramp, expressed in `rem` — a `px` ramp ignores the browser text size a visitor has deliberately turned up, which is the visitor least able to afford it.

- **Display** (serif, 700, `2.375rem → 4rem`, 1.02, `-0.02em`): A page's `h1`, and the house's modal titles. The lockup is title + chestnut divider rule.
- **Hero** (serif, 700, `2.375rem → 4.75rem`, 1.02, `-0.02em`): The home page welcome, which owns a whole screen and may outrank an ordinary page heading. Nowhere else.
- **Headline** (serif, 700, `1.75rem → 2.375rem`, 1.14, `-0.01em`): `h2`, and a team member's name on their card. The only place a person's name appears at scale, which is the point — credibility is carried by people.
- **Subhead** (serif, 700, `1.375rem → 1.625rem`, 1.25): `h3`, a published fee, a year marker, and a supporting `h2` that must not read as a second page heading.
- **Card Title** (serif, 700, `1.1875rem`, 1.25): The name of one entry inside a grid or a list — an article, a book, a plate on the map.
- **Sign** (serif, 700, `0.9375rem`, 1.15): The in-scene signs. Small serif on a soft panel reading as an object in the room rather than a button on a screen.
- **Wordmark** (serif, 700, `1.1875rem → 1.4375rem`, 1, `-0.01em`): The masthead, and nothing else.
- **Lede** (sans, `1.125rem → 1.25rem`, 1.45): The opening paragraph, a practitioner's role, the one sentence on a page that is asking rather than telling.
- **Title** (sans, 800, `1rem`, 1.2): Section headings inside house modal content — philosophy principles, service groups, fee blocks.
- **Body** (sans, 500, `1rem → 1.0625rem`, 1.55): All prose. Capped at 680px (~68ch); that cap is the standard, not the exception.
- **Secondary** (sans, `0.9375rem`, 1.45): Card copy, notes, roles, credentials, buttons — anything set inside a block that already has a title of its own.
- **Meta** (sans, `0.875rem`, 1.3): Captions, dates, availability chips, footnotes. The floor; nothing is set smaller than this except a label.
- **Label** (sans, 800, `0.75rem`, `0.14em`, uppercase): Definition-list terms, a row-group name, a "3 of 12" counter. Sparingly — see the rule below.

### Named Rules

**The Serif Names Things Rule.** Georgia is for proper nouns and the names of places: room titles, people, signs. Anything a visitor reads in quantity — bios, fees, process steps, articles — is system sans. A serif paragraph in a fee table is a mistake, not a flourish.

**The Eyebrow Budget Rule.** Uppercase 12px tracked labels are capped at one per surface, and only where they carry real information (a definition-list term, a "3 of 12" counter). A decorative "THERAPY HOUSE" eyebrow above every modal title is scaffolding — it repeats what the visitor already knows and reads as generated. Prefer no eyebrow to a redundant one.

**The 65–75ch Rule.** No prose measure exceeds 680px regardless of panel width. Wide modals get a constrained text column, not full-bleed paragraphs.

**The Three Small Steps Rule.** Below body there are exactly three sizes — secondary, meta, label — and they are tokens, never `em`. An `em` size makes the same role compute differently depending on what it happens to sit inside, which is how one project arrived at thirteen values (0.8 / 0.82 / 0.85 / 0.9 / 0.92 / 0.94 / 0.95 / 0.97…) for three jobs, two of them landing under 13px on a phone. If a new piece of small text does not fit one of the three, it is not a new size; it is the wrong role.

**The Leading Follows The Measure Rule.** 1.55 is for prose at ~68ch, where the eye has a long way back. Card copy at ~35ch takes 1.45, and a two-line chip takes 1.3. One ratio applied everywhere sets narrow columns too loose and reads as a stack of unrelated lines.

**The Lining Figures Rule.** The display face defaults to old-style figures, which drop the 3, 4, 7 and 9 below the baseline. Anywhere the site publishes a number a visitor is comparing — a fee, a phone number, a year, a session length — set `font-variant-numeric: lining-nums tabular-nums`. A ragged baseline is the one thing a column of prices must not have.

**No Grayscale Smoothing.** `-webkit-font-smoothing: antialiased` thins dark-on-cream text on macOS by trading subpixel rendering for grayscale. It is a preference dressed as a polish step, and it costs exactly the visitor who is already squinting. Not used.

## 4. Elevation

Layered, and genuinely three-dimensional rather than shadowed-flat. Objects in this system claim real space: signs are `perspective()`-transformed against the room's coordinate grid, team cards rotate on a 1400px perspective deck, and three parallax layers separate on pointer movement. Depth is illustrative, not decorative — it exists so that overlay UI reads as furniture standing in a room rather than a card sitting on a page.

Two materials do the work: a **warm drop shadow** (always brown-black, never neutral) and an **inset top highlight** (`inset 0 1px 0 rgba(255,255,255,0.5–0.86)`) that gives every surface a lit top edge, as if the light source is above and in front. That highlight is the single most identity-carrying detail in the CSS and it belongs on every raised object.

### Shadow Vocabulary
- **Object rest** (`0 16px 36px rgba(48, 25, 8, 0.18)`): Signs and small floating objects.
- **Object active** (`0 18px 42px rgba(48, 25, 8, 0.23)`, plus `0 0 28px rgba(255, 234, 172, 0.26)`): Hover and focus. Note the second layer — a gold bloom, not a darker shadow. Things get *warmer* when you reach for them, not heavier.
- **Panel** (`0 30px 72px rgba(25, 13, 5, 0.3)`): Modals and the active team card. The one heavy shadow in the system.
- **Tile** (`0 10px 22px rgba(60, 35, 12, 0.08)`): Content sub-blocks inside a panel. Barely there; it separates without stacking.
- **Lift** (`0 10px 24px rgba(45, 25, 9, 0.15)` / `0 12px 26px rgba(38, 22, 8, 0.16)`): Hotspot labels and the carousel nav cluster.

### Named Rules

**The Warm Shadow Rule.** Every shadow is brown-black (`rgba(48,25,8,…)` family). A neutral or blue-grey shadow instantly makes the scene feel lit by a screen instead of by a lamp. Prohibited.

**The Lit Edge Rule.** Any raised surface gets the inset white top highlight. Without it, translucent panels read as smudges rather than objects.

**The Glass Drift Rule.** *Flagged for rework.* Every floating surface currently uses `backdrop-filter: blur(6–10px)` over the illustration, with translucent white gradient fills. On the small ambient objects — signs, hotspot labels — this is right: the room stays visible behind them and nothing is being read at length. On the **content panels** it has drifted into decoration at the cost of legibility: modal bodies, fee lists, team bios and the philosophy tiles sit on `rgba(255,255,255,0.06–0.2)` fills whose effective contrast depends on whatever illustration happens to be behind them. The direction of travel is: **glass over illustration for objects, solid opaque surfaces for anything with more than a sentence of text.** Until that pass happens, treat new translucent content surfaces as prohibited.

## 5. Components

### Buttons
- **Shape:** Fully rounded pill (`999px`) on every control without exception, including the 42px circular close buttons. Nothing in this system has a corner sharper than 6px.
- **Primary:** Hedge green fill (`#234f2f`) with a 2px `#17391f` border, cream text (`#fffdf7`), 44px minimum height, 12–13px uppercase label with a 2px underline. Reserved for booking and calling — the two equal CTAs.
- **Secondary:** Same geometry, dashed border, translucent white fill, bark ink text. The dashed edge is the system's one piece of visible informality and it marks the lower-commitment path.
- **Quiet (`content-modal__button`):** Near-white fill, deep green text, no heavy border. In-content links to booking portals, external articles, source pages.
- **Hover / Focus:** All controls take a 3px `#005fcc` outline at 2px offset. Fills lighten toward white on hover — *note the inversion:* the primary green button currently turns near-white on hover, which loses its identity at the exact moment of intent. Flagged; the intended behaviour is a deeper green with the gold bloom.
- **Close buttons:** 42px circle (38px in the carousel), translucent white, 24px glyph, top-right at 16px inset.

### Scene signs (signature component)
The system's defining object. A small serif-labelled panel positioned in the illustration's own pixel coordinate space (`data-x` / `data-y` against the room image, not the viewport), then transformed with per-sign perspective, rotation, skew and scale so it sits *in* the scene at the angle of the surface it rests on — a table, a wall, a door. 18px radius, 1px white border, a 5px inset second border, translucent warm fill, backdrop blur, and the standard warm shadow. On hover the fill brightens, the gold bloom appears, and the label underlines at 2px.

They are quiet until needed by design: at rest they read as objects in the room; on hover and focus they become unmistakably clickable. That restraint is only affordable because the exterior turntable teaches the interaction first, via the pulsing gold door glow.

### Hotspots
Invisible until approached. An exterior hotspot is a transparent hit area with a radial gold glow that fades in over 160ms on hover or focus, plus a cream pill label (12px, 800 weight) that rises 6px into place beneath it. The main door is the exception — it glows continuously on a 2.8s breathing loop with four floating sparkles, because it is the one affordance a first-time visitor must discover unprompted.

### Cards / Containers
- **Corner style:** 24px on panels and team cards, 16px on content tiles inside them.
- **Background:** Layered — a radial white highlight at the top-left corner, a 145° warm gradient, then a translucent base.
- **Shadow strategy:** Panel shadow for the container, tile shadow for blocks inside it. Never nest a panel shadow inside a panel shadow.
- **Border:** 1px `rgba(255,255,255,0.56–0.66)` — a light edge, never a dark rule.
- **Internal padding:** `clamp(28px, 4.2vw, 46px)` on panels, 12–16px on tiles.

### Team carousel (signature component)
A 3D deck on a 1400px perspective: the active card sits forward at `translateZ(150px)`, neighbours fall back to `-180px`, rotate 32° and drop to 32% opacity, and everything else recedes to `-360px` at 62% scale. Motion is `520ms cubic-bezier(0.2, 0.72, 0.2, 1)` — a decisive ease-out with no bounce. Neighbouring cards are clickable, and the deck accepts swipe. Each card is a two-column split: portrait against name, role and bio.

### Modals
Three variants sharing one panel: philosophy (illustrated, centred, principle tiles in a two-column grid), content (generic, driven by `content-data.js`), contact (two-column with artwork). All open on a 260ms opacity fade over a dimmed warm scrim (`rgba(29,18,9,0.42)` with a soft radial warm light). All are `role="dialog"` with `aria-modal`, `inert` on the background, and focus restored to the trigger on close.

### Detail tiles
Definition-list rows for factual content — phone, fax, email, address. 78px label column, uppercase 12px term, 15px value, 16px radius, light inset highlight. This is the pattern for any dense factual content; it is the alternative to a card grid, and it should be reached for first.

## 6. Do's and Don'ts

### Do:
- **Do** position in-scene UI against the illustration's own coordinate system, not the viewport. A sign that drifts off its table on resize breaks the entire premise.
- **Do** give every raised surface the inset white top highlight (`inset 0 1px 0 rgba(255,255,255,0.5–0.86)`) and a warm brown shadow from the vocabulary above.
- **Do** make things *warmer* on hover — the gold bloom (`0 0 28px rgba(255,234,172,0.26)`) — rather than darker or larger.
- **Do** keep the two CTAs, book and call, at equal weight and equally reachable. Neither is the fallback for the other.
- **Do** carry both booking and phone affordances into any new room that could plausibly end a visit.
- **Do** cap prose at 680px and use the detail-tile pattern for factual content.
- **Do** pair every animation with a `prefers-reduced-motion` alternative — the parallax, firelight, dog-eye tracking, sparkles and cursor trail all already have one. New motion without one does not ship.
- **Do** keep the 3px `#005fcc` focus ring exactly as it is on every interactive element, including in-scene signs and invisible hotspots.

### Don't:
- **Don't** build the psychology-clinic template. No stock photos of smiling strangers, no teal-and-white, no sterile card grid, no "Our Services" accordion. The illustrated room replaces all of it.
- **Don't** build the corporate SaaS landing page. No gradient hero, no feature-card triptych, no testimonial carousel, no "Get started free". This site has no hero section because it has no page.
- **Don't** build the slow, heavy tech demo. Every ambient sequence — the door transition video, the entrance animation, the carousel — must be skippable and interruptible. Nothing ambient sits between a parent and a phone number.
- **Don't** put more than a sentence of text on a translucent panel. See The Glass Drift Rule: content surfaces get solid, opaque fills.
- **Don't** use grey body text anywhere. Warm-black (`#2b2118` / `#3a2612`) or the ink green, never a neutral grey — it reads as washed out on cream and as unreadable over illustration.
- **Don't** use gold for decoration. If it glows, it is clickable.
- **Don't** add a tracked uppercase eyebrow above a title that already says the same thing. One "THERAPY HOUSE" over "Our Philosophy" inside the Therapy House site is telling the visitor nothing.
- **Don't** reach for a card grid. Identical icon-heading-text cards are the pattern this system exists to avoid; use detail tiles, a list, or the room itself.
- **Don't** use `background-clip: text` gradients, `border-left` colour stripes wider than 1px, or neutral/cool-grey shadows. All three are prohibited outright.
- **Don't** neutralise the focus ring to fit the warm palette. Blue is correct precisely because it does not belong.
- **Don't** add a new font family. Georgia and system-ui, in the roles above; a third family is not a design decision here, it is a leak.
