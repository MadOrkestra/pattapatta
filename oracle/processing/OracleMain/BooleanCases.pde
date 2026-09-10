/**
 * Boolean smoke cases using PGS_ShapeBoolean.
 */

void runBooleanCases(String filter) {
  if (caseMatches("union-two-rects", filter)) {
    runUnionTwoRects();
  }
  if (caseMatches("subtract-two-rects", filter)) {
    runSubtractTwoRects();
  }
  if (caseMatches("occlusion-two-rects", filter)) {
    runOcclusionTwoRects();
  }
}

PShape[] loadTwoRects() {
  ArrayList<PVector[]> rings = parseTwoRectFixture("boolean", "two-rects.json");
  PShape a = shapeFromRing(rings.get(0));
  PShape b = shapeFromRing(rings.get(1));
  return new PShape[]{a, b};
}

ArrayList<PVector[]> shapeToPathRings(PShape shape) {
  ArrayList<PVector[]> out = new ArrayList<PVector[]>();
  collectRings(shape, out);
  return out;
}

void collectRings(PShape shape, ArrayList<PVector[]> out) {
  if (shape == null) return;
  int n = shape.getChildCount();
  if (n > 0) {
    for (int i = 0; i < n; i++) {
      collectRings(shape.getChild(i), out);
    }
    return;
  }
  int vc = shape.getVertexCount();
  if (vc < 2) return;
  PVector[] ring = new PVector[vc];
  for (int i = 0; i < vc; i++) {
    ring[i] = shape.getVertex(i).copy();
  }
  out.add(ring);
}

float shapeAreaSafe(PShape shape) {
  try {
    return (float) PGS_ShapePredicates.area(shape);
  } catch (Exception e) {
    return 0;
  }
}

void runUnionTwoRects() {
  PShape[] ab = loadTwoRects();
  PShape result = PGS_ShapeBoolean.union(ab[0], ab[1]);
  ArrayList<PVector[]> paths = shapeToPathRings(result);
  writeCaseJson("boolean", "union-two-rects", "shapeBoolean.union", 1,
    paths, null, null, shapeAreaSafe(result));
  writeCaseSvg("boolean", "union-two-rects", result, -0.5, -0.5, 4, 2);
}

void runSubtractTwoRects() {
  PShape[] ab = loadTwoRects();
  PShape result = PGS_ShapeBoolean.subtract(ab[0], ab[1]);
  ArrayList<PVector[]> paths = shapeToPathRings(result);
  writeCaseJson("boolean", "subtract-two-rects", "shapeBoolean.subtract", 1,
    paths, null, null, shapeAreaSafe(result));
  writeCaseSvg("boolean", "subtract-two-rects", result, -0.5, -0.5, 4, 2);
}

void runOcclusionTwoRects() {
  PShape[] ab = loadTwoRects();
  PShape g = createShape(GROUP);
  g.addChild(ab[0]);
  g.addChild(ab[1]); // last = on top
  PShape result = PGS_ShapeBoolean.occlusionSubtract(g);
  ArrayList<PVector[]> paths = shapeToPathRings(result);
  writeCaseJson("boolean", "occlusion-two-rects", "shapeBoolean.occlusionSubtract", 1,
    paths, null, null, shapeAreaSafe(result));
  writeCaseSvg("boolean", "occlusion-two-rects", result, -0.5, -0.5, 4, 2);
}
