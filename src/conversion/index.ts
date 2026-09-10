import type { Group, Path, Vec2 } from '../types/index.js'
import {
  cloneGroup,
  clonePath,
  group,
  normalizeRing,
  path,
} from '../types/index.js'
import { reducePrecision } from '../morphology/index.js'

/** Deep copy of a path. */
export function copy(p: Path): Path {
  return clonePath(p)
}

/** Flatten a group to a single path list (already flat; returns cloned paths). */
export function flatten(g: Group): Path[] {
  return g.paths.map(clonePath)
}

/** Round all vertex coords (delegates to morphology.reducePrecision). */
export function roundVertexCoords(p: Path, decimals: number): Path {
  return reducePrecision(p, decimals)
}

/** Flat [x0,y0,x1,y1,...] of the exterior ring (holes omitted). */
export function toArray(p: Path): number[] {
  const ring = p.rings[0] ?? []
  const out: number[] = []
  for (const v of ring) {
    out.push(v.x, v.y)
  }
  return out
}

/** Build a closed polygon from flat [x0,y0,...] coords. */
export function fromArray(coords: number[], closed = true): Path {
  const ring: Vec2[] = []
  for (let i = 0; i + 1 < coords.length; i += 2) {
    ring.push({ x: coords[i]!, y: coords[i + 1]! })
  }
  return path([normalizeRing(ring)], closed)
}

/** Exterior + each hole as separate contour paths. */
export function toContours(p: Path): Path[] {
  return p.rings
    .filter((r) => r.length >= 3)
    .map((r) => path([normalizeRing(r)], true))
}

/** Merge contour paths into one multi-ring path (first = exterior). */
export function fromContours(contours: Path[]): Path {
  if (contours.length === 0) return path([], true)
  const rings = contours.map((c) => normalizeRing(c.rings[0] ?? []))
  return path(rings, true)
}

export const conversion = {
  copy,
  flatten,
  roundVertexCoords,
  toArray,
  fromArray,
  toContours,
  fromContours,
  cloneGroup,
  group,
}
