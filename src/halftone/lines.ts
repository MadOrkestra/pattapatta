import type { Group, Path, Vec2 } from '../types/index.js'
import { group, polyline } from '../types/index.js'
import { sample, type ToneField } from './toneField.js'

export type HalftoneLinesOptions = {
  /** Line direction in radians. Default `Math.PI / 4`. */
  angle?: number
  /** Perpendicular pitch between scanlines (image units). Default `2`. */
  spacing?: number
  /** Sample step along each scanline (image units). Default `1`. */
  step?: number
  /**
   * Multi-threshold overlays (darker regions get more ink). Default `1`.
   * Each level uses threshold `i / (levels + 1)` for `i = 1..levels`.
   */
  levels?: number
  /** Ignore samples lighter than this darkness. Default `0`. */
  minDarkness?: number
  /** Output scale (image unit → SVG unit). Default `1`. */
  scale?: number
}

/**
 * Angled scanline hatching modulated by tone.
 * Darker regions produce more / longer stroked segments.
 */
export function lines(
  field: ToneField,
  opts: HalftoneLinesOptions = {},
): Group {
  const angle = opts.angle ?? Math.PI / 4
  const spacing = opts.spacing ?? 2
  const step = opts.step ?? 1
  const levels = Math.max(1, Math.floor(opts.levels ?? 1))
  const minDarkness = opts.minDarkness ?? 0
  const scale = opts.scale ?? 1

  if (spacing <= 0 || step <= 0 || scale <= 0) return group([])

  const w = field.width
  const h = field.height
  const ux = Math.cos(angle)
  const uy = Math.sin(angle)
  const px = -uy
  const py = ux

  const corners: Array<[number, number]> = [
    [0, 0],
    [w - 1, 0],
    [w - 1, h - 1],
    [0, h - 1],
  ]
  let minP = Infinity
  let maxP = -Infinity
  let minA = Infinity
  let maxA = -Infinity
  for (const [cx, cy] of corners) {
    const p = cx * px + cy * py
    const a = cx * ux + cy * uy
    if (p < minP) minP = p
    if (p > maxP) maxP = p
    if (a < minA) minA = a
    if (a > maxA) maxA = a
  }

  const paths: Path[] = []
  const pad = step

  for (let level = 1; level <= levels; level++) {
    const threshold = Math.max(minDarkness, level / (levels + 1))
    const phase = ((level - 1) / levels) * spacing * 0.5

    for (let p = minP + phase; p <= maxP + 1e-9; p += spacing) {
      let run: Vec2[] = []

      const flush = () => {
        if (run.length >= 2) {
          paths.push(polyline(run))
        }
        run = []
      }

      for (let a = minA - pad; a <= maxA + pad + 1e-9; a += step) {
        const x = px * p + ux * a
        const y = py * p + uy * a
        if (x < 0 || y < 0 || x > w - 1 || y > h - 1) {
          flush()
          continue
        }
        const d = sample(field, x, y)
        if (d >= threshold) {
          run.push({ x: x * scale, y: y * scale })
        } else {
          flush()
        }
      }
      flush()
    }
  }

  return group(paths)
}
