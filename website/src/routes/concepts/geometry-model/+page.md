# Geometry model

## Core types

| Type | Meaning |
|------|---------|
| `Vec2` | `{ x, y }` |
| `Circle` | `{ x, y, r }` |
| `Segment` | `{ a: Vec2, b: Vec2 }` |
| `Ring` | `Vec2[]` (vertices; closing vertex usually omitted) |
| `Path` | `{ rings, closed }` — exterior + optional holes, or open polyline |
| `Group` | Ordered list of paths (z-order for occlusion) |

### Path

- `rings[0]` — exterior (or the open polyline when `closed === false`)
- `rings[1…]` — holes (closed paths only)
- Prefer constructors: `polygon`, `polyline`, `path`, `createRect`, …

```ts
import { polygon, vec2, path } from 'pattapatta'

const outer = [vec2(0, 0), vec2(2, 0), vec2(2, 2), vec2(0, 2)]
const hole = [vec2(0.5, 0.5), vec2(1.5, 0.5), vec2(1.5, 1.5), vec2(0.5, 1.5)]
const withHole = path([outer, hole], true)
```

### Group

Boolean ops return a `Group` because results may split into multiple contours.

```ts
import { group, toSvg } from 'pattapatta'

toSvg(group([pathA, pathB]))
```

## Helpers

- `vec2`, `circle`, `segment`
- `clonePath` / `cloneGroup`
- `normalizeRing` — drops a duplicate closing vertex

See also [Types API](/api/types).
