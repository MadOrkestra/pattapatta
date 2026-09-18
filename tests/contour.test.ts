import { describe, expect, it } from 'vitest'
import {
  chordalAxis,
  centerLine,
  contrastField,
  createRect,
  createRegularPolygon,
  delaunayTriangulation,
  densify,
  distanceField,
  distanceTree,
  dissolveSegments,
  group,
  isolines,
  isolinesFromFunction,
  isolineZeroFromFunction,
  medialAxis,
  polygon,
  segment,
  straightSkeleton,
  straightSkeletonParts,
  vec2,
} from '../src/index.js'

function unitSquare() {
  return polygon([vec2(0, 0), vec2(100, 0), vec2(100, 100), vec2(0, 100)])
}

describe('dissolveSegments', () => {
  it('chains connected segments into a polyline', () => {
    const g = dissolveSegments([
      segment(vec2(0, 0), vec2(1, 0)),
      segment(vec2(1, 0), vec2(2, 0)),
      segment(vec2(2, 0), vec2(3, 0)),
    ])
    expect(g.paths.length).toBe(1)
    expect(g.paths[0]!.rings[0]!.length).toBe(4)
  })
})

describe('marching squares / isolines', () => {
  it('isolinesFromFunction finds concentric rings for radial field', () => {
    const g = isolinesFromFunction(
      [0, 0, 100, 100],
      2,
      10,
      (x, y) => Math.hypot(x - 50, y - 50),
      10,
      40,
    )
    expect(g.paths.length).toBeGreaterThan(0)
  })

  it('isolineZeroFromFunction finds the zero level set', () => {
    const g = isolineZeroFromFunction([0, 0, 10, 10], 0.5, (x, y) => x + y - 10)
    expect(g.paths.length).toBeGreaterThan(0)
  })

  it('isolines on a square around center', () => {
    const g = isolines(unitSquare(), vec2(50, 50), 15)
    expect(g.paths.length).toBeGreaterThan(0)
  })
})

describe('chordalAxis', () => {
  it('returns polylines for a rectangle', () => {
    const g = chordalAxis(createRect(0, 0, 80, 40))
    expect(g.paths.length).toBeGreaterThan(0)
    for (const p of g.paths) {
      expect(p.closed).toBe(false)
      expect(p.rings[0]!.length).toBeGreaterThanOrEqual(2)
    }
  })
})

describe('medialAxis + centerLine', () => {
  it('medialAxis produces interior skeleton lines', () => {
    const shape = densify(createRect(10, 10, 80, 40), 4)
    const g = medialAxis(shape, 0, 0, 0)
    expect(g.paths.length).toBeGreaterThan(0)
  })

  it('pruning reduces segment count', () => {
    const shape = densify(createRegularPolygon(50, 50, 40, 12), 3)
    const full = medialAxis(shape, 0, 0, 0)
    const pruned = medialAxis(shape, 0.5, 0.5, 0.5)
    const count = (g: { paths: unknown[] }) => g.paths.length
    expect(count(pruned)).toBeLessThanOrEqual(count(full))
  })

  it('centerLine returns an open path with multiple vertices', () => {
    const shape = densify(createRect(0, 20, 100, 20), 3)
    const line = centerLine(shape, 0.7, 50)
    expect(line.closed).toBe(false)
    expect(line.rings[0]!.length).toBeGreaterThanOrEqual(2)
  })
})

describe('distanceField + contrastField', () => {
  it('distanceField returns contours inside a square', () => {
    const g = distanceField(unitSquare(), 12)
    expect(g.paths.length).toBeGreaterThan(0)
  })

  it('contrastField returns contours', () => {
    const g = contrastField(unitSquare(), 6, vec2(20, 20))
    expect(g.paths.length).toBeGreaterThan(0)
  })
})

describe('distanceTree', () => {
  it('builds a tree on a triangulated square', () => {
    const mesh = group(delaunayTriangulation(densify(unitSquare(), 25)))
    const flat = distanceTree(mesh, vec2(50, 50), true)
    const paths = distanceTree(mesh, vec2(50, 50), false)
    expect(flat.paths.length).toBeGreaterThan(0)
    expect(paths.paths.length).toBeGreaterThan(0)
  })
})

describe('straightSkeleton', () => {
  it('returns faces/branches/bones parts', () => {
    const parts = straightSkeletonParts(createRect(0, 0, 60, 40))
    const flat = straightSkeleton(createRect(0, 0, 60, 40))
    expect(
      parts.faces.paths.length +
        parts.branches.paths.length +
        parts.bones.paths.length,
    ).toBeGreaterThan(0)
    expect(flat.paths.length).toBeGreaterThan(0)
  })
})
