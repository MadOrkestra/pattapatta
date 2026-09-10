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

export const pointSet = {
  random,
  squareGrid,
  hexGrid,
  ring,
}
