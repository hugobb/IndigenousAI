# Atlas

The interactive map that accompanies the Indigenous language NLP review, and the
data pipeline that feeds it.
Design: `../docs/superpowers/specs/2026-09-03-indigenous-nlp-atlas-design.md`

## Node is not on PATH

Node lives under nvm on this machine. Before any command:

    export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"

`node: command not found` means this step was skipped — Node is installed.

## Commands

    pnpm install
    pnpm exec playwright install chromium   # one-time; see "The browser suite" below
    pnpm test          # unit tests
    pnpm test:browser  # browser regression suite (Playwright, drives `vite dev`)
    pnpm typecheck     # tsc --noEmit
    pnpm build:data    # extract -> validate -> bundle (the DATA)
    pnpm dev           # dev server on http://localhost:5173/atlas/, showing the fixture
    pnpm build:app     # production build of the APP; refuses without a real bundle
    pnpm preview       # serve a built dist/ locally

`build:data` and `build:app` are two different things and are not chained on
purpose: the first produces `src/data/atlas.json` from the curated YAML, the
second compiles the page that reads it.

### The browser suite

`pnpm test:browser` runs `browser-tests/atlas.spec.ts` in a real Chromium via
Playwright — it is the only thing in this repo that can see CSS Grid layout,
since jsdom (what `pnpm test` runs under) has no layout engine at all. It is
**deliberately not part of `pnpm test`**: `vitest.config.ts` only collects
`tests/**/*.test.ts(x)`, so the browser suite stays out of the fast, offline
unit run and is invoked separately.

A fresh clone needs Chromium downloaded once before the first run:

    pnpm exec playwright install chromium

Do **not** run `pnpm approve-builds` if `pnpm add` reports ignored build
scripts for `@playwright/test` — it rewrites `pnpm-workspace.yaml` and breaks
the rest of the suite. `playwright install chromium` is the only step needed.

`pnpm build:data` exits non-zero if any hand-curated record is still `status: draft`.
That is intended: it is what stops an unreviewed record reaching a published figure.
**All ten curated records are draft today, so `build:data` currently exits 1 and
there is no generated bundle.**

## The seam you need to know about: fixture vs. real bundle

This is the one thing to understand before changing anything here.

The app never invents a fallback. `chooseBundle` (`src/lib/load.ts`) is handed the
generated bundle if one exists, the committed fixture, and whether this is a build:

- **`pnpm dev` / `pnpm test`** — there is no `src/data/atlas.json`, so the page
  renders `src/fixtures/atlas.fixture.json`: five languages and three initiatives
  that are **entirely invented**. Every screenshot you take of `pnpm dev` today is
  a picture of fake data. The page says so itself, in the banner across the top;
  that banner is driven by which object was returned, not by an env var, so it
  cannot disagree with what is on screen.
- **`pnpm build:app`** — refuses to start while `src/data/atlas.json` is absent,
  and names `pnpm build:data` as the fix. It also refuses a bundle that parses but
  holds no records.
- **Promoting records is what changes this.** Once the curated records leave
  `status: draft` and `pnpm build:data` succeeds, the same page renders the real
  bundle and the banner disappears on its own — no app code changes.

  That day is the **only** time the page renders without the notice, so it is
  the one layout nobody has ever looked at. It has now been checked once, and
  the CSS was wrong: the rail and the map were auto-placed and relied on the
  notice to occupy the row above them, so removing it shrank the map from 705px
  to 337px at 1440x900. The grid is now placed by named areas, which is why
  `tests/chrome.test.tsx` insists every child of `.atlas` declares a
  `grid-area`. **Look at the page in a browser on the day the first record is
  promoted anyway** — it is the first time real records will have been on
  screen, and no unit test here computes a layout.
- **`vite preview` is not a way back in.** It reports `command: 'serve'`, but it
  only serves the static files already in `dist/` and never re-runs the `define`
  pipeline, so what it shows is the `__ATLAS_ALLOW_FIXTURE__: false` baked in at
  build time. Previewing a compile-only build shows a failed page, not invented
  records — which is the correct outcome.
- **`ATLAS_ALLOW_NO_BUNDLE=1 pnpm build:app`** exists only to prove the app still
  compiles (CI, a refactor, a type change). It skips the bundle check, so its
  `dist/` is built against no data at all. **It is never a deploy path.** If you
  find yourself reaching for it to ship something, the answer is to review records.

## The fixture never ships

`pnpm dev` has no generated bundle to show, so it renders
`src/fixtures/atlas.fixture.json` — invented records, behind a banner on the page
saying so. None of it may reach a build. Two independent mechanisms enforce that:

- The build gate above (`vite.config.ts`) refuses the build outright, and
  deletes any `dist/` left by an earlier successful compile on its way out — a
  build that must not ship leaves nothing behind that could be shipped.
- The fixture is admissible only when Vite's own `command` is `serve`. That is a
  build-vs-serve fact no environment variable can flip — unlike
  `import.meta.env.PROD`, which follows an ambient `NODE_ENV` and once let
  `NODE_ENV=development vite build` emit a deployable `dist/` full of invented
  records.
- `tests/build-artifact.test.ts` runs real builds and greps the emitted JS for
  every identifying string in the fixture. It is slow (~8s) on purpose.

## The page

`src/main.tsx` mounts `App`, and imports two stylesheets: `src/styles.css` (the
page chrome) and `maplibre-gl/dist/maplibre-gl.css`. The MapLibre one is not
optional — it positions the canvas inside its container and styles the
attribution control, and the OpenStreetMap attribution is a licence condition.

## The basemap

`BASEMAP_STYLE` in `src/map/style.ts` is a URL, not a style object: OpenFreeMap
serves a full MapLibre **vector** style at
`https://tiles.openfreemap.org/styles/positron`. It needs no API key and no
registration, which is the whole point — the previous basemap was CARTO's
keyless raster endpoint, and it had begun stamping a diagonal
"API KEY REQUIRED" watermark across every tile. That was invisible for as long
as the app had no CSS and the map never rendered, and it would have gone
straight into a published figure.

Two consequences of a vector style, both easy to undo by accident:

- OpenFreeMap's style declares **no attribution on its sources**, so MapLibre's
  attribution control renders empty on its own. `BASEMAP_ATTRIBUTION` is passed
  explicitly through the map's `attributionControl` option in `src/map/useMap.ts`.
  OSM data is ODbL — dropping it is a licensing failure that looks like nothing.
- Positron has 55 basemap layers ending in place labels. Our three circle layers
  are added with **no `beforeId`**, so they append on top of all of them. Passing
  a `beforeId` would bury the pins under country names.

The layout is a CSS grid in `src/styles.css`: a masthead and the demo-data notice
across the top, a scrolling reading rail on the left (the unmapped list and the
detail panels), and the map in a pane of its own on the right. The map container
is `position: relative` **inside that pane**. It must never be absolutely
positioned against the viewport: with nothing positioned above it, the opaque
basemap covers the heading, the notice and both panels and swallows their clicks.
jsdom has no layout engine, so **no unit test in this repo can catch that** — check
it in a real browser.

`src/map/style.ts` is where spec §4 lives: each visual channel carries exactly one
meaning. Blur on a language field is a constant and means "this is not a boundary
claim"; colour means confidence; fill-vs-hollow on a pin means tier. Do not let a
second meaning onto a channel — `tests/style.test.ts` asserts the actual values,
not merely that an expression mentions the right word.

## What is hand-edited and what is not

- `data/languages/*.yml`, `data/initiatives/*.yml` — hand-curated, reviewable diffs.
- `data/derived/**` — GENERATED. Never hand-edit.

## Language centre points

Each language record may carry one `centre` — a single coordinate, cited like every
other claim, rendered as a soft edgeless blob. It is an approximate centre, **not a
territory and not a boundary**. Glottolog (CC-BY-4.0) is the default source.

Native Land Digital's territory polygons were considered and withdrawn: their Data
Sovereignty Treaty forbids storing or redistributing their data without explicit
permission, and forbids altering Indigenous land boundaries without consultation —
and simplifying and feathering a polygon does exactly that. See §3a of the design spec.
This project holds no geometry and depends on no third-party map data.
