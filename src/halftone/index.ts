export type { ToneField, FromRgbaOptions } from './toneField.js'
export {
  fromRgba,
  fromLuminance,
  sample,
  sampleNearest,
} from './toneField.js'

export type { HalftoneLinesOptions } from './lines.js'
export { lines } from './lines.js'

export type { HalftoneCirclesOptions } from './circles.js'
export { circles } from './circles.js'

import { fromRgba, fromLuminance, sample, sampleNearest } from './toneField.js'
import { lines } from './lines.js'
import { circles } from './circles.js'

/** Exclusive mark modes: pick `lines` or `circles` (not both in one pass). */
export const halftone = {
  fromRgba,
  fromLuminance,
  sample,
  sampleNearest,
  lines,
  circles,
}
