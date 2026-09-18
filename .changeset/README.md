# Changesets

This repo uses [Changesets](https://github.com/changesets/changesets) to version `pattapatta` and write `CHANGELOG.md`.

## Adding a changeset

When your PR changes the published library, run:

```bash
pnpm changeset
```

Commit the new file under `.changeset/`. Merging to `main` opens or updates a **Version Packages** PR; merging that PR publishes to npm and creates a GitHub Release.

The `website` package is ignored and is not published.
