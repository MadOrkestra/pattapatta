# Examples

Compose **construct → boolean (or buffer) → fill → SVG**. “Fill” means hatch or packing — stroke marks only.

Try the same recipes interactively on [Live demos](/demos).

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
  hatchParallel(target, { spacing: 6, count: 40, angle: Math.PI / 4 }),
)

console.log(
  toSvg(group([target, ...strokes]), {
    viewBox: '0 0 110 100',
    strokeWidth: 1,
  }),
)
```

![Union then hatch](/assets/pipeline-union-hatch.svg)

## Frame → pack

Outer rectangle minus an inset hole, then a contained hex lattice inside the frame.

```ts
import {
  createRect,
  subtract,
  hexLatticePack,
} from 'pattapatta'

const outer = createRect(10, 10, 80, 80)
const hole = createRect(30, 30, 40, 40)
const frame = subtract(outer, hole)
const circles = hexLatticePack(frame.paths[0]!, 10, 'contained')
// circles: { x, y, r }[] — emit <circle fill="none"> or approximate with polygons
```

![Frame then hex pack](/assets/pipeline-frame-pack.svg)

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
  hatchCross(target, { spacing: 6, count: 40, angle: Math.PI / 4 }),
)

console.log(
  toSvg(group([target, ...strokes]), {
    viewBox: '0 0 100 100',
    strokeWidth: 1,
  }),
)
```

![Star cut then cross hatch](/assets/pipeline-star-cut-hatch.svg)

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
  hatchParallel(target, { spacing: 5, count: 40, angle: Math.PI / 5 }),
)

console.log(
  toSvg(group([target, ...strokes]), {
    viewBox: '0 0 100 100',
    strokeWidth: 1,
  }),
)
```

![Ring then hatch](/assets/pipeline-ring-hatch.svg)

## Next

- [Live demos](/demos) — tweak spacing, angle, and diameter
- [Getting started](/getting-started) — mental model and cut → hatch → pack
- [API reference](/api/shape-boolean) — per-module pictures
