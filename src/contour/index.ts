import type { Group, Path, Vec2 } from '../types/index.js'
import { buffer } from '../morphology/buffer.js'
import { chordalAxis } from './chordalAxis.js'
import { medialAxis, centerLine } from './medialAxis.js'
import { straightSkeleton, straightSkeletonParts } from './straightSkeleton.js'
import type { StraightSkeletonParts } from './straightSkeleton.js'
import {
  distanceField,
  contrastField,
  isolines,
} from './fields.js'
import { distanceTree } from './distanceTree.js'
import {
  isolinesFromFunction,
  isolineZeroFromFunction,
  isolinesFromPoints,
} from './marchingSquares.js'
import type { ScalarField } from './marchingSquares.js'
import { dissolveSegments } from './dissolve.js'

/**
 * Offset the path outward by `distance` (positive buffer).
 * Returns possibly multiple closed contours.
 */
export function offsetCurvesOutward(p: Path, distance: number): Group {
  return buffer(p, Math.abs(distance))
}

/**
 * Offset the path inward by `distance` (negative buffer / erosion).
 * May return empty group if distance exceeds inradius.
 */
export function offsetCurvesInward(p: Path, distance: number): Group {
  return buffer(p, -Math.abs(distance))
}

export const contour = {
  offsetCurvesOutward,
  offsetCurvesInward,
  medialAxis,
  chordalAxis,
  straightSkeleton,
  straightSkeletonParts,
  centerLine,
  distanceField,
  contrastField,
  distanceTree,
  isolines,
  isolinesFromFunction,
  isolineZeroFromFunction,
  isolinesFromPoints,
  dissolveSegments,
}

export {
  medialAxis,
  centerLine,
  chordalAxis,
  straightSkeleton,
  straightSkeletonParts,
  distanceField,
  contrastField,
  distanceTree,
  isolines,
  isolinesFromFunction,
  isolineZeroFromFunction,
  isolinesFromPoints,
  dissolveSegments,
}

export type { StraightSkeletonParts, ScalarField, Vec2 }
