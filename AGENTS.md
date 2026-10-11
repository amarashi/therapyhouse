# Therapy House — Agent Instructions

A static, browser-served experience: `index.html`, one stylesheet, ES modules in
`assets/scripts/`, media in `assets/`. No bundler, framework, package manager, or
build step. See [CODEBASE.md](CODEBASE.md) for the file-by-file layout and how to
preview the site locally.

## Agent skills

### Issue tracker

Issues live in GitHub Issues for `amarashi/therapyhouse`, driven via the `gh` CLI.
External pull requests are not a triage surface. See `docs/agents/issue-tracker.md`.

### Triage labels

Canonical vocabulary, used verbatim: `needs-triage`, `needs-info`, `ready-for-agent`,
`ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context — one `CONTEXT.md` and `docs/adr/` at the repo root.
See `docs/agents/domain.md`.

## Design context

Read [PRODUCT.md](PRODUCT.md) (strategy: who/what/why) and [DESIGN.md](DESIGN.md)
(visual system: colours, type, components) before changing anything a visitor sees.

Register is **brand**, platform **web**. Three audiences (in full in PRODUCT.md):
local parents looking for help for their child, adults anywhere in Australia
seeing a psychologist by video (telehealth), and adults seeking help for
themselves. What blocks them is credibility, not price. Service, assessment,
telehealth, town and fee pages are plain pages, never rooms. The five
principles, in full in PRODUCT.md:

- House to arrive, plain to read — atmosphere never taxes the answer
- Never make a worried parent wait — ambient things stay skippable and off the critical path
- Credibility is carried by people — team content is load-bearing
- Show the place, don't claim it — "warm" and "not clinical" are never asserted in copy
- Something to find in every room — discovery decorates content, never hides it

`.impeccable/design.json` is the machine-readable sidecar (tonal ramps, shadow and
motion tokens, component snippets). Regenerate both with `/impeccable document`.
