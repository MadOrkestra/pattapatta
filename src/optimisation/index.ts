import type { Circle, Path, Vec2 } from '../types/index.js'
import { circle, polygon } from '../types/index.js'
import { bounds, containsPoint } from '../predicates/index.js'
import { boundingBox, convexHull } from '../hull/index.js'
import {
  maximumInscribedPack,
  maximumInscribedPackUntil,
} from '../circlePacking/index.js'

/** Axis-aligned envelope (alias of hull.boundingBox). */
export function envelope(p: Path): Path {
  return boundingBox(p)
}

/** Largest inscribed circle (fully contained). */
export function maximumInscribedCircle(
  p: Path,
  tolerance = 1,
): Circle | null {
  return maximumInscribedPack(p, 1, tolerance)[0] ?? null
}

/** Alias: successive LECs until radius drops below `minRadius`. */
export function largestEmptyCircles(
  p: Path,
  minRadius: number,
  tolerance = 1,
): Circle[] {
  return maximumInscribedPackUntil(p, minRadius, tolerance)
}

/** Single largest empty circle (no obstacle circles). */
export function largestEmptyCircle(
  p: Path,
  tolerance = 1,
): Circle | null {
  return maximumInscribedCircle(p, tolerance)
}

/**
 * Heuristic maximum axis-aligned inscribed rectangle: inset the AABB until all
 * four corners lie inside. If the AABB corners are already inside, returns the envelope.
 */
export function maximumInscribedAARectangle(p: Path): Path {
  const b = bounds(p)
  const w = b.maxX - b.minX
  const h = b.maxY - b.minY
  if (w < 1e-12 || h < 1e-12) return envelope(p)

  const fits = (m: number) => {
    const rect = [
      { x: b.minX + m, y: b.minY + m },
      { x: b.maxX - m, y: b.minY + m },
      { x: b.maxX - m, y: b.maxY - m },
      { x: b.minX + m, y: b.maxY - m },
    ]
    return rect.every((pt) => containsPoint(p, pt))
  }

  if (fits(0)) return envelope(p)

  let lo = 0
  let hi = Math.min(w, h) / 2
  let best = hi
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2
    if (fits(mid)) {
      best = mid
      hi = mid
    } else {
      lo = mid
    }
  }
  const m = best
  return polygon([
    { x: b.minX + m, y: b.minY + m },
    { x: b.maxX - m, y: b.minY + m },
    { x: b.maxX - m, y: b.maxY - m },
    { x: b.minX + m, y: b.maxY - m },
  ])
}

/** Closest point on the path boundary to `point`. */
export function closestPoint(p: Path, point: Vec2): Vec2 {
  let best = point
  let bestD = Infinity
  for (const ring of p.rings) {
    const n = ring.length
    const edges = p.closed ? n : Math.max(0, n - 1)
    for (let i = 0; i < edges; i++) {
      const a = ring[i]!
      const b = ring[(i + 1) % n]!
      const q = projectPointToSegment(point, a, b)
      const d = Math.hypot(q.x - point.x, q.y - point.y)
      if (d < bestD) {
        bestD = d
        best = q
      }
    }
  }
  return best
}

/** Closest vertex of the path to `point`. */
export function closestVertex(p: Path, point: Vec2): Vec2 {
  let best = p.rings[0]?.[0] ?? point
  let bestD = Infinity
  for (const ring of p.rings) {
    for (const v of ring) {
      const d = Math.hypot(v.x - point.x, v.y - point.y)
      if (d < bestD) {
        bestD = d
        best = v
      }
    }
  }
  return { ...best }
}

/** Closest pair among a point set (O(n²); fine for small sets). */
export function closestPointPair(points: Vec2[]): [Vec2, Vec2] | null {
  if (points.length < 2) return null
  let best: [Vec2, Vec2] = [points[0]!, points[1]!]
  let bestD = Infinity
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const d = Math.hypot(
        points[i]!.x - points[j]!.x,
        points[i]!.y - points[j]!.y,
      )
      if (d < bestD) {
        bestD = d
        best = [points[i]!, points[j]!]
      }
    }
  }
  return best
}

/** Farthest pair among a point set (O(n²)). */
export function farthestPointPair(points: Vec2[]): [Vec2, Vec2] | null {
  if (points.length < 2) return null
  let best: [Vec2, Vec2] = [points[0]!, points[1]!]
  let bestD = -1
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const d = Math.hypot(
        points[i]!.x - points[j]!.x,
        points[i]!.y - points[j]!.y,
      )
      if (d > bestD) {
        bestD = d
        best = [points[i]!, points[j]!]
      }
    }
  }
  return best
}

/**
 * Minimum bounding circle of a path's vertices (Welzl on convex hull).
 */
export function minimumBoundingCircle(p: Path): Circle {
  const pts: Vec2[] = []
  for (const ring of p.rings) pts.push(...ring)
  const hull = convexHull(pts).rings[0] ?? pts
  return minDisk(hull)
}

function minDisk(points: Vec2[]): Circle {
  // Deterministic Welzl (no shuffle); fine for typical vertex counts.
  return welzl(points.map((p) => ({ ...p })), [], 0)
}

function welzl(P: Vec2[], R: Vec2[], i: number): Circle {
  if (i === P.length || R.length === 3) return diskFromBoundary(R)
  const d = welzl(P, R, i + 1)
  const p = P[i]!
  if (Math.hypot(p.x - d.x, p.y - d.y) <= d.r + 1e-9) return d
  return welzl(P, [...R, p], i + 1)
}

function diskFromBoundary(R: Vec2[]): Circle {
  if (R.length === 0) return circle(0, 0, 0)
  if (R.length === 1) return circle(R[0]!.x, R[0]!.y, 0)
  if (R.length === 2) {
    const a = R[0]!
    const b = R[1]!
    return circle(
      (a.x + b.x) / 2,
      (a.y + b.y) / 2,
      Math.hypot(a.x - b.x, a.y - b.y) / 2,
    )
  }
  return circumcircle(R[0]!, R[1]!, R[2]!)
}

function circumcircle(a: Vec2, b: Vec2, c: Vec2): Circle {
  const d =
    2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y))
  if (Math.abs(d) < 1e-14) {
    // collinear — diameter of farthest pair
    const pair = farthestPointPair([a, b, c])!
    return circle(
      (pair[0].x + pair[1].x) / 2,
      (pair[0].y + pair[1].y) / 2,
      Math.hypot(pair[0].x - pair[1].x, pair[0].y - pair[1].y) / 2,
    )
  }
  const ux =
    ((a.x * a.x + a.y * a.y) * (b.y - c.y) +
      (b.x * b.x + b.y * b.y) * (c.y - a.y) +
      (c.x * c.x + c.y * c.y) * (a.y - b.y)) /
    d
  const uy =
    ((a.x * a.x + a.y * a.y) * (c.x - b.x) +
      (b.x * b.x + b.y * b.y) * (a.x - c.x) +
      (c.x * c.x + c.y * c.y) * (b.x - a.x)) /
    d
  return circle(ux, uy, Math.hypot(ux - a.x, uy - a.y))
}

function projectPointToSegment(p: Vec2, a: Vec2, b: Vec2): Vec2 {
  const abx = b.x - a.x
  const aby = b.y - a.y
  const len2 = abx * abx + aby * aby
  if (len2 < 1e-18) return { ...a }
  let t = ((p.x - a.x) * abx + (p.y - a.y) * aby) / len2
  t = Math.max(0, Math.min(1, t))
  return { x: a.x + t * abx, y: a.y + t * aby }
}

export const optimisation = {
  envelope,
  maximumInscribedCircle,
  largestEmptyCircle,
  largestEmptyCircles,
  maximumInscribedAARectangle,
  closestPoint,
  closestVertex,
  closestPointPair,
  farthestPointPair,
  minimumBoundingCircle,
}
