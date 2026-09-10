import type { Path, Vec2 } from '../types/index.js'
import { polygon } from '../types/index.js'
import { bounds } from '../predicates/index.js'

/** Andrew's monotone-chain convex hull of a point set. */
export function convexHull(points: Vec2[]): Path {
  const pts = uniquePoints(points)
  if (pts.length < 3) return polygon(pts)

  pts.sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x))

  const lower: Vec2[] = []
  for (const p of pts) {
    while (
      lower.length >= 2 &&
      cross(lower[lower.length - 2]!, lower[lower.length - 1]!, p) <= 0
    ) {
      lower.pop()
    }
    lower.push(p)
  }

  const upper: Vec2[] = []
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i]!
    while (
      upper.length >= 2 &&
      cross(upper[upper.length - 2]!, upper[upper.length - 1]!, p) <= 0
    ) {
      upper.pop()
    }
    upper.push(p)
  }

  lower.pop()
  upper.pop()
  return polygon([...lower, ...upper])
}

/** Convex hull of all vertices in a path (exterior + holes). */
export function convexHullPath(p: Path): Path {
  const pts: Vec2[] = []
  for (const ring of p.rings) pts.push(...ring)
  return convexHull(pts)
}

/** Axis-aligned bounding box of a path as a closed rectangle. */
export function boundingBox(p: Path): Path {
  const b = bounds(p)
  return polygon([
    { x: b.minX, y: b.minY },
    { x: b.maxX, y: b.minY },
    { x: b.maxX, y: b.maxY },
    { x: b.minX, y: b.maxY },
  ])
}

function cross(o: Vec2, a: Vec2, b: Vec2): number {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)
}

function uniquePoints(points: Vec2[]): Vec2[] {
  const seen = new Set<string>()
  const out: Vec2[] = []
  for (const p of points) {
    const key = `${p.x},${p.y}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ x: p.x, y: p.y })
  }
  return out
}

export const hull = {
  convexHull,
  convexHullPath,
  boundingBox,
}
