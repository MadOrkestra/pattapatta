# segmentSet

Generate and filter infinite-style segment fields (PGS hatching building blocks).

## Imports

```ts
import {
  parallelSegments, filterByMinLength, filterAxisAligned,
  segmentLength, segmentsToOpenPaths, clipSegmentsToPath,
  segmentSet,
} from 'pattapatta'
```

## Functions

| Function | Description |
|----------|-------------|
| `parallelSegments(…)` | Parallel line field (float32-compatible spacing) |
| `filterByMinLength(segs, min)` | Drop short segments |
| `filterAxisAligned(segs)` | Keep H/V only |
| `segmentLength(seg)` | Length |
| `segmentsToOpenPaths(segs)` | Convert to open `Path`s for `toSvg` |
| `clipSegmentToPath` / `clipSegmentsToPath` | Clip lines to a polygon |

Prefer the [hatch](/api/hatch) helpers for filled regions.
