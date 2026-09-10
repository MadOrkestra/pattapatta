#!/usr/bin/env node
/**
 * Generate SVG example assets for the GitBook docs.
 * Run: npm run docs:examples
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  angular,
  buffer,
  chaikinCut,
  compoundVoronoi,
  createArc,
  createCircle,
  createKochSnowflake,
  createRect,
  createRegularPolygon,
  createRing,
  createStar,
  delaunayTriangulationPoints,
  densify,
  earCutTriangulation,
  envelope,
  extractInnerEdges,
  frontChainPack,
  gabrielFaces,
  group,
  hatchCross,
  hatchParallel,
  hexLatticePack,
  hexTiling,
  hilbertPolygonise,
  innerVoronoi,
  maximumInscribedCircle,
  maximumInscribedPack,
  onionLayers,
  offsetCurvesInward,
  offsetCurvesOutward,
  poisson,
  polygon,
  polyline,
  radialWarp,
  rectSubdivision,
  rotateAroundCenter,
  scale,
  segmentsToOpenPaths,
  simplify,
  sineWarp,
  slice,
  squareLatticePack,
  squareTiling,
  stochasticPack,
  subtract,
  translate,
  triangleSubdivision,
  union,
  vec2,
  convexHull,
  boundingBox,
  minimumBoundingCircle,
} from '../dist/index.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'gitbook/assets')
mkdirSync(outDir, { recursive: true })

const STROKE = '#1a1a1a'
const ACCENT = '#c45c26'
const MUTED = '#888'

function write(name, svg) {
  writeFileSync(join(outDir, name), svg)
  console.log('wrote', name)
}

function wrap({ viewBox, body, strokeWidth = 1.2 }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" fill="none">
  <rect x="0" y="0" width="100%" height="100%" fill="#faf8f5"/>
  ${body}
</svg>`
}

// Local path serializer (mirror library)
function serializeRings(rings, closed) {
  if (!rings.length) return ''
  const parts = []
  for (const ring of rings) {
    if (!ring.length) continue
    parts.push(`M ${ring[0].x} ${ring[0].y}`)
    for (let i = 1; i < ring.length; i++) {
      parts.push(`L ${ring[i].x} ${ring[i].y}`)
    }
    if (closed) parts.push('Z')
  }
  return parts.join(' ')
}

function pathTag(p, stroke = STROKE, sw = 1.2) {
  const d = serializeRings(p.rings, p.closed)
  if (!d) return ''
  return `<path d="${d}" stroke="${stroke}" stroke-width="${sw}" fill="none"/>`
}

function groupTags(g, stroke = STROKE, sw = 1.2) {
  return g.paths.map((p) => pathTag(p, stroke, sw)).join('\n  ')
}

function circlesTags(circles, stroke = STROKE, sw = 1.2) {
  return circles
    .map(
      (c) =>
        `<circle cx="${c.x}" cy="${c.y}" r="${c.r}" stroke="${stroke}" stroke-width="${sw}" fill="none"/>`,
    )
    .join('\n  ')
}

function pointsTags(pts, r = 1.5, fill = ACCENT) {
  return pts
    .map((p) => `<circle cx="${p.x}" cy="${p.y}" r="${r}" fill="${fill}" stroke="none"/>`)
    .join('\n  ')
}

function segsToGroup(segs) {
  return group(segmentsToOpenPaths(segs))
}

function vb(minX, minY, w, h) {
  return `${minX} ${minY} ${w} ${h}`
}

// --- demos ---

{
  const a = createRect(10, 25, 50, 40)
  const b = createRect(40, 35, 50, 40)
  write(
    'boolean-union.svg',
    wrap({
      viewBox: vb(0, 0, 110, 100),
      body: `${pathTag(a, MUTED, 1)}
  ${pathTag(b, MUTED, 1)}
  ${groupTags(union(a, b), ACCENT, 1.6)}`,
    }),
  )
  write(
    'boolean-subtract.svg',
    wrap({
      viewBox: vb(0, 0, 110, 100),
      body: `${pathTag(a, MUTED, 1)}
  ${pathTag(b, MUTED, 1)}
  ${groupTags(subtract(a, b), ACCENT, 1.6)}`,
    }),
  )
}

{
  const sq = createRect(15, 15, 70, 70)
  const hatched = segsToGroup(hatchParallel(sq, { spacing: 6, count: 24, angle: Math.PI / 4 }))
  write(
    'hatch-parallel.svg',
    wrap({
      viewBox: vb(0, 0, 100, 100),
      body: `${pathTag(sq, MUTED, 1)}
  ${groupTags(hatched, STROKE, 1)}`,
    }),
  )
  const cross = segsToGroup(hatchCross(sq, { spacing: 8, count: 18 }))
  write(
    'hatch-cross.svg',
    wrap({
      viewBox: vb(0, 0, 100, 100),
      body: `${pathTag(sq, MUTED, 1)}
  ${groupTags(cross, STROKE, 1)}`,
    }),
  )
}

{
  const cell = createRect(10, 10, 80, 80)
  write(
    'packing-square.svg',
    wrap({
      viewBox: vb(0, 0, 100, 100),
      body: `${pathTag(cell, MUTED, 1)}
  ${circlesTags(squareLatticePack(cell, 16), ACCENT, 1.2)}`,
    }),
  )
  write(
    'packing-hex.svg',
    wrap({
      viewBox: vb(0, 0, 100, 100),
      body: `${pathTag(cell, MUTED, 1)}
  ${circlesTags(hexLatticePack(cell, 16), ACCENT, 1.2)}`,
    }),
  )
  write(
    'packing-inscribed.svg',
    wrap({
      viewBox: vb(0, 0, 100, 100),
      body: `${pathTag(cell, MUTED, 1)}
  ${circlesTags(maximumInscribedPack(cell, 6, 0.5), ACCENT, 1.2)}`,
    }),
  )
  write(
    'packing-stochastic.svg',
    wrap({
      viewBox: vb(0, 0, 100, 100),
      body: `${pathTag(cell, MUTED, 1)}
  ${circlesTags(stochasticPack(cell, 80, 4, 3), ACCENT, 1.2)}`,
    }),
  )
  write(
    'packing-frontchain.svg',
    wrap({
      viewBox: vb(0, 0, 100, 100),
      body: `${pathTag(cell, MUTED, 1)}
  ${circlesTags(frontChainPack(cell, 5, 10, 11), ACCENT, 1.2)}`,
    }),
  )
}

{
  const sq = createRect(25, 25, 50, 50)
  write(
    'morphology-buffer.svg',
    wrap({
      viewBox: vb(0, 0, 100, 100),
      body: `${pathTag(sq, MUTED, 1)}
  ${groupTags(buffer(sq, 10), ACCENT, 1.5)}`,
    }),
  )
  const star = createStar(50, 50, 35, 14, 5)
  write(
    'morphology-chaikin.svg',
    wrap({
      viewBox: vb(0, 0, 100, 100),
      body: `${pathTag(star, MUTED, 1)}
  ${pathTag(chaikinCut(star, 3), ACCENT, 1.5)}`,
    }),
  )
  write(
    'morphology-radial-warp.svg',
    wrap({
      viewBox: vb(0, 0, 100, 100),
      body: `${pathTag(createCircle(50, 50, 30, 48), MUTED, 1)}
  ${pathTag(radialWarp(createCircle(50, 50, 30, 48), 0.25, 5), ACCENT, 1.5)}`,
    }),
  )
  write(
    'morphology-sine-warp.svg',
    wrap({
      viewBox: vb(0, 0, 100, 100),
      body: `${pathTag(sq, MUTED, 1)}
  ${pathTag(sineWarp(sq, 8, 0.04), ACCENT, 1.5)}`,
    }),
  )
  const dense = densify(createRegularPolygon(50, 50, 35, 6), 4)
  write(
    'morphology-simplify.svg',
    wrap({
      viewBox: vb(0, 0, 100, 100),
      body: `${pathTag(dense, MUTED, 1)}
  ${pathTag(simplify(dense, 3), ACCENT, 1.5)}`,
    }),
  )
}

{
  const sq = createRect(20, 30, 40, 40)
  write(
    'transform-rotate.svg',
    wrap({
      viewBox: vb(0, 0, 100, 100),
      body: `${pathTag(sq, MUTED, 1)}
  ${pathTag(rotateAroundCenter(sq, Math.PI / 6), ACCENT, 1.5)}`,
    }),
  )
  write(
    'transform-scale.svg',
    wrap({
      viewBox: vb(0, 0, 100, 100),
      body: `${pathTag(sq, MUTED, 1)}
  ${pathTag(scale(sq, 1.4, 1.4, { x: 40, y: 50 }), ACCENT, 1.5)}`,
    }),
  )
  write(
    'transform-translate.svg',
    wrap({
      viewBox: vb(0, 0, 100, 100),
      body: `${pathTag(sq, MUTED, 1)}
  ${pathTag(translate(sq, 25, -10), ACCENT, 1.5)}`,
    }),
  )
}

{
  const sq = createRect(15, 15, 70, 70)
  write(
    'processing-slice.svg',
    wrap({
      viewBox: vb(0, 0, 100, 100),
      body: groupTags(slice(sq, vec2(10, 20), vec2(90, 80)), ACCENT, 1.4),
    }),
  )
  write(
    'contour-offset.svg',
    wrap({
      viewBox: vb(0, 0, 100, 100),
      body: `${pathTag(sq, MUTED, 1)}
  ${groupTags(offsetCurvesOutward(sq, 8), ACCENT, 1.4)}
  ${groupTags(offsetCurvesInward(sq, 8), '#2a6f97', 1.4)}`,
    }),
  )
}

{
  const pts = [
    vec2(20, 70),
    vec2(35, 25),
    vec2(55, 55),
    vec2(75, 20),
    vec2(85, 65),
    vec2(50, 80),
    vec2(40, 45),
  ]
  write(
    'hull-convex.svg',
    wrap({
      viewBox: vb(0, 0, 100, 100),
      body: `${pointsTags(pts)}
  ${pathTag(convexHull(pts), ACCENT, 1.5)}`,
    }),
  )
  write(
    'hull-bbox.svg',
    wrap({
      viewBox: vb(0, 0, 100, 100),
      body: `${pathTag(createStar(50, 50, 35, 12, 5), MUTED, 1)}
  ${pathTag(boundingBox(createStar(50, 50, 35, 12, 5)), ACCENT, 1.5)}`,
    }),
  )
}

{
  const sq = createRect(10, 10, 80, 80)
  const tris = earCutTriangulation(sq)
  write(
    'triangulation-earcut.svg',
    wrap({
      viewBox: vb(0, 0, 100, 100),
      body: groupTags(group(tris), STROKE, 1),
    }),
  )
  const sites = poisson(12, 15, 15, 85, 85, 2)
  write(
    'triangulation-delaunay.svg',
    wrap({
      viewBox: vb(0, 0, 100, 100),
      body: `${groupTags(group(delaunayTriangulationPoints(sites)), STROKE, 1)}
  ${pointsTags(sites, 2)}`,
    }),
  )
}

{
  const sites = poisson(18, 12, 12, 88, 88, 5)
  write(
    'voronoi-compound.svg',
    wrap({
      viewBox: vb(0, 0, 100, 100),
      body: `${groupTags(
        compoundVoronoi(sites, {
          bounds: { minX: 5, minY: 5, maxX: 95, maxY: 95 },
        }),
        STROKE,
        1,
      )}
  ${pointsTags(sites, 2)}`,
    }),
  )
  const container = createCircle(50, 50, 40, 48)
  write(
    'voronoi-inner.svg',
    wrap({
      viewBox: vb(0, 0, 100, 100),
      body: `${pathTag(container, MUTED, 1)}
  ${groupTags(innerVoronoi(sites, container), STROKE, 1)}
  ${pointsTags(sites, 2)}`,
    }),
  )
}

{
  write(
    'construction-shapes.svg',
    wrap({
      viewBox: vb(0, 0, 100, 100),
      body: `${pathTag(createCircle(22, 50, 16, 48), STROKE, 1.2)}
  ${pathTag(createStar(50, 50, 18, 7, 5), ACCENT, 1.2)}
  ${pathTag(createKochSnowflake(78, 50, 16, 2), '#2a6f97', 1.2)}`,
    }),
  )
  write(
    'construction-ring-arc.svg',
    wrap({
      viewBox: vb(0, 0, 100, 100),
      body: `${pathTag(createRing(35, 50, 22, 12, 48), STROKE, 1.2)}
  ${pathTag(createArc(75, 50, 22, -Math.PI * 0.8, Math.PI * 0.8, 40), ACCENT, 1.5)}`,
    }),
  )
}

{
  write(
    'tiling-square.svg',
    wrap({
      viewBox: vb(0, 0, 100, 100),
      body: groupTags(squareTiling(20, 10, 10, 90, 90), STROKE, 1),
    }),
  )
  write(
    'tiling-hex.svg',
    wrap({
      viewBox: vb(0, 0, 100, 100),
      body: groupTags(hexTiling(18, 5, 5, 95, 95), STROKE, 1),
    }),
  )
  const sq = createRect(10, 10, 80, 80)
  write(
    'tiling-rect-subdiv.svg',
    wrap({
      viewBox: vb(0, 0, 100, 100),
      body: groupTags(rectSubdivision(sq, 3, 3), STROKE, 1),
    }),
  )
  const tri = polygon([vec2(50, 10), vec2(90, 85), vec2(10, 85)])
  write(
    'tiling-tri-subdiv.svg',
    wrap({
      viewBox: vb(0, 0, 100, 100),
      body: groupTags(triangleSubdivision([tri], 2), STROKE, 1),
    }),
  )
}

{
  const pts = poisson(10, 15, 15, 85, 85, 9)
  write(
    'polygonise-angular.svg',
    wrap({
      viewBox: vb(0, 0, 100, 100),
      body: `${pointsTags(pts)}
  ${pathTag(angular(pts), ACCENT, 1.4)}`,
    }),
  )
  write(
    'polygonise-hilbert.svg',
    wrap({
      viewBox: vb(0, 0, 100, 100),
      body: `${pointsTags(pts)}
  ${pathTag(hilbertPolygonise(pts), ACCENT, 1.4)}`,
    }),
  )
  write(
    'polygonise-onion.svg',
    wrap({
      viewBox: vb(0, 0, 100, 100),
      body: `${pointsTags(pts)}
  ${onionLayers(pts)
    .map((p, i) => pathTag(p, i === 0 ? ACCENT : STROKE, 1.3))
    .join('\n  ')}`,
    }),
  )
}

{
  const sites = poisson(14, 12, 12, 88, 88, 4)
  const faces = delaunayTriangulationPoints(sites)
  write(
    'meshing-edges.svg',
    wrap({
      viewBox: vb(0, 0, 100, 100),
      body: `${groupTags(
        group(
          extractInnerEdges(faces).map((e) =>
            polyline([e.a, e.b]),
          ),
        ),
        STROKE,
        1,
      )}
  ${pointsTags(sites, 2)}`,
    }),
  )
  write(
    'meshing-gabriel.svg',
    wrap({
      viewBox: vb(0, 0, 100, 100),
      body: `${groupTags(gabrielFaces(sites), STROKE, 1)}
  ${pointsTags(sites, 2)}`,
    }),
  )
}

{
  const sq = createRect(15, 15, 70, 70)
  const mic = maximumInscribedCircle(sq, 0.4)
  const mbc = minimumBoundingCircle(createStar(50, 50, 35, 12, 5))
  write(
    'optimisation-mic.svg',
    wrap({
      viewBox: vb(0, 0, 100, 100),
      body: `${pathTag(sq, MUTED, 1)}
  ${circlesTags(mic ? [mic] : [], ACCENT, 1.5)}`,
    }),
  )
  write(
    'optimisation-mbc.svg',
    wrap({
      viewBox: vb(0, 0, 100, 100),
      body: `${pathTag(createStar(50, 50, 35, 12, 5), MUTED, 1)}
  ${circlesTags([mbc], ACCENT, 1.5)}
  ${pathTag(envelope(createStar(50, 50, 35, 12, 5)), '#2a6f97', 1)}`,
    }),
  )
}

{
  const pts = poisson(14, 10, 10, 90, 90, 8)
  write(
    'pointset-poisson.svg',
    wrap({
      viewBox: vb(0, 0, 100, 100),
      body: pointsTags(pts, 2.5),
    }),
  )
}

{
  // quickstart hero
  const frame = createRect(8, 8, 84, 84)
  const packs = maximumInscribedPack(frame, 8, 0.45)
  const hatched = segsToGroup(
    hatchParallel(frame, { spacing: 5, count: 28, angle: Math.PI / 5 }),
  )
  write(
    'hero.svg',
    wrap({
      viewBox: vb(0, 0, 100, 100),
      body: `${pathTag(frame, MUTED, 1)}
  ${groupTags(hatched, '#ccc', 0.8)}
  ${circlesTags(packs, ACCENT, 1.4)}`,
    }),
  )
}

console.log('Done →', outDir)
