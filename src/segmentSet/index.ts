import type { Segment, Vec2 } from '../types/index.js'
import { segment, vec2 } from '../types/index.js'

/** Match Processing `float` for PGS parity on hatch fixtures. */
function f32(n: number): number {
  return Math.fround(n)
}

/**
 * Parallel segments through a center point (PGS `parallelSegments` semantics).
 * `length` is the half-length along the segment direction; full span is `2 * length`.
 * `angle` is radians along the segment; spacing is perpendicular.
 */
export function parallelSegments(
  centerX: number,
  centerY: number,
  length: number,
  spacing: number,
  angle: number,
  n: number,
): Segment[] {
  const edges: Segment[] = []
  if (n < 1) return edges

  const center = vec2(f32(centerX), f32(centerY))
  let dx = f32(Math.cos(angle + Math.PI / 2) * spacing)
  let dy = f32(Math.sin(angle + Math.PI / 2) * spacing)
  const cos = f32(Math.cos(angle))
  const sin = f32(Math.sin(angle))
  const l = f32(length)

  let i: number
  let offX = 0
  let offY = 0

  if (n % 2 === 1) {
    const a = vec2(f32(center.x + cos * l), f32(center.y + sin * l))
    const b = vec2(f32(center.x + cos * -l), f32(center.y + sin * -l))
    edges.push(segment(a, b))
    i = 1
  } else {
    dx = f32(dx / 2)
    dy = f32(dy / 2)
    i = 1
    {
      let a = vec2(f32(center.x + dx * i), f32(center.y + dy * i))
      const b = vec2(f32(a.x + cos * l), f32(a.y + sin * l))
      a = vec2(f32(a.x + cos * -l), f32(a.y + sin * -l))
      edges.push(segment(a, b))
    }
    {
      let a = vec2(f32(center.x + dx * -i), f32(center.y + dy * -i))
      const b = vec2(f32(a.x + cos * l), f32(a.y + sin * l))
      a = vec2(f32(a.x + cos * -l), f32(a.y + sin * -l))
      edges.push(segment(a, b))
    }
    i = 2
    dx = f32(dx * 2)
    dy = f32(dy * 2)
    offX = f32(dx / 2)
    offY = f32(dy / 2)
  }

  for (; i < 1 + Math.floor(n / 2); i++) {
    {
      let a = vec2(
        f32(center.x + dx * i - offX),
        f32(center.y + dy * i - offY),
      )
      const b = vec2(f32(a.x + cos * l), f32(a.y + sin * l))
      a = vec2(f32(a.x + cos * -l), f32(a.y + sin * -l))
      edges.push(segment(a, b))
    }
    {
      let a = vec2(
        f32(center.x + dx * -i + offX),
        f32(center.y + dy * -i + offY),
      )
      const b = vec2(f32(a.x + cos * l), f32(a.y + sin * l))
      a = vec2(f32(a.x + cos * -l), f32(a.y + sin * -l))
      edges.push(segment(a, b))
    }
  }

  return edges
}

export function filterByMinLength(
  segments: Segment[],
  minLength: number,
): Segment[] {
  return segments.filter((s) => segmentLength(s) >= minLength)
}

export function filterAxisAligned(
  segments: Segment[],
  angleDelta: number,
): Segment[] {
  return segments.filter((s) => {
    const ang = Math.abs(Math.atan2(s.b.y - s.a.y, s.b.x - s.a.x))
    const norm = Math.min(ang % Math.PI, Math.PI - (ang % Math.PI))
    const nearH = norm <= angleDelta || Math.abs(norm - Math.PI) <= angleDelta
    const nearV = Math.abs(norm - Math.PI / 2) <= angleDelta
    return !(nearH || nearV)
  })
}

export function segmentLength(s: Segment): number {
  const dx = s.b.x - s.a.x
  const dy = s.b.y - s.a.y
  return Math.hypot(dx, dy)
}

export function segmentsToOpenPaths(segments: Segment[]) {
  return segments.map((s) => ({
    rings: [[s.a, s.b]],
    closed: false as const,
  }))
}

export const segmentSet = {
  parallelSegments,
  filterByMinLength,
  filterAxisAligned,
  segmentLength,
  segmentsToOpenPaths,
}

export type { Vec2 }
