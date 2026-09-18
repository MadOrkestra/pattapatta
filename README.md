# pattapatta

Pen-plotter geometry library (inspired by [PGS](https://github.com/micycle1/PGS)): hatching, circle packing, triangulation / meshing, boolean path ops, Voronoi, tilings, and SVG I/O for Node and the browser.

**Stroke marks only** — solid area fills are not the goal.

[![npm](https://img.shields.io/npm/v/pattapatta.svg)](https://www.npmjs.com/package/pattapatta)

## Install

```bash
pnpm add pattapatta
```

Requires **Node ≥ 18** (ESM). Works in modern browsers via bundlers.

## Quick example

```ts
import { createRect, union, hatchParallel, toSvg, group, segmentsToOpenPaths } from 'pattapatta'

const a = createRect(0, 0, 2, 1)
const b = createRect(1, 0, 2, 1)
const merged = union(a, b)
const strokes = hatchParallel(merged.paths[0]!, { spacing: 0.08, count: 40 })
console.log(toSvg(group(segmentsToOpenPaths(strokes))))
```

```bash
pnpm dlx pattapatta --help
pnpm dlx pattapatta svg:roundtrip in.svg -o out.svg
```

## Docs site

Live: [pattapatta.madorkestra.com](https://pattapatta.madorkestra.com) (GitHub Pages; deploys on push to `main`).

Local documentation PWA (SvelteKit + shadcn):

```bash
pnpm install
pnpm docs:dev
pnpm docs:build
pnpm docs:examples   # regenerate SVG figures
```

## Modules

| Import | Role |
|--------|------|
| `pattapatta` | Types, SVG, all facades |
| `pattapatta/shapeBoolean` | Union / intersect / subtract / occlusion |
| `pattapatta/hatch` | Parallel / cross hatch fills |
| `pattapatta/circlePacking` | Lattices (`overlap` \| `contained`), LEC, stochastic |
| `pattapatta/triangulation` | Earcut, Delaunay, Poisson Steiner, refine |
| `pattapatta/morphology` | Buffer, simplify, warps |
| `pattapatta/meshing` | Graph faces, quadrangulation, mesh process / repair |
| `pattapatta/voronoi` | Voronoi cells |
| … | See `website/` API pages |

## Releasing

This repo uses [Changesets](https://github.com/changesets/changesets). Only the root `pattapatta` package is published; `website` is ignored. CI publishes via [npm trusted publishing (OIDC)](https://docs.npmjs.com/trusted-publishers) — no long-lived `NPM_TOKEN` (2FA-bypass tokens are being deprecated for direct publish; see [npm changelog](https://github.blog/changelog/2026-07-08-npm-install-time-security-and-gat-bypass2fa-deprecation/)).

### One-time npm setup

1. If the package is not on npm yet, publish once locally (trusted publishers can only be configured on an existing package):
   ```bash
   pnpm build && npm publish --access public --otp=<code>
   ```
2. On [npmjs.com](https://www.npmjs.com/) → **pattapatta** → **Settings** → **Trusted Publisher** → **GitHub Actions**:
   - **Organization or user:** `MadOrkestra`
   - **Repository:** `pattapatta`
   - **Workflow filename:** `release.yml` (filename only)
   - **Allowed actions:** include **`npm publish`** (not stage-only — Changesets publishes directly)
3. Optionally under **Publishing access**, require 2FA and disallow tokens once OIDC works.
4. Remove any repo `NPM_TOKEN` secret if it was only used for publish.

### Routine releases

1. In a PR that changes the library, run `pnpm changeset`, commit the file under `.changeset/`, and merge to `main`.
2. The **Release** workflow opens or updates a **Version Packages** PR (bumps version, updates `CHANGELOG.md`).
3. Merging that PR publishes to npm (OIDC + provenance) and creates a GitHub Release.
   Publish must use **`npm publish`** (not `pnpm publish`) — OIDC only works with the npm CLI ([docs](https://docs.npmjs.com/trusted-publishers)).

Current package version is in `package.json` (e.g. `0.2.0`). If publish failed after a version bump, fix the trusted-publisher config (workflow name must be exactly `release.yml`) and re-run **Release** — Changesets will publish any version not yet on npm.

If CI fails with **`ENEEDAUTH`** or **`E404 Not Found - PUT …/pattapatta`**, treat it as auth failure (npm hides 401 as 404). Check:

1. Trusted Publisher on npmjs.com matches exactly: `MadOrkestra` / `pattapatta` / `release.yml`, and **`npm publish` is allowed** (new configs default to stage-only).
2. Release uses `npm publish --access public` directly in the workflow (not `pnpm release` — pnpm strips OIDC env vars).
3. Job has `id-token: write` and runs on a **GitHub-hosted** runner.
4. `package.json` `repository.url` matches `https://github.com/MadOrkestra/pattapatta.git`.

Local checks used by CI:

```bash
pnpm install --frozen-lockfile
pnpm test
pnpm typecheck
pnpm build
```

## License

MIT — clean-room implementation (not a GPL line-port of PGS). See `docs/decisions/`.
