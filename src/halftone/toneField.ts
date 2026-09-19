/** Row-major darkness field: `1` = darkest (most ink), `0` = lightest. */
export type ToneField = {
  width: number
  height: number
  data: Float32Array
}

export type FromRgbaOptions = {
  /**
   * When true, light pixels become high darkness (ink).
   * Default `false`: dark pixels → high darkness.
   */
  invert?: boolean
}

/** Rec.709 luma on sRGB 0–255 channels (weights applied without linearization). */
const LUMA_R = 0.2126
const LUMA_G = 0.7152
const LUMA_B = 0.0722

/**
 * Build a tone field from packed RGBA (or RGBX) bytes, 4 bytes per pixel.
 */
export function fromRgba(
  data: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number,
  opts: FromRgbaOptions = {},
): ToneField {
  const w = Math.floor(width)
  const h = Math.floor(height)
  if (w < 1 || h < 1) {
    throw new Error('fromRgba: width and height must be ≥ 1')
  }
  const expected = w * h * 4
  if (data.length < expected) {
    throw new Error(
      `fromRgba: expected at least ${expected} bytes for ${w}×${h} RGBA, got ${data.length}`,
    )
  }

  const invert = opts.invert === true
  const out = new Float32Array(w * h)
  for (let i = 0; i < w * h; i++) {
    const o = i * 4
    const r = data[o]!
    const g = data[o + 1]!
    const b = data[o + 2]!
    const a = data[o + 3]! / 255
    const luma = (LUMA_R * r + LUMA_G * g + LUMA_B * b) / 255
    // Transparent → no ink
    let darkness = (1 - luma) * a
    if (invert) darkness = (1 - darkness) * a
    out[i] = darkness
  }
  return { width: w, height: h, data: out }
}

/** Build a tone field from row-major luminance floats in `[0,1]` (1 = white). */
export function fromLuminance(
  data: ArrayLike<number>,
  width: number,
  height: number,
  opts: FromRgbaOptions = {},
): ToneField {
  const w = Math.floor(width)
  const h = Math.floor(height)
  if (w < 1 || h < 1) {
    throw new Error('fromLuminance: width and height must be ≥ 1')
  }
  if (data.length < w * h) {
    throw new Error(
      `fromLuminance: expected at least ${w * h} samples, got ${data.length}`,
    )
  }
  const invert = opts.invert === true
  const out = new Float32Array(w * h)
  for (let i = 0; i < w * h; i++) {
    const luma = clamp01(data[i]!)
    out[i] = invert ? luma : 1 - luma
  }
  return { width: w, height: h, data: out }
}

/** Nearest-neighbor sample (integer coords, clamped). */
export function sampleNearest(field: ToneField, x: number, y: number): number {
  const ix = clampInt(Math.round(x), 0, field.width - 1)
  const iy = clampInt(Math.round(y), 0, field.height - 1)
  return field.data[iy * field.width + ix]!
}

/** Bilinear sample in image coordinates; outside the field returns `0`. */
export function sample(field: ToneField, x: number, y: number): number {
  const { width: w, height: h, data } = field
  if (x < 0 || y < 0 || x > w - 1 || y > h - 1) return 0
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const x1 = Math.min(x0 + 1, w - 1)
  const y1 = Math.min(y0 + 1, h - 1)
  const tx = x - x0
  const ty = y - y0
  const v00 = data[y0 * w + x0]!
  const v10 = data[y0 * w + x1]!
  const v01 = data[y1 * w + x0]!
  const v11 = data[y1 * w + x1]!
  const a = v00 * (1 - tx) + v10 * tx
  const b = v01 * (1 - tx) + v11 * tx
  return a * (1 - ty) + b * ty
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v))
}

function clampInt(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v | 0))
}
