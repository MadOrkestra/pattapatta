# pattapatta

Pen-plotter geometry library (inspired by [PGS](https://github.com/micycle1/PGS)): hatching, circle packing, triangulation / meshing, boolean path ops, Voronoi, tilings, and SVG I/O for Node and the browser.

**Stroke marks only** — solid area fills are not the goal.

> **Status:** Built entirely with AI as an experiment. **Not meant for public / production use yet.** Feedback welcome via [GitHub issues](https://github.com/MadOrkestra/pattapatta/issues) on the [repository](https://github.com/MadOrkestra/pattapatta).

[![npm](https://img.shields.io/npm/v/pattapatta.svg)](https://www.npmjs.com/package/pattapatta)

## Install

```bash
pnpm add pattapatta
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
pnpm dlx pattapatta --help
pnpm dlx pattapatta svg:roundtrip in.svg -o out.svg
```

## Docs site

Live: [pattapatta.madorkestra.com](https://pattapatta.madorkestra.com) (GitHub Pages; deploys on push to `main`).

Local documentation PWA (SvelteKit + shadcn):

```bash
pnpm install
pnpm docs:dev
pnpm docs:build
pnpm docs:examples   # regenerate SVG figures
```

## Modules

| Import | Role |
|--------|------|
| `pattapatta` | Types, SVG, all facades |
| `pattapatta/shapeBoolean` | Union / intersect / subtract / occlusion |
| `pattapatta/hatch` | Parallel / cross hatch fills |
| `pattapatta/circlePacking` | Lattices (`overlap` \| `contained`), LEC, stochastic |
| `pattapatta/triangulation` | Earcut, Delaunay, Poisson Steiner, refine |
| `pattapatta/morphology` | Buffer, simplify, warps |
| `pattapatta/meshing` | Graph faces, quadrangulation, mesh process / repair |
| `pattapatta/voronoi` | Voronoi cells |
| … | See `website/` API pages |

## License

MIT — clean-room implementation (not a GPL line-port of PGS). See `docs/decisions/`.

Source: [github.com/MadOrkestra/pattapatta](https://github.com/MadOrkestra/pattapatta) · [Issues](https://github.com/MadOrkestra/pattapatta/issues)
