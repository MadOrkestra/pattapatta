# pattapatta

<p class="not-prose mb-6 flex flex-wrap items-center gap-2">
	<a href="https://github.com/sponsors/MadOrkestra" target="_blank" rel="noopener noreferrer">
		<img
			src="https://img.shields.io/badge/Sponsor-GitHub-ea4aaa?logo=githubsponsors&logoColor=white"
			alt="Sponsor on GitHub"
			height="20"
		/>
	</a>
	<a href="https://www.buymeacoffee.com/madorkestra" target="_blank" rel="noopener noreferrer">
		<img
			src="https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?logo=buymeacoffee&logoColor=black"
			alt="Buy Me a Coffee"
			height="20"
		/>
	</a>
</p>

**pattapatta** is a TypeScript geometry library for **pen plotters**: hatching, image halftone (lines or circles), circle packing, triangulation and meshing, boolean path ops, Voronoi, tilings, and SVG I/O — for Node and the browser.

Inspired by [Processing Geometry Suite (PGS)](https://github.com/micycle1/PGS), implemented clean-room under **MIT** (not a line port).

> **Status:** This project was built entirely with AI and is **not meant for public or production use yet.** Expect rough edges. Issues and feedback are welcome on [GitHub](https://github.com/MadOrkestra/pattapatta) — open an [issue](https://github.com/MadOrkestra/pattapatta/issues) if something breaks or you have ideas.

![Hero: hatch + inscribed packing](/assets/hero.svg)

## What you get

- Stroke-first geometry (`fill="none"` SVG by default)
- ESM + TypeScript types
- Feature imports (`pattapatta/hatch`, `pattapatta/halftone`, `pattapatta/circlePacking`, …)
- CLI for SVG round-trips

## Jump in

| Page | Purpose |
|------|---------|
| [Quickstart](/quickstart) | Install and draw something in 2 minutes |
| [Getting started](/getting-started) | Mental model, imports, a full mini pipeline |
| [llms.txt](/llms-txt) | AI-oriented docs index (`/llms.txt`, `/llms-full.txt`) |
| [Examples](/examples) | Chained recipes: union → hatch, frame → pack, … |
| [Live demos](/demos) | Interactive packing, triangulation, meshing, hatch, and pipelines |
| [Operations](/concepts/operations) | Transforms and region ops (e.g. rotate, boolean) |
| [Fills](/concepts/fills) | Stroke marks (hatch, packing, tiling, …) |

## Source & feedback

- Repository: [github.com/MadOrkestra/pattapatta](https://github.com/MadOrkestra/pattapatta)
- Issues: [github.com/MadOrkestra/pattapatta/issues](https://github.com/MadOrkestra/pattapatta/issues)
- [Sponsor on GitHub](https://github.com/sponsors/MadOrkestra)
- [Buy Me a Coffee](https://www.buymeacoffee.com/madorkestra)

## Design notes

Internal research and ADRs live in the repo under `docs/` (separate from this docs app).
