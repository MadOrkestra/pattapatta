# Fills

In **pattapatta**, a **fill** is stroke mark-making inside a region — not solid CSS/SVG paint. Emit with `fill="none"` and a visible stroke. See [Pen-plotter output](https://pattapatta.madorkestra.com/concepts/pen-plotter).

Typical pipeline: **construct → [operate](https://pattapatta.madorkestra.com/concepts/operations) → fill → SVG**.

## Primary fills

| Module | Marks |
|--------|-------|
| [hatch](https://pattapatta.madorkestra.com/api/hatch) | Parallel, cross, weave, stochastic, perpendicular ticks, concentric shells |
| [halftone](https://pattapatta.madorkestra.com/api/halftone) | Image tone → **lines or circles** (pick one mode) |
| [circlePacking](https://pattapatta.madorkestra.com/api/circle-packing) | Circles packed in a region |
| [segmentSet](https://pattapatta.madorkestra.com/api/segment-set) | Low-level hatch building blocks |

```ts
import { createRect, hatchParallel, segmentsToOpenPaths } from 'pattapatta'

const region = createRect(15, 15, 70, 70)
const strokes = segmentsToOpenPaths(
  hatchParallel(region, { spacing: 6, angle: Math.PI / 4 }),
)
```

### Hatch pattern map

| Helper | Marks |
|--------|-------|
| `hatchParallel` / `hatchCross` | Straight hatch / crosshatch |
| `hatchWeave` | Fabric-like H/V runs (ABC weave) |
| `hatchStochastic` | Random non-intersecting segments |
| `hatchPerpendicular` | Perimeter ticks (outline texture) |
| `hatchConcentric` | Nested inward offset shells (`Path[]`) |

Do **not** use SVG `<pattern>` / CSS fills for plotter output — expand geometry to real stroked paths instead.

## Also fill-like

| Module | Marks |
|--------|-------|
| [tiling](https://pattapatta.madorkestra.com/api/tiling) | Cell boundaries as stroke patterns (`arcDivision`, grids, subdivisions) |
| [contour](https://pattapatta.madorkestra.com/api/contour) | Offset curves (inward / outward) |
| [pointSet](https://pattapatta.madorkestra.com/api/point-set) | Hilbert-ordered polylines and TSP tours through samples |
| [construction](https://pattapatta.madorkestra.com/api/construction) | `createSponge` pore boundaries as stroke fills |

### Point-order fills

Sample points, then stroke a locality-preserving or tour path:

```ts
import { poisson, hilbertSort, findShortestTour, polyline } from 'pattapatta'

const pts = poisson(40, 10, 10, 90, 90, 3)
const hilbertStroke = polyline(hilbertSort(pts))
const tourStroke = findShortestTour(pts) // closed
```

### Arc division / sponge

Stroke cell or pore outlines directly — no hatch pass required.

```ts
import { arcDivision, createSponge } from 'pattapatta'

const arcs = arcDivision(100, 100, 10, 5)
const sponge = createSponge(100, 100, 36, 2, 2, 6, 9)
```

## Try it

Chained recipes on [Examples](https://pattapatta.madorkestra.com/examples); interactive hatch and packing under [Live demos](https://pattapatta.madorkestra.com/demos).
