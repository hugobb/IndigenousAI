# Atlas SP2a — The Owed Corrections: Design

First half of SP2, split out during brainstorming. Builds on merged SP0, SP1a, SP1b and SP1c.
Parent spec: `2026-09-03-indigenous-nlp-atlas-design.md`. Read the three decision records in
`docs/superpowers/decisions/` first — two sections here exist only because of what they record.

**SP2b (publication: Vercel hosting, the CI gate, docs hygiene, the citation note and the Zenodo
release) is a separate spec and is out of scope here.** SP2a lands first because a DOI is an
archival snapshot: minting one over a known correctness gap on the atlas's central claim would
freeze that gap under a citable identifier.

## 1. What this builds

Three things the previous sub-projects recorded as owed:

1. **The `filteredOut` asymmetry** — the same coverage finding is reported under a work filter and
   silently dropped under a language filter.
2. **The panels' missing spec §7 fields**, including the ones that leave `bundle.papers` loaded,
   validated and displayed nowhere.
3. **Provenance** — every `Source` in the data is validated and shown to nobody, on an artifact
   whose stated premise is that every claim carries one.

## 2. Decisions

**C1. `Selection.filteredOut` is renamed to `noMatchingWork` and always computed.** The rename is
load-bearing, not cosmetic. Today `filteredOut` is a **complement** of `languages`; afterwards it is
a **subset** of it. Every call site that writes `[...sel.languages, ...sel.filteredOut]` would
silently double-count under the new meaning. Renaming makes the compiler find all of them.

**C2. `languages` becomes L1 unconditionally.** The map draws every language passing the language
filters, whether or not it has matching work. A language field with no pins near it already reads as
"present, no matching work"; dropping it from the map is what made the map and the rail disagree
about the same language depending on which control the reader touched. This strengthens SP1b's
"never delete a language" rule rather than applying it half the time.

**C3. `Selection` gains `workFiltered: boolean`.** The rail's heading says something different — and
stronger — when no work filter is active, and both it and any future consumer read one flag rather
than each re-deriving it from `FilterState`.

**C4. The panels stay explicit JSX with two shared components.** A `<PanelSection>` and a
`<SourcedField>`. Deliberately **not** a declarative descriptor module in the shape of `facets.ts`
or `columns.ts`: `columns.ts` works because table cells are uniform and three `Cell` kinds cover
every column. Panel fields are not uniform — speakers renders a value plus a conflicts list,
transferability renders three prose lines, papers needs a bundle lookup, centre has a not-mapped
case. A descriptor covering those needs an arbitrary-JSX escape hatch, and a descriptor with an
escape hatch is JSX with extra indirection. The same pattern is right for the table and wrong here,
and the reason is the shape of the data, not consistency.

**C5. Provenance is per-claim, behind a disclosure**, rather than pooled at the panel foot.
Provenance attached to the claim it supports is checkable; a pooled list makes the reader match
sources to numbers by eye.

**C6. The absence of a source toggle is meaningful.** It means the field structurally carries no
`Source` in the schema — not that a source is missing. That only holds if a toggle is never rendered
empty, which makes it a guard.

**C7. A dangling reference renders as its raw id with a marker, never as nothing.** The same rule
`columns.ts` already applies when resolving a language name it cannot find.

## 3. The filter change

```ts
export interface Selection {
  languages: Language[]        // L1: every language passing the language facets
  initiatives: Initiative[]    // I1: unchanged
  noMatchingWork: Language[]   // SUBSET of `languages` — zero covering initiatives in I1
  undatedInitiatives: number
  workFiltered: boolean
}
```

`applyFilters` loses its early return. `noMatchingWork` is computed in one place from `i1`'s covered
set, for every filter state.

**Call sites the rename must reach**, each of which today concatenates and must instead read
`languages` alone: the language-facet counts in `facetSummaries`, the languages-tab rows in
`TableView`, the tab count in `App`, and `App`'s `languageInSelection` check. `MapView` continues to
receive `languageFields(selection.languages)` — now L1, which is the behaviour change.

**`emptyState` gets simpler, not more complex.** The state parked in SP1c — languages match, no
initiatives survive, `filteredOut` empty, so `matched` was returned and nothing explained the empty
screen — becomes unreachable, because `noMatchingWork` is populated in exactly that case.

**A language may now appear in more than one rail group, and that is correct.** `UnmappedList`
computes its "Not mapped" and "Approximate location" groups from `languages`, which is now L1 — so a
language that is both unmapped and has no matching work appears in two groups. Before this change it
appeared only in `filteredOut`, because it had been removed from `languages` entirely. The groups
state **different facts** — "we cannot place it" and "no work exists for it" — and both are true, so
neither may be suppressed to avoid a repeat. What the rail must not do is repeat a name with no
explanation: each group keeps its own heading and hint, which is what tells the reader why the same
language is named twice. `workFiltered` is exactly `anyWorkFilter(state)`, exposed rather than
re-derived.

**The rail's heading becomes filter-dependent.** With a work filter active it keeps today's wording:
*"Matches your filters, but no matching work"*. With no work filter, `I1` is every initiative in the
atlas, so zero coverage is not a filter result but a finding about the dataset, and the heading says
so: *"No work in the atlas for these languages"*. The two claims differ in strength and must differ
in words.

## 4. Provenance

`<SourcedField>` wraps `Field` and renders a disclosure **only** where the record carries a `Source`:
`endangerment.source`, `speakers.source` (and each `conflicts[].source`), `centre.source`,
`site.source`, `governance.source`. `family`, `region`, `typology`, `countries`, `subfamily`,
`glottocode` and `iso639_3` have no source field in the schema and therefore no toggle.

**Conflicting speaker counts are attributed individually.** `speakers` carries a source and each
conflict carries its own. Showing one source under a field displaying two disagreeing numbers leaves
the reader unable to tell which source says 9,600 and which says 1,000 — and being able to tell is
the whole reason the schema keeps both instead of picking one.

**A `ref` is linkified only when `kind === 'url'`.** For `paper` and `doc` the ref is a citation
string or a repo path; an anchor would invent a resource. **`retrieved` is omitted rather than
rendered as "not recorded" for non-url sources** — the schema requires it only for `url`, so for a
paper its absence is correct, not unknown. This is the one place `Field`'s usual convention would
say something false.

**Every disclosure carries a distinguishing accessible name** — `Source for Speakers`, `Source for
Centre` — generated from the field label. A panel holds five or six; identical names would give a
screen-reader user six indistinguishable controls. This is SP1c's accessible-name collision applied
to the class rather than the case: there it was five facet/column pairs and only the one a test
happened to touch was noticed.

## 5. The panels

`<PanelSection>` renders a heading and its own `<dl>`. **Every existing `data-testid` is preserved**,
so `panels.test.tsx` keeps passing unchanged; renaming them would be churn that hides whether the new
fields work.

**Language** — name in the header, then:

| section | fields |
| --- | --- |
| Identity | also known as, glottocode, ISO 639-3, tier, family, subfamily |
| Situation | typology, endangerment✱, speakers✱, region, countries |
| Place | centre✱, or "not mapped" |
| Work | matching initiatives (I1-scoped, keeping its existing hedge) |
| Note | caveat |

**Initiative** — name and kind in the header, then:

| section | fields |
| --- | --- |
| Identity | kind, tier, languages |
| Work | years, applications, methods, models, data regime |
| Governance | posture✱, licence |
| Place | site✱ |
| Evidence | papers, links |
| Note | caveat |
| Does this transfer? | adjacent tier only, as now |

✱ = carries a source disclosure.

**Two additions beyond spec §7, both deliberate.** `region` on the language panel: it is a facet the
reader can filter by, and filtering on a dimension the record never displays is a gap the spec did
not anticipate. `tier` on both: D5 makes it load-bearing — an adjacent-tier language is never
mapped, an adjacent-tier initiative is transferable work rather than work on the language — and a
reader looking at one record has no other way to know.

**Papers resolve through `bundle.papers`**, rendering title, authors, year, venue (nullable → "not
recorded") and a link via `summary_url`. **Links** render label, url and `retrieved`.

**A dependency to carry into SP2b:** `summary_url` links into the MkDocs guide exactly as
`Method.doc_url` does. Both are root-relative, so **both** depend on the single-origin hosting layout
SP2b will establish. SP2b's test for that layout covers two fields, not one.

## 6. Testing

**The rename's three invariants**, because the compiler finds the call sites but cannot stop one
being "fixed" by keeping the concatenation under the new name:

1. `noMatchingWork` is always a subset of `languages`.
2. Language facet counts do not double-count.
3. The Languages tab count equals the rendered row count.
4. A language that is both unmapped and workless is named in **both** rail groups, each under its own
   heading — the case that only becomes reachable once `languages` is L1.

**Symmetry** gets its own test: the same language produces the same rail finding whether narrowed by
a work filter or a language filter. And SP1c's parked state — languages match, no initiatives
survive, nothing explains the empty screen — gets a test that fails if the explanation disappears
again.

**Provenance guards:** no toggle without a source; a toggle with one; each conflicting speaker count
attributed to its own source; `url` linkified and `paper`/`doc` not; `retrieved` omitted rather than
"not recorded" for non-url sources; every disclosure's accessible name distinct within a panel.

**The fixture grows.** It must carry an initiative with a resolvable paper, an initiative with links,
a language with `subfamily`, `countries`, `glottocode` and `iso639_3` populated, and a `kind: 'doc'`
source with null `retrieved` — or none of those paths render anywhere. The `fixture-coverage` test
gains an assertion per case. **The unresolvable-paper-id case stays a synthetic unit test**, not
fixture data: a dangling reference in the fixture would model bad data rather than an honesty case.

**Process, as requirements rather than hopes.** Every guard is mutation-checked during
implementation — make the change it forbids, watch it fail, restore. SP1c wrote **sixteen** guards
that asserted less than their names claimed, every one found this way and none by reading. And the
**seam review is its own task**: SP1c's found five defects that ten per-task reviews had passed, and
composition defects on this project are five for five.

**Named blind spots, so they are not rediscovered as defects.** The map will **not** visually
distinguish a language with no matching work from one with work — that follows the parent spec's
one-meaning-per-channel rule and is why the rail carries the finding, but a reader may expect
otherwise. Panel length at a narrow viewport is untested beyond the rail scrolling. And these are the
first nested `<dl>`s under headings in this codebase; jsdom confirms the semantics, not that it reads
well.

## 7. Out of scope

- **All of SP2b**: Vercel hosting, the CI gate, `site_url`, docs hygiene (the `AGENTS.md`
  self-contradiction, the Docusaurus `README.md` and `.gitignore` leftovers), the citation note, and
  the Zenodo release.
- **Promoting records from `draft` to `verified`** — human review via `atlas/data/REVIEW-QUEUE.md`,
  deliberately outside every implementation plan. `pnpm build:data` and `pnpm build:app` must both
  keep exiting non-zero.
- The parked `FakeMap.once` guard gap and the collapsed-group-selection-growth test from SP1c remain
  owed; neither is addressed here.
