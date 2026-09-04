# SP1c decision record — the table view

Decisions taken while implementing `docs/superpowers/plans/2026-09-04-atlas-sp1c-table.md`
against `docs/superpowers/specs/2026-09-04-atlas-sp1c-table-design.md`. Companion to
`2026-09-03-atlas-sp1a-rulings.md` and `2026-09-04-atlas-sp1b-rulings.md`; read those first.

## The lesson that dominated this sub-project

**Sixteen guard tests written for this plan asserted strictly less than their names claimed.**
Every one was found by mutating the code and watching the test stay green — none by reading.
That is not a tail of unlucky cases; it is most of the guards in a plan written with unusual
care, by an author who had already recorded the same lesson twice.

Three were bad enough to be worth naming:

- **The browser harness could not catch the defect it was built for.** Deleting the `pane`
  area from the *narrow-viewport* `grid-template-areas` block passed all eight original
  harness tests. That layout sets the pane's height directly, so the real breakage is
  positional — the pane squeezed to 260px inside the rail's column — not the height loss the
  tests looked for. And the height threshold that was written, `> 300`, sits **below** the
  337px collapse its own comment cites: a recurrence of the exact historical defect would
  have passed.
- **The map-repaint test was comparing text, not the map.** The harness blocked
  `tiles.openfreemap.org/**` to run offline — which is also where `BASEMAP_STYLE` lives. So
  MapLibre never loaded, `'load'` never fired, no layer ever rendered, and the screenshot
  difference the test asserted was the view-switch's count text changing inside the pane. The
  test written to close a blind spot named in SP1b was testing nothing.
- **Two mutation *checks* were themselves toothless.** The numeric-comparison guard used the
  values 2 and 0, which sort identically as strings and as numbers, so the mutation it existed
  to catch passed 12/12. A reviewer reverted the fixture independently and reproduced zero
  failures.

**The rule that follows:** on this project a guard is not evidence until the thing it protects
has been broken and the guard has been watched to fail. Writing it and reading it back is not
evidence. Neither is a reviewer agreeing with it.

## The composition defect, fourth and fifth instances

SP1a and SP1b each recorded two individually-correct decisions in different tasks composing
into a defect no per-task reviewer could catch. SP1c made the seam review its own task, and it
paid: five findings, all invisible to the ten task reviews that preceded it.

- **A year printed as a quantity.** `renderCell` called `toLocaleString` on every number, so
  the table showed `2,016` beside the panel's `2016` on the same screen. Correct in the cell
  renderer, correct in the column declaration, wrong together.
- **Three wordings for one fact.** At `?view=languages&lang=fixture-unmapped` the panel said
  "not recorded", the Location column said "not mapped", and the rail headed a group "Not
  mapped (2)" — simultaneously. The columns module's own comment forbids the first: a language
  with no cited centre is something we *know*, and "not recorded" claims we do not.
- **A caption over-claiming its own table.** The initiatives caption said every column reflects
  all current filters, while the `languages` column beside it is declared `scope: 'bundle'`.
- **"Not recorded" for a scoped empty list.** `LanguagePanel` printed "we don't know" about
  work we do know about and are deliberately hiding, beside a table printing a carefully
  scoped `0`.
- **A dead control and a false announcement.** Every header announced `aria-sort="none"` over
  visibly name-ascending rows, and the first click on `Name` did nothing.

## Rulings

**Pre-flight 1 (Task 6).** The plan's test asserted `queryByTestId('map-container')` is null.
No such test id exists, and `app-wiring.test.tsx` mocks `MapView` wholesale — so the assertion
would have passed whatever the code did. Replaced with the mock's own `map-language-ids`. A
vacuous assertion is worse than none: it reports coverage it does not have.

**Pre-flight 2 (Task 6).** The plan's CSS referenced `var(--bg)` and `var(--accent-muted-bg)`,
neither defined. An undefined custom property resolves to nothing, so a sticky header would
render transparent and rows would scroll under it — invisible to jsdom, catchable only by eye.
Mapped to the real tokens `--panel` and `--notice-bg`.

**Task 4.** A language-only filter takes `applyFilters`' early-return path, which sets
`filteredOut: []` unconditionally even when no initiative survives — so `emptyState` returns
`matched` and neither empty-state card renders. **`emptyState` was deliberately NOT widened:**
the rail's sentence counts `filteredOut`, so `no-work-but-languages` there would read "0
languages … are listed below". Instead `DataTable` always receives a non-null `emptyMessage`.
"Did anything match" stays one shared predicate; "this table has no rows" is each table's own
statement about its own rows.

**Task 10.** The harness's `reuseExistingServer: false` plus `--strictPort` is **not** a defect
and stays. A harness must know exactly what it is testing; a peer worktree holding the port is
a local inconvenience, not a correctness risk.

**Task 11 (recorded, not fixed).** `filteredOut` is populated only under a work filter, so the
same coverage finding is a headed rail group at one citable URL and invisible at another. The
fix lives in `applyFilters`, which spec §3 pins as unchanged for this sub-project, and the
languages table already carries the finding as `Matching work: 0`. **Owed as SP2 work, not
closed** — the rail under-reports at language-only filters; the table does not.

**Final review (parked, not fixed).** `FakeMap`'s `once` is a non-detaching alias of `on`, so
reverting `useMap`'s `map.on('idle')` back to `map.once('idle')` passes all 393 unit and 9
browser tests. The production code is correct; only the guard is missing, and the browser test
cannot catch it because navigating remounts the map rather than changing data in place. Worth
recording honestly: **the Task 10 review predicted this exact gap and it was deferred as a
minor; it then bit at the final review.** The fix is one line in the test double.

## Carried into SP2

- The parked `FakeMap.once` guard, above — one line.
- The `filteredOut` asymmetry, above — a change to `applyFilters`, deliberately out of scope here.
- No shipped test covers a facet selection *growing* (1→2) while its group is manually collapsed;
  the code is edge-triggered and correct, but a regression to a level-triggered check would pass.
- `useMap`'s comment claims "no per-render work", but `MapView` builds a fresh data literal each
  render so the effect runs per render. Pre-existing, user-invisible.
- Still owed from SP1a and unchanged: spec §7's narrowed panel field lists, which leave
  `bundle.papers` loaded, validated and displayed nowhere; no provenance displayed; and
  `Method.doc_url` being root-relative, so it will 404 from the atlas origin.
- The ten records remain `status: draft`. `pnpm build:data` and `pnpm build:app` both still exit
  non-zero, which is the point.
