# halftone

**Fill from image tone** — decode an sRGB photo to RGBA yourself, then pick **one** exclusive mark mode: angled **lines** or lattice **circles**.

The **only product output** is a **pen-plotter SVG**: open/closed stroked paths via `toSvg` (`fill="none"` on every path). PNGs in examples are optional previews of that SVG, not a substitute.

## Imports

```ts
import {
  fromRgba, fromLuminance, halftoneLines, halftoneCircles, toSvg,
  type ToneField, type HalftoneLinesOptions, type HalftoneCirclesOptions,
} from 'pattapatta'
// or from 'pattapatta/halftone'
```

## Pipeline

1. Decode JPEG/PNG → RGBA buffer (e.g. `sharp`, browser canvas). Not included in the library.
2. `fromRgba(data, width, height)` → `ToneField` (darkness in `[0,1]`).
3. **Either** `halftoneLines(field, opts)` **or** `halftoneCircles(field, opts)` — not both in one pass.
4. `toSvg(marks)` → stroke-only SVG for the plotter (AxiDraw, etc.).

```ts
import sharp from 'sharp'
import { fromRgba, halftoneCircles, toSvg, reducePrecision, group } from 'pattapatta'

const { data, info } = await sharp('photo.jpg')
  .rotate()
  .resize({ width: 800 })
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true })

const field = fromRgba(data, info.width, info.height)
const marks = halftoneCircles(field, {
  cell: 3.5,
  lattice: 'hex',
  minRadius: 0.2,
  maxRadius: 1.5,
  segments: 12, // fewer verts = lighter plotter SVG
})
// optional: shrink file size for machine drivers
const plot = group(marks.paths.map((p) => reducePrecision(p, 2)))
writeFileSync('out.svg', toSvg(plot, { strokeWidth: 0.25 }))
```

## `fromRgba(data, width, height, options?) → ToneField`

Packed RGBA (4 bytes/pixel). Rec.709 luma on sRGB channels; default maps dark pixels to high darkness (more ink).

| Option | Default | Meaning |
|--------|---------|---------|
| `invert` | `false` | Light pixels become high darkness |

## `halftoneLines(field, options?) → Group`

Angled scanlines; contiguous dark runs become open polylines. Multi-`levels` overlay extra thresholds so darker regions get denser ink.

| Option | Default | Meaning |
|--------|---------|---------|
| `angle` | `π/4` | Line direction (radians) |
| `spacing` | `2` | Perpendicular pitch |
| `step` | `1` | Sample step along each line |
| `levels` | `1` | Threshold overlays |
| `minDarkness` | `0` | Ignore lighter samples |
| `scale` | `1` | Image unit → SVG unit |

## `halftoneCircles(field, options?) → Group`

Square or hex lattice; circle radius scales with darkness:

`r = maxRadius * darkness^gamma` (skip if `r < minRadius`)

Circles are stroked n-gons (`createCircle`), not filled disks. With `overlap: true`, lattice pitch is derived so max-radius neighbors share `overlapAmount` of a diameter — stroke crossings create denser midtones (single pen).

| Option | Default | Meaning |
|--------|---------|---------|
| `cell` | `4` | Lattice pitch (ignored when `overlap` is true) |
| `lattice` | `'square'` | `'square'` \| `'hex'` |
| `minRadius` | `0.3` | Skip sites mapping below this radius |
| `maxRadius` | `cell * 0.45` (or `8` if overlapping) | Radius at full darkness |
| `overlap` | `false` | Derive pitch so max-radius neighbors overlap |
| `overlapAmount` | `0.35` | Shared fraction of max diameter when `overlap` |
| `gamma` | `1` | Tone response curve |
| `segments` | `24` | N-gon resolution |
| `scale` | `1` | Image unit → SVG unit |

```ts
// Non-overlapping lattice (default) — use a small `cell` for photo detail
halftoneCircles(field, { cell: 3.5, lattice: 'hex', minRadius: 0.15, maxRadius: 1.55 })

// Overlapping: pitch from maxRadius + overlapAmount
halftoneCircles(field, {
  overlap: true,
  overlapAmount: 0.32,
  minRadius: 0.25,
  maxRadius: 2.4,
  lattice: 'hex',
})
```

## Modes are exclusive

Call **either** lines **or** circles for a given conversion. Later patterns (spirals, squiggle, …) will be additional exclusive modes on the same `ToneField`.

## Photo credit

Example fixture and docs previews use [*Buzz Aldrin walking on the moon*](https://unsplash.com/photos/buzz-aldrin-walking-on-the-moon-e5eDHbmHprg) by [History in HD](https://unsplash.com/@historyinhd) on Unsplash.
