import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  hatch,
  parallelSegments,
  polygon,
  segmentLength,
  vec2,
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
