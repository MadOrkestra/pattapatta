#!/usr/bin/env bash
# Publish via `npm publish` so GitHub Actions OIDC trusted publishing works.
# Changesets would otherwise choose `pnpm publish`, which does not support OIDC
# (https://docs.npmjs.com/trusted-publishers — OIDC is npm publish only).
set -euo pipefail

pnpm build

name="$(node -p "require('./package.json').name")"
version="$(node -p "require('./package.json').version")"

npm --version
npm publish --access public

# Match Changesets output so changesets/action can create GitHub releases.
echo "New tag: ${name}@${version}"
git tag "${name}@${version}" || true
