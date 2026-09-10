import type { Group, Path } from '../types/index.js'
import { group, path, polygon, polyline, vec2 } from '../types/index.js'
import { parsePathData } from './pathData.js'

const SHAPE_RE =
  /<(path|rect|circle|line|polyline|polygon)\b[^>]*\/?>/gi

/**
 * Parse a subset of SVG into a geometry group.
 * Supports: `path` (M/L/H/V/Z), `rect`, `circle`, `line`, `polyline`, `polygon`.
 * Element order in the document is preserved (later = on top for occlusion).
 */
export function parseSvg(svg: string): Group {
  const paths: Path[] = []

  for (const match of svg.matchAll(SHAPE_RE)) {
    const el = match[0]
    const tag = match[1]?.toLowerCase()
    if (!tag) continue

    if (tag === 'path') {
      const d = getAttr(el, 'd')
      if (!d) continue
      const parsed = parsePathData(d)
      if (parsed.rings.length === 0) continue
      paths.push(path(parsed.rings, parsed.closed))
      continue
    }

    if (tag === 'rect') {
      const x = num(getAttr(el, 'x'), 0)
      const y = num(getAttr(el, 'y'), 0)
      const w = num(getAttr(el, 'width'), 0)
      const h = num(getAttr(el, 'height'), 0)
      if (w === 0 || h === 0) continue
      paths.push(
        polygon([
          vec2(x, y),
          vec2(x + w, y),
          vec2(x + w, y + h),
          vec2(x, y + h),
        ]),
      )
      continue
    }

    if (tag === 'circle') {
      const cx = num(getAttr(el, 'cx'), 0)
      const cy = num(getAttr(el, 'cy'), 0)
      const r = num(getAttr(el, 'r'), 0)
      if (r <= 0) continue
      paths.push(polygon(circleRing(cx, cy, r, 64)))
      continue
    }

    if (tag === 'line') {
      const x1 = num(getAttr(el, 'x1'), 0)
      const y1 = num(getAttr(el, 'y1'), 0)
      const x2 = num(getAttr(el, 'x2'), 0)
      const y2 = num(getAttr(el, 'y2'), 0)
      paths.push(polyline([vec2(x1, y1), vec2(x2, y2)]))
      continue
    }

    if (tag === 'polyline') {
      const pts = parsePoints(getAttr(el, 'points') ?? '')
      if (pts.length >= 2) paths.push(polyline(pts))
      continue
    }

    if (tag === 'polygon') {
      const pts = parsePoints(getAttr(el, 'points') ?? '')
      if (pts.length >= 3) paths.push(polygon(pts))
    }
  }

  return group(paths)
}

function getAttr(el: string, name: string): string | undefined {
  const re = new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, 'i')
  const m = re.exec(el)
  return m?.[1]
}

function num(value: string | undefined, fallback: number): number {
  if (value === undefined || value === '') return fallback
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function parsePoints(points: string) {
  const nums = points
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean)
    .map(Number)
  const out = []
  for (let i = 0; i + 1 < nums.length; i += 2) {
    const x = nums[i]
    const y = nums[i + 1]
    if (x === undefined || y === undefined) continue
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue
    out.push(vec2(x, y))
  }
  return out
}

function circleRing(cx: number, cy: number, r: number, segments: number) {
  const ring = []
  for (let i = 0; i < segments; i += 1) {
    const t = (i / segments) * Math.PI * 2
    ring.push(vec2(cx + r * Math.cos(t), cy + r * Math.sin(t)))
  }
  return ring
}
