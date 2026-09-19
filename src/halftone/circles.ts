import type { Group, Path } from '../types/index.js'
import { group } from '../types/index.js'
import { createCircle } from '../construction/index.js'
import { sample, type ToneField } from './toneField.js'

export type HalftoneCirclesOptions = {
  /**
   * Lattice pitch in image units. Default `4` when `overlap` is false.
   * When `overlap` is true, pitch is derived from `maxRadius` and `overlapAmount`
   * (this value is ignored).
   */
  cell?: number
  /** Lattice geometry. Default `'square'`. */
  lattice?: 'square' | 'hex'
  /**
   * Minimum drawn radius (image units). Sites mapping below this are skipped.
   * Default `0.3`.
   */
  minRadius?: number
  /**
   * Radius at full darkness (image units).
   * Default: `cell * 0.45` when `overlap` is false; `8` when `overlap` is true.
   */
  maxRadius?: number
  /**
   * When true, lattice pitch is derived so max-radius neighbors overlap.
   * Default `false`.
   */
  overlap?: boolean
  /**
   * Fraction of max diameter that max-radius neighbors share along the lattice
   * neighbor vector. In `(0, 1]`. Default `0.35` when `overlap` is true.
   * Ignored when `overlap` is false.
   */
  overlapAmount?: number
  /**
   * Radius curve: `r = maxRadius * darkness^gamma`, then skip if `r < minRadius`.
   * Default `1`.
   */
  gamma?: number
  /** N-gon segments for each stroked circle. Default `24`. */
  segments?: number
  /** Output scale (image unit → SVG unit). Default `1`. */
  scale?: number
}

/**
 * Tone-scaled circle lattice (square or hex).
 * Darker sites produce larger stroked circles; light sites below `minRadius` are skipped.
 * With `overlap: true`, pitch is tightened so max-radius neighbors cross
 * (single-pen optical density from stroke crossings).
 */
export function circles(
  field: ToneField,
  opts: HalftoneCirclesOptions = {},
): Group {
  const lattice = opts.lattice ?? 'square'
  const overlap = opts.overlap === true
  const minRadius = opts.minRadius ?? 0.3
  const gamma = opts.gamma ?? 1
  const segments = Math.max(3, Math.floor(opts.segments ?? 24))
  const scale = opts.scale ?? 1

  let cell: number
  let maxRadius: number

  if (overlap) {
    maxRadius = opts.maxRadius ?? 8
    const amount = clampOverlapAmount(opts.overlapAmount ?? 0.35)
    cell = 2 * maxRadius * (1 - amount)
  } else {
    cell = opts.cell ?? 4
    maxRadius = opts.maxRadius ?? cell * 0.45
  }

  if (
    cell <= 0 ||
    maxRadius <= 0 ||
    minRadius < 0 ||
    maxRadius < minRadius ||
    scale <= 0
  ) {
    return group([])
  }

  const w = field.width
  const h = field.height
  const paths: Path[] = []
  const rowPitch = lattice === 'hex' ? cell * Math.sqrt(3) * 0.5 : cell

  for (let row = 0, y = cell * 0.5; y < h; row++, y += rowPitch) {
    const xOff = lattice === 'hex' && row % 2 === 1 ? cell * 0.5 : 0
    for (let x = cell * 0.5 + xOff; x < w; x += cell) {
      const darkness = sample(field, x, y)
      if (darkness <= 0) continue
      const r = maxRadius * darkness ** gamma
      if (r < minRadius) continue
      paths.push(
        createCircle(x * scale, y * scale, r * scale, segments),
      )
    }
  }

  return group(paths)
}

function clampOverlapAmount(amount: number): number {
  if (!(amount > 0) || amount > 1) return 0.35
  return amount
}
