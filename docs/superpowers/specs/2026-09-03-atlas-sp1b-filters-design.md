# Atlas SP1b — Querying the Map: Design

**Status:** approved, not yet planned
**Parent:** `2026-09-03-indigenous-nlp-atlas-design.md` (D6 and D7 bind this work)
**Predecessor:** `2026-09-03-atlas-sp1a-map-design.md`, merged as `cd99dda`; its decision
record is `docs/superpowers/decisions/2026-09-03-atlas-sp1a-rulings.md`
**Scope:** SP1b only. The table view is SP1c.

## 1. What this builds

SP1a renders the atlas honestly. SP1b makes it queryable: eight facet groups, a
two-handle date window, a rail that reports what filtering removed, and a URL that can
be cited in a paper.

The seam with SP1c is real. SP1b is about **narrowing a selection**; SP1c is about
**presenting that selection a second way**. Everything here narrows one shared
`FilterState`; a table consumes the result without changing how it is computed. Deferring
it keeps this plan focused and lets SP1c's spec be written against a working filter — the
same staging that made SP1a's spec better than a combined SP1's would have been.

## 2. The data reality this design must survive

Checked against all ten curated records before designing anything. Of D6's eight facets,
**four have no values at all**:

| Facet | Entity | Coverage today |
|---|---|---|
| family | language | 5/5 |
| region | language | 5/5 |
| typology | language | **0/5** — `[]` on every record |
| endangerment | language | **0/5** — `null` on every record |
| application | initiative | 5/5 |
| governance | initiative | 3/5 |
| method | initiative | **0/5** — `[]` on every record (39 methods exist in the corpus) |
| data regime | initiative | **0/5** — `null` on every record |

This is not a data defect. It is SP0's honesty rule working: Myaamia's sources describe it
as "Highly Agglutinative & Polysynthetic", and the record still carries `typology: []`
because nobody would assert that without a citation. **Sparse-to-empty is the normal case
here, not an edge case**, and the facet UI is designed around that rather than patched for
it.

Timeline data: `started` is present on 4 of 5 initiatives (range 1999–2021); Te Hiku Media
has none; no initiative has `ended`. Languages carry no date, so the timeline constrains
initiatives only.

## 3. Decisions

| # | Decision | Rejected alternatives |
|---|---|---|
| F1 | **Cross-filter, but a language is never deleted.** Work facets narrow initiatives; a language with no surviving initiative leaves the map and appears in the rail. | Matched-entities-only was rejected: a language with no initiatives would vanish the moment any work facet is touched, hiding precisely the gaps the paper documents. Independent per-entity filtering was rejected: it makes "ASR work on polysynthetic languages" inexpressible. Map-dimming was rejected: §4 gives each visual channel one meaning, and colour, blur and opacity are already spoken for. |
| F2 | **The URL is a citable contract**: fixed readable keys, additive-only, unknown keys and values ignored rather than fatal. The masthead shows the bundle's `generated` date. | Convenience-only state was rejected: a URL printed in a paper is permanent in a way the code is not. Pinning a dataset version in the URL was rejected: it requires hosting every historical bundle, which belongs to the SP2 deployment decision if anywhere. |
| F3 | **URL is the single source of truth**, via a pure codec and a pure reducer; exactly one effect writes it. | React-state-with-a-URL-mirror was rejected: two sources that can drift, and a URL disagreeing with the view is itself a citability failure — structurally the same weakness as a flag that mirrors rather than derives. |
| F4 | **All eight facets always render.** A group where every record is unrecorded renders non-interactive: "typology — not yet curated (5 records)". Where only some are missing, "not recorded" is a selectable value. | Rendering only facets with values was rejected: it hides the curation gap, the opposite of how this project treats every other absence. Plain interactive facets were rejected: four groups would empty the map and read as a bug. Cutting the four was rejected: it silently narrows an approved D6. |
| F5 | **The timeline cannot remove an undated initiative.** | Excluding them was rejected: it deletes Te Hiku Media, the atlas's most prominent Indigenous-led initiative, whenever the slider moves. The tension is acknowledged in §6 rather than hidden. |
| F6 | **Two native `<input type="range">` elements**, not a custom two-thumb widget. | A custom drag widget was rejected: it would be untestable under F8's jsdom strategy, making it the third thing in this project whose correctness rests on a browser nobody runs in CI. Native inputs are keyboard-accessible for free and work with `fireEvent`. |
| F7 | **Facet counts are live**, computed against the current selection excluding that group's own choices. | Static whole-dataset counts were rejected: an option reading "asr (1)" that yields nothing is exactly the dishonesty this artifact avoids elsewhere. |
| F8 | **jsdom only; no browser in CI for SP1b.** Blind spots are named in §8. | Adding Playwright was rejected for this sub-project: it expands a plan just narrowed by deferring the table. It remains the right answer eventually and is recorded as owed. |
| F9 | **No faceted-search dependency.** Eight groups over ten records is a `filter()` call. | A library was rejected as weight without benefit. |

## 4. State and the URL contract

```ts
interface FilterState {
  family: string[]              // data-derived, not a vocabulary
  typology: Typology[]
  endangerment: Endangerment[]
  region: Region[]
  application: Application[]
  method: string[]              // method ids from the corpus
  regime: DataRegime[]
  governance: GovernancePosture[]
  from: number | null           // timeline window; null = open end
  to: number | null
  lang: string | null           // open language panel
  init: string | null           // open initiative panel
}
```

**The twelve URL keys are exactly the field names above.** Readable beats terse for a URL
printed in a paper, and stability costs the same either way. Selection is included so a
cited link can open a specific record.

**Multi-value is comma-joined** — `?application=asr,tts&region=north-america` — which reads
better in print than repeated parameters. This is safe only while no facet value contains a
comma, so a test asserts that across every vocabulary and every data-derived family and
method id. A future record introducing a comma fails that test rather than silently
corrupting a URL.

**`_none` is the wire form of "not recorded"** — `?endangerment=_none`. A leading underscore
cannot collide with a kebab-case vocabulary value.

**Unknown keys and unknown values are ignored.** An old link degrades to a broader view; it
never errors. This is the load-bearing half of F2.

**An unconstrained timeline is `from: null, to: null`**, not the data's min and max. The
window defaults to the full range per D7, and representing that as nulls makes "is the
timeline constraining anything?" unambiguous in §5 step 3, keeps the key out of a default
URL, and means the range still reads as unconstrained after a record widens the data.

**History:** discrete changes push, so Back undoes a filter; timeline dragging replaces, so a
drag does not flood the back stack.

**Modules**, following the split that made SP1a's substance testable:

- `src/lib/url-state.ts` — `parseFilters(search)`, `toSearch(state)`. Pure.
- `src/lib/filters.ts` — the §5 pipeline and count computation. Pure.
- `src/state/useFilters.ts` — reducer wiring and the single URL-writing effect.

## 5. Filter semantics

Three pure steps:

1. **`L1`** — languages passing the language facets.
2. **`I1`** — initiatives passing the work facets, passing the timeline, and — *only when at
   least one language facet is active* — linking to at least one language in `L1`.
3. **`L2`** — languages in `L1` having at least one initiative in `I1`. When no work facet
   and no timeline constraint is active, `L2 = L1`.

Step 2's conditional matters. `InitiativeSchema` requires `languages` to have at least one
entry, so with no language facet active `L1` is every language and the intersection can
never be empty — the conditional and the unconditional forms agree today. It is written
conditionally anyway so the rule does not depend on a `.min(1)` three files away. SP1a
shipped a non-null assertion that was correct only because of an invariant elsewhere, and
the review called it fragile for exactly this reason.

The map draws `L2` and `I1`.

The rail gains a third group beside "not mapped" and "approximate location":
**"Matches your filters, but no matching work (n)"**, containing `L1 \ L2`. This is a
finding, not an error state: filtering to ASR does not make Choctaw disappear, it makes
Choctaw say it has no ASR work.

Languages outside `L1` appear nowhere. Only languages the reader asked for, which turned out
to have no matching work, are surfaced — otherwise filtering to Oceania would list the other
four languages as "filtered out", which is noise.

Empty result states plainly that nothing matches and offers a clear-filters control.

## 6. Facet UI and timeline

The timeline is a horizontal strip between the banner and the map, spanning the map pane.
The eight facet groups sit in the existing rail above the contextual groups, as collapsible
`<fieldset>`s whose collapsed header shows the group name and its active-selection count. A
"clear all filters (n)" control sits at the top. The detail panel keeps its place below.
SP1a's named grid areas make this additive.

**Groups with more than twelve options get a type-to-narrow input.** Method has 39 in the
corpus, so a flat checkbox list is unusable the moment anyone curates it; `family` gets the
same treatment if it grows.

**Uncurated groups are visually distinct from unselected ones**, so a reader can tell "no
filter applied" from "this dimension has no data yet."

**On F5's tension, stated rather than buried:** showing an undated initiative inside a
1999–2005 window is imprecise. It is preferred to the alternative because a visible
imprecision beats an invisible deletion. The timeline is labelled with how many initiatives
it cannot constrain.

The masthead shows the bundle's `generated` date, so a cited view can name its snapshot.

## 7. What SP1b does not change

`layers.ts`, `style.ts`, `confidence.ts`, `load.ts` and the §4 visual encoding are
untouched. Filtering changes *which* records reach `languageFields`/`initiativeSites`, never
how a record is drawn. In particular a language field's `circle-blur` stays the constant
`1.2`, and filtering never becomes a fifth visual channel.

## 8. Testing, and named blind spots

Covered without a browser: codec round-trip; unknown keys and values degrading; the `_none`
sentinel; comma-safety across vocabularies and data-derived values; the `L1`/`I1`/`L2`
pipeline including F1 and F5; live counts; facet rendering, counts, and the non-interactive
uncurated state; timeline clamping `from ≤ to`; the rail's new group; the empty-result state.

**The URL contract test hardcodes the twelve documented keys.** A test deriving keys from
`FilterState` cannot detect a breaking rename — it would follow the code and stay green
while every URL in the paper broke. Hardcoding is what makes it a contract rather than a
mirror.

**The filter-to-map seam is assertable even though the map is not.** With the existing
`maplibre-gl` mock, a jsdom test asserts `MapView` receives `languageFields(L2)` and
`initiativeSites(I1)`.

**Named blind spots, so they are not rediscovered as defects:** whether the map visually
repaints on filter change; the timeline strip's layout and rail overflow at narrow widths;
the feel of two stacked range inputs. All three of SP1a's worst defects were of this kind.

**Process requirement carried from SP1a:** every guard test must be mutation-checked during
implementation — make the change it forbids, watch it fail, restore. Four SP1a guards
asserted less than their names claimed, and each was caught this way rather than by reading.

## 9. Out of scope

The table view is SP1c. A browser test harness is owed and unscheduled. Deployment, the
Zenodo DOI, and the stale Docusaurus references in `AGENTS.md` and `docs/README.md` are SP2.

Three items deferred from SP1a remain open and are **not** addressed here, because each
needs its own decision about what a panel shows: the narrowed §7 panel field lists, which
leave `bundle.papers` loaded and validated but displayed nowhere; the absence of any
displayed provenance despite D9 making it first-class; and `Method.doc_url` being
root-relative, which will 404 from the atlas origin and needs a `site_url` in `mkdocs.yml`.
They are natural companions to SP1c's panel and table work.
