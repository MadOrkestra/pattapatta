# Quickstart

Get a stroked SVG out of **pattapatta** in a few lines.

## Install

```bash
pnpm add pattapatta
```

Requires **Node ≥ 18** (ESM). Works in modern browsers via bundlers.

## Union two rectangles

```ts
import { createRect, union, toSvg } from 'pattapatta'

const a = createRect(10, 25, 50, 40)
const b = createRect(40, 35, 50, 40)
const merged = union(a, b)

console.log(toSvg(merged, { viewBox: '0 0 110 100', strokeWidth: 1.5 }))
```

![Boolean union](https://pattapatta.madorkestra.com/assets/boolean-union.svg)

## Union then hatch

Merge two rectangles, then fill the outline with parallel hatch strokes.

```ts
import {
  createRect,
  union,
  hatchParallel,
  segmentsToOpenPaths,
  group,
  toSvg,
} from 'pattapatta'

const a = createRect(10, 25, 50, 40)
const b = createRect(40, 35, 50, 40)
const merged = union(a, b)
const target = merged.paths[0]!
const strokes = segmentsToOpenPaths(
  hatchParallel(target, { spacing: 6, angle: Math.PI / 4 }),
)

console.log(
  toSvg(group([target, ...strokes]), {
    viewBox: '0 0 110 100',
    strokeWidth: 1,
  }),
)
```

![Union then hatch](https://pattapatta.madorkestra.com/assets/pipeline-union-hatch.svg)

## Hatch a shape

```ts
import {
  createRect,
  hatchParallel,
  segmentsToOpenPaths,
  group,
  toSvg,
} from 'pattapatta'

const cell = createRect(15, 15, 70, 70)
const strokes = hatchParallel(cell, { spacing: 6, angle: Math.PI / 4 })
const svg = toSvg(group(segmentsToOpenPaths(strokes)), {
  viewBox: '0 0 100 100',
  strokeWidth: 1,
})
```

![Parallel hatch](https://pattapatta.madorkestra.com/assets/hatch-parallel.svg)

## Pack circles

```ts
import { createRect, maximumInscribedPack } from 'pattapatta'

const cell = createRect(10, 10, 80, 80)
const circles = maximumInscribedPack(cell, 6, 0.5)
// circles: { x, y, r }[] — emit <circle> or approximate with polygons for toSvg
```

![Maximum inscribed packing](https://pattapatta.madorkestra.com/assets/packing-inscribed.svg)

## CLI

```bash
npx pattapatta --help
npx pattapatta svg:roundtrip input.svg -o output.svg
```

## Next

Continue with [Getting started](https://pattapatta.madorkestra.com/getting-started) for imports and mental model, or [Examples](https://pattapatta.madorkestra.com/examples) for more chained recipes.
