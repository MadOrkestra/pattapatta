import type { Path, Vec2 } from '../types/index.js'

/** Shortest Euclidean distance from a point to the path boundary (all rings). */
export function distanceToBoundary(path: Path, p: Vec2): number {
  let best = Infinity
  for (const ring of path.rings) {
    if (ring.length < 2) continue
    const n = ring.length
    const closed = path.closed
    const limit = closed ? n : n - 1
    for (let i = 0; i < limit; i++) {
      const a = ring[i]!
      const b = ring[(i + 1) % n]!
      best = Math.min(best, distPointSeg(p, a, b))
    }
  }
  return best
}

/** Collect all boundary segments as endpoint pairs. */
export function boundarySegments(path: Path): { a: Vec2; b: Vec2 }[] {
  const out: { a: Vec2; b: Vec2 }[] = []
  for (const ring of path.rings) {
    if (ring.length < 2) continue
    const n = ring.length
    const limit = path.closed ? n : n - 1
    for (let i = 0; i < limit; i++) {
      out.push({ a: ring[i]!, b: ring[(i + 1) % n]! })
    }
  }
  return out
}

/** Densified boundary sample points (including holes). */
export function sampleBoundary(path: Path, maxSegLen: number): Vec2[] {
  const pts: Vec2[] = []
  const lim = Math.max(maxSegLen, 1e-9)
  for (const ring of path.rings) {
    if (ring.length < 2) continue
    const n = ring.length
    const limit = path.closed ? n : n - 1
    for (let i = 0; i < limit; i++) {
      const a = ring[i]!
      const b = ring[(i + 1) % n]!
      const len = Math.hypot(b.x - a.x, b.y - a.y)
      const steps = Math.max(1, Math.ceil(len / lim))
      for (let s = 0; s < steps; s++) {
        const t = s / steps
        pts.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })
      }
    }
  }
  return pts
}

function distPointSeg(p: Vec2, a: Vec2, b: Vec2): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len2 = dx * dx + dy * dy
  if (len2 < 1e-18) return Math.hypot(p.x - a.x, p.y - a.y)
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy))
}
