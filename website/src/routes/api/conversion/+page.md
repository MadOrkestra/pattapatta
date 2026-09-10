# conversion

Portable structure helpers (PShape bridges omitted on purpose).

## Imports

```ts
import {
  copy, flatten, roundVertexCoords, toArray, fromArray,
  toContours, fromContours, conversion,
} from 'pattapatta'
```

## Functions

| Function | Description |
|----------|-------------|
| `copy(path)` | Clone |
| `flatten(group)` | Cloned path list |
| `roundVertexCoords(path, decimals)` | Round verts |
| `toArray` / `fromArray` | Flat `[x0,y0,…]` exterior |
| `toContours` / `fromContours` | Ring ↔ path list |

Style / WKT / Java2D bridges from PGS are not ported; use SVG + these helpers.
