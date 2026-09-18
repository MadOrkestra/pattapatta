import type { Group, Path, Vec2 } from '../types/index.js'
import { group, polyline, segment } from '../types/index.js'
import { dissolveSegments } from './dissolve.js'

function key(v: Vec2): string {
  return `${v.x.toFixed(8)},${v.y.toFixed(8)}`
}

/**
 * BFS shortest-path tree on a mesh (GROUP of polygonal faces).
 * `flatten`: unique tree edges as polylines; else one path per target vertex.
 */
export function distanceTree(
  mesh: Group,
  source: Vec2,
  flatten: boolean,
): Group {
  const adj = new Map<string, { to: string; pt: Vec2 }[]>()
  const pts = new Map<string, Vec2>()

  const addEdge = (a: Vec2, b: Vec2) => {
    const ka = key(a)
    const kb = key(b)
    if (ka === kb) return
    pts.set(ka, a)
    pts.set(kb, b)
    if (!adj.has(ka)) adj.set(ka, [])
    if (!adj.has(kb)) adj.set(kb, [])
    adj.get(ka)!.push({ to: kb, pt: b })
    adj.get(kb)!.push({ to: ka, pt: a })
  }

  for (const face of mesh.paths) {
    for (const ring of face.rings) {
      if (ring.length < 2) continue
      const n = ring.length
      const closed = face.closed
      const limit = closed ? n : n - 1
      for (let i = 0; i < limit; i++) {
        addEdge(ring[i]!, ring[(i + 1) % n]!)
      }
    }
  }

  if (pts.size === 0) return group([])

  // Snap source to nearest mesh vertex
  let sourceKey = ''
  let best = Infinity
  for (const [k, p] of pts) {
    const d = Math.hypot(p.x - source.x, p.y - source.y)
    if (d < best) {
      best = d
      sourceKey = k
    }
  }

  // BFS
  const parent = new Map<string, string | null>()
  parent.set(sourceKey, null)
  const q = [sourceKey]
  while (q.length) {
    const u = q.shift()!
    for (const { to } of adj.get(u) ?? []) {
      if (parent.has(to)) continue
      parent.set(to, u)
      q.push(to)
    }
  }

  if (flatten) {
    const segs = []
    const seen = new Set<string>()
    for (const [v, p] of parent) {
      if (p === null) continue
      const ek = v < p ? `${v}|${p}` : `${p}|${v}`
      if (seen.has(ek)) continue
      seen.add(ek)
      segs.push(segment(pts.get(p)!, pts.get(v)!))
    }
    return dissolveSegments(segs)
  }

  const paths: Path[] = []
  for (const [v] of parent) {
    if (v === sourceKey) continue
    const chain: Vec2[] = []
    let cur: string | null = v
    while (cur !== null) {
      chain.push(pts.get(cur)!)
      cur = parent.get(cur) ?? null
    }
    chain.reverse()
    if (chain.length >= 2) paths.push(polyline(chain))
  }
  return group(paths)
}
