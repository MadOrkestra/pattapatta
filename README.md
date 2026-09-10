# pattapatta

Pen-plotter geometry library (inspired by [PGS](https://github.com/micycle1/PGS)): hatching, circle packing, boolean path ops, Voronoi, tilings, and SVG I/O for Node and the browser.

**Stroke marks only** — solid area fills are not the goal.

## Documentation (SvelteKit PWA)

Consumer docs are a SvelteKit + shadcn-svelte app in [`website/`](./website/):

```bash
npm run docs:dev      # http://localhost:5173
npm run docs:build    # static build → website/build
npm run docs:examples # regenerate SVG figures into website/static/assets
```

Content is Markdown (mdsvex) with pictured API pages; installable offline via the service worker.

## Install

```bash
npm install pattapatta
```

## Usage

```ts
import { parseSvg, toSvg, union, createRect } from 'pattapatta'

const a = createRect(0, 0, 2, 1)
const b = createRect(1, 0, 2, 1)
const merged = union(a, b)
console.log(toSvg(merged))
```

```bash
npx pattapatta --help
```

## Status

Phases 1–6 of the library surface are in place (boolean, hatch, packing, morphology, hull, triangulation, Voronoi, tiling, meshing, …). See `docs/design/development-phases.md`. Internal research stays under `docs/`.
