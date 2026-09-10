import type { Group, Path } from '../types/index.js'
import { buffer } from '../morphology/buffer.js'

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
}
