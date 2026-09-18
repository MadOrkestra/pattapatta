# contour

Offset curves, skeletons, isolines, and field contours.

## Imports

```ts
import {
  offsetCurvesOutward,
  offsetCurvesInward,
  medialAxis,
  chordalAxis,
  straightSkeleton,
  straightSkeletonParts,
  centerLine,
  distanceField,
  contrastField,
  distanceTree,
  isolines,
  isolinesFromFunction,
  isolineZeroFromFunction,
  contour,
} from 'pattapatta'
```

## Functions

| Function | Description |
|----------|-------------|
| `offsetCurvesOutward(path, distance)` | Positive buffer |
| `offsetCurvesInward(path, distance)` | Erosion (may vanish) |
| `medialAxis(path, axial, distance, area)` | Medial axis with feature pruning (thresholds in `[0,1]`) |
| `chordalAxis(path)` | Chordal axis from Delaunay triangle classification |
| `straightSkeleton(path)` | Flat group of faces + branches + bones |
| `straightSkeletonParts(path)` | Structured `{ faces, branches, bones }` |
| `centerLine(path, straightness?, smoothing?)` | Longest smoothed medial center line |
| `distanceField(path, spacing, pole?)` | Isolines of `d_boundary − d_pole` (default pole = MIC) |
| `contrastField(path, intervals, reference)` | Isolines of `\|d_boundary − d_reference\|` |
| `distanceTree(mesh, source, flatten)` | BFS shortest-path tree on a mesh |
| `isolines(path, highPoint, spacing)` | Radial isolines from a high point |
| `isolinesFromFunction(bounds, sample, interval, fn)` | Marching-squares isolines |
| `isolineZeroFromFunction(bounds, sample, fn)` | Zero level-set |

## Offset curves

![Offset curves](/assets/contour-offset.svg)

```ts
const cross = polygon([/* …cross outline… */])
offsetCurvesOutward(cross, 5)
offsetCurvesInward(cross, 5)
```

## Skeletons

![Medial axis](/assets/contour-medial.svg)
![Medial axis pruned](/assets/contour-medial-pruned.svg)
![Chordal axis](/assets/contour-chordal.svg)
![Straight skeleton](/assets/contour-straight-skeleton.svg)

```ts
const shape = densify(cross, 2.5)
medialAxis(shape, 0, 0, 0)           // full
medialAxis(shape, 0.15, 0.1, 0.1)    // pruned
chordalAxis(shape)

// Straight skeleton ≈ successive inward offsets (wavefronts above)
let cur = cross
for (let i = 0; i < 5; i++) {
  const next = offsetCurvesInward(cur, 4)
  if (!next.paths.length) break
  cur = next.paths[0]!
}
straightSkeletonParts(cross)         // faces, branches, bones from the same process
```

## Center line

![Center line](/assets/contour-centerline.svg)

```ts
let capsule = union(createRect(22, 40, 56, 20), createCircle(22, 50, 10))
capsule = densify(
  union(capsule.paths[0]!, createCircle(78, 50, 10)).paths[0]!,
  2.5,
)
centerLine(capsule, 0.65, 30)
```

## Fields

![Distance field](/assets/contour-distance-field.svg)
![Contrast field](/assets/contour-contrast-field.svg)
![Isolines](/assets/contour-isolines.svg)
![Distance tree](/assets/contour-distance-tree.svg)

```ts
const L = polygon([/* …L outline… */])
distanceField(L, 7)
contrastField(L, 5, vec2(35, 65))
isolines(L, vec2(35, 65), 8)
distanceTree(meshGroup, vec2(35, 65), true)
```

## Notes

- Clean-room MIT reimplementations (not ports of PGS / JMedialAxis / grassfire4j).
- `straightSkeleton` uses successive inward offsets (robust approximation); exact kinetic skeletons may follow later.
- Densify sparse polygons before `medialAxis` / `centerLine` for better quality.
