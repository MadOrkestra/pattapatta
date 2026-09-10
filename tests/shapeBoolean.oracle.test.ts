import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  area,
  areaGroup,
  centroid,
  containmentAgreement,
  containsPoint,
  intersect,
  occlusionSubtract,
  oraclePathsToGroup,
  polygon,
  relativeAreaError,
  subtract,
  union,
  vec2,
  type OracleCase,
} from '../src/index.js'
import { groupFromPaths } from '../src/types/index.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function loadOracle(suite: string, caseId: string): OracleCase {
  const raw = readFileSync(
    join(root, 'tests/oracle', suite, `${caseId}.json`),
    'utf8',
  )
  return JSON.parse(raw) as OracleCase
}

function twoRects() {
  const a = polygon([
    vec2(0, 0),
    vec2(2, 0),
    vec2(2, 1),
    vec2(0, 1),
  ])
  const b = polygon([
    vec2(1, 0),
    vec2(3, 0),
    vec2(3, 1),
    vec2(1, 1),
  ])
  return { a, b }
}

describe('predicates', () => {
  it('computes rectangle area and centroid', () => {
    const p = polygon([
      vec2(0, 0),
      vec2(2, 0),
      vec2(2, 1),
      vec2(0, 1),
    ])
    expect(area(p)).toBeCloseTo(2, 6)
    const c = centroid(p)
    expect(c.x).toBeCloseTo(1, 6)
    expect(c.y).toBeCloseTo(0.5, 6)
    expect(containsPoint(p, vec2(1, 0.5))).toBe(true)
    expect(containsPoint(p, vec2(3, 0.5))).toBe(false)
  })
})

describe('shapeBoolean vs oracle', () => {
  it('union-two-rects matches oracle area and coverage', () => {
    const { a, b } = twoRects()
    const got = union(a, b)
    const oracle = loadOracle('boolean', 'union-two-rects')
    expect(areaGroup(got)).toBeCloseTo(oracle.outputs.scalars.area!, 3)
    const expected = oraclePathsToGroup(oracle.outputs.paths)
    expect(relativeAreaError(got, expected)).toBeLessThan(1e-3)
    expect(containmentAgreement(got, expected, 24)).toBeGreaterThan(0.98)
  })

  it('subtract-two-rects matches oracle', () => {
    const { a, b } = twoRects()
    const got = subtract(a, b)
    const oracle = loadOracle('boolean', 'subtract-two-rects')
    expect(areaGroup(got)).toBeCloseTo(oracle.outputs.scalars.area!, 3)
    const expected = oraclePathsToGroup(oracle.outputs.paths)
    expect(relativeAreaError(got, expected)).toBeLessThan(1e-3)
    expect(containmentAgreement(got, expected, 24)).toBeGreaterThan(0.98)
  })

  it('occlusion-two-rects matches oracle', () => {
    const { a, b } = twoRects()
    const got = occlusionSubtract(groupFromPaths(a, b))
    const oracle = loadOracle('boolean', 'occlusion-two-rects')
    expect(got.paths.length).toBe(2)
    expect(areaGroup(got)).toBeCloseTo(oracle.outputs.scalars.area!, 3)
    const expected = oraclePathsToGroup(oracle.outputs.paths)
    expect(relativeAreaError(got, expected)).toBeLessThan(1e-3)
    expect(containmentAgreement(got, expected, 24)).toBeGreaterThan(0.98)
  })

  it('intersect of overlapping rects has area 1', () => {
    const { a, b } = twoRects()
    const got = intersect(a, b)
    expect(areaGroup(got)).toBeCloseTo(1, 6)
  })
})
