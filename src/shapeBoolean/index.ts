import type { Group, Path } from '../types/index.js'
import { group, groupFromPaths, path, polygon, vec2 } from '../types/index.js'
import {
  clipDifference,
  clipIntersect,
  clipUnion,
  clipXor,
  pathToPathsD,
  pathsDToGroup,
} from '../clipper/convert.js'

function ensureClosed(p: Path): Path {
  if (!p.closed) {
    throw new Error('shapeBoolean requires closed paths')
  }
  return p
}

/** Union of two closed paths. */
export function union(a: Path, b: Path): Group {
  const result = clipUnion(pathToPathsD(ensureClosed(a)), pathToPathsD(ensureClosed(b)))
  return pathsDToGroup(result)
}

/** Union of many closed paths (folded left-to-right). */
export function unionAll(paths: Path[]): Group {
  if (paths.length === 0) return group([])
  let acc = pathToPathsD(ensureClosed(paths[0]!))
  for (let i = 1; i < paths.length; i++) {
    acc = clipUnion(acc, pathToPathsD(ensureClosed(paths[i]!)))
  }
  return pathsDToGroup(acc)
}

/** Intersection of two closed paths. */
export function intersect(a: Path, b: Path): Group {
  const result = clipIntersect(
    pathToPathsD(ensureClosed(a)),
    pathToPathsD(ensureClosed(b)),
  )
  return pathsDToGroup(result)
}

/** Subtract b from a (a \ b). */
export function subtract(a: Path, b: Path): Group {
  const result = clipDifference(
    pathToPathsD(ensureClosed(a)),
    pathToPathsD(ensureClosed(b)),
  )
  return pathsDToGroup(result)
}

/** Subtract many shapes from a base. */
export function subtractAll(base: Path, shapes: Path[]): Group {
  let acc = pathToPathsD(ensureClosed(base))
  for (const s of shapes) {
    acc = clipDifference(acc, pathToPathsD(ensureClosed(s)))
  }
  return pathsDToGroup(acc)
}

/** Symmetric difference. */
export function symDifference(a: Path, b: Path): Group {
  const result = clipXor(pathToPathsD(ensureClosed(a)), pathToPathsD(ensureClosed(b)))
  return pathsDToGroup(result)
}

/** Complement of shape within axis-aligned rectangle [0,width] x [0,height]. */
export function complement(shape: Path, width: number, height: number): Group {
  const frame = polygon([
    vec2(0, 0),
    vec2(width, 0),
    vec2(width, height),
    vec2(0, height),
  ])
  return subtract(frame, shape)
}

/**
 * Painter-style occlusion: later paths in the group are on top.
 * Each path has higher paths subtracted from it; returns visible remainders.
 */
export function occlusionSubtract(g: Group): Group {
  const paths = g.paths
  const visible: Path[] = []
  for (let i = 0; i < paths.length; i++) {
    const subject = paths[i]
    if (!subject) continue
    const occluders = paths.slice(i + 1)
    const piece =
      occluders.length === 0
        ? groupFromPaths(ensureClosed(subject))
        : subtractAll(subject, occluders)
    for (const p of piece.paths) {
      visible.push(p)
    }
  }
  return group(visible)
}

/**
 * Regions covered by at least two input shapes.
 * If `merged`, collapse multi-overlaps into disjoint patches via union of pairwise intersects.
 */
export function overlapRegions(shapes: Path[], merged: boolean): Group {
  if (shapes.length < 2) return group([])
  const pairs: Path[] = []
  for (let i = 0; i < shapes.length; i++) {
    for (let j = i + 1; j < shapes.length; j++) {
      const a = shapes[i]
      const b = shapes[j]
      if (!a || !b) continue
      for (const p of intersect(a, b).paths) {
        pairs.push(p)
      }
    }
  }
  if (!merged) return group(pairs)
  return unionAll(pairs)
}

export const shapeBoolean = {
  union,
  unionAll,
  intersect,
  subtract,
  subtractAll,
  symDifference,
  complement,
  occlusionSubtract,
  overlapRegions,
}
