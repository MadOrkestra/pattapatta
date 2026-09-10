import type { Group, Path, Vec2 } from '../types/index.js'
import { group, polygon } from '../types/index.js'
import { bounds } from '../predicates/index.js'
import { createRect } from '../construction/index.js'
import { intersect } from '../shapeBoolean/index.js'
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
}
