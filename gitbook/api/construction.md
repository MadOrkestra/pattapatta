# construction

Primitive shape constructors.

## Imports

```ts
import {
  createCircle, createRect, createRegularPolygon, createRing,
  createArc, createStar, createKochSnowflake, construction,
} from 'pattapatta'
```

## Functions

| Function | Description |
|----------|-------------|
| `createCircle(cx, cy, r, segments?)` | Regular n-gon disk |
| `createRect(x, y, w, h)` | Axis-aligned rect |
| `createRegularPolygon(cx, cy, r, sides, rotation?)` | Regular polygon |
| `createRing(cx, cy, outer, inner, segments?)` | Annulus (hole) |
| `createArc(…)` | Open arc polyline |
| `createStar(cx, cy, outer, inner, points?, rotation?)` | Star |
| `createKochSnowflake(cx, cy, r, iterations?)` | Koch flake |

## Examples

### Circle / star / snowflake

![Shapes](../assets/construction-shapes.svg)

### Ring / arc

![Ring and arc](../assets/construction-ring-arc.svg)
