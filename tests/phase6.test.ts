import { describe, expect, it } from 'vitest'
import {
  area,
  closestPoint,
  compoundVoronoi,
  containsPoint,
  createCircle,
  createKochSnowflake,
  createRect,
  createSponge,
  createStar,
  delaunayTriangulation,
  delaunayTriangulationPoints,
  earCutTriangulation,
  envelope,
  innerVoronoi,
  maximumInscribedAARectangle,
  maximumInscribedCircle,
  minimumBoundingCircle,
  poisson,
  poissonTriangulation,
  polygon,
  refine,
  vec2,
} from '../src/index.js'

function unitSquare() {
  return polygon([vec2(0, 0), vec2(1, 0), vec2(1, 1), vec2(0, 1)])
}

describe('optimisation', () => {
  it('MIC of unit square has r ~ 0.5', () => {
    const c = maximumInscribedCircle(unitSquare(), 0.5)
    expect(c).not.toBeNull()
    expect(c!.r).toBeGreaterThan(0.4)
    expect(c!.r).toBeLessThanOrEqual(0.5 + 1e-6)
  })

  it('envelope and AA rect match unit square', () => {
    expect(area(envelope(unitSquare()))).toBeCloseTo(1, 6)
    expect(area(maximumInscribedAARectangle(unitSquare()))).toBeCloseTo(1, 6)
  })

  it('closestPoint projects onto edge', () => {
    const q = closestPoint(unitSquare(), vec2(0.5, -1))
    expect(q.x).toBeCloseTo(0.5, 6)
    expect(q.y).toBeCloseTo(0, 6)
  })

  it('minimumBoundingCircle covers unit square', () => {
    const c = minimumBoundingCircle(unitSquare())
    expect(c.r).toBeGreaterThanOrEqual(Math.SQRT1_2 - 1e-6)
    expect(c.r).toBeLessThanOrEqual(Math.SQRT1_2 + 0.05)
  })
})

describe('voronoi / triangulation points', () => {
  it('compoundVoronoi returns one cell per site', () => {
    const sites = [vec2(0.2, 0.2), vec2(0.8, 0.2), vec2(0.5, 0.8)]
    const g = compoundVoronoi(sites, {
      bounds: { minX: 0, minY: 0, maxX: 1, maxY: 1 },
    })
    expect(g.paths.length).toBe(3)
  })

  it('innerVoronoi clips to container', () => {
    const sites = [vec2(0.25, 0.25), vec2(0.75, 0.75)]
    const g = innerVoronoi(sites, unitSquare())
    expect(g.paths.length).toBeGreaterThanOrEqual(1)
    for (const p of g.paths) {
      expect(area(p)).toBeGreaterThan(0)
      expect(area(p)).toBeLessThanOrEqual(1 + 1e-6)
    }
  })

  it('delaunayTriangulationPoints yields triangles', () => {
    const tris = delaunayTriangulationPoints([
      vec2(0, 0),
      vec2(1, 0),
      vec2(0.5, 1),
      vec2(0.5, 0.3),
    ])
    expect(tris.length).toBeGreaterThanOrEqual(2)
  })
})

describe('poisson / refine triangulation', () => {
  it('poissonTriangulation fills the path with interior centroids', () => {
    const cell = unitSquare()
    const ear = earCutTriangulation(cell)
    const tris = poissonTriangulation(cell, 0.2, 3)
    expect(tris.length).toBeGreaterThan(ear.length)
    for (const t of tris) {
      const r = t.rings[0]!
      const c = {
        x: (r[0]!.x + r[1]!.x + r[2]!.x) / 3,
        y: (r[0]!.y + r[1]!.y + r[2]!.y) / 3,
      }
      expect(containsPoint(cell, c)).toBe(true)
    }
  })

  it('refine increases mesh density vs plain delaunay on a star', () => {
    const star = createStar(0, 0, 1, 0.4, 5)
    const base = delaunayTriangulation(star)
    const refined = refine(star, {
      minAngle: Math.PI / 3,
      maxIterations: 80,
    })
    expect(refined.length).toBeGreaterThan(base.length)
    for (const t of refined) {
      const r = t.rings[0]!
      const c = {
        x: (r[0]!.x + r[1]!.x + r[2]!.x) / 3,
        y: (r[0]!.y + r[1]!.y + r[2]!.y) / 3,
      }
      expect(containsPoint(star, c)).toBe(true)
    }
  })
})

describe('construction / poisson', () => {
  it('createCircle / createRect / createStar produce area', () => {
    expect(area(createCircle(0, 0, 1, 64))).toBeGreaterThan(3)
    expect(area(createRect(0, 0, 2, 3))).toBeCloseTo(6, 6)
    expect(area(createStar(0, 0, 1, 0.4, 5))).toBeGreaterThan(0.5)
  })

  it('createKochSnowflake grows perimeter vertices', () => {
    const k0 = createKochSnowflake(0, 0, 1, 0)
    const k2 = createKochSnowflake(0, 0, 1, 2)
    expect(k2.rings[0]!.length).toBeGreaterThan(k0.rings[0]!.length)
  })

  it('poisson is seeded and respects min distance', () => {
    const a = poisson(0.15, 0, 0, 1, 1, 7)
    const b = poisson(0.15, 0, 0, 1, 1, 7)
    expect(a).toEqual(b)
    expect(a.length).toBeGreaterThan(5)
    for (let i = 0; i < a.length; i++) {
      for (let j = i + 1; j < a.length; j++) {
        expect(Math.hypot(a[i]!.x - a[j]!.x, a[i]!.y - a[j]!.y)).toBeGreaterThanOrEqual(
          0.15 - 1e-9,
        )
      }
    }
  })

  it('createSponge is porous, seeded, and smaller than the frame', () => {
    const a = createSponge(100, 100, 24, 2, 1, 6, 11)
    const b = createSponge(100, 100, 24, 2, 1, 6, 11)
    expect(a.paths.length).toBeGreaterThanOrEqual(1)
    expect(a.paths.length).toBe(b.paths.length)
    // Porous: at least one path with holes (or multiple pieces)
    const hasHoles = a.paths.some((p) => p.rings.length > 1)
    expect(hasHoles || a.paths.length > 1).toBe(true)
    // Net shoelace area (Clipper pathsArea can mis-count holes)
    let net = 0
    for (const p of a.paths) {
      for (let i = 0; i < p.rings.length; i++) {
        const ra = Math.abs(
          p.rings[i]!.reduce((s, v, j, r) => {
            const n = r[(j + 1) % r.length]!
            return s + v.x * n.y - n.x * v.y
          }, 0) / 2,
        )
        net += i === 0 ? ra : -ra
      }
    }
    expect(net).toBeGreaterThan(0)
    expect(net).toBeLessThan(100 * 100)
  })
})
