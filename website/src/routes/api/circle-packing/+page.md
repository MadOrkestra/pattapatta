# circlePacking

**Fill** — lattice, stochastic, and inscribed circle packings. See [Fills](/concepts/fills).

## Imports

```ts
import {
  squareLatticePack, hexLatticePack, stochasticPack,
  maximumInscribedPack, maximumInscribedPackUntil,
  frontChainPack, repulsionPack, obstaclePack,
  circleOverlapsPath, circleContainedInPath,
  circlePacking,
  type LatticePackMode,
} from 'pattapatta'
```

## Lattice modes

`LatticePackMode`: `'overlap'` (default — full-fill lattice, centered cutoffs; clip in SVG) | `'contained'` (fully inside disks, centered margins — better for plotter strokes of complete circles).

```ts
squareLatticePack(path, 0.25)              // overlap
squareLatticePack(path, 0.25, 'contained')
hexLatticePack(path, 0.25, 'contained')
```

## Functions

| Function | Description |
|----------|-------------|
| `squareLatticePack(path, diameter, mode?)` | Square lattice |
| `hexLatticePack(path, diameter, mode?)` | Hex lattice |
| `stochasticPack(path, points, minRadius, seed?)` | Seeded random growth |
| `maximumInscribedPack(path, n, tolerance?)` | Iterative LEC packing |
| `maximumInscribedPackUntil(path, minR, tolerance?)` | Until radius threshold |
| `obstaclePack(path, obstacles, n, tolerance?)` | LEC pack avoiding seed disks |
| `frontChainPack(path, minR, maxR, seed?)` | Seeded front-chain style |
| `repulsionPack(path, minR, maxR, seed?, iterations?)` | Overlap + push |
| `circleOverlapsPath(c, path)` | Disk overlaps filled path |
| `circleContainedInPath(c, path)` | Disk fully inside path |

**Deferred:** `tangencyPack`, `trinscribedPack` — see ADR 0003.

Try interactive controls on [Live demos](/demos).

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
