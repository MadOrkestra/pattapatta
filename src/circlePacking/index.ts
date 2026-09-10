import type { Circle, Path, Vec2 } from '../types/index.js'
import { circle } from '../types/index.js'
import { bounds, containsPoint } from '../predicates/index.js'

/**
 * Square lattice of equal circles; include a circle if it overlaps the path
 * (PGS: center inside shape buffered by ~0.95 * radius).
 */
export function squareLatticePack(path: Path, diameter: number): Circle[] {
  const d = Math.max(diameter, 0.1)
  const r = d / 2
  const b = bounds(path)
  const out: Circle[] = []
  const w = b.maxX - b.minX + d + b.minX
  const h = b.maxY - b.minY + d + b.minY

  for (let x = b.minX; x < w; x += d) {
    for (let y = b.minY; y < h; y += d) {
      const c = circle(x, y, r)
      if (circleOverlapsPath(c, path)) out.push(c)
    }
  }
  return out
}

/**
 * Hexagonal lattice of equal circles; include if overlaps the path.
 */
export function hexLatticePack(path: Path, diameter: number): Circle[] {
  const d = Math.max(diameter, 0.1)
  const r = d / 2
  const b = bounds(path)
  const w = b.maxX - b.minX + d + b.minX
  const h = b.maxY - b.minY + d + b.minY
  const z = r * Math.sqrt(3)
  const out: Circle[] = []
  let offset = 0

  for (let x = b.minX; x < w; x += z) {
    offset = offset === r ? 0 : r
    for (let y = b.minY - offset; y < h; y += d) {
      const c = circle(x, y, r)
      if (circleOverlapsPath(c, path)) out.push(c)
    }
  }
  return out
}

/**
 * Seeded stochastic packing: sample random points, grow max non-overlapping
 * radius (tangent to nearest circle or limited by distance to boundary).
 * Phase 4: no triangulation Steiner mode yet (`triangulatePoints` deferred).
 */
export function stochasticPack(
  path: Path,
  points: number,
  minRadius: number,
  seed = 1,
): Circle[] {
  const rng = mulberry32(seed >>> 0)
  const b = bounds(path)
  const packing: Circle[] = []

  for (let attempt = 0; attempt < points; attempt++) {
    const p = vecInBounds(b, rng)
    if (!containsPoint(path, p)) continue

    const distBoundary = distanceToBoundary(p, path)
    let maxR = distBoundary
    for (const c of packing) {
      const d = Math.hypot(p.x - c.x, p.y - c.y) - c.r
      maxR = Math.min(maxR, d)
    }
    if (maxR < minRadius) continue
    packing.push(circle(p.x, p.y, maxR))
  }

  return packing
}

/** True if disk overlaps the filled path (including partial exterior overlap). */
export function circleOverlapsPath(c: Circle, path: Path): boolean {
  const center = { x: c.x, y: c.y }
  const dist = distanceToPolygon(center, path)
  return dist <= c.r * 0.95
}

/** Distance from point to polygon: 0 if inside, else distance to boundary. */
export function distanceToPolygon(p: Vec2, path: Path): number {
  if (containsPoint(path, p)) return 0
  return distanceToBoundary(p, path)
}

function distanceToBoundary(p: Vec2, path: Path): number {
  let min = Infinity
  for (const ring of path.rings) {
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i]!
      const b = ring[(i + 1) % ring.length]!
      min = Math.min(min, pointSegmentDistance(p, a, b))
    }
  }
  return min
}

function pointSegmentDistance(p: Vec2, a: Vec2, b: Vec2): number {
  const abx = b.x - a.x
  const aby = b.y - a.y
  const len2 = abx * abx + aby * aby
  if (len2 < 1e-18) return Math.hypot(p.x - a.x, p.y - a.y)
  let t = ((p.x - a.x) * abx + (p.y - a.y) * aby) / len2
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(p.x - (a.x + t * abx), p.y - (a.y + t * aby))
}

function vecInBounds(
  b: { minX: number; minY: number; maxX: number; maxY: number },
  rng: () => number,
): Vec2 {
  return {
    x: b.minX + rng() * (b.maxX - b.minX),
    y: b.minY + rng() * (b.maxY - b.minY),
  }
}

function mulberry32(a: number): () => number {
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const circlePacking = {
  squareLatticePack,
  hexLatticePack,
  stochasticPack,
  circleOverlapsPath,
}
