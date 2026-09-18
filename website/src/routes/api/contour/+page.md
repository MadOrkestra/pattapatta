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
const sq = createRect(15, 15, 70, 70)
offsetCurvesOutward(sq, 8)
offsetCurvesInward(sq, 8)
```

## Skeletons

![Medial axis](/assets/contour-medial.svg)
![Medial axis pruned](/assets/contour-medial-pruned.svg)
![Chordal axis](/assets/contour-chordal.svg)
![Straight skeleton](/assets/contour-straight-skeleton.svg)

```ts
medialAxis(shape, 0, 0, 0)           // full
medialAxis(shape, 0.4, 0.35, 0.35)   // pruned
chordalAxis(shape)
straightSkeletonParts(shape)         // faces, branches, bones
```

## Center line

![Center line](/assets/contour-centerline.svg)

```ts
centerLine(densify(createRect(10, 35, 80, 30), 3), 0.7, 40)
```

## Fields

![Distance field](/assets/contour-distance-field.svg)
![Contrast field](/assets/contour-contrast-field.svg)
![Isolines](/assets/contour-isolines.svg)
![Distance tree](/assets/contour-distance-tree.svg)

```ts
distanceField(sq, 10)
contrastField(sq, 8, vec2(30, 30))
isolines(sq, vec2(50, 50), 12)
distanceTree(meshGroup, vec2(50, 50), true)
```

## Notes

- Clean-room MIT reimplementations (not ports of PGS / JMedialAxis / grassfire4j).
- `straightSkeleton` uses successive inward offsets (robust approximation); exact kinetic skeletons may follow later.
- Densify sparse polygons before `medialAxis` / `centerLine` for better quality.
