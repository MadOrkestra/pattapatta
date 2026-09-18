import { describe, expect, it } from 'vitest'
import {
  area,
  buffer,
  frontChainPack,
  maximumInscribedPack,
  polygon,
  repulsionPack,
  vec2,
} from '../src/index.js'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { OracleCase } from '../src/index.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function unitSquare() {
  return polygon([vec2(0, 0), vec2(1, 0), vec2(1, 1), vec2(0, 1)])
}

function loadOracle(caseId: string): OracleCase {
  return JSON.parse(
    readFileSync(
      join(root, 'tests/oracle/packing', `${caseId}.json`),
      'utf8',
    ),
  ) as OracleCase
}

describe('maximumInscribedPack', () => {
  it('packs n contained non-overlapping circles', () => {
    const got = maximumInscribedPack(unitSquare(), 5, 1)
    expect(got.length).toBe(5)
    // largest should be near inradius 0.5 of unit square
    expect(got[0]!.r).toBeGreaterThan(0.35)
    for (const c of got) {
      expect(c.x - c.r).toBeGreaterThanOrEqual(-1e-6)
      expect(c.y - c.r).toBeGreaterThanOrEqual(-1e-6)
      expect(c.x + c.r).toBeLessThanOrEqual(1 + 1e-6)
      expect(c.y + c.r).toBeLessThanOrEqual(1 + 1e-6)
    }
    for (let i = 0; i < got.length; i++) {
      for (let j = i + 1; j < got.length; j++) {
        const d = Math.hypot(got[i]!.x - got[j]!.x, got[i]!.y - got[j]!.y)
        expect(d + 1e-4).toBeGreaterThanOrEqual(got[i]!.r + got[j]!.r)
      }
    }
  })

  it('largest radius is close to PGS oracle', () => {
    const got = maximumInscribedPack(unitSquare(), 5, 1)
    const oracle = loadOracle('max-inscribed-5-unit-square')
    const oMax = Math.max(...oracle.outputs.circles.map((c) => c.r))
    const gMax = Math.max(...got.map((c) => c.r))
    expect(Math.abs(gMax - oMax)).toBeLessThan(0.08)
    expect(got.length).toBe(oracle.outputs.circles.length)
  })
})

describe('frontChainPack / repulsionPack', () => {
  it('frontChainPack is seeded and returns overlaps', () => {
    const a = frontChainPack(unitSquare(), 0.08, 0.12, 7)
    const b = frontChainPack(unitSquare(), 0.08, 0.12, 7)
    expect(a.length).toBe(b.length)
    expect(a.length).toBeGreaterThan(3)
  })

  it('frontChainPack fills past a fixed circle cap until stall', () => {
    const big = polygon([
      vec2(0, 0),
      vec2(10, 0),
      vec2(10, 10),
      vec2(0, 10),
    ])
    const got = frontChainPack(big, 0.15, 0.2, 1)
    expect(got.length).toBeGreaterThan(400)
  })

  it('repulsionPack returns some overlapping circles', () => {
    const got = repulsionPack(unitSquare(), 0.08, 0.08, 3, 40)
    expect(got.length).toBeGreaterThan(3)
  })
})

describe('morphology.buffer', () => {
  it('positive buffer increases area', () => {
    const p = unitSquare()
    const g = buffer(p, 0.1)
    expect(g.paths.length).toBeGreaterThan(0)
    expect(area(g.paths[0]!)).toBeGreaterThan(area(p))
  })

  it('negative buffer decreases area', () => {
    const p = unitSquare()
    const g = buffer(p, -0.1)
    expect(g.paths.length).toBe(1)
    expect(area(g.paths[0]!)).toBeLessThan(area(p))
    expect(area(g.paths[0]!)).toBeCloseTo(0.8 * 0.8, 2)
  })
})
