---
title: "llms.txt for AI consumers"
status: active
owners: []
created: 2026-09-19
updated: 2026-09-19
version: 1.0.0
---

# llms.txt for AI consumers

## Context

External agents and coding assistants need a stable, markdown-first entry point to the public API. The docs site is HTML (SvelteKit + mdsvex); [llmstxt.org](https://llmstxt.org) defines a small index file plus linked markdown pages.

## Goals

- Ship `/llms.txt` (curated index) and `/llms-full.txt` (full dump of public docs)
- Keep those files in sync with user-facing website Markdown
- Avoid a third hand-maintained API reference

## Non-goals

- Generating docs from TypeScript JSDoc (website `+page.md` is the source of truth)
- Including internal `docs/` research/ADRs in the full dump (linked under Optional only)
- Including the human explainer page `/llms-txt` inside `llms-full.txt`

## Proposal

1. **Generator:** [`scripts/generate-llms-txt.mjs`](../../scripts/generate-llms-txt.mjs) reads a fixed manifest of `website/src/routes/**/+page.md` files, rewrites site-relative links to absolute `https://pattapatta.madorkestra.com/...`, and writes:
   - `website/static/llms.txt`, `website/static/llms-full.txt`, `website/static/llms/*.md`
   - repo-root `llms.txt`, `llms-full.txt` (same content, for clone/GitHub agents)
2. **Scripts:** `pnpm docs:llms`, `pnpm docs:llms:check`, hooked from `docs:build` and `docs:examples`.
3. **Human page:** `/llms-txt` in the Start here sidebar explains the files and links to them.
4. **CI:** `docs:llms:check` in `.github/workflows/ci.yml` catches forgotten regenerations.

### Sync workflow (maintainers)

1. Edit website Markdown (API / concepts / quickstart / examples) and nav if needed.
2. If you add a **new** docs page that should appear in the AI dump, add it to the generator manifest.
3. Run `pnpm docs:llms` (or `docs:build` / `docs:examples`).
4. Commit regenerated `llms.txt`, `llms-full.txt`, and `website/static/llms/*`.
5. Never hand-edit generated outputs.

## Open questions

- None for v1.

## Next steps

- When adding a new public API module page: update the generator manifest and `website/src/lib/nav.ts`.

## Document history

| Version | Date       | Author | Summary                          |
|---------|------------|--------|----------------------------------|
| 1.0.0   | 2026-09-19 | Auto   | Initial active design            |
