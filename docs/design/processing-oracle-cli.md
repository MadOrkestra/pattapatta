---
title: "Processing oracle CLI"
status: active
owners: []
created: 2026-09-10
updated: 2026-09-10
version: 0.2.0
---

# Processing oracle CLI

## Context

Validate `pattapatta` against real PGS by running a headless Processing project from the shell that writes SVG and JSON goldens.

## Goals

- Runnable without the Processing IDE.
- Shared fixtures with TypeScript tests.
- Export **SVG** (visual) and **JSON** (numeric) per case.
- Documented env setup for Processing 4 + Geometry Suite for Processing (PGS).

## Non-goals

- Publishing the oracle inside the npm package.
- Pixel matching of animated README GIFs.

## Options considered

### IDE-only sketches

- Poor automation.

### Headless Processing / Java main exporting files (chosen)

- Scriptable via `run-oracle.sh`.

## Proposal

### Layout

```
oracle/processing/
  README.md
  sketch/
    OracleMain.pde
    cases/
      BooleanCases.pde
      HatchCases.pde
      PackingCases.pde
      OcclusionCases.pde
    export/
      JsonExport.pde
      SvgExport.pde
  scripts/
    run-oracle.sh
```

### CLI

```bash
./oracle/processing/scripts/run-oracle.sh --out tests/oracle --all
./oracle/processing/scripts/run-oracle.sh --out tests/oracle --suite hatch --case parallel-45
./oracle/processing/scripts/run-oracle.sh --suite boolean --compare
```

Suggested flags:

| Flag | Meaning |
|------|---------|
| `--out <dir>` | Golden root (default `tests/oracle`) |
| `--fixtures <dir>` | Input fixtures (default `tests/fixtures`) |
| `--suite <name>` | `boolean` \| `hatch` \| `packing` \| `occlusion` \| … |
| `--case <id>` | Single case id |
| `--all` | All registered cases |
| `--seed <n>` | Override RNG seed |
| `--compare` | After export, run TS candidate + comparator (optional) |

### Runtime behaviour

1. Resolve `PROCESSING_JAVA` / `PROCESSING_PATH` (documented in oracle README).
2. Ensure PGS library is on the sketch `code/` or sketchbook `libraries` path.
3. Launch sketch in batch mode (`--sketch` / Java classpath approach as available on the machine).
4. Sketch: `noLoop()`, load fixture, call PGS, write `<out>/<suite>/<case>.json` + `.svg`, `exit()`.

### Export rules

- JSON schema: see [pgs-comparison-harness.md](./pgs-comparison-harness.md).
- SVG: fixed `viewBox`, **stroke only** (`fill="none"`), stable stroke (`#000`, width 1), no CSS animation — plotter-oriented goldens.
- Coordinates: same world space as fixtures (no unexplained canvas offsets).
- Circles serialized as `{ "x", "y", "r" }` (PGS `PVector.z` → `r`).

### First smoke cases (Phase 1b)

| Suite | Case | PGS calls |
|-------|------|-----------|
| boolean | `union-two-rects` | `union` |
| boolean | `subtract-two-rects` | `subtract` |
| boolean | `occlusion-two-rects` | `occlusionSubtract` |
| hatch | `parallel-45-unit-square` | `parallelSegments` + `intersect` |

### Comparison wiring

```mermaid
flowchart LR
  fixtures[tests_fixtures] --> oracle[oracle_processing]
  fixtures --> lib[pattapatta]
  oracle --> gold[tests_oracle]
  lib --> cand[candidate_json_svg]
  gold --> cmp[comparators]
  cand --> cmp
```

## Open questions

- Exact Processing 4 CLI flags on macOS once the user’s install path is known.
- Whether to vendor a PGS jar under `oracle/processing/lib` (license: GPL — OK for oracle tooling, keep out of npm pack).

## Next steps

- Phase 1b: scaffold sketch + script; confirm run with user’s Processing install.
- Expand cases as modules land.

## Document history

| Version | Date       | Author | Summary       |
|---------|------------|--------|---------------|
| 0.1.0   | 2026-09-10 | agent  | Initial design |
| 0.2.0   | 2026-09-10 | agent  | Plotter SVG: fill none |
