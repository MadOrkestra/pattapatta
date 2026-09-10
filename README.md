# pattapatta

Pen-plotter geometry library (inspired by [PGS](https://github.com/micycle1/PGS)): hatching, circle packing, boolean path ops, Voronoi, tilings, and SVG I/O for Node and the browser.

**Stroke marks only** — solid area fills are not the goal.

## Documentation (GitBook)

Consumer docs live in [`gitbook/`](./gitbook/) and are configured for GitBook via [`.gitbook.yaml`](./.gitbook.yaml).

| | |
|-|-|
| Quickstart | [gitbook/quickstart.md](./gitbook/quickstart.md) |
| Getting started | [gitbook/getting-started.md](./gitbook/getting-started.md) |
| API + pictures | [gitbook/SUMMARY.md](./gitbook/SUMMARY.md) |

Regenerate example SVGs:

```bash
npm run docs:examples
```

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

Phases 1–6 of the library surface are in place (boolean, hatch, packing, morphology, hull, triangulation, Voronoi, tiling, meshing, …). See `docs/design/development-phases.md`. Design research stays under `docs/`.
