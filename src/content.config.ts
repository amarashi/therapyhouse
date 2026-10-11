import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Content collections for the plain reading pages.
 *
 * Shape follows what a CMS would model: prose lives in the Markdown body,
 * repeatable facts live in frontmatter as arrays of objects. Each block below
 * maps one-to-one onto a CMS field group, so adding an editor later is a
 * mapping exercise rather than a restructure.
 *
 * Blocks are optional because the page singletons legitimately differ — a fee
 * table belongs to Services, an assessment package list belongs to Assessments.
 */

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
});

const groupProgram = z.object({
  title: z.string(),
  audience: z.string().optional(),
  description: z.string(),
});

const assessmentPackage = z.object({
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
});

const pages = defineCollection({
  loader: glob({ base: './src/content/pages', pattern: '**/*.md' }),
  schema: z.object({
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
    programs: z.array(groupProgram).optional(),
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
  }),
});

/**
 * One file per person — the shape a CMS would use for a repeatable document
 * type, and what gives each practitioner their own URL. Credibility is carried
 * by people (PRODUCT.md), so this is the collection that matters most.
 */
const team = defineCollection({
  loader: glob({ base: './src/content/team', pattern: '**/*.md' }),
  schema: z.object({
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
  }),
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
const services = defineCollection({
  loader: glob({ base: './src/content/services', pattern: '**/*.md' }),
  schema: z.object({
    /** The document title, written in full. Search results show it, so it
        carries the service and the place rather than the page's H1. */
    title: z.string().max(60),
    /** The heading a reader sees. Free to be plainer than the title. */
    h1: z.string(),
    description: z.string().max(160),
    lede: z.string(),
    kind: z.enum(['therapy', 'assessment', 'hub']),
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
    medicare: z.array(z.string()).optional(),
    /** Only questions the clinic has actually answered. */
    faqs: z.array(z.object({ question: z.string(), answer: z.string() })).optional(),
    related: z.array(reference('services')).default([]),
    sourceUrl: z.string().url().optional(),
    lastReviewed: z.coerce.date().optional(),
    /** Current Site paths that should forward here (feeds the redirect map). */
    redirectFrom: z.array(z.string()).default([]),
    /** Visible on the preview for review, never built for production. */
    draft: z.boolean().default(false),
  }),
});

export const collections = { pages, team, services };
