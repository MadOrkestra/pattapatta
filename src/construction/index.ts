import type { Group, Path, Vec2 } from '../types/index.js'
import { group, path, polygon, polyline } from '../types/index.js'
import { compoundVoronoi } from '../voronoi/index.js'
import { stochasticMerge } from '../meshing/index.js'
import { buffer, smooth } from '../morphology/index.js'
import { subtractAll } from '../shapeBoolean/index.js'

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

/**
 * Sponge-like porous structure (PGS `createSponge`).
 * Voronoi cells are randomly class-merged, smoothed (Chaikin), optionally
 * eroded for wall thickness, then subtracted from the bounding rectangle.
 * Returns a group (may be multi-component).
 */
export function createSponge(
  width: number,
  height: number,
  generators: number,
  thickness: number,
  smoothing: number,
  classes: number,
  seed = 1,
): Group {
  const w = Math.max(width, 1e-9)
  const h = Math.max(height, 1e-9)
  const nGen = Math.max(6, Math.floor(generators))
  const nClasses = Math.max(1, Math.floor(classes))
  const smoothIters = Math.max(0, Math.floor(smoothing))
  const wall = Math.max(0, thickness)

  const sites = randomInBox(nGen, 0, 0, w, h, seed)
  const cells = compoundVoronoi(sites, {
    bounds: { minX: 0, minY: 0, maxX: w, maxY: h },
  })
  const merged = stochasticMerge(cells.paths, nClasses, seed + 1)

  const pores: Path[] = []
  for (let p of merged.paths) {
    if (smoothIters > 0) p = smooth(p, smoothIters)
    if (wall > 1e-12) {
      // Erode pore blobs so remaining walls are thicker
      pores.push(...buffer(p, -wall * 0.5).paths)
    } else {
      pores.push(p)
    }
  }

  const frame = createRect(0, 0, w, h)
  if (pores.length === 0) return group([frame])
  return subtractAll(frame, pores)
}

function randomInBox(
  count: number,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
  seed: number,
): Vec2[] {
  const rng = mulberry32(seed >>> 0)
  const out: Vec2[] = []
  for (let i = 0; i < count; i++) {
    out.push({
      x: minX + rng() * (maxX - minX),
      y: minY + rng() * (maxY - minY),
    })
  }
  return out
}

function mulberry32(a: number): () => number {
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
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
  createSponge,
}
