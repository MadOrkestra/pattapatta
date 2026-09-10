export type {
  Vec2,
  Circle,
  Segment,
  Ring,
  Path,
  Group,
} from './types/index.js'

export {
  vec2,
  cloneVec2,
  equalsVec2,
  circle,
  circleCenter,
  segment,
  path,
  polyline,
  polygon,
  normalizeRing,
  clonePath,
  group,
  groupFromPaths,
  cloneGroup,
} from './types/index.js'

export { parseSvg, toSvg, parsePathData, serializePathData } from './svg/index.js'
export type { ToSvgOptions } from './svg/index.js'
