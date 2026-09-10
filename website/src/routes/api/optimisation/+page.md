# optimisation

Inscribed / bounding circles and distance queries.

## Imports

```ts
import {
  envelope, maximumInscribedCircle, largestEmptyCircle, largestEmptyCircles,
  maximumInscribedAARectangle, closestPoint, closestVertex,
  closestPointPair, farthestPointPair, minimumBoundingCircle,
  optimisation,
} from 'pattapatta'
```

## Functions

| Function | Description |
|----------|-------------|
| `envelope(path)` | AABB polygon |
| `maximumInscribedCircle` / `largestEmptyCircle` | MIC / LEC |
| `largestEmptyCircles` | Pack until min radius |
| `maximumInscribedAARectangle` | Heuristic AA inset rect |
| `closestPoint` / `closestVertex` | On boundary / vertices |
| `closestPointPair` / `farthestPointPair` | Among a point set |
| `minimumBoundingCircle` | Welzl on hull |

## Examples

### Maximum inscribed circle

![MIC](/assets/optimisation-mic.svg)

### Minimum bounding circle

![MBC](/assets/optimisation-mbc.svg)
