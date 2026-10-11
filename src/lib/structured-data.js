/**
 * Site-wide structured data: the clinic itself, and the people who work there.
 *
 * Structured data is the JSON-LD block in a page's head that tells search
 * engines, in a fixed vocabulary (schema.org), what the business is, where it
 * is and who works there. It is built here as plain functions so
 * `node --test` can check it without Astro, and so the reading pages and the
 * house experience describe the clinic with one identical record.
 *
 * Only facts the clinic has published go in. Opening hours and AHPRA numbers
 * are left out until the clinic supplies them; the slots for them exist so the
 * day they arrive is a data change, not a code change.
 */

import { businessId, servicePath } from './services.js';
import { professionOf } from './seo.js';

/**
 * Join a site path onto the address this build is deployed to. `pageBase` is
 * `withBase` from base.js, passed in so this module stays loadable by Node.
 */
const absolute = (path, { siteUrl, pageBase = (p) => p }) => new URL(pageBase(path), siteUrl).href;

/**
 * The `MedicalBusiness` record that every page carries.
 *
 * `@id` stays on the clinic's own domain whatever the build target, because it
 * is a name for the clinic rather than an address to visit; service pages
 * point at it as their provider (see `serviceSchema`). Image and service
 * addresses use the build's own site, so the Preview never links to pages
 * that do not exist on the live domain yet.
 *
 * @param {object} options
 * @param {typeof import('../data/site.js').site} options.site
 * @param {typeof import('../data/site.js').contact} options.contact
 * @param {typeof import('../data/site.js').businessFacts} options.facts
 * @param {Array<{ id: string, data: { kind: string, h1: string } }>} options.services
 *   Service entries already filtered for this build (drafts out in production).
 * @param {string | URL} options.siteUrl The build's site (Astro.site).
 * @param {(path: string) => string} [options.pageBase] Adds the base path.
 */
export function businessSchema({ site, contact, facts, services = [], siteUrl, pageBase }) {
  const at = (path) => absolute(path, { siteUrl, pageBase });

  const availableService = services
    .filter((entry) => entry.data.kind === 'therapy' || entry.data.kind === 'assessment')
    .map((entry) => {
      const url = at(servicePath(entry.data.kind, entry.id));
      return {
        '@type': entry.data.kind === 'assessment' ? 'MedicalTest' : 'MedicalTherapy',
        name: entry.data.h1,
        url,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'en-AU'));

  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalBusiness',
    '@id': businessId(site.origin),
    name: site.name,
    url: site.origin,
    telephone: facts.telephone,
    email: contact.email,
    image: at(facts.image),
    logo: at(facts.logo),
    priceRange: facts.priceRange,
    address: {
      '@type': 'PostalAddress',
      ...facts.address,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: facts.geo.latitude,
      longitude: facts.geo.longitude,
    },
    hasMap: facts.hasMap,
    sameAs: facts.sameAs,
    /* Brisbane for sessions in the clinic, Australia for sessions by video. */
    areaServed: [
      { '@type': 'City', name: 'Brisbane' },
      { '@type': 'Country', name: 'Australia' },
    ],
    medicalSpecialty: ['Psychology', 'Counselling'],
    ...(availableService.length ? { availableService } : {}),
    ...(facts.openingHours.length
      ? {
          openingHoursSpecification: facts.openingHours.map((h) => ({
            '@type': 'OpeningHoursSpecification',
            ...h,
          })),
        }
      : {}),
  };
}

/**
 * The occupation a role names, as the clinic publishes it: "Clinical
 * Psychologist", "Provisional Psychologist", "Counsellor". Undefined for roles
 * that are not a clinical occupation (reception, marketing, the dogs).
 */
export function occupationOf(role) {
  const profession = professionOf(role);
  return /psycholog|counsell/i.test(profession) ? profession : undefined;
}

/**
 * The `Person` record on a practitioner's or staff member's page. The dogs get
 * none: a Person they are not.
 *
 * @param {object} data The team entry's data.
 * @param {object} options
 * @param {string} options.id The team entry's id (its page slug).
 * @param {string} options.origin The clinic's domain, for `worksFor`.
 * @param {string | URL} options.siteUrl The build's site (Astro.site).
 * @param {(path: string) => string} [options.pageBase] Adds the base path.
 */
export function personSchema(data, { id, origin, siteUrl, pageBase }) {
  if (data.kind === 'dog') return null;
  const at = (path) => absolute(path, { siteUrl, pageBase });
  const occupation = occupationOf(data.role);
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: data.name,
    jobTitle: data.role,
    ...(occupation ? { hasOccupation: { '@type': 'Occupation', name: occupation } } : {}),
    ...(data.credentials ? { hasCredential: data.credentials } : {}),
    ...(data.languages ? { knowsLanguage: data.languages } : {}),
    image: at(data.image),
    url: at(`/team/${id}/`),
    worksFor: { '@id': businessId(origin) },
    /* Only once the clinic has supplied the number (R-07). */
    ...(data.ahpra
      ? {
          identifier: {
            '@type': 'PropertyValue',
            propertyID: 'AHPRA registration number',
            value: data.ahpra,
          },
        }
      : {}),
  };
}
