# meshing

Faces, edges, graph filters, quadrangulation, and mesh processing.

## Imports

```ts
import {
  urquhartFaces, gabrielFaces, relativeNeighborFaces, spannerFaces, dualFaces,
  centroidQuadrangulation, edgeCollapseQuadrangulation, splitQuadrangulation,
  spiralQuadrangulation, matchingQuadrangulation,
  smoothMesh, subdivideMesh, simplifyMesh, stochasticMerge, areaMerge,
  extractInnerEdges, extractInnerVertices, findContainingFace, splitEdges,
  findBreaks, fixBreaks, fixBrokenFaces, findIslands,
  radialSortFaces, centroidSortFaces, meshing,
} from 'pattapatta'
```

## Graph faces

| Function | Description |
|----------|-------------|
| `urquhartFaces(points\|faces, preservePerimeter?)` | Remove longest edge per triangle → polygonal faces |
| `gabrielFaces(points\|faces, preservePerimeter?)` | Delaunay ∩ Gabriel faces |
| `relativeNeighborFaces(points\|faces, preservePerimeter?)` | Delaunay ∩ RNG faces |
| `spannerFaces(points\|faces, k, preservePerimeter?)` | Greedy sparse spanner faces (higher `k` → larger faces) |
| `dualFaces(faces)` | Closed dual cells around interior vertices |

### Urquhart faces

![Urquhart](https://pattapatta.madorkestra.com/assets/meshing-urquhart.svg)

### Gabriel faces

![Gabriel](https://pattapatta.madorkestra.com/assets/meshing-gabriel.svg)

### Triangulation dual

![Dual](https://pattapatta.madorkestra.com/assets/meshing-dual.svg)

### Relative neighbour faces

![RNG](https://pattapatta.madorkestra.com/assets/meshing-rng.svg)

### Spanner faces

![Spanner](https://pattapatta.madorkestra.com/assets/meshing-spanner.svg)

## Quadrangulation

| Function | Description |
|----------|-------------|
| `centroidQuadrangulation(points\|faces, preservePerimeter?)` | Quads from triangle centroids across shared edges |
| `edgeCollapseQuadrangulation(points\|faces, preservePerimeter?)` | Pair adjacent triangles into quads |
| `splitQuadrangulation(points\|faces)` | Catmull–Clark: 3 quads per triangle |
| `spiralQuadrangulation(points)` | Spiral-patterned quads from a point set |
| `matchingQuadrangulation(points\|faces)` | Quality-weighted triangle matching |

### Centroid quadrangulation

![Centroid quad](https://pattapatta.madorkestra.com/assets/meshing-centroid-quad.svg)

### Edge collapse quadrangulation

![Edge collapse](https://pattapatta.madorkestra.com/assets/meshing-edge-collapse.svg)

### Split quadrangulation

![Split quad](https://pattapatta.madorkestra.com/assets/meshing-split-quad.svg)

### Spiral quadrangulation

![Spiral](https://pattapatta.madorkestra.com/assets/meshing-spiral-quad.svg)

### Matching quadrangulation

![Matching](https://pattapatta.madorkestra.com/assets/meshing-matching-quad.svg)

## Process

| Function | Description |
|----------|-------------|
| `smoothMesh(faces, iterations\|cutoff, preservePerimeter?)` | Weighted Laplacian smoothing |
| `subdivideMesh(faces, edgeSplitRatio?)` | Centroid subdivision (N subfaces per N-gon) |
| `simplifyMesh(faces, tolerance, preservePerimeter?)` | Simplify face boundaries, keep topology |
| `stochasticMerge(faces, nClasses, seed?)` | Random dissolve of adjacent same-class faces |
| `areaMerge(faces, minArea \| { remainingFaces })` | Merge tiny faces into neighbors |
| `splitEdges(faces, maxLen)` | Densify long edges |

### Mesh smoothing

![Smooth](https://pattapatta.madorkestra.com/assets/meshing-smooth.svg)

### Mesh subdivision

![Subdivide](https://pattapatta.madorkestra.com/assets/meshing-subdivide.svg)

### Mesh simplification

![Simplify](https://pattapatta.madorkestra.com/assets/meshing-simplify.svg)

### Stochastic merge

![Stochastic](https://pattapatta.madorkestra.com/assets/meshing-stochastic-merge.svg)

### Area merge

![Area merge](https://pattapatta.madorkestra.com/assets/meshing-area-merge.svg)

## Extract / repair

| Function | Description |
|----------|-------------|
| `extractInnerEdges(faces)` | Edges shared by ≥2 faces |
| `extractInnerVertices(faces)` | Vertices not on the perimeter |
| `findContainingFace(faces, point)` | First containing face |
| `findBreaks(faces)` | Near-miss gap segments |
| `fixBreaks(faces, maxGapWidth)` | Snap gaps / clean coverage |
| `fixBrokenFaces(coverage, tolerance, polygonise?)` | Endpoint snap + polygonise |
| `findIslands(faces)` | Disconnected face components |
| `radialSortFaces` / `centroidSortFaces` | Order faces |

### Extract inner edges

![Edges](https://pattapatta.madorkestra.com/assets/meshing-edges.svg)

### Extract inner vertices

![Inner vertices](https://pattapatta.madorkestra.com/assets/meshing-inner-vertices.svg)

### Fix breaks

![Fix breaks](https://pattapatta.madorkestra.com/assets/meshing-fix-breaks.svg)
