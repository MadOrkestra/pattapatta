import type { Path, Vec2 } from '../types/index.js'
import { path, normalizeRing, polygon } from '../types/index.js'
import { bounds, containsPoint } from '../predicates/index.js'

/** Exterior ring as its own closed path (holes dropped). */
export function extractPerimeter(p: Path): Path {
  const exterior = p.rings[0]
  if (!exterior) return path([], true)
  return polygon(exterior)
}

/** Each hole as a separate closed path. */
export function extractHoles(p: Path): Path[] {
  const holes: Path[] = []
  for (let i = 1; i < p.rings.length; i++) {
    const hole = p.rings[i]
    if (hole && hole.length >= 3) holes.push(polygon(hole))
  }
  return holes
}

/**
 * Insert vertices so no edge exceeds `maxSegLen`.
 * Closed rings treat the wrap-around edge.
 */
export function densify(p: Path, maxSegLen: number): Path {
  if (maxSegLen <= 0) return p
  return path(
    p.rings.map((ring) => densifyRing(ring, maxSegLen, p.closed)),
    p.closed,
  )
}

function densifyRing(
  ring: Vec2[],
  maxSegLen: number,
  closed: boolean,
): Vec2[] {
  if (ring.length < 2) return [...ring]
  const out: Vec2[] = []
  const n = ring.length
  const edges = closed ? n : n - 1
  for (let i = 0; i < edges; i++) {
    const a = ring[i]!
    const b = ring[(i + 1) % n]!
    out.push(a)
    const dist = Math.hypot(b.x - a.x, b.y - a.y)
    const steps = Math.floor(dist / maxSegLen)
    for (let s = 1; s < steps; s++) {
      const t = s / steps
      out.push({
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
      })
    }
  }
  if (!closed) out.push(ring[n - 1]!)
  return closed ? normalizeRing(out) : out
}

/** Drop holes whose absolute area is below `minArea`. */
export function removeSmallHoles(p: Path, minArea: number): Path {
  if (p.rings.length <= 1) return p
  const exterior = p.rings[0]!
  const kept = p.rings.slice(1).filter((hole) => {
    const a = Math.abs(shoelace(hole))
    return a >= minArea
  })
  return path([exterior, ...kept], p.closed)
}

/** Seeded uniform random points inside a closed path. */
export function generateRandomPoints(
  p: Path,
  count: number,
  seed = 1,
): Vec2[] {
  const rng = mulberry32(seed >>> 0)
  const b = bounds(p)
  const out: Vec2[] = []
  let attempts = 0
  const maxAttempts = Math.max(count * 50, 100)
  while (out.length < count && attempts < maxAttempts) {
    attempts++
    const pt = {
      x: b.minX + rng() * (b.maxX - b.minX),
      y: b.minY + rng() * (b.maxY - b.minY),
    }
    if (containsPoint(p, pt)) out.push(pt)
  }
  return out
}

function shoelace(ring: Vec2[]): number {
  let sum = 0
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]!
    const b = ring[(i + 1) % ring.length]!
    sum += a.x * b.y - b.x * a.y
  }
  return sum / 2
}

function mulberry32(a: number): () => number {
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const processing = {
  extractPerimeter,
  extractHoles,
  densify,
  removeSmallHoles,
  generateRandomPoints,
}
