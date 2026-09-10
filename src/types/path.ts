import type { Vec2 } from './vec2.js'
import { cloneVec2, equalsVec2 } from './vec2.js'

/** Ordered ring of vertices (typically without repeating the closing vertex). */
export type Ring = Vec2[]

/**
 * A path: one exterior ring plus optional holes, or an open polyline.
 * `rings[0]` is the exterior (or the open polyline when `closed` is false).
 * Additional rings are holes (only meaningful when `closed` is true).
 */
export type Path = {
  rings: Ring[]
  closed: boolean
}

export function path(rings: Ring[], closed = true): Path {
  return {
    rings: rings.map((ring) => ring.map(cloneVec2)),
    closed,
  }
}

export function polyline(points: Ring): Path {
  return path([points], false)
}

export function polygon(exterior: Ring, holes: Ring[] = []): Path {
  return path([exterior, ...holes], true)
}

/** Drop a trailing vertex that duplicates the first (SVG often closes this way). */
export function normalizeRing(ring: Ring, eps = 1e-9): Ring {
  if (ring.length < 2) return ring.map(cloneVec2)
  const first = ring[0]
  const last = ring[ring.length - 1]
  if (first && last && equalsVec2(first, last, eps)) {
    return ring.slice(0, -1).map(cloneVec2)
  }
  return ring.map(cloneVec2)
}

export function clonePath(p: Path): Path {
  return {
    closed: p.closed,
    rings: p.rings.map((ring) => ring.map(cloneVec2)),
  }
}
