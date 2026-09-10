---
title: "Development phases"
status: active
owners: []
created: 2026-09-10
updated: 2026-09-10
version: 0.2.0
---

# Development phases

## Context

Full geometric PGS parity as an npm library, delivered in phases. Animation stays out of scope. Fills / boolean / packing land early; remaining facades complete later.

## Goals

- Clear exit criteria per phase.
- Oracle comparison from Phase 1b onward.
- Inventory checklist ([pgs-api-inventory.md](../research/pgs-api-inventory.md)) as final gate.

## Non-goals

- Shipping animation demos.
- Perfect bit-identical JTS output.

## Proposal

| Phase | Scope | Exit criteria |
|-------|--------|----------------|
| **0** | Research & design docs (this folder) | Docs present with document history; inventory covers 19 facades |
| **1** | npm scaffold: exports, types, Path/Vec, SVG I/O, `bin` stub, vitest | `npm pack` + import smoke; SVG round-trip tests green |
| **1b** | `oracle/processing` + `run-oracle.sh`; boolean + hatch smoke | CLI writes SVG+JSON under `tests/oracle/`; README for Processing path |
| **2** | `shapeBoolean` + `predicates` | Oracle JSON compare within tolerance |
| **3** | `segmentSet` + `hatch` helpers | Hatch oracle cases pass |
| **4** | `circlePacking` (full module) | Seeded packing oracle pass |
| **5** | `morphology` (static), `contour`, `processing`, `transformation`, `conversion` | Module tests + oracle samples |
| **6** | Remaining: hull, triangulation, voronoi, meshing, tiling, construction, pointSet, polygonisation, optimisation, coloring | Inventory methods implemented or explicitly deferred with ADR |
| **7** | Consumer docs, harden exports, website import sample, publish prep | README install examples; pack excludes oracle |

### Priority reminder

P0 modules (boolean, segmentSet, circlePacking, occlusion) unlock the product story. P1/P2 complete parity.

### Testing policy

- Unit tests every phase.
- Oracle goldens for geometric ops as suites appear.
- No Processing required in default `npm test` (uses committed goldens).

### Git / commit policy

- Develop on **`main`** (no long-lived feature branches unless something truly needs isolation).
- **Commit regularly** to `main` as coherent units of work land — not only at phase end.
- Prefer small commits with a clear why (e.g. scaffold package, add SVG round-trip tests, implement `shapeBoolean.union`).
- Commit when a chunk is green locally (`npm test` / typecheck for touched areas), or when docs/research are a finished batch.
- Do **not** leave large uncommitted Phase work sitting for long stretches; checkpoint after each meaningful slice.
- Still follow normal safety: no secrets in commits; do not force-push `main`.

Suggested checkpoint rhythm within a phase:

1. Scaffold / config → commit  
2. Types or module stub → commit  
3. Implementation + tests green → commit  
4. Docs touch-up for that slice → commit (if any)

## Open questions

- Publish cadence (per phase vs after Phase 6).

## Next steps

- Phase 7: README consumer examples, publish prep; remaining exotic inventory methods deferred with notes.

## Document history

| Version | Date       | Author | Summary                        |
|---------|------------|--------|--------------------------------|
| 0.1.0   | 2026-09-10 | agent  | Initial roadmap                |
| 0.2.0   | 2026-09-10 | agent  | Regular commits to main policy |
