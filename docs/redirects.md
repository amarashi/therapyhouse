# Redirects inside the Rebuild

Addresses the Rebuild itself has moved. These are inputs to the launch redirect
map (gap register R-24), which also has to forward every Current Site address.
On GitHub Pages, Astro's `redirects` setting in `astro.config.mjs` writes a page
that forwards the visitor. On Cloudflare every line below becomes a real 301
(permanent) redirect, or a 302 while its target is a draft (see below): the
build writes `_redirects` from this table (`src/integrations/redirects-file.js`,
issue #41), so edit this table, never that file.

Rules for a line: both sides are site paths; at most one `*`, which matches the
rest of the path; a `#fragment` is allowed in the target. A target must not
itself be redirected (no chains), and a path has only one target. The build
stops if either rule is broken, and `tests/redirects.test.mjs` checks that
every Current Site address is covered. The home page has no line on purpose:
the Business Profile link `/?utm_source=google&utm_medium=organic&utm_campaign=gmb`
and the sbs.com.au and theconversation.com backlinks all point at `/`, which is
served with its query string kept.

Targets that are not built yet (issue #90). Draft pages are built on the
Preview but left out of production. In a production build, a line whose
target is not built is written as a 302 (temporary redirect) instead of a
301, to a stand-in page: the fallback written after the target, as in
`/therapy/couples/` (fallback `/therapy/`), or, with no fallback, the nearest
built folder above the target (`/assessments/learning/` would fall back to
`/assessments/`; the home page is never used). A 302 tells search engines
the move is not final, so they keep the old address until the build that has
the real page writes the permanent 301. Nothing in this table changes when a
draft is signed off. The build stops, naming the line, if a target and its
fallback are both missing. A line whose target is its own address
(`/ndis/` to `/ndis/`) is a holding line: it only applies while that page is
not built, and is left out once it is. The build log lists every fallback in
use (`... 302 until ... is built`).

| From | To | Status | Why | Added |
|---|---|---|---|---|
| `/services/` | `/therapy/` | 301 | The Services floor became the Therapy hub (issue #4). The fee table has since moved to `/fees/`, linked from `/therapy/` (issue #30). | 11 Oct 2026 |
| `/policy/` | `/fees/#cancellation` | 301 | The Current Site's cancellation policy address. The policy is now a section of `/fees/` (issue #30). | 11 Oct 2026 |
| `/assessments/is-your-child-learning-to-the-best-of-their-capacity/` | `/assessments/learning/` (fallback `/assessments/`) | 301 | Decided 11 Oct 2026 (#60): the old address forwards to the learning assessment page (#21). The article itself stays in the library at `/library/is-your-child-learning-to-the-best-of-their-capacity/`. | 11 Oct 2026 |
| `/assessments/what-is-adhd/` | `/library/what-is-adhd/` | 301 | Library article migrated from the Current Site (issue #39). | 11 Oct 2026 |
| `/blog/mindfulness-and-journalling/` | `/library/mindfulness-and-journalling/` | 301 | Library article migrated from the Current Site (issue #39). | 11 Oct 2026 |
| `/child-psychologists/nurturing-healthy-self-esteem/` | `/library/nurturing-healthy-self-esteem/` | 301 | Library article migrated from the Current Site (issue #39). | 11 Oct 2026 |
| `/child-psychologists/screen-time/` | `/library/screen-time/` | 301 | Library article migrated from the Current Site (issue #39). | 11 Oct 2026 |
| `/child-psychologists/sense-of-self/` | `/library/sense-of-self/` | 301 | Library article migrated from the Current Site (issue #39). | 11 Oct 2026 |
| `/news/new-cancellation-policy/` | `/library/new-cancellation-policy/` | 301 | Library article migrated from the Current Site (issue #39). | 11 Oct 2026 |
| `/news/therapy-house-update/` | `/library/therapy-house-update/` | 301 | Library article migrated from the Current Site (issue #39). | 11 Oct 2026 |
| `/relationship/emotional-duality-in-relationships/` | `/library/emotional-duality-in-relationships/` | 301 | Library article migrated from the Current Site (issue #39). | 11 Oct 2026 |
| `/therapy/autonomic-nervous-system/` | `/library/autonomic-nervous-system/` | 301 | Library article migrated from the Current Site (issue #39). | 11 Oct 2026 |
| `/therapy/conflict/` | `/library/conflict/` | 301 | Library article migrated from the Current Site (issue #39). | 11 Oct 2026 |
| `/therapy/how-to-have-a-loving-relationship-with-your-body/` | `/library/how-to-have-a-loving-relationship-with-your-body/` | 301 | Library article migrated from the Current Site (issue #39). | 11 Oct 2026 |
| `/therapy/long-term-psychodynamic-therapy/` | `/library/long-term-psychodynamic-therapy/` | 301 | Library article migrated from the Current Site (issue #39). | 11 Oct 2026 |
| `/therapy/parent-involvement-in-child-therapy/` | `/library/parent-involvement-in-child-therapy/` | 301 | Library article migrated from the Current Site (issue #39). | 11 Oct 2026 |
| `/therapy/play-therapy-therapy-made-for-children-with-childrens-minds-in-mind/` | `/library/play-therapy-therapy-made-for-children-with-childrens-minds-in-mind/` | 301 | Library article migrated from the Current Site (issue #39). | 11 Oct 2026 |
| `/therapy/practical-tips-to-manage-depression/` | `/library/practical-tips-to-manage-depression/` | 301 | Library article migrated from the Current Site (issue #39). | 11 Oct 2026 |
| `/therapy/practicing-self-compassion/` | `/library/practicing-self-compassion/` | 301 | Library article migrated from the Current Site (issue #39). | 11 Oct 2026 |
| `/therapy/procrastination/` | `/library/procrastination/` | 301 | Library article migrated from the Current Site (issue #39). | 11 Oct 2026 |
| `/therapy/school-readiness/` | `/library/school-readiness/` | 301 | Library article migrated from the Current Site (issue #39). | 11 Oct 2026 |
| `/therapy/self-care/` | `/library/self-care/` | 301 | Library article migrated from the Current Site (issue #39). | 11 Oct 2026 |
| `/therapy/what-actually-is-therapy/` | `/library/what-actually-is-therapy/` | 301 | Library article migrated from the Current Site (issue #39). | 11 Oct 2026 |
| `/therapy/what-is-depression/` | `/library/what-is-depression/` | 301 | Library article migrated from the Current Site (issue #39). | 11 Oct 2026 |
| `/workshops/circle-of-security-parenting-program/parenting-styles-parenting-tips/` | `/library/parenting-styles-parenting-tips/` | 301 | Library article migrated from the Current Site (issue #39). | 11 Oct 2026 |
| `/workshops/self-regulation/do-you-really-know-what-anxiety-is/` | `/library/do-you-really-know-what-anxiety-is/` | 301 | Library article migrated from the Current Site (issue #39). | 11 Oct 2026 |
| `/workshops/self-regulation/emotion-regulation-skills-strategy/` | `/library/emotion-regulation-skills-strategy/` | 301 | Library article migrated from the Current Site (issue #39). | 11 Oct 2026 |
| `/about/` | `/team/` | 301 | The Current Site's "About - Our Team" page. Its nearest page is the team page. | 11 Oct 2026 |
| `/our-philosophy/` | `/philosophy/` | 301 | Philosophy page, new address. | 11 Oct 2026 |
| `/workwithus/` | `/work-with-us/` | 301 | Work with us page, new address. | 11 Oct 2026 |
| `/blogs/` | `/library/` | 301 | The blog index is now the library. | 11 Oct 2026 |
| `/products/` | `/library/#shelf-heading` | 301 | Books are on the library shelf. | 11 Oct 2026 |
| `/videos/` | `/library/#shelf-heading` | 301 | Videos are on the library shelf. | 11 Oct 2026 |
| `/publications/` | `/library/#publications` | 301 | Publications are a section of the library. | 11 Oct 2026 |
| `/media/` | `/library/#media` | 301 | Media appearances are a section of the library. | 11 Oct 2026 |
| `/sitemap/` | `/sitemap-index.xml` | 301 | The Current Site's HTML sitemap. The new site publishes an XML sitemap. | 11 Oct 2026 |
| `/staff-sitemap.xml` | `/team/` | 301 | The Current Site's staff sitemap. | 11 Oct 2026 |
| `/feedback/` | `/contact/` | 301 | Feedback form. The new site has no form; the contact page has the clinic's details. | 11 Oct 2026 |
| `/workshops-feedback/` | `/contact/` | 301 | Workshop feedback form. No form on the new site. | 11 Oct 2026 |
| `/forms/` | `/contact/` | 301 | Client questionnaire index. No forms on the new site yet (see #67). | 11 Oct 2026 |
| `/forms/*` | `/contact/` | 301 | Client questionnaires and feedback forms. No forms on the new site yet (see #67). | 11 Oct 2026 |
| `/dass/` | `/contact/` | 301 | DASS questionnaire form. No forms on the new site yet (see #67). | 11 Oct 2026 |
| `/group-therapy/self-regulation/` | `/group-therapy/` | 301 | Self-regulation program, a section of the group therapy page. | 11 Oct 2026 |
| `/workshop/self-regulation/` | `/group-therapy/` | 301 | Old alias of the self-regulation program. | 11 Oct 2026 |
| `/workshops/self-regulation/` | `/group-therapy/` | 301 | Old alias of the self-regulation program. | 11 Oct 2026 |
| `/workshops/circle-of-security-parenting-program/` | `/group-therapy/circle-of-security-parenting-program/` | 301 | Old alias of the Circle of Security page, which keeps its address (#14). | 11 Oct 2026 |
| `/workshops/` | `/group-therapy/#workshops` | 301 | Workshops archive. Workshops are a section of the group therapy page. | 11 Oct 2026 |
| `/external-workshop-expression-of-interest/` | `/group-therapy/#workshops` | 301 | Workshop expression-of-interest form. Workshops are a section of the group therapy page. | 11 Oct 2026 |
| `/relationship/` | `/therapy/couples/` (fallback `/therapy/`) | 301 | Relationship page. Couples and relationship therapy page (#11). | 11 Oct 2026 |
| `/child-psychologists/` | `/children/` (fallback `/therapy/`) | 301 | Child psychologists category. Child and adolescent hub (#6). | 11 Oct 2026 |
| `/ndis/` | `/ndis/` (fallback `/fees/#ndis`) | 301 | The Current Site's NDIS address, where the NDIS page lives (#13). A holding line: while that page is a draft, production sends visitors to the NDIS section of the fees page; once it is built the line is left out of `_redirects`. | 11 Oct 2026 |
| `/what-is-adhd/` | `/library/what-is-adhd/` | 301 | Short alias of the What is ADHD article. Points straight at the article, not through its old address. | 11 Oct 2026 |
| `/staff-member/dr-amelia-shay/` | `/team/amelia-shay/` | 301 | Staff profile. | 11 Oct 2026 |
| `/staff-member/dr-kaya-beinke/` | `/team/kaya-beinke/` | 301 | Staff profile. | 11 Oct 2026 |
| `/staff-member/letitia-mcvey/` | `/team/letitia-mcvey/` | 301 | Staff profile. | 11 Oct 2026 |
| `/staff-member/sahar-h-fattahi-general-psychologist/` | `/team/sahar-fattahi/` | 301 | Staff profile. | 11 Oct 2026 |
| `/staff-member/rani-banks/` | `/team/rani-banks/` | 301 | Staff profile. | 11 Oct 2026 |
| `/staff-member/jazmin-squire/` | `/team/jazmin-squire/` | 301 | Staff profile. | 11 Oct 2026 |
| `/staff-member/laura-storey-counsellor/` | `/team/laura-storey/` | 301 | Staff profile. | 11 Oct 2026 |
| `/staff-member/genevieve-hussey/` | `/team/genevieve-hussey/` | 301 | Staff profile. | 11 Oct 2026 |
| `/staff-member/natasha-senior-client-support/` | `/team/natasha/` | 301 | Staff profile (current address). | 11 Oct 2026 |
| `/staff-member/natasha-client-support-marketing/` | `/team/natasha/` | 301 | Staff profile (older address). | 11 Oct 2026 |
| `/staff-member/josie-administrative-support/` | `/team/josie/` | 301 | Staff profile. | 11 Oct 2026 |
| `/staff-member/reea-therapy-dog/` | `/team/reea/` | 301 | Staff profile. | 11 Oct 2026 |
| `/staff-member/samson-therapy-dog/` | `/team/samson/` | 301 | Staff profile. | 11 Oct 2026 |
| `/staff-member/ace/` | `/team/` | 301 | Profile of someone not on the new team page. | 11 Oct 2026 |
| `/staff-member/an-yang-provisional-psychologist/` | `/team/` | 301 | Profile of a former team member. | 11 Oct 2026 |
| `/staff-member/brooke-client-support-marketing/` | `/team/` | 301 | Profile of a former team member. | 11 Oct 2026 |
| `/staff-member/*` | `/team/` | 301 | Any other staff profile. | 11 Oct 2026 |
| `/category/child-psychologists/` | `/children/` (fallback `/therapy/`) | 301 | Child psychologists category. Child and adolescent hub (#6). | 11 Oct 2026 |
| `/category/relationship/` | `/therapy/couples/` (fallback `/therapy/`) | 301 | Relationship category. Couples page (#11). | 11 Oct 2026 |
| `/category/assessments/` | `/assessments/` | 301 | Assessments category. | 11 Oct 2026 |
| `/category/workshops/circle-of-security-parenting-program/` | `/group-therapy/circle-of-security-parenting-program/` | 301 | Circle of Security category. The page keeps its address (#14). | 11 Oct 2026 |
| `/category/workshops/self-regulation/` | `/group-therapy/` | 301 | Self-regulation category. | 11 Oct 2026 |
| `/category/workshops/` | `/group-therapy/#workshops` | 301 | Workshops category. | 11 Oct 2026 |
| `/category/*` | `/library/` | 301 | Every other post category (blog, news, therapy and their later pages) lands on the library. | 11 Oct 2026 |
| `/blogs/page/*` | `/library/` | 301 | Blog index pages 1 to 3. | 11 Oct 2026 |
| `/2023/*` | `/library/` | 301 | WordPress date archive. | 11 Oct 2026 |
| `/2024/*` | `/library/` | 301 | WordPress date archive. | 11 Oct 2026 |
| `/2025/*` | `/library/` | 301 | WordPress date archive. | 11 Oct 2026 |
| `/2026/*` | `/library/` | 301 | WordPress date archive. | 11 Oct 2026 |
