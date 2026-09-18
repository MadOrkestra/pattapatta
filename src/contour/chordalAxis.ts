import type { Group, Path, Vec2 } from '../types/index.js'
import { segment } from '../types/index.js'
import { densify } from '../processing/index.js'
import { delaunayTriangulation } from '../triangulation/index.js'
import { centroid } from '../predicates/index.js'
import { dissolveSegments } from './dissolve.js'

function mid(a: Vec2, b: Vec2): Vec2 {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

function len(a: Vec2, b: Vec2): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

function edgeKey(a: Vec2, b: Vec2): string {
  const ka = `${a.x.toFixed(8)},${a.y.toFixed(8)}`
  const kb = `${b.x.toFixed(8)},${b.y.toFixed(8)}`
  return ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`
}

/**
 * Chordal Axis Transform: join midpoints of interior chords / centroids of
 * terminal & junction triangles from a densified Delaunay triangulation.
 */
export function chordalAxis(shape: Path): Group {
  if (!shape.closed || shape.rings.length === 0) return dissolveSegments([])

  const b = boundsSpan(shape)
  const densified = densify(shape, Math.max(b / 40, 1e-3))
  const tris = delaunayTriangulation(densified)
  if (tris.length === 0) return dissolveSegments([])

  // Count how many triangles share each edge
  const edgeCount = new Map<string, number>()
  const triEdges: [Vec2, Vec2, Vec2][] = []

  for (const t of tris) {
    const r = t.rings[0]
    if (!r || r.length < 3) continue
    const a = r[0]!
    const b0 = r[1]!
    const c = r[2]!
    triEdges.push([a, b0, c])
    for (const [u, v] of [
      [a, b0],
      [b0, c],
      [c, a],
    ] as [Vec2, Vec2][]) {
      const k = edgeKey(u, v)
      edgeCount.set(k, (edgeCount.get(k) ?? 0) + 1)
    }
  }

  const isBoundary = (u: Vec2, v: Vec2) => (edgeCount.get(edgeKey(u, v)) ?? 0) <= 1

  const segs = []
  for (const [a, b0, c] of triEdges) {
    const edges: [Vec2, Vec2][] = [
      [a, b0],
      [b0, c],
      [c, a],
    ]
    const interior = edges.filter(([u, v]) => !isBoundary(u, v))
    const degree = interior.length // number of interior edges (= neighbors)

    if (degree === 1) {
      // Terminal: centroid → midpoint of interior edge
      const [u, v] = interior[0]!
      const cen = centroid({ rings: [[a, b0, c]], closed: true })
      segs.push(segment(cen, mid(u, v)))
    } else if (degree === 2) {
      // Sleeve: connect midpoints of two interior edges
      const m0 = mid(interior[0]![0], interior[0]![1])
      const m1 = mid(interior[1]![0], interior[1]![1])
      segs.push(segment(m0, m1))
    } else if (degree === 3) {
      // Junction: midpoints of two shortest → midpoint of longest
      const ranked = edges
        .map(([u, v]) => ({ u, v, l: len(u, v) }))
        .sort((x, y) => y.l - x.l)
      const longest = ranked[0]!
      const shortA = ranked[1]!
      const shortB = ranked[2]!
      const mL = mid(longest.u, longest.v)
      segs.push(segment(mid(shortA.u, shortA.v), mL))
      segs.push(segment(mid(shortB.u, shortB.v), mL))
    }
  }

  return dissolveSegments(segs)
}

function boundsSpan(p: Path): number {
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
  return Math.max(maxX - minX, maxY - minY, 1)
}
