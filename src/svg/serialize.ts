import type { Group, Path } from '../types/index.js'
import { serializePathData } from './pathData.js'

export type ToSvgOptions = {
  /** SVG viewBox attribute, e.g. `"0 0 100 100"`. */
  viewBox?: string
  /** Root width/height attributes (optional). */
  width?: number | string
  height?: number | string
  /** Stroke color (default `#000`). */
  stroke?: string
  /** Stroke width (default `1`). */
  strokeWidth?: number | string
}

/**
 * Serialize a group to plotter-oriented SVG (`fill="none"`, stroked paths).
 */
export function toSvg(g: Group, options: ToSvgOptions = {}): string {
  const stroke = options.stroke ?? '#000'
  const strokeWidth = options.strokeWidth ?? 1
  const viewBox = options.viewBox ?? inferViewBox(g)
  const widthAttr =
    options.width !== undefined ? ` width="${options.width}"` : ''
  const heightAttr =
    options.height !== undefined ? ` height="${options.height}"` : ''

  const body = g.paths
    .map((p) => pathElement(p, stroke, strokeWidth))
    .filter(Boolean)
    .join('\n  ')

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}"${widthAttr}${heightAttr} fill="none">`,
    body ? `  ${body}` : '',
    `</svg>`,
  ]
    .filter((line) => line !== '')
    .join('\n')
}

function pathElement(
  p: Path,
  stroke: string,
  strokeWidth: number | string,
): string {
  if (p.rings.length === 0) return ''
  const d = serializePathData(p.rings, p.closed)
  if (!d) return ''
  return `<path d="${d}" stroke="${stroke}" stroke-width="${strokeWidth}" fill="none" />`
}

function inferViewBox(g: Group): string {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
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
  if (!Number.isFinite(minX)) return '0 0 100 100'
  const pad = 1
  const w = Math.max(maxX - minX, 0) + pad * 2
  const h = Math.max(maxY - minY, 0) + pad * 2
  return `${minX - pad} ${minY - pad} ${w} ${h}`
}
