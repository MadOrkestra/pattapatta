import type { Path, Vec2 } from '../types/index.js'
import { path, normalizeRing, clonePath } from '../types/index.js'
import { bounds, centroid } from '../predicates/index.js'

function mapPath(p: Path, fn: (v: Vec2) => Vec2): Path {
  return path(
    p.rings.map((ring) => normalizeRing(ring.map(fn))),
    p.closed,
  )
}

export function translate(p: Path, dx: number, dy: number): Path {
  return mapPath(p, (v) => ({ x: v.x + dx, y: v.y + dy }))
}

export function translateToOrigin(p: Path): Path {
  const c = centroid(p)
  return translate(p, -c.x, -c.y)
}

export function translateCentroidTo(p: Path, target: Vec2): Path {
  const c = centroid(p)
  return translate(p, target.x - c.x, target.y - c.y)
}

export function rotate(p: Path, angleRad: number, pivot?: Vec2): Path {
  const o = pivot ?? { x: 0, y: 0 }
  const cos = Math.cos(angleRad)
  const sin = Math.sin(angleRad)
  return mapPath(p, (v) => {
    const x = v.x - o.x
    const y = v.y - o.y
    return {
      x: o.x + x * cos - y * sin,
      y: o.y + x * sin + y * cos,
    }
  })
}

export function rotateAroundCenter(p: Path, angleRad: number): Path {
  return rotate(p, angleRad, centroid(p))
}

export function scale(p: Path, sx: number, sy = sx, pivot?: Vec2): Path {
  const o = pivot ?? { x: 0, y: 0 }
  return mapPath(p, (v) => ({
    x: o.x + (v.x - o.x) * sx,
    y: o.y + (v.y - o.y) * sy,
  }))
}

export function originScale(p: Path, s: number): Path {
  return scale(p, s, s, { x: 0, y: 0 })
}

export function flipHorizontal(p: Path, x = 0): Path {
  return mapPath(p, (v) => ({ x: 2 * x - v.x, y: v.y }))
}

export function flipVertical(p: Path, y = 0): Path {
  return mapPath(p, (v) => ({ x: v.x, y: 2 * y - v.y }))
}

/** Uniform resize so bounding-box width equals `width`. */
export function resizeByWidth(p: Path, width: number): Path {
  const b = bounds(p)
  const w = b.maxX - b.minX
  if (w < 1e-12) return clonePath(p)
  return scale(p, width / w, width / w, { x: b.minX, y: b.minY })
}

/** Uniform resize so bounding-box height equals `height`. */
export function resizeByHeight(p: Path, height: number): Path {
  const b = bounds(p)
  const h = b.maxY - b.minY
  if (h < 1e-12) return clonePath(p)
  return scale(p, height / h, height / h, { x: b.minX, y: b.minY })
}

export const transformation = {
  translate,
  translateToOrigin,
  translateCentroidTo,
  rotate,
  rotateAroundCenter,
  scale,
  originScale,
  flipHorizontal,
  flipVertical,
  resizeByWidth,
  resizeByHeight,
}
