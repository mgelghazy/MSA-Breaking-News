# Required local fonts

Font binaries are intentionally not committed to this public repository.
Install licensed copies locally in this directory with these exact filenames:

| Font family | Required filename | Template role |
| --- | --- | --- |
| Swissra Medium | `Swissra-Medium.otf` | Arabic breaking-news headline |
| Lafet Bold | `lafet-bold.otf` | Category label and optional detail line |
| Type Light Sans Regular | `TypeLightSans.otf` | English footer furniture |
| PixelMachine Regular | `PixelMachine-reference.ttf` | Date numerals |

The renderer declares the corresponding local families as `MSA Swissra`,
`MSA Lafet`, `MSA Type Light`, and `MSA PixelMachine` in `index.html`.

Earlier comparison files named `Pixel-lcd-machine.ttf`,
`Pixel-lcd-machine.woff`, and `PixelMachine-reference-subset.ttf` are also
ignored and are not required by the current renderer.
