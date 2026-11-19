# Third-party work

## Ink Studio

Lighthouse rock (`scenes/ink/lighthouse.cjs`) and the monsters (`scenes/ink/monsters.cjs`) are sculpted with Ink Studio's
toolkit and baked from the worlds it builds. `engine/shaders-ink.js` is a port to GLSL of the pixel stage and clean-up pass
of Ink Studio's offline renderer (`cli/render.js`), and the baker calls its pattern evaluators. Ink Studio itself is not
included in this repository.

- Project: https://github.com/siliconjungle/shapeshift-labs-ink-studio (`@shapeshift-labs/ink-studio` 0.1.0, commit
  `be9e77712346ad922a34920242eda67f3d25a592`)
- Licence: MIT

```
MIT License

Copyright (c) 2026 siliconjungle

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Fonts

The page asks Google Fonts for Pixelify Sans (SIL Open Font License 1.1) and falls back to a system monospace face.

## Generated art

The cast's sprites (`art/pixellab/`, baked into `packs/sprites`) were generated with PixelLab (https://www.pixellab.ai)
from the prompts in `art/pixellab/cast.json`, and then given selective outlines by `tools/bake-sprites.mjs`. Use of
PixelLab's output is governed by its terms of service.

## Build tool

esbuild (MIT) bundles the engine and the game; it is a development dependency only.
