import type { Group, Path, Vec2 } from '../types/index.js'
import { polygon, vec2 } from '../types/index.js'
import { areaGroup } from '../predicates/index.js'

export type OracleCase = {
  id: string
  seed: number
  operation: string
  outputs: {
    paths: { rings: number[][][] }[]
    lines: number[][][]
    circles: { x: number; y: number; r: number }[]
    scalars: { area?: number; [k: string]: number | undefined }
  }
}

export function ringsToPath(rings: number[][][]): Path {
  const converted = rings.map((ring) =>
    ring.map((pt) => vec2(pt[0]!, pt[1]!)),
  )
  return polygon(converted[0] ?? [], converted.slice(1))
}

export function oraclePathsToGroup(paths: { rings: number[][][] }[]): Group {
  return {
    paths: paths.map((p) => ringsToPath(p.rings)),
  }
}

/** Relative area error between two groups. */
export function relativeAreaError(a: Group, b: Group): number {
  const aa = areaGroup(a)
  const bb = areaGroup(b)
  const denom = Math.max(Math.abs(aa), Math.abs(bb), 1e-12)
  return Math.abs(aa - bb) / denom
}

export function assertAreaClose(
  actual: Group,
  expectedArea: number,
  tol = 1e-3,
): void {
  const got = areaGroup(actual)
  const denom = Math.max(Math.abs(expectedArea), 1e-12)
  const err = Math.abs(got - expectedArea) / denom
  if (err > tol) {
    throw new Error(
      `Area mismatch: got ${got}, expected ${expectedArea}, relErr=${err}`,
    )
  }
}

/** Sample grid points: fraction of points with same containment in both groups. */
export function containmentAgreement(
  a: Group,
  b: Group,
  samples = 20,
): number {
  const bounds = unionBounds(a, b)
  if (bounds.maxX === bounds.minX || bounds.maxY === bounds.minY) return 1
  let agree = 0
  let total = 0
  for (let i = 0; i < samples; i++) {
    for (let j = 0; j < samples; j++) {
      const x =
        bounds.minX + ((i + 0.5) / samples) * (bounds.maxX - bounds.minX)
      const y =
        bounds.minY + ((j + 0.5) / samples) * (bounds.maxY - bounds.minY)
      const p = vec2(x, y)
      const inA = pointInGroup(a, p)
      const inB = pointInGroup(b, p)
      if (inA === inB) agree += 1
      total += 1
    }
  }
  return agree / total
}

function pointInGroup(g: Group, p: Vec2): boolean {
  for (const path of g.paths) {
    if (!path.closed || !path.rings[0]) continue
    // exterior
    if (!pointInPoly(p, path.rings[0])) continue
    let inHole = false
    for (let i = 1; i < path.rings.length; i++) {
      const hole = path.rings[i]
      if (hole && pointInPoly(p, hole)) {
        inHole = true
        break
      }
    }
    if (!inHole) return true
  }
  return false
}

function pointInPoly(point: Vec2, ring: Vec2[]): boolean {
  // ray cast
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i]!.x
    const yi = ring[i]!.y
    const xj = ring[j]!.x
    const yj = ring[j]!.y
    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi + 0.0) + xi
    if (intersect) inside = !inside
  }
  return inside
}

function unionBounds(a: Group, b: Group) {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const g of [a, b]) {
    for (const p of g.paths) {
      for (const ring of p.rings) {
        for (const v of ring) {
          minX = Math.min(minX, v.x)
          minY = Math.min(minY, v.y)
          maxX = Math.max(maxX, v.x)
          maxY = Math.max(maxY, v.y)
        }
      }
    }
  }
  return { minX, minY, maxX, maxY }
}
