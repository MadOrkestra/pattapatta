import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import sharp from 'sharp'
import {
  fromRgba,
  fromLuminance,
  sampleTone,
  halftoneLines,
  halftoneCircles,
  toSvg,
} from '../src/index.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const FIXTURE = join(__dirname, 'fixtures/halftone/portrait.jpg')
const OUT_DIR = join(__dirname, 'output/halftone')

function solidRgba(
  w: number,
  h: number,
  r: number,
  g: number,
  b: number,
  a = 255,
): Uint8ClampedArray {
  const data = new Uint8ClampedArray(w * h * 4)
  for (let i = 0; i < w * h; i++) {
    const o = i * 4
    data[o] = r
    data[o + 1] = g
    data[o + 2] = b
    data[o + 3] = a
  }
  return data
}

/** Left half black, right half white. */
function halfToneRgba(w: number, h: number): Uint8ClampedArray {
  const data = new Uint8ClampedArray(w * h * 4)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const o = (y * w + x) * 4
      const v = x < w / 2 ? 0 : 255
      data[o] = v
      data[o + 1] = v
      data[o + 2] = v
      data[o + 3] = 255
    }
  }
  return data
}

describe('halftone tone field', () => {
  it('maps black darker than white', () => {
    const black = fromRgba(solidRgba(2, 2, 0, 0, 0), 2, 2)
    const white = fromRgba(solidRgba(2, 2, 255, 255, 255), 2, 2)
    const gray = fromRgba(solidRgba(2, 2, 128, 128, 128), 2, 2)
    expect(black.data[0]!).toBeGreaterThan(gray.data[0]!)
    expect(gray.data[0]!).toBeGreaterThan(white.data[0]!)
    expect(white.data[0]!).toBeCloseTo(0, 5)
    expect(black.data[0]!).toBeCloseTo(1, 5)
  })

  it('fromLuminance inverts luma to darkness by default', () => {
    const field = fromLuminance([0, 0.5, 1], 3, 1)
    expect(field.data[0]).toBeCloseTo(1)
    expect(field.data[1]).toBeCloseTo(0.5)
    expect(field.data[2]).toBeCloseTo(0)
  })

  it('bilinear sample stays in range', () => {
    const field = fromRgba(halfToneRgba(4, 4), 4, 4)
    expect(sampleTone(field, 0.5, 1.5)).toBeGreaterThan(0.9)
    expect(sampleTone(field, 3.2, 1.5)).toBeLessThan(0.1)
    expect(sampleTone(field, -1, 0)).toBe(0)
  })
})

describe('halftone lines', () => {
  it('puts more ink on the dark half', () => {
    const field = fromRgba(halfToneRgba(40, 40), 40, 40)
    const marks = halftoneLines(field, { angle: 0, spacing: 2, step: 1, levels: 2 })
    let left = 0
    let right = 0
    for (const p of marks.paths) {
      for (const ring of p.rings) {
        for (const v of ring) {
          if (v.x < 20) left++
          else right++
        }
      }
    }
    expect(left).toBeGreaterThan(right * 3)
    expect(marks.paths.length).toBeGreaterThan(0)
  })

  it('near-white image yields few or no strokes', () => {
    const field = fromRgba(solidRgba(20, 20, 250, 250, 250), 20, 20)
    const marks = halftoneLines(field, { spacing: 2, levels: 1, minDarkness: 0.2 })
    expect(marks.paths.length).toBe(0)
  })
})

describe('halftone circles', () => {
  it('uses larger radii on the dark half', () => {
    const field = fromRgba(halfToneRgba(40, 40), 40, 40)
    const marks = halftoneCircles(field, { cell: 4, minRadius: 0.2, maxRadius: 1.8 })
    const leftR: number[] = []
    const rightR: number[] = []
    for (const p of marks.paths) {
      const { cx, r } = circleStats(p)
      if (cx < 20) leftR.push(r)
      else rightR.push(r)
    }
    expect(leftR.length).toBeGreaterThan(0)
    const mean = (xs: number[]) =>
      xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0
    expect(mean(leftR)).toBeGreaterThan(mean(rightR) + 0.5)
  })

  it('default lattice keeps neighbors from intentional max-radius overlap', () => {
    const field = fromRgba(solidRgba(48, 48, 0, 0, 0), 48, 48)
    const cell = 6
    const maxRadius = cell * 0.45
    const marks = halftoneCircles(field, {
      cell,
      lattice: 'square',
      minRadius: 0.5,
      maxRadius,
      overlap: false,
      segments: 12,
    })
    const centers = marks.paths.map((p) => circleStats(p))
    expect(centers.length).toBeGreaterThan(4)
    const minDist = minHorizontalNeighborDist(centers)
    expect(minDist).toBeGreaterThanOrEqual(2 * maxRadius - 1e-6)
  })

  it('overlap:true derives pitch so max-radius neighbors share overlapAmount', () => {
    const field = fromRgba(solidRgba(80, 80, 0, 0, 0), 80, 80)
    const maxRadius = 5
    const overlapAmount = 0.35
    const marks = halftoneCircles(field, {
      lattice: 'square',
      minRadius: 1,
      maxRadius,
      overlap: true,
      overlapAmount,
      segments: 12,
    })
    const centers = marks.paths.map((p) => circleStats(p))
    expect(centers.length).toBeGreaterThan(4)
    const expected = 2 * maxRadius * (1 - overlapAmount)
    const minDist = minHorizontalNeighborDist(centers)
    expect(minDist).toBeCloseTo(expected, 5)
    // Max-radius disks overlap: distance < 2 * maxRadius
    expect(minDist).toBeLessThan(2 * maxRadius - 1e-6)
  })

  it('maps mid darkness to maxRadius * darkness^gamma', () => {
    const field = fromLuminance(
      new Float32Array(16 * 16).fill(0.5),
      16,
      16,
    )
    // darkness = 0.5 → r = 3 * 0.5 = 1.5 (above minRadius 1)
    const marks = halftoneCircles(field, {
      cell: 8,
      minRadius: 1,
      maxRadius: 3,
      gamma: 1,
      segments: 12,
    })
    expect(marks.paths.length).toBeGreaterThan(0)
    const { r } = circleStats(marks.paths[0]!)
    expect(r).toBeCloseTo(1.5, 1)
  })
})
function circleStats(p: { rings: { x: number; y: number }[][] }) {
  const ring = p.rings[0]!
  let cx = 0
  let cy = 0
  for (const v of ring) {
    cx += v.x
    cy += v.y
  }
  cx /= ring.length
  cy /= ring.length
  let rSum = 0
  for (const v of ring) {
    rSum += Math.hypot(v.x - cx, v.y - cy)
  }
  return { cx, cy, r: rSum / ring.length }
}

function minHorizontalNeighborDist(
  centers: { cx: number; cy: number }[],
): number {
  let best = Infinity
  for (let i = 0; i < centers.length; i++) {
    const a = centers[i]!
    for (let j = i + 1; j < centers.length; j++) {
      const b = centers[j]!
      if (Math.abs(a.cy - b.cy) > 0.5) continue
      const d = Math.abs(a.cx - b.cx)
      if (d > 1e-6 && d < best) best = d
    }
  }
  return best
}
describe('halftone portrait fixture', () => {
  it('decodes the JPG and writes lines / circles SVG samples', async () => {
    mkdirSync(OUT_DIR, { recursive: true })

    const fieldWidth = 800
    const pngWidth = 800

    const { data, info } = await sharp(readFileSync(FIXTURE))
      .rotate()
      .resize({ width: fieldWidth })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })

    const field = fromRgba(data, info.width, info.height)
    expect(field.width).toBe(info.width)
    expect(field.height).toBe(info.height)

    const lineMarks = halftoneLines(field, {
      angle: Math.PI / 5,
      spacing: 2.2,
      step: 1,
      levels: 4,
    })
    const circleMarks = halftoneCircles(field, {
      cell: 3.5,
      lattice: 'hex',
      minRadius: 0.12,
      maxRadius: 1.55,
      gamma: 0.9,
      segments: 16,
    })

    expect(lineMarks.paths.length).toBeGreaterThan(100)
    expect(circleMarks.paths.length).toBeGreaterThan(2000)

    const lineSvg = toSvg(lineMarks, {
      viewBox: `0 0 ${field.width} ${field.height}`,
      width: field.width,
      height: field.height,
      strokeWidth: 0.28,
    })
    const circleSvg = toSvg(circleMarks, {
      viewBox: `0 0 ${field.width} ${field.height}`,
      width: field.width,
      height: field.height,
      strokeWidth: 0.22,
    })

    expect(lineSvg).toContain('fill="none"')
    expect(circleSvg).toContain('fill="none"')
    expect(lineSvg).not.toMatch(/fill="(?!none)[^"]*"/)
    expect(circleSvg).not.toMatch(/fill="(?!none)[^"]*"/)
    // Every path is an explicit stroke mark (plotter-safe)
    expect(lineSvg.match(/<path /g)?.length).toBe(lineMarks.paths.length)
    expect(circleSvg.match(/stroke="/g)?.length).toBe(circleMarks.paths.length)

    writeFileSync(join(OUT_DIR, 'portrait-lines.svg'), lineSvg)
    writeFileSync(join(OUT_DIR, 'portrait-circles.svg'), circleSvg)

    await sharp(Buffer.from(circleSvg), { density: 144 })
      .flatten({ background: '#ffffff' })
      .resize({ width: pngWidth })
      .png()
      .toFile(join(OUT_DIR, 'portrait-circles.png'))
    await sharp(Buffer.from(lineSvg), { density: 144 })
      .flatten({ background: '#ffffff' })
      .resize({ width: pngWidth })
      .png()
      .toFile(join(OUT_DIR, 'portrait-lines.png'))
  }, 180_000)
})
