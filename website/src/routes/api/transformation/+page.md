# transformation

Affine helpers on paths.

## Imports

```ts
import {
  translate, translateToOrigin, translateCentroidTo, translateCornerTo,
  rotate, rotateAroundCenter, scale, originScale,
  flipHorizontal, flipVertical, resizeByWidth, resizeByHeight, shear,
  transformation,
} from 'pattapatta'
```

## Functions

| Function | Description |
|----------|-------------|
| `translate(p, dx, dy)` | Shift |
| `translateToOrigin` / `translateCentroidTo` / `translateCornerTo` | Place by centroid / corner |
| `rotate(p, angle, pivot?)` | Radians |
| `rotateAroundCenter` | Pivot = centroid |
| `scale(p, sx, sy?, pivot?)` | Scale about pivot |
| `originScale` | Scale about `(0,0)` |
| `flipHorizontal` / `flipVertical` | Mirror |
| `resizeByWidth` / `resizeByHeight` | Uniform fit to AABB size |
| `shear(p, shx, shy?, pivot?)` | Shear |

## Examples

### Translate

![Translate](/assets/transform-translate.svg)

### Rotate

![Rotate](/assets/transform-rotate.svg)

### Scale

![Scale](/assets/transform-scale.svg)
