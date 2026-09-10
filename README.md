# pattapatta

Pen-plotter geometry library (inspired by [PGS](https://github.com/micycle1/PGS)): hatching, circle packing, boolean path ops, Voronoi, tilings, and SVG I/O for Node and the browser.

**Stroke marks only** — solid area fills are not the goal.

[![npm](https://img.shields.io/npm/v/pattapatta.svg)](https://www.npmjs.com/package/pattapatta)

## Install

```bash
npm install pattapatta
```

Requires **Node ≥ 18** (ESM). Works in modern browsers via bundlers.

## Quick example

```ts
import { createRect, union, hatchParallel, toSvg, group, segmentsToOpenPaths } from 'pattapatta'

const a = createRect(0, 0, 2, 1)
const b = createRect(1, 0, 2, 1)
const merged = union(a, b)
const strokes = hatchParallel(merged.paths[0]!, { spacing: 0.08, count: 40 })
console.log(toSvg(group(segmentsToOpenPaths(strokes))))
```

```bash
npx pattapatta --help
npx pattapatta svg:roundtrip in.svg -o out.svg
```

## Docs site

Local documentation PWA (SvelteKit + shadcn):

```bash
npm run docs:dev
npm run docs:build
npm run docs:examples   # regenerate SVG figures
```

## Modules

| Import | Role |
|--------|------|
| `pattapatta` | Types, SVG, all facades |
| `pattapatta/shapeBoolean` | Union / intersect / subtract / occlusion |
| `pattapatta/hatch` | Parallel / cross hatch fills |
| `pattapatta/circlePacking` | Lattices (`overlap` \| `contained`), LEC, stochastic |
| `pattapatta/morphology` | Buffer, simplify, warps |
| `pattapatta/voronoi` | Voronoi cells |
| … | See `website/` API pages |

## License

MIT — clean-room implementation (not a GPL line-port of PGS). See `docs/decisions/`.
