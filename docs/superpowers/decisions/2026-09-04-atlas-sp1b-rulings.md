# SP1b decision record — querying the map

Decisions taken while implementing `docs/superpowers/plans/2026-09-03-atlas-sp1b-filters.md`
against `docs/superpowers/specs/2026-09-03-atlas-sp1b-filters-design.md`. Companion to
`2026-09-03-atlas-sp1a-rulings.md`; read that one first.

## The lesson that repeated

**For the third time on this project, two individually-reasonable decisions in different
tasks composed into a defect no per-task reviewer could catch.** Task 3 decided
(correctly) that `filteredOut` is a finding rather than an error state. Task 7 defined
"nothing matched" from `languages` and `initiatives` — locally reasonable. Together the
rail rendered **"Nothing matches the current filters"** directly above a populated
*"matches your filters, but no matching work"* group: a false denial above the true
finding, on the one screen the sub-project exists to get right. It was specified verbatim
in the plan, so no task reviewer had cause to question it.

The two earlier instances are recorded in SP1a's decision record. Review the seams
between tasks explicitly; per-task review cannot catch this class by construction.

**Second repeated lesson: a ruling must be applied to the class, not the case.** Mid-flight
I diagnosed "the component works but is not wired" and fixed the two props in front of me.
Five further `App` wiring mutations — deleting the entire `<Timeline>`, stubbing
`onToggle`, stubbing `onClearAll`, zeroing `undatedCount`, feeding the map L1 instead of
L2 — still left all 251 tests green. **The rule that came out of it:** for every prop `App`
computes, there must be an App-level test that fails if it is replaced by a constant.

**Third: seven guard tests across SP1a and SP1b asserted less than their names claimed.**
Every one was caught by mutating the code, never by reading it. Reviews on this project
should mutation-test by default.

## Rulings

**1–2 (pre-flight).** `filteredOut` is a **required** prop on `UnmappedList` — an optional
one would let a call site silently omit it and show no group at all, which is the
disappearance the design exists to prevent. Task 7 also had to add the `timeline` grid
area, not just the markup, or its own suite would have ended red.

**3–4 (URL codec).** `?from=` must yield `null`, not year 0 — `Number('')` is `0` and
passes an integer check, so the guard that rejects `banana` waved an empty value through.
And the comma-safety guard was extended to real `family` values: comma-joining is safe only
while no facet value contains one, and `family` is free text with no schema constraint.
**Deliberately not** a schema regex banning commas — that would constrain what a curator may
record about a language to suit a URL encoding, which is backwards. The data is the
artifact; the URL serves it.

**5–7 (filter pipeline).** `undatedInitiatives` is computed in both branches — returning 0
in the no-filter path meant the landing view under-reported Te Hiku Media. Language-facet
counts are computed against **L1**, not L2: a badge that counts only the map-surviving
subset undoes F1 one layer up, since the reader sees "1", clicks, and only then discovers a
second language existed.

**8–10 (state hook).** `useFilters` listens for `popstate` — without it Back moved the
address bar while the view stood still, which is exactly the URL/view divergence F3
forbids. Canonicalising a non-canonical URL on mount **replaces** rather than pushes: a
write the reader never asked for must not be undoable. `EMPTY_FILTERS` is deep-frozen, so
accidental mutation of the shared singleton throws instead of silently corrupting state.

**11 (timeline).** `Timeline` stays **purely controlled**. An implementer added local state
synced from props to satisfy a defective test of mine; that is derived state, and it gives
the date window a second source of truth. The test was what was wrong — in the running app
the parent re-renders before the next discrete event; only the test skipped that step.

**12 (facet panel).** The component must read `summary.curated`, never
`summary.options.length`. `curated` is bundle-scoped, `options` is pool-scoped: the
substitute would announce "not yet curated" for a dimension that merely had no values under
the current filter — **inventing** a curation gap, which for this artifact is as bad as
hiding one.

**13, 16 (wiring).** See the class lesson above.

**14.** The masthead shows a plain date, not a machine timestamp. It exists so a citation
can name its data snapshot.

**15, 17–18 (final review).** The empty state must also require `filteredOut` to be empty.
A selected facet value is **always rendered, whatever its count** — otherwise a selection
can be counted out of its own group and become invisible, unclickable and unclearable. The
timeline counts as an active filter, or constraining only the date renders no Clear-all
control at all.

**19.** The fixture gained an undated initiative. All three were dated, so the rule that a
date window must never delete an undated initiative had no end-to-end path in the artifact
anyone actually runs.

## Carried into SP1c

- **The facet groups are not collapsible**, though spec §6 and the plan both say so — a
  silent narrowing of an approved spec, recorded rather than lost.
- `lang`/`init` behaviour when a filter removes the selected record: undecided in both
  directions and for both entity kinds; currently a silent null.
- `clearFacet` is implemented and tested but dispatched by nobody — wire it to a per-group
  control or delete it.
- `FilterState` widened from the spec's vocabulary unions to `string[]` to accommodate the
  `_none` sentinel. Defensible, undocumented; decide where `_none` lives in the type system.
- `init` is reachable only by clicking a map pin — no keyboard or rail path.
- **The fixture is a first-class artifact with an obligation.** It is what the demo build,
  the dev server and every App-level test render, so it must model each honesty case the
  spec turns on, or those cases are unrenderable and untestable end to end.
- A **scope-and-unit table** for every number the UI prints: `curated` is bundle-scoped,
  `notRecorded` pool-scoped, language options count L1, initiative options count I1, and
  none of them carry a unit.
- Still owed from SP1a: a browser-based regression harness; spec §7's narrowed panel field
  lists, which leave `bundle.papers` displayed nowhere; no provenance shown; and
  `Method.doc_url` being root-relative, which will 404 from the atlas origin.
