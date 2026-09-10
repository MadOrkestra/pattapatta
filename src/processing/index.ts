import type { Group, Path, Segment, Vec2 } from '../types/index.js'
import { path, normalizeRing, polygon, segment, group } from '../types/index.js'
import { bounds, containsPoint, centroid } from '../predicates/index.js'
import { intersect, unionAll } from '../shapeBoolean/index.js'

/** Exterior ring as its own closed path (holes dropped). */
export function extractPerimeter(p: Path): Path {
  const exterior = p.rings[0]
  if (!exterior) return path([], true)
  return polygon(exterior)
}

/** Alias for extractPerimeter. */
export function extractBoundary(p: Path): Path {
  return extractPerimeter(p)
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

/** Axis-aligned grid samples that fall inside the path. */
export function generateRandomGridPoints(
  p: Path,
  spacing: number,
): Vec2[] {
  const step = Math.max(spacing, 1e-9)
  const b = bounds(p)
  const out: Vec2[] = []
  for (let x = b.minX; x <= b.maxX + 1e-12; x += step) {
    for (let y = b.minY; y <= b.maxY + 1e-12; y += step) {
      const pt = { x, y }
      if (containsPoint(p, pt)) out.push(pt)
    }
  }
  return out
}

/** Evenly spaced samples along the exterior perimeter. */
export function pointsOnExterior(p: Path, count: number): Vec2[] {
  const ring = p.rings[0]
  if (!ring || ring.length < 2 || count <= 0) return []
  const lengths = edgeLengths(ring, true)
  const total = lengths.reduce((s, L) => s + L, 0)
  if (total < 1e-12) return []
  const out: Vec2[] = []
  for (let i = 0; i < count; i++) {
    const target = (i / count) * total
    out.push(pointAtArcLength(ring, lengths, target))
  }
  return out
}

/** Exterior edges as segments. */
export function segmentsOnExterior(p: Path): Segment[] {
  const ring = p.rings[0]
  if (!ring || ring.length < 2) return []
  const n = ring.length
  const closed = p.closed
  const edges = closed ? n : n - 1
  const out: Segment[] = []
  for (let i = 0; i < edges; i++) {
    out.push(segment(ring[i]!, ring[(i + 1) % n]!))
  }
  return out
}

/**
 * Cut `p` with the infinite line through `a`→`b`.
 * Returns pieces on both sides (typically 0–2 paths).
 */
export function slice(p: Path, a: Vec2, b: Vec2): Group {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len = Math.hypot(dx, dy)
  if (len < 1e-12) return group([p])
  const nx = -dy / len
  const ny = dx / len
  const bb = bounds(p)
  const span =
    Math.hypot(bb.maxX - bb.minX, bb.maxY - bb.minY) * 4 + 10
  const left = halfPlanePoly(a, nx, ny, span)
  const right = halfPlanePoly(a, -nx, -ny, span)
  const parts: Path[] = []
  for (const half of [left, right]) {
    parts.push(...intersect(p, half).paths)
  }
  return group(parts)
}

/** Split through the centroid with a vertical cut (left/right). */
export function centroidSplit(p: Path): Group {
  const c = centroid(p)
  const bb = bounds(p)
  const pad = Math.max(bb.maxY - bb.minY, 1) + 1
  return slice(p, { x: c.x, y: c.y - pad }, { x: c.x, y: c.y + pad })
}

/** Union all closed paths in a group (dissolve overlapping contours). */
export function dissolve(paths: Path[]): Group {
  return unionAll(paths)
}

/** Vertex–edge intersection points between two path boundaries. */
export function intersectionPoints(a: Path, b: Path): Vec2[] {
  const segsA = allSegments(a)
  const segsB = allSegments(b)
  const out: Vec2[] = []
  const seen = new Set<string>()
  for (const sa of segsA) {
    for (const sb of segsB) {
      const hit = segmentIntersection(sa.a, sa.b, sb.a, sb.b)
      if (!hit) continue
      const key = `${hit.x.toFixed(9)},${hit.y.toFixed(9)}`
      if (seen.has(key)) continue
      seen.add(key)
      out.push(hit)
    }
  }
  return out
}

function halfPlanePoly(
  origin: Vec2,
  nx: number,
  ny: number,
  span: number,
): Path {
  // Orthonormal tangent
  const tx = -ny
  const ty = nx
  const o = origin
  return polygon([
    {
      x: o.x - tx * span + nx * 1e-9,
      y: o.y - ty * span + ny * 1e-9,
    },
    {
      x: o.x + tx * span + nx * 1e-9,
      y: o.y + ty * span + ny * 1e-9,
    },
    {
      x: o.x + tx * span + nx * span,
      y: o.y + ty * span + ny * span,
    },
    {
      x: o.x - tx * span + nx * span,
      y: o.y - ty * span + ny * span,
    },
  ])
}

function allSegments(p: Path): Segment[] {
  const out: Segment[] = []
  for (const ring of p.rings) {
    const n = ring.length
    const edges = p.closed ? n : Math.max(0, n - 1)
    for (let i = 0; i < edges; i++) {
      out.push(segment(ring[i]!, ring[(i + 1) % n]!))
    }
  }
  return out
}

function segmentIntersection(
  a: Vec2,
  b: Vec2,
  c: Vec2,
  d: Vec2,
): Vec2 | null {
  const rX = b.x - a.x
  const rY = b.y - a.y
  const sX = d.x - c.x
  const sY = d.y - c.y
  const den = rX * sY - rY * sX
  if (Math.abs(den) < 1e-14) return null
  const t = ((c.x - a.x) * sY - (c.y - a.y) * sX) / den
  const u = ((c.x - a.x) * rY - (c.y - a.y) * rX) / den
  if (t < -1e-9 || t > 1 + 1e-9 || u < -1e-9 || u > 1 + 1e-9) return null
  return { x: a.x + t * rX, y: a.y + t * rY }
}

function edgeLengths(ring: Vec2[], closed: boolean): number[] {
  const n = ring.length
  const edges = closed ? n : n - 1
  const lengths: number[] = []
  for (let i = 0; i < edges; i++) {
    const a = ring[i]!
    const b = ring[(i + 1) % n]!
    lengths.push(Math.hypot(b.x - a.x, b.y - a.y))
  }
  return lengths
}

function pointAtArcLength(
  ring: Vec2[],
  lengths: number[],
  target: number,
): Vec2 {
  let remain = target
  const n = ring.length
  for (let i = 0; i < lengths.length; i++) {
    const L = lengths[i]!
    if (remain <= L || i === lengths.length - 1) {
      const t = L < 1e-12 ? 0 : remain / L
      const a = ring[i]!
      const b = ring[(i + 1) % n]!
      return {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
      }
    }
    remain -= L
  }
  return { ...ring[0]! }
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
  extractBoundary,
  extractHoles,
  densify,
  removeSmallHoles,
  generateRandomPoints,
  generateRandomGridPoints,
  pointsOnExterior,
  segmentsOnExterior,
  slice,
  centroidSplit,
  dissolve,
  intersectionPoints,
}
