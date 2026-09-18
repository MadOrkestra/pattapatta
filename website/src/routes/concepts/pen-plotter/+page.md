# Pen-plotter output

**pattapatta** targets machines that draw **strokes**, not paint engines that flood-fill pixels.

## Rules of thumb

- Prefer `fill="none"` and a visible `stroke`
- “Fills” are **hatches**, **packings**, **tilings**, or **offset contours** — overview: [Fills](/concepts/fills)
- Boolean / morphology still build **regions**, but you plot their **boundaries** — see [Operations](/concepts/operations)

## In scope

- Union / intersect / subtract / occlusion of closed paths
- Merged outlines (e.g. circle unions as stroked contours)
- Hatch lines, packing circles, Voronoi edges, mesh edges

## Out of scope

- Solid CSS/SVG fills as the product goal
- Animation runners
- Faithful Processing `PShape` style bags (use portable geometry + your own stroke settings)

Repo ADR: `docs/decisions/0002-pen-plotter-output.md`.
