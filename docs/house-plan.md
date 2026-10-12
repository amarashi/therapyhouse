# The house: plan for one source of truth, clearer rooms and a telehealth room

This plan covers the illustrated house at `/house/`: the full-screen experience a
visitor reaches through "Explore the house" on the home page and "Step inside"
on the hub pages. It was written on 2026-10-13 after a review of the code.

## What the review found

**How a visitor gets in.** The hero picture on a page (`src/components/HeroReveal.astro`)
links to `/house/`. The home page opens the exterior; the therapy, assessments,
group therapy, library, philosophy, team, contact and work-with-us hubs open
their own room (`?room=<id>`). `?from=<path>` is where "Back to the website" leads.

**How the rooms connect.** The exterior is a 61-frame turntable with seven
spots on it. Each spot opens one room. Inside, signs open pop-ups. Only two
signs lead from one room to another (consulting room to assessment room,
library to attic). Every "Back" sign leaves for the exterior, even from the
attic. Moving between rooms does not change the address, so the browser's Back
button leaves the house.

**Where the words came from.** Most of the house read its own copy of the
content (`public/assets/content/house-copy.json` and the team list in
`public/assets/scripts/site-data.js`), scraped from the WordPress site in May
2026. The plain pages have moved on since then: 17 therapy pages against the
house's 8 "offerings", 29 articles against 25, adult and telehealth pages the
house never mentions. Fees and prices were already shared (issue #80). The
welcome room's philosophy and contact pop-ups were written straight into
`src/pages/house.astro`, so the CMS could not reach them, and the CMS asked
staff to "change both the same way" in several places.

## Decisions

1. **The house previews; the plain pages explain.** Each pop-up shows a short
   preview (a sentence or two, a short list of names) and sends the visitor to
   the plain page that holds the full answer. The house never holds a second
   copy of a page.
2. **Telehealth gets a room**, with its own illustration in the same style as
   the other rooms.
3. **New room artwork is in scope.**

## Phases

Each phase is committed on its own.

### Phase A: one source of truth

`src/pages/house.astro` builds the house's content at build time from the
same collections the plain pages read (team, services, articles, pages,
clinic details) and writes it into the page as JSON, the way fees already
work. `content-data.js` reads that JSON. What stays in `house-copy.json` is
only wording that belongs to the house: a room's one-line preview and the
words on the "read more" links. The team carousel, the article list, the
philosophy and the contact pop-ups all come from what staff edit in the CMS.
The "change both the same way" notes go.

### Phase B: pop-ups that preview and lead on

Each kind of content gets a written preview layout instead of the generic
renderer that turned field names into headings. Every pop-up ends with a link
to the matching plain page, and with booking and calling given equal weight.

### Phase C: moving between rooms

- "Back" returns to the room you came from, and from a first room to the exterior.
- Each room has its own address (`?room=library`), so the browser's Back button
  steps back through rooms.
- A small rooms menu lets a visitor go to any room without going outside,
  including the assessment room, the attic and the telehealth room.

### Phase D: the telehealth room

A new room, `telehealth`, with its own illustration: a quiet corner of the
house set up for video sessions. Its signs preview how video sessions work,
Medicare, who you would see and how to book, each leading to `/telehealth/`.
It is reached from a sign in reception (now the welcome room, see "One
front room" below) and from the rooms menu. The
`/telehealth/` page itself gets no door into the house: PRODUCT.md keeps the
pages written for the telehealth audience plain and answer-first.

### Phase E: CMS

With the house reading the collections, the house section of the CMS shrinks
to the house's own wording. Lists inside a pop-up (articles, team, services)
grow and shrink with the collections; only signs, which sit on a picture, stay
fixed. `tests/pages-cms-config.test.mjs` keeps the config and the files in step.

### Phase F: documents

`HOTSPOT_CONTENT_MAP.md` and `CODEBASE.md` describe the site before Astro.
Bring them up to date, and add a test that fails if visitor-facing house text
is written into `house.astro` again.

### Phase G: smoother movement

Make moving through the house feel smooth and cheap to run: a cross-fade
between rooms instead of a cut, room pictures preloaded for the room you are
likely to visit next, parallax and sign movement driven by one animation frame
loop with eased values, no layout reads inside it, and everything respecting
`prefers-reduced-motion`.

## Status

All seven phases landed on the `feat/house-one-source` branch on 2026-10-13,
one commit each.

| Phase | What changed |
| --- | --- |
| A | `src/lib/house-content.js` builds every sign's preview from the plain pages' files; `house-copy.json` keeps only the house's own wording. The team carousel reads the team collection. |
| B | Pop-ups are short previews on solid cream, each with a link to its page and the booking and calling pair. |
| C | `?room=<id>` addresses, history entries for every move, a Back sign that steps back one room, and the Rooms menu. |
| D | The telehealth room (`public/assets/rooms/telehealth-room.webp`; master in `art-src/rooms-inside/`, untracked), reached from a sign in reception (now the welcome room) and from the menu. |
| E | The CMS House screen explains where its words come from; the unused `houseProgram` component is gone. |
| F | `CODEBASE.md`, `HOTSPOT_CONTENT_MAP.md`, `AGENTS.md` and `SITE_CONTENT.md` describe the site as it is; `tests/house-text-source.test.mjs` keeps typed text out of `house.astro`. |
| G | Room changes cross-fade after the next picture decodes; reachable rooms preload; no layout reads per pointer move; parallax easing is timed. |

## One front room

Added on 2026-10-13, after the phases above. The welcome room and reception
were two front rooms: the front door opened the welcome room, which said
"Welcome to Therapy House" and sent a visitor on to reception, which said
"Welcome" again. A parent who wanted to book walked through two rooms to do
it, against "never make a worried parent wait" in PRODUCT.md. Reception has
joined the welcome room, which kept its picture.

| What | Now |
| --- | --- |
| Welcome room signs | About Us (team carousel), Our Philosophy (up to the attic), Book or call (the contact pop-up), Find us (address and parking), See us by video (the telehealth room), Back. |
| The philosophy pop-up | Gone; the attic holds the philosophy, so it is written in one place. |
| The mailbox outside, the `/contact/` hero, the Rooms menu | Lead to the welcome room. An old `?room=contact` address does too (`formerRoomIds` in `content-data.js`). |
| `reception-room.webp` | Off the site; a copy is in `art-src/rooms-inside/` (untracked). |
| The notebook in the welcome room | It said "Contact Us" over a phone number that was not the clinic's. The number is painted out of `inside-layer-3.webp`, so the notebook says only "Contact Us"; the "Book or call" sign on it gives the real one. The layer as it was is in `art-src/rooms-inside/` (untracked). |

Still open:

- The `/contact/` hero still shows the reception cutaway picture
  (`reception-room-out*.webp`), and it now opens the welcome room. A cutaway
  of the welcome room would make the picture match the room it opens.

- The new room's master image is local only, like the other masters in `art-src/`.
- Removing a sign in the CMS stops the build (a missing id throws), so the live site keeps its last good version and a deploy alert goes out. A friendlier guard would need Pages CMS to fix each room's list of signs.
