# Fills

In **pattapatta**, a **fill** is stroke mark-making inside a region — not solid CSS/SVG paint. Emit with `fill="none"` and a visible stroke. See [Pen-plotter output](/concepts/pen-plotter).

Typical pipeline: **construct → [operate](/concepts/operations) → fill → SVG**.

## Primary fills

| Module | Marks |
|--------|-------|
| [hatch](/api/hatch) | Parallel or cross hatch strokes |
| [circlePacking](/api/circle-packing) | Circles packed in a region |
| [segmentSet](/api/segment-set) | Low-level hatch building blocks |

```ts
import { createRect, hatchParallel, segmentsToOpenPaths } from 'pattapatta'

const region = createRect(15, 15, 70, 70)
const strokes = segmentsToOpenPaths(
  hatchParallel(region, { spacing: 6, angle: Math.PI / 4 }),
)
```

## Also fill-like

| Module | Marks |
|--------|-------|
| [tiling](/api/tiling) | Cell boundaries as stroke patterns |
| [contour](/api/contour) | Offset curves (inward / outward) |

## Try it

Chained recipes on [Examples](/examples); interactive hatch and packing under [Live demos](/demos).
