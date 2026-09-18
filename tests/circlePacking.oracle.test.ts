import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  hexLatticePack,
  obstaclePack,
  polygon,
  squareLatticePack,
  stochasticPack,
  vec2,
  type Circle,
  type OracleCase,
} from '../src/index.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function loadOracle(suite: string, caseId: string): OracleCase {
  return JSON.parse(
    readFileSync(join(root, 'tests/oracle', suite, `${caseId}.json`), 'utf8'),
  ) as OracleCase
}

function unitSquare() {
  return polygon([vec2(0, 0), vec2(1, 0), vec2(1, 1), vec2(0, 1)])
}

function sortCircles(cs: Circle[]) {
  return [...cs].sort((a, b) => a.x - b.x || a.y - b.y || a.r - b.r)
}

describe('circlePacking lattices vs oracle', () => {
  it('squareLatticePack matches oracle', () => {
    const got = squareLatticePack(unitSquare(), 0.25)
    const oracle = loadOracle('packing', 'square-lattice-unit-square')
    const expected: Circle[] = oracle.outputs.circles
    expect(got.length).toBe(expected.length)
    const g = sortCircles(got)
    const e = sortCircles(expected)
    for (let i = 0; i < e.length; i++) {
      expect(g[i]!.x).toBeCloseTo(e[i]!.x, 4)
      expect(g[i]!.y).toBeCloseTo(e[i]!.y, 4)
      expect(g[i]!.r).toBeCloseTo(e[i]!.r, 4)
    }
  })

  it('hexLatticePack is centered with equal edge cutoffs', () => {
    const got = hexLatticePack(unitSquare(), 0.25)
    expect(got.length).toBeGreaterThan(0)
    const xs = [...new Set(got.map((c) => +c.x.toFixed(8)))].sort(
      (a, b) => a - b,
    )
    const ys = [...new Set(got.map((c) => +c.y.toFixed(8)))].sort(
      (a, b) => a - b,
    )
    expect(xs[0]! - 0).toBeCloseTo(1 - xs.at(-1)!, 5)
    expect(ys[0]! - 0).toBeCloseTo(1 - ys.at(-1)!, 5)
  })
})

describe('contained lattice + obstaclePack', () => {
  it('contained square lattice keeps disks inside the square', () => {
    const got = squareLatticePack(unitSquare(), 0.25, 'contained')
    expect(got.length).toBeGreaterThan(0)
    expect(got.length).toBeLessThan(
      squareLatticePack(unitSquare(), 0.25, 'overlap').length,
    )
    for (const c of got) {
      expect(c.x - c.r).toBeGreaterThanOrEqual(-1e-6)
      expect(c.y - c.r).toBeGreaterThanOrEqual(-1e-6)
      expect(c.x + c.r).toBeLessThanOrEqual(1 + 1e-6)
      expect(c.y + c.r).toBeLessThanOrEqual(1 + 1e-6)
    }
  })

  it('contained square lattice centers leftover margins', () => {
    // width 80, d 14 → inner 66, 5 centers, 5px margin each side
    const rect = polygon([
      vec2(10, 10),
      vec2(90, 10),
      vec2(90, 90),
      vec2(10, 90),
    ])
    const got = squareLatticePack(rect, 14, 'contained')
    expect(got.length).toBe(25)
    const xs = [...new Set(got.map((c) => c.x))].sort((a, b) => a - b)
    const ys = [...new Set(got.map((c) => c.y))].sort((a, b) => a - b)
    const r = 7
    expect(xs[0]! - r - 10).toBeCloseTo(90 - (xs.at(-1)! + r), 6)
    expect(ys[0]! - r - 10).toBeCloseTo(90 - (ys.at(-1)! + r), 6)
  })

  it('overlap square lattice centers opposite-edge cutoffs', () => {
    const rect = polygon([
      vec2(10, 10),
      vec2(90, 10),
      vec2(90, 90),
      vec2(10, 90),
    ])
    const got = squareLatticePack(rect, 14, 'overlap')
    const xs = [...new Set(got.map((c) => c.x))].sort((a, b) => a - b)
    const ys = [...new Set(got.map((c) => c.y))].sort((a, b) => a - b)
    expect(xs[0]! - 10).toBeCloseTo(90 - xs.at(-1)!, 6)
    expect(ys[0]! - 10).toBeCloseTo(90 - ys.at(-1)!, 6)
  })

  it('obstaclePack avoids seed obstacles', () => {
    const seed = [{ x: 0.5, y: 0.5, r: 0.2 }]
    const got = obstaclePack(unitSquare(), seed, 3, 0.5)
    expect(got.length).toBeGreaterThan(0)
    for (const c of got) {
      const d = Math.hypot(c.x - 0.5, c.y - 0.5)
      expect(d + 1e-4).toBeGreaterThanOrEqual(c.r + 0.2)
    }
  })
})
