import type { Path, Vec2 } from '../types/index.js'
import { polygon } from '../types/index.js'
import { convexHull } from '../hull/index.js'
import { area } from '../predicates/index.js'
import { hilbertSort } from '../pointSet/hilbert.js'

/** Convex hull (largest-area simple polygonisation for a point cloud). */
export function maxArea(points: Vec2[]): Path {
  return convexHull(points)
}

/**
 * Minimum-area triangle covering the points among hull edges
 * (O(h²) rotating-calipers style brute force on hull).
 * Falls back to hull if fewer than 3 hull vertices.
 */
export function minArea(points: Vec2[]): Path {
  const hull = convexHull(points).rings[0] ?? []
  if (hull.length < 3) return convexHull(points)
  if (hull.length === 3) return polygon(hull)

  let best: Path | null = null
  let bestA = Infinity
  const h = hull
  const n = h.length
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      for (let k = j + 1; k < n; k++) {
        const tri = polygon([h[i]!, h[j]!, h[k]!])
        if (!coversPoints(tri, points)) continue
        const a = area(tri)
        if (a < bestA) {
          bestA = a
          best = tri
        }
      }
    }
  }
  return best ?? convexHull(points)
}

/** Closed polygon connecting points in order of minimum spanning path heuristic (NN tour). */
export function minPerimeter(points: Vec2[]): Path {
  if (points.length === 0) return polygon([])
  if (points.length < 3) return polygon(points)
  const remaining = points.map((p) => ({ ...p }))
  const ordered: Vec2[] = [remaining.shift()!]
  while (remaining.length) {
    const last = ordered[ordered.length - 1]!
    let bestI = 0
    let bestD = Infinity
    for (let i = 0; i < remaining.length; i++) {
      const d = Math.hypot(
        remaining[i]!.x - last.x,
        remaining[i]!.y - last.y,
      )
      if (d < bestD) {
        bestD = d
        bestI = i
      }
    }
    ordered.push(remaining.splice(bestI, 1)[0]!)
  }
  return polygon(ordered)
}

/** Connect points sorted by x then y. */
export function horizontal(points: Vec2[]): Path {
  const pts = [...points].sort((a, b) =>
    a.y === b.y ? a.x - b.x : a.y - b.y,
  )
  return polygon(pts)
}

/** Connect points sorted by y then x. */
export function vertical(points: Vec2[]): Path {
  const pts = [...points].sort((a, b) =>
    a.x === b.x ? a.y - b.y : a.x - b.x,
  )
  return polygon(pts)
}

/** Connect by polar angle around centroid. */
export function angular(points: Vec2[]): Path {
  if (points.length === 0) return polygon([])
  const c = centroidOf(points)
  const pts = [...points].sort(
    (a, b) =>
      Math.atan2(a.y - c.y, a.x - c.x) - Math.atan2(b.y - c.y, b.x - c.x),
  )
  return polygon(pts)
}

/** Alias of angular. */
export function circular(points: Vec2[]): Path {
  return angular(points)
}

/**
 * Onion layers: successive convex hulls. Returns the outermost hull polygon;
 * use `onionLayers` for all peels.
 */
export function onion(points: Vec2[]): Path {
  const layers = onionLayers(points)
  return layers[0] ?? polygon([])
}

/** Convex onion peels from outside in. */
export function onionLayers(points: Vec2[]): Path[] {
  let remaining = points.map((p) => ({ ...p }))
  const layers: Path[] = []
  while (remaining.length >= 3) {
    const hull = convexHull(remaining)
    const ring = hull.rings[0] ?? []
    if (ring.length < 3) break
    layers.push(hull)
    const onHull = new Set(ring.map((v) => `${v.x},${v.y}`))
    remaining = remaining.filter((p) => !onHull.has(`${p.x},${p.y}`))
  }
  return layers
}

/** Connect points ordered by 2D Hilbert curve index. */
export function hilbert(points: Vec2[]): Path {
  return polygon(hilbertSort(points))
}

function coversPoints(poly: Path, points: Vec2[]): boolean {
  // triangle cover check via barycentric
  const r = poly.rings[0]
  if (!r || r.length < 3) return false
  const a = r[0]!
  const b = r[1]!
  const c = r[2]!
  for (const p of points) {
    if (!pointInTriangle(p, a, b, c)) return false
  }
  return true
}

function pointInTriangle(p: Vec2, a: Vec2, b: Vec2, c: Vec2): boolean {
  const v0x = c.x - a.x
  const v0y = c.y - a.y
  const v1x = b.x - a.x
  const v1y = b.y - a.y
  const v2x = p.x - a.x
  const v2y = p.y - a.y
  const dot00 = v0x * v0x + v0y * v0y
  const dot01 = v0x * v1x + v0y * v1y
  const dot02 = v0x * v2x + v0y * v2y
  const dot11 = v1x * v1x + v1y * v1y
  const dot12 = v1x * v2x + v1y * v2y
  const inv = 1 / (dot00 * dot11 - dot01 * dot01 || 1e-18)
  const u = (dot11 * dot02 - dot01 * dot12) * inv
  const v = (dot00 * dot12 - dot01 * dot02) * inv
  return u >= -1e-9 && v >= -1e-9 && u + v <= 1 + 1e-9
}

function centroidOf(points: Vec2[]): Vec2 {
  let sx = 0
  let sy = 0
  for (const p of points) {
    sx += p.x
    sy += p.y
  }
  return { x: sx / points.length, y: sy / points.length }
}

export const polygonisation = {
  maxArea,
  minArea,
  minPerimeter,
  horizontal,
  vertical,
  angular,
  circular,
  onion,
  onionLayers,
  hilbert,
}
