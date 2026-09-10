---
title: "TypeScript npm library design"
status: active
owners: []
created: 2026-09-10
updated: 2026-09-10
version: 0.2.0
---

# TypeScript npm library design

## Context

`pattapatta` reimplements PGS geometric behaviour as an **installable Node.js / browser library**. Consumers import it from scripts and websites. Primary use is **pen-plotter graphics**: stroked paths only. Animation APIs are out of scope; full geometric facade parity is the long-term target, filtered by [pen-plotter constraints](../decisions/0002-pen-plotter-output.md).

## Goals

- Single publishable package: `pattapatta`.
- Works in Node and bundlers (ESM, types).
- SVG as primary interchange; portable geometry types internally.
- Tree-shakeable modules mirroring PGS facades.
- Optional CLI via package `bin`.
- Default exports suitable for plotting (`fill="none"`, stroke marks for area treatments).

## Non-goals

- Multi-package monorepo for consumers.
- Processing / PShape runtime in the published tarball.
- Animation / draw-loop helpers.
- Shipping the Processing oracle in npm.
- Solid area fills / screen-only paint as the primary output (see ADR 0002).

## Options considered

### Multi-package workspace (`@pattapatta/core`, `@pattapatta/svg`, …)

- Clear boundaries, heavier publish/version overhead for a new library.

### Single package with subpath exports (chosen)

- One `npm install pattapatta`.
- `exports` map for `"."`, `"./svg"`, and feature modules as needed.

## Proposal

### Layout

```
package.json          # name: pattapatta, type: module, exports, bin
src/
  index.ts
  types/              # Path, Vec2, Circle, Segment, Group
  svg/
  shapeBoolean/
  segmentSet/
  circlePacking/
  hatch/              # convenience helpers (not in PGS)
  morphology/
  contour/
  construction/
  hull/
  meshing/
  optimisation/
  pointSet/
  polygonisation/
  processing/
  predicates/
  tiling/
  transformation/
  triangulation/
  voronoi/
  coloring/
  conversion/
  cli.ts
dist/                 # ESM + .d.ts (tsup)
```

### Public import style

```ts
import {
  shapeBoolean,
  segmentSet,
  circlePacking,
  hatch,
  parseSvg,
  toSvg,
} from 'pattapatta'
```

### Geometry model

| Type | Meaning |
|------|---------|
| `Vec2` | `{ x, y }` |
| `Circle` | `{ x, y, r }` |
| `Segment` | `{ a: Vec2, b: Vec2 }` |
| `Path` | closed/open ring(s); holes as nested rings |
| `Group` | ordered list of paths (z-order for occlusion) |

### Build / package.json essentials

- `"type": "module"`
- `"exports"` with `import` + `types`
- `"files": ["dist", "README.md", "LICENSE"]`
- `"bin": { "pattapatta": "./dist/cli.js" }`
- Bundler: tsup or unbuild; vitest for tests
- `sideEffects: false`

### Engine stack

- Boolean / offset: `clipper2-ts`
- Rest: progressive ports per [pgs-dependencies.md](../research/pgs-dependencies.md)

## Open questions

- CJS dual build — only if a consumer requires it; ESM-first default.
- Package scope name — unscoped `pattapatta` unless npm name conflict.

## Next steps

- Phase 1 scaffold package + SVG round-trip.
- Expand modules per development phases.

## Document history

| Version | Date       | Author | Summary       |
|---------|------------|--------|---------------|
| 0.1.0   | 2026-09-10 | agent  | Initial design |
| 0.2.0   | 2026-09-10 | agent  | Pen-plotter stroke defaults |
