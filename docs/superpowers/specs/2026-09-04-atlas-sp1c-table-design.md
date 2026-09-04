# Atlas SP1c — The Table View: Design

Third sub-project of SP1. Builds on merged SP1a (the map renders) and SP1b (facets,
timeline, citable URL). Parent spec: `2026-09-03-indigenous-nlp-atlas-design.md`.
Read `2026-09-03-atlas-sp1a-rulings.md` and `2026-09-04-atlas-sp1b-rulings.md` first —
this design is shaped by defects recorded there, and several sections exist only because
of them.

## 1. What this builds

A table view of the current selection, reachable as a third value of a new `view` URL key,
plus the four carry-overs SP1b recorded rather than lost, plus the browser regression
harness owed since SP1a.

The table is not a second way to look at the same thing. The map shows presence: a point
exists or it does not. The table shows presence **and absence in the same column**, so the
atlas's second claim — which languages have no work — becomes a number a reader can sort
by rather than an emptiness they have to notice.

## 2. Decisions

**T1. One `view` key, three values.** `view=map | initiatives | languages`, default `map`.
A separate `tab` key would be meaningless whenever `view=map`, and a URL able to encode a
nonsense combination will eventually be cited in one.

**T2. Sort order is part of the cited view.** `sort=<column>:<asc|desc>`. A reader
following a link sees the rows in the order the citer saw them. Column ids and directions
are our own kebab-case vocabulary, so no curator-authored string enters the key and SP1b's
comma-safety problem does not recur.

**T3. The URL contract goes from twelve keys to fourteen.** The contract test hardcodes its
key list deliberately, so this is an intentional edit to a test that exists to make renames
hurt. Deriving the list from `FilterState` would let a rename stay green while every URL in
the paper broke.

**T4. Columns are declared data, not markup.** A pure `columns.ts` module in the shape of
`lib/facets.ts`: `{ id, header, scope, cell, sort? }`. `facets.ts` is the module on this
project that most earned its keep — the single place a facet id meets a record field, and
the reason the `application`/`applications` singular-plural trap never bit. Two bespoke
table components would write sorting and null-rendering twice, and this project's recurring
defect is two reasonable local decisions composing badly. No table library: a new runtime
dependency for ten columns over sixty rows, when a runtime library in the wrong dependency
block is one of the two mistakes that produced the fixture leak.

**T5. The languages table shows L1, not L2.** Every language passing the language filters,
including the ones the map drops for having no matching work, with a `matching work` count
column. Sorted ascending, every coverage gap floats to the top of the page as a list.

**T6. One empty-state predicate, consumed by both surfaces.** Hoisted out of `App.tsx` into
a pure `emptyState(selection)` returning `matched | no-work-but-languages |
nothing-matched`. This is the direct fix for the defect that shipped in SP1b, where the rail
rendered "Nothing matches the current filters" directly above a populated *"matches your
filters, but no matching work"* group. Copying today's corrected predicate into the table
would fix the case; one predicate fixes the class.

**T7. A selection is never silently dropped.** If a selected record exists in the bundle but
current filters exclude it, the panel still renders, marked. Silent disappearance under an
unrelated control is the defect class recorded three times on this project.

**T8. `_none` lives in the value space by convention, enforced by a test.** It cannot be
made type-safe: `family` and `method` are free text, so `'_none'` and a family named `_none`
are the same type, and a branded type would be decoration over an unchecked cast.

**T9. The browser harness lives in the repo.** A harness in a scratch directory outside the
repo is a one-off nobody runs again, which is exactly why it has been owed twice.

## 3. State and the URL contract

Fourteen keys, in stable order:

```
family typology endangerment region application method regime governance from to lang init view sort
```

That is the serialisation order `toSearch` already emits, with the two new keys
appended. Order is part of the contract: one state must serialise to one string, or
two citations of the same view compare unequal.

`useFilters` remains the single writer. `applyFilters` is unchanged: the table consumes
exactly the collections the map consumes.

**Degradation.** An unknown `view` value degrades to `map`. A `sort` naming a column that
does not exist for the current `view` parses to `null`, and since `toSearch` omits nulls
and `useFilters` canonicalises on mount with `replaceState`, an inapplicable sort is dropped
from the address bar without the reader having to press Back through a write they never
asked for (SP1b rulings 8–10).

**Not in the URL:** which facet groups are collapsed. That is a reading convenience, not
part of the cited view.

## 4. The table

Seven columns per tab. Each column literal declares its `scope`, which is what turns §11's
scope-and-unit table from a document that drifts into a field the renderer reads.

**Initiatives** (rows: I1)

| column | source | sortable |
| --- | --- | --- |
| name | `name`, with `kind` as a secondary line | yes |
| tier | `tier` | yes, by vocab order |
| languages | `languages` resolved to names via the bundle | by count |
| started | `started` (nullable) | yes |
| applications | `applications` | no |
| data regime | `data_regime` (nullable) | yes, by vocab order |
| governance | `governance.posture` (nullable) | yes, by vocab order |

**Languages** (rows: L1)

| column | source | sortable |
| --- | --- | --- |
| name | `name`, with `adjacent tier` as a secondary line on the adjacent tier | yes |
| family | `family` (nullable) | yes |
| region | `region` (nullable) | yes |
| endangerment | `endangerment.status` (nullable) | yes, by vocab order |
| speakers | `speakers.value` (nullable), with a conflict marker | yes |
| matching work | count of I1 initiatives naming this language | yes |
| location | `not mapped` when `centre` is null, else its `confidence` | yes, by vocab order |

Adjacent-tier rows stay visibly adjacent in both tabs. That tier means transferable work,
not work on the language, and a table that flattened the distinction would overstate
coverage in the one place it is easiest to count.

**The scope trap is handled in the header, not the footnotes.** `matching work` counts I1 —
the set surviving *all* current filters, date window included — so `0` means "no work
matching your current filters", never "no work exists". Those two readings are a citation
apart. The header reads **matching work** and the `<caption>` states the scope sentence
once, in the same DOM the rows live in.

**Speakers shows disagreement rather than resolving it.** `9,600 †` where `conflicts` is
non-empty, the dagger explained in the caption. The schema keeps conflicting figures
deliberately (Choctaw is recorded at both 9,600 and 1,000); the table is the first surface
with room to show that two sources disagree, and silently picking one would undo that.

**Rows select.** The name cell is a `<button>` dispatching the same `selectLanguage` /
`selectInitiative` the map pins dispatch. This closes the recorded gap that `init` was
reachable only by clicking a pin, with no keyboard path at all.

**Semantics.** A real `<table>` with `<caption>`, `<th scope="col">`, `aria-sort` on the
active header, `aria-selected` on the current row. No pagination: sixty rows scroll inside
the pane.

## 5. Sorting

Three rules, each its own guard test.

1. **Nulls sort last in both directions.** "Not recorded" floated to the top of a descending
   sort makes absence read as a maximum.
2. **Every enumerated column sorts by its `vocab.ts` declaration order, not
   alphabetically.** That order is meaningful and alphabetical order is not: `ENDANGERMENT`
   is declared in severity order, so alphabetising it would sort `critically-endangered`
   above `safe` and present severity as an accident of spelling. The same rule covers
   `tier`, `data regime`, `governance` and `location`; `location` treats *not mapped* as its
   last value.
3. **Ties break by `name`, so the order is total and deterministic.** An unstable sort means
   a cited URL shows different rows in a different order on someone else's machine, which
   breaks the citability the `sort` key exists to provide.

Default when `sort` is absent: `name:asc`.

## 6. Empty states

`emptyState(selection)` is the single predicate. The rail keeps its current copy. The table
body renders the same sentence in a row spanning all columns, derived from the same call.
The two surfaces cannot disagree, because there is only one thing to be wrong.

## 7. The carry-overs

### 7.1 Collapsible groups and per-group clear

`FacetGroup` keeps `<fieldset>`/`<legend>` — the correct grouping for a set of checkboxes.
`<details>`/`<summary>` would trade that away and put interactive controls inside a
`<summary>`, which has real user-agent bugs. Instead the legend holds a disclosure
`<button>` with `aria-expanded` and `aria-controls`; the body sits in a div toggled with
`hidden`; the existing count stays in the legend.

Default open, **except** groups with more than `TYPE_TO_NARROW_THRESHOLD` (12) rows —
reusing the existing constant rather than inventing a second size rule for the same
judgment about the same lists. **A group holding any selection is always open on mount.**
That is SP1b ruling 17 one layer up: a selection hidden behind a collapsed disclosure is
exactly as unclearable as one counted out of its own group.

A **clear** button sits in the legend beside the disclosure, rendered only when the group
has a selection, dispatching the `clearFacet` that SP1b implemented, tested, and wired to
nobody.

### 7.2 Selection versus filter

Five cases, all decided:

| case | behaviour |
| --- | --- |
| selected language in L2 | panel renders (unchanged) |
| selected language in `filteredOut` | panel renders (unchanged) |
| selected language excluded from L1 | panel renders, marked *outside your current filters* |
| selected initiative excluded from I1 | panel renders, marked *outside your current filters* |
| id absent from the bundle | key dropped, canonicalised with `replaceState` |

The marker carries two controls: clear the filters, or drop the selection. The record still
exists; saying so costs one line, and today it is a silent null.

### 7.3 The fixture's obligation

The fixture is what the dev server, the demo build and every App-level test render. Any
honesty case it does not model is unrenderable and untestable end to end — which is how the
undated-initiative rule went unexercised until SP1b's final review.

It must model, and a `fixture-coverage` test asserts each by name:

- an undated initiative (added in SP1b)
- a language with no `centre`, so `not mapped` renders
- a language with non-empty `speakers.conflicts`, so the dagger renders
- a language with `family`, `region` and `endangerment` all null
- a facet dimension with no curated values, so the uncurated state renders
- an adjacent-tier initiative carrying `transferability`
- a language in L1 with zero matching work, so the coverage finding appears **on first
  load** rather than only under a contrived filter

### 7.4 `_none`

Documented as a value-space convention, enforced the way comma-safety already is: a
**collision test** asserting that no vocabulary member and no data-derived value in the
bundle equals the sentinel. `FilterState` stays `string[]`, and this paragraph is the
documentation that was missing.

## 8. Testing

Covered in jsdom: the columns module as pure functions; the three sorting rules each as
their own guard; `emptyState` asserted at both call sites; row selection dispatching the
same actions as a map pin; collapse/expand with its ARIA wiring; per-group clear; the
out-of-filter marker for both entity kinds; unknown-id canonicalisation; the `_none`
collision guard; the fixture-coverage test; and the URL contract at fourteen hardcoded keys.

**Two process obligations, as requirements rather than hopes.**

- **Every guard test is mutation-checked during implementation** — make the change it
  forbids, watch it fail, restore. Seven guards across SP1a and SP1b asserted less than
  their names claimed, and all seven were caught this way rather than by reading.
- **The constant-substitution rule extends to the table.** For every prop `App` computes
  there must be an App-level test that fails if it is replaced by a constant. In SP1b five
  such substitutions stayed green — including deleting the entire `<Timeline>`.

**A seam review is its own task, before the final review.** Per-task review cannot catch the
composition defect by construction; it is now three for three. The pass covers every pair of
tasks sharing a file or an interface: table ↔ rail through `emptyState`, columns ↔ facets
through scope, the `view` key ↔ the URL contract, selection ↔ filters.

## 9. The browser harness

A devDependency with its own `pnpm test:browser`, kept **out** of the default `pnpm test` so
the unit suite stays fast and offline.

**It drives `vite dev`, not `vite preview`.** This is forced, not preferred. `vite preview`
serves `dist/`, and `dist/` is produced by `vite build`, where Vite's `command` is `'build'`
and `__ATLAS_ALLOW_FIXTURE__` is therefore baked in as `false`. With no
`src/data/atlas.json` — the normal state, since the gate keeps every record `draft` —
`chooseBundle` throws rather than falling back. No build-shaped artifact can render the
fixture, which is SP1a's guard working as designed. The dev server is the only surface where
the app has data, so it is the only surface a harness can drive.

All requests to `tiles.openfreemap.org` are **blocked at the route level**: MapLibre still
renders our circles and pins from GeoJSON without basemap tiles, so the harness is
deterministic and works offline.

It asserts the five things jsdom structurally cannot:

1. The grid does not collapse in either view mode, **with and without** the demo banner —
   SP1a's actual defect, parameterised.
2. The table does not overflow its pane, and the body never scrolls horizontally.
3. The tab strip does not wrap at a narrow viewport.
4. The map repaints when a filter changes — screenshot the pane before and after a filter
   that removes most records and assert the images **differ**. A difference assertion, not a
   golden-image match, so it cannot rot into flake. This closes a named SP1b blind spot.
5. One keyboard path from a table row to an open panel.

Adding Playwright must leave the build-artifact guard untouched and still running in the
default suite.

## 10. Out of scope

- **CSV/JSON export and the citation note** — SP2, with the Zenodo DOI. The URL is already
  the citable contract; export belongs with the citation story rather than invented ahead of
  it.
- **Deployment and the stale Docusaurus references** in `AGENTS.md` and `docs/README.md` —
  SP2.
- **SP1a's three open panel decisions**, unchanged and still owed: the narrowed parent-spec
  §7 field lists, which leave `bundle.papers` loaded, validated and displayed nowhere; the
  absence of any provenance display; and `Method.doc_url` being root-relative, so it will
  404 from the atlas origin (it needs `site_url` in `mkdocs.yml`).
- **Promoting records from `draft` to `verified`** — human review via
  `atlas/data/REVIEW-QUEUE.md`, deliberately outside every implementation plan.

## 11. Scope and units

Every number the UI prints, with what it is scoped to. `columns.ts` declares the last four
as a field; the rest are recorded here because SP1b shipped them undocumented.

| number | scope | unit |
| --- | --- | --- |
| facet group count `(n)` | the selection, per facet | selected values |
| facet option count | pool: records passing all **other** facets | records |
| `notRecorded` | pool | records |
| uncurated sentence `(n records)` | **bundle** | records |
| language facet option counts | L1 | languages |
| initiative facet option counts | I1 | initiatives |
| timeline `undatedCount` | I1 | initiatives |
| `Clear all (n)` | the selection | facet selections, +1 if the timeline is constrained |
| Initiatives tab count | I1 | initiatives |
| Languages tab count | L1 | languages |
| `matching work` column | I1 | initiatives |
| speakers | the record | people, at `as_of` |
