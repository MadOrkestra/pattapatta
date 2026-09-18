import type { Circle, Path, Vec2 } from '../types/index.js'
import { circle } from '../types/index.js'
import { bounds, containsPoint } from '../predicates/index.js'

/**
 * Lattice inclusion mode.
 * - `overlap` (default): full-path fill — keep disks that overlap the path;
 *   center the lattice so opposite-edge cutoffs match. Clip in SVG to cut at
 *   the boundary (including holes).
 * - `contained`: keep only disks fully inside the path (when you must stroke
 *   complete circles); lattice centered with equal leftover margins.
 */
export type LatticePackMode = 'overlap' | 'contained'

/**
 * Square lattice of equal circles.
 * @see docs/decisions/0003-deferred-circle-packing.md
 */
export function squareLatticePack(
  path: Path,
  diameter: number,
  mode: LatticePackMode = 'overlap',
): Circle[] {
  const d = Math.max(diameter, 0.1)
  const r = d / 2
  const b = bounds(path)
  const out: Circle[] = []
  const accept =
    mode === 'contained' ? circleContainedInPath : circleOverlapsPath
  const inset = mode === 'contained' ? r : 0
  const { ox, oy, nX, nY } = centeredLatticeGrid(b, d, d, inset, d)
  if (nX < 1 || nY < 1) return out

  for (let i = 0; i < nX; i++) {
    for (let j = 0; j < nY; j++) {
      const c = circle(ox + i * d, oy + j * d, r)
      if (accept(c, path)) out.push(c)
    }
  }
  return out
}

/**
 * Hexagonal lattice of equal circles.
 */
export function hexLatticePack(
  path: Path,
  diameter: number,
  mode: LatticePackMode = 'overlap',
): Circle[] {
  const d = Math.max(diameter, 0.1)
  const r = d / 2
  const b = bounds(path)
  const z = r * Math.sqrt(3)
  const out: Circle[] = []
  const accept =
    mode === 'contained' ? circleContainedInPath : circleOverlapsPath
  const inset = mode === 'contained' ? r : 0
  const { ox, nX, nY } = centeredLatticeGrid(b, z, d, inset, d)
  if (nX < 1 || nY < 1) return out

  // First column uses offset `r`, so Y centers span [oy - r, oy + (nY-1)*d].
  // Re-center that full extent so top/bottom cutoffs match.
  const innerH = b.maxY - b.minY - 2 * inset
  const extentY = (nY - 1) * d + r
  const oy = b.minY + inset + (innerH - extentY) / 2 + r

  let offset = 0
  for (let i = 0; i < nX; i++) {
    offset = offset === r ? 0 : r
    for (let j = 0; j < nY; j++) {
      const c = circle(ox + i * z, oy + j * d - offset, r)
      if (accept(c, path)) out.push(c)
    }
  }
  return out
}

/**
 * Centered lattice grid. `inset` > 0 (contained) keeps disk edges inside the AABB;
 * `inset` 0 (overlap) matches PGS coverage count, shifted so opposite cutoffs match.
 * `endPad` mirrors the historical loop bound `max + diameter`.
 */
function centeredLatticeGrid(
  b: { minX: number; minY: number; maxX: number; maxY: number },
  stepX: number,
  stepY: number,
  inset: number,
  endPad: number,
): { ox: number; oy: number; nX: number; nY: number } {
  const innerW = b.maxX - b.minX - 2 * inset
  const innerH = b.maxY - b.minY - 2 * inset
  if (innerW < -1e-9 || innerH < -1e-9) {
    return { ox: 0, oy: 0, nX: 0, nY: 0 }
  }

  let nX: number
  let nY: number
  if (inset > 0) {
    nX = Math.floor(innerW / stepX + 1e-9) + 1
    nY = Math.floor(innerH / stepY + 1e-9) + 1
  } else {
    // Same count as `for (x = min; x < max + endPad; x += step)`
    nX = Math.floor((innerW + endPad) / stepX - 1e-12) + 1
    nY = Math.floor((innerH + endPad) / stepY - 1e-12) + 1
  }

  const spanX = (nX - 1) * stepX
  const spanY = (nY - 1) * stepY
  const ox = b.minX + inset + (innerW - spanX) / 2
  const oy = b.minY + inset + (innerH - spanY) / 2
  return { ox, oy, nX, nY }
}

/**
 * Seeded stochastic packing: sample random points, grow max non-overlapping
 * radius (tangent to nearest circle or limited by distance to boundary).
 * Triangulation Steiner mode deferred.
 */
export function stochasticPack(
  path: Path,
  points: number,
  minRadius: number,
  seed = 1,
): Circle[] {
  const rng = mulberry32(seed >>> 0)
  const b = bounds(path)
  const packing: Circle[] = []

  for (let attempt = 0; attempt < points; attempt++) {
    const p = vecInBounds(b, rng)
    if (!containsPoint(path, p)) continue

    const maxR = clearanceRadius(p, path, packing)
    if (maxR < minRadius) continue
    packing.push(circle(p.x, p.y, maxR))
  }

  return packing
}

/**
 * Pack up to `n` maximum inscribed circles via iterative largest-empty-circle
 * search (grid + local refine). Circles are fully contained and non-overlapping.
 * `tolerance` controls coarse grid step as a fraction of the bbox diagonal
 * (PGS uses a related accuracy knob; values ~0.5–1 are reasonable).
 *
 * Deferred: `tangencyPack`, `trinscribedPack` — see ADR 0003.
 */
export function maximumInscribedPack(
  path: Path,
  n: number,
  tolerance = 1,
): Circle[] {
  return obstaclePack(path, [], n, tolerance)
}

/**
 * Pack inscribed circles while radius stays ≥ `minRadius`.
 */
export function maximumInscribedPackUntil(
  path: Path,
  minRadius: number,
  tolerance = 1,
): Circle[] {
  const packing: Circle[] = []
  const tol = Math.max(0.01, tolerance)
  const minR = Math.max(0.01, minRadius)
  for (;;) {
    const next = findLargestEmptyCircle(path, packing, tol)
    if (!next || next.r < minR) break
    packing.push(next)
  }
  return packing
}

/**
 * Successive LECs inside `path`, treating `obstacles` as already-placed disks.
 * Simpler than full PGS obstacle packing; sufficient for “avoid these circles.”
 */
export function obstaclePack(
  path: Path,
  obstacles: Circle[],
  n: number,
  tolerance = 1,
): Circle[] {
  const packing: Circle[] = obstacles.map((c) => ({ ...c }))
  const placed: Circle[] = []
  const tol = Math.max(0.01, tolerance)
  for (let i = 0; i < n; i++) {
    const next = findLargestEmptyCircle(path, packing, tol)
    if (!next || next.r <= 1e-9) break
    packing.push(next)
    placed.push(next)
  }
  return placed
}

/**
 * Front-chain-inspired packing of (possibly varying) radii in the path envelope,
 * then keep circles that overlap the path. Seeded for determinism.
 * Not a line-by-line port of PGS FrontChainPacker — same role, approximate layout.
 */
export function frontChainPack(
  path: Path,
  radiusMin: number,
  radiusMax: number,
  seed = 1,
): Circle[] {
  let rMin = Math.max(1e-6, Math.min(radiusMin, radiusMax))
  let rMax = Math.max(rMin, Math.max(radiusMin, radiusMax))
  const rng = mulberry32(seed >>> 0)
  const b = bounds(path)
  const packing: Circle[] = []

  // Seed a few circles near the envelope, then grow a frontier of tangent candidates.
  const seeds = 8
  for (let i = 0; i < seeds; i++) {
    const p = vecInBounds(b, rng)
    const r = rMin + rng() * (rMax - rMin)
    const c = circle(p.x, p.y, r)
    if (!overlapsAny(c, packing) && circleOverlapsPath(c, path)) {
      packing.push(c)
    }
  }

  const maxCircles = 400
  let guard = 0
  while (packing.length < maxCircles && guard++ < maxCircles * 8) {
    if (packing.length === 0) break
    const base = packing[Math.floor(rng() * packing.length)]!
    const ang = rng() * Math.PI * 2
    const r = rMin + rng() * (rMax - rMin)
    const dist = base.r + r
    const c = circle(
      base.x + Math.cos(ang) * dist,
      base.y + Math.sin(ang) * dist,
      r,
    )
    if (
      c.x < b.minX - rMax ||
      c.x > b.maxX + rMax ||
      c.y < b.minY - rMax ||
      c.y > b.maxY + rMax
    ) {
      continue
    }
    if (!overlapsAny(c, packing) && circleOverlapsPath(c, path)) {
      packing.push(c)
    }
  }

  return packing.filter((c) => circleOverlapsPath(c, path))
}

/**
 * Seed random circles in the envelope, then iteratively repulse overlaps;
 * keep those that overlap the path (PGS repulsionPack role).
 */
export function repulsionPack(
  path: Path,
  radiusMin: number,
  radiusMax: number,
  seed = 1,
  iterations = 80,
): Circle[] {
  const rMin = Math.max(1e-6, Math.min(radiusMin, radiusMax))
  const rMax = Math.max(rMin, Math.max(radiusMin, radiusMax))
  const rng = mulberry32(seed >>> 0)
  const b = bounds(path)
  const area = Math.max(1e-6, (b.maxX - b.minX) * (b.maxY - b.minY))
  const avgR = (rMin + rMax) / 2
  const target = Math.max(
    4,
    Math.floor(area / (Math.PI * avgR * avgR) * 0.6),
  )

  const circles: Circle[] = []
  for (let i = 0; i < target; i++) {
    const p = vecInBounds(b, rng)
    circles.push(circle(p.x, p.y, rMin + rng() * (rMax - rMin)))
  }

  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < circles.length; i++) {
      for (let j = i + 1; j < circles.length; j++) {
        const a = circles[i]!
        const bC = circles[j]!
        const dx = bC.x - a.x
        const dy = bC.y - a.y
        const dist = Math.hypot(dx, dy) || 1e-9
        const minDist = a.r + bC.r
        if (dist >= minDist) continue
        const push = ((minDist - dist) / 2) * 0.5
        const ux = dx / dist
        const uy = dy / dist
        a.x -= ux * push
        a.y -= uy * push
        bC.x += ux * push
        bC.y += uy * push
      }
    }
    // Soft clamp to inflated envelope
    for (const c of circles) {
      c.x = Math.min(b.maxX + c.r, Math.max(b.minX - c.r, c.x))
      c.y = Math.min(b.maxY + c.r, Math.max(b.minY - c.r, c.y))
    }
  }

  return circles.filter((c) => circleOverlapsPath(c, path))
}

/** True if disk overlaps the filled path (including partial exterior overlap). */
export function circleOverlapsPath(c: Circle, path: Path): boolean {
  const center = { x: c.x, y: c.y }
  const dist = distanceToPolygon(center, path)
  return dist <= c.r * 0.95
}

/** True if the disk lies fully inside the path. */
export function circleContainedInPath(c: Circle, path: Path): boolean {
  const center = { x: c.x, y: c.y }
  if (!containsPoint(path, center)) return false
  return distanceToBoundary(center, path) + 1e-9 >= c.r
}

/** Distance from point to polygon: 0 if inside, else distance to boundary. */
export function distanceToPolygon(p: Vec2, path: Path): number {
  if (containsPoint(path, p)) return 0
  return distanceToBoundary(p, path)
}

function findLargestEmptyCircle(
  path: Path,
  obstacles: Circle[],
  tolerance: number,
): Circle | null {
  const b = bounds(path)
  const diag = Math.hypot(b.maxX - b.minX, b.maxY - b.minY) || 1
  // denser grid for smaller tolerance
  const step = Math.max(diag * 0.02 * Math.sqrt(tolerance), diag * 0.01)
  let best: Circle | null = null

  for (let x = b.minX; x <= b.maxX; x += step) {
    for (let y = b.minY; y <= b.maxY; y += step) {
      const p = { x, y }
      if (!containsPoint(path, p)) continue
      const r = clearanceRadius(p, path, obstacles)
      if (!best || r > best.r) best = circle(p.x, p.y, r)
    }
  }

  if (!best) return null

  // Local refine around best
  let cur = best
  let span = step
  for (let iter = 0; iter < 8; iter++) {
    let improved = cur
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue
        const p = { x: cur.x + dx * span, y: cur.y + dy * span }
        if (!containsPoint(path, p)) continue
        const r = clearanceRadius(p, path, obstacles)
        if (r > improved.r) improved = circle(p.x, p.y, r)
      }
    }
    cur = improved
    span *= 0.5
  }
  return cur
}

function clearanceRadius(
  p: Vec2,
  path: Path,
  obstacles: Circle[],
): number {
  let r = distanceToBoundary(p, path)
  for (const c of obstacles) {
    r = Math.min(r, Math.hypot(p.x - c.x, p.y - c.y) - c.r)
  }
  return Math.max(0, r)
}

function overlapsAny(c: Circle, packing: Circle[]): boolean {
  for (const o of packing) {
    if (Math.hypot(c.x - o.x, c.y - o.y) < c.r + o.r - 1e-9) return true
  }
  return false
}

function distanceToBoundary(p: Vec2, path: Path): number {
  let min = Infinity
  for (const ring of path.rings) {
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i]!
      const b = ring[(i + 1) % ring.length]!
      min = Math.min(min, pointSegmentDistance(p, a, b))
    }
  }
  return min
}

function pointSegmentDistance(p: Vec2, a: Vec2, b: Vec2): number {
  const abx = b.x - a.x
  const aby = b.y - a.y
  const len2 = abx * abx + aby * aby
  if (len2 < 1e-18) return Math.hypot(p.x - a.x, p.y - a.y)
  let t = ((p.x - a.x) * abx + (p.y - a.y) * aby) / len2
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(p.x - (a.x + t * abx), p.y - (a.y + t * aby))
}

function vecInBounds(
  b: { minX: number; minY: number; maxX: number; maxY: number },
  rng: () => number,
): Vec2 {
  return {
    x: b.minX + rng() * (b.maxX - b.minX),
    y: b.minY + rng() * (b.maxY - b.minY),
  }
}

function mulberry32(a: number): () => number {
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const circlePacking = {
  squareLatticePack,
  hexLatticePack,
  stochasticPack,
  maximumInscribedPack,
  maximumInscribedPackUntil,
  obstaclePack,
  frontChainPack,
  repulsionPack,
  circleOverlapsPath,
  circleContainedInPath,
}
