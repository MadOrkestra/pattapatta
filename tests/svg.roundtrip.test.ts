import { describe, expect, it } from 'vitest'
import { equalsVec2, polygon, vec2 } from '../src/types/index.js'
import { parsePathData, serializePathData } from '../src/svg/pathData.js'
import { parseSvg, toSvg } from '../src/svg/index.js'

describe('types', () => {
  it('builds a polygon path', () => {
    const p = polygon([vec2(0, 0), vec2(1, 0), vec2(1, 1)])
    expect(p.closed).toBe(true)
    expect(p.rings[0]?.length).toBe(3)
  })
})

describe('pathData', () => {
  it('round-trips a closed rect path', () => {
    const d = 'M 0 0 L 10 0 L 10 5 L 0 5 Z'
    const parsed = parsePathData(d)
    expect(parsed.closed).toBe(true)
    expect(parsed.rings[0]?.length).toBe(4)
    const again = parsePathData(serializePathData(parsed.rings, true))
    expect(again.rings[0]?.map((v) => [v.x, v.y])).toEqual([
      [0, 0],
      [10, 0],
      [10, 5],
      [0, 5],
    ])
  })

  it('parses relative commands', () => {
    const parsed = parsePathData('M10 10 l5 0 l0 5 z')
    expect(parsed.closed).toBe(true)
    expect(parsed.rings[0]?.[1]).toEqual(vec2(15, 10))
  })
})

describe('svg round-trip', () => {
  it('parses rect and emits stroked path', () => {
    const input = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect x="10" y="20" width="30" height="40" />
</svg>`
    const g = parseSvg(input)
    expect(g.paths).toHaveLength(1)
    const ring = g.paths[0]?.rings[0]
    expect(ring?.[0] && equalsVec2(ring[0], vec2(10, 20))).toBe(true)

    const out = toSvg(g, { viewBox: '0 0 100 100' })
    expect(out).toContain('fill="none"')
    expect(out).toContain('<path')
    expect(out).not.toMatch(/fill="(?!none)[^"]+"/)

    const again = parseSvg(out)
    expect(again.paths[0]?.rings[0]?.length).toBe(4)
  })

  it('parses polyline as open path', () => {
    const g = parseSvg(
      `<svg><polyline points="0,0 10,0 10,10" /></svg>`,
    )
    expect(g.paths[0]?.closed).toBe(false)
    expect(g.paths[0]?.rings[0]?.length).toBe(3)
  })

  it('parses polygon and line', () => {
    const g = parseSvg(`
      <svg>
        <polygon points="0 0 2 0 1 1" />
        <line x1="0" y1="0" x2="3" y2="4" />
      </svg>
    `)
    expect(g.paths).toHaveLength(2)
    expect(g.paths[0]?.closed).toBe(true)
    expect(g.paths[1]?.closed).toBe(false)
  })
})
