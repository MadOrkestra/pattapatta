#!/usr/bin/env bash
# Run the PGS oracle sketch via Processing CLI.
# See docs/research/processing-cli.md
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
SKETCH="$ROOT/oracle/processing/OracleMain"
OUT="$ROOT/tests/oracle"
FIXTURES="$ROOT/tests/fixtures"
PROCESSING_BIN="${PROCESSING:-processing}"

SUITE=""
CASE=""
ALL=0
SEED=""
COMPARE=0

usage() {
  sed -n '1,40p' "$ROOT/oracle/processing/README.md"
  cat <<EOF

Flags:
  --out <dir>         Golden output root (default: tests/oracle)
  --fixtures <dir>    Fixture root (default: tests/fixtures)
  --suite <name>      boolean | hatch | …
  --case <id>         Single case id within suite
  --all               Run all registered cases
  --seed <n>          RNG seed override
  --compare           Reserved (Phase 2+); currently ignored
  -h, --help          Show help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --out) OUT="$2"; shift 2 ;;
    --fixtures) FIXTURES="$2"; shift 2 ;;
    --suite) SUITE="$2"; shift 2 ;;
    --case) CASE="$2"; shift 2 ;;
    --all) ALL=1; shift ;;
    --seed) SEED="$2"; shift 2 ;;
    --compare) COMPARE=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown flag: $1" >&2; usage; exit 1 ;;
  esac
done

if [[ "$ALL" -eq 0 && -z "$SUITE" ]]; then
  echo "Specify --all or --suite <name>" >&2
  exit 1
fi

if ! command -v "$PROCESSING_BIN" >/dev/null 2>&1; then
  echo "Processing binary not found (PROCESSING=$PROCESSING_BIN)." >&2
  echo "Install Processing 4 and ensure 'processing' is on PATH." >&2
  exit 1
fi

mkdir -p "$OUT"

# Absolute paths required by processing cli.
SKETCH="$(cd "$SKETCH" && pwd)"
OUT="$(mkdir -p "$OUT" && cd "$OUT" && pwd)"
FIXTURES="$(cd "$FIXTURES" && pwd)"

ARGS=(--out "$OUT" --fixtures "$FIXTURES")
if [[ "$ALL" -eq 1 ]]; then
  ARGS+=(--all)
else
  ARGS+=(--suite "$SUITE")
  if [[ -n "$CASE" ]]; then
    ARGS+=(--case "$CASE")
  fi
fi
if [[ -n "$SEED" ]]; then
  ARGS+=(--seed "$SEED")
fi
if [[ "$COMPARE" -eq 1 ]]; then
  ARGS+=(--compare)
fi

echo "Using: $PROCESSING_BIN ($("$PROCESSING_BIN" --version 2>/dev/null || true))"
echo "Sketch: $SKETCH"
echo "Args: ${ARGS[*]}"

# --run must be last Processing flag; remaining args go to the sketch.
exec "$PROCESSING_BIN" cli --sketch="$SKETCH" --run "${ARGS[@]}"
