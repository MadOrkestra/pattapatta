/**
 * Load fixture JSON (minimal parser for our schema) and write case JSON.
 * Avoids extra JSON libraries — fixtures are simple arrays of numbers.
 */

String loadFixtureText(String suite, String fileName) {
  File f = new File(fixturesDir, suite + "/" + fileName);
  if (!f.exists()) {
    throw new RuntimeException("Missing fixture: " + f.getAbsolutePath());
  }
  String[] lines = loadStrings(f.getAbsolutePath());
  return join(lines, "\n");
}

/** Extract first JSON number array-of-arrays for "rings" after a given path index heuristic. */
ArrayList<PVector[]> parseTwoRectFixture(String suite, String fileName) {
  String text = loadFixtureText(suite, fileName);
  // Expected shape: inputs.paths[0].rings[0] and paths[1].rings[0] as [[x,y],...]
  ArrayList<float[][]> rings = extractRings(text);
  if (rings.size() < 2) {
    throw new RuntimeException("Expected two path rings in fixture " + fileName);
  }
  ArrayList<PVector[]> out = new ArrayList<PVector[]>();
  for (int i = 0; i < 2; i++) {
    float[][] ring = rings.get(i);
    PVector[] pts = new PVector[ring.length];
    for (int j = 0; j < ring.length; j++) {
      pts[j] = new PVector(ring[j][0], ring[j][1]);
    }
    out.add(pts);
  }
  return out;
}

ArrayList<float[][]> extractRings(String text) {
  ArrayList<float[][]> rings = new ArrayList<float[][]>();
  // Find each "rings": [ [ [x,y], ... ] ] block — take the first inner ring only per path.
  int idx = 0;
  while (true) {
    int r = text.indexOf("\"rings\"", idx);
    if (r < 0) break;
    int lb = text.indexOf('[', r);
    if (lb < 0) break;
    // rings value is [ [ [x,y],... ] ] — parse first ring array of points
    int ringStart = text.indexOf('[', lb + 1);
    if (ringStart < 0) break;
    int ringEnd = findMatchingBracket(text, ringStart);
    if (ringEnd < 0) break;
    String ringBody = text.substring(ringStart + 1, ringEnd);
    rings.add(parsePointList(ringBody));
    idx = ringEnd + 1;
  }
  return rings;
}

float[][] parsePointList(String body) {
  ArrayList<float[]> pts = new ArrayList<float[]>();
  int i = 0;
  while (i < body.length()) {
    int a = body.indexOf('[', i);
    if (a < 0) break;
    int b = body.indexOf(']', a);
    if (b < 0) break;
    String pair = body.substring(a + 1, b).trim();
    // skip nested — only "x, y" pairs
    if (pair.indexOf('[') >= 0) {
      i = a + 1;
      continue;
    }
    String[] parts = splitTokens(pair, ", \t\n\r");
    if (parts.length >= 2) {
      pts.add(new float[]{Float.parseFloat(parts[0]), Float.parseFloat(parts[1])});
    }
    i = b + 1;
  }
  return pts.toArray(new float[pts.size()][]);
}

int findMatchingBracket(String s, int openIdx) {
  int depth = 0;
  for (int i = openIdx; i < s.length(); i++) {
    char c = s.charAt(i);
    if (c == '[') depth++;
    else if (c == ']') {
      depth--;
      if (depth == 0) return i;
    }
  }
  return -1;
}

PShape shapeFromRing(PVector[] ring) {
  PShape s = createShape();
  s.beginShape();
  for (int i = 0; i < ring.length; i++) {
    s.vertex(ring[i].x, ring[i].y);
  }
  s.endShape(CLOSE);
  return s;
}

void writeCaseJson(String suite, String caseId, String operation, long seed,
                   ArrayList<PVector[]> pathRings, ArrayList<PVector[]> lineSegs,
                   ArrayList<PVector> circles, float area) {
  File dir = new File(outDir, suite);
  dir.mkdirs();
  File file = new File(dir, caseId + ".json");
  PrintWriter pw = createWriter(file.getAbsolutePath());
  pw.println("{");
  pw.println("  \"id\": \"" + suite + "/" + caseId + "\",");
  pw.println("  \"seed\": " + seed + ",");
  pw.println("  \"operation\": \"" + operation + "\",");
  pw.println("  \"outputs\": {");
  pw.println("    \"paths\": " + pathsToJson(pathRings) + ",");
  pw.println("    \"lines\": " + linesToJson(lineSegs) + ",");
  pw.println("    \"circles\": " + circlesToJson(circles) + ",");
  pw.println("    \"scalars\": { \"area\": " + area + " }");
  pw.println("  }");
  pw.println("}");
  pw.flush();
  pw.close();
  println("Wrote " + file.getAbsolutePath());
}

String pathsToJson(ArrayList<PVector[]> pathRings) {
  if (pathRings == null || pathRings.size() == 0) return "[]";
  StringBuilder sb = new StringBuilder();
  sb.append("[");
  for (int i = 0; i < pathRings.size(); i++) {
    if (i > 0) sb.append(", ");
    sb.append("{ \"rings\": [");
    sb.append(ringToJson(pathRings.get(i)));
    sb.append("] }");
  }
  sb.append("]");
  return sb.toString();
}

String linesToJson(ArrayList<PVector[]> segs) {
  if (segs == null || segs.size() == 0) return "[]";
  StringBuilder sb = new StringBuilder();
  sb.append("[");
  for (int i = 0; i < segs.size(); i++) {
    if (i > 0) sb.append(", ");
    PVector[] s = segs.get(i);
    sb.append("[[");
    sb.append(s[0].x).append(", ").append(s[0].y);
    sb.append("], [");
    sb.append(s[1].x).append(", ").append(s[1].y);
    sb.append("]]");
  }
  sb.append("]");
  return sb.toString();
}

String circlesToJson(ArrayList<PVector> circles) {
  if (circles == null || circles.size() == 0) return "[]";
  StringBuilder sb = new StringBuilder();
  sb.append("[");
  for (int i = 0; i < circles.size(); i++) {
    if (i > 0) sb.append(", ");
    PVector c = circles.get(i);
    sb.append("{ \"x\": ").append(c.x)
      .append(", \"y\": ").append(c.y)
      .append(", \"r\": ").append(c.z).append(" }");
  }
  sb.append("]");
  return sb.toString();
}

String ringToJson(PVector[] ring) {
  StringBuilder sb = new StringBuilder();
  sb.append("[");
  for (int i = 0; i < ring.length; i++) {
    if (i > 0) sb.append(", ");
    sb.append("[").append(ring[i].x).append(", ").append(ring[i].y).append("]");
  }
  sb.append("]");
  return sb.toString();
}
