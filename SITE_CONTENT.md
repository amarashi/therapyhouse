# Therapy House — Site Content Inventory

Every page the new site will have, what goes on each one, where that content
comes from today, and what is still missing.

This is the **human sign-off document** — the thing to send the clinic to review.
The machine-readable version already exists as `assets/scripts/content-data.js`,
which is where the copy actually lives; this file describes the *pages*.

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
| `/services/` | Consulting Room | Services & Fees | `services` | ✅ |
| `/assessments/` | Assessment Room | Assessments | `assessments` | ✅ |
| `/group-therapy/` | Group Room | Group Therapy & Programs | `groups` | ✅ |
| `/team/` | Team Parlour | Our Team | `team` | ✅ |
| `/team/<slug>/` | — (carousel card) | Individual practitioner ×12 | `team.members[]` | ✏️ |
| `/library/` | Library | Library — articles, books, videos | `library` | ✅ |
| `/library/<slug>/` | — (blog hotspot) | Individual article ×23 | `library.blogArticles[]` | ❓ |
| `/contact/` | Reception | Contact & Booking | `contact` | ✅ |
| `/work-with-us/` | Work With Us | Work With Us | `workWithUs` | ✏️ |
| `/philosophy/` | — (modal today) | Our Philosophy | `philosophy` | ✅ |
| `/privacy-policy/` | — | Privacy Policy | WordPress scrape | ⚖️ |
| `/feedback/` | — | Feedback | WordPress scrape | ❓ |

**Totals:** 11 content pages + 12 practitioner pages + up to 23 articles.

---

## Global elements

Present on every page.

**Header** — Therapy House mark, primary nav (Services, Assessments, Group
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
3. **What we do** — three routes: Therapy → `/services/`, Assessments → `/assessments/`, Groups → `/group-therapy/` ✅
4. **The team** — 4–6 practitioner faces + "Meet the whole team" ✅ *(carries the credibility load — see PRODUCT.md)*
5. **Philosophy** — 5 principles, condensed ✅
6. **Practical** — address, parking, phone, booking ✅

Source: `rooms.welcome.intro`, `philosophy`, `team.members`, `contact`

---

### `/services/` — Services & Fees

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

One per person (12 pages). Photo, full name, role, credentials, AHPRA number ❓,
languages, bio ✏️, who they work with ✏️, availability ✅, book/call CTAs ✅.

These replace the 12 existing `/staff-member/…/` WordPress URLs and inherit their
search ranking. Person-level JSON-LD goes here.

---

### `/library/` — Library

| Section | Content | Status |
|---|---|---|
| Articles | 23 posts — title, date, excerpt | ✅ (bodies ❓) |
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

23 posts. **Full article text is not in the repo** — only titles, slugs, dates
and excerpts. The bodies sit in `archive/live-site-scrape/html/`, which is
gitignored and will be lost if that folder is ever cleaned.

| # | Date | Title | New slug |
|---|---|---|---|
| 1 | 2025-10-14 | The Lasting Value of Long-Term Psychodynamic Therapy | `long-term-psychodynamic-therapy` |
| 2 | 2025-10-01 | Helping Kids Build Healthy Screen Time Habits | `screen-time` |
| 3 | 2025-08-05 | Practicing Self-Compassion to Manage Uncomfortable Emotions | `practicing-self-compassion` |
| 4 | 2025-06-10 | How To Have A Loving Relationship With Your Body | `how-to-have-a-loving-relationship-with-your-body` |
| 5 | 2025-05-27 | 12 Practical Tips to Manage Depression | `practical-tips-to-manage-depression` |
| 6 | 2025-05-22 | Holding Two Truths: Emotional Duality in Relationships | `emotional-duality-in-relationships` |
| 7 | 2025-04-01 | Nurturing Healthy Self-Esteem in Children | `nurturing-healthy-self-esteem` |
| 8 | 2025-01-28 | Why We Procrastinate | `procrastination` |
| 9 | 2024-12-03 | Understanding and Supporting School Readiness | `school-readiness` |
| 10 | 2024-11-11 | Conflict | `conflict` |
| 11 | 2024-05-21 | Self Care | `self-care` |
| 12 | 2024-05-08 | Sense of Self | `sense-of-self` |
| 13 | 2024-04-02 | The Autonomic Nervous System and Mental Health | `autonomic-nervous-system` |
| 14 | 2024-03-12 | What is Depression? | `what-is-depression` |
| 15 | 2024-02-13 | How Involved Should Parents Be In Their Child's Therapy? | `parent-involvement-in-child-therapy` |
| 16 | 2024-01-22 | What Is Therapy? | `what-actually-is-therapy` |
| 17 | 2023-08-30 | Are You Learning At Your Full Potential? | `is-your-child-learning-to-the-best-of-their-capacity` |
| 18 | 2023-06-28 | Do You Really Know What Anxiety Is? | `do-you-really-know-what-anxiety-is` |
| 19 | 2023-05-05 | New Cancellation Policy | `new-cancellation-policy` |
| 20 | 2023-05-05 | Therapy is a Commitment | `therapy-house-update` |
| 21 | 2023-05-05 | What is ADHD? | `what-is-adhd` |
| 22 | 2023-03-20 | Different Parenting Approaches and How Successful They Are | `parenting-styles-parenting-tips` |
| 23 | 2023-01-10 | Emotion Regulation Skills, Tips and Strategy | `emotion-regulation-skills-strategy` |

**Clinic to curate:** tick which of these 23 still represent the clinic. Retired
ones get a 301 to `/library/`, never a 404. Note that #19 and #21 read as
operational notices rather than articles and may belong elsewhere — or nowhere.

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

Carry over from WordPress verbatim. Do not rewrite or summarise.

---

### `/feedback/`

Existing WordPress page. ❓ Needs a form backend decision (Cloudflare Pages
Functions is the obvious fit) and a check on whether submissions can contain
health information — if so, handling needs to match.

Also in this bucket: `/external-workshop-expression-of-interest/` and
`/workshops-feedback/`.

---

## Redirect map — all 55 existing URLs

Every one of these needs a 301 on launch day.

### Pages (20)

| Old | New |
|---|---|
| `/` | `/` |
| `/about/` | `/team/` |
| `/services/` | `/services/` |
| `/assessments/` | `/assessments/` |
| `/group-therapy/` | `/group-therapy/` |
| `/group-therapy/circle-of-security-parenting-program/` | `/group-therapy/#circle-of-security` |
| `/group-therapy/self-regulation/` | `/group-therapy/` |
| `/external-workshop-expression-of-interest/` | `/group-therapy/#workshops` |
| `/contact/` | `/contact/` |
| `/workwithus/` | `/work-with-us/` |
| `/blogs/` | `/library/` |
| `/products/` | `/library/#books` |
| `/videos/` | `/library/#videos` |
| `/publications/` | `/library/#publications` |
| `/media/` | `/library/#media` |
| `/relationship/` | `/library/` |
| `/privacy-policy/` | `/privacy-policy/` |
| `/feedback/` | `/feedback/` |
| `/workshops-feedback/` | `/feedback/` |
| `/sitemap/` | `/sitemap.xml` |

### Staff (12)

`/staff-member/<old-slug>/` → `/team/<new-slug>/`:

dr-amelia-shay · dr-kaya-beinke · letitia-mcvey · genevieve-hussey ·
jazmin-squire · rani-banks (unchanged) · `sahar-h-fattahi-general-psychologist` →
`sahar-fattahi` · `laura-storey-counsellor` → `laura-storey` ·
`natasha-client-support-marketing` → `natasha` · `josie-administrative-support` →
`josie` · `reea-therapy-dog` → `reea` · `samson-therapy-dog` → `samson`.

### Posts (23)

All flatten to `/library/<slug>/` using the slugs in the article table above.
The old paths span six different category prefixes (`/therapy/`,
`/child-psychologists/`, `/assessments/`, `/news/`, `/workshops/`,
`/relationship/`); consolidating them is a deliberate choice for a cleaner IA,
paid for with 301s. Flag if you would rather preserve the keyword-rich old paths
exactly as they are.

---

## Open content questions for the clinic

Ranked by how much each one blocks the site's actual goal.

1. **AHPRA registration numbers** for all practitioners — cheapest credibility win available.
2. **Real practitioner bios** — several are currently placeholder sentences.
3. **Testimonials / reviews / proof** — PRODUCT.md records that none exist yet. Drop files into `.impeccable/assets/proof/`.
4. **Media & publication citations** — outlet, date and link for the 4 media items, plus the actual publication list.
5. **Fee review date**, and resolve the assessment-price conflict between `/services/` and `/assessments/`.
6. **Group program intake dates** — when does the next one run.
7. **Opening hours.**
8. **Blog curation** — which of the 23 articles stay.
9. **Video URLs** — where the 4 video topics actually live.
10. **Book purchase links and cover images.**
11. **Acknowledgement of country** — whether the clinic wants one.
