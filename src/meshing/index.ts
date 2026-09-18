import type { Group, Path, Segment, Vec2 } from '../types/index.js'
import { group, polygon, polyline, segment } from '../types/index.js'
import { centroid, containsPoint, area } from '../predicates/index.js'
import { delaunayTriangulationPoints } from '../triangulation/index.js'
import { union } from '../shapeBoolean/index.js'
import { simplify as simplifyPath } from '../morphology/index.js'

// ---------------------------------------------------------------------------
// Shared mesh primitives
// ---------------------------------------------------------------------------

type EdgeRec = { a: Vec2; b: Vec2; faceIds: number[] }

function edgeKey(a: Vec2, b: Vec2): string {
  const aKey = `${a.x},${a.y}`
  const bKey = `${b.x},${b.y}`
  return aKey < bKey ? `${aKey}|${bKey}` : `${bKey}|${aKey}`
}

function vertKey(v: Vec2): string {
  return `${v.x},${v.y}`
}

function same(a: Vec2, b: Vec2, eps = 1e-12): boolean {
  return Math.abs(a.x - b.x) < eps && Math.abs(a.y - b.y) < eps
}

function dist(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function mid(a: Vec2, b: Vec2): Vec2 {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

function lerp(a: Vec2, b: Vec2, t: number): Vec2 {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
}

function unique(points: Vec2[]): Vec2[] {
  const seen = new Set<string>()
  const out: Vec2[] = []
  for (const p of points) {
    const k = vertKey(p)
    if (seen.has(k)) continue
    seen.add(k)
    out.push({ ...p })
  }
  return out
}

function cross(o: Vec2, a: Vec2, b: Vec2): number {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)
}

function ringOf(face: Path): Vec2[] {
  return face.rings[0] ?? []
}

/** Build undirected edge → incident face indices for exterior rings. */
function buildEdgeMap(faces: Path[]): Map<string, EdgeRec> {
  const edges = new Map<string, EdgeRec>()
  faces.forEach((f, fi) => {
    const ring = ringOf(f)
    if (ring.length < 2) return
    const n = ring.length
    const closed = f.closed !== false && n >= 3
    const lim = closed ? n : n - 1
    for (let i = 0; i < lim; i++) {
      const a = ring[i]!
      const b = ring[(i + 1) % n]!
      const key = edgeKey(a, b)
      const rec = edges.get(key)
      if (rec) rec.faceIds.push(fi)
      else edges.set(key, { a: { ...a }, b: { ...b }, faceIds: [fi] })
    }
  })
  return edges
}

function perimeterKeys(edgeMap: Map<string, EdgeRec>): Set<string> {
  const out = new Set<string>()
  for (const [k, e] of edgeMap) {
    if (e.faceIds.length === 1) out.add(k)
  }
  return out
}

function faceAdjacency(faces: Path[]): number[][] {
  const edgeMap = buildEdgeMap(faces)
  const adj: number[][] = faces.map(() => [])
  for (const e of edgeMap.values()) {
    if (e.faceIds.length === 2) {
      const [i, j] = e.faceIds
      adj[i!]!.push(j!)
      adj[j!]!.push(i!)
    }
  }
  return adj
}

/** Collect unique sites from triangulation faces. */
function sitesFromFaces(faces: Path[]): Vec2[] {
  return unique(faces.flatMap((f) => ringOf(f)))
}

/**
 * Merge triangles that share a removed (non-kept) edge into polygonal faces.
 * Kept edges (and perimeter) form the resulting face boundaries.
 */
function facesFromKeptEdges(
  tris: Path[],
  kept: Set<string>,
): Path[] {
  if (tris.length === 0) return []
  const parent = tris.map((_, i) => i)
  const find = (i: number): number => {
    let x = i
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]!]!
      x = parent[x]!
    }
    return x
  }
  const unite = (a: number, b: number) => {
    const ra = find(a)
    const rb = find(b)
    if (ra !== rb) parent[rb] = ra
  }

  const edgeMap = buildEdgeMap(tris)
  for (const [key, e] of edgeMap) {
    if (e.faceIds.length === 2 && !kept.has(key)) {
      unite(e.faceIds[0]!, e.faceIds[1]!)
    }
  }

  const components = new Map<number, number[]>()
  for (let i = 0; i < tris.length; i++) {
    const r = find(i)
    const list = components.get(r) ?? []
    list.push(i)
    components.set(r, list)
  }

  const out: Path[] = []
  for (const members of components.values()) {
    const ring = boundaryRingOfComponent(tris, members)
    if (ring && ring.length >= 3) out.push(polygon(ring))
  }
  return out
}

/** Exterior ring of a set of triangles (edges appearing once in the set). */
function boundaryRingOfComponent(
  tris: Path[],
  members: number[],
): Vec2[] | null {
  const edgeCount = new Map<string, { a: Vec2; b: Vec2; n: number }>()
  for (const fi of members) {
    const ring = ringOf(tris[fi]!)
    if (ring.length < 3) continue
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i]!
      const b = ring[(i + 1) % ring.length]!
      const key = edgeKey(a, b)
      const rec = edgeCount.get(key)
      if (rec) rec.n++
      else edgeCount.set(key, { a: { ...a }, b: { ...b }, n: 1 })
    }
  }
  const boundary: { a: Vec2; b: Vec2 }[] = []
  for (const e of edgeCount.values()) {
    if (e.n === 1) boundary.push({ a: e.a, b: e.b })
  }
  if (boundary.length < 3) return null
  return orderEdgesIntoRing(boundary)
}

function orderEdgesIntoRing(edges: { a: Vec2; b: Vec2 }[]): Vec2[] | null {
  if (edges.length === 0) return null
  const adj = new Map<string, Vec2[]>()
  const add = (from: Vec2, to: Vec2) => {
    const k = vertKey(from)
    const list = adj.get(k) ?? []
    list.push(to)
    adj.set(k, list)
  }
  for (const e of edges) {
    add(e.a, e.b)
    add(e.b, e.a)
  }

  const start = edges[0]!.a
  const ring: Vec2[] = [{ ...start }]
  let prev = start
  let curr = edges[0]!.b
  const maxSteps = edges.length + 2
  for (let step = 0; step < maxSteps; step++) {
    ring.push({ ...curr })
    if (same(curr, start) && ring.length > 2) {
      ring.pop()
      return ring
    }
    const nbrs = adj.get(vertKey(curr)) ?? []
    let next: Vec2 | null = null
    for (const n of nbrs) {
      if (!same(n, prev)) {
        next = n
        break
      }
    }
    if (!next) break
    prev = curr
    curr = next
  }
  return ring.length >= 3 ? ring : null
}

function applyEdgeFilter(
  tris: Path[],
  shouldKeep: (a: Vec2, b: Vec2, perimeter: boolean) => boolean,
  preservePerimeter: boolean,
): Path[] {
  const edgeMap = buildEdgeMap(tris)
  const peri = perimeterKeys(edgeMap)
  const kept = new Set<string>()
  for (const [key, e] of edgeMap) {
    const isPeri = peri.has(key)
    if (isPeri && preservePerimeter) {
      kept.add(key)
      continue
    }
    if (shouldKeep(e.a, e.b, isPeri)) kept.add(key)
  }
  return facesFromKeptEdges(tris, kept)
}

function asTriFaces(input: Vec2[] | Path[]): Path[] {
  if (input.length === 0) return []
  const first = input[0]!
  if ('rings' in first) return input as Path[]
  return delaunayTriangulationPoints(input as Vec2[])
}

function pointsOf(input: Vec2[] | Path[]): Vec2[] {
  if (input.length === 0) return []
  const first = input[0]!
  if ('rings' in first) return sitesFromFaces(input as Path[])
  return input as Vec2[]
}

// ---------------------------------------------------------------------------
// Extract / query
// ---------------------------------------------------------------------------

/** Edges shared by at least two faces (excludes perimeter and hole boundaries). */
export function extractInnerEdges(faces: Path[]): Segment[] {
  const edgeMap = buildEdgeMap(faces)
  const out: Segment[] = []
  for (const e of edgeMap.values()) {
    if (e.faceIds.length >= 2) out.push(segment(e.a, e.b))
  }
  return out
}

/** Vertices not on the mesh perimeter. */
export function extractInnerVertices(faces: Path[]): Vec2[] {
  const edgeMap = buildEdgeMap(faces)
  const peri = perimeterKeys(edgeMap)
  const periVerts = new Set<string>()
  for (const key of peri) {
    const e = edgeMap.get(key)!
    periVerts.add(vertKey(e.a))
    periVerts.add(vertKey(e.b))
  }
  const out: Vec2[] = []
  const seen = new Set<string>()
  for (const f of faces) {
    for (const v of ringOf(f)) {
      const k = vertKey(v)
      if (periVerts.has(k) || seen.has(k)) continue
      seen.add(k)
      out.push({ ...v })
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

/** Split every face edge longer than `maxLen` by inserting subdivision points. */
export function splitEdges(faces: Path[], maxLen: number): Group {
  const lim = Math.max(maxLen, 1e-9)
  const out: Path[] = []
  for (const f of faces) {
    out.push(
      polygon(
        densifyRing(ringOf(f), lim),
        f.rings.slice(1).map((r) => densifyRing(r, lim)),
      ),
    )
  }
  return group(out)
}

function densifyRing(ring: Vec2[], maxLen: number): Vec2[] {
  if (ring.length < 2) return ring.map((v) => ({ ...v }))
  const out: Vec2[] = []
  const n = ring.length
  for (let i = 0; i < n; i++) {
    const a = ring[i]!
    const b = ring[(i + 1) % n]!
    out.push({ ...a })
    const d = dist(a, b)
    const steps = Math.floor(d / maxLen)
    for (let s = 1; s < steps; s++) out.push(lerp(a, b, s / steps))
  }
  return out
}

// ---------------------------------------------------------------------------
// Graph faces (Urquhart / Gabriel / RNG / Spanner / Dual)
// ---------------------------------------------------------------------------

function isGabriel(a: Vec2, b: Vec2, points: Vec2[]): boolean {
  const m = mid(a, b)
  const r = dist(a, b) / 2
  for (const p of points) {
    if (same(p, a) || same(p, b)) continue
    if (dist(p, m) < r - 1e-9) return false
  }
  return true
}

function isRelativeNeighbor(a: Vec2, b: Vec2, points: Vec2[]): boolean {
  const dab = dist(a, b)
  for (const p of points) {
    if (same(p, a) || same(p, b)) continue
    if (Math.max(dist(p, a), dist(p, b)) < dab - 1e-9) return false
  }
  return true
}

/** Urquhart faces: remove longest edge of each triangle, then polygonize. */
export function urquhartFaces(
  input: Vec2[] | Path[],
  preservePerimeter = false,
): Group {
  const tris = asTriFaces(input)
  const edgeMap = buildEdgeMap(tris)
  const peri = perimeterKeys(edgeMap)
  const removed = new Set<string>()
  for (const t of tris) {
    const r = ringOf(t)
    if (r.length < 3) continue
    let longestKey = ''
    let longestLen = -1
    for (let i = 0; i < 3; i++) {
      const a = r[i]!
      const b = r[(i + 1) % 3]!
      const d = dist(a, b)
      if (d > longestLen) {
        longestLen = d
        longestKey = edgeKey(a, b)
      }
    }
    if (longestKey && !(preservePerimeter && peri.has(longestKey))) {
      removed.add(longestKey)
    }
  }
  const kept = new Set<string>()
  for (const key of edgeMap.keys()) {
    if (!removed.has(key)) kept.add(key)
  }
  return group(facesFromKeptEdges(tris, kept))
}

/** Gabriel graph faces from a point set or triangulation. */
export function gabrielFaces(
  input: Vec2[] | Path[],
  preservePerimeter = false,
): Group {
  const tris = asTriFaces(input)
  const pts = pointsOf(input)
  return group(
    applyEdgeFilter(
      tris,
      (a, b) => isGabriel(a, b, pts),
      preservePerimeter,
    ),
  )
}

/** Relative-neighborhood graph faces. */
export function relativeNeighborFaces(
  input: Vec2[] | Path[],
  preservePerimeter = false,
): Group {
  const tris = asTriFaces(input)
  const pts = pointsOf(input)
  return group(
    applyEdgeFilter(
      tris,
      (a, b) => isRelativeNeighbor(a, b, pts),
      preservePerimeter,
    ),
  )
}

/**
 * Greedy sparse spanner faces. Higher `k` allows longer detours, so more edges
 * are collapsed → larger faces.
 */
export function spannerFaces(
  input: Vec2[] | Path[],
  k = 1,
  preservePerimeter = false,
): Group {
  const tris = asTriFaces(input)
  const edgeMap = buildEdgeMap(tris)
  const peri = perimeterKeys(edgeMap)
  const stretch = Math.max(1, k)
  const edges = [...edgeMap.entries()].map(([key, e]) => ({
    key,
    a: e.a,
    b: e.b,
    len: dist(e.a, e.b),
    peri: peri.has(key),
  }))
  edges.sort((a, b) => a.len - b.len)

  const adj = new Map<string, { to: string; w: number }[]>()
  const link = (a: Vec2, b: Vec2, w: number) => {
    const ka = vertKey(a)
    const kb = vertKey(b)
    if (!adj.has(ka)) adj.set(ka, [])
    if (!adj.has(kb)) adj.set(kb, [])
    adj.get(ka)!.push({ to: kb, w })
    adj.get(kb)!.push({ to: ka, w })
  }
  const shortest = (from: Vec2, to: Vec2): number => {
    const start = vertKey(from)
    const goal = vertKey(to)
    const distMap = new Map<string, number>([[start, 0]])
    const pq: { k: string; d: number }[] = [{ k: start, d: 0 }]
    while (pq.length) {
      pq.sort((x, y) => x.d - y.d)
      const cur = pq.shift()!
      if (cur.k === goal) return cur.d
      if (cur.d > (distMap.get(cur.k) ?? Infinity)) continue
      for (const e of adj.get(cur.k) ?? []) {
        const nd = cur.d + e.w
        if (nd < (distMap.get(e.to) ?? Infinity)) {
          distMap.set(e.to, nd)
          pq.push({ k: e.to, d: nd })
        }
      }
    }
    return Infinity
  }

  const kept = new Set<string>()
  for (const e of edges) {
    if (e.peri && preservePerimeter) {
      kept.add(e.key)
      link(e.a, e.b, e.len)
      continue
    }
    const pathLen = shortest(e.a, e.b)
    if (pathLen > stretch * e.len + 1e-9) {
      kept.add(e.key)
      link(e.a, e.b, e.len)
    } else if (e.peri) {
      // Keep perimeter even when stretch would drop it, so faces stay bounded.
      kept.add(e.key)
      link(e.a, e.b, e.len)
    }
  }
  return group(facesFromKeptEdges(tris, kept))
}

/**
 * Dual faces of a triangulation: closed polygons connecting centroids of
 * triangles around each interior primal vertex.
 */
export function dualFaces(faces: Path[]): Group {
  if (faces.length === 0) return group([])
  const edgeMap = buildEdgeMap(faces)
  const peri = perimeterKeys(edgeMap)
  const periVerts = new Set<string>()
  for (const key of peri) {
    const e = edgeMap.get(key)!
    periVerts.add(vertKey(e.a))
    periVerts.add(vertKey(e.b))
  }

  // vertex → list of (faceIndex, angle of face centroid from vertex)
  const incident = new Map<string, { fi: number; ang: number; v: Vec2 }[]>()
  faces.forEach((f, fi) => {
    const c = centroid(f)
    for (const v of ringOf(f)) {
      const k = vertKey(v)
      if (periVerts.has(k)) continue
      const list = incident.get(k) ?? []
      list.push({ fi, ang: Math.atan2(c.y - v.y, c.x - v.x), v })
      incident.set(k, list)
    }
  })

  const out: Path[] = []
  for (const list of incident.values()) {
    if (list.length < 3) continue
    // Dedupe by face index
    const byFace = new Map<number, (typeof list)[0]>()
    for (const item of list) byFace.set(item.fi, item)
    const uniqueList = [...byFace.values()]
    if (uniqueList.length < 3) continue
    uniqueList.sort((a, b) => a.ang - b.ang)
    const ring = uniqueList.map((item) => centroid(faces[item.fi]!))
    out.push(polygon(ring))
  }
  return group(out)
}

// ---------------------------------------------------------------------------
// Quadrangulations
// ---------------------------------------------------------------------------

function triVerts(t: Path): [Vec2, Vec2, Vec2] | null {
  const r = ringOf(t)
  if (r.length < 3) return null
  return [r[0]!, r[1]!, r[2]!]
}

/** Midpoint cache keyed by edge. */
function midpointMap(faces: Path[]): Map<string, Vec2> {
  const mids = new Map<string, Vec2>()
  const edgeMap = buildEdgeMap(faces)
  for (const [key, e] of edgeMap) {
    mids.set(key, mid(e.a, e.b))
  }
  return mids
}

/**
 * Centroid quadrangulation: one quad per triangulation edge using the
 * centroids of the one or two incident triangles.
 */
export function centroidQuadrangulation(
  input: Vec2[] | Path[],
  preservePerimeter = true,
): Group {
  const tris = asTriFaces(input)
  const edgeMap = buildEdgeMap(tris)
  const centers = tris.map((t) => centroid(t))
  const out: Path[] = []
  const peri = perimeterKeys(edgeMap)

  for (const [key, e] of edgeMap) {
    const ids = e.faceIds
    if (ids.length === 2) {
      const c0 = centers[ids[0]!]!
      const c1 = centers[ids[1]!]!
      out.push(polygon([e.a, c0, e.b, c1]))
    } else if (ids.length === 1 && preservePerimeter) {
      const c0 = centers[ids[0]!]!
      out.push(polygon([e.a, e.b, c0]))
    } else if (ids.length === 1 && !preservePerimeter && peri.has(key)) {
      // drop perimeter-only triangles when not preserving
    }
  }
  return group(out)
}

/**
 * Split (Catmull–Clark) quadrangulation: 3 quads per triangle via edge
 * midpoints and the face centroid.
 */
export function splitQuadrangulation(input: Vec2[] | Path[]): Group {
  const tris = asTriFaces(input)
  const mids = midpointMap(tris)
  const out: Path[] = []
  for (const t of tris) {
    const v = triVerts(t)
    if (!v) continue
    const [a, b, c] = v
    const g = centroid(t)
    const mab = mids.get(edgeKey(a, b)) ?? mid(a, b)
    const mbc = mids.get(edgeKey(b, c)) ?? mid(b, c)
    const mca = mids.get(edgeKey(c, a)) ?? mid(c, a)
    out.push(polygon([a, mab, g, mca]))
    out.push(polygon([b, mbc, g, mab]))
    out.push(polygon([c, mca, g, mbc]))
  }
  return group(out)
}

/**
 * Edge-collapse quadrangulation: greedy pairing of adjacent triangles into quads
 * (edge-coloring style collapse of shared edges).
 */
export function edgeCollapseQuadrangulation(
  input: Vec2[] | Path[],
  preservePerimeter = true,
): Group {
  const tris = asTriFaces(input)
  const edgeMap = buildEdgeMap(tris)
  const candidates: { key: string; a: Vec2; b: Vec2; i: number; j: number; q: number }[] =
    []
  for (const [key, e] of edgeMap) {
    if (e.faceIds.length !== 2) continue
    const [i, j] = e.faceIds
    const quad = mergeTriPair(tris[i!]!, tris[j!]!, e.a, e.b)
    if (!quad) continue
    candidates.push({
      key,
      a: e.a,
      b: e.b,
      i: i!,
      j: j!,
      q: quadQuality(quad),
    })
  }
  candidates.sort((x, y) => y.q - x.q)

  const used = new Set<number>()
  const out: Path[] = []
  for (const c of candidates) {
    if (used.has(c.i) || used.has(c.j)) continue
    const quad = mergeTriPair(tris[c.i]!, tris[c.j]!, c.a, c.b)
    if (!quad) continue
    out.push(quad)
    used.add(c.i)
    used.add(c.j)
  }
  for (let i = 0; i < tris.length; i++) {
    if (used.has(i)) continue
    if (preservePerimeter) out.push(tris[i]!)
  }
  return group(out)
}

/**
 * Matching quadrangulation: quality-weighted greedy matching of triangles
 * (Blossom-Quad first step; leftover triangles retained).
 */
export function matchingQuadrangulation(input: Vec2[] | Path[]): Group {
  return edgeCollapseQuadrangulation(input, true)
}

function mergeTriPair(
  t0: Path,
  t1: Path,
  ea: Vec2,
  eb: Vec2,
): Path | null {
  const opp0 = oppositeVertex(t0, ea, eb)
  const opp1 = oppositeVertex(t1, ea, eb)
  if (!opp0 || !opp1) return null
  // Order: opp0 → ea → opp1 → eb (convex quad when possible)
  return polygon([opp0, ea, opp1, eb])
}

function oppositeVertex(t: Path, ea: Vec2, eb: Vec2): Vec2 | null {
  for (const v of ringOf(t)) {
    if (!same(v, ea) && !same(v, eb)) return v
  }
  return null
}

function quadQuality(q: Path): number {
  const r = ringOf(q)
  if (r.length < 4) return 0
  // Prefer near-square: maximize min edge / max edge and prefer angles near 90°.
  const lens: number[] = []
  for (let i = 0; i < 4; i++) {
    lens.push(dist(r[i]!, r[(i + 1) % 4]!))
  }
  const minL = Math.min(...lens)
  const maxL = Math.max(...lens)
  if (maxL < 1e-12) return 0
  return minL / maxL
}

/**
 * Spiral quadrangulation from a point set (characteristic spiral pattern).
 */
export function spiralQuadrangulation(points: Vec2[]): Group {
  if (points.length < 4) return group([])
  const pts = unique(points)
  const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length
  const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length

  // Sort by angle, then assign to radial rings by distance rank.
  const withMeta = pts.map((p) => ({
    p,
    ang: Math.atan2(p.y - cy, p.x - cx),
    rad: Math.hypot(p.x - cx, p.y - cy),
  }))
  withMeta.sort((a, b) => a.rad - b.rad || a.ang - b.ang)

  const ringCount = Math.max(2, Math.ceil(Math.sqrt(pts.length)))
  const rings: Vec2[][] = Array.from({ length: ringCount }, () => [])
  withMeta.forEach((item, i) => {
    const ri = Math.min(
      ringCount - 1,
      Math.floor((i / withMeta.length) * ringCount),
    )
    rings[ri]!.push(item.p)
  })
  for (const ring of rings) {
    ring.sort(
      (a, b) =>
        Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx),
    )
  }

  const out: Path[] = []
  for (let r = 0; r < rings.length - 1; r++) {
    const inner = rings[r]!
    const outer = rings[r + 1]!
    if (inner.length === 0 || outer.length === 0) continue
    const n = Math.max(inner.length, outer.length)
    for (let i = 0; i < n; i++) {
      const a = inner[i % inner.length]!
      const b = inner[(i + 1) % inner.length]!
      const c = outer[(i + 1) % outer.length]!
      const d = outer[i % outer.length]!
      // Skip degenerate
      const verts = unique([a, b, c, d])
      if (verts.length >= 3) out.push(polygon(verts.length === 3 ? verts : [a, b, c, d]))
    }
  }
  return group(out)
}

// ---------------------------------------------------------------------------
// Mesh process
// ---------------------------------------------------------------------------

function vertexNeighborhood(faces: Path[]): {
  positions: Map<string, Vec2>
  neighbors: Map<string, Set<string>>
  perimeter: Set<string>
} {
  const edgeMap = buildEdgeMap(faces)
  const peri = perimeterKeys(edgeMap)
  const perimeter = new Set<string>()
  for (const key of peri) {
    const e = edgeMap.get(key)!
    perimeter.add(vertKey(e.a))
    perimeter.add(vertKey(e.b))
  }
  const positions = new Map<string, Vec2>()
  const neighbors = new Map<string, Set<string>>()
  const link = (a: Vec2, b: Vec2) => {
    const ka = vertKey(a)
    const kb = vertKey(b)
    positions.set(ka, { ...a })
    positions.set(kb, { ...b })
    if (!neighbors.has(ka)) neighbors.set(ka, new Set())
    if (!neighbors.has(kb)) neighbors.set(kb, new Set())
    neighbors.get(ka)!.add(kb)
    neighbors.get(kb)!.add(ka)
  }
  for (const e of edgeMap.values()) link(e.a, e.b)
  return { positions, neighbors, perimeter }
}

function remapFaces(
  faces: Path[],
  positions: Map<string, Vec2>,
): Path[] {
  return faces.map((f) =>
    polygon(
      ringOf(f).map((v) => {
        const p = positions.get(vertKey(v))
        return p ? { ...p } : { ...v }
      }),
      f.rings.slice(1).map((r) =>
        r.map((v) => {
          const p = positions.get(vertKey(v))
          return p ? { ...p } : { ...v }
        }),
      ),
    ),
  )
}

/** Weighted Laplacian mesh smoothing. */
export function smoothMesh(
  faces: Path[],
  iterationsOrCutoff: number,
  preservePerimeter = true,
): Group {
  if (faces.length === 0) return group([])
  let { positions, neighbors, perimeter } = vertexNeighborhood(faces)
  const maxIter =
    iterationsOrCutoff >= 1 && Number.isInteger(iterationsOrCutoff)
      ? iterationsOrCutoff
      : 200
  const cutoff =
    iterationsOrCutoff > 0 && iterationsOrCutoff < 1
      ? iterationsOrCutoff
      : 0

  for (let iter = 0; iter < maxIter; iter++) {
    const next = new Map<string, Vec2>()
    let maxDisp = 0
    for (const [k, p] of positions) {
      if (preservePerimeter && perimeter.has(k)) {
        next.set(k, p)
        continue
      }
      const nbrs = neighbors.get(k)
      if (!nbrs || nbrs.size === 0) {
        next.set(k, p)
        continue
      }
      let sx = 0
      let sy = 0
      for (const nk of nbrs) {
        const n = positions.get(nk)!
        sx += n.x
        sy += n.y
      }
      const np = { x: sx / nbrs.size, y: sy / nbrs.size }
      maxDisp = Math.max(maxDisp, dist(p, np))
      next.set(k, np)
    }
    positions = next
    if (cutoff > 0 && maxDisp < cutoff) break
  }
  return group(remapFaces(faces, positions))
}

/**
 * Catmull–Clark-style subdivision: split each edge at `edgeSplitRatio` and
 * connect to the face centroid (N subfaces per N-gon).
 */
export function subdivideMesh(
  faces: Path[],
  edgeSplitRatio = 0.5,
): Group {
  const t = Math.min(1, Math.max(0, edgeSplitRatio))
  const out: Path[] = []
  for (const f of faces) {
    const ring = ringOf(f)
    if (ring.length < 3) continue
    const c = centroid(f)
    const n = ring.length
    const splits: Vec2[] = []
    for (let i = 0; i < n; i++) {
      const a = ring[i]!
      const b = ring[(i + 1) % n]!
      splits.push(lerp(a, b, t))
    }
    for (let i = 0; i < n; i++) {
      const v = ring[i]!
      const sPrev = splits[(i - 1 + n) % n]!
      const sNext = splits[i]!
      out.push(polygon([v, sNext, c, sPrev]))
    }
  }
  return group(out)
}

/**
 * Simplify face boundaries while preserving mesh topology (shared edges
 * simplified once, then faces rebuilt).
 */
export function simplifyMesh(
  faces: Path[],
  tolerance: number,
  preservePerimeter = true,
): Group {
  if (tolerance <= 0 || faces.length === 0) return group(faces.map((f) => polygon(ringOf(f), f.rings.slice(1))))
  const edgeMap = buildEdgeMap(faces)
  const peri = perimeterKeys(edgeMap)

  // Simplify each unique edge as a 2-point segment is a no-op; for faces with
  // more than 3 verts, simplify the full ring then re-snap shared vertices.
  const simplified = faces.map((f) => {
    const ring = ringOf(f)
    if (ring.length <= 3) return polygon(ring)
    if (preservePerimeter) {
      // Only simplify interior-only vertices: use path simplify then restore peri verts.
      const s = simplifyPath(f, tolerance)
      const sr = ringOf(s)
      if (sr.length < 3) return polygon(ring)
      return polygon(sr, s.rings.slice(1))
    }
    return simplifyPath(f, tolerance)
  })

  // Snap nearly-coincident vertices across faces for topology
  const all = unique(simplified.flatMap((f) => ringOf(f)))
  const snapped = clusterSnap(all, Math.max(tolerance * 0.5, 1e-9))
  const remap = (v: Vec2): Vec2 => {
    let best = v
    let bestD = Infinity
    for (const s of snapped) {
      const d = dist(v, s)
      if (d < bestD) {
        bestD = d
        best = s
      }
    }
    return { ...best }
  }
  // Preserve perimeter vertices exactly when requested
  const periVerts = new Set<string>()
  if (preservePerimeter) {
    for (const key of peri) {
      const e = edgeMap.get(key)!
      periVerts.add(vertKey(e.a))
      periVerts.add(vertKey(e.b))
    }
  }

  return group(
    simplified.map((f, i) => {
      const original = ringOf(faces[i]!)
      const ring = ringOf(f).map((v, vi) => {
        if (preservePerimeter && original[vi] && periVerts.has(vertKey(original[vi]!))) {
          return { ...original[vi]! }
        }
        // also check if v matches a peri vert
        for (const ov of original) {
          if (periVerts.has(vertKey(ov)) && dist(v, ov) < tolerance * 2) {
            return { ...ov }
          }
        }
        return remap(v)
      })
      return polygon(unique(ring).length >= 3 ? ring : original)
    }),
  )
}

function clusterSnap(points: Vec2[], tol: number): Vec2[] {
  const clusters: Vec2[][] = []
  for (const p of points) {
    let found = false
    for (const c of clusters) {
      if (dist(p, c[0]!) <= tol) {
        c.push(p)
        found = true
        break
      }
    }
    if (!found) clusters.push([p])
  }
  return clusters.map((c) => ({
    x: c.reduce((s, p) => s + p.x, 0) / c.length,
    y: c.reduce((s, p) => s + p.y, 0) / c.length,
  }))
}

/** Randomly dissolve adjacent faces that share a class id. */
export function stochasticMerge(
  faces: Path[],
  nClasses: number,
  seed = 1,
): Group {
  if (faces.length === 0) return group([])
  const classes = Math.max(1, Math.floor(nClasses))
  const rng = mulberry32(seed >>> 0)
  const label = faces.map(() => Math.floor(rng() * classes))
  const adj = faceAdjacency(faces)
  const parent = faces.map((_, i) => i)
  const find = (i: number): number => {
    let x = i
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]!]!
      x = parent[x]!
    }
    return x
  }
  const unite = (a: number, b: number) => {
    const ra = find(a)
    const rb = find(b)
    if (ra !== rb) parent[rb] = ra
  }
  for (let i = 0; i < faces.length; i++) {
    for (const j of adj[i]!) {
      if (j > i && label[i] === label[j]) unite(i, j)
    }
  }
  const comps = new Map<number, number[]>()
  for (let i = 0; i < faces.length; i++) {
    const r = find(i)
    const list = comps.get(r) ?? []
    list.push(i)
    comps.set(r, list)
  }
  const out: Path[] = []
  for (const members of comps.values()) {
    if (members.length === 1) {
      out.push(faces[members[0]!]!)
      continue
    }
    const merged = dissolveFaces(members.map((i) => faces[i]!))
    out.push(...merged)
  }
  return group(out)
}

function dissolveFaces(faces: Path[]): Path[] {
  if (faces.length === 0) return []
  if (faces.length === 1) return [faces[0]!]
  try {
    let acc = faces[0]!
    for (let i = 1; i < faces.length; i++) {
      const u = union(acc, faces[i]!)
      if (u.paths.length === 0) continue
      // Prefer largest piece if union fragments
      acc = u.paths.reduce((best, p) =>
        area(p) > area(best) ? p : best,
      )
    }
    return [acc]
  } catch {
    // Fallback: convex hull of vertices
    return [convexHullOf(faces.flatMap((f) => ringOf(f)))]
  }
}

/**
 * Merge faces below `minArea` into adjacent neighbors, or merge until at most
 * `remainingFaces` remain when options use `{ remainingFaces }`.
 */
export function areaMerge(
  faces: Path[],
  minAreaOrOptions: number | { minArea?: number; remainingFaces?: number },
): Group {
  let working = [...faces]
  if (working.length === 0) return group([])

  if (typeof minAreaOrOptions === 'object' && minAreaOrOptions.remainingFaces != null) {
    const target = Math.max(1, Math.floor(minAreaOrOptions.remainingFaces))
    while (working.length > target) {
      const next = mergeSmallestAdjacent(working)
      if (next.length >= working.length) break
      working = next
    }
    return group(working)
  }

  const minArea =
    typeof minAreaOrOptions === 'number'
      ? minAreaOrOptions
      : (minAreaOrOptions.minArea ?? 0)

  let guard = 0
  while (guard++ < working.length + 10) {
    const smallIdx = working.findIndex((f) => area(f) < minArea)
    if (smallIdx < 0) break
    const next = mergeFaceIntoNeighbor(working, smallIdx)
    if (!next) break
    working = next
  }
  return group(working)
}

function mergeSmallestAdjacent(faces: Path[]): Path[] {
  let best = -1
  let bestA = Infinity
  for (let i = 0; i < faces.length; i++) {
    const a = area(faces[i]!)
    if (a < bestA) {
      bestA = a
      best = i
    }
  }
  if (best < 0) return faces
  return mergeFaceIntoNeighbor(faces, best) ?? faces
}

function mergeFaceIntoNeighbor(
  faces: Path[],
  idx: number,
): Path[] | null {
  const adj = faceAdjacency(faces)
  const nbrs = adj[idx] ?? []
  if (nbrs.length === 0) {
    // No adjacency — drop tiny island or keep
    return faces.filter((_, i) => i !== idx)
  }
  // Prefer largest neighbor
  let bestN = nbrs[0]!
  let bestA = -1
  for (const n of nbrs) {
    const a = area(faces[n]!)
    if (a > bestA) {
      bestA = a
      bestN = n
    }
  }
  const merged = dissolveFaces([faces[idx]!, faces[bestN]!])
  const out: Path[] = []
  for (let i = 0; i < faces.length; i++) {
    if (i === idx || i === bestN) continue
    out.push(faces[i]!)
  }
  out.push(...merged)
  return out
}

function convexHullOf(points: Vec2[]): Path {
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

function mulberry32(a: number): () => number {
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ---------------------------------------------------------------------------
// Repair
// ---------------------------------------------------------------------------

/**
 * Locate near-miss gaps between faces that should form a valid mesh
 * (boundary segments without a matching twin within a tiny tolerance).
 */
export function findBreaks(faces: Path[]): Group {
  const edgeMap = buildEdgeMap(faces)
  const segs: Path[] = []
  // Soft-match: perimeter edges that have a near-parallel nearby perimeter edge
  const peri: EdgeRec[] = []
  for (const e of edgeMap.values()) {
    if (e.faceIds.length === 1) peri.push(e)
  }
  const used = new Set<number>()
  for (let i = 0; i < peri.length; i++) {
    if (used.has(i)) continue
    const a = peri[i]!
    for (let j = i + 1; j < peri.length; j++) {
      if (used.has(j)) continue
      const b = peri[j]!
      if (nearDuplicateEdge(a, b, 1e-3)) {
        segs.push(polyline([a.a, a.b]))
        segs.push(polyline([b.a, b.b]))
        used.add(i)
        used.add(j)
        break
      }
    }
  }
  return group(segs)
}

function nearDuplicateEdge(a: EdgeRec, b: EdgeRec, tol: number): boolean {
  const d1 = dist(a.a, b.a) + dist(a.b, b.b)
  const d2 = dist(a.a, b.b) + dist(a.b, b.a)
  const len = dist(a.a, a.b)
  return Math.min(d1, d2) < tol * 2 + len * 0.05 && Math.min(d1, d2) > 1e-9
}

/**
 * Clean inter-face gaps/overlaps/slivers toward a valid coverage by snapping
 * vertices within `maxGapWidth` and dissolving overlaps.
 */
export function fixBreaks(faces: Path[], maxGapWidth: number): Group {
  if (faces.length === 0) return group([])
  const tol = Math.max(maxGapWidth, 1e-9)
  const verts = unique(faces.flatMap((f) => ringOf(f)))
  const snapped = clusterSnap(verts, tol)
  const remap = (v: Vec2): Vec2 => {
    let best = snapped[0]!
    let bestD = Infinity
    for (const s of snapped) {
      const d = dist(v, s)
      if (d < bestD) {
        bestD = d
        best = s
      }
    }
    return { ...best }
  }
  const fixed = faces.map((f) => {
    const ring = unique(ringOf(f).map(remap))
    return ring.length >= 3 ? polygon(ring) : f
  })
  // Dissolve overlaps via pairwise union of intersecting faces
  try {
    return group(dissolveOverlaps(fixed))
  } catch {
    return group(fixed)
  }
}

function dissolveOverlaps(faces: Path[]): Path[] {
  // Simple O(n²): if two faces overlap significantly, union them
  let working = [...faces]
  let changed = true
  let guard = 0
  while (changed && guard++ < working.length) {
    changed = false
    outer: for (let i = 0; i < working.length; i++) {
      for (let j = i + 1; j < working.length; j++) {
        const a = working[i]!
        const b = working[j]!
        const u = union(a, b)
        const ua = u.paths.reduce((s, p) => s + area(p), 0)
        if (ua < area(a) + area(b) - 1e-6) {
          // overlap — replace with union pieces
          const next = working.filter((_, k) => k !== i && k !== j)
          next.push(...u.paths)
          working = next
          changed = true
          break outer
        }
      }
    }
  }
  return working
}

/**
 * Endpoint-only snap within `tolerance`, then optionally polygonize linework
 * into faces.
 */
export function fixBrokenFaces(
  coverage: Path[],
  tolerance: number,
  polygonise = true,
): Group {
  const tol = Math.max(tolerance, 1e-9)
  // Collect endpoints of open paths + all polygon verts as anchors
  const anchors: Vec2[] = []
  const endpoints: { pathIdx: number; end: 0 | 1; v: Vec2 }[] = []

  coverage.forEach((p, pi) => {
    const ring = ringOf(p)
    if (ring.length === 0) return
    if (p.closed) {
      for (const v of ring) anchors.push(v)
    } else {
      endpoints.push({ pathIdx: pi, end: 0, v: ring[0]! })
      endpoints.push({
        pathIdx: pi,
        end: 1,
        v: ring[ring.length - 1]!,
      })
    }
  })

  const snapTargets = clusterSnap(
    [...anchors, ...endpoints.map((e) => e.v)],
    tol,
  )

  const snapTo = (v: Vec2, preferAnchor: boolean): Vec2 => {
    // Prefer anchors if in cluster
    let best = v
    let bestD = Infinity
    for (const s of snapTargets) {
      const d = dist(v, s)
      if (d <= tol && d < bestD) {
        bestD = d
        best = s
      }
    }
    if (preferAnchor) {
      for (const a of anchors) {
        if (dist(v, a) <= tol) return { ...a }
      }
    }
    return { ...best }
  }

  const snappedPaths = coverage.map((p) => {
    const ring = ringOf(p)
    if (ring.length === 0) return p
    if (p.closed) return p
    const next = ring.map((v) => ({ ...v }))
    next[0] = snapTo(ring[0]!, true)
    next[next.length - 1] = snapTo(ring[ring.length - 1]!, true)
    return polyline(next)
  })

  if (!polygonise) return group(snappedPaths)

  // Closed rings stay; try to close open paths whose ends meet
  const out: Path[] = []
  for (const p of snappedPaths) {
    const ring = ringOf(p)
    if (p.closed) {
      out.push(p)
      continue
    }
    if (ring.length >= 3 && same(ring[0]!, ring[ring.length - 1]!, tol * 2)) {
      out.push(polygon(ring.slice(0, -1)))
    } else if (ring.length >= 3 && dist(ring[0]!, ring[ring.length - 1]!) <= tol * 2) {
      out.push(polygon(ring))
    } else {
      out.push(p)
    }
  }
  return group(out)
}

/** Disconnected face islands sorted by face count descending. */
export function findIslands(faces: Path[]): Group[] {
  if (faces.length === 0) return []
  const adj = faceAdjacency(faces)
  const seen = new Set<number>()
  const islands: number[][] = []
  for (let i = 0; i < faces.length; i++) {
    if (seen.has(i)) continue
    const stack = [i]
    const members: number[] = []
    seen.add(i)
    while (stack.length) {
      const cur = stack.pop()!
      members.push(cur)
      for (const n of adj[cur]!) {
        if (!seen.has(n)) {
          seen.add(n)
          stack.push(n)
        }
      }
    }
    islands.push(members)
  }
  islands.sort((a, b) => b.length - a.length)
  return islands.map((m) => group(m.map((i) => faces[i]!)))
}

// ---------------------------------------------------------------------------
// Sort helpers
// ---------------------------------------------------------------------------

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

export const meshing = {
  extractInnerEdges,
  extractInnerVertices,
  findContainingFace,
  splitEdges,
  urquhartFaces,
  gabrielFaces,
  relativeNeighborFaces,
  spannerFaces,
  dualFaces,
  centroidQuadrangulation,
  edgeCollapseQuadrangulation,
  splitQuadrangulation,
  spiralQuadrangulation,
  matchingQuadrangulation,
  smoothMesh,
  subdivideMesh,
  simplifyMesh,
  stochasticMerge,
  areaMerge,
  radialSortFaces,
  centroidSortFaces,
  findBreaks,
  fixBreaks,
  fixBrokenFaces,
  findIslands,
}
