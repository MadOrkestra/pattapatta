# Operations

**Operations** change or query geometry. They do not draw fill marks — they prepare regions and paths you later stroke or fill.

Typical pipeline: **construct → operate → fill → SVG**.

## Transforms

Affine helpers live in [transformation](/api/transformation):

- `rotate` / `rotateAroundCenter`
- `translate`, `scale`, `shear`
- `flipHorizontal` / `flipVertical`

```ts
import { createRect, rotateAroundCenter } from 'pattapatta'

const square = createRect(20, 20, 40, 40)
const spun = rotateAroundCenter(square, Math.PI / 6)
```

## Region ops

Before a fill, you usually reshape the host region:

| Module | Role |
|--------|------|
| [shapeBoolean](/api/shape-boolean) | Union, intersect, subtract, occlusion |
| [morphology](/api/morphology) | Buffer, simplify, warp |
| [processing](/api/processing) | Slice, densify, extract boundaries |
| [predicates](/api/predicates) | Containment, area, and related queries |

## Next step

Once you have a path or group, add stroke marks with [Fills](/concepts/fills) (hatch, packing, tiling, …).
