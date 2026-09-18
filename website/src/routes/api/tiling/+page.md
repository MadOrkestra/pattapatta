# tiling

Grids and subdivisions as stroked cell boundaries.

## Imports

```ts
import {
  squareTiling, hexTiling, rectSubdivision,
  quadSubdivision, triangleSubdivision,
  sliceDivision, hatchSubdivision, arcDivision, tiling,
} from 'pattapatta'
```

## Functions

| Function | Description |
|----------|-------------|
| `squareTiling(spacing, minX, minY, maxX, maxY)` | Square cells (`squareGrid` alias) |
| `hexTiling(spacing, …)` | Hex cells |
| `rectSubdivision(path, nx, ny)` | Clip grid to path |
| `quadSubdivision(faces, depth?)` | Midpoint quad split |
| `triangleSubdivision(faces, depth?)` | Midpoint tri split |
| `sliceDivision` / `hatchSubdivision` | Parallel strip cuts |
| `arcDivision(width, height, arcs, seed?, circlePoints?)` | Arc-based cellular partition |

## Examples

### Square tiling

![Square tiling](/assets/tiling-square.svg)

### Hex tiling

![Hex tiling](/assets/tiling-hex.svg)

### Rect subdivision

![Rect subdivision](/assets/tiling-rect-subdiv.svg)

### Triangle subdivision

![Triangle subdivision](/assets/tiling-tri-subdiv.svg)

### Arc division

Circles seeded on the boundary carve arc cells — stroke the faces as a fill.

![Arc division](/assets/tiling-arc-division.svg)

```ts
const cells = arcDivision(100, 100, 8, 7)
// stroke cells.paths
```
