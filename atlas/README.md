# Atlas — data layer

Data pipeline for the Indigenous language NLP atlas.
Design: `../docs/superpowers/specs/2026-09-03-indigenous-nlp-atlas-design.md`

## Node is not on PATH

Node lives under nvm on this machine. Before any command:

    export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"

`node: command not found` means this step was skipped — Node is installed.

## Commands

    pnpm install
    pnpm test          # unit tests
    pnpm typecheck     # tsc --noEmit
    pnpm build:data    # extract -> validate -> bundle
    pnpm dev           # dev server, on the demonstration fixture
    pnpm build:app     # production build; refuses without a real bundle

`pnpm build:data` exits non-zero if any hand-curated record is still `status: draft`.
That is intended: it is what stops an unreviewed record reaching a published figure.

## The fixture never ships

`pnpm dev` has no generated bundle to show, so it renders
`src/fixtures/atlas.fixture.json` — invented records, behind a banner on the page
saying so. None of it may reach a build:

- `pnpm build:app` refuses to start while `src/data/atlas.json` is absent, and
  names `pnpm build:data` as the fix. `ATLAS_ALLOW_NO_BUNDLE=1` skips that check
  for compile-only verification in CI; its `dist/` must never be deployed.
- The fixture is admissible only when Vite's own `command` is `serve`. That is a
  build-vs-serve fact no environment variable can flip — unlike
  `import.meta.env.PROD`, which follows an ambient `NODE_ENV` and once let
  `NODE_ENV=development vite build` emit a deployable `dist/` full of invented
  records.
- `tests/build-artifact.test.ts` runs real builds and greps the emitted JS for
  every identifying string in the fixture. It is slow (~8s) on purpose.

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
