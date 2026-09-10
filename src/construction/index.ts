import type { Path, Vec2 } from '../types/index.js'
import { path, polygon, polyline } from '../types/index.js'

/** Regular n-gon approximating a circle. */
export function createCircle(
  cx: number,
  cy: number,
  radius: number,
  segments = 64,
): Path {
  return createRegularPolygon(cx, cy, radius, Math.max(3, Math.floor(segments)))
}

export function createRect(
  x: number,
  y: number,
  width: number,
  height: number,
): Path {
  return polygon([
    { x, y },
    { x: x + width, y },
    { x: x + width, y: y + height },
    { x, y: y + height },
  ])
}

export function createRegularPolygon(
  cx: number,
  cy: number,
  radius: number,
  sides: number,
  rotation = -Math.PI / 2,
): Path {
  const n = Math.max(3, Math.floor(sides))
  const ring: Vec2[] = []
  for (let i = 0; i < n; i++) {
    const t = rotation + (i / n) * Math.PI * 2
    ring.push({ x: cx + Math.cos(t) * radius, y: cy + Math.sin(t) * radius })
  }
  return polygon(ring)
}

/** Annulus as exterior + hole. */
export function createRing(
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  segments = 64,
): Path {
  const outer = createCircle(cx, cy, outerRadius, segments).rings[0]!
  const inner = createCircle(cx, cy, Math.min(innerRadius, outerRadius), segments)
    .rings[0]!
  // hole winding opposite for Clipper
  return path([outer, [...inner].reverse()], true)
}

/** Open circular arc polyline from `startAngle` to `endAngle` (radians). */
export function createArc(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  segments = 32,
): Path {
  const n = Math.max(2, Math.floor(segments))
  const pts: Vec2[] = []
  for (let i = 0; i <= n; i++) {
    const t = startAngle + ((endAngle - startAngle) * i) / n
    pts.push({ x: cx + Math.cos(t) * radius, y: cy + Math.sin(t) * radius })
  }
  return polyline(pts)
}

/** Star polygon (outer/inner radius alternating). */
export function createStar(
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  points = 5,
  rotation = -Math.PI / 2,
): Path {
  const n = Math.max(3, Math.floor(points))
  const ring: Vec2[] = []
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 === 0 ? outerRadius : innerRadius
    const t = rotation + (i / (n * 2)) * Math.PI * 2
    ring.push({ x: cx + Math.cos(t) * r, y: cy + Math.sin(t) * r })
  }
  return polygon(ring)
}

/** Koch snowflake after `iterations` refinement (0 = equilateral triangle). */
export function createKochSnowflake(
  cx: number,
  cy: number,
  radius: number,
  iterations = 3,
): Path {
  const tri = createRegularPolygon(cx, cy, radius, 3)
  let ring = tri.rings[0]!
  const iters = Math.max(0, Math.min(6, Math.floor(iterations)))
  for (let i = 0; i < iters; i++) {
    ring = kochRefine(ring)
  }
  return polygon(ring)
}

function kochRefine(ring: Vec2[]): Vec2[] {
  const out: Vec2[] = []
  const n = ring.length
  for (let i = 0; i < n; i++) {
    const a = ring[i]!
    const b = ring[(i + 1) % n]!
    const dx = b.x - a.x
    const dy = b.y - a.y
    const p1 = { x: a.x + dx / 3, y: a.y + dy / 3 }
    const p2 = { x: a.x + (2 * dx) / 3, y: a.y + (2 * dy) / 3 }
    // outward peak (left of directed edge in Y-down SVG coords = rotate +90 for CCW tri)
    const px = a.x + dx / 2 - dy * (Math.sqrt(3) / 6)
    const py = a.y + dy / 2 + dx * (Math.sqrt(3) / 6)
    out.push(a, p1, { x: px, y: py }, p2)
  }
  return out
}

export const construction = {
  createCircle,
  createRect,
  createRegularPolygon,
  createRing,
  createArc,
  createStar,
  createKochSnowflake,
}
