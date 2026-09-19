#!/usr/bin/env node
/**
 * Generate llms.txt / llms-full.txt from website docs markdown.
 * Run: pnpm docs:llms
 * Check: pnpm docs:llms:check
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const SITE = 'https://pattapatta.madorkestra.com'
const checkOnly = process.argv.includes('--check')

/** @typedef {{ source: string, slug: string, title: string, section: 'Docs' | 'API' | 'Optional', note: string }} ManifestEntry */

/** Ordered manifest: website +page.md → LLM markdown copies. Exclude /llms-txt explainer. */
/** @type {ManifestEntry[]} */
const MANIFEST = [
  {
    source: 'website/src/routes/concepts/geometry-model/+page.md',
    slug: 'geometry-model',
    title: 'Geometry model',
    section: 'Docs',
    note: 'Path, Group, Vec2, and core types',
  },
  {
    source: 'website/src/routes/concepts/pen-plotter/+page.md',
    slug: 'pen-plotter',
    title: 'Pen-plotter output',
    section: 'Docs',
    note: 'Stroke marks only; no solid fills',
  },
  {
    source: 'website/src/routes/concepts/operations/+page.md',
    slug: 'operations',
    title: 'Operations',
    section: 'Docs',
    note: 'Transforms and region ops overview',
  },
  {
    source: 'website/src/routes/concepts/fills/+page.md',
    slug: 'fills',
    title: 'Fills',
    section: 'Docs',
    note: 'Hatch, packing, tiling as stroke marks',
  },
  {
    source: 'website/src/routes/quickstart/+page.md',
    slug: 'quickstart',
    title: 'Quickstart',
    section: 'Docs',
    note: 'Install and draw something quickly',
  },
  {
    source: 'website/src/routes/getting-started/+page.md',
    slug: 'getting-started',
    title: 'Getting started',
    section: 'Docs',
    note: 'Mental model, imports, mini pipeline',
  },
  {
    source: 'website/src/routes/examples/+page.md',
    slug: 'examples',
    title: 'Examples',
    section: 'Docs',
    note: 'Chained recipes: union → hatch, pack, …',
  },
  {
    source: 'website/src/routes/api/types/+page.md',
    slug: 'types',
    title: 'types',
    section: 'API',
    note: 'Vec2, Circle, Segment, Path, Group helpers',
  },
  {
    source: 'website/src/routes/api/construction/+page.md',
    slug: 'construction',
    title: 'construction',
    section: 'API',
    note: 'createRect, createCircle, stars, sponges',
  },
  {
    source: 'website/src/routes/api/svg/+page.md',
    slug: 'svg',
    title: 'SVG I/O',
    section: 'API',
    note: 'parseSvg, toSvg, path data',
  },
  {
    source: 'website/src/routes/api/conversion/+page.md',
    slug: 'conversion',
    title: 'conversion',
    section: 'API',
    note: 'flatten, toArray, contours',
  },
  {
    source: 'website/src/routes/api/transformation/+page.md',
    slug: 'transformation',
    title: 'transformation',
    section: 'API',
    note: 'translate, rotate, scale, shear',
  },
  {
    source: 'website/src/routes/api/shape-boolean/+page.md',
    slug: 'shape-boolean',
    title: 'shapeBoolean',
    section: 'API',
    note: 'union, intersect, subtract, occlusion',
  },
  {
    source: 'website/src/routes/api/morphology/+page.md',
    slug: 'morphology',
    title: 'morphology',
    section: 'API',
    note: 'buffer, simplify, warps, Minkowski',
  },
  {
    source: 'website/src/routes/api/processing/+page.md',
    slug: 'processing',
    title: 'processing',
    section: 'API',
    note: 'perimeter, densify, slice, dissolve',
  },
  {
    source: 'website/src/routes/api/predicates/+page.md',
    slug: 'predicates',
    title: 'predicates',
    section: 'API',
    note: 'area, centroid, containsPoint, bounds',
  },
  {
    source: 'website/src/routes/api/compare/+page.md',
    slug: 'compare',
    title: 'compare',
    section: 'API',
    note: 'Oracle / harness helpers',
  },
  {
    source: 'website/src/routes/api/hatch/+page.md',
    slug: 'hatch',
    title: 'hatch',
    section: 'API',
    note: 'parallel, cross, weave, concentric fills',
  },
  {
    source: 'website/src/routes/api/halftone/+page.md',
    slug: 'halftone',
    title: 'halftone',
    section: 'API',
    note: 'image tone → lines or circles (exclusive modes)',
  },
  {
    source: 'website/src/routes/api/segment-set/+page.md',
    slug: 'segment-set',
    title: 'segmentSet',
    section: 'API',
    note: 'parallelSegments, clip, filters',
  },
  {
    source: 'website/src/routes/api/circle-packing/+page.md',
    slug: 'circle-packing',
    title: 'circlePacking',
    section: 'API',
    note: 'lattices, LEC, stochastic, obstacles',
  },
  {
    source: 'website/src/routes/api/tiling/+page.md',
    slug: 'tiling',
    title: 'tiling',
    section: 'API',
    note: 'grids and subdivision tilings',
  },
  {
    source: 'website/src/routes/api/contour/+page.md',
    slug: 'contour',
    title: 'contour',
    section: 'API',
    note: 'offsets, skeleton, isolines',
  },
  {
    source: 'website/src/routes/api/hull/+page.md',
    slug: 'hull',
    title: 'hull',
    section: 'API',
    note: 'convex hull, bounding box',
  },
  {
    source: 'website/src/routes/api/triangulation/+page.md',
    slug: 'triangulation',
    title: 'triangulation',
    section: 'API',
    note: 'earcut, Delaunay, Poisson, refine',
  },
  {
    source: 'website/src/routes/api/voronoi/+page.md',
    slug: 'voronoi',
    title: 'voronoi',
    section: 'API',
    note: 'compound and inner Voronoi',
  },
  {
    source: 'website/src/routes/api/point-set/+page.md',
    slug: 'point-set',
    title: 'pointSet',
    section: 'API',
    note: 'grids, Poisson, Hilbert, TSP tour',
  },
  {
    source: 'website/src/routes/api/optimisation/+page.md',
    slug: 'optimisation',
    title: 'optimisation',
    section: 'API',
    note: 'MIC, LEC, envelope, closest pairs',
  },
  {
    source: 'website/src/routes/api/polygonisation/+page.md',
    slug: 'polygonisation',
    title: 'polygonisation',
    section: 'API',
    note: 'point-set → polygon strategies',
  },
  {
    source: 'website/src/routes/api/meshing/+page.md',
    slug: 'meshing',
    title: 'meshing',
    section: 'API',
    note: 'faces, quadrangulation, mesh repair',
  },
  {
    source: 'website/src/routes/concepts/cli/+page.md',
    slug: 'cli',
    title: 'CLI',
    section: 'Optional',
    note: 'pattapatta CLI overview',
  },
]

/**
 * @param {string} md
 * @returns {string}
 */
function cleanMarkdown(md) {
  let out = md
  // Drop HTML blocks (badges, not-prose wrappers)
  out = out.replace(/<p\b[^>]*>[\s\S]*?<\/p>\s*/gi, '')
  out = out.replace(/<[a-z][^>]*>[\s\S]*?<\/[a-z]+>\s*/gi, '')
  // Absolute site URLs for agents reading offline copies
  out = out.replace(
    /\]\((\/(?:assets|api|concepts|quickstart|getting-started|examples|demos|llms-txt)[^)]*)\)/g,
    (_, path) => `](${SITE}${path})`,
  )
  out = out.replace(
    /(!\[[^\]]*\]\()(\/(?:assets)[^)]*)\)/g,
    (_, prefix, path) => `${prefix}${SITE}${path})`,
  )
  out = out.replace(/\n{3,}/g, '\n\n').trim() + '\n'
  return out
}

/**
 * @returns {Map<string, string>}
 */
function buildOutputs() {
  /** @type {Map<string, string>} */
  const files = new Map()

  /** @type {{ entry: ManifestEntry, body: string }[]} */
  const bodies = []

  for (const entry of MANIFEST) {
    const abs = join(ROOT, entry.source)
    if (!existsSync(abs)) {
      throw new Error(`Missing manifest source: ${entry.source}`)
    }
    const body = cleanMarkdown(readFileSync(abs, 'utf8'))
    bodies.push({ entry, body })
    files.set(`website/static/llms/${entry.slug}.md`, body)
  }

  const fullParts = [
    `# pattapatta — full documentation for LLMs\n`,
    `> Generated from the docs site. Prefer individual pages under ${SITE}/llms/ when you only need one module.\n`,
    `Stroke-first pen-plotter geometry library (MIT, ESM, Node ≥ 18). Install: \`pnpm add pattapatta\`.\n`,
  ]

  for (const { entry, body } of bodies) {
    if (entry.section === 'Optional') continue
    fullParts.push(`\n---\n\n<!-- ${entry.slug} -->\n\n`)
    fullParts.push(body)
  }

  // Optional section at end of full dump
  for (const { entry, body } of bodies) {
    if (entry.section !== 'Optional') continue
    fullParts.push(`\n---\n\n<!-- ${entry.slug} -->\n\n`)
    fullParts.push(body)
  }

  const fullText = fullParts.join('').replace(/\n{3,}/g, '\n\n')
  files.set('website/static/llms-full.txt', fullText)
  files.set('llms-full.txt', fullText)

  const index = buildIndex()
  files.set('website/static/llms.txt', index)
  files.set('llms.txt', index)

  return files
}

function buildIndex() {
  const lines = [
    '# pattapatta',
    '',
    '> Pen-plotter geometry library (PGS-inspired): hatching, packing, boolean paths, Voronoi, tilings, and SVG I/O for Node and the browser. Stroke marks only — solid area fills are not the goal. MIT, ESM, Node ≥ 18. Experimental / not production-ready.',
    '',
    'Install with `pnpm add pattapatta` (or `npm i pattapatta`). Import from `pattapatta` or feature paths such as `pattapatta/hatch` and `pattapatta/circlePacking`. Core types are `Vec2`, `Path` (rings + closed), and `Group` (ordered paths). Prefer constructors like `createRect` / `polygon`, then boolean or buffer ops, then hatch/packing fills, then `toSvg`.',
    '',
    `Human docs: ${SITE}/ — this file is the curated entry point for AI agents ([llmstxt.org](https://llmstxt.org)). For every function signature and option table in one file, use [llms-full.txt](${SITE}/llms-full.txt). Package: [npm](https://www.npmjs.com/package/pattapatta) · [GitHub](https://github.com/MadOrkestra/pattapatta).`,
    '',
  ]

  /** @type {Record<string, ManifestEntry[]>} */
  const bySection = { Docs: [], API: [], Optional: [] }
  for (const entry of MANIFEST) {
    bySection[entry.section].push(entry)
  }

  // Docs section: full dump first, then pages
  lines.push('## Docs')
  lines.push('')
  lines.push(
    `- [Full API dump](${SITE}/llms-full.txt): every concept + API page concatenated (all functions)`,
  )
  for (const entry of bySection.Docs) {
    lines.push(
      `- [${entry.title}](${SITE}/llms/${entry.slug}.md): ${entry.note}`,
    )
  }
  lines.push('')

  lines.push('## API')
  lines.push('')
  for (const entry of bySection.API) {
    lines.push(
      `- [${entry.title}](${SITE}/llms/${entry.slug}.md): ${entry.note}`,
    )
  }
  lines.push('')

  lines.push('## Optional')
  lines.push('')
  for (const entry of bySection.Optional) {
    lines.push(
      `- [${entry.title}](${SITE}/llms/${entry.slug}.md): ${entry.note}`,
    )
  }
  lines.push(
    `- [Changelog](https://github.com/MadOrkestra/pattapatta/blob/main/CHANGELOG.md): release notes`,
  )
  lines.push(
    `- [Internal research & ADRs](https://github.com/MadOrkestra/pattapatta/tree/main/docs): design notes (not user docs)`,
  )
  lines.push('')

  return lines.join('\n')
}

/**
 * @param {Map<string, string>} files
 * @param {string} outRoot
 */
function writeOutputs(files, outRoot) {
  for (const [rel, content] of files) {
    const abs = join(outRoot, rel)
    mkdirSync(dirname(abs), { recursive: true })
    writeFileSync(abs, content)
  }
}

/**
 * @param {Map<string, string>} files
 */
function checkDrift(files) {
  const drifts = []
  for (const [rel, content] of files) {
    const abs = join(ROOT, rel)
    if (!existsSync(abs)) {
      drifts.push(`missing: ${rel}`)
      continue
    }
    const existing = readFileSync(abs, 'utf8')
    if (existing !== content) {
      drifts.push(`stale: ${rel}`)
    }
  }
  // Detect orphan files under website/static/llms not in manifest
  const llmsDir = join(ROOT, 'website', 'static', 'llms')
  if (existsSync(llmsDir)) {
    const expected = new Set(MANIFEST.map((e) => `${e.slug}.md`))
    for (const name of readdirSync(llmsDir)) {
      if (name.endsWith('.md') && !expected.has(name)) {
        drifts.push(`orphan: website/static/llms/${name}`)
      }
    }
  }
  return drifts
}

function main() {
  const files = buildOutputs()

  if (checkOnly) {
    const drifts = checkDrift(files)
    if (drifts.length > 0) {
      console.error('llms.txt out of sync with website docs:')
      for (const d of drifts) console.error(`  ${d}`)
      console.error('\nRun: pnpm docs:llms')
      process.exit(1)
    }
    console.log('llms.txt outputs are up to date.')
    return
  }

  writeOutputs(files, ROOT)
  console.log(
    `Wrote llms.txt, llms-full.txt, and ${MANIFEST.length} files under website/static/llms/`,
  )
}

main()
