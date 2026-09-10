---
title: "Processing CLI"
status: active
owners: []
created: 2026-09-10
updated: 2026-09-10
version: 1.0.0
---

# Processing CLI

## Goal

Document how to install, create, edit, build, run, and export Processing sketches from the terminal — the tooling path for the Phase 1b oracle in [processing-oracle-cli.md](../design/processing-oracle-cli.md).

## Questions

- What is the modern Processing 4 command-line surface (`processing` vs legacy `processing-java`)?
- How do you create and edit sketches without (or alongside) the PDE?
- How do you build, run, present, and export from the shell?
- How are sketch folders, libraries, and args structured for automation?

## Sources

| Source | Type | Notes |
|--------|------|-------|
| Live `processing --help` / `processing cli --help` on this machine | CLI | Processing **4.5.6-1434**; treated as source of truth |
| https://processing.org/environment/#command-line-interface-cli | Official docs | CLI overview + per-OS binary paths |
| https://github.com/processing/processing4/pull/1050 | Upstream | `processing-java` → `processing cli` |
| https://github.com/processing/processing4/issues/1366 | Upstream | Full `cli --help` transcript; wiki link history |
| https://github.com/processing/processing4/wiki/Command-Line | Wiki | Linked from `--help` (prefer live help over wiki) |
| https://discourse.processing.org/t/processing-4-processing-java-binary/47498 | Forum | Windows/`PATH` usage |
| Local smoke: create → format → `--build` → `--run` | Experiment | Verified 2026-09-10 on macOS |

## Findings

### Command surface (Processing 4.4.3+)

Starting with Processing **4.4.3**, the old standalone `processing-java` binary is folded into the main app as a subcommand:

```bash
processing cli …          # former processing-java
processing lsp            # language server (editors)
processing sketch …       # sketch utilities (growing)
processing sketchbook …   # sketchbook utilities
processing contributions …# examples / contributions
```

Verified local version: **`processing-4.5.6-1434`**.

Top-level help:

```text
Usage: processing [<options>] [<sketches>]... <command> [<args>]...

Commands:
  lsp            Start the Processing Language Server
  cli
  contributions  Manage Processing contributions
  sketchbook     Manage the sketchbook
  sketch         Manage a Processing sketch
```

`processing --help` starts / describes the **IDE** launcher. Sketch build/run lives under **`processing cli`**.

### Finding the binary

| OS | Typical invocation |
|----|--------------------|
| macOS | `/usr/local/bin/processing` (shim) → `/Applications/Processing.app/Contents/MacOS/Processing`, or call that path directly |
| Linux | `processing` on `PATH` after install |
| Windows | `Processing.exe cli …` (portable ZIP: add install dir to `PATH`) |

On this machine the shim is:

```sh
#!/bin/sh
/Applications/Processing.app/Contents/MacOS/Processing $@
```

Legacy note: some installs still offer **Tools → Install “processing-java”** (e.g. `/usr/local/bin/processing-java`). Prefer `processing cli` for new scripts.

### Sketch layout (create without a CLI “new” command)

There is **no** `processing sketch create` (as of 4.5.6). Create sketches as folders:

```text
MySketch/
  MySketch.pde          # main file: folder name == .pde basename
  OtherTab.pde          # optional extra tabs (become inner classes)
  Helper.java           # optional raw Java (not an inner class)
  data/                 # images, fonts, other load* assets
  code/                 # .jar / native libs for this sketch only
```

Rules that matter for CLI:

- `--sketch=` takes the **folder**, not the `.pde` file.
- Prefer an absolute path.
- Main `.pde` should match the folder name. Custom main names historically broke CLI; PDE may use `sketch.properties` — keep the matching-name convention for automation.
- Sketches can live anywhere; the default sketchbook is often `~/Documents/Processing` (see Preferences → Sketchbook location).

Minimal create + run:

```bash
mkdir -p /tmp/CliSmoke
cat > /tmp/CliSmoke/CliSmoke.pde <<'EOF'
void setup() {
  size(100, 100);
  noLoop();
  println("ok");
  exit();
}
void draw() {}
EOF

processing cli --sketch=/tmp/CliSmoke --run
```

### Edit and format

- Edit `.pde` / `.java` with any editor (VS Code Processing extension uses `lsp`).
- Format from the shell (4.5.6):

```bash
processing sketch format path/to/Sketch/Sketch.pde      # stdout
processing sketch format -i path/to/Sketch/Sketch.pde   # in place
```

- Open in the PDE (launches IDE):

```bash
processing /path/to/Sketch
# or
processing /path/to/Sketch/Sketch.pde
```

### `processing cli` — build / run / present / export

```text
Command line edition for Processing 4.5.6 (Java Mode)

--sketch=<name>      Sketch folder (required)
--output=<name>      Output folder (optional; must differ from sketch)
--force              Erase existing --output first (destructive)

--build              Preprocess + compile to .class
--run                Preprocess + compile + run
--present            Run in presentation mode
--export             Export an application
--variant            Export platform/arch only
--no-java            Export without embedding Java
```

**Critical:** `--build`, `--run`, `--present`, or `--export` must be the **last** Processing flag. Anything after it is passed to the sketch as `args`.

```bash
# Compile only
processing cli --sketch=/abs/path/MySketch --output=/tmp/MySketch-build --force --build

# Run
processing cli --sketch=/abs/path/MySketch --run

# Run with sketch args → available as String[] args in the sketch
processing cli --sketch=/abs/path/MySketch --run --out tests/oracle --suite hatch

# Present (fullscreen-style)
processing cli --sketch=/abs/path/MySketch --present

# Export application
processing cli --sketch=/abs/path/MySketch \
  --output=/tmp/MySketch-app --force \
  --variant=macos-aarch64 --export
```

Export `--variant` values:

| Variant | Platform |
|---------|----------|
| `macos-x86_64` | macOS Intel |
| `macos-aarch64` | macOS Apple Silicon |
| `windows-amd64` | Windows |
| `linux-amd64` | Linux x86_64 |
| `linux-arm` | Raspberry Pi 32-bit |
| `linux-aarch64` | Raspberry Pi 64-bit |

(`--platform` was removed in Processing 4.0 in favour of `--variant`.)

### Verified smoke (this machine)

```text
processing sketch format …     → reformats .pde (adds braces on empty draw)
processing cli … --build       → prints "Finished."; writes .class under --output
processing cli … --run hello world
  → AWT disabled, displayWidth/displayHeight will be 0
  → println output, then "Finished."
  → sketch saw args=hello,world
```

`--run` already runs with AWT disabled in this CLI path — useful for batch/oracle sketches that `exit()` after writing files. Still call `noLoop()` / `exit()` and avoid relying on interactive display.

### Libraries (e.g. PGS)

Contributed libraries install into the sketchbook:

```text
<sketchbook>/libraries/<LibraryName>/library/*.jar
```

Install via PDE: **Sketch → Import Library → Add Library…**, or drop jars manually. Sketch-local jars go in `sketch/code/`.

CLI resolves libraries the same way as the PDE (sketchbook + sketch `code/`). For a reproducible oracle, prefer vendoring a PGS jar under the sketch `code/` (or documenting a fixed sketchbook path) — see [processing-oracle-cli.md](../design/processing-oracle-cli.md).

### Other subcommands (4.5.6)

| Command | Role |
|---------|------|
| `processing sketchbook list` | JSON list of sketchbook roots (e.g. `~/Documents/Processing`) |
| `processing contributions examples list` | JSON tree of bundled examples |
| `processing lsp` | Language server for editor integration |
| `processing sketch format [-i] <file>` | Format a `.pde` |

These are thin today; `cli` remains the automation workhorse.

### Patterns for headless / oracle scripts

1. Sketch folder with matching `.pde`.
2. `setup()`: `size(…)` (even if unused), `noLoop()`, do work, write files, `exit()`.
3. Read CLI args from `args` after `--run`.
4. Wrap in a shell script that sets absolute `--sketch` and optional `PROCESSING=…` override.
5. Prefer `--build` in CI for compile-only checks; `--run` for golden export.

Example wrapper sketch:

```java
void setup() {
  size(200, 200);
  noLoop();

  String outDir = args.length > 0 ? args[0] : "out";
  // … call PGS, write SVG/JSON under outDir …
  exit();
}

void draw() {}
```

```bash
processing cli --sketch="$PWD/oracle/processing/OracleMain" --run \
  --out "$PWD/tests/oracle" --fixtures "$PWD/tests/fixtures" --all
```

### Relation to this repo

| Concern | Doc |
|---------|-----|
| Oracle layout, suites, SVG/JSON rules | [processing-oracle-cli.md](../design/processing-oracle-cli.md) |
| Comparison harness | [pgs-comparison-harness.md](../design/pgs-comparison-harness.md) |
| PGS library itself | [pgs-overview.md](./pgs-overview.md) |

Suggested env vars for scripts (not part of upstream CLI):

| Variable | Meaning |
|----------|---------|
| `PROCESSING` / `PROCESSING_PATH` | Absolute path to `Processing` binary or shim |
| (legacy) `PROCESSING_JAVA` | Path to old `processing-java` if still required |

## Open questions

- Whether `processing sketch` will gain create/rename/delete commands in later 4.x releases.
- Best practice for truly display-less CI (current CLI already reports AWT disabled; confirm on Linux CI images).
- Whether to vendor PGS under `oracle/processing/OracleMain/code/` vs sketchbook `libraries/` (license: GPL — OK for oracle tooling).

## Next steps

- Keep expanding oracle suites as library modules land.
- Confirm display-less CI behaviour on Linux images.

## Document history

| Version | Date       | Author | Summary |
|---------|------------|--------|---------|
| 1.0.0   | 2026-09-10 | agent  | Research from official docs + live 4.5.6 CLI smoke |
