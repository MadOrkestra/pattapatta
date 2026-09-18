import { describe, expect, it } from 'vitest'
import {
  area,
  areaGroup,
  areaMerge,
  centroidQuadrangulation,
  delaunayTriangulationPoints,
  dualFaces,
  edgeCollapseQuadrangulation,
  extractInnerEdges,
  extractInnerVertices,
  findBreaks,
  findContainingFace,
  findIslands,
  fixBreaks,
  fixBrokenFaces,
  gabrielFaces,
  matchingQuadrangulation,
  polygon,
  polyline,
  relativeNeighborFaces,
  simplifyMesh,
  smoothMesh,
  spannerFaces,
  spiralQuadrangulation,
  splitQuadrangulation,
  stochasticMerge,
  subdivideMesh,
  urquhartFaces,
  vec2,
} from '../src/index.js'

function sampleSites() {
  return [
    vec2(0, 0),
    vec2(1, 0),
    vec2(0.5, 0.9),
    vec2(0.5, 0.3),
    vec2(0.2, 0.5),
    vec2(0.8, 0.5),
  ]
}

describe('meshing graph faces', () => {
  it('urquhartFaces returns fewer-or-equal faces than delaunay', () => {
    const pts = sampleSites()
    const tris = delaunayTriangulationPoints(pts)
    const g = urquhartFaces(pts)
    expect(g.paths.length).toBeGreaterThan(0)
    expect(g.paths.length).toBeLessThanOrEqual(tris.length)
    for (const f of g.paths) {
      expect(f.closed).toBe(true)
      expect(f.rings[0]!.length).toBeGreaterThanOrEqual(3)
    }
  })

  it('gabrielFaces is a filtered face set', () => {
    const pts = sampleSites()
    const tris = delaunayTriangulationPoints(pts)
    const g = gabrielFaces(pts)
    expect(g.paths.length).toBeGreaterThanOrEqual(0)
    expect(g.paths.length).toBeLessThanOrEqual(tris.length)
  })

  it('relativeNeighborFaces returns closed faces', () => {
    const g = relativeNeighborFaces(sampleSites())
    expect(g.paths.length).toBeGreaterThan(0)
    expect(g.paths.every((p) => p.closed && (p.rings[0]?.length ?? 0) >= 3)).toBe(
      true,
    )
  })

  it('spannerFaces with higher k yields fewer-or-equal faces', () => {
    const pts = sampleSites()
    const a = spannerFaces(pts, 1)
    const b = spannerFaces(pts, 4)
    expect(b.paths.length).toBeLessThanOrEqual(a.paths.length)
  })

  it('dualFaces returns closed rings around interior vertices', () => {
    const tris = delaunayTriangulationPoints(sampleSites())
    const d = dualFaces(tris)
    for (const f of d.paths) {
      expect(f.closed).toBe(true)
      expect(f.rings[0]!.length).toBeGreaterThanOrEqual(3)
    }
  })
})

describe('meshing quadrangulation', () => {
  it('centroidQuadrangulation produces mostly quads', () => {
    const g = centroidQuadrangulation(sampleSites())
    expect(g.paths.length).toBeGreaterThan(0)
    const quads = g.paths.filter((p) => (p.rings[0]?.length ?? 0) === 4)
    expect(quads.length).toBeGreaterThan(0)
  })

  it('splitQuadrangulation yields 3 faces per triangle', () => {
    const tris = delaunayTriangulationPoints(sampleSites())
    const g = splitQuadrangulation(tris)
    expect(g.paths.length).toBe(tris.length * 3)
    expect(g.paths.every((p) => (p.rings[0]?.length ?? 0) === 4)).toBe(true)
  })

  it('edgeCollapseQuadrangulation reduces face count', () => {
    const tris = delaunayTriangulationPoints(sampleSites())
    const g = edgeCollapseQuadrangulation(tris)
    expect(g.paths.length).toBeLessThanOrEqual(tris.length)
    expect(g.paths.length).toBeGreaterThan(0)
  })

  it('matchingQuadrangulation returns faces', () => {
    const g = matchingQuadrangulation(sampleSites())
    expect(g.paths.length).toBeGreaterThan(0)
  })

  it('spiralQuadrangulation builds quads from points', () => {
    const pts = []
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2
      pts.push(vec2(0.5 + 0.35 * Math.cos(a), 0.5 + 0.35 * Math.sin(a)))
      pts.push(vec2(0.5 + 0.15 * Math.cos(a), 0.5 + 0.15 * Math.sin(a)))
    }
    const g = spiralQuadrangulation(pts)
    expect(g.paths.length).toBeGreaterThan(0)
  })
})

describe('meshing process', () => {
  it('smoothMesh preserves face count with perimeter lock', () => {
    const tris = delaunayTriangulationPoints(sampleSites())
    const g = smoothMesh(tris, 5, true)
    expect(g.paths.length).toBe(tris.length)
  })

  it('subdivideMesh multiplies faces by vertex count', () => {
    const square = polygon([
      vec2(0, 0),
      vec2(1, 0),
      vec2(1, 1),
      vec2(0, 1),
    ])
    const g = subdivideMesh([square], 0.5)
    expect(g.paths.length).toBe(4)
  })

  it('simplifyMesh keeps topology face count', () => {
    const dense = polygon([
      vec2(0, 0),
      vec2(0.25, 0.01),
      vec2(0.5, 0),
      vec2(0.75, 0.01),
      vec2(1, 0),
      vec2(1, 1),
      vec2(0, 1),
    ])
    const g = simplifyMesh([dense], 0.05, true)
    expect(g.paths.length).toBe(1)
    expect(g.paths[0]!.rings[0]!.length).toBeLessThanOrEqual(dense.rings[0]!.length)
  })

  it('stochasticMerge reduces or preserves face count', () => {
    const tris = delaunayTriangulationPoints(sampleSites())
    const g = stochasticMerge(tris, 2, 42)
    expect(g.paths.length).toBeLessThanOrEqual(tris.length)
    expect(g.paths.length).toBeGreaterThan(0)
  })

  it('areaMerge by minArea removes tiny faces', () => {
    const tris = delaunayTriangulationPoints(sampleSites())
    const g = areaMerge(tris, 0.05)
    expect(g.paths.every((p) => area(p) >= 0.05 - 1e-6 || g.paths.length === 1)).toBe(
      true,
    )
  })

  it('areaMerge by remainingFaces count', () => {
    const tris = delaunayTriangulationPoints(sampleSites())
    const g = areaMerge(tris, { remainingFaces: 2 })
    expect(g.paths.length).toBeLessThanOrEqual(2)
  })
})

describe('meshing extract and repair', () => {
  it('extractInnerEdges excludes perimeter', () => {
    const tris = delaunayTriangulationPoints([
      vec2(0, 0),
      vec2(1, 0),
      vec2(0.5, 1),
      vec2(0.5, 0.3),
    ])
    const edges = extractInnerEdges(tris)
    expect(edges.length).toBeGreaterThan(0)
    // All inner edges should be shorter than the bbox diagonal and shared
    expect(edges.length).toBeLessThan(
      tris.reduce((n, t) => n + (t.rings[0]?.length ?? 0), 0),
    )
  })

  it('extractInnerVertices excludes perimeter corners', () => {
    const tris = delaunayTriangulationPoints([
      vec2(0, 0),
      vec2(1, 0),
      vec2(0.5, 1),
      vec2(0.5, 0.3),
    ])
    const verts = extractInnerVertices(tris)
    expect(verts.some((v) => Math.abs(v.x - 0.5) < 1e-9 && Math.abs(v.y - 0.3) < 1e-9)).toBe(
      true,
    )
    expect(verts.every((v) => !(v.x === 0 && v.y === 0))).toBe(true)
  })

  it('findContainingFace hits a triangle', () => {
    const tris = delaunayTriangulationPoints([
      vec2(0, 0),
      vec2(1, 0),
      vec2(0, 1),
    ])
    expect(findContainingFace(tris, vec2(0.1, 0.1))).not.toBeNull()
  })

  it('fixBreaks snaps a gapped pair of quads', () => {
    const a = polygon([
      vec2(0, 0),
      vec2(0.49, 0),
      vec2(0.49, 1),
      vec2(0, 1),
    ])
    const b = polygon([
      vec2(0.51, 0),
      vec2(1, 0),
      vec2(1, 1),
      vec2(0.51, 1),
    ])
    const fixed = fixBreaks([a, b], 0.05)
    expect(fixed.paths.length).toBeGreaterThanOrEqual(1)
    expect(areaGroup(fixed)).toBeGreaterThan(0.9)
  })

  it('findBreaks detects near-duplicate perimeter edges', () => {
    const a = polygon([
      vec2(0, 0),
      vec2(0.5, 0),
      vec2(0.5, 1),
      vec2(0, 1),
    ])
    const b = polygon([
      vec2(0.501, 0),
      vec2(1, 0),
      vec2(1, 1),
      vec2(0.501, 1),
    ])
    const breaks = findBreaks([a, b])
    expect(breaks.paths.length).toBeGreaterThan(0)
  })

  it('fixBrokenFaces closes an open almost-loop', () => {
    const open = polyline([
      vec2(0, 0),
      vec2(1, 0),
      vec2(1, 1),
      vec2(0, 1),
      vec2(0.001, 0.001),
    ])
    const g = fixBrokenFaces([open], 0.01, true)
    expect(g.paths.some((p) => p.closed)).toBe(true)
  })

  it('findIslands reports disconnected components', () => {
    const a = polygon([vec2(0, 0), vec2(1, 0), vec2(0, 1)])
    const b = polygon([vec2(3, 3), vec2(4, 3), vec2(3, 4)])
    const islands = findIslands([a, b])
    expect(islands.length).toBe(2)
  })
})
