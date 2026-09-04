# Whole-branch review fixes — atlas-sp1c

All 7 findings from the final whole-branch review addressed. For each
guard-worthy finding (Important 1–4, Minor 6–7): wrote the test, applied the
named mutation against a saved copy of the file, watched the new test go red
with the exact assertion the finding predicted, then restored the file from
the saved copy before moving on. Minor 5 (dead exports) had no mutation to run
— it is a reuse/removal cleanup — and is verified by `pnpm typecheck` + `pnpm
test` instead.

## Important 1 — LanguagePanel Centre field said "not recorded"

**File:** `src/components/LanguagePanel.tsx:29-40`

The Centre field routed a null `centre` through `Field`'s generic null branch,
which renders `NotRecorded` ("not recorded" — the words for "we don't know").
But a language with no cited centre is something we *do* know, the same fact
the table's Location column (`src/lib/columns.ts:144-152`, "not mapped") and
the rail heading (`src/components/UnmappedList.tsx:24`, "Not mapped (2)")
already state. Changed the panel to render `<span>not mapped</span>` directly
instead of `null`, bypassing `Field`'s null-is-unknown branch, so all three
surfaces now agree.

**Test:** `tests/panels.test.tsx` — replaced the test that asserted "not
recorded" (which had been encoding the bug as the expected case) with one
asserting `/not mapped/i` matches and `/not recorded/i` does **not**, against
`fixture-unmapped`.

**Mutation:** reverted the JSX to `language.centre === null ? null : (...)`.
Result: `AssertionError: expected 'Centrenot recorded' to match /not mapped/i`.
Test failed as expected; file restored.

## Important 2 — vacuous table-overflow browser test

**File:** `browser-tests/atlas.spec.ts:77-106` (was line 77, now line ~91
after the added comment)

The test compared `.table-wrap`'s and `.atlas__pane`'s bounding-box heights.
Flipping `.table-wrap { overflow: auto }` to `overflow: visible` in
`src/styles.css:118` still passes that comparison — `.atlas__pane { overflow:
hidden }` clips the overflowing content instead of growing the wrapper's own
box, so ~240px of rows become permanently unreachable while the height
assertion holds.

Replaced the assertion with two direct scrollability checks: `scrollHeight >
clientHeight` (there is more content than visible room) and, more
importantly, that assigning `scrollTop = 240` and reading it back yields a
value `> 0` (the box actually has a working scroll container). A box with no
scroll container — `overflow: visible`, or clipped shut by an ancestor —
ignores the `scrollTop` assignment and it reads back `0`.

**Mutation:** `src/styles.css:118` `overflow: auto` → `overflow: visible`.
Result: `expected 0 to be greater than 0` on `scrolledTo`. Failed as
expected; CSS restored.

## Important 3 — unguarded caption counts

**File:** `src/components/TableView.tsx:60,72`

Both captions' `(n)` were never checked against the rows actually rendered.
Added two tests to `tests/table-view.test.tsx`:

- initiatives: renders a selection with 1 initiative (bundle has 4), asserts
  the caption contains `(1)` and not `(4)`.
- languages: renders a selection with 2 rows (1 kept + 1 filteredOut; bundle
  has 5 languages total — L2), asserts the caption contains `(2)` and not
  `(5)`.

**Mutations:**
- `rows.length` → `bundle.initiatives.length` in the initiatives caption:
  test failed, caption printed `(4)` instead of `(1)`.
- `rows.length` → `bundle.languages.length` in the languages caption: test
  failed, caption printed `(5)` instead of `(2)`.

Both restored after confirming red.

## Important 4 — Languages tab count excludes filteredOut

**File:** `src/components/App.tsx:144`

Added a test to `tests/app-wiring.test.tsx` using the existing
`?application=asr` fixture scenario (1 language keeps matching work, 4 are
demoted to `filteredOut` but still render as table rows — same scenario
already used by the map-scoping test above it). Asserts the `view-languages`
strip's `(n)` equals the actual row count (5), not just
`selection.languages.length` (1).

**Mutation:** `counts.languages: selection.languages.length +
selection.filteredOut.length` → `selection.languages.length`. Result: strip
read "Languages (1)" while `expect(label).toContain('(5)')` failed. Restored.

## Minor 5 — dead exports in columns.ts

**File:** `src/lib/columns.ts`

- Removed `columnsFor` (only ever called from `tests/columns.test.ts`, never
  from production code — `columnIds` already serves every real caller).
  Updated `tests/columns.test.ts` to drop the import and the assertion that
  called it, keeping the `columnIds('map')` / `columnIds('languages')`
  coverage.
- `TableViewId` was declared but never imported anywhere; `TableView.tsx:27`
  re-spelled the same union inline (`'initiatives' | 'languages'`). Changed
  `TableView`'s `view` prop to `TableViewId` and imported it, so the type is
  now used for the purpose it was declared for.
- `SortDirection` was exported but never imported outside `columns.ts` (only
  used internally to type `SortState.direction`). Dropped the `export`
  keyword rather than deleting it, since it's genuinely still in use — just
  not by any other module.

Verified with `pnpm typecheck` (clean) and `pnpm test` (392/392 → 393/393
after the Minor 6 test was added).

## Minor 6 — useMap's `once('idle')` never resets

**File:** `src/map/useMap.ts`

`map.once('idle', ...)` set `data-map-idle="true"` exactly once per map
instance and never again — a one-time latch, not a state signal. Any harness
wait issued after a later in-page data change (a filter, say) would see the
stale `true` from the very first paint and resolve immediately, without
waiting for the new frame to actually settle.

Fix: `map.once('idle', ...)` → `map.on('idle', ...)` (persistent), paired
with resetting the attribute to `false` inside `syncData` — which now takes
the container element and a `reset` flag — every time `syncData` is called
in response to a `data` change (the initial call from inside the `'load'`
handler passes `reset: false` since the element already renders
`data-map-idle="false"` in JSX). This is still driven only by MapLibre's own
event callbacks and the existing data-change effect — no per-render work, and
no user-visible behavior change (it's a DOM attribute the app never reads).

**Test:** `tests/use-map.test.tsx` — new test fires `'load'`, then `'idle'`
(expect `true`), rerenders with changed `data` (expect `false`), then fires
`'idle'` again (expect `true` again).

**Mutation:** reverted the whole file to the pre-fix version (`once`, no
reset, `syncData(map, data)` signature). Result:
`AssertionError: expected 'true' to be 'false'` on the post-rerender check.
Failed as expected; new version restored.

## Minor 7 — invalid `aria-selected` on a `role="table"` row

**File:** `src/components/DataTable.tsx:100`

`aria-selected` is only meaningful inside `role="grid"`/`treegrid` (which
also implies arrow-key navigation this table doesn't implement). Replaced
with `aria-current={r.id === selectedId ? 'true' : undefined}` — valid on any
element, and it states the right thing (this is the current record, not a
multi-select grid selection).

Updated the tests that asserted `aria-selected`:
- `tests/data-table.test.tsx` — "marks the selected row with aria-current,
  and only that row": asserts the selected row is `'true'` AND both other
  rows are `null` (not just one).
- `tests/app-wiring.test.tsx` — both "marks the row named by the URL as
  selected on the languages/initiatives tab" tests updated the same way
  (selected row `'true'`, every other row `null`).

**Mutations, both run against `DataTable.tsx`:**
- Selected row never marked (`aria-current={undefined}` unconditionally):
  3 failures across the two test files — selected row read `null` instead
  of `'true'`.
- Every row marked (`aria-current="true"` unconditionally): 3 failures —
  unselected rows read `'true'` instead of `null`.

Both mutations caught in both files; restored.

## Suite results (final state, all fixes applied)

```
pnpm test           → 40 files, 393 passed
pnpm typecheck       → clean, no errors
pnpm test:browser    → 9 passed
```

## Gate checks (final state)

```
pnpm build:data; echo "build:data exit: $?"
  → validate: 10 problem(s) (draft-status records) — Nothing was built.
  → build:data exit: 1

pnpm build:app; echo "build:app exit: $?"
  → [atlas-require-real-bundle] refusing to build without src/data/atlas.json
  → build:app exit: 1
```

Both gates still refuse, as required.

## Findings not fixed

None. All 7 findings (Important 1–4, Minor 5–7) were fixed and verified.
