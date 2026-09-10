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

export {
  circlePacking,
  squareLatticePack,
  hexLatticePack,
  stochasticPack,
  maximumInscribedPack,
  maximumInscribedPackUntil,
  frontChainPack,
  repulsionPack,
  circleOverlapsPath,
} from './circlePacking/index.js'

export { morphology, buffer, erosionDilation, dilationErosion, simplify, reducePrecision } from './morphology/index.js'
export type { BufferOptions } from './morphology/index.js'

export {
  transformation,
  translate,
  translateToOrigin,
  translateCentroidTo,
  rotate,
  rotateAroundCenter,
  scale,
  originScale,
  flipHorizontal,
  flipVertical,
  resizeByWidth,
  resizeByHeight,
} from './transformation/index.js'

export {
  processing,
  extractPerimeter,
  extractHoles,
  densify,
  removeSmallHoles,
  generateRandomPoints,
} from './processing/index.js'

export {
  conversion,
  copy,
  flatten,
  roundVertexCoords,
  toArray,
  fromArray,
  toContours,
  fromContours,
} from './conversion/index.js'

export {
  contour,
  offsetCurvesOutward,
  offsetCurvesInward,
} from './contour/index.js'
