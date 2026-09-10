/**
 * Circle packing smoke cases.
 */

void runPackingCases(String filter) {
  if (caseMatches("square-lattice-unit-square", filter)) {
    runSquareLatticeUnitSquare();
  }
  if (caseMatches("hex-lattice-unit-square", filter)) {
    runHexLatticeUnitSquare();
  }
}

PShape loadUnitSquare() {
  String text = loadFixtureText("packing", "unit-square.json");
  ArrayList<float[][]> rings = extractRings(text);
  float[][] r = rings.get(0);
  PVector[] pts = new PVector[r.length];
  for (int i = 0; i < r.length; i++) {
    pts[i] = new PVector(r[i][0], r[i][1]);
  }
  return shapeFromRing(pts);
}

void runSquareLatticeUnitSquare() {
  PShape cell = loadUnitSquare();
  double diameter = 0.25;
  java.util.List<PVector> circles = PGS_CirclePacking.squareLatticePack(cell, diameter);
  writePackingCase("packing", "square-lattice-unit-square", "circlePacking.squareLatticePack", circles);
}

void runHexLatticeUnitSquare() {
  PShape cell = loadUnitSquare();
  double diameter = 0.25;
  java.util.List<PVector> circles = PGS_CirclePacking.hexLatticePack(cell, diameter);
  writePackingCase("packing", "hex-lattice-unit-square", "circlePacking.hexLatticePack", circles);
}

void writePackingCase(String suite, String caseId, String operation, java.util.List<PVector> circles) {
  ArrayList<PVector> circleList = new ArrayList<PVector>(circles);
  writeCaseJson(suite, caseId, operation, 1, null, null, circleList, 0);
  writeCirclesSvg(suite, caseId, circleList, -0.2, -0.2, 1.4, 1.4);
}

void writeCirclesSvg(String suite, String caseId, ArrayList<PVector> circles, float viewMinX, float viewMinY, float viewW, float viewH) {
  File dir = new File(outDir, suite);
  dir.mkdirs();
  File file = new File(dir, caseId + ".svg");
  PrintWriter pw = createWriter(file.getAbsolutePath());
  pw.println("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
  pw.println("<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"" +
    viewMinX + " " + viewMinY + " " + viewW + " " + viewH + "\" fill=\"none\">");
  for (int i = 0; i < circles.size(); i++) {
    PVector c = circles.get(i);
    pw.println("  <circle cx=\"" + c.x + "\" cy=\"" + c.y + "\" r=\"" + c.z +
      "\" stroke=\"#000\" stroke-width=\"0.01\" fill=\"none\" />");
  }
  pw.println("</svg>");
  pw.flush();
  pw.close();
  println("Wrote " + file.getAbsolutePath());
}
