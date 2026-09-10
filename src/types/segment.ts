import type { Vec2 } from './vec2.js'

/** Line segment between two points. */
export type Segment = {
  a: Vec2
  b: Vec2
}

export function segment(a: Vec2, b: Vec2): Segment {
  return { a, b }
}
