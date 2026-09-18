# morphology

Offset, simplify, smooth, and warp closed paths.

## Imports

```ts
import {
  buffer, erosionDilation, dilationErosion,
  simplify, reducePrecision, chaikinCut, smooth,
  radialWarp, sineWarp, minkSum, minkDifference, morphology,
  type BufferOptions,
} from 'pattapatta'
```

## `BufferOptions`

| Option | Default | Meaning |
|--------|---------|---------|
| `join` | `'round'` | Offset join: `'round'` \| `'miter'` \| `'square'` |

## Functions

| Function | Description |
|----------|-------------|
| `buffer(path, delta, opts?: BufferOptions)` | Clipper offset (+ expand / − erode) |
| `erosionDilation` / `dilationErosion` | Opening / closing |
| `simplify(path, epsilon)` | RDP simplify |
| `reducePrecision(path, decimals)` | Round vertices |
| `chaikinCut` / `smooth` | Corner cutting |
| `radialWarp` / `sineWarp` | Deterministic warps |
| `minkSum` / `minkDifference` | Minkowski ops |

## Examples

### Buffer

![Buffer](/assets/morphology-buffer.svg)

### Chaikin

![Chaikin](/assets/morphology-chaikin.svg)

### Radial warp

![Radial warp](/assets/morphology-radial-warp.svg)

### Sine warp

![Sine warp](/assets/morphology-sine-warp.svg)

### Simplify

![Simplify](/assets/morphology-simplify.svg)
