import { FillRule, inflatePathsD, JoinType, EndType } from 'clipper2-ts'
import type { Path } from '../types/index.js'
import {
  pathToPathsD,
  pathsDToGroup,
} from '../clipper/convert.js'

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
) {
  const subject = pathToPathsD(path)
  const join =
    options.join === 'miter'
      ? JoinType.Miter
      : options.join === 'square'
        ? JoinType.Square
        : JoinType.Round
  const inflated = inflatePathsD(
    subject,
    delta,
    join,
    EndType.Polygon,
    2,
    2,
  )
  return pathsDToGroup(inflated)
}

/**
 * Erosion followed by dilation (or the reverse when delta &lt; 0 semantics differ).
 * PGS `erosionDilation`: negative then positive buffer in one op when amount &gt; 0
 * means erode by amount then dilate by amount.
 */
export function erosionDilation(path: Path, amount: number) {
  const a = Math.abs(amount)
  if (a < 1e-12) {
    return pathsDToGroup(pathToPathsD(path))
  }
  const eroded = buffer(path, -a)
  if (eroded.paths.length === 0) return eroded
  // dilate each component and union roughly by buffering each
  const parts = eroded.paths.map((p) => buffer(p, a))
  const merged = parts.flatMap((g) => g.paths)
  return { paths: merged }
}

export const morphology = {
  buffer,
  erosionDilation,
}

// silence unused FillRule if tree-shaken oddly in some builds
void FillRule
