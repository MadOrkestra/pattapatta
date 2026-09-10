import type { Vec2 } from './vec2.js'

/** Circle with center (x, y) and radius r (PGS often stored radius in PVector.z). */
export type Circle = {
  x: number
  y: number
  r: number
}

export function circle(x: number, y: number, r: number): Circle {
  return { x, y, r }
}

export function circleCenter(c: Circle): Vec2 {
  return { x: c.x, y: c.y }
}
