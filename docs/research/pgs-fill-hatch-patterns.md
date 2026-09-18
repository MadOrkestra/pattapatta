---
title: "PGS fill and hatch patterns"
status: active
owners: []
created: 2026-09-10
updated: 2026-09-10
version: 0.3.0
---

# PGS fill and hatch patterns

## Goal

Explain how PGS produces hatch/fill-like geometry on existing paths, so `pattapatta` can expose the same recipes for **pen-plotter SVG** (stroked marks only). See [0002-pen-plotter-output.md](../decisions/0002-pen-plotter-output.md).

## Questions

- Does PGS have a single “hatchFill” API?
- How do examples build fills from primitives?
- How do circle packings act as fills?

## Sources

| Source | Type | Notes |
|--------|------|-------|
| `examples/dysonHatching/dysonHatching.pde` | Example | Canonical hatch recipe |
| `PGS_SegmentSet` javadoc | API | Segment generators |
| `PGS_ShapeBoolean` javadoc | API | Crop with `intersect` |
| `PGS_CirclePacking` javadoc | API | Pack-as-fill |
| `PGS_Tiling.hatchSubdivision` | API | Plane subdivision, not path hatch |

## Findings

### No dedicated hatchFill facade

PGS does **not** expose a single `hatchFill(shape, angle, gap)` method. Fills are **composed**:

1. Generate candidate geometry (segments, circles, tiling cells).
2. Boolean-clip or filter to the host path.
3. Style / draw the result (Processing stroke/fill).

For `pattapatta`, step 3 must remain **stroke marks**. Solid Processing/SVG fills are not plotter output.

### Recipe A — Parallel hatch (dysonHatching)

From the official example:

1. Build or obtain a polygon cell.
2. Compute envelope diagonal to size the hatch field.
3. `PGS_SegmentSet.parallelSegments(cx, cy, length, spacing, angle, n)` → list of `PEdge`.
4. `PGS_SegmentSet.toPShape(edges)` → LINES shape.
5. `PGS_ShapeBoolean.intersect(cell, lines)` → lines cropped to the cell.
6. Style stroke and draw.

This is the primary pattern `pattapatta` should productize as a convenience helper (e.g. `hatch.parallel(path, { angle, spacing })`) while keeping low-level `segmentSet` + `shapeBoolean` available.

### Recipe B — Interior segment filter

- Generate segments in a bounding region (`parallelSegments`, `stochasticSegments`, `weaveSegments`, …).
- `getPolygonInteriorSegments(segments, shape)` keeps only parts inside the polygon.
- Equivalent goal to intersect-with-polygon; implementation differs (filter vs boolean).

### Recipe C — Perpendicular path ticks

- `perpendicularPathSegments(shape, distance, length, …)` places segments along the perimeter normal — outline texture, not area fill.

### Recipe D — Weave / stochastic / noded / graph-matched

- Full-field segment patterns; crop with Recipe A or B for shape fills.

### Recipe E — Circle packing as fill

- Any `PGS_CirclePacking.*` method returns circles `{x,y,r}` overlapping or inside a shape.
- **Plotter:** emit stroked circle outlines (or arc approximations).
- **`unionCircles`:** merging overlapping circles yields the **combined outline** as one drawable path (plus holes if the topology requires) — in scope for the plotter; stroke that contour (`fill="none"`). Optionally hatch inside that outline separately.
- Lattice packs (`squareLatticePack`, `hexLatticePack`) give regular fills; stochastic / front-chain / repulsion give organic fills.

### Recipe F — Hatch subdivision (tiling)

- `PGS_Tiling.hatchSubdivision` partitions a **plane rectangle** into strip cells — useful for composition, distinct from cropping hatch lines to an arbitrary path.
- `arcDivision` partitions with boundary-seeded circle arcs; stroke cell boundaries as a fill.

### Recipe G — Point-order / tour fills

- `hilbertSort` then polyline — locality-preserving open stroke through a point set.
- `findShortestTour` — closed TSP stroke (NN + 2-opt).

### Recipe H — Sponge

- `createSponge` builds a porous region (Voronoi merge → Chaikin smooth → subtract from rect). Stroke pore/wall boundaries. (PGS uses gaussian smooth; pattapatta uses Chaikin.)

### Convenience API proposal for `pattapatta`

| Helper | Composition |
|--------|-------------|
| `hatch.parallel(path, opts)` | parallelSegments → intersect path |
| `hatch.cross(path, opts)` | two parallel passes |
| `hatch.weave(path, opts)` | weaveSegments → interior/intersect |
| `hatch.stochastic(path, opts)` | stochasticSegments → clip |
| `hatch.perpendicular(path, opts)` | perpendicularPathSegments (outline ticks) |
| `hatch.concentric(path, opts)` | repeated inward buffer shells |
| `fill.circles(path, algorithm, opts)` | circlePacking + optional SVG emit |

Low-level modules remain the source of truth; helpers are thin.

## Open questions

- Default winding / fill-rule when cropping open lines to polygons under Clipper2.
- Whether dash patterns belong in core or only SVG stroke attributes.

## Next steps

- Phase 3: implement segment set + hatch helpers with oracle cases.
- Phase 4: packing fills with seeded fixtures.

## Document history

| Version | Date       | Author | Summary                         |
|---------|------------|--------|---------------------------------|
| 0.1.0   | 2026-09-10 | agent  | Recipes from API + dysonHatching |
| 0.2.0   | 2026-09-10 | agent  | Pen-plotter stroke-only constraint |
| 0.3.0   | 2026-09-10 | agent  | unionCircles = merged outline path |
