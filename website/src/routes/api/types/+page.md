# Types

Constructors and structural types for geometry.

## Imports

```ts
import {
  vec2, circle, segment, path, polygon, polyline, group,
  type Vec2, type Path, type Group, type Circle, type Segment,
} from 'pattapatta'
```

## Functions

| Function | Description |
|----------|-------------|
| `vec2(x, y)` | Point |
| `circle(x, y, r)` | Disk descriptor |
| `segment(a, b)` | Line segment |
| `polygon(exterior, holes?)` | Closed path |
| `polyline(points)` | Open path |
| `path(rings, closed?)` | General path |
| `group(paths)` / `groupFromPaths` | Ordered group |
| `clonePath` / `cloneGroup` / `cloneVec2` | Deep copies |
| `normalizeRing(ring)` | Drop duplicate closing vertex |
| `equalsVec2(a, b, eps?)` | Approximate equality |
| `circleCenter(c)` | `{ x, y }` of a circle |

## Example

```ts
const square = polygon([
  vec2(0, 0), vec2(100, 0), vec2(100, 100), vec2(0, 100),
])
```

![Construction shapes](/assets/construction-shapes.svg)
