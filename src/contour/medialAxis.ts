import { Delaunay } from 'd3-delaunay'
import type { Group, Path, Vec2 } from '../types/index.js'
import { polyline, segment } from '../types/index.js'
import { containsPoint, bounds } from '../predicates/index.js'
import { maximumInscribedCircle } from '../optimisation/index.js'
import { densify } from '../processing/index.js'
import { dissolveSegments } from './dissolve.js'
import { sampleBoundary } from './boundaryDistance.js'

export type MedialNode = {
  id: number
  position: Vec2
  radius: number
  parent: number | null
  children: number[]
  /** Path distance from root along the axis. */
  rootDist: number
  /** Aggregate descendant feature area (π r² style contribution). */
  featureArea: number
}

export type MedialEdge = {
  head: number
  tail: number
  axial: number
  length: number
}

export type MedialAxisGraph = {
  nodes: MedialNode[]
  edges: MedialEdge[]
  root: number
}

/**
 * Approximate medial axis via Voronoi edges of densified boundary samples.
 * Returns pruned dissolved polylines.
 *
 * Thresholds in [0,1]: 0 = no pruning, 1 = maximum pruning.
 */
export function medialAxis(
  shape: Path,
  axialThreshold = 0,
  distanceThreshold = 0,
  areaThreshold = 0,
): Group {
  const g = buildMedialAxisGraph(shape)
  if (!g) return dissolveSegments([])
  const kept = pruneEdges(g, axialThreshold, distanceThreshold, areaThreshold)
  const segs = kept.map((e) => {
    const a = g.nodes[e.head]!.position
    const b = g.nodes[e.tail]!.position
    return segment(a, b)
  })
  return dissolveSegments(segs)
}

export function buildMedialAxisGraph(shape: Path): MedialAxisGraph | null {
  if (!shape.closed || shape.rings.length === 0) return null

  const b = bounds(shape)
  const span = Math.max(b.maxX - b.minX, b.maxY - b.minY, 1)
  const densified = densify(shape, Math.max(span / 60, 1e-3))
  const samples = sampleBoundary(densified, Math.max(span / 80, 1e-3))
  if (samples.length < 3) return null

  // Deduplicate sites
  const uniq: Vec2[] = []
  const seen = new Set<string>()
  for (const p of samples) {
    const k = `${p.x.toFixed(6)},${p.y.toFixed(6)}`
    if (seen.has(k)) continue
    seen.add(k)
    uniq.push(p)
  }
  if (uniq.length < 3) return null

  const delaunay = Delaunay.from(
    uniq,
    (d) => d.x,
    (d) => d.y,
  )
  const pad = span * 0.5
  const voronoi = delaunay.voronoi([
    b.minX - pad,
    b.minY - pad,
    b.maxX + pad,
    b.maxY + pad,
  ])

  // Collect unique interior Voronoi edges
  type RawEdge = { a: Vec2; b: Vec2; radius: number }
  const raw: RawEdge[] = []
  const edgeSeen = new Set<string>()

  for (let i = 0; i < uniq.length; i++) {
    const poly = voronoi.cellPolygon(i)
    if (!poly || poly.length < 2) continue
    for (let j = 0; j < poly.length - 1; j++) {
      const p0 = poly[j]!
      const p1 = poly[j + 1]!
      const a = { x: p0[0], y: p0[1] }
      const bb = { x: p1[0], y: p1[1] }
      if (!containsPoint(shape, a) || !containsPoint(shape, bb)) continue
      const ek = edgeKey(a, bb)
      if (edgeSeen.has(ek)) continue
      edgeSeen.add(ek)
      const mid = { x: (a.x + bb.x) / 2, y: (a.y + bb.y) / 2 }
      const site = uniq[i]!
      const radius = Math.hypot(mid.x - site.x, mid.y - site.y)
      raw.push({ a, b: bb, radius })
    }
  }

  if (raw.length === 0) return null

  // Build node list
  const nodeIndex = new Map<string, number>()
  const nodes: MedialNode[] = []
  const ensure = (p: Vec2, radius: number): number => {
    const k = key(p)
    let id = nodeIndex.get(k)
    if (id !== undefined) {
      nodes[id]!.radius = Math.max(nodes[id]!.radius, radius)
      return id
    }
    id = nodes.length
    nodeIndex.set(k, id)
    nodes.push({
      id,
      position: p,
      radius,
      parent: null,
      children: [],
      rootDist: 0,
      featureArea: Math.PI * radius * radius,
    })
    return id
  }

  const undirected: { u: number; v: number; axial: number; length: number }[] =
    []
  for (const e of raw) {
    const midR = e.radius
    const u = ensure(e.a, midR)
    const v = ensure(e.b, midR)
    if (u === v) continue
    const length = Math.hypot(
      nodes[u]!.position.x - nodes[v]!.position.x,
      nodes[u]!.position.y - nodes[v]!.position.y,
    )
    const axial =
      length > 1e-12
        ? Math.abs(nodes[u]!.radius - nodes[v]!.radius) / length
        : 0
    undirected.push({ u, v, axial, length })
  }

  // Root near MIC center
  const mic = maximumInscribedCircle(shape, Math.max(span * 0.01, 0.1))
  const rootPos = mic
    ? { x: mic.x, y: mic.y }
    : {
        x: (b.minX + b.maxX) / 2,
        y: (b.minY + b.maxY) / 2,
      }
  let root = 0
  let bestD = Infinity
  for (const n of nodes) {
    const d = Math.hypot(n.position.x - rootPos.x, n.position.y - rootPos.y)
    if (d < bestD) {
      bestD = d
      root = n.id
    }
  }

  // BFS tree from root
  const adj = new Map<number, { to: number; axial: number; length: number }[]>()
  for (const e of undirected) {
    if (!adj.has(e.u)) adj.set(e.u, [])
    if (!adj.has(e.v)) adj.set(e.v, [])
    adj.get(e.u)!.push({ to: e.v, axial: e.axial, length: e.length })
    adj.get(e.v)!.push({ to: e.u, axial: e.axial, length: e.length })
  }

  const edges: MedialEdge[] = []
  const visited = new Set<number>([root])
  const queue = [root]
  nodes[root]!.rootDist = 0

  while (queue.length) {
    const u = queue.shift()!
    for (const link of adj.get(u) ?? []) {
      if (visited.has(link.to)) continue
      visited.add(link.to)
      nodes[link.to]!.parent = u
      nodes[u]!.children.push(link.to)
      nodes[link.to]!.rootDist = nodes[u]!.rootDist + link.length
      edges.push({
        head: u,
        tail: link.to,
        axial: link.axial,
        length: link.length,
      })
      queue.push(link.to)
    }
  }

  // Aggregate feature area bottom-up
  const post: number[] = []
  const stack = [root]
  const seenN = new Set<number>()
  while (stack.length) {
    const u = stack.pop()!
    if (seenN.has(u)) {
      post.push(u)
      continue
    }
    seenN.add(u)
    stack.push(u)
    for (const c of nodes[u]!.children) stack.push(c)
  }
  for (const u of post) {
    let area = nodes[u]!.featureArea
    for (const c of nodes[u]!.children) area += nodes[c]!.featureArea
    nodes[u]!.featureArea = area
  }

  return { nodes, edges, root }
}

function pruneEdges(
  g: MedialAxisGraph,
  axialT: number,
  distT: number,
  areaT: number,
): MedialEdge[] {
  const maxDist = Math.max(...g.nodes.map((n) => n.rootDist), 1e-9)
  const maxArea = Math.max(...g.nodes.map((n) => n.featureArea), 1e-9)
  const maxAxial = Math.max(...g.edges.map((e) => e.axial), 1e-9)

  const aT = clamp01(axialT)
  const dT = clamp01(distT)
  const arT = clamp01(areaT)

  return g.edges.filter((e) => {
    const tail = g.nodes[e.tail]!
    // Keep edge unless pruning criteria reject the feature tip
    if (aT > 0 && e.axial / maxAxial < aT * 0.15 && aT > 0.05) {
      // high axial threshold prunes low-gradient (noisy tip) edges near leaves
      if (tail.children.length === 0 && e.axial / maxAxial < aT) return false
    }
    if (dT > 0) {
      const nd = tail.rootDist / maxDist
      // prune tips beyond (1 - dT) of max distance? PGS: higher threshold = more pruning of far features
      // Interpret: prune leaf edges whose normalized root distance is below dT (short stubs) when dT high...
      // From PGS javadoc: pruning based on spatial distance from root to tail — higher = more pruning
      // So we prune edges where the feature is "small" in distance sense — typically leaf branches
      // with small contribution. Use: prune if feature depth from max is shallow relative to threshold.
      if (tail.children.length === 0 && nd > 1 - dT && dT > 0) {
        // actually prune peripheral: when dT high, remove edges with high rootDist (far tips)
        // Wait - "distance from root to tail" pruning typically removes short branches near tips
        // JMedialAxis style: prune if feature's path distance metric is below threshold
        // We'll prune leaf edges if their length-normalized importance is low:
      }
      if (tail.children.length === 0 && (1 - nd) < dT * 0.5 && dT >= 0.5) {
        return false
      }
      // More aggressive: prune any leaf whose rootDist fraction exceeds (1-dT) when... 
      // Simpler approach matching "more threshold = more prune":
      if (tail.children.length === 0 && nd * dT > 0.85) return false
    }
    if (arT > 0) {
      const na = tail.featureArea / maxArea
      // prune small-area features
      if (na < arT) return false
    }
    // axial: prune high axial-gradient tips (serrations)
    if (aT > 0 && e.axial / maxAxial > 1 - aT * 0.5 && tail.children.length === 0) {
      return false
    }
    return true
  })
}

/**
 * Longest center line through the medial axis, smoothed.
 */
export function centerLine(
  shape: Path,
  straightnessWeighting = 0.7,
  smoothing = 50,
): Path {
  const g = buildMedialAxisGraph(shape)
  if (!g || g.nodes.length < 2) {
    return polyline([])
  }

  const root = g.nodes[g.root]!
  const childRoots = root.children
  const leavesOf = (start: number): MedialNode[] => {
    const out: MedialNode[] = []
    const stack = [start]
    while (stack.length) {
      const u = stack.pop()!
      const n = g.nodes[u]!
      if (n.children.length === 0) out.push(n)
      else stack.push(...n.children)
    }
    return out
  }

  let bestPath: number[] = []

  if (childRoots.length <= 1) {
    // Degenerate: take diameter of the tree
    bestPath = longestPathNodes(g)
  } else if (childRoots.length === 2) {
    bestPath = pathBetweenLeaves(
      g,
      leavesOf(childRoots[0]!),
      leavesOf(childRoots[1]!),
      root,
      straightnessWeighting,
    )
  } else {
    const groups = childRoots.map(leavesOf)
    let bestW = -Infinity
    for (let i = 0; i < groups.length; i++) {
      for (let j = i + 1; j < groups.length; j++) {
        const { path: p, weight } = bestLeafPair(
          g,
          groups[i]!,
          groups[j]!,
          root,
          straightnessWeighting,
        )
        if (weight > bestW) {
          bestW = weight
          bestPath = p
        }
      }
    }
  }

  if (bestPath.length < 2) bestPath = longestPathNodes(g)
  const pts = bestPath.map((id) => g.nodes[id]!.position)
  return polyline(gaussianSmooth(pts, smoothing))
}

function bestLeafPair(
  g: MedialAxisGraph,
  a: MedialNode[],
  b: MedialNode[],
  root: MedialNode,
  straightness: number,
): { path: number[]; weight: number } {
  let bestW = -Infinity
  let best: number[] = []
  for (const d1 of a) {
    for (const d2 of b) {
      const angle = angleBetween(d1.position, root.position, d2.position)
      const aw = Math.pow(1 + angle, straightness)
      const weight = (d1.rootDist + d2.rootDist) * Math.max(aw - 1, 1)
      if (weight > bestW) {
        bestW = weight
        best = [...pathToRoot(g, d1.id), ...pathToRoot(g, d2.id).reverse().slice(1)]
      }
    }
  }
  return { path: best, weight: bestW }
}

function pathBetweenLeaves(
  g: MedialAxisGraph,
  a: MedialNode[],
  b: MedialNode[],
  root: MedialNode,
  straightness: number,
): number[] {
  return bestLeafPair(g, a, b, root, straightness).path
}

function pathToRoot(g: MedialAxisGraph, id: number): number[] {
  const path = [id]
  let cur = id
  while (g.nodes[cur]!.parent !== null) {
    cur = g.nodes[cur]!.parent!
    path.push(cur)
  }
  return path
}

function longestPathNodes(g: MedialAxisGraph): number[] {
  // Two BFS from arbitrary leaf
  const leaves = g.nodes.filter((n) => n.children.length === 0 && n.id !== g.root)
  if (leaves.length === 0) return g.nodes.map((n) => n.id)
  let farthest = leaves[0]!
  let best = -1
  for (const L of leaves) {
    if (L.rootDist > best) {
      best = L.rootDist
      farthest = L
    }
  }
  // From farthest, find other leaf maximizing path
  let bestPath = pathToRoot(g, farthest.id)
  let bestLen = farthest.rootDist
  for (const L of leaves) {
    if (L.id === farthest.id) continue
    // path via root
    const p = [
      ...pathToRoot(g, farthest.id),
      ...pathToRoot(g, L.id).reverse().slice(1),
    ]
    const len = farthest.rootDist + L.rootDist
    if (len > bestLen) {
      bestLen = len
      bestPath = p
    }
  }
  return bestPath
}

function angleBetween(a: Vec2, apex: Vec2, b: Vec2): number {
  const ax = a.x - apex.x
  const ay = a.y - apex.y
  const bx = b.x - apex.x
  const by = b.y - apex.y
  const la = Math.hypot(ax, ay) || 1
  const lb = Math.hypot(bx, by) || 1
  const cos = Math.max(-1, Math.min(1, (ax * bx + ay * by) / (la * lb)))
  return Math.acos(cos)
}

function gaussianSmooth(pts: Vec2[], sigma: number): Vec2[] {
  if (pts.length < 3 || sigma <= 0) return pts
  // Map sigma~50 to a modest kernel width in vertex units
  const radius = Math.max(1, Math.round(Math.min(pts.length / 4, sigma / 10)))
  const out: Vec2[] = []
  for (let i = 0; i < pts.length; i++) {
    let sx = 0
    let sy = 0
    let w = 0
    for (let k = -radius; k <= radius; k++) {
      const j = Math.max(0, Math.min(pts.length - 1, i + k))
      const wk = Math.exp(-(k * k) / (2 * (radius * 0.5) ** 2 + 1e-9))
      sx += pts[j]!.x * wk
      sy += pts[j]!.y * wk
      w += wk
    }
    out.push({ x: sx / w, y: sy / w })
  }
  // Keep endpoints pinned
  out[0] = pts[0]!
  out[out.length - 1] = pts[pts.length - 1]!
  return out
}

function key(p: Vec2): string {
  return `${p.x.toFixed(7)},${p.y.toFixed(7)}`
}

function edgeKey(a: Vec2, b: Vec2): string {
  const ka = key(a)
  const kb = key(b)
  return ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v))
}
