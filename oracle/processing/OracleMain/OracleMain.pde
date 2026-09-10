/**
 * PGS oracle sketch — batch golden exporter for pattapatta.
 * Folder name must match this file (OracleMain / OracleMain.pde).
 * Invoke: processing cli --sketch=<abs>/oracle/processing/OracleMain --run …
 * See docs/research/processing-cli.md
 */

import micycle.pgs.*;
import micycle.pgs.commons.PEdge;
import java.util.List;

String outDir;
String fixturesDir;
String suiteFilter = "";
String caseFilter = "";
boolean runAll = false;
long seedOverride = -1;

void setup() {
  size(200, 200);
  noLoop();

  parseOracleArgs();
  if (outDir == null || outDir.length() == 0) {
    outDir = sketchPath("../../tests/oracle");
  }
  if (fixturesDir == null || fixturesDir.length() == 0) {
    fixturesDir = sketchPath("../../tests/fixtures");
  }

  File outRoot = new File(outDir);
  if (!outRoot.exists()) {
    outRoot.mkdirs();
  }

  println("Oracle out=" + outDir);
  println("Oracle fixtures=" + fixturesDir);
  println("Oracle all=" + runAll + " suite=" + suiteFilter + " case=" + caseFilter);

  try {
    runSelectedCases();
  } catch (Exception e) {
    e.printStackTrace();
    exit();
    return;
  }

  println("Oracle finished.");
  exit();
}

void draw() {
}

void parseOracleArgs() {
  if (args == null) return;
  for (int i = 0; i < args.length; i++) {
    String a = args[i];
    if (a.equals("--out") && i + 1 < args.length) {
      outDir = args[++i];
    } else if (a.equals("--fixtures") && i + 1 < args.length) {
      fixturesDir = args[++i];
    } else if (a.equals("--suite") && i + 1 < args.length) {
      suiteFilter = args[++i];
    } else if (a.equals("--case") && i + 1 < args.length) {
      caseFilter = args[++i];
    } else if (a.equals("--all")) {
      runAll = true;
    } else if (a.equals("--seed") && i + 1 < args.length) {
      seedOverride = Long.parseLong(args[++i]);
    }
  }
}

void runSelectedCases() {
  boolean wantBoolean = runAll || suiteFilter.equals("boolean");
  boolean wantHatch = runAll || suiteFilter.equals("hatch");
  boolean wantPacking = runAll || suiteFilter.equals("packing");

  if (wantBoolean) {
    runBooleanCases(caseFilter);
  }
  if (wantHatch) {
    runHatchCases(caseFilter);
  }
  if (wantPacking) {
    runPackingCases(caseFilter);
  }

  if (!wantBoolean && !wantHatch && !wantPacking) {
    throw new RuntimeException("Unknown suite filter: " + suiteFilter);
  }
}

boolean caseMatches(String caseId, String filter) {
  return filter == null || filter.length() == 0 || filter.equals(caseId);
}
