# compare

Helpers for validating geometry against expected areas and oracle fixtures (used in tests).

## Imports

```ts
import {
  relativeAreaError,
  containmentAgreement,
  assertAreaClose,
  oraclePathsToGroup,
  ringsToPath,
  type OracleCase,
} from 'pattapatta'
```

## Types

### `OracleCase`

Fixture shape for oracle comparisons:

| Field | Meaning |
|-------|---------|
| `id` | Case identifier |
| `seed` | RNG seed used to build the case |
| `operation` | Operation name under test |
| `outputs.paths` | Expected rings as `number[][][]` per path |
| `outputs.lines` | Expected open polylines |
| `outputs.circles` | Expected disks `{ x, y, r }` |
| `outputs.scalars` | Optional scalars (e.g. `area`) |

## Functions

| Function | Description |
|----------|-------------|
| `ringsToPath(rings)` | Convert `number[][][]` rings → closed `Path` |
| `oraclePathsToGroup(paths)` | Map oracle path rings → `Group` |
| `relativeAreaError(a, b)` | `\|area(a) − area(b)\| / max(\|a\|, \|b\|, ε)` |
| `assertAreaClose(actual, expectedArea, tol?)` | Throw if relative area error exceeds `tol` (default `1e-3`) |
| `containmentAgreement(a, b, samples?)` | Fraction of grid samples with matching point-in-group (default `20×20`) |

## Example

```ts
const got = union(a, b)
assertAreaClose(got, 150, 1e-3)
relativeAreaError(got, expected) // ~0 when areas match
containmentAgreement(got, expected, 16) // 1 when regions agree
```
