# SP1a decision record — the atlas map

Decisions taken while implementing `docs/superpowers/plans/2026-09-03-atlas-sp1a-map.md`
against `docs/superpowers/specs/2026-09-03-atlas-sp1a-map-design.md`. Each was made
mid-implementation rather than deferred, and each records what it would cost if wrong.
Kept because several are direct inputs to SP1b.

## Two lessons that outrank the individual rulings

**1. Twice, two individually-reasonable decisions in different tasks composed into a
defect that no per-task review could see.**

- Task 2's data scope named only two exemplar records, and the schema defaulted
  `confidence` to `sourced`. Separately fine. Together they silently labelled
  AmericasNLP's coordinate as trustworthy while the record's own caveat said the
  workshop has no fixed venue.
- Task 1 parked the runtime libraries in `devDependencies`, and Task 4 derived the
  production guard from `import.meta.env.PROD`. Separately fine. Together: a
  production-only install builds nothing, the natural workaround is
  `NODE_ENV=development`, and that is exactly the switch that shipped invented
  fixture records as a deployable atlas.

Review the seams between tasks explicitly. Per-task review cannot catch this class.

**2. Guard tests here repeatedly asserted less than their names claimed.** Four instances,
every one found by a reviewer told to *attack* the guard — mutate the code and watch —
rather than read it. A guard that stays green when the thing it guards is deleted is
worse than no guard, because it reads as coverage. Reviews on this project should
mutation-test by default.

**Corollary:** this project's worst defects were invisible to unit tests *by construction*
— one lived in the build pipeline, two needed a layout engine. Claims about how this page
renders are not meaningful without a browser in the loop.

## Rulings

**1. `MapView.tsx` and `useMap.ts` may land unreferenced and untested.** MapLibre needs a
WebGL context jsdom lacks, so the testable substance lives in `layers.ts` and `style.ts`
and the imperative glue stays thin. Nothing mounts `MapView` until Task 8.

**2. Task 2's scope includes `src/schema/vocab.ts`** despite its Files block omitting it —
clerical.

**3. A static JSON import may replace top-level `await import`** in `load.ts`; eager either
way, and it keeps top-level await out of the module graph. (Fired.)

**4. `tsconfig` `include` lists `vite.config.ts` literally, not `*.ts`.** `vitest@2` hard-depends
on `vite@5` while the app uses `vite@6`, so `*.ts` would newly type-check `vitest.config.ts`
and fail on a real vite5-vs-vite6 `Plugin` mismatch predating this work.

**5. Every record carrying a coordinate states `confidence` explicitly.** Auditing beyond the
plan's two exemplars found `americasnlp.yml` inheriting `sourced` while its own caveat says
"an organiser's stated affiliation, not a venue". The label is justified by text already in
the record, so applying it invents nothing. Schema keeps its default; no real record relies
on it.

**6, 7, 9. Three guard tests strengthened after reviewers broke them** — the fixture guard
(emptying `methods`/`papers` stayed green), the production-substitution test (passed with the
entire guard deleted), and the missing `initiativeSites` coordinate-order assertion (a
lat/lon swap shipped silently, putting every initiative pin in the wrong hemisphere).

**8. The empty-bundle production check stays an AND.** It answers "did the gate produce
nothing at all", not "is the atlas editorially complete". Records leave `draft` one at a
time, so a partial bundle is a legitimate incremental publication state. Dangling references
are already caught upstream by `validate.ts`.

**10. A type guard replaces the `l.centre!` assertions** so the type checker, not a
convention, enforces non-nullness inside `.map()`.

**11. The `useMap` load-order race was the difference between the map working and not.**
The data effect ran before the style loaded, no-opped, and never re-ran because
`loadBundle()` is eager and `App` may never re-render — leaving both sources `EMPTY`
forever. Fixed with a `readyRef` set inside `'load'`, and guarded by mocking the
`maplibre-gl` module rather than providing WebGL.

**12. Selected-state confidence masking was a real §4 violation.** An accent halo at 0.55
over the base layer's 0.35 diluted the confidence colour below 16% of the pixel, and blur
is constant on language fields by design, so nothing carried it. `ACCENT_MUTED` keeps
"accent = selected" and "saturation = confidence" as separate channels.

**13. Runtime libraries moved into `dependencies`** — half of the fixture-leak causal chain,
not hygiene.

**14. The final fix ran as two dispatches**, splitting build safety from the rendering layer.

**15. The CARTO basemap was replaced with OpenFreeMap Positron.** Every CARTO tile was
stamped diagonally "API KEY REQUIRED"; any figure cut for the paper would have carried it.
Invisible for the whole branch because nothing had ever rendered the map. **Revisit if
attribution or hosting guarantees matter** — OpenFreeMap is a single volunteer-funded host
with no SLA, and its attribution now arrives from their TileJSON at runtime.

**16. The layout is placed by named `grid-template-areas`.** Relying on grid auto-placement
meant the map and rail collapsed (705px to 337px) the moment the demo banner was absent —
precisely the state real reviewed records will produce, and unobservable while every record
is `draft`.

**17. No Playwright in the repo.** A browser in CI is the right answer to this project's
blind spot, but adding that harness is its own decision with its own surface. Verification
used a throwaway install outside the repo. **This is SP1b's first spec input.**

**18. The full working ledger is kept** at `.superpowers/sdd/2026-09-03-atlas-sp1a-map/`
in the implementation worktree, with per-task briefs, reports and review diffs.

## Carried into SP1b

- A browser-based regression harness (ruling 17). This layout-defect class has no CI guard.
- The plan silently narrowed spec §7's panel field lists; `bundle.papers` is loaded,
  validated and displayed nowhere.
- No provenance is displayed, though D9 makes it first-class — a reader sees coordinates
  with no citation.
- `Method.doc_url` is root-relative and will 404 from the atlas origin; needs a `site_url`
  in `mkdocs.yml`, which does not exist yet.
