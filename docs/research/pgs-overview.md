---
title: "PGS overview"
status: active
owners: []
created: 2026-09-10
updated: 2026-09-10
version: 0.2.0
---

# PGS overview

## Goal

Establish a shared understanding of [Processing Geometry Suite (PGS)](https://github.com/micycle1/PGS) so `pattapatta` can reimplement its geometric behaviour as an installable TypeScript/npm library for Node and the web, targeting **pen-plotter** output (stroked marks; see [0002-pen-plotter-output.md](../decisions/0002-pen-plotter-output.md)).

## Questions

- What is PGS’s architecture and I/O model?
- Which parts matter for SVG fills, hatching, circle packing, and overlap cutting?
- What legal constraints apply when rewriting?

## Sources

| Source | Type | Notes |
|--------|------|-------|
| https://github.com/micycle1/PGS | Repository | README, examples, `pom.xml`, GPL-3.0 |
| https://micycle1.github.io/PGS/ | Javadoc | Public API (2.3-SNAPSHOT) |
| https://raw.githubusercontent.com/micycle1/PGS/master/pom.xml | Build | Dependencies |
| `examples/dysonHatching` | Example | Hatch = parallel segments ∩ cell |

## Findings

### What PGS is

- Processing library exposing **static** methods that mostly take/return `PShape` / `PVector`.
- Focus is **visualisation-oriented geometry**, not a general GIS stack.
- Version researched: **2.3-SNAPSHOT** (Processing 4.x, Java 17).
- License: **GPL-3.0**.

### Architecture

```
Consumer sketch (Processing)
        │
        ▼
Public facades (PGS_*)  ── static API surface
        │
        ▼
micycle.pgs.commons.*   ── algorithm implementations
        │
        ▼
External libs (JTS, Tinfour, JGraphT, …)
```

- **19 public facade classes** under `micycle.pgs` (~384 unique public methods).
- **~70** classes under `micycle.pgs.commons` (internal algorithms: packers, tilings, Voronoi variants, etc.).
- Conversion hub: `PGS_Conversion` bridges `PShape` ↔ JTS `Geometry` and other formats.

### I/O model

| Concept | PGS | `pattapatta` target |
|---------|-----|---------------------|
| Shape | `PShape` (PATH/POLYGON/GROUP, style) | Portable `Path` / `Group` (+ SVG) |
| Point / circle | `PVector` (circle often `.z` = radius) | `Vec2`, `Circle { x, y, r }` |
| Segments | `PEdge` collections | `Segment` / edge lists |
| Style | Processing stroke/fill on shapes | Separate style or SVG attributes |

### Facades (summary)

| Class | Role |
|-------|------|
| `PGS_CirclePacking` | Pack circles in/near shapes |
| `PGS_Coloring` | Mesh graph coloring |
| `PGS_Construction` | Primitives / curves / fractals |
| `PGS_Contour` | Offsets, skeletons, isolines, medial axis |
| `PGS_Conversion` | Format / style conversion |
| `PGS_Hull` | Convex / concave / snap hulls |
| `PGS_Meshing` | Non-triangle meshes, merge, duals |
| `PGS_Morphology` | Buffer, smooth, warp, morph-at-t |
| `PGS_Optimisation` | Inscribed/bounding volumes, packing, visibility |
| `PGS_PointSet` | Point distributions + set ops |
| `PGS_Polygonisation` | Point set → simple polygons |
| `PGS_Processing` | Partition, slice, perimeter, densify, … |
| `PGS_SegmentSet` | Segment generation (incl. hatch lines) |
| `PGS_ShapeBoolean` | Boolean / occlusion / overlap regions |
| `PGS_ShapePredicates` | Metrics and predicates |
| `PGS_Tiling` | Tilings and subdivisions (incl. hatch subdivision) |
| `PGS_Transformation` | Affine / align / resize |
| `PGS_Triangulation` | Delaunay, earcut, refine |
| `PGS_Voronoi` | Voronoi variants |

### Relevance to product focus

- **Hatching / fills:** `PGS_SegmentSet.parallelSegments` (+ filters) then `PGS_ShapeBoolean.intersect` with the host path (see dysonHatching). These are **stroke fills** for the plotter — not solid SVG/`fill`.
- **Circle packing fills:** `PGS_CirclePacking.*` as stroked circles.
- **Fore/background on overlaps:** `occlusionSubtract`, `subtract`, `overlapRegions`, mesh boolean variants — then hatch each visible piece.

### Animation note

PGS itself is largely **stateless geometry**. Animation in examples comes from Processing’s `draw()` loop (`frameCount`, noise over time). Those runtime loops are **out of scope** for `pattapatta`. Static ops that return a shape at parameter `t` (e.g. `interpolate`) remain in scope as geometry.

## Open questions

- Exact Processing CLI invocation path on this machine (user will provide Processing access).
- Which Clipper2 numeric scale best matches JTS fixtures for oracle tolerances.

## Next steps

- Complete API inventory, dependency map, fill/overlap research, and design docs.
- Implement npm package + Processing oracle per development phases.

## Related

- [pgs-api-inventory.md](./pgs-api-inventory.md)
- [pgs-dependencies.md](./pgs-dependencies.md)
- [pgs-fill-hatch-patterns.md](./pgs-fill-hatch-patterns.md)
- [pgs-overlap-occlusion.md](./pgs-overlap-occlusion.md)
- [../decisions/0001-clean-room-mit.md](../decisions/0001-clean-room-mit.md)

## Document history

| Version | Date       | Author | Summary       |
|---------|------------|--------|---------------|
| 0.1.0   | 2026-09-10 | agent  | Initial draft |
| 0.2.0   | 2026-09-10 | agent  | Pen-plotter output constraint |
