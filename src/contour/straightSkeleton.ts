import type { Group, Path, Vec2 } from '../types/index.js'
import { group, polygon, segment } from '../types/index.js'
import { densify } from '../processing/index.js'
import { bounds, containsPoint, centroid } from '../predicates/index.js'
import { buffer } from '../morphology/buffer.js'
import { dissolveSegments } from './dissolve.js'

export type StraightSkeletonParts = {
  faces: Group
  branches: Group
  bones: Group
}

/**
 * Straight skeleton approximation via successive inward miter offsets.
 *
 * Returns a flat GROUP: closed face paths, then branch polylines, then bone
 * polylines. Prefer {@link straightSkeletonParts} for structured access.
 *
 * Exact kinetic straight skeletons are deferred; this offset-trace method is
 * robust, terminates, and yields plotter-useful bones/branches/faces.
 */
export function straightSkeleton(shape: Path): Group {
  const parts = straightSkeletonParts(shape)
  return group([
    ...parts.faces.paths,
    ...parts.branches.paths,
    ...parts.bones.paths,
  ])
}

export function straightSkeletonParts(shape: Path): StraightSkeletonParts {
  const empty: StraightSkeletonParts = {
    faces: group([]),
    branches: group([]),
    bones: group([]),
  }
  if (!shape.closed || !shape.rings[0] || shape.rings[0].length < 3) {
    return empty
  }

  const b = bounds(shape)
  const span = Math.max(b.maxX - b.minX, b.maxY - b.minY, 1)
  const delta = Math.max(span / 40, 0.5)
  const densified = densify(shape, Math.max(span / 40, 1e-3))

  const levels: Path[] = [densified]
  let current = densified
  for (let i = 0; i < 40; i++) {
    const next = buffer(current, -delta)
    if (next.paths.length === 0) break
    // Pick largest remaining component
    let best = next.paths[0]!
    let bestA = -1
    for (const p of next.paths) {
      const bb = bounds(p)
      const a = (bb.maxX - bb.minX) * (bb.maxY - bb.minY)
      if (a > bestA) {
        bestA = a
        best = p
      }
    }
    if (!best.rings[0] || best.rings[0].length < 3) break
    levels.push(best)
    current = best
  }

  const boneSegs = []
  for (let i = 0; i < levels.length - 1; i++) {
    const a = levels[i]!
    const bb = levels[i + 1]!
    const ca = centroid(a)
    const cb = centroid(bb)
    if (containsPoint(shape, mid(ca, cb))) {
      boneSegs.push(segment(ca, cb))
    }
    // Vertex traces: each vertex of level i → nearest on level i+1
    for (const ring of a.rings) {
      for (const p of ring) {
        const q = nearestOnPath(bb, p)
        if (q && containsPoint(shape, mid(p, q))) {
          boneSegs.push(segment(p, q))
        }
      }
    }
  }

  // Branches: exterior edge midpoints → nearest point on first inset (or bone)
  const branchSegs = []
  const outer = densified.rings[0]!
  const target = levels[1] ?? levels[0]!
  for (let i = 0; i < outer.length; i++) {
    const a = outer[i]!
    const bb = outer[(i + 1) % outer.length]!
    const m = mid(a, bb)
    const q = nearestOnPath(target, m)
    if (q) branchSegs.push(segment(m, q))
  }

  // Faces: each original edge + path to corresponding inset edge midpoints
  const faces: Path[] = []
  if (levels.length >= 2) {
    const inner = levels[1]!.rings[0] ?? []
    for (let i = 0; i < outer.length; i++) {
      const a = outer[i]!
      const bb = outer[(i + 1) % outer.length]!
      const ia = nearestOnRing(inner, a)
      const ib = nearestOnRing(inner, bb)
      if (ia && ib) {
        const face = [a, bb, ib, ia]
        const c = {
          x: (a.x + bb.x + ib.x + ia.x) / 4,
          y: (a.y + bb.y + ib.y + ia.y) / 4,
        }
        if (containsPoint(shape, c)) faces.push(polygon(face))
      }
    }
  }

  return {
    faces: group(faces),
    branches: dissolveSegments(branchSegs),
    bones: dissolveSegments(boneSegs),
  }
}

function mid(a: Vec2, b: Vec2): Vec2 {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

function nearestOnPath(p: Path, q: Vec2): Vec2 | null {
  let best: Vec2 | null = null
  let bestD = Infinity
  for (const ring of p.rings) {
    for (const v of ring) {
      const d = Math.hypot(v.x - q.x, v.y - q.y)
      if (d < bestD) {
        bestD = d
        best = v
      }
    }
  }
  return best
}

function nearestOnRing(ring: Vec2[], q: Vec2): Vec2 | null {
  if (ring.length === 0) return null
  let best = ring[0]!
  let bestD = Infinity
  for (const v of ring) {
    const d = Math.hypot(v.x - q.x, v.y - q.y)
    if (d < bestD) {
      bestD = d
      best = v
    }
  }
  return best
}
