import type { Group, Path, Vec2 } from '../types/index.js'
import { group, segment } from '../types/index.js'
import { dissolveSegments } from './dissolve.js'

export type ScalarField = (x: number, y: number) => number

/**
 * Extract isolines of `fn` over an axis-aligned box via marching squares.
 * Contours are generated at multiples of `contourInterval` between
 * `isolineMin`/`isolineMax` (auto-scanned when omitted).
 */
export function isolinesFromFunction(
  bounds: [number, number, number, number],
  sampleSpacing: number,
  contourInterval: number,
  fn: ScalarField,
  isolineMin = Number.NaN,
  isolineMax = Number.NaN,
): Group {
  const [xmin, ymin, xmax, ymax] = bounds
  const dx = Math.max(sampleSpacing, 1e-9)
  const dy = dx
  const nx = Math.max(2, Math.ceil((xmax - xmin) / dx) + 1)
  const ny = Math.max(2, Math.ceil((ymax - ymin) / dy) + 1)

  const grid: number[][] = []
  let gmin = Infinity
  let gmax = -Infinity
  for (let j = 0; j < ny; j++) {
    const row: number[] = []
    const y = ymin + j * ((ymax - ymin) / (ny - 1))
    for (let i = 0; i < nx; i++) {
      const x = xmin + i * ((xmax - xmin) / (nx - 1))
      let v = fn(x, y)
      if (!Number.isFinite(v)) v = Number.NEGATIVE_INFINITY
      row.push(v)
      if (Number.isFinite(v)) {
        gmin = Math.min(gmin, v)
        gmax = Math.max(gmax, v)
      }
    }
    grid.push(row)
  }

  const z0 = Number.isFinite(isolineMin) ? isolineMin : gmin
  const z1 = Number.isFinite(isolineMax) ? isolineMax : gmax
  if (!Number.isFinite(z0) || !Number.isFinite(z1) || contourInterval <= 0) {
    return group([])
  }

  const levels: number[] = []
  const start = Math.ceil(z0 / contourInterval) * contourInterval
  for (let z = start; z <= z1 + 1e-12; z += contourInterval) {
    levels.push(z)
  }

  const segs = []
  for (const level of levels) {
    segs.push(...marchLevel(grid, xmin, ymin, xmax, ymax, nx, ny, level))
  }
  return dissolveSegments(segs)
}

/** Isolines where `fn(x,y) === 0`. */
export function isolineZeroFromFunction(
  bounds: [number, number, number, number],
  sampleSpacing: number,
  fn: ScalarField,
): Group {
  return isolinesFromFunction(bounds, sampleSpacing, 1, fn, 0, 0)
}

function marchLevel(
  grid: number[][],
  xmin: number,
  ymin: number,
  xmax: number,
  ymax: number,
  nx: number,
  ny: number,
  level: number,
) {
  const segs: ReturnType<typeof segment>[] = []
  const xAt = (i: number) => xmin + (i / (nx - 1)) * (xmax - xmin)
  const yAt = (j: number) => ymin + (j / (ny - 1)) * (ymax - ymin)

  const lerp = (
    x0: number,
    y0: number,
    v0: number,
    x1: number,
    y1: number,
    v1: number,
  ): Vec2 => {
    const t = (level - v0) / (v1 - v0 || 1e-15)
    return { x: x0 + t * (x1 - x0), y: y0 + t * (y1 - y0) }
  }

  for (let j = 0; j < ny - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const v00 = grid[j]![i]!
      const v10 = grid[j]![i + 1]!
      const v11 = grid[j + 1]![i + 1]!
      const v01 = grid[j + 1]![i]!
      const x0 = xAt(i)
      const x1 = xAt(i + 1)
      const y0 = yAt(j)
      const y1 = yAt(j + 1)

      let code = 0
      if (v00 >= level) code |= 1
      if (v10 >= level) code |= 2
      if (v11 >= level) code |= 4
      if (v01 >= level) code |= 8
      if (code === 0 || code === 15) continue

      const bottom = () => lerp(x0, y0, v00, x1, y0, v10)
      const right = () => lerp(x1, y0, v10, x1, y1, v11)
      const top = () => lerp(x0, y1, v01, x1, y1, v11)
      const left = () => lerp(x0, y0, v00, x0, y1, v01)

      const add = (a: Vec2, b: Vec2) => segs.push(segment(a, b))

      switch (code) {
        case 1:
        case 14:
          add(left(), bottom())
          break
        case 2:
        case 13:
          add(bottom(), right())
          break
        case 3:
        case 12:
          add(left(), right())
          break
        case 4:
        case 11:
          add(right(), top())
          break
        case 6:
        case 9:
          add(bottom(), top())
          break
        case 7:
        case 8:
          add(left(), top())
          break
        case 5: {
          // saddle — average ambiguity
          const avg = (v00 + v10 + v11 + v01) / 4
          if (avg >= level) {
            add(left(), top())
            add(bottom(), right())
          } else {
            add(left(), bottom())
            add(right(), top())
          }
          break
        }
        case 10: {
          const avg = (v00 + v10 + v11 + v01) / 4
          if (avg >= level) {
            add(left(), bottom())
            add(right(), top())
          } else {
            add(left(), top())
            add(bottom(), right())
          }
          break
        }
        default:
          break
      }
    }
  }
  return segs
}

/** Point-set isolines: each point carries z in `.z` via a parallel array. */
export function isolinesFromPoints(
  points: Vec2[],
  values: number[],
  intervals: number,
  _smoothing = 0,
): Group {
  if (points.length < 3 || intervals < 1) return group([])
  let minZ = Infinity
  let maxZ = -Infinity
  for (const v of values) {
    minZ = Math.min(minZ, v)
    maxZ = Math.max(maxZ, v)
  }
  if (!Number.isFinite(minZ) || maxZ - minZ < 1e-15) return group([])

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const p of points) {
    minX = Math.min(minX, p.x)
    minY = Math.min(minY, p.y)
    maxX = Math.max(maxX, p.x)
    maxY = Math.max(maxY, p.y)
  }
  const span = Math.max(maxX - minX, maxY - minY, 1)
  const sampleSpacing = span / Math.max(20, Math.sqrt(points.length))
  const interval = (maxZ - minZ) / intervals

  // Inverse-distance weighted interpolation from samples
  const fn: ScalarField = (x, y) => {
    let num = 0
    let den = 0
    for (let i = 0; i < points.length; i++) {
      const p = points[i]!
      const d2 = (x - p.x) ** 2 + (y - p.y) ** 2
      const w = 1 / Math.max(d2, 1e-12)
      num += w * values[i]!
      den += w
    }
    return num / den
  }

  return isolinesFromFunction(
    [minX, minY, maxX, maxY],
    sampleSpacing,
    interval,
    fn,
    minZ,
    maxZ,
  )
}
