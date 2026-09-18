# pointSet

Point distributions, pruning, spatial ordering, and tours.

## Imports

```ts
import {
  randomPoints, squareGrid, hexGrid, pointRing,
  poisson, prunePointsWithinDistance,
  hilbertSort, findShortestTour, pointSet,
} from 'pattapatta'
```

## Functions

| Function | Description |
|----------|-------------|
| `randomPoints(n, minX, minY, maxX, maxY, seed?)` | Uniform box samples |
| `squareGrid` / `hexGrid` | Lattices in a box |
| `pointRing(count, center, radius)` | Circle samples |
| `poisson(minDist, …, seed?)` | Bridson-style Poisson disk |
| `prunePointsWithinDistance(pts, minDist)` | Greedy thinning |
| `hilbertSort(pts)` | Order by 2D Hilbert index (spatial locality) |
| `findShortestTour(pts)` | Approximate TSP tour (NN + 2-opt), closed path |

## Example — Poisson

![Poisson](/assets/pointset-poisson.svg)

```ts
const pts = poisson(14, 10, 10, 90, 90, 8)
```

## Example — Hilbert sort

Connect points in Hilbert order for a locality-preserving stroke path.

![Hilbert sort](/assets/pointset-hilbert-sort.svg)

```ts
import { hilbertSort, polyline, poisson } from 'pattapatta'

const pts = poisson(14, 10, 10, 90, 90, 8)
const ordered = hilbertSort(pts)
const stroke = polyline(ordered) // open path fill mark
```

## Example — Shortest tour

Closed tour visiting every point once (stroke fill / stipple connect).

![Shortest tour](/assets/pointset-shortest-tour.svg)

```ts
import { findShortestTour, poisson } from 'pattapatta'

const pts = poisson(14, 10, 10, 90, 90, 8)
const tour = findShortestTour(pts) // closed Path
```
