# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A crosswind calculator: a single self-contained `index.html` (inline CSS and JS, no dependencies, no build step, no package manager). It is a learning project and the footer says "not for operational use" — keep that disclaimer.

There is no linter and no test suite.

## Running it

Preview through the `crosswind` configuration in `.claude/launch.json` (use the preview tool, not a shell command). It runs `.claude/serve.ps1`, a small PowerShell `HttpListener` static server on `http://localhost:8765/` that serves the repo root with `Cache-Control: no-store`, so a plain reload always picks up edits.

The server only sets a `Content-Type` for `.html`. If the page is ever split into separate `.css`/`.js` files, `serve.ps1` needs MIME types for them too.

To run it by hand:

```bash
powershell -NoProfile -ExecutionPolicy Bypass -File .claude/serve.ps1
```

Opening `index.html` directly from disk also works.

## How index.html fits together

Everything flows through `update()`, which runs on every `input` event and once at load: read the three inputs → rotate the SVG → compute components → write the two result tiles.

**Sign conventions** (set by `windComponents`, relied on by `update`):
- `angle = windDirection - runwayHeading`; wind direction is where the wind comes *from*.
- `headwind` positive = headwind, negative = tailwind (the tile label flips to "Tailwind" and shows the absolute value).
- `crosswind` positive = from the right, negative = from the left.

**Validation is partial on purpose.** `readDegrees` returns `null` outside 0–360. The runway and wind arrow rotate independently whenever their own input is valid; the result tiles go blank (`showBlank`) if any of the three inputs is invalid.

**Rounding.** `roundKnots` first trims floating-point noise with `toFixed(6)` (so 7.4999999 becomes 7.5), then rounds the absolute value and reapplies the sign, so a left and a right crosswind of the same strength display the same number. Don't replace it with a bare `Math.round`.

**SVG compass.** The `viewBox` is 200×200 and everything rotates about (100, 100).
- `#runway` and `#wind` are rotated with CSS `transform`. `rotateTo` keeps an accumulated angle in `turned` and applies the shortest signed delta, so 350° → 010° turns 20° rather than swinging 340° back. Setting `rotate(${degrees}deg)` directly would break that.
- The markings for one runway end are drawn once in `#rwy-end` and mirrored with `<use transform="rotate(180 100 100)">`; edit markings only in `#rwy-end`.
- `#num-near` is the number of the runway you are lined up on (drawn at the bottom end before rotation); `#num-far` is the reciprocal. `runwayNumber` maps heading/10 to 01–36, with 0° and 360° both giving 36.

**Theming.** Colors are CSS custom properties on `:root` with a `prefers-color-scheme: dark` override; SVG parts take their colors through classes (`.surface`, `.marking`, `.wind`), so new elements should use the variables rather than hard-coded colors.
