import { Delaunay } from 'd3-delaunay'
import type { Group, Path, Vec2 } from '../types/index.js'
import { group, polygon } from '../types/index.js'
import { bounds } from '../predicates/index.js'
import { intersect } from '../shapeBoolean/index.js'

export type VoronoiOptions = {
  /** Clip cells to this bbox; default padded bounds of the sites. */
  bounds?: { minX: number; minY: number; maxX: number; maxY: number }
}

/**
 * Voronoi cells for a point set as closed polygons (clipped to a bbox).
 * PGS `compoundVoronoi` analogue — one path per site.
 */
export function compoundVoronoi(
  sites: Vec2[],
  options: VoronoiOptions = {},
): Group {
  if (sites.length === 0) return group([])
  if (sites.length === 1) {
    const b = options.bounds ?? padBounds(sites, 1)
    return group([
      polygon([
        { x: b.minX, y: b.minY },
        { x: b.maxX, y: b.minY },
        { x: b.maxX, y: b.maxY },
        { x: b.minX, y: b.maxY },
      ]),
    ])
  }

  const b = options.bounds ?? padBounds(sites, 0.1)
  const delaunay = Delaunay.from(
    sites,
    (d) => d.x,
    (d) => d.y,
  )
  const voronoi = delaunay.voronoi([b.minX, b.minY, b.maxX, b.maxY])
  const paths: Path[] = []
  for (let i = 0; i < sites.length; i++) {
    const poly = voronoi.cellPolygon(i)
    if (!poly || poly.length < 3) continue
    // d3 closes the ring by repeating the first point
    const ring = poly.slice(0, -1).map(([x, y]) => ({ x, y }))
    if (ring.length >= 3) paths.push(polygon(ring))
  }
  return group(paths)
}

/**
 * Voronoi clipped to the interior of `container` (intersect each cell).
 */
export function innerVoronoi(
  sites: Vec2[],
  container: Path,
  options: VoronoiOptions = {},
): Group {
  const b = options.bounds ?? {
    ...bounds(container),
  }
  const cells = compoundVoronoi(sites, { bounds: b })
  const clipped: Path[] = []
  for (const cell of cells.paths) {
    clipped.push(...intersect(cell, container).paths)
  }
  return group(clipped)
}

/** Raw cell polygons without container clip (same as compoundVoronoi). */
export function innerVoronoiRaw(
  sites: Vec2[],
  options: VoronoiOptions = {},
): Group {
  return compoundVoronoi(sites, options)
}

function padBounds(
  sites: Vec2[],
  padRatio: number,
): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const s of sites) {
    minX = Math.min(minX, s.x)
    minY = Math.min(minY, s.y)
    maxX = Math.max(maxX, s.x)
    maxY = Math.max(maxY, s.y)
  }
  const pad =
    Math.max(maxX - minX, maxY - minY, 1) * padRatio + 1e-6
  return {
    minX: minX - pad,
    minY: minY - pad,
    maxX: maxX + pad,
    maxY: maxY + pad,
  }
}

export const voronoi = {
  compoundVoronoi,
  innerVoronoi,
  innerVoronoiRaw,
}
