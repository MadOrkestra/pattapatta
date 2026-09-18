import type { Path, Segment } from '../types/index.js'
import { parallelSegments } from '../segmentSet/index.js'
import { clipSegmentsToPath } from '../segmentSet/clip.js'

export type ParallelHatchOptions = {
  /** Hatch angle in radians (segment direction). Default `Math.PI / 4`. */
  angle?: number
  /** Perpendicular spacing between lines. Default `0.15`. */
  spacing?: number
  /**
   * Half-length of generated lines before clipping (PGS `length`).
   * Default: diagonal of path bounds.
   */
  length?: number
  /**
   * Number of parallel lines (PGS `n`).
   * Default: enough lines to cover the path AABB at the given spacing.
   */
  count?: number
  /** Hatch field center. Default: path centroid of exterior bounds center. */
  center?: { x: number; y: number }
}

/**
 * Fill a closed path with parallel hatch strokes (plotter-safe).
 * Composes `parallelSegments` + clip-to-path (PGS dysonHatching recipe).
 *
 * When `count` is omitted, line count is derived from `spacing` and the path
 * bounds so the hatch covers the whole region (no corner gaps).
 */
export function parallel(path: Path, options: ParallelHatchOptions = {}): Segment[] {
  if (!path.closed || !path.rings[0]) {
    throw new Error('hatch.parallel requires a closed path')
  }

  const bounds = pathBounds(path)
  const center = options.center ?? {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2,
  }
  const diag = Math.hypot(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY)
  const length = options.length ?? Math.max(diag, 1e-6)
  const spacing = Math.max(options.spacing ?? 0.15, 1e-9)
  const angle = options.angle ?? Math.PI / 4
  const count = options.count ?? hatchLineCount(bounds, spacing, angle)

  const raw = parallelSegments(
    center.x,
    center.y,
    length,
    spacing,
    angle,
    count,
  )
  return clipSegmentsToPath(raw, path)
}

/** Cross-hatch: two perpendicular parallel passes. */
export function cross(path: Path, options: ParallelHatchOptions = {}): Segment[] {
  const angle = options.angle ?? Math.PI / 4
  const a = parallel(path, options)
  const b = parallel(path, { ...options, angle: angle + Math.PI / 2 })
  return [...a, ...b]
}

/** Lines needed so perpendicular spacing covers the AABB at `angle`. */
function hatchLineCount(
  bounds: { minX: number; minY: number; maxX: number; maxY: number },
  spacing: number,
  angle: number,
): number {
  const nx = Math.cos(angle + Math.PI / 2)
  const ny = Math.sin(angle + Math.PI / 2)
  const corners: [number, number][] = [
    [bounds.minX, bounds.minY],
    [bounds.maxX, bounds.minY],
    [bounds.maxX, bounds.maxY],
    [bounds.minX, bounds.maxY],
  ]
  let minP = Infinity
  let maxP = -Infinity
  for (const [x, y] of corners) {
    const p = x * nx + y * ny
    minP = Math.min(minP, p)
    maxP = Math.max(maxP, p)
  }
  const extent = maxP - minP
  return Math.max(1, Math.ceil(extent / spacing) + 1)
}

function pathBounds(path: Path) {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const ring of path.rings) {
    for (const v of ring) {
      minX = Math.min(minX, v.x)
      minY = Math.min(minY, v.y)
      maxX = Math.max(maxX, v.x)
      maxY = Math.max(maxY, v.y)
    }
  }
  return { minX, minY, maxX, maxY }
}

export const hatch = {
  parallel,
  cross,
}
