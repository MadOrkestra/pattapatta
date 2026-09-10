---
title: "PGS overlap and occlusion"
status: active
owners: []
created: 2026-09-10
updated: 2026-09-10
version: 0.1.0
---

# PGS overlap and occlusion

## Goal

Document how PGS distinguishes and cuts overlapping paths so different patterns can apply to foreground vs background regions.

## Questions

- How does PGS model z-order / visibility between shapes?
- Which boolean ops yield exclusive regions for dual patterning?
- What should `pattapatta` expose for SVG layering?

## Sources

| Source | Type | Notes |
|--------|------|-------|
| `PGS_ShapeBoolean` javadoc | API | `occlusionSubtract`, `overlapRegions`, mesh variants |
| PGS README illustrations | Visual | boolean / overlap GIFs |

## Findings

### Problem

Given two (or more) overlapping closed paths, apply **different fills** (hatch angles, packing densities, colors) to:

- regions only in A,
- regions only in B,
- regions in A∩B,
- optionally, only the **visibly unoccluded** part of each layer.

### Core operations

| Method | Result | Use for patterning |
|--------|--------|--------------------|
| `intersect(a, b)` | A ∩ B | Shared region → foreground pattern or special hatch |
| `subtract(a, b)` | A \ B | A-only background |
| `subtract(b, a)` | B \ A | B-only |
| `symDifference(a, b)` | (A∪B) \ (A∩B) | Exclusive or |
| `union(a, b)` | A ∪ B | Combined clip mask |
| `overlapRegions(shapes, merged)` | Regions covered ≥2 times | Multi-overlap highlighting |
| `occlusionSubtract(group)` | Per-child visible remainder | Painter’s algorithm cut |

### Occlusion subtract (primary for fore/back)

`occlusionSubtract(GROUP)`:

- Children are ordered; **last child is on top** (same as typical draw order).
- For each shape, subtract the union of all higher (later) shapes.
- Result: non-overlapping visible pieces suitable for **independent hatching**.
- Only polygonal shapes occlude; lines/points do not.

**SVG recipe:**

1. Parse paths into a group with explicit z-order.
2. `occlusionSubtract(group)` → N visible polygons.
3. Hatch / pack each child separately.
4. Emit layered SVG.

### Overlap regions

`overlapRegions(shapes, merged)`:

- `merged=true`: disjoint multi-cover patches.
- `merged=false`: pairwise overlaps (may stack in triple+ areas).

Use when the **intersection** should get a third pattern (e.g. crosshatch only where shapes overlap) while leaving non-overlap areas with simpler hatch.

### Mesh-preserving variants

- `intersectMesh` / `subtractMesh` / `unionMesh` keep face identity for mesh-like GROUPs.
- Relevant when hatching per Voronoi/triangle cell after occlusion.

### Two-path fore/background recipe

```
A_only = subtract(A, B)
B_only = subtract(B, A)          # or occlusion if B is top
Both   = intersect(A, B)

hatch(A_only, angle=0)
hatch(B_only, angle=90)
hatch(Both,   angle=45)          # optional third pattern
```

Or with z-order (B on top):

```
visible = occlusionSubtract(group(A, B))
# visible[0] = A \ B, visible[1] = B
```

## Open questions

- Stable child ordering when importing flat SVG (document order vs z-index attribute).
- Handling open paths that only stroke — boolean area ops need closed polygons.

## Next steps

- Phase 2 oracle cases: subtract / intersect / occlusionSubtract / overlapRegions.
- Convenience helper: `layer.splitOverlaps(paths, { mode: 'occlusion' | 'venn' })`.

## Document history

| Version | Date       | Author | Summary       |
|---------|------------|--------|---------------|
| 0.1.0   | 2026-09-10 | agent  | Initial draft |
