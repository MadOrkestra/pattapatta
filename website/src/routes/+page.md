# pattapatta

**pattapatta** is a TypeScript geometry library for **pen plotters**: hatching, circle packing, triangulation and meshing, boolean path ops, Voronoi, tilings, and SVG I/O — for Node and the browser.

Inspired by [Processing Geometry Suite (PGS)](https://github.com/micycle1/PGS), implemented clean-room under **MIT** (not a line port).

![Hero: hatch + inscribed packing](/assets/hero.svg)

## What you get

- Stroke-first geometry (`fill="none"` SVG by default)
- ESM + TypeScript types
- Feature imports (`pattapatta/hatch`, `pattapatta/circlePacking`, …)
- CLI for SVG round-trips

## Jump in

| Page | Purpose |
|------|---------|
| [Quickstart](/quickstart) | Install and draw something in 2 minutes |
| [Getting started](/getting-started) | Mental model, imports, a full mini pipeline |
| [Examples](/examples) | Chained recipes: union → hatch, frame → pack, … |
| [Live demos](/demos) | Interactive packing, triangulation, meshing, hatch, and pipelines |
| [Operations](/concepts/operations) | Transforms and region ops (e.g. rotate, boolean) |
| [Fills](/concepts/fills) | Stroke marks (hatch, packing, tiling, …) |

## Design notes

Internal research and ADRs live in the repo under `docs/` (separate from this docs app).
