/** 2D point / vector. */
export type Vec2 = {
  x: number
  y: number
}

export function vec2(x: number, y: number): Vec2 {
  return { x, y }
}

export function cloneVec2(v: Vec2): Vec2 {
  return { x: v.x, y: v.y }
}

export function equalsVec2(a: Vec2, b: Vec2, eps = 1e-9): boolean {
  return Math.abs(a.x - b.x) <= eps && Math.abs(a.y - b.y) <= eps
}
