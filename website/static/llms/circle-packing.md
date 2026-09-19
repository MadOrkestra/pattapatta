# circlePacking

**Fill** — lattice, stochastic, and inscribed circle packings. See [Fills](https://pattapatta.madorkestra.com/concepts/fills).

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

`LatticePackMode`: `'overlap'` (default — full-path fill, centered cutoffs; **clip in SVG**) | `'contained'` (fully inside disks only — when you must stroke complete circles).

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

### Not implemented

`tangencyPack` and `trinscribedPack` are **deferred** (Apollonius / true tangency graphs). See ADR `docs/decisions/0003-deferred-circle-packing.md`.

Try interactive controls on [Live demos](https://pattapatta.madorkestra.com/demos).

## Examples

### Square lattice

![Square lattice](https://pattapatta.madorkestra.com/assets/packing-square.svg)

### Hex lattice

![Hex lattice](https://pattapatta.madorkestra.com/assets/packing-hex.svg)

### Maximum inscribed

![Inscribed pack](https://pattapatta.madorkestra.com/assets/packing-inscribed.svg)

### Stochastic

![Stochastic](https://pattapatta.madorkestra.com/assets/packing-stochastic.svg)

### Front chain

![Front chain](https://pattapatta.madorkestra.com/assets/packing-frontchain.svg)

### Repulsion

![Repulsion](https://pattapatta.madorkestra.com/assets/packing-repulsion.svg)

### Obstacle pack

Seed disk (muted) plus LEC packs that avoid it:

![Obstacle pack](https://pattapatta.madorkestra.com/assets/packing-obstacle.svg)
