/**
 * Plotter-oriented SVG export (fill=none, stroke #000).
 */

void writeCaseSvg(String suite, String caseId, PShape shape, float viewMinX, float viewMinY, float viewW, float viewH) {
  File dir = new File(outDir, suite);
  dir.mkdirs();
  File file = new File(dir, caseId + ".svg");
  PrintWriter pw = createWriter(file.getAbsolutePath());
  pw.println("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
  pw.println("<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"" +
    viewMinX + " " + viewMinY + " " + viewW + " " + viewH + "\" fill=\"none\">");
  appendShapeSvg(pw, shape);
  pw.println("</svg>");
  pw.flush();
  pw.close();
  println("Wrote " + file.getAbsolutePath());
}

void appendShapeSvg(PrintWriter pw, PShape shape) {
  if (shape == null) return;
  int childCount = shape.getChildCount();
  if (childCount > 0) {
    for (int i = 0; i < childCount; i++) {
      appendShapeSvg(pw, shape.getChild(i));
    }
    return;
  }
  int vc = shape.getVertexCount();
  if (vc == 0) return;
  StringBuilder d = new StringBuilder();
  PVector v0 = shape.getVertex(0);
  d.append("M ").append(v0.x).append(" ").append(v0.y);
  for (int i = 1; i < vc; i++) {
    PVector v = shape.getVertex(i);
    d.append(" L ").append(v.x).append(" ").append(v.y);
  }
  // Close if polygon-like
  int family = shape.getFamily();
  if (family == PShape.PATH || family == PShape.GEOMETRY) {
    d.append(" Z");
  }
  pw.println("  <path d=\"" + d.toString() + "\" stroke=\"#000\" stroke-width=\"1\" fill=\"none\" />");
}

void writeLinesSvg(String suite, String caseId, ArrayList<PVector[]> segs, float viewMinX, float viewMinY, float viewW, float viewH) {
  File dir = new File(outDir, suite);
  dir.mkdirs();
  File file = new File(dir, caseId + ".svg");
  PrintWriter pw = createWriter(file.getAbsolutePath());
  pw.println("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
  pw.println("<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"" +
    viewMinX + " " + viewMinY + " " + viewW + " " + viewH + "\" fill=\"none\">");
  for (int i = 0; i < segs.size(); i++) {
    PVector[] s = segs.get(i);
    pw.println("  <path d=\"M " + s[0].x + " " + s[0].y + " L " + s[1].x + " " + s[1].y +
      "\" stroke=\"#000\" stroke-width=\"1\" fill=\"none\" />");
  }
  pw.println("</svg>");
  pw.flush();
  pw.close();
  println("Wrote " + file.getAbsolutePath());
}
