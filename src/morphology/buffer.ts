import type { Group, Path } from '../types/index.js'
import { group } from '../types/index.js'
import { inflatePathsD, JoinType, EndType } from 'clipper2-ts'
import { pathToPathsD, pathsDToGroup } from '../clipper/convert.js'

export type BufferOptions = {
  /** Join style for offset. Default round. */
  join?: 'round' | 'miter' | 'square'
}

/**
 * Offset / buffer a closed path by `delta` (positive = expand, negative = erode).
 * Returns a group of resulting closed paths (may split or vanish when eroding).
 */
export function buffer(
  path: Path,
  delta: number,
  options: BufferOptions = {},
): Group {
  const subject = pathToPathsD(path)
  const join =
    options.join === 'miter'
      ? JoinType.Miter
      : options.join === 'square'
        ? JoinType.Square
        : JoinType.Round
  const inflated = inflatePathsD(subject, delta, join, EndType.Polygon)
  return pathsDToGroup(inflated)
}

/**
 * Erode by `|amount|` then dilate by `|amount|` (opening). Useful for cleaning.
 */
export function erosionDilation(p: Path, amount: number): Group {
  const a = Math.abs(amount)
  if (a < 1e-12) return group([p])
  const eroded = buffer(p, -a)
  if (eroded.paths.length === 0) return eroded
  const dilated: Path[] = []
  for (const q of eroded.paths) {
    dilated.push(...buffer(q, a).paths)
  }
  return group(dilated)
}

/**
 * Dilate by `|amount|` then erode by `|amount|` (closing). Fills small gaps.
 */
export function dilationErosion(p: Path, amount: number): Group {
  const a = Math.abs(amount)
  if (a < 1e-12) return group([p])
  const dilated = buffer(p, a)
  if (dilated.paths.length === 0) return dilated
  const eroded: Path[] = []
  for (const q of dilated.paths) {
    eroded.push(...buffer(q, -a).paths)
  }
  return group(eroded)
}
