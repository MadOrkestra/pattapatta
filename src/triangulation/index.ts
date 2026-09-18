import { triangulateD } from 'clipper2-ts'
import { Delaunay } from 'd3-delaunay'
import type { Path, Vec2 } from '../types/index.js'
import { polygon } from '../types/index.js'
import { pathToPathsD, pathDToRing } from '../clipper/convert.js'
import { bounds, containsPoint } from '../predicates/index.js'
import { poisson } from '../pointSet/index.js'

/**
 * Triangulate a closed path into triangle polygons (Clipper2).
 * Holes are supported when present on the path. `useDelaunay` prefers
 * better-shaped triangles when Clipper can apply it.
 */
export function earCutTriangulation(
  p: Path,
  options: { useDelaunay?: boolean; precision?: number } = {},
): Path[] {
  if (!p.closed || p.rings.length === 0) return []
  const { solution } = triangulateD(
    pathToPathsD(p),
    options.precision ?? 8,
    options.useDelaunay ?? false,
  )
  const tris: Path[] = []
  for (const pd of solution) {
    const ring = pathDToRing(pd)
    if (ring.length >= 3) tris.push(polygon(ring.slice(0, 3)))
  }
  return tris
}

/** Alias matching PGS naming for Clipper/Delaunay triangulation of a polygon. */
export function delaunayTriangulation(p: Path): Path[] {
  return earCutTriangulation(p, { useDelaunay: true })
}

/** Delaunay triangulation of a point set (d3-delaunay). */
export function delaunayTriangulationPoints(points: Vec2[]): Path[] {
  if (points.length < 3) return []
  const delaunay = Delaunay.from(
    points,
    (d) => d.x,
    (d) => d.y,
  )
  const tris: Path[] = []
  const { triangles } = delaunay
  for (let i = 0; i < triangles.length; i += 3) {
    const a = points[triangles[i]!]!
    const b = points[triangles[i + 1]!]!
    const c = points[triangles[i + 2]!]!
    tris.push(polygon([a, b, c]))
  }
  return tris
}

/**
 * Boundary vertices plus Poisson-disk Steiner points inside `path`.
 */
export function poissonTriangulationPoints(
  path: Path,
  minDistance: number,
  seed = 1,
): Vec2[] {
  if (!path.closed || path.rings.length === 0) return []
  const b = bounds(path)
  const samples = poisson(
    minDistance,
    b.minX,
    b.minY,
    b.maxX,
    b.maxY,
    seed,
  ).filter((pt) => containsPoint(path, pt))
  return dedupePoints([...pathVertices(path), ...samples])
}

/**
 * Delaunay triangulation of a path with Poisson Steiner points inserted.
 * Triangles whose centroid falls outside the path (or in a hole) are dropped.
 */
export function poissonTriangulation(
  path: Path,
  minDistance: number,
  seed = 1,
): Path[] {
  const pts = poissonTriangulationPoints(path, minDistance, seed)
  return trianglesInsidePath(delaunayTriangulationPoints(pts), path)
}

export type RefineOptions = {
  /** Minimum allowed interior angle (radians). Default ≈ 20°. */
  minAngle?: number
  /** Safety cap on Steiner insertions. Default `200`. */
  maxIterations?: number
}

/**
 * Ruppert-inspired angle refinement for plotter meshes.
 * Clean-room approximation (not a full constrained CDT): insert circumcenters
 * of skinny triangles when they lie inside the path; otherwise split the
 * longest edge of that triangle (simple encroachment stand-in).
 */
export function refine(path: Path, options: RefineOptions = {}): Path[] {
  if (!path.closed || path.rings.length === 0) return []
  const minAngle = options.minAngle ?? (20 * Math.PI) / 180
  const maxIterations = Math.max(1, options.maxIterations ?? 200)
  const points = dedupePoints(pathVertices(path))
  if (points.length < 3) return []

  for (let iter = 0; iter < maxIterations; iter++) {
    const tris = trianglesInsidePath(
      delaunayTriangulationPoints(points),
      path,
    )
    if (tris.length === 0) break

    let skinny: Path | null = null
    let worst = minAngle
    for (const t of tris) {
      const a = minTriangleAngle(t)
      if (a < worst) {
        worst = a
        skinny = t
      }
    }
    if (!skinny) break

    const ring = skinny.rings[0]!
    const cc = circumcenter(ring[0]!, ring[1]!, ring[2]!)
    if (!cc) break

    const insert = containsPoint(path, cc)
      ? cc
      : longestEdgeMidpoint(ring[0]!, ring[1]!, ring[2]!)
    if (
      points.some((p) => Math.hypot(p.x - insert.x, p.y - insert.y) < 1e-9)
    ) {
      break
    }
    points.push(insert)
  }

  return trianglesInsidePath(delaunayTriangulationPoints(points), path)
}

function pathVertices(path: Path): Vec2[] {
  const out: Vec2[] = []
  for (const ring of path.rings) {
    for (const v of ring) out.push({ x: v.x, y: v.y })
  }
  return out
}

function dedupePoints(points: Vec2[], eps = 1e-9): Vec2[] {
  const out: Vec2[] = []
  for (const p of points) {
    if (out.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < eps)) continue
    out.push(p)
  }
  return out
}

function triangleCentroid(t: Path): Vec2 | null {
  const r = t.rings[0]
  if (!r || r.length < 3) return null
  return {
    x: (r[0]!.x + r[1]!.x + r[2]!.x) / 3,
    y: (r[0]!.y + r[1]!.y + r[2]!.y) / 3,
  }
}

function trianglesInsidePath(tris: Path[], path: Path): Path[] {
  return tris.filter((t) => {
    const c = triangleCentroid(t)
    return c != null && containsPoint(path, c)
  })
}

function minTriangleAngle(t: Path): number {
  const r = t.rings[0]
  if (!r || r.length < 3) return 0
  const a = r[0]!
  const b = r[1]!
  const c = r[2]!
  return Math.min(angleAt(a, b, c), angleAt(b, c, a), angleAt(c, a, b))
}

function angleAt(vertex: Vec2, p: Vec2, q: Vec2): number {
  const ux = p.x - vertex.x
  const uy = p.y - vertex.y
  const vx = q.x - vertex.x
  const vy = q.y - vertex.y
  const lu = Math.hypot(ux, uy)
  const lv = Math.hypot(vx, vy)
  if (lu < 1e-18 || lv < 1e-18) return 0
  const cos = Math.max(-1, Math.min(1, (ux * vx + uy * vy) / (lu * lv)))
  return Math.acos(cos)
}

function circumcenter(a: Vec2, b: Vec2, c: Vec2): Vec2 | null {
  const d =
    2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y))
  if (Math.abs(d) < 1e-18) return null
  const a2 = a.x * a.x + a.y * a.y
  const b2 = b.x * b.x + b.y * b.y
  const c2 = c.x * c.x + c.y * c.y
  return {
    x: (a2 * (b.y - c.y) + b2 * (c.y - a.y) + c2 * (a.y - b.y)) / d,
    y: (a2 * (c.x - b.x) + b2 * (a.x - c.x) + c2 * (b.x - a.x)) / d,
  }
}

function longestEdgeMidpoint(a: Vec2, b: Vec2, c: Vec2): Vec2 {
  const edges: [Vec2, Vec2][] = [
    [a, b],
    [b, c],
    [c, a],
  ]
  let best = edges[0]!
  let bestLen = -1
  for (const e of edges) {
    const len = Math.hypot(e[0].x - e[1].x, e[0].y - e[1].y)
    if (len > bestLen) {
      bestLen = len
      best = e
    }
  }
  return { x: (best[0].x + best[1].x) / 2, y: (best[0].y + best[1].y) / 2 }
}

export const triangulation = {
  earCutTriangulation,
  delaunayTriangulation,
  delaunayTriangulationPoints,
  poissonTriangulation,
  poissonTriangulationPoints,
  refine,
}
