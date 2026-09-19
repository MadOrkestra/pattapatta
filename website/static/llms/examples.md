# Examples

Compose **construct → boolean (or buffer) → fill → SVG**. “Fill” means hatch or packing — stroke marks only.

Try the same recipes interactively on [Live demos](https://pattapatta.madorkestra.com/demos).

## Union → hatch

Two overlapping rectangles, merge, then parallel hatch the result.

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

## Frame → pack

Outer rectangle minus an inset hole, then a hex lattice fill clipped to the frame.

```ts
import {
  createRect,
  subtract,
  hexLatticePack,
} from 'pattapatta'

const outer = createRect(10, 10, 80, 80)
const hole = createRect(30, 30, 40, 40)
const frame = subtract(outer, hole)
const circles = hexLatticePack(frame.paths[0]!, 10) // overlap fill — clip in SVG
// circles: { x, y, r }[] — emit <circle> inside a clipPath of the frame
```

![Frame then hex pack](https://pattapatta.madorkestra.com/assets/pipeline-frame-pack.svg)

## Star cut → hatch

A star with a circular hole, filled with cross hatch.

```ts
import {
  createStar,
  createCircle,
  subtract,
  hatchCross,
  segmentsToOpenPaths,
  group,
  toSvg,
} from 'pattapatta'

const star = createStar(50, 50, 38, 16, 5)
const hole = createCircle(50, 50, 14)
const cut = subtract(star, hole)
const target = cut.paths[0]!
const strokes = segmentsToOpenPaths(
  hatchCross(target, { spacing: 6, angle: Math.PI / 4 }),
)

console.log(
  toSvg(group([target, ...strokes]), {
    viewBox: '0 0 100 100',
    strokeWidth: 1,
  }),
)
```

![Star cut then cross hatch](https://pattapatta.madorkestra.com/assets/pipeline-star-cut-hatch.svg)

## Ring → hatch

Buffer a circle outward, subtract a smaller disk, hatch the annulus.

```ts
import {
  createCircle,
  buffer,
  subtract,
  hatchParallel,
  segmentsToOpenPaths,
  group,
  toSvg,
} from 'pattapatta'

const seed = createCircle(50, 50, 28)
const outer = buffer(seed, 8).paths[0]!
const inner = createCircle(50, 50, 18)
const ring = subtract(outer, inner)
const target = ring.paths[0]!
const strokes = segmentsToOpenPaths(
  hatchParallel(target, { spacing: 5, angle: Math.PI / 5 }),
)

console.log(
  toSvg(group([target, ...strokes]), {
    viewBox: '0 0 100 100',
    strokeWidth: 1,
  }),
)
```

![Ring then hatch](https://pattapatta.madorkestra.com/assets/pipeline-ring-hatch.svg)

## Triangulation

Delaunay, earcut, Poisson Steiner Delaunay, and Ruppert-inspired refine on a star.

```ts
import {
  createStar,
  delaunayTriangulation,
  earCutTriangulation,
  poissonTriangulation,
  refine,
} from 'pattapatta'

const star = createStar(50, 50, 38, 16, 5)
const delaunay = delaunayTriangulation(star)
const earcut = earCutTriangulation(star)
const poisson = poissonTriangulation(star, 6, 4)
const refined = refine(star, { minAngle: Math.PI / 4, maxIterations: 200 })
```

### Delaunay

![Delaunay star](https://pattapatta.madorkestra.com/assets/triangulation-delaunay.svg)

### Earcut

![Earcut star](https://pattapatta.madorkestra.com/assets/triangulation-earcut.svg)

### Poisson Delaunay

![Poisson Delaunay star](https://pattapatta.madorkestra.com/assets/triangulation-poisson.svg)

### Refine

![Refine star](https://pattapatta.madorkestra.com/assets/triangulation-refine.svg)

## Points → shortest tour

Poisson samples connected by an approximate TSP tour — a stroke fill through the point set.

```ts
import { poisson, findShortestTour, toSvg } from 'pattapatta'

const pts = poisson(14, 10, 10, 90, 90, 8)
const tour = findShortestTour(pts)
console.log(toSvg(tour, { viewBox: '0 0 100 100', strokeWidth: 1.2 }))
```

![Points then shortest tour](https://pattapatta.madorkestra.com/assets/pointset-shortest-tour.svg)

## Next

- [Live demos](https://pattapatta.madorkestra.com/demos) — tweak spacing, angle, and diameter
- [Getting started](https://pattapatta.madorkestra.com/getting-started) — mental model and cut → hatch → pack
- [API reference](https://pattapatta.madorkestra.com/api/shape-boolean) — per-module pictures
