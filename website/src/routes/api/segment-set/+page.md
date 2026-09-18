# segmentSet

Generate and filter infinite-style segment fields (PGS hatching building blocks).

## Imports

```ts
import {
  parallelSegments, weaveSegments, stochasticSegments,
  perpendicularPathSegments,
  filterByMinLength, filterAxisAligned,
  segmentLength, segmentsToOpenPaths, clipSegmentsToPath,
  segmentSet,
} from 'pattapatta'
```

## Functions

| Function | Description |
|----------|-------------|
| `parallelSegments(…)` | Parallel line field (float32-compatible spacing) |
| `weaveSegments(w, h, cellSize, A, B, C, opts?)` | ABC fabric H/V runs in a box |
| `stochasticSegments(w, h, n, minLen?, maxLen?, seed?, ox?, oy?)` | Random non-intersecting segments |
| `perpendicularPathSegments(path, spacing, length, startOffset?)` | Perimeter-normal ticks |
| `filterByMinLength(segs, min)` | Drop short segments |
| `filterAxisAligned(segs)` | Drop near-axis-aligned segments |
| `segmentLength(seg)` | Length |
| `segmentsToOpenPaths(segs)` | Convert to open `Path`s for `toSvg` |
| `clipSegmentToPath` / `clipSegmentsToPath` | Clip lines to a polygon |

## Example

Raw `parallelSegments` field (muted) clipped to a circle (accent):

![Parallel segments clipped to a circle](/assets/segment-set-parallel.svg)

```ts
const cell = createCircle(50, 50, 32, 64)
const raw = parallelSegments(50, 50, 55, 7, Math.PI / 5, 18)
const clipped = clipSegmentsToPath(raw, cell)
```

Prefer the [hatch](/api/hatch) helpers for filled regions.
