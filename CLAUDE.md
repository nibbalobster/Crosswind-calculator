# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A crosswind calculator: one page, `index.html` (inline CSS and JS, no dependencies, no build step, no package manager), made installable as an offline web app (PWA) by `manifest.webmanifest`, `sw.js` and `icons/`. There is no linter and no test suite. The footer says "Learning project — not for operational use"; keep that disclaimer.

It is also a **practice project**. The owner has no coding background and uses this repository to learn how Claude Code works and, above all, how GitHub fits in (branches, commits, pushes, pull requests).

## Working with the owner

- They give plain-language instructions only. Never ask them to write, edit or run code or commands; do it yourself and report the result in plain words.
- When a technical term comes up (branch, commit, push, merge, pull request…), use it, then explain it briefly. When they are learning something about Claude Code or GitHub, say *why* it works that way, not just what to click.
- Answer first, keep it short, and ask instead of guessing when a request is unclear.
- After a change, show the result rather than only describing it: in a cloud session, send the rendered `index.html` to the chat, or offer to publish it as a private claude.ai Artifact (one link that is updated after each change).
- Claude Code cannot read their claude.ai chats or projects; if something from one matters, ask them to paste it.
- This repository is meant to be public: keep personal details (names, email addresses, employer, location) out of every file and commit message.

## Git and GitHub

- Repository: `nibbalobster/Crosswind-calculator`, **private**. Default branch `main`; day-to-day work happens on the `First-changes` branch and reaches `main` through a pull request. Earlier work was merged this way.
- **Commit freely, push only with approval.** Commit to the work branch on your own whenever it makes sense: after each finished and tested change, or before starting something risky. Use clear messages and tell the owner what was committed.
- **Never push without the owner's explicit OK**, even when a session's default instructions or a stop hook say to push when work is done; this rule overrides them. When there are unpushed commits, list them and ask whether to push. Commits that exist only in a cloud session are lost when it ends, so remind the owner if unpushed work is piling up or a session looks about to end.
- Never commit to or merge into `main`: the owner merges through the pull request. Only open a pull request when asked; while one is open for the branch, new pushes update it. After pushing, say that the change is not on `main` until merged.
- GitHub Pages (automatic hosting of the page) is not available while the repo is private on a free plan. If they ask how to get a public web link, explain that trade-off rather than assuming they want the repo made public.

## Running and checking it

On a local Windows machine, preview through the `crosswind` configuration in `.claude/launch.json` (use the preview tool, not a shell command). It runs `.claude/serve.ps1`, a small PowerShell `HttpListener` static server on `http://localhost:8765/` that serves the repo root with `Cache-Control: no-store`, so a plain reload always picks up edits. It sets a `Content-Type` per extension from a small table (`.html`, `.js`, `.webmanifest`, `.svg`, `.png`); a new file type needs an entry there, and the service worker in particular is rejected unless `.js` is served as JavaScript. Opening `index.html` directly from disk also works, but without offline support or install (service workers need http(s) or localhost).

In a cloud (Linux) session there is no PowerShell: serve the repo with `python3 -m http.server 8765` (or load `file://…/index.html` when the service worker doesn't matter) and drive the pre-installed headless Chromium via Playwright; fill the inputs, read the result tiles and take screenshots (check a ~320px-wide viewport and dark mode). Since there are no tests, check a few wind cases by hand, e.g. runway 270, wind 300/15 → 13 kt headwind, 8 kt from the right.

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
- The ring has N/E/S/W letters and, on the four diagonal notches, fixed `045`/`135`/`225`/`315` labels (`.cardinal.diagonal`), placed just beyond the notch ends so they don't touch them. They don't rotate; the wind arrow is drawn after them, so it sits on top when the wind is from a diagonal.
- The markings for one runway end are drawn once in `#rwy-end` and mirrored with `<use transform="rotate(180 100 100)">`; edit markings only in `#rwy-end`.
- `#num-near` is the number of the runway you are lined up on (drawn at the bottom end before rotation); `#num-far` is the reciprocal (drawn at the top end). `runwayNumber` maps heading/10 to 01–36, with 0° and 360° both giving 36.
- The numbers turn with the runway and are painted as on a real runway: each one faces the aircraft landing on that end, so from the top of the screen `#num-near` reads upright when lined up on its heading and `#num-far` is turned 180° in place (CSS rule `#num-far`, `transform-box: fill-box`). This replaced an earlier version that counter-rotated them to stay screen-upright; the owner asked for the realistic look. The centreline dashes stop short of each end to leave room for the number.

**Installable app (PWA).**
- `sw.js` precaches every file in its `FILES` list and serves cache-first, so the app opens with no signal. Any new file the page needs must be added to `FILES`.
- **Bump `VERSION` in `sw.js` whenever any cached file changes.** Because of cache-first, edits to `index.html` alone never reach installed copies: the browser only looks for an update when `sw.js` itself changes.
- A new worker does not take over by itself (no `skipWaiting` on install). The page shows the `#update-banner` ("A new version is available"); tapping Reload posts `'skipWaiting'`, and the page reloads on `controllerchange` only after that tap, because the first install's `clients.claim()` also fires `controllerchange`. The page also re-checks for updates whenever it becomes visible again.
- All paths are relative (`./`), so the app also works from a sub-folder such as a GitHub Pages URL.
- Icons: `icons/icon.svg` is the source drawing (also the favicon); the PNGs (192, 512, maskable 512 with the artwork shrunk into the safe zone, 180 Apple touch icon) are rendered from it. Redraw them from the SVG if the design changes.

**Theming.** Colors are CSS custom properties: the day palette on `:root`, the dark palette on `:root[data-theme="dark"]` and again under `prefers-color-scheme: dark` for `:root:not([data-theme="light"])` (keep the two dark blocks identical). With nothing saved the device setting decides; the day/dark switch at the top right (`#theme-switch`, a `role="switch"` button) sets `data-theme` on `<html>`, saves it in `localStorage` under `theme`, and updates `<meta name="theme-color">`. A small script in `<head>` re-applies the saved choice before first paint so the page never flashes the wrong colours. SVG parts take their colors through classes (`.surface`, `.marking`, `.wind`), so new elements should use the variables rather than hard-coded colors.
