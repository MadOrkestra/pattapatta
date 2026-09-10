# CLI

```bash
npx pattapatta --help
npx pattapatta --version
```

## `svg:roundtrip`

Parse an SVG, rebuild the path model, write SVG back out (useful for smoke-checking I/O).

```bash
npx pattapatta svg:roundtrip input.svg -o output.svg
```

## Notes

- The binary is ESM (`dist/cli.js`) with a Node shebang.
- Prefer the library API for geometry work; the CLI stays intentionally thin.
