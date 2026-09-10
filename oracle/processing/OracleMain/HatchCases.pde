/**
 * Hatch smoke: parallel segments cropped to a unit square via intersect.
 */

void runHatchCases(String filter) {
  if (caseMatches("parallel-45-unit-square", filter)) {
    runParallel45UnitSquare();
  }
}

void runParallel45UnitSquare() {
  String text = loadFixtureText("hatch", "unit-square.json");
  ArrayList<float[][]> rings = extractRings(text);
  if (rings.size() < 1) {
    throw new RuntimeException("unit-square fixture missing ring");
  }
  float[][] r = rings.get(0);
  PVector[] pts = new PVector[r.length];
  for (int i = 0; i < r.length; i++) {
    pts[i] = new PVector(r[i][0], r[i][1]);
  }
  PShape cell = shapeFromRing(pts);

  float cx = 0.5;
  float cy = 0.5;
  float length = 2.0;
  float spacing = 0.15;
  float angle = PI / 4;
  int n = 30;

  java.util.List<micycle.pgs.commons.PEdge> edges =
    PGS_SegmentSet.parallelSegments(cx, cy, length, spacing, angle, n);
  PShape lines = PGS_SegmentSet.toPShape(edges);
  PShape cropped = PGS_ShapeBoolean.intersect(cell, lines);

  ArrayList<PVector[]> pathRings = shapeToPathRings(cropped);
  ArrayList<PVector[]> lineSegs = new ArrayList<PVector[]>();
  // Prefer exporting as line pairs from cropped children when possible
  for (int i = 0; i < pathRings.size(); i++) {
    PVector[] ring = pathRings.get(i);
    if (ring.length >= 2) {
      lineSegs.add(new PVector[]{ring[0], ring[ring.length - 1]});
    }
  }

  writeCaseJson("hatch", "parallel-45-unit-square", "segmentSet.parallelSegments+intersect", 1,
    pathRings, lineSegs, null, shapeAreaSafe(cropped));
  writeLinesSvg("hatch", "parallel-45-unit-square",
    lineSegs.size() > 0 ? lineSegs : pathRingsAsSegments(pathRings),
    -0.1, -0.1, 1.2, 1.2);
}

ArrayList<PVector[]> pathRingsAsSegments(ArrayList<PVector[]> rings) {
  ArrayList<PVector[]> segs = new ArrayList<PVector[]>();
  for (int i = 0; i < rings.size(); i++) {
    PVector[] ring = rings.get(i);
    for (int j = 0; j + 1 < ring.length; j++) {
      segs.add(new PVector[]{ring[j], ring[j + 1]});
    }
  }
  return segs;
}
