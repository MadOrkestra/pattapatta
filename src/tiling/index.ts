import type { Group, Path, Vec2 } from '../types/index.js'
import { group, polygon } from '../types/index.js'
import { area, bounds } from '../predicates/index.js'
import { createCircle, createRect } from '../construction/index.js'
import { intersect, subtract } from '../shapeBoolean/index.js'
import { slice } from '../processing/index.js'

/** Axis-aligned square cells covering a box. */
export function squareGrid(
  spacing: number,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
): Group {
  const s = Math.max(spacing, 1e-9)
  const paths: Path[] = []
  for (let x = minX; x < maxX - 1e-12; x += s) {
    for (let y = minY; y < maxY - 1e-12; y += s) {
      const w = Math.min(s, maxX - x)
      const h = Math.min(s, maxY - y)
      if (w > 1e-12 && h > 1e-12) paths.push(createRect(x, y, w, h))
    }
  }
  return group(paths)
}

/** Pointy-top hex cells covering a box (flat radii ≈ spacing/2). */
export function hexTiling(
  spacing: number,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
): Group {
  const s = Math.max(spacing, 1e-9)
  const r = s / 2
  const dx = s * 0.75
  const dy = s * Math.sqrt(3) * 0.5
  const paths: Path[] = []
  let row = 0
  for (let y = minY + r; y <= maxY + r; y += dy, row++) {
    const x0 = minX + r + (row % 2 === 0 ? 0 : dx * 0.5)
    for (let x = x0; x <= maxX + r; x += dx) {
      paths.push(hexagon(x, y, r))
    }
  }
  return group(paths)
}

function hexagon(cx: number, cy: number, r: number): Path {
  const ring: Vec2[] = []
  for (let i = 0; i < 6; i++) {
    const t = (Math.PI / 180) * (60 * i - 30)
    ring.push({ x: cx + Math.cos(t) * r, y: cy + Math.sin(t) * r })
  }
  return polygon(ring)
}

/** Split a rectangle into an `nx` × `ny` grid of cells. */
export function rectSubdivision(p: Path, nx: number, ny: number): Group {
  const b = bounds(p)
  const cols = Math.max(1, Math.floor(nx))
  const rows = Math.max(1, Math.floor(ny))
  const dw = (b.maxX - b.minX) / cols
  const dh = (b.maxY - b.minY) / rows
  const paths: Path[] = []
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const cell = createRect(
        b.minX + i * dw,
        b.minY + j * dh,
        dw,
        dh,
      )
      paths.push(...intersect(p, cell).paths)
    }
  }
  return group(paths)
}

/** Recursively split each quad face into 4 by edge midpoints (`depth` times). */
export function quadSubdivision(faces: Path[], depth = 1): Group {
  let cur = faces
  const d = Math.max(0, Math.floor(depth))
  for (let i = 0; i < d; i++) {
    const next: Path[] = []
    for (const f of cur) {
      next.push(...subdivideQuad(f))
    }
    cur = next
  }
  return group(cur)
}

function subdivideQuad(p: Path): Path[] {
  const ring = p.rings[0]
  if (!ring || ring.length < 4) return [p]
  const [a, b, c, d] = ring
  if (!a || !b || !c || !d) return [p]
  const mab = mid(a, b)
  const mbc = mid(b, c)
  const mcd = mid(c, d)
  const mda = mid(d, a)
  const cen = mid(mid(a, c), mid(b, d))
  return [
    polygon([a, mab, cen, mda]),
    polygon([mab, b, mbc, cen]),
    polygon([cen, mbc, c, mcd]),
    polygon([mda, cen, mcd, d]),
  ]
}

/** Split each triangle into 4 by edge midpoints. */
export function triangleSubdivision(faces: Path[], depth = 1): Group {
  let cur = faces
  const d = Math.max(0, Math.floor(depth))
  for (let i = 0; i < d; i++) {
    const next: Path[] = []
    for (const f of cur) {
      next.push(...subdivideTriangle(f))
    }
    cur = next
  }
  return group(cur)
}

function subdivideTriangle(p: Path): Path[] {
  const ring = p.rings[0]
  if (!ring || ring.length < 3) return [p]
  const a = ring[0]!
  const b = ring[1]!
  const c = ring[2]!
  const mab = mid(a, b)
  const mbc = mid(b, c)
  const mca = mid(c, a)
  return [
    polygon([a, mab, mca]),
    polygon([mab, b, mbc]),
    polygon([mca, mbc, c]),
    polygon([mab, mbc, mca]),
  ]
}

/**
 * Slice a path into strips with parallel cuts spaced by `spacing`.
 * Angle in radians (0 = vertical cuts).
 */
export function sliceDivision(
  p: Path,
  spacing: number,
  angle = 0,
): Group {
  const s = Math.max(spacing, 1e-9)
  const b = bounds(p)
  const cx = (b.minX + b.maxX) / 2
  const cy = (b.minY + b.maxY) / 2
  const diag = Math.hypot(b.maxX - b.minX, b.maxY - b.minY) + s
  const ux = Math.cos(angle)
  const uy = Math.sin(angle)
  // normal for cut lines
  const nx = -uy
  const ny = ux
  const parts: Path[] = [p]
  for (let t = -diag; t <= diag; t += s) {
    const a = { x: cx + nx * t - ux * diag, y: cy + ny * t - uy * diag }
    const bb = { x: cx + nx * t + ux * diag, y: cy + ny * t + uy * diag }
    const next: Path[] = []
    for (const piece of parts) {
      const g = slice(piece, a, bb)
      next.push(...(g.paths.length ? g.paths : [piece]))
    }
    parts.length = 0
    parts.push(...next)
  }
  return group(parts)
}

/** Parallel hatch-like strip division (alias of sliceDivision). */
export function hatchSubdivision(
  p: Path,
  spacing: number,
  angle = 0,
): Group {
  return sliceDivision(p, spacing, angle)
}

/**
 * Cellular partition of a rectangle using arcs from circles seeded on the
 * boundary (PGS `arcDivision`). Each circle radius is large enough to hit at
 * least two distinct sides.
 */
export function arcDivision(
  width: number,
  height: number,
  arcs: number,
  seed = 1,
  circlePoints = 64,
): Group {
  const w = Math.max(width, 1e-9)
  const h = Math.max(height, 1e-9)
  const n = Math.max(0, Math.floor(arcs))
  const segs = Math.max(8, Math.floor(circlePoints))
  const rect = createRect(0, 0, w, h)
  if (n === 0) return group([rect])

  const rng = mulberry32(seed >>> 0)
  let faces: Path[] = [rect]
  const minArea = w * h * 1e-8

  for (let i = 0; i < n; i++) {
    const { cx, cy, r } = sampleBoundaryCircle(w, h, rng)
    const disk = createCircle(cx, cy, r, segs)
    const next: Path[] = []
    for (const face of faces) {
      for (const piece of intersect(face, disk).paths) {
        if (area(piece) > minArea) next.push(piece)
      }
      for (const piece of subtract(face, disk).paths) {
        if (area(piece) > minArea) next.push(piece)
      }
    }
    if (next.length > 0) faces = next
  }
  return group(faces)
}

/** Place a circle center on the AABB perimeter with radius ≥ dist to a second side. */
function sampleBoundaryCircle(
  w: number,
  h: number,
  rng: () => number,
): { cx: number; cy: number; r: number } {
  const peri = 2 * (w + h)
  let t = rng() * peri
  let cx: number
  let cy: number
  let side: 0 | 1 | 2 | 3
  if (t < w) {
    side = 0 // top y=0
    cx = t
    cy = 0
  } else {
    t -= w
    if (t < h) {
      side = 1 // right x=w
      cx = w
      cy = t
    } else {
      t -= h
      if (t < w) {
        side = 2 // bottom y=h
        cx = w - t
        cy = h
      } else {
        side = 3 // left x=0
        cx = 0
        cy = h - (t - w)
      }
    }
  }

  const distOther = [
    cy, // to top
    w - cx, // to right
    h - cy, // to bottom
    cx, // to left
  ]
  // Min distance to a side other than the one we sit on
  let minSecond = Infinity
  for (let s = 0; s < 4; s++) {
    if (s === side) continue
    minSecond = Math.min(minSecond, distOther[s]!)
  }
  const maxR = Math.hypot(w, h)
  const r = minSecond + rng() * Math.max(0, maxR - minSecond)
  return { cx, cy, r: Math.max(r, minSecond + 1e-6) }
}

function mulberry32(a: number): () => number {
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function mid(a: Vec2, b: Vec2): Vec2 {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

export const tiling = {
  squareGrid,
  hexTiling,
  rectSubdivision,
  quadSubdivision,
  triangleSubdivision,
  sliceDivision,
  hatchSubdivision,
  arcDivision,
}
