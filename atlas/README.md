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
    pnpm test          # unit tests
    pnpm typecheck     # tsc --noEmit
    pnpm build:data    # extract -> validate -> bundle (the DATA)
    pnpm dev           # dev server on http://localhost:5173, showing the fixture
    pnpm build:app     # production build of the APP; refuses without a real bundle
    pnpm preview       # serve a built dist/ locally

`build:data` and `build:app` are two different things and are not chained on
purpose: the first produces `src/data/atlas.json` from the curated YAML, the
second compiles the page that reads it.

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
  bundle and the banner disappears on its own. Nothing in the app needs editing.
- **`ATLAS_ALLOW_NO_BUNDLE=1 pnpm build:app`** exists only to prove the app still
  compiles (CI, a refactor, a type change). It skips the bundle check, so its
  `dist/` is built against no data at all. **It is never a deploy path.** If you
  find yourself reaching for it to ship something, the answer is to review records.

## The fixture never ships

`pnpm dev` has no generated bundle to show, so it renders
`src/fixtures/atlas.fixture.json` — invented records, behind a banner on the page
saying so. None of it may reach a build. Two independent mechanisms enforce that:

- The build gate above (`vite.config.ts`) refuses the build outright.
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
attribution control, and the CARTO/OSM attribution is a licence condition.

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
