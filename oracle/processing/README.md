# Processing oracle (Phase 1b)

Headless PGS golden generator for `pattapatta`. The sketch lives **in this repo**:

```text
oracle/processing/OracleMain/     # sketch folder (== OracleMain.pde)
  OracleMain.pde
  FixtureIO.pde
  SvgExport.pde
  BooleanCases.pde
  HatchCases.pde
  code/                           # optional sketch-local jars (e.g. PGS)
```

CLI details: [`docs/research/processing-cli.md`](../../docs/research/processing-cli.md).

## Requirements

- Processing 4.4.3+ available as `processing` on `PATH`
- **Geometry Suite for Processing (PGS)** either:
  - installed in the sketchbook (`~/Documents/Processing/libraries/GeometrySuiteForProcessing/…`), or
  - jars placed in `oracle/processing/OracleMain/code/` (GPL — oracle-only, not in npm pack).  
  Example (JitPack 2.2):  
  `curl -sL -o oracle/processing/OracleMain/code/PGS.jar https://jitpack.io/com/github/micycle1/PGS/2.2/PGS-2.2.jar`

## Run

From the repo root:

```bash
./oracle/processing/scripts/run-oracle.sh --all
./oracle/processing/scripts/run-oracle.sh --suite boolean --case union-two-rects
```

Manual:

```bash
processing cli --sketch="$PWD/oracle/processing/OracleMain" --run \
  --out "$PWD/tests/oracle" \
  --fixtures "$PWD/tests/fixtures" \
  --all
```

(`--run` must be the last Processing flag; args after it go to the sketch.)

## Output

`tests/oracle/<suite>/<case>.json` + `.svg` (`fill="none"`).

## Env

| Variable | Meaning |
|----------|---------|
| `PROCESSING` | Override path to the `processing` binary |
