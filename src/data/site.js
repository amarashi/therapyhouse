/**
 * Shared page furniture: contact facts, the two calls to action, and the nav.
 *
 * The contact details are imported from `content-data.js` rather than copied.
 * That module is the single content model both experiences read from — the
 * house renders it as hotspots, these pages render it as sections — so the
 * phone number exists in exactly one place.
 */
import { siteContent } from '../../public/assets/scripts/content-data.js';

export const contact = siteContent.contact;

export const site = {
  name: 'Therapy House',
  origin: 'https://www.therapyhouse.com.au',
  tagline: "Help that doesn't feel like help",
};

/**
 * The suburbs next to the clinic, named in plain text on the home and contact
 * pages. People search "psychologist Ashgrove" rather than "psychologist near
 * The Gap", and a suburb named nowhere on the site cannot be matched. These are
 * neighbouring suburbs, not a claim about where clients come from.
 */
export const nearbySuburbs = ['Ashgrove', 'Bardon', 'Keperra', 'Ferny Grove', 'Mitchelton'];

/**
 * Primary and secondary CTA carry equal weight (PRODUCT.md): some parents
 * self-serve, others need to talk first, and neither path is the fallback for
 * the other.
 */
export const callsToAction = {
  book: {
    label: 'Book an appointment',
    href: contact.bookingUrl,
    external: true,
  },
  call: {
    label: `Call ${contact.phone}`,
    href: 'tel:+61733002170',
    external: false,
  },
};

/**
 * `ready: false` pages are written but not built yet, so they are omitted from
 * the nav rather than shipped as broken links. Flip the flag when the page
 * lands.
 */
export const nav = [
  { label: 'Therapy', href: '/therapy/', ready: true },
  { label: 'Assessments', href: '/assessments/', ready: true },
  { label: 'Group Therapy', href: '/group-therapy/', ready: true },
  { label: 'Team', href: '/team/', ready: true },
  { label: 'Library', href: '/library/', ready: true },
  { label: 'Contact', href: '/contact/', ready: true },
];

export const readyNav = nav.filter((item) => item.ready);

/**
 * Pages that are not floors of the lift.
 *
 * The rail is the parent's path through the clinic — the six things they came
 * to find out — and it is tuned as a composition, so it is not the place to
 * park everything the site happens to hold. But "not a floor" was being read
 * as "not linked": `/work-with-us/` had no inbound link anywhere on the site,
 * and `/philosophy/` had exactly one, on the home page, so neither was
 * reachable from any other page. Both are built, both ship, and one of them is
 * the belief-ladder content PRODUCT.md leans on.
 *
 * So they live here and the footer carries them. Anything written next that is
 * real but not a floor belongs in this list, not in a comment.
 *
 * Fees and Medicare (issue #30) is here rather than a seventh floor: the lift
 * keeps its six floors (issue #4), and the Therapy floor carries a link to
 * /fees/ where the fee table used to be.
 */
export const secondaryNav = [
  { label: 'Fees and Medicare', href: '/fees/' },
  { label: 'Our philosophy', href: '/philosophy/' },
  { label: 'Work with us', href: '/work-with-us/' },
  { label: 'Privacy policy', href: '/privacy-policy/' },
];

/**
 * Every page of the site, in one list, for the footer.
 *
 * On a phone the menu is a row that scrolls sideways and shows four of its
 * seven floors — a deliberate trade (see SideRail.astro), and one that only
 * works if the whole map is written down somewhere the visitor reaches by
 * scrolling rather than by discovering. The bottom of the page is where people
 * look for it.
 */
export const footerNav = [{ label: 'Home', href: '/' }, ...readyNav, ...secondaryNav];

/**
 * Whether an availability status means "you can book with this person now".
 *
 * The negative status is "Not currently accepting new clients", so a bare
 * substring test for "accepting" matches the exact opposite of what it means.
 * Statuses are free text written by the clinic, so this stays defensive:
 * anything unrecognised ("On leave", "Active waitlist") is not accepting.
 */
export function isAcceptingNewClients(status) {
  if (!status) return false;
  return /accepting/i.test(status) && !/\bnot\b/i.test(status);
}

/**
 * The staff handbook, which is not part of the site.
 *
 * It lives at its own address, is written for the therapists and admin rather
 * than for parents, and is gated behind a Therapy House login. So it is not a
 * page of the site map and does not belong in `footerNav` — every entry there
 * is an internal path the footer resolves with `withBase()`, and this one is
 * an absolute URL to somewhere else. The footer carries it as its own line,
 * named for who it is for, so a therapist can find it from any page and a
 * parent can see at a glance that it isn't for them.
 */
export const staffLink = {
  label: 'Employee handbook',
  href: 'https://therapyhouse.pages.dev/',
  note: 'Staff login',
};
