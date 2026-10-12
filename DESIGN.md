---
name: Therapy House
description: An illustrated house you walk into, and plain lamplit pages you read — warm, hand-drawn rooms with quiet furniture-like UI, and the answers set clearly on warm white.
colors:
  hedge-green: "#234f2f"
  hedge-green-deep: "#17391f"
  hedge-sage: "#4a7c59"
  ink-green: "#203914"
  leaf-link: "#124c3a"
  leaf-link-deep: "#0b2f21"
  candle-gold: "#fff2ad"
  lamp-amber: "#ffd254"
  ember-amber: "#ffbe44"
  chestnut: "#7c4b27"
  bark-ink: "#2b2118"
  wood-brown: "#3a2612"
  ink-soft: "#5a4a3c"
  ink-faint: "#7d6d5f"
  lamplit-cream: "#fffcf4"
  warm-white: "#fffdf8"
  paper-white: "#ffffff"
  surface-accent: "#eaf3ec"
  line: "#e6ded1"
  line-soft: "#f1ebe0"
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
    fontWeight: 400
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
  2xl: "40px"
  3xl: "64px"
  panel: "clamp(28px, 4.2vw, 46px)"
  section: "clamp(3.25rem, 5.5vw, 5.5rem)"
components:
  button-primary:
    backgroundColor: "{colors.hedge-green}"
    textColor: "#fffdf7"
    rounded: "{rounded.pill}"
    padding: "0 24px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.hedge-green-deep}"
    textColor: "#fffdf7"
  button-secondary:
    backgroundColor: "{colors.paper-white}"
    textColor: "{colors.hedge-green}"
    rounded: "{rounded.pill}"
    padding: "0 24px"
    height: "44px"
  button-secondary-hover:
    backgroundColor: "{colors.lamplit-cream}"
    textColor: "{colors.hedge-green-deep}"
  action-bar:
    backgroundColor: "{colors.paper-white}"
    rounded: "{rounded.pill}"
    padding: "{spacing.sm}"
  hero-door:
    backgroundColor: "{colors.paper-white}"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.pill}"
    padding: "0 18px 0 14px"
    height: "44px"
    typography: "{typography.secondary}"
  hero-door-hover:
    textColor: "{colors.hedge-green}"
  rail-label:
    textColor: "{colors.ink-soft}"
    typography: "{typography.label}"
    height: "44px"
  rail-label-current:
    textColor: "{colors.hedge-green}"
  card:
    backgroundColor: "{colors.paper-white}"
    textColor: "{colors.bark-ink}"
    rounded: "{rounded.lg}"
    padding: "{spacing.xl}"
  card-closing:
    backgroundColor: "{colors.lamplit-cream}"
    textColor: "{colors.bark-ink}"
    rounded: "{rounded.lg}"
    padding: "{spacing.xl}"
  fact-tile:
    backgroundColor: "{colors.lamplit-cream}"
    textColor: "{colors.bark-ink}"
    rounded: "{rounded.md}"
    padding: "14px 18px"
  status-chip:
    backgroundColor: "{colors.lamplit-cream}"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.pill}"
    padding: "6px 14px"
    typography: "{typography.meta}"
  status-chip-accepting:
    backgroundColor: "{colors.surface-accent}"
    textColor: "{colors.hedge-green-deep}"
  notice:
    backgroundColor: "{colors.lamplit-cream}"
    textColor: "{colors.bark-ink}"
    rounded: "{rounded.sm}"
    padding: "14px 18px"
  map-plate:
    backgroundColor: "{colors.lamplit-cream}"
    textColor: "{colors.hedge-green}"
    rounded: "{rounded.md}"
    padding: "11px 15px"
    typography: "{typography.cardTitle}"
  button-quiet:
    backgroundColor: "#fffdf6c7"
    textColor: "#2e481c"
    rounded: "{rounded.pill}"
    padding: "10px 16px"
    height: "42px"
  button-close:
    backgroundColor: "#ffffff9e"
    textColor: "#301e0c"
    rounded: "{rounded.pill}"
    size: "42px"
  scene-sign:
    textColor: "{colors.wood-brown}"
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

## Overview

**Creative North Star: "The Front Room"**

The best room in a family home. Good afternoon light, real furniture, a dog somewhere in it. Everything in this system answers to that image: the illustrated house is the product, and the interface is the furniture inside it — present, useful, and never the thing you notice first. A visitor does not read a page about a clinic; they stand in a room and look around.

The consequence is a system with two halves that share one palette. The house — the 48-frame exterior turntable, its doors, windows, signs and mailbox — is a walk-through at its own address, with no page chrome and no scroll: inside a room the illustration owns the full viewport and the UI floats on top of it as small warm objects. Every page a visitor searches for and compares is a plain page: a scrolling reading page on warm white, with a typographic masthead, a lift-shaft menu, the answer first and a garden hedge along the footer. The rooms come with them as pictures — a hub page opens on its room, and that picture is a door into the house — but on these pages the illustration decorates the content rather than carrying it. The house is why the site cannot be mistaken for the psychology-clinic template; the plain pages are why a worried parent reading a fee schedule is never asked to pay for atmosphere.

So the system runs two temperatures. Ambient surfaces — signs, hotspots, glows, the parallax — are soft, translucent and quiet. Content surfaces — modal bodies, fee lists, team bios, the two CTAs — get firmer, flatter, higher-contrast treatment. Warmth is carried by the illustration and the light; legibility is never asked to pay for it. This rejects the corporate SaaS landing page (no gradient hero, no feature-card triptych, no testimonial carousel) and rejects the slow, heavy tech demo just as hard: nothing ambient may sit on the path to a phone number.

**Key Characteristics:**
- Illustration-first: in the house, hand-drawn rooms occupy 100% of the stage and UI is an overlay; on plain pages, each hub opens on its room and the reading column below stays plain
- Warm-neutral base (cream and bark brown) with exactly two committed colours: hedge green for action and for the ink of headings, candle gold for "this is clickable"
- Serif for the names of things, system sans for everything read in quantity
- Pill-shaped, soft-edged controls that recede into the scene and step forward on hover and focus
- Real depth and motion — 3D-transformed signs, a perspective carousel, three parallax layers, the lift, the hero's one settling move — used sparingly and always reversible under `prefers-reduced-motion`

## Colors

A lamplit interior palette: cream and bark brown carry the surfaces, one deep green carries every action, one gold carries every invitation.

### Primary
- **Hedge Green** (`#234f2f`): Brisbane-leafy, deeply planted. Every committed action wears it — the booking and calling buttons, the step numbers, the current floor in the menu — and on plain pages it is the ink of every `h1`–`h3`, the wordmark and a person's name. As **Hedge Green Deep** (`#17391f`) it is the pressed state of a button and the text of an "accepting new clients" status. It is the only saturated colour permitted on a solid fill.
- **Hedge Sage** (`#4a7c59`): The lighter partner to hedge green in a two-tone heading — the hero's subtitle line and an accented word in a title — and the menu tick a pointer is resting on. It clears 4.78:1 on warm white; the paler sage it replaced did not.
- **Ink Green** (`#203914`): The near-black green of the house's modal titles and detail values, and the library shelf's title. Reads as ink, not as colour; it is what makes serif titles feel printed rather than branded.
- **Leaf Link** (`#124c3a`) / **Leaf Link Deep** (`#0b2f21`): Inline links at rest and on hover. Links are green because actions are green; the hierarchy is one idea, not two.

### Secondary
- **Candle Gold** (`#fff2ad`): The sparkle colour and the core of every interactive glow. Solid gold appears only at 5–6px — sparkle dots on the door hotspot and the cursor trail — and as the text-selection highlight.
- **Lamp Amber** (`#ffd254`) / **Ember Amber** (`#ffbe44`): The radial glow behind door and window hotspots, behind the hero's room when its door is reached for, around the lift car's lamp and the map on hover, and the outer bloom of their shadows. Always at low alpha (0.14–0.7), never as a fill, never as text.

### Tertiary
- **Chestnut** (`#7c4b27`): The system's one marking colour. It draws rules and points — the `o` divider under the house's modal titles, the 2px rule under a hero title, the bullet of a tick list, the scrollbar thumb — and carries the small warm notes that must not read as actions: a waitlist status, a practitioner's languages, the phone number in the menu row. Never a fill, never a heading.

### Neutral
- **Lamplit Cream** (`#fffcf4`): The sunk surface — the closing card, fact tiles, notices, status chips, the map plate — and the warm surface of floating objects in the house. The domestic base note.
- **Warm White** (`#fffdf8`): The plain pages' ground. In the house it is a backstop the illustration covers.
- **Paper White** (`#ffffff`): The raised surface — cards, the menu bar, the footer, the action bar, the hero's door pill — one step brighter than the ground it stands on.
- **Bark Ink** (`#2b2118`): Default body text. Warm-black, never grey.
- **Wood Brown** (`#3a2612`): Text on signs and hotspot labels, where copy sits directly over illustration.
- **Ink Soft** (`#5a4a3c`): Ledes, roles, notes, menu labels and anything a step quieter than body.
- **Ink Faint** (`#7d6d5f`): Captions, row-group and footer labels, the fax line. The quietest text in the system, at 4.89:1 on warm white.
- **Sage Wash** (`#eaf3ec`): The pale green ground of an "accepting new clients" status, and nothing else.
- **Line** (`#e6ded1`) / **Line Soft** (`#f1ebe0`): Hairlines. Line borders cards, tables and the menu bar; Line Soft divides rows inside a block that already has an edge.

### Room
Three tones that exist only inside a rendered interior — the library shelf's lit room, and any scene like it. They are deeper than the reading pages' cream because a lit room needs somewhere for the light to fall off to; a volume standing against `warm-white` has no shadow side and reads as a sticker.

- **Room Light** (`#f0e2c6`): The lit part of the back wall, where the key falls. Also the top stop of the stage's own gradient, so the CSS ground under the canvas matches the wall painted inside it.
- **Room Wall** (`#ded0b4`): The wall in its own light, and the colour the scene's fog is tuned to.
- **Room Floor** (`#c2ad8b`): The boards below the shelf, and the bottom stop of the stage gradient.

These never carry text and never appear on a reading page. Each volume shifts them a little further toward its own binding — honey behind the yellow picture book, a cooler stone behind the blue manual — but the range stays lamplit. **The reference this shelf came from re-lights its room to near-black per volume; that move is deliberately not carried over.** A dark room would make the shelf a showcase sitting in the middle of a clinic's library page, which is the slow, heavy tech demo this system rejects.

### Utility
- **Focus Blue** (`#005fcc`): A 3px focus ring at 2–3px offset on every interactive element. Deliberately outside the palette — it is an accessibility instrument, not a brand colour, and it must never be softened to fit the warm scheme.

### Named Rules

**The Glow Means Go Rule.** Candle gold and the ambers mark interactivity and nothing else. A gold glow on a door means the door opens. Gold used decoratively — a warm wash behind a heading, an amber divider, a sparkle for atmosphere alone — breaks the only wayfinding grammar this site has, because there is no menu to fall back on.

**The Green Is A Verb Rule.** Hedge green appears where a visitor can do something — book, call, follow a link, choose a floor — or as the ink of a title that names a thing. It never fills a section or a card, never sits behind body text, never becomes a decorative accent. The one green-tinted ground is the Sage Wash behind an "accepting new clients" status, because that status is the answer a parent is scanning for.

**The Warm-Black Rule.** Text is bark ink (`#2b2118`) or wood brown (`#3a2612`), stepping down only to the warm Ink Soft and Ink Faint — never a neutral grey. Grey text on these cream and illustrated surfaces reads as washed out and as ill. Body copy at or below 15px must clear 4.5:1 against whatever is actually behind it — which, on a translucent panel, means against the *illustration*, not the panel.

## Typography

**Display Font:** Georgia (with `'TH Serif Fallback', "Times New Roman", serif`)
**Body Font:** system-ui (with `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`)

**Character:** A deliberate contrast pairing — an old-style serif with real stroke modulation against a neutral system sans. The serif carries the house's age and warmth; the sans stays invisible so long-form clinical content reads fast on any device. Georgia is doing storybook work here, but with restraint: it appears at large sizes on titles, on the room signs, and on people's names, and nowhere else.

`TH Serif Fallback` is not a download. It is a `local()`-only `@font-face` in `tokens.css` that takes whatever generic serif the device already has — Noto Serif on Android, Liberation Serif or DejaVu on Linux — and corrects its metrics to Georgia's: `size-adjust: 94%` for the x-height, and ascent/descent overrides to replace a line box 20% taller than Georgia's. Georgia ships on Windows and macOS and on neither Android nor most Linux, so without it half of a phone audience reads a ramp measured against a face they do not have.

### Hierarchy

Two faces, one ramp, expressed in `rem` — a `px` ramp ignores the browser text size a visitor has deliberately turned up, which is the visitor least able to afford it.

- **Display** (serif, 700, `2.375rem → 4rem`, 1.02, `-0.02em`): A page's `h1`, and the house's modal titles. In the hero the title is followed by a 2px chestnut rule; in the house, by the chestnut `o` divider.
- **Hero** (serif, 700, `2.375rem → 4.75rem`, 1.02, `-0.02em`): The home page welcome, which owns a whole screen and may outrank an ordinary page heading. Nowhere else.
- **Headline** (serif, 700, `1.75rem → 2.375rem`, 1.14, `-0.01em`): `h2`, and a team member's name on their card. The only place a person's name appears at scale, which is the point — credibility is carried by people.
- **Subhead** (serif, 700, `1.375rem → 1.625rem`, 1.25): `h3`, a published fee, a year marker, a service name in a service list, and a supporting `h2` that must not read as a second page heading.
- **Card Title** (serif, 700, `1.1875rem`, 1.25): The name of one entry inside a grid or a list — an article, a book, the address on the map plate — and a fee on a narrow screen.
- **Sign** (serif, 700, `0.9375rem`, 1.15): The in-scene signs. Small serif on a soft panel reading as an object in the room rather than a button on a screen.
- **Wordmark** (serif, 700, `1.1875rem → 1.4375rem`, 1, `-0.01em`): The masthead, and nothing else.
- **Lede** (sans, `1.125rem → 1.25rem`, 1.45): The opening paragraph, a practitioner's role, the one sentence on a page that is asking rather than telling. Set in Ink Soft.
- **Title** (sans, 800, `1rem`, 1.2): Section headings inside house modal content — philosophy principles, service groups, fee blocks.
- **Body** (sans, 400, `1rem → 1.0625rem`, 1.55): All prose. Capped at the `71ch` reading measure (about 69 real characters); that cap is the standard, not the exception.
- **Secondary** (sans, `0.9375rem`, 1.45): Card copy, notes, roles, credentials, buttons (at 700) — anything set inside a block that already has a title of its own.
- **Meta** (sans, `0.875rem`, 1.3): Captions, dates, availability chips, footnotes. The floor; nothing is set smaller than this except a label.
- **Label** (sans, 800, `0.75rem`, `0.14em`, uppercase): Definition-list terms, a fee row group, a footer list heading, a menu floor (at 700), the masthead's place line. See the rule below.

### Named Rules

**The Serif Names Things Rule.** Georgia is for proper nouns and the names of places: room titles, people, signs. Anything a visitor reads in quantity — bios, fees, process steps, articles — is system sans. A serif paragraph in a fee table is a mistake, not a flourish.

**The Eyebrow Budget Rule.** Uppercase 12px tracked labels name a term, a group or a destination — a definition-list term, a fee row group, a footer list, a menu floor — and carry real information every time. They never sit above a title to restate it: a decorative "THERAPY HOUSE" eyebrow above a modal title is scaffolding — it repeats what the visitor already knows and reads as generated. Where a screen already carries a row of them (the menu), nothing else on it adds another for style. Prefer no eyebrow to a redundant one.

**The 65–75ch Rule.** No prose measure exceeds `71ch` regardless of panel or page width. Wide layouts get a constrained text column, not full-bleed paragraphs; a card that spans the page gives its copy the same measure.

**The Three Small Steps Rule.** Below body there are exactly three sizes — secondary, meta, label — and they are tokens, never `em`. An `em` size makes the same role compute differently depending on what it happens to sit inside, which is how one project arrived at thirteen values (0.8 / 0.82 / 0.85 / 0.9 / 0.92 / 0.94 / 0.95 / 0.97…) for three jobs, two of them landing under 13px on a phone. If a new piece of small text does not fit one of the three, it is not a new size; it is the wrong role.

**The Leading Follows The Measure Rule.** 1.55 is for prose at ~68ch, where the eye has a long way back. Card copy at ~35ch takes 1.45, and a two-line chip takes 1.3. One ratio applied everywhere sets narrow columns too loose and reads as a stack of unrelated lines.

**The Lining Figures Rule.** The display face defaults to old-style figures, which drop the 3, 4, 7 and 9 below the baseline. Anywhere the site publishes a number a visitor is comparing — a fee, a phone number, a year, a session length — set `font-variant-numeric: lining-nums tabular-nums`. A ragged baseline is the one thing a column of prices must not have.

**No Grayscale Smoothing.** `-webkit-font-smoothing: antialiased` thins dark-on-cream text on macOS by trading subpixel rendering for grayscale. It is a preference dressed as a polish step, and it costs exactly the visitor who is already squinting. Not used.

## Layout

**The house** has no layout in the page sense. The stage is the full viewport; in-scene UI is positioned in the illustration's own pixel coordinates (`data-x` / `data-y` against the room image), never against the viewport. It changes at 720px (compact panels), at 820px in portrait (a prompt to turn the phone sideways), and at 520px tall in landscape.

**Plain pages** are one wide page with a narrow reading column inside it.

- **Width.** Content sits in a wrap of `min(92rem, 100% - gutter)`, with the gutter growing from 1.5rem to 7rem with the viewport. The masthead, the hero and every heading below them share one left edge (the page inset).
- **Measure.** Prose is capped at `71ch`. On a page whose other sections span the full wrap, the reading column holds the same left edge rather than centring; one left edge per page.
- **Rhythm.** Two intervals, and the contrast between them is the grouping: `section` spacing (`3.25rem → 5.5rem`) between two different questions, `2xl` (40px) between two parts of one answer. Within blocks the steps are 6 / 10 / 14 / 18 / 24px.
- **Page head.** A page without a hero gives the masthead its own band, then opens on its title 40px below it, capped at the measure. A hub page opens on its room instead (see the hero, below).
- **Grids.** People cards fill columns of at least `26rem`; each card lays itself out from its own width with container queries (at 26rem the portrait moves beside the name; at 30rem the fact terms form a column), never from the viewport. A side column joins the reading column at 64rem.
- **Breakpoints.** 44rem: the phone layout — the masthead keeps only the wordmark, the two actions move to a bar fixed at the bottom, and the footer reserves 92px for it. 52rem: the menu becomes a single sideways-scrolling row. 64rem: the hero and two-column bands go side by side. 90rem: the menu becomes the lift, fixed in the right margin, and the content keeps a 15.5rem gutter clear for it.
- **Targets.** Every control is at least 44px tall (48px in the phone bar). A link that is the whole of its container grows its hit area to 44px with a pseudo-element rather than padding, so the visible rhythm does not change.

## Elevation & Depth

Layered, and genuinely three-dimensional rather than shadowed-flat. Objects in this system claim real space: signs are `perspective()`-transformed against the room's coordinate grid, team cards rotate on a 1400px perspective deck, and three parallax layers separate on pointer movement. Depth is illustrative, not decorative — it exists so that overlay UI reads as furniture standing in a room rather than a card sitting on a page. Plain pages are flatter: cards stand barely off the ground, and only the things that float over the page — the action bar, the hero's door, the map — carry the house's object shadow.

Two materials do the work: a **warm drop shadow** (always brown-black, never neutral) and an **inset top highlight** (`inset 0 1px 0 rgba(255,255,255,0.5–0.86)`) that gives every surface a lit top edge, as if the light source is above and in front. That highlight is the single most identity-carrying detail in the CSS and it belongs on every raised object.

### Shadow Vocabulary
- **Lit edge** (`inset 0 1px 0 rgba(255, 255, 255, 0.86)`): The top highlight as a single token, for every raised surface on a plain page.
- **Card** (`0 1px 2px rgba(43, 33, 24, 0.06), 0 1px 3px rgba(43, 33, 24, 0.04)`): Cards and person cards on plain pages. Just enough to stand a white card on warm white.
- **Object rest** (`0 16px 36px rgba(48, 25, 8, 0.18)`): Signs and small floating objects; on plain pages, the floating action bar and the hero's door pill.
- **Object active** (`0 18px 42px rgba(48, 25, 8, 0.23)`, plus `0 0 28px rgba(255, 234, 172, 0.26)`): Hover and focus. Note the second layer — a gold bloom, not a darker shadow. Things get *warmer* when you reach for them, not heavier.
- **Panel** (`0 30px 72px rgba(25, 13, 5, 0.3)`): Modals and the active team card. The one heavy shadow in the system; the library shelf's stage takes it at 0.18.
- **Tile** (`0 10px 22px rgba(60, 35, 12, 0.08)`): Content sub-blocks inside a panel. Barely there; it separates without stacking.
- **Lift** (`0 10px 24px rgba(45, 25, 9, 0.15)` / `0 12px 26px rgba(38, 22, 8, 0.16)`): Hotspot labels, the carousel nav cluster, the house exit, the shelf's step buttons.
- **Bar** (`0 -6px 20px rgba(48, 25, 8, 0.1)`): The phone action bar, thrown upward — the bar stands in front of the page rather than being printed on it.

### Named Rules

**The Warm Shadow Rule.** Every shadow is brown-black (`rgba(48,25,8,…)` family). A neutral or blue-grey shadow instantly makes the scene feel lit by a screen instead of by a lamp. Prohibited.

**The Lit Edge Rule.** Any raised surface gets the inset white top highlight. Without it, translucent panels read as smudges and a cream card on a cream page reads as a tint rather than as an object.

**The Glass Drift Rule.** Glass over illustration is for objects; anything with more than a sentence of text stands on a solid, opaque surface. Signs, hotspot labels and the house exit keep their `backdrop-filter` blur, because the room stays visible behind them and nothing is being read at length. Every content surface on a plain page — cards, fact tiles, notices, the closing card, the floating action bar — is an opaque paper-white or cream fill, and that is the settled doctrine. A title that overlaps an illustration gets a soft white scrim behind it, not a glass panel. The house's own modal bodies, contact tiles and team cards still sit on `rgba(255,255,255,0.06–0.2)` fills over the room; they are the remaining drift, not a precedent, and new translucent content surfaces are prohibited.

## Shapes

Soft everywhere, and graded by size. Every control is a full pill (`999px`), circular close buttons included. Cards and person cards take 18px; tiles inside them, portraits and the map plate take 16px; large pictures — the hero's room, the map, the shelf's stage, the house's panels and team cards — take 24px. Notices, article images and the focus ring's corners take 6px. Step numbers, list bullets and status dots are circles. Nothing that floats has a corner sharper than 6px; only an element that runs edge to edge of the viewport — the phone action bar, a full-bleed hero room, the map plate on a phone — goes square.

Borders are hairlines: 1px Line around a plain-page surface, 1px Line Soft between rows inside one, and a 1px light edge (`rgba(255,255,255,0.56–0.66)`) on the house's glass. A dark rule never outlines anything.

## Components

### Buttons
- **Shape:** Fully rounded pill (`999px`), 44px minimum height, 24px horizontal padding, 2px border.
- **Primary:** Hedge green fill, cream text (`#fffdf7`), secondary-size sans at 700, sentence case, no underline. Booking and calling are **both** primary, side by side with a 14px gap and stacked full-width below 420px; the labels tell them apart, and neither is rendered alone.
- **Secondary:** Paper-white fill with a 2px hedge green outline and hedge green text. For actions beside a primary that are genuinely lesser — opening a book's detail, playing a video — never for the call button.
- **Hover / Focus:** Primary deepens to Hedge Green Deep; secondary takes a cream fill and deep green text. Every control takes a 3px `#005fcc` outline at 2px offset.
- **House CTAs:** The contact modal's pair predates this: 13px, 800 weight, underlined, with a dashed-edge secondary, and it turns near-white on hover. Both are drift from the plain-page buttons above, not variants to copy.
- **Quiet (house):** Near-white fill, deep green text, no heavy border. In-content links to booking portals, external articles, source pages.
- **Close buttons (house):** 42px circle (38px in the carousel), translucent white, top-right at 16px inset.

### Navigation
- **Masthead:** The wordmark in hedge green Georgia, with the place line ("The Gap, Brisbane") as a label beneath it, and the two actions as quiet bold links on the right — underlined on hover, not at rest, because at rest they are furniture. Below 44rem it is the wordmark alone, in a 44px target.
- **The lift (menu):** Below 90rem, a paper-white bar under the masthead with a hairline beneath; its floors are uppercase labels in Ink Soft, 44px tall, turning hedge green on hover and on the current page (which is also set at 800). Below 52rem the row scrolls sideways and fades out at its right edge rather than wrapping. At 90rem and above it becomes a lift shaft fixed in the right margin: labels right-aligned beside a ruled shaft, a small tick per floor, and an illustrated lift car that travels to the floor under the pointer and can be dragged. The car carries a lamp glow, which brightens while the lift is in use.
- **Footer:** Paper white over a hairline, with the garden border (capped at 48rem) standing on its top rule. A compact colophon, not a second page: the clinic's address, phone, email and fax in one column, then the whole site map — Pages, Therapy and assessments, Regional Queensland — under label headings, in one row at 90rem and stacked below it. Links sit in 26px rows at 14px with no underline at rest (underline on hover and focus; 44px rows on a phone), the service list flows down its columns so a wrapped name never opens a hole, and the current page is named in hedge green rather than linked away from. The staff handbook sits alone on a last line under a soft rule.

### Action bar (signature component)
The two actions, kept within reach at every scroll position. Above 44rem it is a paper-white tray floating in the bottom-right corner — pill-shaped, hairline-bordered, lit edge and object shadow — holding the same two primary buttons, and it tucks itself away (fade and 12px drop) whenever the masthead's or the closing card's pair is on screen, so the page never shows the actions twice at once. At 90rem it stands in the lift's margin, stacked, at 24px radius. Below 44rem it is a full-width bar fixed to the bottom, square-cornered, with a hairline top and the upward bar shadow; the two buttons take equal widths at 48px tall and wrap their labels rather than shrinking them.

### Hero (signature component)
The room as a door. A hub page opens on a picture of its room beside (or above) the page title: Display-size title with a 2px chestnut rule under it, a lede in Ink Soft, and the room at 24px radius, multiplied into the paper-to-cream ground so it has no pale rectangle behind it. A white pill on the picture ("Explore the house") is the door: paper-white, Ink Soft label, object shadow; on hover or focus it turns hedge green, rises 2px, underlines, and the room behind it takes an amber glow. The page opens on a large first frame; the first scroll settles it to title-left, room-right in one 900ms move (`cubic-bezier(0.3, 0.7, 0.2, 1)`). Under reduced motion it starts settled and never moves. The home page uses the larger Hero size; a stacked variant runs the room edge to edge.

### Cards / Containers
- **Corner style:** 18px on cards; 24px on the house's panels and team cards, 16px on content tiles inside them.
- **Background (plain pages):** Solid. Paper white for cards and person cards; Lamplit Cream for the closing card and anything that should read as set into the page.
- **Background (house):** Layered — a radial white highlight at the top-left corner, a 145° warm gradient, then a translucent base. See The Glass Drift Rule.
- **Shadow strategy:** Card shadow plus lit edge on plain pages; panel shadow for a house container, tile shadow for blocks inside it. Never nest a panel shadow inside a panel shadow.
- **Border:** 1px Line on plain pages; 1px `rgba(255,255,255,0.56–0.66)` in the house — a light edge, never a dark rule.
- **Internal padding:** 24px on plain cards; `clamp(28px, 4.2vw, 46px)` on house panels, 12–16px on tiles.
- **Closing card:** The last block before the footer on every plain page: cream, centred, the telephone illustration above a "Talk to us" heading and the two actions. The one block that steps out of the left edge, because it is asking rather than telling.

### Person card
Credibility, carried by a face. A paper-white card with the square portrait (16px radius) beside the name, role in Ink Soft and credentials in bold lining figures; then an availability chip, a fact tile and the summary at a 62ch measure. Hovering the card underlines the name and wipes the portrait from the photograph to its illustrated version on a 760ms diagonal mask. The home page uses a smaller form — portrait, name, role, credentials and a one-line status marked by a dot (filled hedge green for accepting, a chestnut ring for a waitlist).

### Fact tiles and detail lists
Definition lists for factual content. On plain pages: a cream tile with a Line Soft hairline, 16px radius and the lit edge, label-style terms in Ink Soft and plain values, the terms forming a 6.5rem column once the tile is wide enough. The contact page's details are the same list without the tile — rows divided by Line Soft hairlines. In the house: the detail tile, a 78px label column, uppercase 12px term, 15px value, 16px radius. This is the pattern for any dense factual content; it is the alternative to a card grid, and it should be reached for first.

### Status chips
A pill in Meta at 700: cream with a hairline and Ink Soft text by default, Sage Wash with a hedge green border and deep green text when a practitioner is accepting new clients. Draft markers on service, town and article pages use the same pill in Secondary with hedge green text.

### Lists and fee tables
- **Service list:** No cards. Each service is its name as a Subhead-size link with one sentence under it, capped at the measure.
- **Tick list:** A small chestnut dot per item. **Step list:** a 2rem hedge green disc with a cream lining-figure number.
- **Fee tables:** Full width up to 46rem, rows divided by Line hairlines. Amounts are right-aligned in Georgia at Subhead size, hedge green, in lining tabular figures (Card Title size below 52rem); column heads above them are Secondary in Ink Soft. Anything that is not a comparable figure — an add-on, an adjustment — goes in its own row group under a label, so it never joins the column of numbers. Wide tables scroll inside themselves rather than pushing the page sideways.
- **Notices:** A crisis line or a caveat sits in a cream block with a hairline and 6px radius, at the measure.

### Location map
The illustrated street map as a link: 24px radius, a Line hairline ring and a warm object shadow. A cream plate in the lower-left carries the address in Card Title serif and an "Open in Google Maps" line in leaf link. On hover the map rises 2px and takes an amber bloom; on a phone the plate drops below the map and goes square.

### Scene signs (signature component)
The system's defining object. A small serif-labelled panel positioned in the illustration's own pixel coordinate space (`data-x` / `data-y` against the room image, not the viewport), then transformed with per-sign perspective, rotation, skew and scale so it sits *in* the scene at the angle of the surface it rests on — a table, a wall, a door. 18px radius, 1px white border, a 5px inset second border, translucent warm fill, backdrop blur, and the standard warm shadow. On hover the fill brightens, the gold bloom appears, and the label underlines at 2px.

They are quiet until needed by design: at rest they read as objects in the room; on hover and focus they become unmistakably clickable. That restraint is only affordable because the exterior turntable teaches the interaction first, via the pulsing gold door glow.

### Hotspots
Invisible until approached. An exterior hotspot is a transparent hit area with a radial gold glow that fades in over 160ms on hover or focus, plus a cream pill label (12px, 800 weight) that rises 6px into place beneath it. The main door is the exception — it glows continuously on a 2.8s breathing loop with four floating sparkles, because it is the one affordance a first-time visitor must discover unprompted. The way back out is the hotspot label's own material — a cream pill fixed top-left, with the lit edge — which warms rather than darkens when reached for.

### Team carousel (signature component)
A 3D deck on a 1400px perspective: the active card sits forward at `translateZ(150px)`, neighbours fall back to `-180px`, rotate 32° and drop to 32% opacity, and everything else recedes to `-360px` at 62% scale. Motion is `520ms cubic-bezier(0.2, 0.72, 0.2, 1)` — a decisive ease-out with no bounce. Neighbouring cards are clickable, and the deck accepts swipe. Each card is a two-column split: portrait against name, role and bio.

### Modals
Three variants sharing one panel: philosophy (illustrated, centred, principle tiles in a two-column grid), content (generic, driven by `content-data.js`), contact (two-column with artwork). All open on a 260ms opacity fade over a dimmed warm scrim (`rgba(29,18,9,0.42)` with a soft radial warm light). All are `role="dialog"` with `aria-modal`, `inert` on the background, and focus restored to the trigger on close.

### Library shelf
The library's lit room, rendered in 3D inside a 24px-radius stage with the room tones as its ground. The controls around it are plain-page objects: paper-white pill step buttons with the lift shadow and lit edge, dot markers that turn hedge green for the current volume, and a solid paper-white detail panel with primary and secondary buttons.

## Do's and Don'ts

### Do:
- **Do** position in-scene UI against the illustration's own coordinate system, not the viewport. A sign that drifts off its table on resize breaks the entire premise.
- **Do** give every raised surface the inset white top highlight (`inset 0 1px 0 rgba(255,255,255,0.5–0.86)`) and a warm brown shadow from the vocabulary above.
- **Do** make things *warmer* on hover — the gold bloom (`0 0 28px rgba(255,234,172,0.26)`) — rather than darker or larger.
- **Do** keep the two CTAs, book and call, at equal weight and equally reachable. Neither is the fallback for the other; on plain pages they are the same filled button.
- **Do** carry both booking and phone affordances into any new room or page that could plausibly end a visit.
- **Do** cap prose at `71ch`, hold one left edge per page, and use the fact-tile or detail-list pattern for factual content.
- **Do** separate two questions with `section` spacing and two parts of one answer with 40px.
- **Do** keep every control at least 44px tall, and grow a standalone link's hit area rather than its type.
- **Do** pair every animation with a `prefers-reduced-motion` alternative — the parallax, firelight, dog-eye tracking, sparkles, cursor trail, lift and hero settle all already have one. New motion without one does not ship.
- **Do** keep the 3px `#005fcc` focus ring exactly as it is on every interactive element, including in-scene signs and invisible hotspots.

### Don't:
- **Don't** build the psychology-clinic template. No stock photos of smiling strangers, no teal-and-white, no sterile card grid, no "Our Services" accordion. The illustrated room replaces all of it.
- **Don't** build the corporate SaaS landing page. No gradient hero, no feature-card triptych, no testimonial carousel, no "Get started free". The only hero this site has is a picture of a room on the page's own paper ground.
- **Don't** build the slow, heavy tech demo. Every ambient sequence — the door transition video, the entrance animation, the carousel, the hero's settle — must be skippable and interruptible. Nothing ambient sits between a parent and a phone number.
- **Don't** put more than a sentence of text on a translucent panel. See The Glass Drift Rule: content surfaces get solid, opaque fills.
- **Don't** use grey body text anywhere. Warm-black (`#2b2118` / `#3a2612`), the warm Ink Soft and Ink Faint, or the ink green — never a neutral grey. It reads as washed out on cream and as unreadable over illustration.
- **Don't** use gold for decoration. If it glows, it is clickable.
- **Don't** add a tracked uppercase eyebrow above a title that already says the same thing. One "THERAPY HOUSE" over "Our Philosophy" inside the Therapy House site is telling the visitor nothing.
- **Don't** reach for a card grid. Identical icon-heading-text cards are the pattern this system exists to avoid; use detail tiles, a list, or the room itself.
- **Don't** render the call button as an outline beside a filled booking button. Outlined reads as "the fallback".
- **Don't** use `background-clip: text` gradients, `border-left` colour stripes wider than 1px, or neutral/cool-grey shadows. All three are prohibited outright.
- **Don't** neutralise the focus ring to fit the warm palette. Blue is correct precisely because it does not belong.
- **Don't** add a new font family. Georgia and system-ui, in the roles above; a third family is not a design decision here, it is a leak.
