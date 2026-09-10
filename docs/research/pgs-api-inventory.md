---
title: "PGS API inventory"
status: active
owners: []
created: 2026-09-10
updated: 2026-09-10
version: 0.2.0
---

# PGS API inventory

## Goal

Inventory every public facade method from PGS javadoc (2.3-SNAPSHOT index) and tag priority for the TypeScript port, subject to [pen-plotter constraints](../decisions/0002-pen-plotter-output.md).

## Questions

- What is the full public surface?
- What is out of scope (animation)?
- What ships first for SVG fills / overlaps?

## Sources

| Source | Type | Notes |
|--------|------|-------|
| https://micycle1.github.io/PGS/index-all.html | Javadoc index | Scraped 2026-09-10 |
| https://micycle1.github.io/PGS/micycle/pgs/package-summary.html | Package summary | Facade list |

## Legend

| Tag | Meaning |
|-----|---------|
| P0 | Core for SVG fills, hatching, packing, overlap cutting |
| P1 | Needed soon (morphology, processing, predicates, conversion) |
| P2 | Full parity later |
| SKIP | Not useful as plotter output (solid paint / screen-only); still document — see ADR 0002 skip log |
| PLOT | Prefer stroke-mark interpretation when porting (hatch, outlines) |

**Scope:** geometric methods are in scope for parity unless **SKIP** for plotter product reasons. Morph-at-`t` remains in scope as geometry. No animation API. Solid fills and face-color shading are **SKIP** as deliverable fills; underlying geometry (boundaries, regions for hatching) may still be used.

**Priority:** ~384 unique method names across 19 classes (overloads collapsed by name).

---

## Findings

### PGS_CirclePacking — P0

- `frontChainPack`
- `hexLatticePack`
- `maximumInscribedPack`
- `obstaclePack`
- `repulsionPack`
- `squareLatticePack`
- `stochasticPack`
- `tangencyPack` (needs triangulation type; port after triangulation)
- `trinscribedPack`

### PGS_SegmentSet — P0

- `parallelSegments` — primary hatch generator
- `getPolygonInteriorSegments` — crop segments to polygon
- `perpendicularPathSegments`
- `weaveSegments`
- `nodedSegments`, `stochasticSegments`, `graphMatchedSegments`
- `toPShape`, `fromPShape`, `dissolve`, `toBag`
- `intersections`, `stretch`
- `filterByMinLength`, `filterByAverageLength`, `filterAxisAligned`, `filterNear`

### PGS_ShapeBoolean — P0

- `intersect`, `intersectMesh`
- `union`, `unionMesh`, `unionLines`, `unionCircles`
- `subtract`, `subtractMesh`, `simpleSubtract`
- `symDifference`, `complement`
- `occlusionSubtract` — z-order visible regions
- `overlapRegions` — multi-cover regions

### PGS_ShapePredicates — P1 (containment/area used by packing & fills)

- Metrics: `area`, `length`, `width`, `height`, `diameter`, `centroid`, `boundsCenter`, `median`, `holes`, `vertexCount`
- Shape descriptors: `circularity`, `sphericity`, `elongation`, `convexity`, `density`, `similarity`, `efdSimilarity`
- Angles: `interiorAngles`, `maximumInteriorAngle`, `minimumInteriorAngle`
- Predicates: `contains`, `containsPoint`, `containsPoints`, `containsAllPoints`, `findContainedPoints`, `findContainingShape`, `intersect`, `overlap`, `touch`
- Topology checks: `isValid`, `isSimple`, `isConvex`, `isClockwise`, `isConformingMesh`
- Equality: `equalsExact`, `equalsNorm`, `equalsTopo`
- Distance: `distance`

### PGS_Processing — P1

- Perimeter: `extractPerimeter`, `extractBoundary`, `extractHoles`, `pointOnExterior`, `pointOnExteriorByDistance`, `pointsOnExterior`, `segmentsOnExterior`, `tangentAngle`
- Partition / cut: `slice`, `split`, `convexPartition`, `equalPartition`, `trapezoidPartition`, `centroidSplit`
- Cleanup: `densify`, `dissolve`, `eliminateSlivers`, `removeSmallHoles`, `fix`, `normalise`, `nest`, `polygonize`
- Points in shape: `generateRandomPoints`, `generateRandomGridPoints`, `intersectionPoints`
- Traversal helpers: `apply`, `applyWithIndex`, `forEachShape`, `forEachShapeWithIndex`, `filterChildren`, `transform`, `transformWithIndex`

### PGS_Morphology — P1 (static ops; no animation runner)

- Buffer family: `buffer`, `variableBuffer`, `dilationErosion`, `erosionDilation`, `normalisedErosion`, `minkSum`, `minkDifference`
- Simplify / smooth: `simplify`, `simplifyVW`, `simplifyDCE`, `simplifyHobby`, `simplifyTopology`, `smooth`, `smoothGaussian`, `smoothGaussianNormalised`, `smoothLaneRiesenfeld`, `smoothBezierFit`, `smoothEllipticFourier`, `chaikinCut`, `round`, `regularise`, `reducePrecision`
- Warp: `radialWarp`, `sineWarp`, `fieldWarp`, `pinchWarp`, `arapDeform`
- Morph-at-t: `interpolate`, `dilationMorph`, `voronoiMorph`

### PGS_Conversion — P1 (replace PShape bridges with SVG / portable types)

- Style: `setAllFillColor`, `setAllStrokeColor`, `setAllStrokeToFillColor`, `disableAllFill`, `disableAllStroke`, `getFillColor`, `getShapeStylingData`, `PRESERVE_STYLE`
- Structure: `copy`, `flatten`, `fromChildren`, `getChildren`, `reorderChildren`, `fromContours`, `toContours`, `roundVertexCoords`
- Geometry bridges: `fromPShape`, `toPShape`, `toPathPShape`, `toPolygonPShape`, `toPointsPShape`, `toCircles`, `fromPVector`, `toPVector`, `fromArray`, `toArray`
- Interchange: `fromWKT`, `toWKT`, `fromWKB`, `toWKB`, `fromHexWKB`, `toHexWKB`, `fromEncodedPolyline`, `toEncodedPolyline`, `fromJava2D`, `toJava2D`, `fromCubicBezier`, `fromQuadraticBezier`, `fromGraph`, `toGraph`, `toDualGraph`, `toCentroidDualGraph`
- Flags: `FLOAT_SAFE_MESH_CONVERSION`, `HANDLE_MULTICONTOUR`

### PGS_Contour — P2 (offset useful earlier if needed for stroke fills)

- `offsetCurvesInward`, `offsetCurvesOutward`
- `straightSkeleton`, `medialAxis`, `chordalAxis`, `centerLine`
- `isolines`, `isolinesFromFunction`, `isolineZeroFromFunction`
- `distanceField`, `distanceTree`, `contrastField`

### PGS_Hull — P2

- `convexHull`, `concaveHull`, `concaveHullBFS`, `concaveHullBFS2`, `concaveHullDFS`, `snapHull`, `boundingBox`

### PGS_Meshing — P2

- Faces from graphs: `urquhartFaces`, `gabrielFaces`, `relativeNeighborFaces`, `spannerFaces`, `dualFaces`
- Quadrangulation: `centroidQuadrangulation`, `edgeCollapseQuadrangulation`, `splitQuadrangulation`, `spiralQuadrangulation`, `matchingQuadrangulation`
- Process: `smoothMesh`, `subdivideMesh`, `simplifyMesh`, `stochasticMerge`, `areaMerge`, `splitEdges`, `nodeNonMesh`
- Extract / repair: `extractInnerEdges`, `extractInnerVertices`, `findBreaks`, `fixBreaks`, `fixBrokenFaces`, `findContainingFace`, `findIslands`

### PGS_Optimisation — P2 (envelope / MIC used by packing → elevate those to P1 when implementing packing)

- Inscribed: `maximumInscribedCircle`, `convexMaximumInscribedCircle`, `maximumInscribedRectangle`, `maximumInscribedAARectangle`, `maximumInscribedTriangle`, `maximumPerimeterSquare`, `largestEmptyCircle`, `largestEmptyCircles`
- Bounding: `envelope`, `minimumAreaRectangle`, `minimumWidthRectangle`, `minimumBoundingCircle`, `minimumBoundingEllipse`, `minimumBoundingTriangle`, `minimumDiameter`, `minimumWidthAnnulus`
- Distance / pairs: `closestPoint`, `closestPoints`, `closestVertex`, `closestPointPair`, `farthestPoint`, `farthestVertex`, `farthestPointPair`
- Other: `visibilityPolygon`, `solveApollonius`, `circleCoverage`, `binPack`, `rectPack`, `hilbertSortFaces`, `spiralSortFaces`, `radialSortFaces`, `centroidSortFaces`

### PGS_PointSet — P2 (poisson / random used by examples → P1 helpers as needed)

- Distributions: `random`, `gaussian`, `squareGrid`, `hexGrid`, `hexagon`, `ring`, `phyllotaxis`, `poisson`, `poissonN`, `thomasClusters`
- LDS: `haltonLDS`, `hammersleyLDS`, `plasticLDS`, `plasticJitteredLDS`, `sobolLDS`, `nRooksLDS`
- Ops: `hilbertSort`, `cluster`, `kCenters`, `weightedMedian`, `minimumSpanningTree`, `findShortestTour`, `applyRandomWeights`
- Prune: `prunePointsWithinDistance`, `pruneSparsePoints`, `pruneRandomRemoveN`, `pruneRandomToN`

### PGS_Polygonisation — P2

- `maxArea`, `minArea`, `minPerimeter`, `hilbert`, `horizontal`, `vertical`, `circular`, `angular`, `onion`

### PGS_Tiling — P2 (`hatchSubdivision` related to fills but not path hatching)

- Subdivisions: `quadSubdivision`, `rectSubdivision`, `triangleSubdivision`, `hatchSubdivision`, `sliceDivision`, `arcDivision`
- Tilings: `squareGrid`, `hexTiling`, `doyleSpiral`, `islamicTiling`, `penroseTiling`, `squareTriangleTiling`, `annularBricks`, `aztecDiamond`, `auxeticTiling`, `softCells`

### PGS_Transformation — P1

- `translate`, `translateTo`, `translateToOrigin`, `translateCentroidTo`, `translateCornerTo`, `translateEnvelopeTo`
- `rotate`, `rotateAroundCenter`
- `scale`, `originScale`, `scaleArea`, `scaleAreaTo`, `resize`, `resizeByWidth`, `resizeByHeight`, `resizeByMajorAxis`, `touchScale`
- `shear`, `homotheticTransformation`, `align`, `flipHorizontal`, `flipVertical`

### PGS_Triangulation — P2 (needed before some packing / meshing)

- `delaunayTriangulation`, `delaunayTriangulationMesh`, `delaunayTriangulationPoints`
- `earCutTriangulation`
- `poissonTriangulation`, `poissonTriangulationMesh`, `poissonTriangulationPoints`
- `refine`, `toPShape`, `toGraph`, `toDualGraph`, `toTinfourGraph`

### PGS_Voronoi — P2

- `innerVoronoi`, `innerVoronoiRaw`, `compoundVoronoi`
- `manhattanVoronoi`, `additivelyWeightedVoronoi`, `multiplicativelyWeightedVoronoi`
- `farthestPointVoronoi`, `powerDiagram`

### PGS_Coloring — P2 / SKIP as plotter fill

- `colorMesh`, `colorNonMesh`, `SEED`
- **SKIP (plotter fill):** colored face fills. Optional later: stroke face edges only. Logged in [ADR 0002](../decisions/0002-pen-plotter-output.md).

### PGS_Construction — P2

- Circles / polys: `createCircle`, `createRect`, `createRegularPolygon`, `createRing`, `createArc`, `createStar`, `createHeart`, `createTeardrop`, `createArbelos`, `createTaijitu`, `createGear`
- Superforms: `createSupercircle`, `createSuperShape`, `createBlobbie`, `createSponge`
- Spirals / curves: `createLinearSpiral`, `createFermatSpiral`, `createRectangularSpiral`, `createHobbyCurve`, `createHilbertCurve`
- Fractals: `createKochSnowflake`, `createSierpinskiCarpet`, `createSierpinskiCurve`, `createSierpinskiTriCurve`, `createRandomSFCurve`
- Random polys: `createRandomPolygon`, `createRandomPolygonExact`, `createRandomBezierPolygon`, `createSuperRandomPolygon`

### Nested types / enums (port as TS unions or const enums)

- `Coloring.ColoringAlgorithm`: DBLAC, DSATUR, GENETIC, LARGEST_DEGREE_FIRST, RANDOM, RLF, RLF_BRUTE_FORCE_4COLOR, SMALLEST_DEGREE_LAST
- `Construction.SierpinskiTriCurveType`: TRI, TETRA, PENTA, DECA
- `Contour.OffsetStyle`: MITER, BEVEL, ROUND
- `Morphology.CapStyle`: FLAT, ROUND, SQUARE
- `Optimisation.RectPackHeuristic`: BestAreaFit, TopRightCornerDistance, TouchingPerimeter
- `SegmentSet.SegmentLengthFn`: functional length callback

## Open questions

- Whether `Conversion` WKB/WKT/Java2D bridges are needed for v1 npm API (SVG-first may defer them).
- Tinfour-equivalent representation for `tangencyPack` inputs in TS.

## Next steps

- Use this checklist as the Phase 6 completion gate.
- Mark methods covered in unit/oracle tests as they land.

## Document history

| Version | Date       | Author | Summary                                      |
|---------|------------|--------|----------------------------------------------|
| 0.1.0   | 2026-09-10 | agent  | Full facade inventory from javadoc index     |
| 0.2.0   | 2026-09-10 | agent  | Pen-plotter SKIP tags; coloring note         |
