import { z } from 'astro/zod';

/**
 * The schemas of the content collections for the plain reading pages.
 * src/content.config.ts wires them to their folders; they live here, as plain
 * Zod, so that `node --test` can read them too (it cannot load
 * `astro:content`). tests/pages-cms-config.test.mjs walks them to keep the
 * CMS form (.pages.yml) in step with what the build accepts.
 *
 * `reference()` only exists inside Astro, so the two schemas that point at
 * other collections take it as an argument: `contentSchemas(reference)`.
 *
 * Shape follows what a CMS would model: prose lives in the Markdown body,
 * repeatable facts live in frontmatter as arrays of objects. Each block below
 * maps one-to-one onto a field group in the CMS form, .pages.yml.
 *
 * Blocks are optional because the page singletons legitimately differ — a fee
 * table belongs to Services, an assessment package list belongs to Assessments.
 */

/**
 * "Show on the live website", switched off. Shared by every entry and every
 * repeatable item inside a page: a draft is shown on the Preview for review
 * and left out of the production build, so staff can hide something without
 * deleting it. Every list reads it through src/lib/drafts.js.
 */
const draft = z.boolean().default(false);

const feeRow = z.object({
  label: z.string(),
  amount: z.string(),
  note: z.string().optional(),
  /**
   * Added to a session fee rather than being one. Listed in its own group so a
   * "+$10" never sits in the same column a visitor is comparing $260 against.
   */
  adjustment: z.boolean().default(false),
  /**
   * Which table group a row sits under on /fees/. Rows with no group are the
   * psychologists' session fees, which head the table.
   */
  group: z.enum(['provisional', 'couples-family']).optional(),
  draft,
});

/**
 * The key of an item the illustrated house keeps its own copy of
 * (public/assets/content/house-copy.json: `assessments.packages.<id>`,
 * `assessments.schoolObservations`, `groups.programs.<id>`). The house joins
 * prices and the "Show on the live website" switch by this id, so a title can
 * be reworded freely. Hidden in the CMS; an item without one is simply not in
 * the house.
 */
const houseId = z.string().regex(/^[a-zA-Z]+$/, 'a house-copy.json key such as adhd').optional();

const groupProgram = z.object({
  title: z.string(),
  audience: z.string().optional(),
  description: z.string(),
});

const assessmentPackage = z.object({
  id: houseId,
  title: z.string(),
  price: z.string(),
  provisionalPrice: z.string().optional(),
  description: z.string().optional(),
  inclusions: z.array(z.string()).optional(),
  /**
   * Bought alongside an assessment rather than instead of one. Listed in its
   * own group so a $250 school visit is never read as a cheaper alternative to
   * a $2,400 assessment.
   */
  addOn: z.boolean().default(false),
  draft,
});

export const pagesSchema = z.object({
  /** <h1>, and the <title> unless `documentTitle` is set. */
  title: z.string(),
  /**
   * The document title, written in full, when the heading a reader sees is
   * not the phrase a search result should show. Without it the title is the
   * heading plus " | Therapy House".
   */
  documentTitle: z.string().max(60).optional(),
  /** Meta description and social preview text. */
  description: z.string(),
  /** Opening sentence, set larger than body copy. */
  lede: z.string(),
  /** Where this content came from on the old WordPress site. */
  sourceUrl: z.string().url().optional(),
  /**
   * When a human last confirmed the facts on this page. Prices and
   * availability go stale, and a wrong fee is worse than no fee — pages
   * carrying money render this date visibly.
   */
  lastReviewed: z.coerce.date().optional(),

  /* ---- Home blocks ----
     The headline is split so the second clause can take the accent colour,
     the way a two-tone editorial hero does. */
  headline: z.string().optional(),
  headlineAccent: z.string().optional(),
  routes: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
        /**
         * A figure already published on the destination page, restated so a
         * parent knows roughly what a route costs before clicking. Never a
         * new number; where nothing is published, it carries the ages the
         * programs are built for instead.
         */
        note: z.string().optional(),
        href: z.string(),
        linkText: z.string(),
        /** The room that heads the destination page, at thumbnail width. */
        image: z.string().optional(),
        draft,
      })
    )
    .optional(),

  /* ---- Services blocks ---- */
  offerings: z.array(z.string()).optional(),
  therapyModels: z.array(z.string()).optional(),
  fees: z.array(feeRow).optional(),
  rebates: z.array(z.string()).optional(),
  reports: z.array(z.string()).optional(),

  /* ---- Fees blocks ----
     Medicare amounts are not here: they live in src/data/medicare.js, with
     their MBS item numbers and an 'as at' date the build checks. */
  sessionLength: z.string().optional(),
  privateHealth: z.array(z.string()).optional(),
  ndis: z.array(z.string()).optional(),
  /** Copied from the clinic's own published policy, never written for it. */
  cancellation: z
    .object({ published: z.string(), sourceUrl: z.string().url(), rules: z.array(z.string()), notes: z.array(z.string()) })
    .optional(),

  /* ---- Assessments blocks ---- */
  process: z.array(z.string()).optional(),
  documents: z.array(z.string()).optional(),
  packages: z.array(assessmentPackage).optional(),
  /**
   * Plain statements the clinic already publishes. Deliberately not modelled
   * as question/answer pairs: the source material has answers but no
   * questions, and inventing the questions would be putting words in the
   * clinic's mouth.
   */
  goodToKnow: z.array(z.string()).optional(),

  /* ---- Group therapy blocks ---- */
  /* The switch is on each program in the list. The Circle of Security block
     below is one fixed section of the page and cannot be switched off. */
  programs: z.array(groupProgram.extend({ id: houseId, draft })).optional(),
  circleOfSecurity: groupProgram.extend({ details: z.array(z.string()) }).optional(),
  workshopTopics: z.array(z.string()).optional(),

  /* ---- Philosophy blocks ---- */
  principles: z.array(z.object({ title: z.string(), body: z.string() })).optional(),
  closing: z.string().optional(),

  /* ---- Contact blocks ---- */
  practicalNotes: z.array(z.string()).optional(),

  /* ---- Work with us blocks ---- */
  values: z.array(z.string()).optional(),
  culture: z.array(z.string()).optional(),

  /* ---- Library blocks ---- */
  books: z.array(z.object({ title: z.string(), description: z.string() })).optional(),
  videoTopics: z.array(z.string()).optional(),
  mediaItems: z.array(z.string()).optional(),
  publicationsNote: z.string().optional(),
});

/**
 * One file per person — the shape a CMS would use for a repeatable document
 * type, and what gives each practitioner their own URL. Credibility is carried
 * by people (PRODUCT.md), so this is the collection that matters most.
 */
export const teamSchema = z.object({
  name: z.string(),
  role: z.string(),
  /** Practitioners lead the page; support staff and the dogs follow. */
  kind: z.enum(['practitioner', 'support', 'dog']),
  order: z.number(),
  image: z.string(),
  imageAlt: z.string(),
  summary: z.string(),
  credentials: z.string().optional(),
  /**
   * Who this practitioner sees, and what they work on.
   *
   * A parent comparing clinics is trying to answer one question — is there
   * someone here for us — and previously had to read eight bios to do it.
   * These two arrays are that answer, made scannable.
   *
   * Every published value is RESTRUCTURED from the practitioner's own
   * summary or bio, never inferred beyond it: an approach ("trauma-informed
   * way of working") is not a presentation treated, and is not listed as
   * one. `docs/team-specialisms-review.md` records the source sentence for
   * each value and is the clinic's sign-off list.
   *
   * Practitioners only. Support staff and the dogs leave these unset, and
   * the card renders without them.
   */
  worksWith: z.array(z.string()).optional(),
  worksOn: z.array(z.string()).optional(),
  /**
   * Languages other than English are a real differentiator in Brisbane and
   * were previously buried inside bio prose.
   */
  languages: z.array(z.string()).optional(),
  /**
   * Goes stale quickly — needs an owner and a review cadence, or it becomes
   * a liability. Absent means "not published", not "accepting".
   */
  availability: z.string().optional(),
  /** AHPRA registration number. Not yet supplied by the clinic. */
  ahpra: z.string().optional(),
  sourceUrl: z.string().url().optional(),
  /** In production: left off the team page, the home page, service pages,
      article bylines and the house, and their own page is not built. The
      Preview shows them, with their page marked as a draft. */
  draft,
});

/**
 * One file per service page: a therapy (`/therapy/<file>/`) or an assessment
 * (`/assessments/<file>/`). The file name is the address, so renaming a file
 * moves a page — add the old path to `redirectFrom` when that happens.
 *
 * Built for the SEO launch (issue #3): about twenty pages are coming, and each
 * one should be a Markdown file a person can read and the clinic can check,
 * not a hand-built route. The rules that decide what a page may say — drafts,
 * unconfirmed fees, clinicians who exist — are in `src/lib/services.js`.
 */
export const servicesSchema = (reference) =>
  z.object({
    /** The document title, written in full. Search results show it, so it
        carries the service and the place rather than the page's H1. */
    title: z.string().max(60),
    /** The heading a reader sees. Free to be plainer than the title. */
    h1: z.string(),
    description: z.string().max(160),
    lede: z.string(),
    kind: z.enum(['therapy', 'assessment', 'hub']),
    /**
     * The page's address, when it is not the kind's usual one: /ndis/, or the
     * Circle of Security page, which keeps its Current Site address. Built by
     * src/pages/[...page].astro. Leave unset for /therapy/<file>/ and
     * /assessments/<file>/.
     */
    path: z
      .string()
      .regex(/^\/[a-z0-9-]+(\/[a-z0-9-]+)*\/$/, 'a site path such as /ndis/')
      .optional(),
    /**
     * Which heading a therapy page sits under on the /therapy/ hub. Optional
     * so a page can be written before anyone decides where it belongs; an
     * ungrouped page is still listed, under the hub's last heading, rather
     * than silently left off. The order and wording of the headings live in
     * `HUB_GROUPS` in src/lib/services.js.
     */
    hubGroup: z.enum(['adults', 'children-families', 'couples', 'how-we-work']).optional(),
    /** Who the page is written for. Not rendered; it is how the hubs (issue
        #4) and the gap register group pages. */
    audiences: z.array(z.enum(['local-family', 'telehealth', 'adult'])).min(1),
    /** Team slugs. Checked against the team collection at build time. */
    clinicians: z.array(reference('team')).default([]),
    formats: z.array(z.enum(['in-room', 'video'])).default(['in-room']),
    /** Conditions an assessment diagnoses, for the MedicalTest structured data. */
    diagnoses: z.array(z.string()).optional(),
    process: z.array(z.string()).optional(),
    fees: z.array(feeRow).optional(),
    /**
     * `published`: the clinic publishes these figures.
     * `quote`: no figure is published; the page says to call for a quote.
     * `needs-confirmation`: a draft figure the clinic has not confirmed. Shown
     * on the preview with a marker, and a production build refuses to run.
     */
    feeStatus: z.enum(['published', 'quote', 'needs-confirmation']).default('quote'),
    /**
     * Charged at the clinic's ordinary session fees, which /fees/ publishes.
     * The page then points there instead of repeating the table (a second
     * copy of a price is a second place for it to go stale) or telling a
     * visitor to call for a quote on a price that is already public.
     */
    sessionFees: z.boolean().default(false),
    medicare: z.array(z.string()).optional(),
    /** Only questions the clinic has actually answered. */
    faqs: z.array(z.object({ question: z.string(), answer: z.string() })).optional(),
    related: z.array(reference('services')).default([]),
    sourceUrl: z.string().url().optional(),
    lastReviewed: z.coerce.date().optional(),
    /** Current Site paths that should forward here (feeds the redirect map). */
    redirectFrom: z.array(z.string()).default([]),
    /** Shows the Lifeline and 000 note under the opening: pages about
        depression, trauma or self-harm. */
    crisisNote: z.boolean().default(false),
    /** Visible on the preview for review, never built for production. */
    draft,
  });

/**
 * One file per library article, at `/library/<file>/`. The file name is the
 * Current Site's final path segment, so an old address and its new one are
 * easy to match up in docs/redirects.md.
 *
 * The 25 articles migrated from the Current Site (issue #39) keep their
 * published wording; the body is the article as it was, converted to
 * Markdown. New articles are written as drafts until a named clinician has
 * reviewed them, because health information under the clinic's name needs a
 * clinician who stands behind it.
 */
export const articlesSchema = (reference) =>
  z.object({
    /** The heading, and the document title with " | Therapy House" added. */
    title: z.string(),
    /** The document title in full, for an article whose heading is too long
        to fit a search result (60 characters) with the clinic's name. */
    documentTitle: z.string().max(60).optional(),
    description: z.string().max(159),
    /** First published. For a migrated article, the Current Site's date. */
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    /** Team slug of the writer, when the byline names one current team
        member. Checked against the team collection at build time. */
    author: reference('team').optional(),
    category: z.string(),
    /** Where the article was published on the Current Site. */
    sourceUrl: z.string().url().optional(),
    /** Root-absolute path under public/, used for the article header and
        the BlogPosting image. */
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    /** Shows the Lifeline and 000 note: articles about depression, trauma or
        self-harm. */
    crisisNote: z.boolean().default(false),
    /** Visible on the preview for review, never built for production. */
    draft,
  });

/**
 * Queensland towns the Telehealth Room speaks to (issues #25 to #29).
 *
 * `page`: a Town Page at /telehealth/<file>/. `section`: a short paragraph on
 * /telehealth/ instead. The doorway rule (spec: telehealth and fees) is that a
 * town earns a page only with at least three sourced facts about that town;
 * `assertTownPage` in src/lib/towns.js enforces it at build time, and
 * tests/towns.test.mjs checks that no two Town Pages share more than a third
 * of their text.
 *
 * Every fact carries the URL it came from. The page lists them as its sources.
 */
const townFact = z.object({
  /** One plain sentence, as the page prints it. */
  text: z.string(),
  sourceName: z.string(),
  sourceUrl: z.string().url(),
});

export const townsSchema = z.object({
  name: z.string(),
  kind: z.enum(['page', 'section']),
  /** Order on /telehealth/: launch pages first, then sections. */
  order: z.number(),
  facts: z.array(townFact).min(1),
  /* Page fields. Required for `page` (checked by assertTownPage). */
  title: z.string().max(60).optional(),
  h1: z.string().optional(),
  description: z.string().max(160).optional(),
  lede: z.string().optional(),
  draft,
});

/**
 * Every collection's schema, by collection name.
 * @param {(collection: string) => import('astro/zod').ZodType} reference
 *   Astro's `reference` from `astro:content`; a test may pass a stand-in.
 */
export function contentSchemas(reference) {
  return {
    pages: pagesSchema,
    team: teamSchema,
    services: servicesSchema(reference),
    articles: articlesSchema(reference),
    towns: townsSchema,
  };
}
