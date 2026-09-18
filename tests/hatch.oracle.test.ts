import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  hatch,
  parallelSegments,
  polygon,
  segmentLength,
  stochasticSegments,
  vec2,
  weaveSegments,
  perpendicularPathSegments,
  type OracleCase,
  type Segment,
} from '../src/index.js'
import { clipSegmentsToPath } from '../src/segmentSet/clip.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function loadOracle(suite: string, caseId: string): OracleCase {
  return JSON.parse(
    readFileSync(join(root, 'tests/oracle', suite, `${caseId}.json`), 'utf8'),
  ) as OracleCase
}

function normalizeSeg(s: Segment): [number, number, number, number] {
  const a = [s.a.x, s.a.y] as const
  const b = [s.b.x, s.b.y] as const
  // order endpoints canonically
  if (a[0] < b[0] - 1e-9 || (Math.abs(a[0] - b[0]) <= 1e-9 && a[1] <= b[1])) {
    return [a[0], a[1], b[0], b[1]]
  }
  return [b[0], b[1], a[0], a[1]]
}

function sortSegs(segs: Segment[]) {
  return segs.map(normalizeSeg).sort((u, v) => {
    for (let i = 0; i < 4; i++) {
      const d = u[i]! - v[i]!
      if (Math.abs(d) > 1e-6) return d
    }
    return 0
  })
}

describe('segmentSet.parallelSegments', () => {
  it('emits n segments for even n', () => {
    const segs = parallelSegments(0.5, 0.5, 2, 0.15, Math.PI / 4, 30)
    expect(segs).toHaveLength(30)
    expect(segmentLength(segs[0]!)).toBeGreaterThan(1)
  })
})

describe('segmentSet.weaveSegments', () => {
  it('plain weave 1-1-1 emits H and V runs', () => {
    const segs = weaveSegments(10, 10, 2, 1, 1, 1)
    expect(segs.length).toBeGreaterThan(0)
    const horiz = segs.filter((s) => Math.abs(s.a.y - s.b.y) < 1e-9)
    const vert = segs.filter((s) => Math.abs(s.a.x - s.b.x) < 1e-9)
    expect(horiz.length).toBeGreaterThan(0)
    expect(vert.length).toBeGreaterThan(0)
  })

  it('rejects non-positive cellSize', () => {
    expect(() => weaveSegments(10, 10, 0, 1, 1, 1)).toThrow(/cellSize/)
  })
})

describe('segmentSet.stochasticSegments', () => {
  it('is deterministic for a fixed seed', () => {
    const a = stochasticSegments(20, 20, 12, 2, 2, 42)
    const b = stochasticSegments(20, 20, 12, 2, 2, 42)
    expect(a).toHaveLength(12)
    expect(sortSegs(a)).toEqual(sortSegs(b))
  })

  it('segments do not intersect', () => {
    const segs = stochasticSegments(30, 30, 20, 3, 3, 7)
    for (let i = 0; i < segs.length; i++) {
      for (let j = i + 1; j < segs.length; j++) {
        const u = segs[i]!
        const v = segs[j]!
        const hits =
          ccw(u.a, v.a, v.b) !== ccw(u.b, v.a, v.b) &&
          ccw(u.a, u.b, v.a) !== ccw(u.a, u.b, v.b)
        expect(hits).toBe(false)
      }
    }
  })
})

describe('segmentSet.perpendicularPathSegments', () => {
  it('places ticks along a unit square perimeter', () => {
    const cell = polygon([
      vec2(0, 0),
      vec2(1, 0),
      vec2(1, 1),
      vec2(0, 1),
    ])
    const ticks = perpendicularPathSegments(cell, 0.25, 0.2, 0)
    // Perimeter length 4 → round(4/0.25)=16
    expect(ticks).toHaveLength(16)
    for (const t of ticks) {
      expect(segmentLength(t)).toBeCloseTo(0.2, 5)
    }
  })
})

describe('hatch vs oracle', () => {
  it('parallel-45-unit-square matches oracle lines', () => {
    const cell = polygon([
      vec2(0, 0),
      vec2(1, 0),
      vec2(1, 1),
      vec2(0, 1),
    ])
    const raw = parallelSegments(0.5, 0.5, 2.0, 0.15, Math.PI / 4, 30)
    const got = clipSegmentsToPath(raw, cell)
    const viaHatch = hatch.parallel(cell, {
      angle: Math.PI / 4,
      spacing: 0.15,
      length: 2.0,
      count: 30,
      center: { x: 0.5, y: 0.5 },
    })

    const oracle = loadOracle('hatch', 'parallel-45-unit-square')
    const expected: Segment[] = oracle.outputs.lines.map((line) => ({
      a: vec2(line[0]![0]!, line[0]![1]!),
      b: vec2(line[1]![0]!, line[1]![1]!),
    }))

    expect(got.length).toBe(expected.length)
    expect(viaHatch.length).toBe(expected.length)

    const g = sortSegs(got)
    const e = sortSegs(expected)
    for (let i = 0; i < e.length; i++) {
      for (let j = 0; j < 4; j++) {
        expect(g[i]![j]).toBeCloseTo(e[i]![j]!, 3)
      }
    }
  })

  it('auto count covers the AABB at tight spacing', () => {
    const cell = polygon([
      vec2(15, 15),
      vec2(85, 15),
      vec2(85, 85),
      vec2(15, 85),
    ])
    const capped = hatch.parallel(cell, {
      spacing: 2,
      angle: Math.PI / 4,
      count: 40,
    })
    const filled = hatch.parallel(cell, {
      spacing: 2,
      angle: Math.PI / 4,
    })
    expect(filled.length).toBeGreaterThan(capped.length)

    // Extreme corners should be reached by some clipped hatch endpoint.
    const near = (x: number, y: number) =>
      filled.some(
        (s) =>
          Math.hypot(s.a.x - x, s.a.y - y) < 3 ||
          Math.hypot(s.b.x - x, s.b.y - y) < 3,
      )
    expect(near(15, 15)).toBe(true)
    expect(near(85, 85)).toBe(true)
    expect(near(15, 85)).toBe(true)
    expect(near(85, 15)).toBe(true)
  })
})

describe('hatch.weave / stochastic / perpendicular / concentric', () => {
  const cell = polygon([
    vec2(10, 10),
    vec2(90, 10),
    vec2(90, 90),
    vec2(10, 90),
  ])

  it('weave clips fabric segments to the path', () => {
    const segs = hatch.weave(cell, { cellSize: 10, A: 1, B: 1, C: 1 })
    expect(segs.length).toBeGreaterThan(0)
    for (const s of segs) {
      expect(s.a.x).toBeGreaterThanOrEqual(10 - 1e-6)
      expect(s.a.x).toBeLessThanOrEqual(90 + 1e-6)
      expect(s.a.y).toBeGreaterThanOrEqual(10 - 1e-6)
      expect(s.a.y).toBeLessThanOrEqual(90 + 1e-6)
    }
  })

  it('stochastic is seeded and clipped', () => {
    const a = hatch.stochastic(cell, { count: 25, length: 12, seed: 9 })
    const b = hatch.stochastic(cell, { count: 25, length: 12, seed: 9 })
    expect(a.length).toBeGreaterThan(0)
    expect(sortSegs(a)).toEqual(sortSegs(b))
  })

  it('perpendicular ticks along the boundary', () => {
    const ticks = hatch.perpendicular(cell, { spacing: 20, length: 8 })
    expect(ticks.length).toBeGreaterThan(0)
    expect(segmentLength(ticks[0]!)).toBeCloseTo(8, 5)
  })

  it('concentric returns nested closed shells', () => {
    const shells = hatch.concentric(cell, { spacing: 8, count: 4 })
    expect(shells.length).toBeGreaterThan(0)
    expect(shells.length).toBeLessThanOrEqual(4)
    for (const p of shells) {
      expect(p.closed).toBe(true)
      expect(p.rings[0]!.length).toBeGreaterThanOrEqual(3)
    }
  })
})

function ccw(
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number },
): boolean {
  return (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x)
}
