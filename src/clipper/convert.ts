import {
  FillRule,
  areaD,
  differenceD,
  intersectD,
  isPositiveD,
  pointInPolygonD,
  PointInPolygonResult,
  unionD,
  xorD,
  type PathD,
  type PathsD,
  type PointD,
} from 'clipper2-ts'
import type { Group, Path, Ring, Vec2 } from '../types/index.js'
import { group, normalizeRing, path, vec2 } from '../types/index.js'

export const DEFAULT_FILL_RULE = FillRule.NonZero

export function ringToPathD(ring: Ring): PathD {
  const pts: PointD[] = []
  for (const v of normalizeRing(ring)) {
    pts.push({ x: v.x, y: v.y, z: 0 })
  }
  return pts
}

/** Closed path → Clipper subject/clip paths (exterior + holes). */
export function pathToPathsD(p: Path): PathsD {
  if (!p.closed || p.rings.length === 0) {
    throw new Error('Boolean ops require a closed path with at least one ring')
  }
  return p.rings.map((ring) => ringToPathD(ring))
}

export function pathsDToGroup(paths: PathsD): Group {
  if (paths.length === 0) return group([])

  const outers: { ring: Ring; holes: Ring[] }[] = []
  const holes: Ring[] = []

  for (const pd of paths) {
    const ring = pathDToRing(pd)
    if (ring.length < 3) continue
    if (isPositiveD(pd)) {
      outers.push({ ring, holes: [] })
    } else {
      holes.push(ring)
    }
  }

  for (const hole of holes) {
    const sample = hole[0]
    if (!sample) continue
    let assigned = false
    for (const outer of outers) {
      if (pointInRing(sample, outer.ring)) {
        outer.holes.push(hole)
        assigned = true
        break
      }
    }
    if (!assigned) {
      // Treat unmatched negative rings as their own outers (orientation flip).
      outers.push({ ring: [...hole].reverse(), holes: [] })
    }
  }

  return group(outers.map((o) => path([o.ring, ...o.holes], true)))
}

export function pathDToRing(pd: PathD): Ring {
  return normalizeRing(pd.map((p) => vec2(p.x, p.y)))
}

export function pointInRing(point: Vec2, ring: Ring): boolean {
  const result = pointInPolygonD(
    { x: point.x, y: point.y, z: 0 },
    ringToPathD(ring),
  )
  return (
    result === PointInPolygonResult.IsInside ||
    result === PointInPolygonResult.IsOn
  )
}

export function clipUnion(a: PathsD, b: PathsD): PathsD {
  return unionD(a, b, DEFAULT_FILL_RULE)
}

export function clipIntersect(a: PathsD, b: PathsD): PathsD {
  return intersectD(a, b, DEFAULT_FILL_RULE)
}

export function clipDifference(a: PathsD, b: PathsD): PathsD {
  return differenceD(a, b, DEFAULT_FILL_RULE)
}

export function clipXor(a: PathsD, b: PathsD): PathsD {
  return xorD(a, b, DEFAULT_FILL_RULE)
}

export function pathsArea(paths: PathsD): number {
  let sum = 0
  for (const p of paths) {
    sum += Math.abs(areaD(p))
  }
  return sum
}
