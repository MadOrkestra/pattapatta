import type { Vec2 } from '../types/index.js'

/** Seeded uniform random points in an axis-aligned box. */
export function random(
  count: number,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
  seed = 1,
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

/** Square lattice points covering [minX,maxX] × [minY,maxY]. */
export function squareGrid(
  spacing: number,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
): Vec2[] {
  const s = Math.max(spacing, 1e-9)
  const out: Vec2[] = []
  for (let x = minX; x <= maxX + 1e-12; x += s) {
    for (let y = minY; y <= maxY + 1e-12; y += s) {
      out.push({ x, y })
    }
  }
  return out
}

/** Hexagonal lattice points covering the box. */
export function hexGrid(
  spacing: number,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
): Vec2[] {
  const s = Math.max(spacing, 1e-9)
  const dx = s
  const dy = s * Math.sqrt(3) * 0.5
  const out: Vec2[] = []
  let row = 0
  for (let y = minY; y <= maxY + 1e-12; y += dy, row++) {
    const x0 = minX + (row % 2 === 0 ? 0 : s * 0.5)
    for (let x = x0; x <= maxX + 1e-12; x += dx) {
      out.push({ x, y })
    }
  }
  return out
}

/** Ring of `count` points around `center` with `radius`. */
export function ring(
  count: number,
  center: Vec2,
  radius: number,
): Vec2[] {
  const out: Vec2[] = []
  for (let i = 0; i < count; i++) {
    const t = (i / count) * Math.PI * 2
    out.push({
      x: center.x + Math.cos(t) * radius,
      y: center.y + Math.sin(t) * radius,
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

/** Bridson-ish Poisson disk sample in a box (seeded). */
export function poisson(
  minDistance: number,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
  seed = 1,
  maxAttempts = 30,
): Vec2[] {
  const rng = mulberry32(seed >>> 0)
  const r = Math.max(minDistance, 1e-9)
  const cell = r / Math.SQRT2
  const w = maxX - minX
  const h = maxY - minY
  const gw = Math.max(1, Math.ceil(w / cell))
  const gh = Math.max(1, Math.ceil(h / cell))
  const grid: (number | null)[] = Array(gw * gh).fill(null)
  const points: Vec2[] = []
  const active: number[] = []

  const gx = (p: Vec2) => Math.min(gw - 1, Math.floor((p.x - minX) / cell))
  const gy = (p: Vec2) => Math.min(gh - 1, Math.floor((p.y - minY) / cell))

  const emit = (p: Vec2) => {
    const i = points.length
    points.push(p)
    active.push(i)
    grid[gy(p) * gw + gx(p)] = i
  }

  emit({
    x: minX + rng() * w,
    y: minY + rng() * h,
  })

  while (active.length > 0) {
    const ai = Math.floor(rng() * active.length)
    const i = active[ai]!
    const src = points[i]!
    let found = false
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const ang = rng() * Math.PI * 2
      const rad = r * (1 + rng())
      const cand = {
        x: src.x + Math.cos(ang) * rad,
        y: src.y + Math.sin(ang) * rad,
      }
      if (
        cand.x < minX ||
        cand.x > maxX ||
        cand.y < minY ||
        cand.y > maxY
      ) {
        continue
      }
      const cx = gx(cand)
      const cy = gy(cand)
      let ok = true
      for (let yy = Math.max(0, cy - 2); yy <= Math.min(gh - 1, cy + 2) && ok; yy++) {
        for (let xx = Math.max(0, cx - 2); xx <= Math.min(gw - 1, cx + 2); xx++) {
          const j = grid[yy * gw + xx]
          if (j == null) continue
          const q = points[j]!
          if (Math.hypot(cand.x - q.x, cand.y - q.y) < r) {
            ok = false
            break
          }
        }
      }
      if (ok) {
        emit(cand)
        found = true
        break
      }
    }
    if (!found) active.splice(ai, 1)
  }
  return points
}

/** Drop points closer than `minDistance` (greedy keep-first). */
export function prunePointsWithinDistance(
  points: Vec2[],
  minDistance: number,
): Vec2[] {
  const r = Math.max(minDistance, 0)
  const out: Vec2[] = []
  for (const p of points) {
    if (out.every((q) => Math.hypot(p.x - q.x, p.y - q.y) >= r)) {
      out.push(p)
    }
  }
  return out
}

export const pointSet = {
  random,
  squareGrid,
  hexGrid,
  ring,
  poisson,
  prunePointsWithinDistance,
}
