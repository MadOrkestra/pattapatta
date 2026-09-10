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

export {
  shapeBoolean,
  union,
  unionAll,
  intersect,
  subtract,
  subtractAll,
  symDifference,
  complement,
  occlusionSubtract,
  overlapRegions,
} from './shapeBoolean/index.js'

export {
  predicates,
  area,
  areaGroup,
  ringArea,
  centroid,
  containsPoint,
  bounds,
  width,
  height,
  areaSimilarity,
} from './predicates/index.js'

export {
  relativeAreaError,
  containmentAgreement,
  assertAreaClose,
  oraclePathsToGroup,
  ringsToPath,
} from './compare/index.js'
export type { OracleCase } from './compare/index.js'

export {
  segmentSet,
  parallelSegments,
  filterByMinLength,
  filterAxisAligned,
  segmentLength,
  segmentsToOpenPaths,
} from './segmentSet/index.js'
export { clipSegmentToPath, clipSegmentsToPath } from './segmentSet/clip.js'

export { hatch, parallel as hatchParallel, cross as hatchCross } from './hatch/index.js'
export type { ParallelHatchOptions } from './hatch/index.js'
