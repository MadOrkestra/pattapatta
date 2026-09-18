import type { Group, Path, Vec2 } from '../types/index.js'
import { group } from '../types/index.js'
import { bounds, containsPoint } from '../predicates/index.js'
import { maximumInscribedCircle } from '../optimisation/index.js'
import { poisson } from '../pointSet/index.js'
import { distanceToBoundary } from './boundaryDistance.js'
import {
  isolinesFromFunction,
  isolinesFromPoints,
} from './marchingSquares.js'

/**
 * Interior isolines of field `d_boundary − d_pole`.
 * Default pole is the maximum inscribed circle center.
 */
export function distanceField(
  shape: Path,
  spacing: number,
  pole?: Vec2,
): Group {
  if (!shape.closed || shape.rings.length === 0 || spacing <= 0) return group([])

  const b = bounds(shape)
  const span = Math.max(b.maxX - b.minX, b.maxY - b.minY, 1)
  let polePt = pole
  if (!polePt) {
    const mic = maximumInscribedCircle(shape, Math.max(span * 0.01, 0.1))
    polePt = mic
      ? { x: mic.x, y: mic.y }
      : { x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2 }
  }

  const pad = Math.max(spacing, 1)
  const box: [number, number, number, number] = [
    b.minX - pad,
    b.minY - pad,
    b.maxX + pad,
    b.maxY + pad,
  ]
  const sampleSpacing = Math.max(spacing / 10, span / 80)

  const fn = (x: number, y: number) => {
    const p = { x, y }
    if (!insideSafe(shape, p)) return Number.NEGATIVE_INFINITY
    const dGeo = distanceToBoundary(shape, p)
    const dPoint = Math.hypot(x - polePt!.x, y - polePt!.y)
    return dGeo - dPoint
  }

  const raw = isolinesFromFunction(box, sampleSpacing, spacing, fn)
  // Clip to shape by intersecting open paths as thin regions is hard;
  // filter vertices / keep only segments whose midpoint is inside.
  return clipPolylinesToPath(raw, shape)
}

/**
 * Contrast field isolines: `|d_boundary − d_reference|`.
 */
export function contrastField(
  shape: Path,
  intervals: number,
  reference: Vec2,
): Group {
  if (!shape.closed || shape.rings.length === 0 || intervals < 1) {
    return group([])
  }

  const b = bounds(shape)
  const areaApprox =
    (b.maxX - b.minX) * (b.maxY - b.minY)
  const count = Math.max(100, Math.floor(areaApprox / 100))
  const minDist = Math.sqrt(areaApprox / (count * 1.5))
  const samples = poisson(
    Math.max(minDist, 1e-3),
    b.minX,
    b.minY,
    b.maxX,
    b.maxY,
    1337,
  ).filter((p) => containsPoint(shape, p))

  if (samples.length < 3) return group([])

  const values = samples.map((p) => {
    const dB = distanceToBoundary(shape, p)
    const dR = Math.hypot(p.x - reference.x, p.y - reference.y)
    return Math.abs(dB - dR)
  })

  const lines = isolinesFromPoints(samples, values, Math.max(1, intervals), 0)
  return clipPolylinesToPath(lines, shape)
}

/**
 * Isolines from a high point inside a shape (topographic style).
 * Height ≈ distance from highPoint (negated outside).
 */
export function isolines(
  shape: Path,
  highPoint: Vec2,
  intervalSpacing: number,
): Group {
  if (!shape.closed || intervalSpacing <= 0) return group([])
  const b = bounds(shape)
  const span = Math.max(b.maxX - b.minX, b.maxY - b.minY, 1)
  const pad = intervalSpacing
  const box: [number, number, number, number] = [
    b.minX - pad,
    b.minY - pad,
    b.maxX + pad,
    b.maxY + pad,
  ]
  const fn = (x: number, y: number) => {
    if (!containsPoint(shape, { x, y })) return -1
    return Math.hypot(x - highPoint.x, y - highPoint.y)
  }
  const raw = isolinesFromFunction(
    box,
    Math.max(intervalSpacing / 8, span / 100),
    intervalSpacing,
    fn,
    0,
    span,
  )
  return clipPolylinesToPath(raw, shape)
}

function clipPolylinesToPath(g: Group, shape: Path): Group {
  const paths: Path[] = []
  for (const p of g.paths) {
    const ring = p.rings[0]
    if (!ring || ring.length < 2) continue
    let current: Vec2[] = []
    const flush = () => {
      if (current.length >= 2) {
        paths.push({ rings: [current], closed: false })
      }
      current = []
    }
    for (let i = 0; i < ring.length - 1; i++) {
      const a = ring[i]!
      const b = ring[i + 1]!
      if (!finitePt(a) || !finitePt(b)) {
        flush()
        continue
      }
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
      if (insideSafe(shape, mid)) {
        if (current.length === 0) current.push(a)
        current.push(b)
      } else {
        flush()
      }
    }
    flush()
  }
  return group(paths)
}

function finitePt(p: Vec2): boolean {
  return Number.isFinite(p.x) && Number.isFinite(p.y)
}

/** Ray-cast PIP avoiding Clipper scale overflow on extreme coords. */
function insideSafe(shape: Path, point: Vec2): boolean {
  if (!finitePt(point)) return false
  try {
    return containsPoint(shape, point)
  } catch {
    return pointInPoly(point, shape.rings[0]!) &&
      shape.rings.slice(1).every((h) => !pointInPoly(point, h))
  }
}

function pointInPoly(point: Vec2, ring: Vec2[]): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const pi = ring[i]!
    const pj = ring[j]!
    if (
      pi.y > point.y !== pj.y > point.y &&
      point.x <
        ((pj.x - pi.x) * (point.y - pi.y)) / (pj.y - pi.y + 1e-15) + pi.x
    ) {
      inside = !inside
    }
  }
  return inside
}
