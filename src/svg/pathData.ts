import type { Ring } from '../types/index.js'
import { normalizeRing, vec2 } from '../types/index.js'

/**
 * Minimal SVG path `d` tokenizer for plotter-oriented paths.
 * Supports M/m L/l H/h V/v Z/z. Curves are rejected with a clear error (Phase 1).
 */
export function parsePathData(d: string): { rings: Ring[]; closed: boolean } {
  const tokens = tokenize(d)
  const rings: Ring[] = []
  let current: Ring = []
  let cx = 0
  let cy = 0
  let startX = 0
  let startY = 0
  let sawClose = false
  let i = 0

  const pushPoint = (x: number, y: number) => {
    current.push(vec2(x, y))
    cx = x
    cy = y
  }

  const finishSubpath = () => {
    if (current.length === 0) return
    const ring = normalizeRing(current)
    if (ring.length > 0) rings.push(ring)
    current = []
  }

  while (i < tokens.length) {
    const raw = tokens[i]
    if (raw === undefined) break
    i += 1

    if (!/^[MmLlHhVvZz]$/.test(raw)) {
      throw new Error(
        `Unsupported SVG path command or token "${raw}". Phase 1 supports M/L/H/V/Z only.`,
      )
    }

    const relative = raw === raw.toLowerCase()
    const kind = raw.toUpperCase()

    if (kind === 'Z') {
      sawClose = true
      finishSubpath()
      cx = startX
      cy = startY
      continue
    }

    if (kind === 'M') {
      finishSubpath()
      const pair = readPair(tokens, i)
      i = pair.next
      const x = relative ? cx + pair.x : pair.x
      const y = relative ? cy + pair.y : pair.y
      pushPoint(x, y)
      startX = x
      startY = y
      while (i < tokens.length && isNumberToken(tokens[i])) {
        const next = readPair(tokens, i)
        i = next.next
        const nx = relative ? cx + next.x : next.x
        const ny = relative ? cy + next.y : next.y
        pushPoint(nx, ny)
      }
      continue
    }

    if (kind === 'L') {
      while (i < tokens.length && isNumberToken(tokens[i])) {
        const pair = readPair(tokens, i)
        i = pair.next
        const x = relative ? cx + pair.x : pair.x
        const y = relative ? cy + pair.y : pair.y
        pushPoint(x, y)
      }
      continue
    }

    if (kind === 'H') {
      while (i < tokens.length && isNumberToken(tokens[i])) {
        const v = readNumber(tokens, i)
        i = v.next
        const x = relative ? cx + v.value : v.value
        pushPoint(x, cy)
      }
      continue
    }

    if (kind === 'V') {
      while (i < tokens.length && isNumberToken(tokens[i])) {
        const v = readNumber(tokens, i)
        i = v.next
        const y = relative ? cy + v.value : v.value
        pushPoint(cx, y)
      }
    }
  }

  finishSubpath()
  return { rings, closed: sawClose }
}

export function serializePathData(rings: Ring[], closed: boolean): string {
  const parts: string[] = []
  for (const ring of rings) {
    if (ring.length === 0) continue
    const first = ring[0]
    if (!first) continue
    parts.push(`M ${fmt(first.x)} ${fmt(first.y)}`)
    for (let i = 1; i < ring.length; i += 1) {
      const p = ring[i]
      if (!p) continue
      parts.push(`L ${fmt(p.x)} ${fmt(p.y)}`)
    }
    if (closed) parts.push('Z')
  }
  return parts.join(' ')
}

function tokenize(d: string): string[] {
  const out: string[] = []
  const re = /([MmLlHhVvZz])|([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(d)) !== null) {
    const token = m[1] ?? m[2]
    if (token) out.push(token)
  }
  return out
}

function isNumberToken(token: string | undefined): boolean {
  return token !== undefined && /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(token)
}

function readNumber(tokens: string[], i: number): { value: number; next: number } {
  const t = tokens[i]
  if (!isNumberToken(t) || t === undefined) {
    throw new Error(`Expected number in path data at token index ${i}`)
  }
  return { value: Number(t), next: i + 1 }
}

function readPair(
  tokens: string[],
  i: number,
): { x: number; y: number; next: number } {
  const x = readNumber(tokens, i)
  const y = readNumber(tokens, x.next)
  return { x: x.value, y: y.value, next: y.next }
}

function fmt(n: number): string {
  if (Number.isInteger(n)) return String(n)
  return String(Number(n.toPrecision(12)))
}
