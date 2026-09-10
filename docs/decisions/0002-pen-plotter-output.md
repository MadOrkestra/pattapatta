---
title: "Pen plotter output constraints"
status: accepted
owners: []
created: 2026-09-10
updated: 2026-09-10
version: 1.1.0
---

# Pen plotter output constraints

## Status

`accepted`

## Context

`pattapatta` will generate graphics for a **pen plotter**. A plotter draws with a physical pen along paths: it can stroke open or closed polylines/curves. It cannot paint solid area fills the way a screen or laser raster does. A filled rectangle (SVG `fill` with no strokeable interior marks) is useless as plotter output.

PGS and screen-oriented SVG often rely on solid fills, mesh face coloring, or area shading. Those must not drive the library’s default “fill” story.

## Decision

1. **Pen-drawable geometry only** for product outputs: line segments, polylines, polygons-as-outlines, arcs/circles-as-strokes, and other mark paths the pen can follow.
2. **Solid / paint fills are out of scope** for plotter-facing APIs and SVG export defaults (no relying on `fill` to shade regions).
3. **Area “fills” must be mark-making**: hatching, crosshatching, stipple (dots as tiny marks or short strokes), circle-pack **outlines**, weave segments, etc., clipped to the host path.
4. When a PGS (or port) feature only produces non-plottable results (e.g. solid mesh face coloring with no strokes), **skip implementing it as a plotter fill** and **document the skip** (inventory note or this ADR’s skip log). Geometry ops that *enable* plotting (boolean cut of regions, then hatch each piece) remain in scope.
5. SVG export for plotting: prefer **stroke, no fill** (or `fill="none"`) unless the consumer explicitly asks otherwise.

## What counts as plottable

| OK | Not OK (skip as plotter output) |
|----|----------------------------------|
| Open/closed paths, polylines | Solid filled rectangles/polygons with empty interiors (paint fill only) |
| Hatch / crosshatch / weave line sets | CSS/SVG pattern paints that aren’t expanded to paths |
| Circle packing as stroked circles (or arcs) | Disks that exist only as filled circles with no stroke path |
| Contours, offsets, skeletons as strokes | Mesh face **color** fills (`colorMesh`) as the deliverable |
| Boolean unions (incl. `unionCircles`) as **merged outline** paths | Relying on opaque fill to show the merged area |
| Occlusion/boolean → regions, then stroke-hatch each | — |

## Skip log (non-plottable pattern fills)

Record features discovered during the port that we will **not** treat as plotter fills. Expand this table as needed.

| Item | Source | Why skipped | Plotter alternative |
|------|--------|-------------|---------------------|
| Solid shape `fill` | Processing / SVG default | Pen cannot flood-fill area | Hatch / pack / stipple inside path |
| `PGS_Coloring.colorMesh` / `colorNonMesh` as shaded faces | PGS_Coloring | Produces filled colored faces | Optional: stroke face boundaries only; or hatch per face |
| SVG/CSS `fill` patterns / gradients | Web SVG | Not expanded to pen paths | Expand to real path marks in core |
| Screen-only opacity / blend layers | Examples | Not a pen mark | Separate layers as distinct stroked geometry |

**Not a skip — clarify:** `unionCircles` (and general `union` of closed shapes) **is in scope**. The result is the **outer boundary** (and holes if any) of the merged region — one (or few) drawable stroked path(s), not a solid paint fill. Export with `fill="none"` and stroke the contour.

Boolean / morphology / predicates that *construct* regions stay in scope. Merged outlines are first-class plotter paths; interior area treatments still use hatch/pack marks when needed.

## Alternatives considered

- **Support solid fills for screen preview** — allowed only as an explicit non-default, non-plot export mode; not the library’s primary contract.
- **Emit fills and hope the plotter driver hatches** — unreliable; we expand marks ourselves.

## Consequences

### Positive

- Output stays plotter-safe by default.
- Hatch/packing/occlusion work matches real machine use.

### Negative

- Some PGS “pretty fill” demos will not be mirrored 1:1.
- Coloring module may be deferred or reduced to boundary strokes.

### Neutral

- Research inventory can still list PGS methods; plotter skip is a product filter on top.

## Related

- [../research/pgs-fill-hatch-patterns.md](../research/pgs-fill-hatch-patterns.md)
- [../research/pgs-api-inventory.md](../research/pgs-api-inventory.md)
- [../design/typescript-pgs-port.md](../design/typescript-pgs-port.md)

## Document history

| Version | Date       | Author | Summary                                      |
|---------|------------|--------|----------------------------------------------|
| 1.0.0   | 2026-09-10 | agent  | Accepted: pen-plotter stroke-only fill policy |
| 1.1.0   | 2026-09-10 | agent  | Clarify unionCircles → merged outline path     |
