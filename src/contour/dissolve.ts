import type { Group, Path, Segment, Vec2 } from '../types/index.js'
import { group, polyline } from '../types/index.js'

function key(v: Vec2, digits = 9): string {
  return `${v.x.toFixed(digits)},${v.y.toFixed(digits)}`
}

function same(a: Vec2, b: Vec2, eps = 1e-9): boolean {
  return Math.abs(a.x - b.x) <= eps && Math.abs(a.y - b.y) <= eps
}

/**
 * Chain connected segments into maximal-length open polylines.
 */
export function dissolveSegments(segments: Segment[]): Group {
  const segs = segments.filter((s) => !same(s.a, s.b))
  if (segs.length === 0) return group([])

  // adjacency: endpoint key -> list of {segIdx, otherKey}
  const adj = new Map<string, { segIdx: number; other: string }[]>()
  const pts = new Map<string, Vec2>()

  const add = (a: Vec2, b: Vec2, segIdx: number) => {
    const ka = key(a)
    const kb = key(b)
    pts.set(ka, a)
    pts.set(kb, b)
    if (!adj.has(ka)) adj.set(ka, [])
    if (!adj.has(kb)) adj.set(kb, [])
    adj.get(ka)!.push({ segIdx, other: kb })
    adj.get(kb)!.push({ segIdx, other: ka })
  }

  for (let i = 0; i < segs.length; i++) {
    add(segs[i]!.a, segs[i]!.b, i)
  }

  const used = new Set<number>()
  const paths: Path[] = []

  const unusedDegree = (k: string) =>
    (adj.get(k) ?? []).filter((e) => !used.has(e.segIdx)).length

  const nextUnused = (k: string) =>
    (adj.get(k) ?? []).find((e) => !used.has(e.segIdx))

  const starts = [...adj.keys()].sort(
    (a, b) => unusedDegree(a) - unusedDegree(b),
  )

  for (const start of starts) {
    let link = nextUnused(start)
    while (link) {
      const chain: Vec2[] = [pts.get(start)!]
      let curr = start
      used.add(link.segIdx)
      let next = link.other
      chain.push(pts.get(next)!)

      while (unusedDegree(next) === 1) {
        const e = nextUnused(next)
        if (!e) break
        used.add(e.segIdx)
        curr = next
        next = e.other
        void curr
        chain.push(pts.get(next)!)
        if (next === start) break
      }

      if (chain.length >= 2) paths.push(polyline(chain))
      link = nextUnused(start)
    }
  }

  for (let i = 0; i < segs.length; i++) {
    if (used.has(i)) continue
    const s = segs[i]!
    paths.push(polyline([s.a, s.b]))
  }

  return group(paths)
}
