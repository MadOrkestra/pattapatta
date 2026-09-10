import { describe, expect, it } from 'vitest'
import {
  angular,
  area,
  areaGroup,
  delaunayTriangulationPoints,
  extractInnerEdges,
  findContainingFace,
  gabrielFaces,
  hexTiling,
  hilbertPolygonise,
  maxArea,
  onionLayers,
  rectSubdivision,
  squareTiling,
  triangleSubdivision,
  vec2,
} from '../src/index.js'
import { polygon } from '../src/index.js'

describe('tiling', () => {
  it('squareTiling covers the box with cells', () => {
    const g = squareTiling(0.5, 0, 0, 1, 1)
    expect(g.paths.length).toBe(4)
    expect(areaGroup(g)).toBeCloseTo(1, 6)
  })

  it('hexTiling returns hexagons', () => {
    const g = hexTiling(0.4, 0, 0, 1, 1)
    expect(g.paths.length).toBeGreaterThan(1)
    expect(g.paths[0]!.rings[0]!.length).toBe(6)
  })

  it('rectSubdivision splits unit square into 4', () => {
    const sq = polygon([vec2(0, 0), vec2(1, 0), vec2(1, 1), vec2(0, 1)])
    const g = rectSubdivision(sq, 2, 2)
    expect(g.paths.length).toBe(4)
    expect(areaGroup(g)).toBeCloseTo(1, 2)
  })

  it('triangleSubdivision multiplies faces by 4', () => {
    const tri = polygon([vec2(0, 0), vec2(1, 0), vec2(0.5, 1)])
    const g = triangleSubdivision([tri], 1)
    expect(g.paths.length).toBe(4)
  })
})

describe('polygonisation', () => {
  const pts = [
    vec2(0, 0),
    vec2(1, 0),
    vec2(1, 1),
    vec2(0, 1),
    vec2(0.5, 0.5),
  ]

  it('maxArea is the convex hull', () => {
    expect(maxArea(pts).rings[0]!.length).toBe(4)
    expect(area(maxArea(pts))).toBeCloseTo(1, 6)
  })

  it('angular / hilbert return closed polygons', () => {
    expect(angular(pts).rings[0]!.length).toBe(pts.length)
    expect(hilbertPolygonise(pts).rings[0]!.length).toBe(pts.length)
  })

  it('onionLayers peels the hull', () => {
    const layers = onionLayers(pts)
    expect(layers.length).toBeGreaterThanOrEqual(1)
    expect(layers[0]!.rings[0]!.length).toBe(4)
  })
})

describe('meshing', () => {
  it('extractInnerEdges from triangulation', () => {
    const tris = delaunayTriangulationPoints([
      vec2(0, 0),
      vec2(1, 0),
      vec2(0.5, 1),
      vec2(0.5, 0.3),
    ])
    const edges = extractInnerEdges(tris)
    expect(edges.length).toBeGreaterThanOrEqual(3)
  })

  it('findContainingFace hits a triangle', () => {
    const tris = delaunayTriangulationPoints([
      vec2(0, 0),
      vec2(1, 0),
      vec2(0, 1),
    ])
    const hit = findContainingFace(tris, vec2(0.1, 0.1))
    expect(hit).not.toBeNull()
  })

  it('gabrielFaces returns a subset of delaunay', () => {
    const pts = [
      vec2(0, 0),
      vec2(1, 0),
      vec2(0.5, 0.8),
      vec2(0.5, 0.2),
    ]
    const g = gabrielFaces(pts)
    expect(g.paths.length).toBeGreaterThanOrEqual(0)
    expect(g.paths.length).toBeLessThanOrEqual(
      delaunayTriangulationPoints(pts).length,
    )
  })
})
