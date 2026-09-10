import { simplifyPathD } from 'clipper2-ts'
import type { Path, Ring } from '../types/index.js'
import { path, normalizeRing } from '../types/index.js'
import { pathDToRing, ringToPathD } from '../clipper/convert.js'
import { buffer, erosionDilation, dilationErosion } from './buffer.js'

export type { BufferOptions } from './buffer.js'
export { buffer, erosionDilation, dilationErosion } from './buffer.js'

/**
 * Ramer–Douglas–Peucker simplify (Clipper2). `epsilon` is absolute distance.
 */
export function simplify(p: Path, epsilon: number): Path {
  if (epsilon <= 0 || p.rings.length === 0) return p
  const rings: Ring[] = []
  for (const ring of p.rings) {
    const simplified = simplifyPathD(ringToPathD(ring), epsilon, p.closed)
    const out = pathDToRing(simplified)
    if (out.length >= (p.closed ? 3 : 2)) rings.push(out)
  }
  if (rings.length === 0) return path([], p.closed)
  return path(rings, p.closed)
}

/** Round vertex coordinates to `decimals` places. */
export function reducePrecision(p: Path, decimals: number): Path {
  const f = 10 ** Math.max(0, Math.floor(decimals))
  const round = (n: number) => Math.round(n * f) / f
  return path(
    p.rings.map((ring) =>
      normalizeRing(ring.map((v) => ({ x: round(v.x), y: round(v.y) }))),
    ),
    p.closed,
  )
}

export const morphology = {
  buffer,
  erosionDilation,
  dilationErosion,
  simplify,
  reducePrecision,
}
