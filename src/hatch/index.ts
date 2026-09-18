import type { Path, Segment } from '../types/index.js'
import { path as makePath } from '../types/index.js'
import {
  parallelSegments,
  perpendicularPathSegments,
  stochasticSegments,
  weaveSegments,
  type SegmentLengthFn,
  type WeaveSegmentsOptions,
} from '../segmentSet/index.js'
import { clipSegmentsToPath } from '../segmentSet/clip.js'
import { buffer } from '../morphology/buffer.js'

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

export type WeaveHatchOptions = {
  /** Grid cell size. Default: ~1/12 of the shorter AABB side. */
  cellSize?: number
  /** Weft (horizontal on-top) run length in cells. Default `1`. */
  A?: number
  /** Warp (vertical on-top) run length in cells. Default `1`. */
  B?: number
  /** Row phase shift in cells. Default `1`. */
  C?: number
  swapColors?: boolean
  cellFraction?: number
  extendSingletonsToEdge?: boolean
}

export type StochasticHatchOptions = {
  /** Number of segments before clipping. Default `40`. */
  count?: number
  /** Fixed segment length (overrides min/max). */
  length?: number
  /** Minimum segment length. Default `1`. */
  minLength?: number
  /** Maximum segment length (exclusive when ≠ min). Default: min(AABB w,h). */
  maxLength?: number
  /** PRNG seed. Default `1`. */
  seed?: number
}

export type PerpendicularHatchOptions = {
  /** Arc-length spacing between ticks. Default `0.15`. */
  spacing?: number
  /** Tick length, or a per-sample length function. Default `0.2`. */
  length?: number | SegmentLengthFn
  /** Fractional phase along each ring in `[0,1)`. Default `0`. */
  startOffset?: number
}

export type ConcentricHatchOptions = {
  /** Inward offset step between shells. Default `0.15`. */
  spacing?: number
  /**
   * Max number of shells. Default: enough to erode until empty
   * (capped by AABB diagonal / spacing).
   */
  count?: number
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

/**
 * Weave fill: ABC fabric segments over the path AABB, clipped to the path
 * (PGS `weaveSegments` recipe).
 */
export function weave(path: Path, options: WeaveHatchOptions = {}): Segment[] {
  if (!path.closed || !path.rings[0]) {
    throw new Error('hatch.weave requires a closed path')
  }

  const bounds = pathBounds(path)
  const width = Math.max(bounds.maxX - bounds.minX, 1e-9)
  const height = Math.max(bounds.maxY - bounds.minY, 1e-9)
  const cellSize =
    options.cellSize ?? Math.max(Math.min(width, height) / 12, 1e-6)
  const weaveOpts: WeaveSegmentsOptions = {
    originX: bounds.minX,
    originY: bounds.minY,
  }
  if (options.swapColors !== undefined) weaveOpts.swapColors = options.swapColors
  if (options.cellFraction !== undefined) {
    weaveOpts.cellFraction = options.cellFraction
  }
  if (options.extendSingletonsToEdge !== undefined) {
    weaveOpts.extendSingletonsToEdge = options.extendSingletonsToEdge
  }
  const raw = weaveSegments(
    width,
    height,
    cellSize,
    options.A ?? 1,
    options.B ?? 1,
    options.C ?? 1,
    weaveOpts,
  )
  return clipSegmentsToPath(raw, path)
}

/**
 * Stochastic fill: random non-intersecting segments in the path AABB, clipped
 * to the path (PGS `stochasticSegments` recipe).
 */
export function stochastic(
  path: Path,
  options: StochasticHatchOptions = {},
): Segment[] {
  if (!path.closed || !path.rings[0]) {
    throw new Error('hatch.stochastic requires a closed path')
  }

  const bounds = pathBounds(path)
  const width = Math.max(bounds.maxX - bounds.minX, 1e-9)
  const height = Math.max(bounds.maxY - bounds.minY, 1e-9)
  const count = options.count ?? 40
  const minLength = options.length ?? options.minLength ?? 1
  const maxLength =
    options.length ?? options.maxLength ?? Math.min(width, height)
  const raw = stochasticSegments(
    width,
    height,
    count,
    minLength,
    maxLength,
    options.seed ?? 1,
    bounds.minX,
    bounds.minY,
  )
  return clipSegmentsToPath(raw, path)
}

/**
 * Perimeter ticks: perpendicular segments centered on the path boundary
 * (PGS `perpendicularPathSegments`). Outline texture, not an area fill.
 */
export function perpendicular(
  path: Path,
  options: PerpendicularHatchOptions = {},
): Segment[] {
  if (!path.rings[0]) {
    throw new Error('hatch.perpendicular requires a path with at least one ring')
  }
  const spacing = Math.max(options.spacing ?? 0.15, 1e-9)
  const length = options.length ?? 0.2
  return perpendicularPathSegments(
    path,
    spacing,
    length,
    options.startOffset ?? 0,
  )
}

/**
 * Concentric shells: repeated inward offsets as closed stroke paths.
 * Plotter-safe nested contours (not SVG paint).
 */
export function concentric(
  path: Path,
  options: ConcentricHatchOptions = {},
): Path[] {
  if (!path.closed || !path.rings[0]) {
    throw new Error('hatch.concentric requires a closed path')
  }

  const spacing = Math.max(options.spacing ?? 0.15, 1e-9)
  const bounds = pathBounds(path)
  const diag = Math.hypot(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY)
  const maxCount =
    options.count ?? Math.max(1, Math.floor(diag / (2 * spacing)))

  const out: Path[] = []
  for (let i = 1; i <= maxCount; i++) {
    const shell = buffer(path, -spacing * i)
    if (shell.paths.length === 0) break
    for (const p of shell.paths) {
      // Stroke as closed outline; clone rings so callers can mutate safely.
      out.push(
        makePath(
          p.rings.map((r) => r.map((v) => ({ x: v.x, y: v.y }))),
          true,
        ),
      )
    }
  }
  return out
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
  weave,
  stochastic,
  perpendicular,
  concentric,
}
