import type { Vec2 } from '../types/index.js'

/** Hilbert index for (x,y) in [0, 2^order). */
export function xy2d(order: number, x: number, y: number): number {
  let rx
  let ry
  let s
  let d = 0
  for (s = 1 << (order - 1); s > 0; s >>= 1) {
    rx = (x & s) > 0 ? 1 : 0
    ry = (y & s) > 0 ? 1 : 0
    d += s * s * ((3 * rx) ^ ry)
    ;({ x, y } = rot(s, x, y, rx, ry))
  }
  return d
}

function rot(
  n: number,
  x: number,
  y: number,
  rx: number,
  ry: number,
): { x: number; y: number } {
  if (ry === 0) {
    if (rx === 1) {
      x = n - 1 - x
      y = n - 1 - y
    }
    return { x: y, y: x }
  }
  return { x, y }
}

/**
 * Sort points by 2D Hilbert curve index (spatial locality).
 * Returns a new array; does not mutate the input.
 */
export function hilbertSort(points: Vec2[], order = 10): Vec2[] {
  if (points.length === 0) return []
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
  const span = Math.max(maxX - minX, maxY - minY, 1e-9)
  const n = 1 << order
  const scored = points.map((p) => {
    const x = Math.min(
      n - 1,
      Math.max(0, Math.floor(((p.x - minX) / span) * (n - 1))),
    )
    const y = Math.min(
      n - 1,
      Math.max(0, Math.floor(((p.y - minY) / span) * (n - 1))),
    )
    return { p, h: xy2d(order, x, y) }
  })
  scored.sort((a, b) => a.h - b.h)
  return scored.map((s) => s.p)
}
