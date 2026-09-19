# Halftone examples

Generated from `tests/fixtures/halftone/portrait.jpg` — [*Buzz Aldrin walking on the moon*](https://unsplash.com/photos/buzz-aldrin-walking-on-the-moon-e5eDHbmHprg) by [History in HD](https://unsplash.com/@historyinhd) on Unsplash.

```bash
pnpm exec vite-node scripts/halftone-preview.mts
```

**Deliverable = pen-plotter SVG** (`fill="none"`, stroked paths only). PNGs are previews of those SVGs. Generated `*.svg` files are gitignored — regenerate with the script above.

| File | Role |
|------|------|
| `portrait-*.svg` | Plotter input (generated; not committed) |
| `portrait-*.png` | Raster preview |
| `portrait-source.png` | Source photo (resized) |
