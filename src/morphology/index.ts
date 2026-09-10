import { simplifyPathD, minkowskiSumD, minkowskiDiffD } from 'clipper2-ts'
import type { Group, Path, Ring, Vec2 } from '../types/index.js'
import { path, normalizeRing } from '../types/index.js'
import { pathDToRing, ringToPathD, pathsDToGroup } from '../clipper/convert.js'
import { centroid } from '../predicates/index.js'
import { buffer, erosionDilation, dilationErosion } from './buffer.js'

export type { BufferOptions } from './buffer.js'
export { buffer, erosionDilation, dilationErosion } from './buffer.js'

/**
 * Ramer–Douglas–Peucker simplify (Clipper2). `epsilon` is absolute distance.
 */
export function simplify(p: Path, epsilon: number): Path {
  if (epsilon <= 0 || p.rings.length === 0) return p
  const rings: Ring[] = []
  for (const ring of p.rings) {
    const simplified = simplifyPathD(ringToPathD(ring), epsilon, p.closed)
    const out = pathDToRing(simplified)
    if (out.length >= (p.closed ? 3 : 2)) rings.push(out)
  }
  if (rings.length === 0) return path([], p.closed)
  return path(rings, p.closed)
}

/** Round vertex coordinates to `decimals` places. */
export function reducePrecision(p: Path, decimals: number): Path {
  const f = 10 ** Math.max(0, Math.floor(decimals))
  const round = (n: number) => Math.round(n * f) / f
  return path(
    p.rings.map((ring) =>
      normalizeRing(ring.map((v) => ({ x: round(v.x), y: round(v.y) }))),
    ),
    p.closed,
  )
}

/**
 * Chaikin corner cutting. `iterations` ≥ 1; closed rings stay closed.
 * Ratio defaults to classic 1/4–3/4 cut.
 */
export function chaikinCut(p: Path, iterations = 1, ratio = 0.25): Path {
  const r = Math.min(0.49, Math.max(0.01, ratio))
  let rings = p.rings
  for (let i = 0; i < Math.max(1, Math.floor(iterations)); i++) {
    rings = rings.map((ring) => chaikinRing(ring, r, p.closed))
  }
  return path(rings, p.closed)
}

/** Alias: Chaikin smoothing for `iterations` passes. */
export function smooth(p: Path, iterations = 2): Path {
  return chaikinCut(p, iterations)
}

/** Radial displace from centroid: r' = r * (1 + amplitude * cos(freq * θ + phase)). */
export function radialWarp(
  p: Path,
  amplitude: number,
  frequency = 3,
  phase = 0,
): Path {
  const c = centroid(p)
  return mapVerts(p, (v) => {
    const dx = v.x - c.x
    const dy = v.y - c.y
    const dist = Math.hypot(dx, dy)
    if (dist < 1e-12) return v
    const theta = Math.atan2(dy, dx)
    const s = 1 + amplitude * Math.cos(frequency * theta + phase)
    return { x: c.x + dx * s, y: c.y + dy * s }
  })
}

/** Sine warp along X: y' = y + amplitude * sin(2π * frequency * x + phase). */
export function sineWarp(
  p: Path,
  amplitude: number,
  frequency = 1,
  phase = 0,
): Path {
  return mapVerts(p, (v) => ({
    x: v.x,
    y: v.y + amplitude * Math.sin(2 * Math.PI * frequency * v.x + phase),
  }))
}

/** Minkowski sum of two closed paths (Clipper2). */
export function minkSum(a: Path, b: Path): Group {
  const pattern = ringToPathD(b.rings[0] ?? [])
  const subject = ringToPathD(a.rings[0] ?? [])
  return pathsDToGroup(minkowskiSumD(pattern, subject, true))
}

/** Minkowski difference of two closed paths (Clipper2). */
export function minkDifference(a: Path, b: Path): Group {
  const pattern = ringToPathD(b.rings[0] ?? [])
  const subject = ringToPathD(a.rings[0] ?? [])
  return pathsDToGroup(minkowskiDiffD(pattern, subject, true))
}

function chaikinRing(ring: Ring, ratio: number, closed: boolean): Ring {
  if (ring.length < 2) return ring.map((v) => ({ ...v }))
  const out: Vec2[] = []
  const n = ring.length
  const edges = closed ? n : n - 1
  for (let i = 0; i < edges; i++) {
    const a = ring[i]!
    const b = ring[(i + 1) % n]!
    out.push({
      x: a.x * (1 - ratio) + b.x * ratio,
      y: a.y * (1 - ratio) + b.y * ratio,
    })
    out.push({
      x: a.x * ratio + b.x * (1 - ratio),
      y: a.y * ratio + b.y * (1 - ratio),
    })
  }
  if (!closed) {
    out.unshift({ ...ring[0]! })
    out.push({ ...ring[n - 1]! })
  }
  return closed ? normalizeRing(out) : out
}

function mapVerts(p: Path, fn: (v: Vec2) => Vec2): Path {
  return path(
    p.rings.map((ring) => normalizeRing(ring.map(fn))),
    p.closed,
  )
}

export const morphology = {
  buffer,
  erosionDilation,
  dilationErosion,
  simplify,
  reducePrecision,
  chaikinCut,
  smooth,
  radialWarp,
  sineWarp,
  minkSum,
  minkDifference,
}
