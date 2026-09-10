import type { Group, Path, Vec2 } from '../types/index.js'
import { vec2 } from '../types/index.js'
import {
  pathToPathsD,
  pathsArea,
  pointInRing,
} from '../clipper/convert.js'

/** Signed area of a closed ring (shoelace). */
export function ringArea(ring: Vec2[]): number {
  if (ring.length < 3) return 0
  let sum = 0
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]!
    const b = ring[(i + 1) % ring.length]!
    sum += a.x * b.y - b.x * a.y
  }
  return sum / 2
}

/** Absolute area of a closed path (exterior minus holes). */
export function area(p: Path): number {
  if (!p.closed || p.rings.length === 0) return 0
  try {
    return pathsArea(pathToPathsD(p))
  } catch {
    let total = 0
    for (let i = 0; i < p.rings.length; i++) {
      const a = Math.abs(ringArea(p.rings[i]!))
      total += i === 0 ? a : -a
    }
    return Math.max(0, total)
  }
}

export function areaGroup(g: Group): number {
  return g.paths.reduce((sum, p) => sum + area(p), 0)
}

/** Centroid of a closed exterior ring (ignores holes for Phase 2). */
export function centroid(p: Path): Vec2 {
  const ring = p.rings[0]
  if (!ring || ring.length === 0) return vec2(0, 0)
  const a = ringArea(ring)
  if (Math.abs(a) < 1e-12) {
    let sx = 0
    let sy = 0
    for (const v of ring) {
      sx += v.x
      sy += v.y
    }
    return vec2(sx / ring.length, sy / ring.length)
  }
  let cx = 0
  let cy = 0
  for (let i = 0; i < ring.length; i++) {
    const p0 = ring[i]!
    const p1 = ring[(i + 1) % ring.length]!
    const cross = p0.x * p1.y - p1.x * p0.y
    cx += (p0.x + p1.x) * cross
    cy += (p0.y + p1.y) * cross
  }
  return vec2(cx / (6 * a), cy / (6 * a))
}

export function containsPoint(p: Path, point: Vec2): boolean {
  if (!p.closed || !p.rings[0]) return false
  if (!pointInRing(point, p.rings[0])) return false
  for (let i = 1; i < p.rings.length; i++) {
    const hole = p.rings[i]
    if (hole && pointInRing(point, hole)) return false
  }
  return true
}

export function bounds(p: Path): {
  minX: number
  minY: number
  maxX: number
  maxY: number
} {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const ring of p.rings) {
    for (const v of ring) {
      minX = Math.min(minX, v.x)
      minY = Math.min(minY, v.y)
      maxX = Math.max(maxX, v.x)
      maxY = Math.max(maxY, v.y)
    }
  }
  if (!Number.isFinite(minX)) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 }
  }
  return { minX, minY, maxX, maxY }
}

export function width(p: Path): number {
  const b = bounds(p)
  return b.maxX - b.minX
}

export function height(p: Path): number {
  const b = bounds(p)
  return b.maxY - b.minY
}

/** Rough polygon similarity via absolute area difference relative to max area. */
export function areaSimilarity(a: Path, b: Path): number {
  const aa = area(a)
  const bb = area(b)
  const denom = Math.max(aa, bb, 1e-12)
  return 1 - Math.abs(aa - bb) / denom
}

export const predicates = {
  area,
  areaGroup,
  ringArea,
  centroid,
  containsPoint,
  bounds,
  width,
  height,
  areaSimilarity,
}
