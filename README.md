# pattapatta

Pen-plotter geometry library (inspired by [PGS](https://github.com/micycle1/PGS)): hatching, circle packing, boolean path ops, and SVG I/O for Node and the browser.

**Stroke marks only** — solid area fills are not the goal. See `docs/decisions/0002-pen-plotter-output.md`.

## Install

```bash
npm install pattapatta
```

## Usage

```ts
import { parseSvg, toSvg, groupFromPaths } from 'pattapatta'

const group = parseSvg(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <rect x="10" y="10" width="40" height="30" />
  </svg>
`)

console.log(toSvg(group, { viewBox: '0 0 100 100' }))
```

```bash
npx pattapatta --help
```

## Status

Phase 1 scaffold: geometry types + SVG round-trip. Boolean, hatch, and packing modules come next. Design notes live in `docs/`.
