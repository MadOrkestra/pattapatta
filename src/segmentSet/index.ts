import type { Path, Segment, Vec2 } from '../types/index.js'
import { segment, vec2 } from '../types/index.js'

/** Match Processing `float` for PGS parity on hatch fixtures. */
function f32(n: number): number {
  return Math.fround(n)
}

/**
 * Parallel segments through a center point (PGS `parallelSegments` semantics).
 * `length` is the half-length along the segment direction; full span is `2 * length`.
 * `angle` is radians along the segment; spacing is perpendicular.
 */
export function parallelSegments(
  centerX: number,
  centerY: number,
  length: number,
  spacing: number,
  angle: number,
  n: number,
): Segment[] {
  const edges: Segment[] = []
  if (n < 1) return edges

  const center = vec2(f32(centerX), f32(centerY))
  let dx = f32(Math.cos(angle + Math.PI / 2) * spacing)
  let dy = f32(Math.sin(angle + Math.PI / 2) * spacing)
  const cos = f32(Math.cos(angle))
  const sin = f32(Math.sin(angle))
  const l = f32(length)

  let i: number
  let offX = 0
  let offY = 0

  if (n % 2 === 1) {
    const a = vec2(f32(center.x + cos * l), f32(center.y + sin * l))
    const b = vec2(f32(center.x + cos * -l), f32(center.y + sin * -l))
    edges.push(segment(a, b))
    i = 1
  } else {
    dx = f32(dx / 2)
    dy = f32(dy / 2)
    i = 1
    {
      let a = vec2(f32(center.x + dx * i), f32(center.y + dy * i))
      const b = vec2(f32(a.x + cos * l), f32(a.y + sin * l))
      a = vec2(f32(a.x + cos * -l), f32(a.y + sin * -l))
      edges.push(segment(a, b))
    }
    {
      let a = vec2(f32(center.x + dx * -i), f32(center.y + dy * -i))
      const b = vec2(f32(a.x + cos * l), f32(a.y + sin * l))
      a = vec2(f32(a.x + cos * -l), f32(a.y + sin * -l))
      edges.push(segment(a, b))
    }
    i = 2
    dx = f32(dx * 2)
    dy = f32(dy * 2)
    offX = f32(dx / 2)
    offY = f32(dy / 2)
  }

  for (; i < 1 + Math.floor(n / 2); i++) {
    {
      let a = vec2(
        f32(center.x + dx * i - offX),
        f32(center.y + dy * i - offY),
      )
      const b = vec2(f32(a.x + cos * l), f32(a.y + sin * l))
      a = vec2(f32(a.x + cos * -l), f32(a.y + sin * -l))
      edges.push(segment(a, b))
    }
    {
      let a = vec2(
        f32(center.x + dx * -i + offX),
        f32(center.y + dy * -i + offY),
      )
      const b = vec2(f32(a.x + cos * l), f32(a.y + sin * l))
      a = vec2(f32(a.x + cos * -l), f32(a.y + sin * -l))
      edges.push(segment(a, b))
    }
  }

  return edges
}

/**
 * Random non-intersecting segments in a box anchored at `(originX, originY)`
 * with the given width/height (PGS `stochasticSegments`).
 *
 * Lengths are uniform in `[minLength, maxLength)` when the range differs;
 * use equal min/max for fixed length. Seeded via mulberry32.
 */
export function stochasticSegments(
  width: number,
  height: number,
  n: number,
  minLength?: number,
  maxLength?: number,
  seed = 1,
  originX = 0,
  originY = 0,
): Segment[] {
  const minL =
    minLength ?? 1
  const maxL =
    maxLength ?? Math.min(width, height)
  if (n < 1 || width <= 0 || height <= 0) return []

  const monoLength = minL === maxL
  const rng = mulberry32(seed >>> 0)
  const edges: Segment[] = []
  const maxAttempts = Math.max(10_000, n * 500)
  let attempts = 0

  while (edges.length < n && attempts < maxAttempts) {
    attempts++
    const length = monoLength ? minL : minL + rng() * (maxL - minL)
    if (!(length > 0) || length * 2 >= width || length * 2 >= height) {
      continue
    }
    const ax = originX + rng() * (width - length * 2) + length
    const ay = originY + rng() * (height - length * 2) + length
    const theta = rng() * Math.PI * 2
    const bx = ax + Math.cos(theta) * length
    const by = ay + Math.sin(theta) * length
    const a = vec2(ax, ay)
    const b = vec2(bx, by)

    let hits = false
    for (const s of edges) {
      if (segmentsIntersect(a, b, s.a, s.b)) {
        hits = true
        break
      }
    }
    if (!hits) edges.push(segment(a, b))
  }

  return edges
}

/**
 * Fabric-like horizontal/vertical weave on a regular cell grid
 * (PGS `weaveSegments` / ABC auxetics).
 *
 * Domain is `[originX, originX+width] × [originY, originY+height]`.
 * A/B control weft/warp run lengths; C is the row phase shift (mod A+B).
 */
export function weaveSegments(
  width: number,
  height: number,
  cellSize: number,
  A = 1,
  B = 1,
  C = 1,
  options: WeaveSegmentsOptions = {},
): Segment[] {
  if (!(cellSize > 0)) {
    throw new Error('weaveSegments: cellSize must be > 0')
  }
  if (A <= 0 || B <= 0) {
    throw new Error('weaveSegments: A and B must be > 0')
  }

  const {
    originX = 0,
    originY = 0,
    swapColors = false,
    cellFraction = 1,
    extendSingletonsToEdge = true,
  } = options

  if (!(cellFraction > 0)) {
    throw new Error('weaveSegments: cellFraction must be > 0')
  }

  const P = A + B
  const f = Math.max(0, Math.min(1, cellFraction))

  const cols = Math.max(1, Math.floor(width / cellSize))
  const rows = Math.max(1, Math.floor(height / cellSize))
  const gridW = cols * cellSize
  const gridH = rows * cellSize
  const dx = originX + (width - gridW) * 0.5
  const dy = originY + (height - gridH) * 0.5

  const gridLeft = dx
  const gridRight = dx + gridW
  const gridBottom = dy
  const gridTop = dy + gridH

  const weft: boolean[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => false),
  )
  for (let r = 0; r < rows; r++) {
    const shift = floorMod(r * C, P)
    for (let c = 0; c < cols; c++) {
      const idx = floorMod(c + shift, P)
      let isWeft = idx < A
      if (swapColors) isWeft = !isWeft
      weft[r]![c] = isWeft
    }
  }

  const segs: Segment[] = []

  for (let r = 0; r < rows; r++) {
    let c = 0
    while (c < cols) {
      if (!weft[r]![c]) {
        c++
        continue
      }
      const start = c
      while (c + 1 < cols && weft[r]![c + 1]) c++
      const end = c
      const runLen = end - start + 1
      const y = dy + (r + 0.5) * cellSize
      let x0 = dx + (start + (1 - f)) * cellSize
      let x1 = dx + (end + f) * cellSize

      if (extendSingletonsToEdge && runLen === 1) {
        const cx = dx + (start + 0.5) * cellSize
        if (start === 0) {
          x0 = gridLeft
          x1 = cx
        } else if (end === cols - 1) {
          x0 = cx
          x1 = gridRight
        }
      }

      x0 = clamp(x0, gridLeft, gridRight)
      x1 = clamp(x1, gridLeft, gridRight)
      segs.push(segment(vec2(x0, y), vec2(x1, y)))
      c++
    }
  }

  for (let c = 0; c < cols; c++) {
    let r = 0
    while (r < rows) {
      if (weft[r]![c]) {
        r++
        continue
      }
      const start = r
      while (r + 1 < rows && !weft[r + 1]![c]) r++
      const end = r
      const runLen = end - start + 1
      const x = dx + (c + 0.5) * cellSize
      let y0 = dy + (start + (1 - f)) * cellSize
      let y1 = dy + (end + f) * cellSize

      if (extendSingletonsToEdge && runLen === 1) {
        const cy = dy + (start + 0.5) * cellSize
        if (start === 0) {
          y0 = gridBottom
          y1 = cy
        } else if (end === rows - 1) {
          y0 = cy
          y1 = gridTop
        }
      }

      y0 = clamp(y0, gridBottom, gridTop)
      y1 = clamp(y1, gridBottom, gridTop)
      segs.push(segment(vec2(x, y0), vec2(x, y1)))
      r++
    }
  }

  return segs
}

export type WeaveSegmentsOptions = {
  originX?: number
  originY?: number
  /** Swap weft/warp roles. */
  swapColors?: boolean
  /** Endpoint position inside run end cells (0.5..1 typical). Default `1`. */
  cellFraction?: number
  /** Extend single-cell boundary runs to the grid edge. Default `true`. */
  extendSingletonsToEdge?: boolean
}

/** Per-sample length for {@link perpendicularPathSegments}. */
export type SegmentLengthFn = (
  x: number,
  y: number,
  posFrac: number,
  normalAngle: number,
) => number

/**
 * Perpendicular ticks along each ring of `path`, centered on the boundary
 * (PGS `perpendicularPathSegments`). Outline texture, not an area fill.
 *
 * Closed rings are oriented CW so the left-hand normal points outward.
 */
export function perpendicularPathSegments(
  path: Path,
  interSegmentDistance: number,
  length: number | SegmentLengthFn,
  startOffset = 0,
): Segment[] {
  if (!(interSegmentDistance > 0)) return []
  const lengthFn: SegmentLengthFn =
    typeof length === 'function' ? length : () => length

  const startNorm = ((startOffset % 1) + 1) % 1
  const edges: Segment[] = []

  for (const ring of path.rings) {
    if (ring.length < 2) continue
    const closed = path.closed
    let pts = ring.map((v) => vec2(v.x, v.y))
    if (closed && shoelace(pts) > 0) {
      pts = pts.slice().reverse()
    }

    const indexed = lengthIndex(pts, closed)
    const end = indexed.total
    if (!(end > 0)) continue

    const count = Math.max(1, Math.round(end / interSegmentDistance))
    const increment = 1 / count
    const eps = Math.max(
      end * 1e-4,
      Math.min(interSegmentDistance * 0.35, end * 0.01),
    )

    for (let i = 0; i < count; i++) {
      const posFrac = (startNorm + i * increment) % 1
      const idx = posFrac * end
      const idxM = closed
        ? wrapIndex(idx - eps, end)
        : clamp(idx - eps, 0, end)
      const idxP = closed
        ? wrapIndex(idx + eps, end)
        : clamp(idx + eps, 0, end)

      const pm = indexed.pointAt(idxM)
      const pp = indexed.pointAt(idxP)
      const pc = indexed.pointAt(idx)

      const tx = pp.x - pm.x
      const ty = pp.y - pm.y
      const tlen = Math.hypot(tx, ty)
      if (tlen === 0) continue

      const nx = -ty / tlen
      const ny = tx / tlen
      const normalAngle = Math.atan2(ny, nx)
      const L = lengthFn(pc.x, pc.y, posFrac, normalAngle)
      if (!(L > 0)) continue
      const half = L * 0.5
      edges.push(
        segment(
          vec2(pc.x - nx * half, pc.y - ny * half),
          vec2(pc.x + nx * half, pc.y + ny * half),
        ),
      )
    }
  }

  return edges
}

export function filterByMinLength(
  segments: Segment[],
  minLength: number,
): Segment[] {
  return segments.filter((s) => segmentLength(s) >= minLength)
}

export function filterAxisAligned(
  segments: Segment[],
  angleDelta: number,
): Segment[] {
  return segments.filter((s) => {
    const ang = Math.abs(Math.atan2(s.b.y - s.a.y, s.b.x - s.a.x))
    const norm = Math.min(ang % Math.PI, Math.PI - (ang % Math.PI))
    const nearH = norm <= angleDelta || Math.abs(norm - Math.PI) <= angleDelta
    const nearV = Math.abs(norm - Math.PI / 2) <= angleDelta
    return !(nearH || nearV)
  })
}

export function segmentLength(s: Segment): number {
  const dx = s.b.x - s.a.x
  const dy = s.b.y - s.a.y
  return Math.hypot(dx, dy)
}

export function segmentsToOpenPaths(segments: Segment[]) {
  return segments.map((s) => ({
    rings: [[s.a, s.b]],
    closed: false as const,
  }))
}

export const segmentSet = {
  parallelSegments,
  stochasticSegments,
  weaveSegments,
  perpendicularPathSegments,
  filterByMinLength,
  filterAxisAligned,
  segmentLength,
  segmentsToOpenPaths,
}

function floorMod(n: number, m: number): number {
  return ((n % m) + m) % m
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}

function wrapIndex(idx: number, end: number): number {
  if (end <= 0) return 0
  let x = idx % end
  if (x < 0) x += end
  return x
}

function shoelace(ring: Vec2[]): number {
  let sum = 0
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]!
    const b = ring[(i + 1) % ring.length]!
    sum += a.x * b.y - b.x * a.y
  }
  return sum / 2
}

/** Proper segment intersection (shared endpoint counts as intersect). */
function segmentsIntersect(a: Vec2, b: Vec2, c: Vec2, d: Vec2): boolean {
  return (
    ccw(a, c, d) !== ccw(b, c, d) && ccw(a, b, c) !== ccw(a, b, d)
  )
}

function ccw(a: Vec2, b: Vec2, c: Vec2): boolean {
  return (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x)
}

function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function lengthIndex(ring: Vec2[], closed: boolean) {
  const n = ring.length
  const edgeCount = closed ? n : n - 1
  const lengths: number[] = []
  let total = 0
  for (let i = 0; i < edgeCount; i++) {
    const a = ring[i]!
    const b = ring[(i + 1) % n]!
    const L = Math.hypot(b.x - a.x, b.y - a.y)
    lengths.push(L)
    total += L
  }
  return {
    total,
    pointAt(dist: number): Vec2 {
      let remain = dist
      if (remain <= 0) return { ...ring[0]! }
      if (remain >= total) return { ...ring[closed ? 0 : n - 1]! }
      for (let i = 0; i < lengths.length; i++) {
        const L = lengths[i]!
        if (remain <= L || i === lengths.length - 1) {
          const t = L < 1e-12 ? 0 : remain / L
          const a = ring[i]!
          const b = ring[(i + 1) % n]!
          return {
            x: a.x + (b.x - a.x) * t,
            y: a.y + (b.y - a.y) * t,
          }
        }
        remain -= L
      }
      return { ...ring[0]! }
    },
  }
}

export type { Vec2 }
