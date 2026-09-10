import type { Path, Ring, Segment, Vec2 } from '../types/index.js'
import { segment, vec2 } from '../types/index.js'
import { containsPoint } from '../predicates/index.js'

type Hit = { t: number; p: Vec2 }

/**
 * Clip an open segment to the interior of a closed path (exterior minus holes).
 * Returns zero or more interior sub-segments.
 */
export function clipSegmentToPath(seg: Segment, clip: Path): Segment[] {
  if (!clip.closed || !clip.rings[0]) return []

  const hits: Hit[] = []
  const pushHit = (t: number, p: Vec2) => {
    if (t < -1e-9 || t > 1 + 1e-9) return
    const tt = Math.min(1, Math.max(0, t))
    for (const h of hits) {
      if (Math.abs(h.t - tt) < 1e-9) return
    }
    hits.push({ t: tt, p })
  }

  if (containsPoint(clip, seg.a)) pushHit(0, seg.a)
  if (containsPoint(clip, seg.b)) pushHit(1, seg.b)

  for (const ring of clip.rings) {
    for (let i = 0; i < ring.length; i++) {
      const e0 = ring[i]!
      const e1 = ring[(i + 1) % ring.length]!
      const hit = segmentIntersection(seg.a, seg.b, e0, e1)
      if (hit) pushHit(hit.t, hit.p)
    }
  }

  hits.sort((a, b) => a.t - b.t)
  if (hits.length < 2) return []

  const out: Segment[] = []
  for (let i = 0; i + 1 < hits.length; i++) {
    const h0 = hits[i]!
    const h1 = hits[i + 1]!
    if (h1.t - h0.t < 1e-9) continue
    const mid = vec2((h0.p.x + h1.p.x) / 2, (h0.p.y + h1.p.y) / 2)
    if (containsPoint(clip, mid)) {
      out.push(segment(h0.p, h1.p))
    }
  }
  return out
}

export function clipSegmentsToPath(
  segments: Segment[],
  clip: Path,
): Segment[] {
  const out: Segment[] = []
  for (const s of segments) {
    out.push(...clipSegmentToPath(s, clip))
  }
  return out
}

function segmentIntersection(
  a: Vec2,
  b: Vec2,
  c: Vec2,
  d: Vec2,
): { t: number; p: Vec2 } | null {
  const rX = b.x - a.x
  const rY = b.y - a.y
  const sX = d.x - c.x
  const sY = d.y - c.y
  const denom = rX * sY - rY * sX
  if (Math.abs(denom) < 1e-12) return null
  const t = ((c.x - a.x) * sY - (c.y - a.y) * sX) / denom
  const u = ((c.x - a.x) * rY - (c.y - a.y) * rX) / denom
  if (t < -1e-9 || t > 1 + 1e-9 || u < -1e-9 || u > 1 + 1e-9) return null
  return {
    t,
    p: vec2(a.x + t * rX, a.y + t * rY),
  }
}

/** @internal exported for tests */
export type { Ring }
