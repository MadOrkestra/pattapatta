# construction

Primitive shape constructors.

## Imports

```ts
import {
  createCircle, createRect, createRegularPolygon, createRing,
  createArc, createStar, createKochSnowflake, createSponge, construction,
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
| `createSponge(w, h, generators, thickness, smoothing, classes, seed?)` | Porous Voronoi sponge (`Group`) |

## Examples

### Circle / star / snowflake

![Shapes](/assets/construction-shapes.svg)

### Ring / arc

![Ring and arc](/assets/construction-ring-arc.svg)

### Sponge

Merged Voronoi cells, Chaikin-smoothed, subtracted from a rectangle. Stroke the result as a fill. Lower `classes` → coarser blobs; higher `thickness` → thicker walls.

![Sponge](/assets/construction-sponge.svg)

```ts
const sponge = createSponge(100, 100, 40, 1.5, 2, 8, 19)
// stroke sponge.paths
```
