# hatch

**Fill** — plotter marks via clipped stroke patterns. See [Fills](/concepts/fills).

## Imports

```ts
import {
  hatchParallel, hatchCross, hatchWeave, hatchStochastic,
  hatchPerpendicular, hatchConcentric, hatch,
  type ParallelHatchOptions, type WeaveHatchOptions,
  type StochasticHatchOptions, type PerpendicularHatchOptions,
  type ConcentricHatchOptions,
} from 'pattapatta'
// or from 'pattapatta/hatch'
```

## `hatchParallel(path, options?: ParallelHatchOptions) → Segment[]`

| Option | Default | Meaning |
|--------|---------|---------|
| `angle` | `π/4` | Line direction (radians) |
| `spacing` | `0.15` | Perpendicular spacing |
| `count` | *auto* | Line count; omit to cover the whole path AABB |
| `length` | bbox diagonal | Pre-clip half-length |
| `center` | bbox center | Field center |

## `hatchCross(path, options?)`

Two perpendicular parallel fields.

## `hatchWeave(path, options?: WeaveHatchOptions) → Segment[]`

ABC fabric weave over the path AABB, clipped to the path.

| Option | Default | Meaning |
|--------|---------|---------|
| `cellSize` | ~1/12 shorter side | Grid cell size |
| `A` / `B` / `C` | `1` / `1` / `1` | Weft run / warp run / row shift |

## `hatchStochastic(path, options?: StochasticHatchOptions) → Segment[]`

Random non-intersecting segments in the AABB, clipped to the path.

| Option | Default | Meaning |
|--------|---------|---------|
| `count` | `40` | Segments before clip |
| `length` | — | Fixed length (overrides min/max) |
| `seed` | `1` | PRNG seed |

## `hatchPerpendicular(path, options?) → Segment[]`

Perimeter ticks centered on the boundary (outline texture, not area fill).

## `hatchConcentric(path, options?) → Path[]`

Nested inward offset shells as closed stroke paths.

## Examples

### Parallel

![Parallel hatch](/assets/hatch-parallel.svg)

```ts
const strokes = hatchParallel(createRect(15, 15, 70, 70), {
  spacing: 6, angle: Math.PI / 4,
})
```

### Cross

![Cross hatch](/assets/hatch-cross.svg)

```ts
const strokes = hatchCross(createRect(15, 15, 70, 70), { spacing: 8 })
```

### Weave

![Weave hatch](/assets/hatch-weave.svg)

```ts
const strokes = hatchWeave(createRect(15, 15, 70, 70), {
  cellSize: 8, A: 2, B: 2, C: 1,
})
```

### Stochastic

![Stochastic hatch](/assets/hatch-stochastic.svg)

```ts
const strokes = hatchStochastic(createRect(15, 15, 70, 70), {
  count: 50, length: 18, seed: 3,
})
```

### Concentric

![Concentric hatch](/assets/hatch-concentric.svg)

```ts
const shells = hatchConcentric(createRect(15, 15, 70, 70), {
  spacing: 6, count: 5,
})
```

Serialize segments with `toSvg(group(segmentsToOpenPaths(strokes)))`.
Concentric shells are already closed `Path`s — pass them to `group(shells)`.
