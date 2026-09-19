# Operations

**Operations** change or query geometry. They do not draw fill marks — they prepare regions and paths you later stroke or fill.

Typical pipeline: **construct → operate → fill → SVG**.

## Transforms

Affine helpers live in [transformation](https://pattapatta.madorkestra.com/api/transformation):

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
| [shapeBoolean](https://pattapatta.madorkestra.com/api/shape-boolean) | Union, intersect, subtract, occlusion |
| [morphology](https://pattapatta.madorkestra.com/api/morphology) | Buffer, simplify, warp |
| [processing](https://pattapatta.madorkestra.com/api/processing) | Slice, densify, extract boundaries |
| [predicates](https://pattapatta.madorkestra.com/api/predicates) | Containment, area, and related queries |

## Next step

Once you have a path or group, add stroke marks with [Fills](https://pattapatta.madorkestra.com/concepts/fills) (hatch, packing, tiling, …).
