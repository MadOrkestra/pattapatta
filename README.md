# pattapatta

Pen-plotter geometry library (inspired by [PGS](https://github.com/micycle1/PGS)): hatching, circle packing, boolean path ops, and SVG I/O for Node and the browser.

**Stroke marks only** — solid area fills are not the goal. See `docs/decisions/0002-pen-plotter-output.md`.

## Install

```bash
npm install pattapatta
```

## Usage

```ts
import { parseSvg, toSvg, union, polygon, vec2 } from 'pattapatta'

const a = polygon([vec2(0, 0), vec2(2, 0), vec2(2, 1), vec2(0, 1)])
const b = polygon([vec2(1, 0), vec2(3, 0), vec2(3, 1), vec2(1, 1)])
const merged = union(a, b)
console.log(toSvg(merged))
```

```bash
npx pattapatta --help
```

## Status

- Phase 1: geometry types + SVG round-trip
- Phase 1b: Processing oracle (`oracle/processing/OracleMain`)
- Phase 2: `shapeBoolean` + predicates (Clipper2), oracle-compared
- Phase 3: `segmentSet` + `hatch` (parallel/cross), oracle-compared

Design notes live in `docs/`.
