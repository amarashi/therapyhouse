/**
 * The rules every service page is held to, as plain functions.
 *
 * They live here rather than inside the route and layout files for two
 * reasons: the routes for /therapy/ and /assessments/ must agree on them
 * exactly, and `node --test` can load a plain module but not an `.astro` file
 * or `astro:content`. Everything that decides whether a page ships, or what it
 * is allowed to say about money, is tested from `tests/services.test.mjs`.
 */

/**
 * Whether a build is for the clinic's real domain.
 *
 * The same hostname test the preview `noindex` uses in PlainLayout: GitHub
 * Pages is the preview and anything else is production. Reading the
 * configured site rather than an environment flag means there is no second
 * switch to forget on launch day — pointing `astro.config.mjs` at
 * therapyhouse.com.au flips this and the noindex together.
 */
export function isProductionSite(site) {
  if (!site) return false;
  const hostname = typeof site === 'string' ? new URL(site).hostname : site.hostname;
  return !hostname.endsWith('github.io');
}

/** Where a service page lives. One function, so a link and a route never disagree. */
export function servicePath(kind, id) {
  if (kind === 'therapy') return `/therapy/${id}/`;
  if (kind === 'assessment') return `/assessments/${id}/`;
  // Hubs get their own routes (issue #4); until then they have no address.
  throw new Error(`No route for service kind "${kind}" (${id})`);
}

/**
 * Drafts are visible on the preview, where the clinic reviews them, and absent
 * from production. A draft that leaked into production would be a page about a
 * clinician's scope of practice that nobody signed off.
 */
export function includeInBuild(data, production) {
  return !(data.draft && production);
}

/**
 * The fee guard.
 *
 * A wrong fee is worse than no fee (see `lastReviewed` in content.config.ts),
 * so a page whose fees are still awaiting the clinic's confirmation can be
 * reviewed on the preview but cannot be built for the real domain at all. This
 * throws rather than hiding the table, because a quietly missing price is a
 * page that looks finished and is not.
 */
export function assertFeesPublishable({ id, feeStatus, fees }, production) {
  if (!production) return;
  if (feeStatus === 'needs-confirmation') {
    const labels = (fees ?? []).map((f) => f.label).join(', ') || 'no rows';
    throw new Error(
      `Service "${id}" has fees awaiting the clinic's confirmation (${labels}). ` +
        `Confirm them and set feeStatus to "published" or "quote" before a production build.`
    );
  }
}

/**
 * Names in `wanted` that are not in `available`. Astro's `reference()` checks
 * the shape of a reference, not that the entry exists, so a typo in a
 * clinician slug would otherwise render an empty card slot without a word.
 */
export function missingIds(wanted, available) {
  const have = new Set(available);
  return (wanted ?? []).filter((id) => !have.has(id));
}

/** The site-wide business node's id, so every page can point at one clinic. */
export function businessId(origin) {
  return `${origin.replace(/\/+$/, '')}/#business`;
}

/**
 * Structured data for one service page.
 *
 * Every page is a `Service` provided by the clinic. An assessment is also a
 * `MedicalTest`, but a MedicalTest has no `provider`, so the two are separate
 * nodes in one graph rather than one node with two types: the Service says who
 * offers it and where, the MedicalTest says what it is used to diagnose.
 *
 * `areaServed` widens to Queensland only when the page says sessions run by
 * video — the in-room service is a Brisbane one, and claiming otherwise would
 * be a statement the page does not make.
 */
export function serviceSchema(data, { url, origin }) {
  const area = [{ '@type': 'City', name: 'Brisbane' }];
  if (data.formats?.includes('video')) {
    area.push({ '@type': 'State', name: 'Queensland' });
  }

  const service = {
    '@type': 'Service',
    '@id': `${url}#service`,
    name: data.h1,
    description: data.description,
    url,
    serviceType: data.kind === 'assessment' ? 'Psychological assessment' : 'Psychological therapy',
    provider: { '@id': businessId(origin) },
    areaServed: area,
  };

  const graph = [service];

  if (data.kind === 'assessment') {
    graph.push({
      '@type': 'MedicalTest',
      '@id': `${url}#test`,
      name: data.h1,
      url,
      ...(data.diagnoses?.length
        ? { usedToDiagnose: data.diagnoses.map((name) => ({ '@type': 'MedicalCondition', name })) }
        : {}),
    });
  }

  return { '@context': 'https://schema.org', '@graph': graph };
}
