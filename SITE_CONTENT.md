# Therapy House — Site Content Inventory

Every page the new site will have, what goes on each one, where that content
comes from today, and what is still missing.

This is the **human sign-off document** — the thing to send the clinic to review.
The copy itself lives in `public/assets/scripts/content-data.js` (the house and
the original plain pages) and in the Markdown files under `src/content/` (one
file per page, service page, practitioner and article); this file describes the
*pages*.

Three audiences are served (see [PRODUCT.md](PRODUCT.md)): local families, the
Telehealth Audience (people anywhere in Australia, regional Queensland first,
seeing a psychologist by video), and adults seeking help for themselves.

Related: [PRODUCT.md](PRODUCT.md) (who/why) · [DESIGN.md](DESIGN.md) (visual system) ·
[HOTSPOT_CONTENT_MAP.md](HOTSPOT_CONTENT_MAP.md) (which hotspot opens which content).

---

## Status legend

| Mark | Meaning |
|---|---|
| ✅ | Copy exists in `content-data.js` and is usable as-is |
| ✏️ | Structure known, copy is thin or a placeholder — needs writing |
| ❓ | Needs the clinic to supply facts we do not have |
| ⚖️ | Legal/compliance content — must be carried over verbatim, not rewritten |

---

## How the two experiences share these pages

Every page below is **one URL with one set of content**. The house is not a
separate site — it is a presentation layer mounted over the same pages.

- `/` ships the plain homepage in the HTML document. On a capable device the
  house island mounts over it; exiting the house reveals the page underneath.
  One canonical URL, nothing duplicated, nothing hidden from search engines.
- Each interior room corresponds to exactly one page. The room's hotspots open
  the same content that appears as sections on that page.
- Phones, `prefers-reduced-motion`, and slow connections get the page directly;
  the house stays available behind an explicit tap.

---

## Page inventory

| URL | Room | Page title | Content source | Status |
|---|---|---|---|---|
| `/` | Exterior turntable | Therapy House — Help that doesn't feel like help | `rooms.welcome`, `philosophy` | ✅ |
| `/therapy/` | Consulting Room | Therapy (the hub for every therapy page; `/services/` forwards here) | `services`, `src/content/services/` | ✅ |
| `/assessments/` | Assessment Room | Assessments | `assessments` | ✅ |
| `/group-therapy/` | Group Room | Group Therapy & Programs | `groups` | ✅ |
| `/team/` | Team Parlour | Our Team | `team` | ✅ |
| `/team/<slug>/` | — (carousel card) | Individual practitioner ×12 (list awaiting the clinic's confirmation, see `/team/` below) | `src/content/team/` | ✏️ ❓ |
| `/library/` | Library | Library — articles, books, videos | `library` | ✅ |
| `/library/<slug>/` | — (blog hotspot) | Individual article ×25 (issue #39) | `src/content/articles/` | ✅ |
| `/contact/` | Reception | Contact & Booking | `contact` | ✅ |
| `/work-with-us/` | Work With Us | Work With Us | `workWithUs` | ✏️ |
| `/philosophy/` | — (modal today) | Our Philosophy | `philosophy` | ✅ |
| `/privacy-policy/` | — | Privacy Policy (built in #42, linked in the footer) | `src/content/pages/privacy-policy.md` | ⚖️ ❓ |

**Totals:** 10 content pages + 12 practitioner pages + 25 articles, plus the
SEO launch pages below. The Current Site's `/feedback/` page is not rebuilt:
it forwards to `/contact/` (see the `/feedback/` section below).

### SEO launch pages (issues #5 to #30)

Added for the SEO launch (GitHub milestone "SEO launch"). Every one of these is
a **plain page, not a room**: no house door, no hero animation, the answer
first. Therapy and assessment pages are Markdown files in `src/content/services/`
(the file name is the address, unless the file gives its own `path`); Town
Pages are in `src/content/towns/`.

Every page from #5 to #30 has now been built and merged. The "Status on main"
column was checked against `main` on 11 October 2026 (after PR #91), by
building both the Preview and the production site. It uses three states:

- **Live** — built in the production build, so it goes live at launch. Some
  live pages still have an open issue for facts the clinic has not confirmed;
  until then the page uses only the clinic's published wording or tells the
  visitor to ask reception.
- **Draft** — built on the Preview (`https://amarashi.github.io/therapyhouse/`)
  for review, but marked `draft: true`, so the production build leaves it out.
  It goes live when the clinic answers the open questions on its issue and the
  draft flag is removed. While a draft is not built, any Current Site address
  that points at it is a temporary 302 redirect to a stand-in page (see the
  redirect map below).
- **Not built** — no page yet. None of the pages from #5 to #30 is in this
  state today.

| URL | Page | Issue | Status on main | Waiting on the clinic for |
|---|---|---|---|---|
| `/adults/` | Adult therapy hub (includes ADHD therapy for adults) | #5 | Draft | Sign-off of `docs/team-specialisms-review.md` (which clinicians see adults) |
| `/children/` | Child and adolescent psychology hub (includes ADHD therapy for children) | #6 | Draft | Sign-off of the review file; the ages the clinic sees |
| `/therapy/trauma/` | Trauma and EMDR | #7 | Draft | Sign-off of the review file; whether EMDR is offered by video |
| `/therapy/anxiety/` | Anxiety and OCD | #8 | Draft | Sign-off of the review file; who treats OCD |
| `/therapy/depression/` | Depression | #9 | Draft | Sign-off of the review file |
| `/therapy/grief/` | Grief | #10 | Draft | Sign-off of the review file |
| `/therapy/couples/` | Couples and relationship therapy (replaces the Current Site's `/relationship/`) | #11 | Draft | Sign-off of the review file; session length |
| `/therapy/approaches/` | How we work: therapy approaches | #12 | Draft | Which clinicians use each approach; whether schema therapy is offered |
| `/ndis/` | NDIS psychology, at the Current Site's own address | #13 | Draft | Plan types accepted; whether the clinic is a registered NDIS provider; what it provides |
| `/group-therapy/circle-of-security-parenting-program/` | Circle of Security parenting program, at its existing address | #14 | Live (issue open) | Next dates, current cost, facilitator, format, Medicare item |
| `/group-therapy/` | Group therapy page, reworded for searches (existing page) | #15 | Live (issue closed) | Nothing |
| `/therapy/family/` | Family therapy | #16 | Draft | Sign-off of the review file; which clinicians do family therapy |
| `/assessments/adult-adhd/` | Adult ADHD assessment | #17 | Draft | Fee or starting price; wait time; who assesses adults; whether video is possible |
| `/assessments/adult-autism/` | Adult autism assessment | #18 | Draft | Fee or starting price; wait time; who assesses adults; whether video is possible |
| `/assessments/child-adhd/` | Child ADHD assessment | #19 | Draft | Sign-off of the review file; wait time; who assesses children |
| `/assessments/child-autism/` | Child autism assessment | #20 | Draft | Sign-off of the review file; wait time; who assesses children |
| `/assessments/learning/` | Learning assessment (dyslexia, dysgraphia, dyscalculia) | #21 | Draft | Whether dyscalculia is assessed; sign-off of the review file |
| `/assessments/cognitive/` | Cognitive and giftedness assessment | #22 | Draft | The school readiness wording; the ages assessed |
| `/telehealth/` | Telehealth (the Telehealth Room): seeing a psychologist by video | #25 | Live (issue open) | Which clinicians offer video and for which ages; whether video fees equal in-room fees; the video platform |
| `/telehealth/toowoomba/` | Town Page: Toowoomba | #26 | Live (issue open) | Optional: clinicians who already see clients there; the shared #25 questions |
| `/telehealth/townsville/` | Town Page: Townsville | #27 | Live (issue open) | As for Toowoomba |
| `/telehealth/cairns/` | Town Page: Cairns | #28 | Live (issue open) | As for Toowoomba |
| `/telehealth/rockhampton/` | Town Page: Rockhampton | #29 | Live (issue open) | As for Toowoomba |
| `/fees/` | Fees and Medicare rebates | #30 | Live (issue open) | Confirm each published fee (then set `lastReviewed`); video fees; cancellation policy; NDIS rate; Medicare billing; adult assessment fees |

"The review file" is `docs/team-specialisms-review.md`, which says which
clinician does what. Each issue's last comment lists its open questions in
full. Mackay, Bundaberg, Gladstone and Mount Isa are sections of
`/telehealth/`, not Town Pages; each becomes a Town Page once it has three
sourced local facts.

Issue #23 is the pull request that built the services collection, and #24 is a
build bug, so neither adds a page. A Town Page never says or implies the clinic
has an office in that town.

---

## Global elements

Present on every page.

**Header** — Therapy House mark, primary nav (Therapy, Assessments, Group
Therapy, Team, Library, Contact), and a "Step inside the house" link.

**Footer** — contact block, booking link, address with map link, privacy policy,
acknowledgement of country ❓, AHPRA registration line ❓.

**The two CTAs.** Per PRODUCT.md these carry *equal* weight and neither is a
fallback for the other:

- Book online — `https://my.powerdiary.com/clientportal/3cjz0`
- Call reception — `07 3300 2170` / `tel:+61733002170`

**Contact facts** (used in footer, contact page, and JSON-LD):

| Field | Value |
|---|---|
| Phone | 07 3300 2170 |
| Fax | 07 3319 4640 |
| Email | admin@therapyhouse.com.au |
| Address | 1290 Waterworks Rd, The Gap, Brisbane, QLD 4061 |
| Booking | Power Diary client portal |
| Opening hours | ❓ not captured anywhere |

---

## Page detail

### `/` — Home

The exterior turntable is the site map. Beneath/behind it, the plain page:

1. **Hero** — "Therapy House is a place for all children, and anyone who has once been a child." ✅
2. **Intro** — boutique psychology clinic, leafy Brisbane suburb, designed to feel at home ✅
3. **What we do** — three routes: Therapy → `/therapy/`, Assessments → `/assessments/`, Groups → `/group-therapy/` ✅
4. **The team** — 4–6 practitioner faces + "Meet the whole team" ✅ *(carries the credibility load — see PRODUCT.md)*
5. **Philosophy** — 5 principles, condensed ✅
6. **Practical** — address, parking, phone, booking ✅

Source: `rooms.welcome.intro`, `philosophy`, `team.members`, `contact`

---

### `/therapy/` — Therapy (was `/services/`, Services & Fees)

Since issue #4 the Services floor is the Therapy hub at `/therapy/`, and
`/services/` forwards there. It lists every therapy page from
`src/content/services/`. The fee table moved to `/fees/` (#30), and `/therapy/`
now points there. The fee and rebate detail below describes what `/fees/` carries.


| Section | Content | Status |
|---|---|---|
| Intro | "High quality evidence based services" | ✅ |
| Service offerings | 8 items (ADHD/Autism assessment, cognitive, memory, learning disabilities, child therapy, family, couples, adult psychodynamic) | ✅ |
| Therapy models | 5 (CBT, ACT, EFT, EMDR, short-term psychodynamic) | ✅ |
| Fees | 7 rows, $260–$350 range + $10 evening fee + assessment packages $1,200–$3,000 | ✅ ❓ |
| Rebates | Medicare via GP + Mental Health Care Plan; not for couples/family; private health cannot be combined | ✅ |
| Reports & letters | Charged hourly, 30–60 min typical | ✅ |
| → Assessments | Link through | ✅ |

❓ The fee list quotes named practitioners at specific prices ($290 Dr Beinke,
$270 Dr Shay). These need a confirmed review date — a wrong price on a psychology
site is worse than no price. Recommend a `lastReviewed` field and a visible "Fees
current as of …" line.

⚖️ The assessment package range here ($1,200–$3,000) does not match the itemised
packages on `/assessments/` ($846–$2,400). One of them is out of date.

---

### `/assessments/` — Assessments

| Section | Content | Status |
|---|---|---|
| Intro | 3 paragraphs; provisional psychologists do assessments, all reports signed off by a fully registered psychologist | ✅ |
| The process | 8 numbered steps: call → email → intake → forms → booking → up to 4 weeks → feedback session | ✅ |
| What to bring | 6 documents (referral, school reports, NAPLAN, prior reports, intervention docs, prior diagnoses) | ✅ |
| Packages | 4 priced packages | ✅ |
| School observations | $250 + travel | ✅ |
| FAQ | 4 answers | ✅ |

Packages, in full:

| Package | Price | Provisional |
|---|---|---|
| Comprehensive psycho-educational | from $2,400 | from $1,900 |
| Cognitive | from $1,621 | from $1,366 |
| ADHD | from $1,000 | from $846 |
| Autism | from $1,000 | from $846 |

This is the highest-intent page on the site — a parent comparing clinics on
assessment cost and wait time lands here. It deserves the most careful plain-page
treatment of anything we build.

---

### `/group-therapy/` — Group Therapy & Programs

| Section | Content | Status |
|---|---|---|
| Overview | 3 paragraphs — affordable, peer support, age-matched | ✅ |
| Emotion Regulation & Social Skills | ages 7–12 | ✅ |
| Hunter and His Amazing Remote Control | ages 6–10, 8 sessions | ✅ |
| Navigating Social Relationships | ages 12–15, PEERS framework, 8 weeks | ✅ |
| Lego Club | ages 6–12, 8 weeks | ✅ |
| Circle of Security Parenting | 8 × 90min, 3–6 people, $125/session, $1,000 total | ✅ |
| Workshop expression of interest | 5 topics + enquiry form | ✏️ |

❓ No current intake dates or next-session-starts anywhere. Group programs are
useless to a parent without "when does the next one run". Needs either dates or
an honest "register interest and we'll tell you".

---

### `/team/` — Our Team

The load-bearing page for credibility.

| Section | Content | Status |
|---|---|---|
| Intro | none exists — needs writing | ✏️ |
| Practitioner grid | 10 people + 2 therapy dogs, with photo, role, credentials, one-line summary | ✅ |
| Availability | 8 practitioners with live accepting/waitlist/on-leave status | ✅ |
| Therapy dogs | Reea (current), Samson (retired) | ✅ |

Roster: Dr Amelia Shay (Director, Developmental Psychologist) · Dr Kaya Beinke
(Clinical Psychologist, CCO) · Letitia McVey (Educational & Developmental
Registrar, COO) · Sahar Fattahi (Psychologist) · Rani Banks (Clinical
Psychologist) · Jazmin Squire (Psychologist) · Laura Storey (Counsellor) ·
Genevieve Hussey (Provisional Psychologist) · Natasha (Client Support &
Marketing) · Josie (Administrative Support) · Reea & Samson (therapy dogs).

❓ **This list is awaiting the clinic's confirmation (register row R-30, launch
runbook issue #45).** It was written against an older roster and does not
match the Current Site's staff pages:

- On the Current Site but not in the Rebuild: **Ace** (`/staff-member/ace/`),
  **An Yang**, Provisional Psychologist
  (`/staff-member/an-yang-provisional-psychologist/`), and **Brooke**, Client
  Support & Marketing (`/staff-member/brooke-client-support-marketing/`).
- In the Rebuild but no longer on the Current Site's staff list: **Josie** and
  **Reea**.
- Natasha's Current Site address is `/staff-member/natasha-senior-client-support/`
  (her title there is Senior Client Support), not the
  `natasha-client-support-marketing` this file used to give.

Until the clinic confirms who is current, no one is added or removed; the
practitioner pages and every "who you would see" list stay as they are.

❓ **Two gaps that directly block the credibility goal:**

1. No AHPRA registration numbers for any practitioner. These are public,
   expected on a psychology site, and are the single cheapest credibility signal
   available.
2. Bios are one-line summaries derived from the old site. Real bios — training,
   who they like working with, what a first session is like — are what convert a
   worried parent. Several are placeholders ("Rani is listed as accepting new
   clients on the current team page").

❓ Availability statuses go stale fast. Needs an owner and a review cadence, or
they become a liability.

**Multilingual services** are currently buried inside individual summaries —
Persian (Farsi) via Dr Shay and Sahar Fattahi, Filipino (Tagalog) via Sahar
Fattahi. This deserves surfacing as a real feature; it is a genuine
differentiator in Brisbane and nothing else on the site mentions it.

---

### `/team/<slug>/` — Individual practitioner pages

One per person (12 pages today; the count follows the clinic's answer on the
roster above). Photo, full name, role, credentials, AHPRA number ❓,
languages, bio ✏️, who they work with ✏️, availability ✅, book/call CTAs ✅.

These replace the 14 existing `/staff-member/…/` WordPress URLs and inherit their
search ranking. Person-level JSON-LD goes here.

---

### `/library/` — Library

| Section | Content | Status |
|---|---|---|
| Articles | 25 posts, each with its own page at `/library/<slug>/` (issue #39) | ✅ |
| Books | *The Little Koala* (children's story, fear/separation anxiety, illustrated by Nafiseh Ebrahiminejad); *What Is Going On In My Head* (68pp, 28×21cm, lay-flat, $120, for therapists, CBT/ACT across 3 phases) | ✅ covers, interior spreads, Square checkout and email-to-order all recovered |
| Videos | 9 published: a note on happiness · welcome from Dr Amelia · Lockdown Challenge ×3 · magic in stories ×2 · 2 Persian (bilingual children, English-learning) | ✅ real YouTube ids, thumbnails and embeds |
| Publications | Dr Amelia Shay — book chapters, journal articles, conference presentations, Persian-language works | ❓ description only, no actual list |
| Media | 4 appearances (shared reading, classroom diversity, children starting school anxious, radio interviews) | ❓ headlines only, no outlets/dates/links |

⚠️ PRODUCT.md names media appearances and publications as the **only proof assets
currently available**. They are also the thinnest content on the site — four
headlines with no source, no date, no link. Turning these into cited, linked,
dated items is probably the highest-value content work available, ahead of
anything visual.

The scrape has more than the page currently uses, and it is all recoverable
from `archive/live-site-scrape/html/`:

- **Media** — six appearances, not four, each with an outlet and a working link:
  three at The Conversation, two Hope 103.2 *Open House* interviews with Stephen
  O'Doherty, one Radio Adelaide. Press screenshots exist too.
- **Publications** — the real citation list for four practitioners (Dr Amelia
  Shay, Dr Kaya Beinke, Dr Joyce Vromen, Dr Lisa Wittenhagen), roughly forty
  entries with DOIs and publisher links, currently reduced to one sentence.

**Clinic to decide — videos.** Four Persian-language videos from Dr Amelia's
channel are deliberately not on the shelf: three on dating and one on women and
sexuality. They are hers and they are real, but they were not made for a parent
browsing a child-psychology library. A fifth, the Theory of Mind interview
(`ovUEyzBagPo`), was linked from the old videos page and has since been deleted
from YouTube — it is dropped rather than shipped as a dead embed. See the note
at the top of `src/data/library-shelf.js`.

---

### `/library/<slug>/` — Articles

**25 posts** on the Current Site (its sitemap lists 25; this file used to say
23 and missed the two newest). Issue #39 migrated every one into
`src/content/articles/` with its published text unchanged, its original date,
the author where the Current Site names one, `BlogPosting` structured data, and
in-body images in `public/assets/library/`. The house's library room still
reads the short list in `content-data.js`, which now links to these pages. The slug is the last part of
the Current Site address, and every old address forwards to the new one (see
`docs/redirects.md`).

| # | Date | Title | Current Site address | New slug |
|---|---|---|---|---|
| 1 | 2026-10-07 | Mindfulness and Journalling for Your Mental Wellbeing | `/blog/mindfulness-and-journalling/` | `mindfulness-and-journalling` |
| 2 | 2026-07-30 | Play Therapy: Therapy Made for Children, With Children’s Minds in Mind | `/therapy/play-therapy-therapy-made-for-children-with-childrens-minds-in-mind/` | `play-therapy-therapy-made-for-children-with-childrens-minds-in-mind` |
| 3 | 2025-10-14 | The Lasting Value of Long-Term Psychodynamic Therapy: Who It Helps and Why It Works | `/therapy/long-term-psychodynamic-therapy/` | `long-term-psychodynamic-therapy` |
| 4 | 2025-10-01 | Helping Kids Build Healthy Screen Time Habits: A Parent’s Guide | `/child-psychologists/screen-time/` | `screen-time` |
| 5 | 2025-08-05 | Practicing Self-Compassion to Manage Uncomfortable Emotions | `/therapy/practicing-self-compassion/` | `practicing-self-compassion` |
| 6 | 2025-06-10 | How To Have A Loving Relationship With Your Body | `/therapy/how-to-have-a-loving-relationship-with-your-body/` | `how-to-have-a-loving-relationship-with-your-body` |
| 7 | 2025-05-27 | 12 Practical Tips to Manage Depression from Behavioural Therapy Experts | `/therapy/practical-tips-to-manage-depression/` | `practical-tips-to-manage-depression` |
| 8 | 2025-05-22 | Holding Two Truths: The Power of Emotional Duality in Relationships | `/relationship/emotional-duality-in-relationships/` | `emotional-duality-in-relationships` |
| 9 | 2025-04-01 | Nurturing Healthy Self-Esteem in Children | `/child-psychologists/nurturing-healthy-self-esteem/` | `nurturing-healthy-self-esteem` |
| 10 | 2025-01-28 | Why We Procrastinate: Understanding the Psychology Behind It | `/therapy/procrastination/` | `procrastination` |
| 11 | 2024-12-03 | Understanding and Supporting School Readiness  | `/therapy/school-readiness/` | `school-readiness` |
| 12 | 2024-11-11 | Conflict | `/therapy/conflict/` | `conflict` |
| 13 | 2024-05-21 | Self Care | `/therapy/self-care/` | `self-care` |
| 14 | 2024-05-08 | Sense of Self | `/child-psychologists/sense-of-self/` | `sense-of-self` |
| 15 | 2024-04-02 | The Autonomic Nervous System and Mental Health: Strategies to Ease Anxiety, Depression and Trauma Response | `/therapy/autonomic-nervous-system/` | `autonomic-nervous-system` |
| 16 | 2024-03-12 | What is Depression? | `/therapy/what-is-depression/` | `what-is-depression` |
| 17 | 2024-02-13 | How Involved Should Parents Be In Their Child’s Therapy? | `/therapy/parent-involvement-in-child-therapy/` | `parent-involvement-in-child-therapy` |
| 18 | 2024-01-22 | What Is Therapy? | `/therapy/what-actually-is-therapy/` | `what-actually-is-therapy` |
| 19 | 2023-08-30 | Are You Learning At Your Full Potential? | `/assessments/is-your-child-learning-to-the-best-of-their-capacity/` | `is-your-child-learning-to-the-best-of-their-capacity` |
| 20 | 2023-06-28 | Do You Really Know What Anxiety Is? | `/workshops/self-regulation/do-you-really-know-what-anxiety-is/` | `do-you-really-know-what-anxiety-is` |
| 21 | 2023-05-05 | New Cancellation Policy | `/news/new-cancellation-policy/` | `new-cancellation-policy` |
| 22 | 2023-05-05 | Therapy is a Commitment | `/news/therapy-house-update/` | `therapy-house-update` |
| 23 | 2023-05-05 | What is ADHD? | `/assessments/what-is-adhd/` | `what-is-adhd` |
| 24 | 2023-03-20 | Different Parenting Approaches and How Successful They Are | `/workshops/circle-of-security-parenting-program/parenting-styles-parenting-tips/` | `parenting-styles-parenting-tips` |
| 25 | 2023-01-10 | Emotion Regulation Skills, Tips and Strategy | `/workshops/self-regulation/emotion-regulation-skills-strategy/` | `emotion-regulation-skills-strategy` |

The Current Site also answers at `/what-is-adhd/`, a second address for #23;
it forwards too.

**Clinic to curate:** tick which of these 25 still represent the clinic. Retired
ones get a 301 to `/library/`, never a 404. Note that #21 and #22 read as
operational notices rather than articles and may belong elsewhere — or nowhere.

**New explainer articles (issue #40, merged as drafts).** Four articles written for
searches the clinic does not answer today: how to get diagnosed with ADHD in
Australia, ADHD signs in adult women, ADHD versus autism, and CBT for separation
anxiety in children. They use only facts from Australian government and
peak-body sources, cited at the end of each. They stay `draft: true` (visible on
the Preview, never built for production) until a clinician reviews one and is
named as its author ❓.

---

### `/contact/` — Contact & Booking

Booking CTA, phone, email, address + map, parking note, and the three intro lines
(tucked away from road noise ✅, plenty of street parking ✅, clients from across
greater Brisbane ✅).

❓ Opening hours. ❓ What actually happens after you call — the "contacting them
is easy and low-stakes" rung of the PRODUCT.md belief ladder is currently
unwritten anywhere on the site.

---

### `/work-with-us/` — Work With Us

| Section | Content | Status |
|---|---|---|
| Opportunities | one generic sentence | ✏️ |
| Clinic culture | sound-proof rooms, ergonomic furniture, long-term commitment | ✏️ |
| Values | care, compassion, respect | ✏️ |
| Enquiry | admin@therapyhouse.com.au | ✅ |

The thinnest page on the site. Fine to launch as-is, but it currently persuades
nobody. Needs real copy about what it is like to work there.

---

### `/philosophy/` — Our Philosophy

Intro ✅ + 5 principles ✅ (Holistic Care · Inclusive Environment, explicitly
neuro-affirming and LGBTQIA+ welcoming · Sanctuary for Wellness · Meaningful
Connections · Authenticity) + closing ✅.

Currently exists only as a modal. Promoting it to a real page gives it a URL that
can be linked, shared and indexed.

---

### `/privacy-policy/` ⚖️

Built in issue #42: the Current Site policy word for word, linked in the
footer of every page, with the date it was last changed on the Current Site
(23 October 2023). Do not rewrite or summarise it.

❓ The clinic should confirm the policy is still current. It cites the APS Code
of Ethics (2007), links an old OAIC complaints address, and does not mention
the website itself (Google Analytics, online booking).

---

### `/feedback/`

Not rebuilt as a page. The new site has no forms yet, so `/feedback/` and
`/workshops-feedback/` forward to `/contact/`, and
`/external-workshop-expression-of-interest/` forwards to
`/group-therapy/#workshops` (all in `docs/redirects.md`). ❓ A form needs a
backend decision (Cloudflare Pages Functions is the obvious fit) and a check on
whether submissions can contain health information; if so, handling needs to
match (see #67).

---

## Redirect map — Current Site addresses

Every one of these must land on a real page on launch day. **This section is
a summary.** The source of truth is `docs/redirects.md`: every build writes
Cloudflare's `_redirects` file from it (issue #41), and a test checks it
against every Current Site URL in the crawl. Where the two disagree,
`docs/redirects.md` wins.

A redirect whose target page is still a draft is not a 301 yet (issue #90). The
production build writes it as a 302 (temporary redirect) to a stand-in page,
and writes the permanent 301 automatically once the real page is built. The
build fails if any redirect would land on a page it did not build. Today that
affects: `/relationship/` and `/category/relationship/` (302 to `/therapy/`
until `/therapy/couples/` is live, #11), `/child-psychologists/` and
`/category/child-psychologists/` (302 to `/therapy/` until `/children/` is
live, #6), the old learning article address (302 to `/assessments/` until
`/assessments/learning/` is live, #21), and `/ndis/` (302 to `/fees/#ndis`
until the NDIS page is live at that address, #13).

### Pages (21)

| Old | New |
|---|---|
| `/` | `/` |
| `/about/` | `/team/` |
| `/services/` | `/therapy/` |
| `/assessments/` | `/assessments/` |
| `/group-therapy/` | `/group-therapy/` |
| `/group-therapy/circle-of-security-parenting-program/` | stays at its own address (#14) |
| `/group-therapy/self-regulation/` | `/group-therapy/` |
| `/external-workshop-expression-of-interest/` | `/group-therapy/#workshops` |
| `/contact/` | `/contact/` |
| `/workwithus/` | `/work-with-us/` |
| `/blogs/` | `/library/` |
| `/products/` | `/library/#shelf-heading` (the book and video shelf) |
| `/videos/` | `/library/#shelf-heading` |
| `/publications/` | `/library/#publications` |
| `/media/` | `/library/#media` |
| `/relationship/` | `/therapy/couples/` (#11); 302 to `/therapy/` while that page is a draft |
| `/privacy-policy/` | `/privacy-policy/` |
| `/feedback/` | `/contact/` |
| `/workshops-feedback/` | `/contact/` |
| `/sitemap/` | `/sitemap-index.xml` |
| `/ndis/` | stays at its own address (#13); 302 to `/fees/#ndis` while that page is a draft |

### Staff (14 on the Current Site)

`/staff-member/<old-slug>/` → `/team/<new-slug>/`:

dr-amelia-shay · dr-kaya-beinke · letitia-mcvey · genevieve-hussey ·
jazmin-squire · rani-banks (unchanged) · `sahar-h-fattahi-general-psychologist` →
`sahar-fattahi` · `laura-storey-counsellor` → `laura-storey` ·
`natasha-senior-client-support` → `natasha` · `samson-therapy-dog` → `samson`.

Also `natasha-client-support-marketing` (her older address) → `natasha`,
`josie-administrative-support` → `josie` and `reea-therapy-dog` → `reea`
(no longer on the Current Site's staff sitemap, but redirected in case an old
link still exists).

❓ `ace`, `an-yang-provisional-psychologist` and
`brooke-client-support-marketing` have no Rebuild page, so they forward to
`/team/`, as does any other `/staff-member/` address. That can change once
the clinic answers about the team list (R-30).

### Posts (25)

All flatten to `/library/<slug>/` using the slugs in the article table above.
The old paths span seven different category prefixes (`/therapy/`,
`/child-psychologists/`, `/assessments/`, `/news/`, `/workshops/`,
`/relationship/`, `/blog/`); consolidating them is a deliberate choice for a
cleaner structure, paid for with 301s. `/what-is-adhd/` is a second address for
the ADHD post and forwards too.

---

## Open content questions for the clinic

Ranked by how much each one blocks the site's actual goal.

1. **The current team list** — confirm whether Ace, An Yang and Brooke should be on the site, and whether Josie and Reea are still current (R-30). This blocks launch.
2. **AHPRA registration numbers** for all practitioners — cheapest credibility win available.
3. **Real practitioner bios** — several are currently placeholder sentences.
4. **Proof** — testimonials about clinical care cannot be used (National Law section 133). Proof is facts: AHPRA numbers, the Medicare Rebate statement, media and publications.
5. **Media & publication citations** — outlet, date and link for the 4 media items, plus the actual publication list.
6. **Fee review date**, and resolve the assessment-price conflict between `/therapy/` (the old `/services/`) and `/assessments/`.
7. **Group program intake dates** — when does the next one run.
8. **Opening hours.**
9. **Blog curation** — which of the 25 articles stay, and whether the 2023 cancellation fees in `new-cancellation-policy` are still current.
10. **Video URLs** — where the 4 video topics actually live.
11. **Book purchase links and cover images.**
12. **Acknowledgement of country** — whether the clinic wants one.
13. **Privacy policy** — confirm the migrated policy is still current (R-26).
14. **Library authors** — which clinician reviews and puts their name to each of the four new explainer articles (R-62 to R-64).
15. **Fees, wait times and practitioners for the SEO launch pages** — each needs-info issue from #5 to #30 lists exactly what it is waiting on.
