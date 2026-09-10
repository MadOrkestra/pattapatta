import { describe, expect, it } from 'vitest'
import {
  area,
  areaGroup,
  boundingBox,
  centroidSplit,
  chaikinCut,
  convexHull,
  earCutTriangulation,
  hexGrid,
  pointsOnExterior,
  polygon,
  radialWarp,
  slice,
  squareGrid,
  vec2,
} from '../src/index.js'

function unitSquare() {
  return polygon([vec2(0, 0), vec2(1, 0), vec2(1, 1), vec2(0, 1)])
}

describe('morphology smooth/warp', () => {
  it('chaikinCut increases vertex count', () => {
    const s = chaikinCut(unitSquare(), 1)
    expect(s.rings[0]!.length).toBeGreaterThan(4)
  })

  it('radialWarp preserves vertex count', () => {
    const w = radialWarp(unitSquare(), 0.1, 4)
    expect(w.rings[0]!.length).toBe(4)
  })
})

describe('processing slice / perimeter', () => {
  it('centroidSplit yields two pieces whose areas sum ~1', () => {
    const g = centroidSplit(unitSquare())
    expect(g.paths.length).toBe(2)
    expect(areaGroup(g)).toBeCloseTo(1, 2)
  })

  it('slice with diagonal returns pieces', () => {
    const g = slice(unitSquare(), vec2(0, 0), vec2(1, 1))
    expect(g.paths.length).toBeGreaterThanOrEqual(1)
    expect(areaGroup(g)).toBeCloseTo(1, 1)
  })

  it('pointsOnExterior returns requested count', () => {
    expect(pointsOnExterior(unitSquare(), 8).length).toBe(8)
  })
})

describe('hull / triangulation / pointSet', () => {
  it('convexHull of diamond points is a quadrilateral', () => {
    const h = convexHull([
      vec2(0, 1),
      vec2(1, 0),
      vec2(0, -1),
      vec2(-1, 0),
      vec2(0, 0),
    ])
    expect(h.rings[0]!.length).toBe(4)
    expect(area(h)).toBeCloseTo(2, 6)
  })

  it('boundingBox matches square', () => {
    const b = boundingBox(unitSquare())
    expect(area(b)).toBeCloseTo(1, 6)
  })

  it('earCutTriangulation covers unit square area', () => {
    const tris = earCutTriangulation(unitSquare())
    expect(tris.length).toBeGreaterThanOrEqual(2)
    const sum = tris.reduce((s, t) => s + area(t), 0)
    expect(sum).toBeCloseTo(1, 2)
  })

  it('squareGrid and hexGrid produce points', () => {
    expect(squareGrid(0.5, 0, 0, 1, 1).length).toBeGreaterThan(4)
    expect(hexGrid(0.5, 0, 0, 1, 1).length).toBeGreaterThan(4)
  })
})
