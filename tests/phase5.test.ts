import { describe, expect, it } from 'vitest'
import {
  area,
  densify,
  extractHoles,
  extractPerimeter,
  fromArray,
  generateRandomPoints,
  offsetCurvesInward,
  offsetCurvesOutward,
  path,
  polygon,
  rotateAroundCenter,
  scale,
  simplify,
  toArray,
  translate,
  vec2,
} from '../src/index.js'

function unitSquare() {
  return polygon([vec2(0, 0), vec2(1, 0), vec2(1, 1), vec2(0, 1)])
}

describe('transformation', () => {
  it('translate shifts centroid', () => {
    const g = translate(unitSquare(), 2, 3)
    expect(g.rings[0]![0]).toEqual({ x: 2, y: 3 })
  })

  it('scale from origin doubles size', () => {
    const g = scale(unitSquare(), 2)
    expect(area(g)).toBeCloseTo(4, 6)
  })

  it('rotateAroundCenter 90° preserves area', () => {
    const g = rotateAroundCenter(unitSquare(), Math.PI / 2)
    expect(area(g)).toBeCloseTo(1, 6)
  })
})

describe('processing', () => {
  it('densify adds midpoints on long edges', () => {
    const g = densify(unitSquare(), 0.5)
    expect(g.rings[0]!.length).toBeGreaterThan(4)
  })

  it('extractPerimeter drops holes', () => {
    const withHole = path(
      [
        [vec2(0, 0), vec2(2, 0), vec2(2, 2), vec2(0, 2)],
        [vec2(0.5, 0.5), vec2(1.5, 0.5), vec2(1.5, 1.5), vec2(0.5, 1.5)],
      ],
      true,
    )
    expect(extractPerimeter(withHole).rings.length).toBe(1)
    expect(extractHoles(withHole).length).toBe(1)
  })

  it('generateRandomPoints is seeded', () => {
    const a = generateRandomPoints(unitSquare(), 8, 42)
    const b = generateRandomPoints(unitSquare(), 8, 42)
    expect(a).toEqual(b)
    expect(a.length).toBe(8)
  })
})

describe('conversion + morphology.simplify + contour', () => {
  it('toArray/fromArray round-trip exterior', () => {
    const arr = toArray(unitSquare())
    const back = fromArray(arr)
    expect(area(back)).toBeCloseTo(1, 6)
  })

  it('simplify reduces dense ring vertex count', () => {
    const dense = densify(unitSquare(), 0.05)
    const simple = simplify(dense, 0.02)
    expect(simple.rings[0]!.length).toBeLessThan(dense.rings[0]!.length)
    expect(area(simple)).toBeCloseTo(1, 1)
  })

  it('offsetCurves expand and shrink area', () => {
    const out = offsetCurvesOutward(unitSquare(), 0.1)
    const inn = offsetCurvesInward(unitSquare(), 0.1)
    expect(area(out.paths[0]!)).toBeGreaterThan(1)
    expect(area(inn.paths[0]!)).toBeLessThan(1)
  })
})
