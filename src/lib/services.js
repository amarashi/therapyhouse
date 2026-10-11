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

/**
 * Where a service page lives. One function, so a link and a route never disagree.
 *
 * `path` is the entry's own `path` field: an address that is not the kind's
 * usual one, such as /ndis/ or a Current Site address that must not move.
 */
export function servicePath(kind, id, path) {
  if (path) return path;
  if (kind === 'therapy') return `/therapy/${id}/`;
  if (kind === 'assessment') return `/assessments/${id}/`;
  // Audience hubs sit at the site root: /adults/, /children/ (issues #5, #6).
  if (kind === 'hub') return `/${id}/`;
  throw new Error(`No route for service kind "${kind}" (${id})`);
}

/**
 * Drafts are visible on the preview, where the clinic reviews them, and absent
 * from production. A draft that leaked into production would be a page about a
 * clinician's scope of practice that nobody signed off.
 */
/**
 * Whether an entry is built by the root route (src/pages/[...page].astro)
 * rather than under /therapy/ or /assessments/: audience hubs, and any page
 * whose `path` sets its own address.
 */
export function builtAtOwnPath(data) {
  return data.kind === 'hub' || Boolean(data.path);
}

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
export function serviceSchema(data, { url, origin, items = [] }) {
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

  /* A hub is also a list of the pages it links to. `items` are absolute
     URLs and names, in the order the page shows them. */
  if (data.kind === 'hub' && items.length > 0) {
    graph.push({
      '@type': 'ItemList',
      '@id': `${url}#list`,
      name: data.h1,
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        url: item.url,
      })),
    });
  }

  return { '@context': 'https://schema.org', '@graph': graph };
}

/**
 * The headings of the /therapy/ hub, in the order a visitor meets them.
 *
 * Who the help is for comes first, because that is the question a visitor
 * arrives with; "How we work" comes last, because it is what a visitor reads
 * once they have found their own situation. The last entry has no key: it
 * catches any therapy page that has not been given a `hubGroup`, so a new page
 * is always linked from the hub even before anyone files it.
 */
export const HUB_GROUPS = [
  { key: 'adults', label: 'For adults' },
  { key: 'children-families', label: 'For children and families' },
  { key: 'couples', label: 'For couples' },
  { key: 'how-we-work', label: 'How we work' },
  { key: undefined, label: 'More therapy' },
];

/**
 * A service entry as the hubs and the footer list it: the heading a visitor
 * reads on the page itself, one sentence, and its address. Sorted by heading
 * so the order does not depend on how the file system happens to list files.
 */
export function serviceLinks(entries) {
  return entries
    .map((entry) => ({
      id: entry.id,
      label: entry.data.h1,
      description: entry.data.description,
      href: servicePath(entry.data.kind, entry.id, entry.data.path),
      hubGroup: entry.data.hubGroup,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, 'en-AU'));
}

/**
 * The /therapy/ hub's lists: therapy entries under the heading their
 * `hubGroup` names, in `HUB_GROUPS` order. A heading with nothing under it is
 * left out rather than printed over an empty list.
 */
export function hubGroups(entries) {
  const links = serviceLinks(entries.filter((entry) => entry.data.kind === 'therapy'));
  return HUB_GROUPS.map((group) => ({
    key: group.key ?? 'more',
    label: group.label,
    links: links.filter((link) => link.hubGroup === group.key),
  })).filter((group) => group.links.length > 0);
}

/**
 * Who an audience hub is for. The hub's own `audiences` say it; every other
 * service page that shares one of them is listed on it. `telehealth` is left
 * out of the match because it describes how a session is held, not who it is
 * for, and would otherwise put every video page on every hub.
 */
const HUB_MATCH_EXCLUDES = new Set(['telehealth']);

/**
 * The service pages an audience hub lists: therapy pages first, then
 * assessments, each sorted by heading. Read from the collection, so a new page
 * written for adults appears on /adults/ the moment its file exists.
 */
export function hubMembers(hub, entries) {
  const wanted = new Set((hub.data.audiences ?? []).filter((a) => !HUB_MATCH_EXCLUDES.has(a)));
  const members = entries.filter(
    (entry) =>
      entry.id !== hub.id &&
      entry.data.kind !== 'hub' &&
      (entry.data.audiences ?? []).some((a) => wanted.has(a))
  );
  return [
    { key: 'therapy', label: 'Therapy', links: serviceLinks(members.filter((e) => e.data.kind === 'therapy')) },
    { key: 'assessments', label: 'Assessments', links: serviceLinks(members.filter((e) => e.data.kind === 'assessment')) },
  ].filter((group) => group.links.length > 0);
}

/** The audience hubs, as links, for the home page and the /therapy/ hub. */
export function hubLinks(entries) {
  return serviceLinks(entries.filter((entry) => entry.data.kind === 'hub'));
}
