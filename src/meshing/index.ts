import type { Group, Path, Segment, Vec2 } from '../types/index.js'
import { group, polygon, segment } from '../types/index.js'
import { centroid, containsPoint, area } from '../predicates/index.js'
import { delaunayTriangulationPoints } from '../triangulation/index.js'

/** Unique undirected edges from a set of polygonal faces. */
export function extractInnerEdges(faces: Path[]): Segment[] {
  const seen = new Map<string, Segment>()
  for (const f of faces) {
    for (const ring of f.rings) {
      const n = ring.length
      for (let i = 0; i < n; i++) {
        const a = ring[i]!
        const b = ring[(i + 1) % n]!
        const key = edgeKey(a, b)
        if (!seen.has(key)) seen.set(key, segment(a, b))
      }
    }
  }
  return [...seen.values()]
}

/** Unique vertices from faces. */
export function extractInnerVertices(faces: Path[]): Vec2[] {
  const seen = new Set<string>()
  const out: Vec2[] = []
  for (const f of faces) {
    for (const ring of f.rings) {
      for (const v of ring) {
        const key = `${v.x},${v.y}`
        if (seen.has(key)) continue
        seen.add(key)
        out.push({ ...v })
      }
    }
  }
  return out
}

/** First face that contains `point`, or null. */
export function findContainingFace(
  faces: Path[],
  point: Vec2,
): Path | null {
  for (const f of faces) {
    if (containsPoint(f, point)) return f
  }
  return null
}

/** Split every face edge longer than `maxLen` by inserting midpoints. */
export function splitEdges(faces: Path[], maxLen: number): Group {
  const lim = Math.max(maxLen, 1e-9)
  const out: Path[] = []
  for (const f of faces) {
    out.push(
      polygon(
        densifyRing(f.rings[0] ?? [], lim),
        f.rings.slice(1).map((r) => densifyRing(r, lim)),
      ),
    )
  }
  return group(out)
}

/**
 * Gabriel graph faces via Delaunay filter: keep triangles whose circumcircle
 * diameter edge set matches Gabriel criterion on all three edges... 
 * Simpler: return Delaunay faces whose circumcircle contains no other site
 * (always true for Delaunay) — Gabriel faces = polygons from Gabriel edges.
 * Here we return triangles from Delaunay where each edge is Gabriel.
 */
export function gabrielFaces(points: Vec2[]): Group {
  const tris = delaunayTriangulationPoints(points)
  const kept: Path[] = []
  for (const t of tris) {
    const r = t.rings[0]
    if (!r || r.length < 3) continue
    const [a, b, c] = r
    if (
      isGabriel(a!, b!, points) &&
      isGabriel(b!, c!, points) &&
      isGabriel(c!, a!, points)
    ) {
      kept.push(t)
    }
  }
  return group(kept)
}

/** Relative-neighborhood faces: Delaunay triangles with all RNG edges. */
export function relativeNeighborFaces(points: Vec2[]): Group {
  const tris = delaunayTriangulationPoints(points)
  const kept: Path[] = []
  for (const t of tris) {
    const r = t.rings[0]
    if (!r || r.length < 3) continue
    const [a, b, c] = r
    if (
      isRelativeNeighbor(a!, b!, points) &&
      isRelativeNeighbor(b!, c!, points) &&
      isRelativeNeighbor(c!, a!, points)
    ) {
      kept.push(t)
    }
  }
  return group(kept)
}

/** Dual faces: connect centroids of triangles that share an edge. */
export function dualFaces(faces: Path[]): Group {
  const edges = new Map<string, number[]>()
  faces.forEach((f, i) => {
    const ring = f.rings[0]
    if (!ring || ring.length < 3) return
    for (let e = 0; e < ring.length; e++) {
      const a = ring[e]!
      const b = ring[(e + 1) % ring.length]!
      const key = edgeKey(a, b)
      const list = edges.get(key) ?? []
      list.push(i)
      edges.set(key, list)
    }
  })
  const centers = faces.map((f) => centroid(f))
  const dualEdges: Segment[] = []
  for (const idxs of edges.values()) {
    if (idxs.length === 2) {
      dualEdges.push(segment(centers[idxs[0]!]!, centers[idxs[1]!]!))
    }
  }
  // Build cycles is hard; return dual as open 2-point “faces” (edge polylines)
  // For plotter use: expose as thin digons / segments wrapped as open paths.
  return group(
    dualEdges.map((e) => ({
      closed: false,
      rings: [[e.a, e.b]],
    })),
  )
}

/** Sort faces by centroid angle around their collective centroid. */
export function radialSortFaces(faces: Path[]): Path[] {
  if (faces.length === 0) return []
  const cs = faces.map((f) => centroid(f))
  const cx = cs.reduce((s, p) => s + p.x, 0) / cs.length
  const cy = cs.reduce((s, p) => s + p.y, 0) / cs.length
  return faces
    .map((f, i) => ({ f, a: Math.atan2(cs[i]!.y - cy, cs[i]!.x - cx) }))
    .sort((a, b) => a.a - b.a)
    .map((x) => x.f)
}

/** Sort faces by centroid x then y. */
export function centroidSortFaces(faces: Path[]): Path[] {
  return [...faces].sort((a, b) => {
    const ca = centroid(a)
    const cb = centroid(b)
    return ca.x === cb.x ? ca.y - cb.y : ca.x - cb.x
  })
}

/** Merge faces whose area is below `minArea` into neighbors by union of rings (hull). */
export function areaMerge(faces: Path[], minArea: number): Group {
  const kept: Path[] = []
  const small: Path[] = []
  for (const f of faces) {
    if (area(f) < minArea) small.push(f)
    else kept.push(f)
  }
  if (small.length === 0) return group(kept)
  // Attach each small face to nearest large by centroid distance (replace with hull of verts)
  for (const s of small) {
    const cs = centroid(s)
    let bestI = 0
    let bestD = Infinity
    if (kept.length === 0) {
      kept.push(s)
      continue
    }
    for (let i = 0; i < kept.length; i++) {
      const d = Math.hypot(
        centroid(kept[i]!).x - cs.x,
        centroid(kept[i]!).y - cs.y,
      )
      if (d < bestD) {
        bestD = d
        bestI = i
      }
    }
    const verts = [
      ...extractInnerVertices([kept[bestI]!]),
      ...extractInnerVertices([s]),
    ]
    kept[bestI] = convexHullOf(verts)
  }
  return group(kept)
}

function convexHullOf(points: Vec2[]): Path {
  // local import-free monotone chain
  const pts = unique(points)
  if (pts.length < 3) return polygon(pts)
  pts.sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x))
  const lower: Vec2[] = []
  for (const p of pts) {
    while (
      lower.length >= 2 &&
      cross(lower[lower.length - 2]!, lower[lower.length - 1]!, p) <= 0
    ) {
      lower.pop()
    }
    lower.push(p)
  }
  const upper: Vec2[] = []
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i]!
    while (
      upper.length >= 2 &&
      cross(upper[upper.length - 2]!, upper[upper.length - 1]!, p) <= 0
    ) {
      upper.pop()
    }
    upper.push(p)
  }
  lower.pop()
  upper.pop()
  return polygon([...lower, ...upper])
}

function isGabriel(a: Vec2, b: Vec2, points: Vec2[]): boolean {
  const mx = (a.x + b.x) / 2
  const my = (a.y + b.y) / 2
  const r = Math.hypot(a.x - b.x, a.y - b.y) / 2
  for (const p of points) {
    if (same(p, a) || same(p, b)) continue
    if (Math.hypot(p.x - mx, p.y - my) < r - 1e-9) return false
  }
  return true
}

function isRelativeNeighbor(a: Vec2, b: Vec2, points: Vec2[]): boolean {
  const dab = Math.hypot(a.x - b.x, a.y - b.y)
  for (const p of points) {
    if (same(p, a) || same(p, b)) continue
    const da = Math.hypot(p.x - a.x, p.y - a.y)
    const db = Math.hypot(p.x - b.x, p.y - b.y)
    if (Math.max(da, db) < dab - 1e-9) return false
  }
  return true
}

function densifyRing(ring: Vec2[], maxLen: number): Vec2[] {
  if (ring.length < 2) return ring.map((v) => ({ ...v }))
  const out: Vec2[] = []
  const n = ring.length
  for (let i = 0; i < n; i++) {
    const a = ring[i]!
    const b = ring[(i + 1) % n]!
    out.push({ ...a })
    const dist = Math.hypot(b.x - a.x, b.y - a.y)
    const steps = Math.floor(dist / maxLen)
    for (let s = 1; s < steps; s++) {
      const t = s / steps
      out.push({
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
      })
    }
  }
  return out
}

function edgeKey(a: Vec2, b: Vec2): string {
  const aKey = `${a.x},${a.y}`
  const bKey = `${b.x},${b.y}`
  return aKey < bKey ? `${aKey}|${bKey}` : `${bKey}|${aKey}`
}

function same(a: Vec2, b: Vec2): boolean {
  return Math.abs(a.x - b.x) < 1e-12 && Math.abs(a.y - b.y) < 1e-12
}

function unique(points: Vec2[]): Vec2[] {
  const seen = new Set<string>()
  const out: Vec2[] = []
  for (const p of points) {
    const k = `${p.x},${p.y}`
    if (seen.has(k)) continue
    seen.add(k)
    out.push({ ...p })
  }
  return out
}

function cross(o: Vec2, a: Vec2, b: Vec2): number {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)
}

export const meshing = {
  extractInnerEdges,
  extractInnerVertices,
  findContainingFace,
  splitEdges,
  gabrielFaces,
  relativeNeighborFaces,
  dualFaces,
  radialSortFaces,
  centroidSortFaces,
  areaMerge,
}
