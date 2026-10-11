# Redirects inside the Rebuild

Addresses the Rebuild itself has moved. These are inputs to the launch redirect
map (gap register R-24), which also has to forward every Current Site address.
On GitHub Pages, Astro's `redirects` setting in `astro.config.mjs` writes a page
that forwards the visitor. On Cloudflare each line below must become a real
301 (permanent) redirect in `public/_redirects` or Bulk Redirects.

| From | To | Status | Why | Added |
|---|---|---|---|---|
| `/services/` | `/therapy/` | 301 | The Services floor became the Therapy hub (issue #4). The fee table has since moved to `/fees/`, linked from `/therapy/` (issue #30). | 11 Oct 2026 |
| `/policy/` | `/fees/#cancellation` | 301 | The Current Site's cancellation policy address. The policy is now a section of `/fees/` (issue #30). | 11 Oct 2026 |
| `/assessments/is-your-child-learning-to-the-best-of-their-capacity/` | `/library/is-your-child-learning-to-the-best-of-their-capacity/` | 301 | Library article migrated from the Current Site (issue #39). | 11 Oct 2026 |
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
