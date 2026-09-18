# pattapatta docs

SvelteKit + shadcn-svelte documentation PWA for the **pattapatta** library.

## Develop

From the repo root:

```bash
pnpm docs:dev
```

Or inside this folder:

```bash
pnpm install
pnpm dev
```

## Build

```bash
pnpm docs:build   # from repo root
# → website/build (static, prerendered, with service worker)
```

## Content

- Pages are Markdown (`+page.md`) under `src/routes/`
- Nav: `src/lib/nav.ts`
- Example SVGs: `static/assets/` (regenerate with `pnpm docs:examples` from repo root)
- UI chrome: shadcn-svelte sidebar under `src/lib/components/`

## PWA

- `static/manifest.webmanifest`
- `static/icons/icon-192.png`, `icon-512.png`
- `src/service-worker.ts` precaches build + files + prerendered pages
