import { triangulateD } from 'clipper2-ts'
import { Delaunay } from 'd3-delaunay'
import type { Path, Vec2 } from '../types/index.js'
import { polygon } from '../types/index.js'
import { pathToPathsD, pathDToRing } from '../clipper/convert.js'

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

export const triangulation = {
  earCutTriangulation,
  delaunayTriangulation,
  delaunayTriangulationPoints,
}
