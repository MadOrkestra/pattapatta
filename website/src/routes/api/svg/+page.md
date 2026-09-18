# SVG I/O

Parse and serialize plotter-oriented SVG.

## Imports

```ts
import {
  parseSvg, toSvg, parsePathData, serializePathData,
  type ToSvgOptions,
} from 'pattapatta'
// or: import { parseSvg, toSvg } from 'pattapatta/svg'
```

## `parseSvg(svg: string): Group`

Reads `path`, `rect`, `circle`, `line`, `polyline`, `polygon` in document order. Circles become polygonal approximations when needed for path ops.

## `toSvg(group, options?: ToSvgOptions): string`

Always emits `fill="none"` stroked paths.

| Option | Default | Meaning |
|--------|---------|---------|
| `viewBox` | inferred | SVG viewBox |
| `width` / `height` | — | Root attributes |
| `stroke` | `#000` | Stroke color |
| `strokeWidth` | `1` | Stroke width |

## Path data

- `parsePathData(d)` → rings
- `serializePathData(rings, closed)` → `d` string

## Example

```ts
const g = parseSvg(`<svg><rect x="10" y="10" width="80" height="80"/></svg>`)
console.log(toSvg(g, { strokeWidth: 1.2 }))
```
