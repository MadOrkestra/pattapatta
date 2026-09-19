# triangulation

Polygon and point-set triangulations.

## Imports

```ts
import {
  earCutTriangulation,
  delaunayTriangulation,
  delaunayTriangulationPoints,
  poissonTriangulation,
  poissonTriangulationPoints,
  refine,
  triangulation,
  type RefineOptions,
} from 'pattapatta'
```

## Functions

| Function | Description |
|----------|-------------|
| `earCutTriangulation(path, opts?)` | Clipper2 triangulate (holes OK) |
| `delaunayTriangulation(path)` | Same with `useDelaunay: true` |
| `delaunayTriangulationPoints(points)` | d3-delaunay triangles |
| `poissonTriangulation(path, minDist, seed?)` | Delaunay with Poisson Steiner points inside the path |
| `poissonTriangulationPoints(path, minDist, seed?)` | Boundary + Steiner point set only |
| `refine(path, opts?)` | Ruppert-inspired angle refinement (approximate) |

`refine` options (`RefineOptions`): `minAngle` (radians, default ≈20°), `maxIterations` (default 200).

Try interactive controls on [Live demos](https://pattapatta.madorkestra.com/demos).

## Examples

Uses a star polygon (this repo has no maple-leaf constructor).

### Delaunay

![Delaunay](https://pattapatta.madorkestra.com/assets/triangulation-delaunay.svg)

### Earcut

![Earcut](https://pattapatta.madorkestra.com/assets/triangulation-earcut.svg)

### Poisson Delaunay

Delaunay triangulation where Steiner points from Poisson-disk sampling are inserted.

![Poisson Delaunay](https://pattapatta.madorkestra.com/assets/triangulation-poisson.svg)

### Refine

Ruppert-inspired angle refinement.

![Refine](https://pattapatta.madorkestra.com/assets/triangulation-refine.svg)
