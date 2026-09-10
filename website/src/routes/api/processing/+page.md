# processing

Perimeter extracts, densify, slice, and point sampling.

## Imports

```ts
import {
  extractPerimeter, extractBoundary, extractHoles, densify,
  removeSmallHoles, generateRandomPoints, generateRandomGridPoints,
  pointsOnExterior, segmentsOnExterior, slice, centroidSplit,
  dissolve, intersectionPoints, processing,
} from 'pattapatta'
```

## Functions

| Function | Description |
|----------|-------------|
| `extractPerimeter` / `extractBoundary` | Exterior only |
| `extractHoles` | Hole paths |
| `densify(path, maxSegLen)` | Insert vertices |
| `removeSmallHoles(path, minArea)` | Drop tiny holes |
| `generateRandomPoints(path, n, seed?)` | Seeded interior samples |
| `generateRandomGridPoints(path, spacing)` | Grid filter |
| `pointsOnExterior` / `segmentsOnExterior` | Boundary samples / edges |
| `slice(path, a, b)` | Cut by infinite line through `a→b` |
| `centroidSplit` | Vertical cut through centroid |
| `dissolve(paths)` | `unionAll` |
| `intersectionPoints(a, b)` | Boundary crossings |

## Example — slice

![Slice](/assets/processing-slice.svg)

```ts
const pieces = slice(createRect(15, 15, 70, 70), vec2(10, 20), vec2(90, 80))
```
