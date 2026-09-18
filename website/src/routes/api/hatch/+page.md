# hatch

**Fill** — plotter marks via clipped parallel / cross hatch strokes. See [Fills](/concepts/fills).

## Imports

```ts
import { hatchParallel, hatchCross, hatch } from 'pattapatta'
// or from 'pattapatta/hatch'
```

## `hatchParallel(path, options?) → Segment[]`

| Option | Default | Meaning |
|--------|---------|---------|
| `angle` | `π/4` | Line direction (radians) |
| `spacing` | `0.15` | Perpendicular spacing |
| `count` | *auto* | Line count; omit to cover the whole path AABB |
| `length` | bbox diagonal | Pre-clip half-length |
| `center` | bbox center | Field center |

## `hatchCross(path, options?)`

Two perpendicular parallel fields.

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

Serialize with `toSvg(group(segmentsToOpenPaths(strokes)))`.
