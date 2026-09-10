---
title: "PGS comparison harness"
status: active
owners: []
created: 2026-09-10
updated: 2026-09-10
version: 0.1.0
---

# PGS comparison harness

## Context

`pattapatta` must be validated against Processing + PGS. Shared fixtures feed both sides; goldens are SVG + JSON.

## Goals

- Deterministic, regenerable goldens.
- Numeric comparison (primary) and SVG visual review (secondary).
- Documented tolerances for Clipper2 vs JTS differences.

## Non-goals

- Pixel-perfect GIF parity with PGS README animations.
- Requiring Processing in CI (local/oracle regenerates; CI uses committed goldens).

## Options considered

### SVG-only goldens

- Easy to eyeball; weak for numeric CI.

### JSON geometry + SVG (chosen)

- JSON for asserts; SVG for humans.

## Proposal

### Directory layout

```
tests/
  fixtures/
    boolean/
      two-rects.json
    hatch/
      unit-square.json
    packing/
      blob.json
  oracle/                 # committed goldens from Processing
    boolean/
      union-two-rects.json
      union-two-rects.svg
  candidates/             # gitignored local TS output (optional)
```

### Fixture schema (input)

```json
{
  "id": "boolean/union-two-rects",
  "seed": 1,
  "operation": "shapeBoolean.union",
  "inputs": {
    "paths": [
      { "rings": [[[0,0],[2,0],[2,1],[0,1]]] },
      { "rings": [[[1,0],[3,0],[3,1],[1,1]]] }
    ]
  }
}
```

### Oracle / candidate output schema

```json
{
  "id": "boolean/union-two-rects",
  "seed": 1,
  "operation": "shapeBoolean.union",
  "outputs": {
    "paths": [{ "rings": [/* ... */] }],
    "lines": [],
    "circles": [],
    "scalars": { "area": 4.0 }
  }
}
```

### Comparators

| Kind | Metric | Default tolerance (starting point) |
|------|--------|--------------------------------------|
| Polygons | Area relative error | `1e-3` |
| Polygons | Hausdorff distance (sampled) | `1e-2` (world units) |
| Lines | Endpoint multiset match after sort | `1e-2` |
| Circles | Multiset match on `(x,y,r)` | `1e-2` / `1e-2` |
| Scalars | Absolute/relative | case-specific |

Tighten per suite once Clipper scale is fixed.

### Flow

1. Author fixture under `tests/fixtures/`.
2. Run Processing oracle → write `tests/oracle/...`.
3. Run `pattapatta` on same fixture → candidate JSON/SVG.
4. Comparator test fails if outside tolerance.

See also [processing-oracle-cli.md](./processing-oracle-cli.md).

## Open questions

- Exact Clipper2 scale factor for fixtures in unit square vs pixel space.
- Whether to normalize winding before compare.

## Next steps

- Implement comparator utilities in Phase 2.
- Add first boolean + hatch fixture pairs with Phase 1b oracle.

## Document history

| Version | Date       | Author | Summary       |
|---------|------------|--------|---------------|
| 0.1.0   | 2026-09-10 | agent  | Initial design |
