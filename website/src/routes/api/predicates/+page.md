# predicates

Measurements and queries on paths.

## Imports

```ts
import {
  area, areaGroup, ringArea, centroid, containsPoint,
  bounds, width, height, areaSimilarity, predicates,
} from 'pattapatta'
```

## Functions

| Function | Description |
|----------|-------------|
| `area(path)` | Absolute area (holes subtracted) |
| `areaGroup(group)` | Sum of path areas |
| `ringArea(ring)` | Signed shoelace |
| `centroid(path)` | Exterior centroid |
| `containsPoint(path, p)` | Point-in-polygon with holes |
| `bounds(path)` | Axis-aligned bounds |
| `width` / `height` | Bound extents |
| `areaSimilarity(a, b)` | `1 - \|Δarea\| / max` |

## Example

```ts
const sq = createRect(0, 0, 10, 10)
area(sq) // 100
containsPoint(sq, vec2(5, 5)) // true
```
