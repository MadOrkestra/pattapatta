import { writeFileSync, mkdirSync, copyFileSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'
import {
  fromRgba,
  halftoneLines,
  halftoneCircles,
  toSvg,
  reducePrecision,
  group,
} from '../src/index.js'

const FIXTURE = 'tests/fixtures/halftone/portrait.jpg'
const OUT = 'tests/output/halftone'
const EXAMPLES = 'examples/halftone'

/**
 * Working resolution for the plotter SVG (user units = image pixels).
 * Fine lattice so the subject reads; paths stay stroke-only via toSvg.
 * PNG exports are previews only — the SVG is the deliverable.
 */
const FIELD_WIDTH = 1000
const PNG_WIDTH = 1600
const SOURCE_WIDTH = 1000

mkdirSync(OUT, { recursive: true })
mkdirSync(EXAMPLES, { recursive: true })

await sharp(FIXTURE)
  .rotate()
  .resize({ width: SOURCE_WIDTH })
  .png()
  .toFile(join(OUT, 'portrait-source.png'))

const { data, info } = await sharp(FIXTURE)
  .rotate()
  .resize({ width: FIELD_WIDTH })
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true })

const field = fromRgba(data, info.width, info.height)

const lineMarks = halftoneLines(field, {
  angle: Math.PI / 6,
  spacing: 2.4,
  step: 1,
  levels: 4,
})
const circleMarks = halftoneCircles(field, {
  cell: 3.2,
  lattice: 'hex',
  minRadius: 0.22,
  maxRadius: 1.4,
  gamma: 1.15,
  segments: 12,
})
const overlapMarks = halftoneCircles(field, {
  overlap: true,
  overlapAmount: 0.3,
  minRadius: 0.35,
  maxRadius: 2.1,
  lattice: 'hex',
  gamma: 1.1,
  segments: 12,
})

/** Plotter-ready: round verts so drivers get a smaller stroke SVG. */
function forPlot(marks: ReturnType<typeof group>) {
  return group(marks.paths.map((p) => reducePrecision(p, 2)))
}

const linePlot = forPlot(lineMarks)
const circlePlot = forPlot(circleMarks)
const overlapPlot = forPlot(overlapMarks)

console.log({
  lines: linePlot.paths.length,
  circles: circlePlot.paths.length,
  overlap: overlapPlot.paths.length,
  w: field.width,
  h: field.height,
  circlesAcross: Math.floor(field.width / 3.2),
})

const vb = {
  viewBox: `0 0 ${field.width} ${field.height}`,
  width: field.width,
  height: field.height,
  stroke: '#000',
} as const

const lineSvg = toSvg(linePlot, { ...vb, strokeWidth: 0.28 })
const circleSvg = toSvg(circlePlot, { ...vb, strokeWidth: 0.22 })
const overlapSvg = toSvg(overlapPlot, { ...vb, strokeWidth: 0.2 })

// Primary deliverable: pen-plotter SVG (fill="none" stroked paths)
writeFileSync(join(OUT, 'portrait-lines.svg'), lineSvg)
writeFileSync(join(OUT, 'portrait-circles.svg'), circleSvg)
writeFileSync(join(OUT, 'portrait-circles-overlap.svg'), overlapSvg)
writeFileSync(join(EXAMPLES, 'portrait-lines.svg'), lineSvg)
writeFileSync(join(EXAMPLES, 'portrait-circles.svg'), circleSvg)
writeFileSync(join(EXAMPLES, 'portrait-circles-overlap.svg'), overlapSvg)

async function svgToPngPreview(svg: string, name: string) {
  await sharp(Buffer.from(svg), { density: 150 })
    .flatten({ background: '#ffffff' })
    .resize({ width: PNG_WIDTH })
    .png()
    .toFile(join(OUT, name))
}

await svgToPngPreview(lineSvg, 'portrait-lines.png')
await svgToPngPreview(circleSvg, 'portrait-circles.png')
await svgToPngPreview(overlapSvg, 'portrait-circles-overlap.png')

for (const name of [
  'portrait-source.png',
  'portrait-lines.png',
  'portrait-circles.png',
  'portrait-circles-overlap.png',
]) {
  copyFileSync(join(OUT, name), join(EXAMPLES, name))
}

console.log('wrote plotter SVGs + PNG previews →', OUT, 'and', EXAMPLES)
