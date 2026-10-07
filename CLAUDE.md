# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A crosswind calculator: a single self-contained `index.html` (inline CSS and JS, no dependencies, no build step, no package manager). There is no linter and no test suite. The footer says "Learning project — not for operational use"; keep that disclaimer.

It is also a **practice project**. The owner is a commercial airline pilot with no coding background. They use this repository to learn how Claude Code works and, above all, how GitHub fits in (branches, commits, pushes, pull requests). The aviation side is their expertise; the software side is not.

## Working with the owner

- They give plain-language instructions only. Never ask them to write, edit or run code or commands; do it yourself and report the result in plain words.
- When a technical term comes up (branch, commit, push, merge, pull request…), use it, then explain it briefly. When they are learning something about Claude Code or GitHub, say *why* it works that way, not just what to click.
- Answer first, keep it short, and ask instead of guessing when a request is unclear.
- After a change, show the result rather than only describing it: in a cloud session, send the rendered `index.html` to the chat, or offer to publish it as a private claude.ai Artifact (one link that is updated after each change).
- They also keep a related Claude chat project called "Claude Tutor". Claude Code cannot read it; if something from it matters, ask them to paste it.

## Git and GitHub

- Repository: `nibbalobster/Crosswind-calculator`, **private**. Default branch `main`; day-to-day work happens on the `First-changes` branch and reaches `main` through a pull request. Earlier work was merged this way.
- Only commit and push to the branch you were given, and only open a pull request when asked. After pushing, say what changed and that it is not on `main` until merged.
- GitHub Pages (automatic hosting of the page) is not available while the repo is private on a free plan. If they ask how to get a public web link, explain that trade-off rather than assuming they want the repo made public.

## Running and checking it

On the owner's Windows machine, preview through the `crosswind` configuration in `.claude/launch.json` (use the preview tool, not a shell command). It runs `.claude/serve.ps1`, a small PowerShell `HttpListener` static server on `http://localhost:8765/` that serves the repo root with `Cache-Control: no-store`, so a plain reload always picks up edits. It only sets a `Content-Type` for `.html`; if the page is ever split into separate `.css`/`.js` files, `serve.ps1` needs MIME types for them too. Opening `index.html` directly from disk also works.

In a cloud (Linux) session there is no PowerShell: load `file://…/index.html` with the pre-installed headless Chromium via Playwright, fill the inputs, read the result tiles and take screenshots (check a ~320px-wide viewport and dark mode). Since there are no tests, check a few wind cases by hand, e.g. runway 270, wind 300/15 → 13 kt headwind, 8 kt from the right.

## How index.html fits together

Everything flows through `update()`, which runs on every `input` event and once at load: read the inputs → convert a true wind to magnetic → rotate the SVG → compute components (and gust components) → write the two result tiles.

**Inputs.** Runway heading, wind direction and speed are required. Gust is optional and only shown (as a "gust N" line in each tile) when it is greater than the steady speed. "Wind is" MAG/TRUE: runway headings are magnetic, so a TRUE wind is converted with `magnetic = true − variation` (east positive, from `readVariation`) before anything else uses it; the hint line under the inputs then shows the converted magnetic wind. Variation is ignored and disabled in MAG mode, and a blank variation counts as 0.

**Sign conventions** (set by `windComponents`, relied on by `update`):
- `angle = windDirection - runwayHeading`; wind direction is where the wind comes *from*.
- `headwind` positive = headwind, negative = tailwind (the tile label flips to "Tailwind" and shows the absolute value).
- `crosswind` positive = from the right, negative = from the left.

**Validation is partial on purpose.** `readDegrees` returns `null` outside 0–360. The runway and wind arrow rotate independently whenever their own input is valid; the result tiles go blank (`showBlank`) if heading, direction, speed or (in TRUE mode) variation is invalid.

**Rounding.** `roundKnots` first trims floating-point noise with `toFixed(6)` (so 7.4999999 becomes 7.5), then rounds the absolute value and reapplies the sign, so a left and a right crosswind of the same strength display the same number. Don't replace it with a bare `Math.round`.

**SVG compass.** The `viewBox` is 200×200 and everything rotates about (100, 100).
- `#runway` and `#wind` are rotated with CSS `transform`. `rotateTo` keeps an accumulated angle in `turned` and applies the shortest signed delta, so 350° → 010° turns 20° rather than swinging 340° back. Setting `rotate(${degrees}deg)` directly would break that.
- The markings for one runway end are drawn once in `#rwy-end` and mirrored with `<use transform="rotate(180 100 100)">`; edit markings only in `#rwy-end`.
- `#num-near` is the number of the runway you are lined up on (drawn at the bottom end before rotation); `#num-far` is the reciprocal (drawn at the top end). `runwayNumber` maps heading/10 to 01–36, with 0° and 360° both giving 36.
- The numbers are counter-rotated by `-turned.runway` (CSS `transform` with `transform-box: fill-box`, same transition as the runway) so they always read upright and 09 never looks like 60. The centreline dashes stop short of each end to leave room for an upright number.

**Theming.** Colors are CSS custom properties on `:root` with a `prefers-color-scheme: dark` override; SVG parts take their colors through classes (`.surface`, `.marking`, `.wind`), so new elements should use the variables rather than hard-coded colors.
