---
title: "PGS dependencies and TypeScript mapping"
status: active
owners: []
created: 2026-09-10
updated: 2026-09-10
version: 0.1.0
---

# PGS dependencies and TypeScript mapping

## Goal

Map PGS Java dependencies to TypeScript/browser-capable alternatives for the `pattapatta` npm library.

## Questions

- What does PGS rely on under the hood?
- What can be replaced with existing npm packages vs reimplemented?

## Sources

| Source | Type | Notes |
|--------|------|-------|
| https://raw.githubusercontent.com/micycle1/PGS/master/pom.xml | Maven | Version 2.3-SNAPSHOT |
| npm / GitHub | Candidates | clipper2-ts, d3-delaunay, etc. |

## Findings

### Direct dependencies (from `pom.xml`)

| Dependency | Role in PGS | TS candidate |
|------------|-------------|--------------|
| `org.processing:core` (provided) | `PShape` / sketch host | **None** — replace with portable geometry + SVG |
| `org.locationtech.jts:jts-core` | Boolean, buffer, predicates, many algorithms | **`clipper2-ts`** for boolean/offset; custom or port for remaining JTS-specific ops |
| `org.jgrapht:jgrapht-core` | Graphs (coloring, duals, matching) | `graphology` or small custom graphs |
| `com.github.gwlucastrig:Tinfour` | Incremental TIN / triangulation | `d3-delaunay` + constrained CDT (e.g. `cdt2d` / custom) |
| `com.github.micycle1:JMedialAxis` | Medial axis | Reimplement / port algorithm later (P2) |
| `com.github.micycle1:grassfire4j` | Straight skeleton / grassfire | Reimplement later (P2) |
| `org.apache.commons:commons-math3` | Numerics | Built-in Math + small helpers |
| `org.tinspin:tinspin-indexes` | Spatial indexes | `rbush` / `flatbush` |
| `com.github.micycle1:UniformNoise` | Noise | `simplex-noise` or omit where unused |
| `com.github.micycle1:space-filling-curves` | Hilbert etc. | Small Hilbert/SFC utility |
| `com.github.micycle1:RectPacking` | Rect pack | Reimplement / port heuristics |
| `com.github.micycle1:BetterBeziers` | Beziers | SVG path / custom bezier |
| `com.github.micycle1:Hobby-Curves` | Hobby curves | Port later |
| `com.github.micycle1:SRPG` | Super random polygons | Port later |
| `com.github.micycle1:geoblitz` | Geometry helpers | Absorb into core |
| `com.github.micycle1:malleo` | Deformation / morph helpers | Port morph subset |
| `com.github.micycle1:TrapMap` | Trapezoidation | Port later |
| `com.github.micycle1:quickhull3d` | Hull | 2D hull in-core |
| `com.github.paudan:jswarmopt` | Swarm opt | Avoid or optional |
| `com.github.whitegreen:Dalsoo-Bin-Packing` | Bin packing | Port heuristics |
| `com.github.scoutant:polyline-encoder` | Encoded polylines | Optional conversion |
| `net.jafama:jafama` | Fast Math | `Math.*` |
| `it.unimi.dsi:dsiutils` | Utils | Unnecessary |

### Strategy by subsystem

| Subsystem | Approach |
|-----------|----------|
| Boolean / offset | `clipper2-ts` (robust, browser + Node) |
| Predicates / metrics | Implement on portable paths (area, centroid, PIP) |
| Hatch segments | Pure TS (parallel line family + clip) |
| Circle packing (lattice) | Pure TS |
| Circle packing (LEC / repulsion / tangency) | Port algorithms; may need spatial index + triangulation |
| Delaunay | `d3-delaunay` first; constrained later |
| Voronoi | From Delaunay dual or dedicated port |
| Graph coloring | Small graph + greedy / DSATUR in TS |
| Medial axis / skeleton | Defer (P2); large specialized ports |

### Constraints for npm / browser

- Prefer **pure JS/TS** or WASM-free deps for simple website import.
- No Processing runtime in the published package.
- Oracle (Processing + PGS) is **devDependency / repo tooling only**.

## Open questions

- Accept Clipper2 integer scaling vs JTS float differences via documented tolerances.
- Whether a future WASM JTS build is worth it for oracle-matching precision (default: no).

## Next steps

- Lock `clipper2-ts` in Phase 2.
- Document per-module dependency choices in implementation ADRs as modules land.

## Document history

| Version | Date       | Author | Summary       |
|---------|------------|--------|---------------|
| 0.1.0   | 2026-09-10 | agent  | Initial map   |
