# tiling

Grids and subdivisions as stroked cell boundaries.

## Imports

```ts
import {
  squareTiling, hexTiling, rectSubdivision,
  quadSubdivision, triangleSubdivision,
  sliceDivision, hatchSubdivision, tiling,
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

## Examples

### Square tiling

![Square tiling](/assets/tiling-square.svg)

### Hex tiling

![Hex tiling](/assets/tiling-hex.svg)

### Rect subdivision

![Rect subdivision](/assets/tiling-rect-subdiv.svg)

### Triangle subdivision

![Triangle subdivision](/assets/tiling-tri-subdiv.svg)
