# pattapatta

Pen-plotter geometry library (inspired by [PGS](https://github.com/micycle1/PGS)): hatching, circle packing, boolean path ops, Voronoi, tilings, and SVG I/O for Node and the browser.

**Stroke marks only** — solid area fills are not the goal.

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
| `pattapatta/morphology` | Buffer, simplify, warps |
| `pattapatta/voronoi` | Voronoi cells |
| … | See `website/` API pages |

## Releasing

This repo uses [Changesets](https://github.com/changesets/changesets). Only the root `pattapatta` package is published; `website` is ignored.

1. In a PR that changes the library, run `pnpm changeset`, commit the file under `.changeset/`, and merge to `main`.
2. The **Release** workflow opens or updates a **Version Packages** PR (bumps version, updates `CHANGELOG.md`).
3. Merging that PR publishes to npm and creates a GitHub Release.

Repo secret required for publish: `NPM_TOKEN` (npm automation token with publish access).

The first automated release will bump from the current `0.1.0` (e.g. to `0.1.1` or higher) when you add a changeset. To put exactly `0.1.0` on npm once, run `pnpm release` locally after setting an npm token.

Local checks used by CI:

```bash
pnpm install --frozen-lockfile
pnpm test
pnpm typecheck
pnpm build
```

## License

MIT — clean-room implementation (not a GPL line-port of PGS). See `docs/decisions/`.
