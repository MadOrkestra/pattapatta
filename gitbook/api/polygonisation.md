# polygonisation

Turn point clouds into closed polygons.

## Imports

```ts
import {
  maxArea, minArea, minPerimeter,
  polygoniseHorizontal, polygoniseVertical,
  angular, circular, onion, onionLayers, hilbertPolygonise,
  polygonisation,
} from 'pattapatta'
```

## Functions

| Function | Description |
|----------|-------------|
| `maxArea(points)` | Convex hull |
| `minArea(points)` | Small covering triangle heuristic |
| `minPerimeter(points)` | Nearest-neighbor tour |
| `polygoniseHorizontal` / `Vertical` | Sort then close |
| `angular` / `circular` | Polar order |
| `onion` / `onionLayers` | Convex peels |
| `hilbertPolygonise` | Hilbert order then close |

## Examples

### Angular

![Angular](../assets/polygonise-angular.svg)

### Hilbert

![Hilbert](../assets/polygonise-hilbert.svg)

### Onion

![Onion](../assets/polygonise-onion.svg)
