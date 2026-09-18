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
  obstaclePack,
  frontChainPack,
  repulsionPack,
  circleOverlapsPath,
  circleContainedInPath,
} from './circlePacking/index.js'
export type { LatticePackMode } from './circlePacking/index.js'

export { morphology, buffer, erosionDilation, dilationErosion, simplify, reducePrecision, chaikinCut, smooth, radialWarp, sineWarp, minkSum, minkDifference } from './morphology/index.js'
export type { BufferOptions } from './morphology/index.js'

export {
  transformation,
  translate,
  translateToOrigin,
  translateCentroidTo,
  translateCornerTo,
  rotate,
  rotateAroundCenter,
  scale,
  originScale,
  flipHorizontal,
  flipVertical,
  resizeByWidth,
  resizeByHeight,
  shear,
} from './transformation/index.js'

export {
  processing,
  extractPerimeter,
  extractBoundary,
  extractHoles,
  densify,
  removeSmallHoles,
  generateRandomPoints,
  generateRandomGridPoints,
  pointsOnExterior,
  segmentsOnExterior,
  slice,
  centroidSplit,
  dissolve,
  intersectionPoints,
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

export { hull, convexHull, convexHullPath, boundingBox } from './hull/index.js'

export {
  triangulation,
  earCutTriangulation,
  delaunayTriangulation,
  delaunayTriangulationPoints,
  poissonTriangulation,
  poissonTriangulationPoints,
  refine,
} from './triangulation/index.js'

export type { RefineOptions } from './triangulation/index.js'

export {
  pointSet,
  random as randomPoints,
  squareGrid,
  hexGrid,
  ring as pointRing,
  poisson,
  prunePointsWithinDistance,
} from './pointSet/index.js'

export {
  optimisation,
  envelope,
  maximumInscribedCircle,
  largestEmptyCircle,
  largestEmptyCircles,
  maximumInscribedAARectangle,
  closestPoint,
  closestVertex,
  closestPointPair,
  farthestPointPair,
  minimumBoundingCircle,
} from './optimisation/index.js'

export {
  voronoi,
  compoundVoronoi,
  innerVoronoi,
  innerVoronoiRaw,
} from './voronoi/index.js'
export type { VoronoiOptions } from './voronoi/index.js'

export {
  construction,
  createCircle,
  createRect,
  createRegularPolygon,
  createRing,
  createArc,
  createStar,
  createKochSnowflake,
} from './construction/index.js'

export {
  tiling,
  squareGrid as squareTiling,
  hexTiling,
  rectSubdivision,
  quadSubdivision,
  triangleSubdivision,
  sliceDivision,
  hatchSubdivision,
} from './tiling/index.js'

export {
  polygonisation,
  maxArea,
  minArea,
  minPerimeter,
  horizontal as polygoniseHorizontal,
  vertical as polygoniseVertical,
  angular,
  circular,
  onion,
  onionLayers,
  hilbert as hilbertPolygonise,
} from './polygonisation/index.js'

export {
  meshing,
  extractInnerEdges,
  extractInnerVertices,
  findContainingFace,
  splitEdges,
  urquhartFaces,
  gabrielFaces,
  relativeNeighborFaces,
  spannerFaces,
  dualFaces,
  centroidQuadrangulation,
  edgeCollapseQuadrangulation,
  splitQuadrangulation,
  spiralQuadrangulation,
  matchingQuadrangulation,
  smoothMesh,
  subdivideMesh,
  simplifyMesh,
  stochasticMerge,
  areaMerge,
  radialSortFaces,
  centroidSortFaces,
  findBreaks,
  fixBreaks,
  fixBrokenFaces,
  findIslands,
} from './meshing/index.js'
