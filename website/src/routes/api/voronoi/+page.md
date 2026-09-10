# voronoi

Voronoi cells from point sites (`d3-delaunay`).

## Imports

```ts
import {
  compoundVoronoi, innerVoronoi, innerVoronoiRaw, voronoi,
  type VoronoiOptions,
} from 'pattapatta'
```

## Functions

| Function | Description |
|----------|-------------|
| `compoundVoronoi(sites, opts?)` | Cells clipped to bbox |
| `innerVoronoi(sites, container, opts?)` | Intersect cells with path |
| `innerVoronoiRaw` | Alias of compound |

`opts.bounds` defaults to a padded site AABB.

## Examples

### Compound

![Compound Voronoi](/assets/voronoi-compound.svg)

### Inner (clipped)

![Inner Voronoi](/assets/voronoi-inner.svg)
