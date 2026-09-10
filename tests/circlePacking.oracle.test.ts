import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  hexLatticePack,
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

  it('hexLatticePack matches oracle', () => {
    const got = hexLatticePack(unitSquare(), 0.25)
    const oracle = loadOracle('packing', 'hex-lattice-unit-square')
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
})

describe('stochasticPack', () => {
  it('is deterministic for a seed and stays inside the path', () => {
    const a = stochasticPack(unitSquare(), 80, 0.05, 42)
    const b = stochasticPack(unitSquare(), 80, 0.05, 42)
    expect(a.length).toBe(b.length)
    expect(a.length).toBeGreaterThan(0)
    for (let i = 0; i < a.length; i++) {
      expect(a[i]!.x).toBeCloseTo(b[i]!.x, 10)
      expect(a[i]!.r).toBeGreaterThanOrEqual(0.05)
    }
  })
})
