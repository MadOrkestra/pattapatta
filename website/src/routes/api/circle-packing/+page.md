# circlePacking

Lattice, stochastic, and inscribed circle packings.

## Imports

```ts
import {
  squareLatticePack, hexLatticePack, stochasticPack,
  maximumInscribedPack, maximumInscribedPackUntil,
  frontChainPack, repulsionPack, circleOverlapsPath,
  circlePacking,
} from 'pattapatta'
```

## Functions

| Function | Description |
|----------|-------------|
| `squareLatticePack(path, diameter)` | Square lattice; keep overlapping disks |
| `hexLatticePack(path, diameter)` | Hex lattice |
| `stochasticPack(path, points, minRadius, seed?)` | Seeded random growth |
| `maximumInscribedPack(path, n, tolerance?)` | Iterative LEC packing |
| `maximumInscribedPackUntil(path, minR, tolerance?)` | Until radius threshold |
| `frontChainPack(path, minR, maxR, seed?)` | Seeded front-chain style |
| `repulsionPack(path, minR, maxR, seed?, iterations?)` | Overlap + push |
| `circleOverlapsPath(c, path)` | Disk overlaps filled path |

**Deferred:** `tangencyPack`, `trinscribedPack`, `obstaclePack`.

## Examples

### Square lattice

![Square lattice](/assets/packing-square.svg)

### Hex lattice

![Hex lattice](/assets/packing-hex.svg)

### Maximum inscribed

![Inscribed pack](/assets/packing-inscribed.svg)

### Stochastic

![Stochastic](/assets/packing-stochastic.svg)

### Front chain

![Front chain](/assets/packing-frontchain.svg)
