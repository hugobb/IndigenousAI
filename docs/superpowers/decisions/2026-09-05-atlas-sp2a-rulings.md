# SP2a — the atlas's owed corrections: decision record

Branch `feat/atlas-sp2a`, 22 commits, `1f368a0..fa3b098`.
Plan: `docs/superpowers/plans/2026-09-04-atlas-sp2a-corrections.md`.
Spec: `docs/superpowers/specs/2026-09-04-atlas-sp2a-corrections-design.md`.
393 unit tests at the branch point, **512 at the end**, across 44 files.
`pnpm test:browser` 9/9. `build:data` and `build:app` both still exit 1: the ten
records remain `status: draft`, which is the point.

## What SP2a changed

`Selection.filteredOut` — a **complement** of `languages`, computed only when a
work filter was active — became `noMatchingWork`, a **subset**, computed always.
The map and the rail had been disagreeing about the same language depending on
which control the reader touched. The panels gained the spec §7 fields they never
displayed, grouped into sections, and the provenance the data has always carried
became visible per claim.

## The lessons, in the order they cost the most

### 1. A test suite can hold a contradiction in place

The final whole-branch review found the rail's heading branching on `workFiltered`
while its own hint, two lines below, branched on `languageFiltered`. At
`/?application=asr` — one click on the demo — the heading credited the reader's
filters with selecting four languages and the sentence directly beneath said no
filter had narrowed them.

It survived twenty-one commits, eight per-task reviews and a dedicated seam review
because **both strings were pinned by tests at that same URL**. Each guard was
correct about its own string. The pair locked the contradiction in.

A guard that pins one string in isolation is not a guard on what the screen says.
Where two strings must agree, assert them **together**, in one render, or a future
change will satisfy both tests and contradict itself in front of a reader.

### 2. Composition defects are now nine for nine

Every defect this project has produced came from two individually-correct
decisions in different tasks. Per-task review cannot catch them by construction.

The dedicated seam review (Task 8) found **eight**, of the exact predicted shape.
The best: the rail card headed *"What the map cannot show"* was **correct** while
`filteredOut` was the complement, and became a contradiction the moment Task 1
made it a subset — it then named four languages the map was drawing three of.
No reviewer of Task 1 or Task 2 could have seen it; the heading was not in either
diff.

Then the whole-branch review found the ninth, in the seam review's own fix. The
implementer's note on that is worth keeping verbatim: *"the rule that would have
caught it is the one this task is named for — I applied it between tasks but not
within my own diff."*

**Keep the seam review as its own task.** Then review its output too.

### 3. Guards asserting less than their names claim: still the dominant defect

SP1c shipped sixteen. SP2a found more, every one by mutation and none by reading:

- `it('is always a subset of languages, never a complement')` **could not fail on
  a complement** — its fixture set no language facet, so `l1 === bundle.languages`
  made the two shapes indistinguishable. The invariant was protected by its
  neighbours, not by the guard named for it.
- Task 3's "never renders an empty section" and "no loose fields" guards rendered
  only the *language* panel. The initiative half was uncovered from Task 3 through
  Task 5, and nobody noticed until Task 6 went looking.
- `bundle={{ ...bundle, papers: [] }}` in `App` left all 458 tests green: every
  panel test handed the component a bundle directly, so nothing covered whether
  `App` passed the real one.
- Six of eight constant substitutions on `workFiltered` left the whole suite
  green — including **both** directions on the rail, the headline surface of the
  task that introduced the flag. The check that missed them was one global `sed`,
  which only proves *some* call site is guarded. **Substitute per call site and
  per direction.**

The `true` direction matters most. Hardcoding a flag to its pre-change value
restores the exact bug the task existed to fix, and a suite that only tests the
`false` direction applauds.

### 4. Symmetric guards are the ones that do not decay

Two guards in this branch are set-equality, not membership: the field-to-section
mapping and the disclosure walker. Each fails in **both** directions — a field
moved or lost, *and* a field added without a mapping row. That second half is what
keeps them alive: a later task cannot add a field without being told to declare
where it belongs.

The mapping guard exists because moving `field-family` between two sections left
the entire suite green. Section membership was the only thing Task 3 produced.

### 5. Prescribed mutations are as fallible as the code

Four separate implementers found a mutation in their own brief that **did not
fail**, said so, and constructed the one that did. Every one was right:

- `?? ''` does not defeat "not recorded" — `isEmpty` treats `''` exactly like
  `null`. The mutation that bites stringifies `null` to the text `"null"`.
- A `SourcedField` with a **null** source renders no toggle and is DOM-identical
  to a plain `Field`. The defect is a disclosure on a source-**free** field.
- The uncurated-facet mutation as specified was read by no test that could tell
  the difference.

A mutation check that passes is a finding about the check, not a pass.

### 6. Two defects in the plan itself, both in code the author had already reasoned about

- The `init()` fixture helper took an `over: Partial<Initiative>` and **never
  spread it**, so every override silently vanished and presented as a phantom bug
  in `applyFilters`. This is the same defect the SP1c record already names,
  reproduced by the author who recorded it.
- The plan's `SourcedField` implementation **reintroduced the exact trap the
  `aside` prop was invented to prevent**: it moved the toggle to `aside` and left
  the disclosure *body* in `children`, so with a null value and a live source
  `children` is a two-element array, `isEmpty` is false, and "not recorded"
  disappears. Applied as a mutation, the plan's own code fails the plan's own test.

Both were caught by implementers reading critically rather than transcribing.

## Rulings that shape the code

**The `aside` seam is closed structurally, not documented.** `SourceDisclosure`
and `SourceLine` are module-private and `SourcedField` takes source *data*, so
nothing in the codebase can build a disclosure except `SourcedField`, which only
ever hands it to `aside`. An export-surface guard fails if the door reopens.
Documenting a footgun is not closing it.

**Empty arrays read "not recorded" — everywhere, with one exception.** The seam
review corrected the controller's premise here: the review holds 92 papers with 2
attached to any initiative, and 39 technique docs with 0 attached, so `papers: []`
is **unfinished linking**, not a claim about the world. The rule: *every empty
array reads "not recorded"; an absence reads otherwise only where the atlas
asserts it on another surface* — which is `centre` alone, rendering **"not
mapped"**. Written into `Field.tsx` and pinned by a set-equality guard over a
maximally-empty record.

**The licence is cited, and the contract now says so.** `SourcedField`'s comment
claimed a field with no toggle "carries no `Source` in the schema at all".
`Licence` broke that — its parent `governance` object does carry one. A second
toggle over the identical reference would read as a second **independent**
attribution, and inventing corroboration in a cited artifact is worse than
under-attributing. So: keep the markup, amend the contract, and tell the reader
the licence shares the posture's source.

**Panels are keyed by record id.** Sticky source disclosures were not a
preference but reconciliation showing through: Centre stayed open while
Endangerment was silently discarded, depending on which *other* fields the
incoming record happened to source.

**`matched` with zero table rows is unreachable** — with no language facet `l1` is
the whole bundle, and with one active an empty `l1` forces `i1` empty via the
intersection clause. The guard was **re-pointed, not deleted**, onto the property
that is load-bearing: no `EmptyState` may leave bare column headers.

**The fixture never buys one path by selling another.** Adding `endangerment`
retired the fixture's last uncurated facet. Nulling `data_regime` to restore one
would have relocated the gap and cost the demo its only populated Data-regime
filter. The uncurated state got an App-level test with its **own** minimal bundle
instead.

## Owed to SP2b

- **Make a field's derivation visible in the data.** The class property "no absent
  toggle anywhere means uncited" is structurally uncheckable today: the DOM
  carries no link back to the schema object a field's value came from, so
  `field-licence` (sourced parent) and `field-family` (genuinely sourceless) are
  indistinguishable in the render. The fix needs a per-field declaration at ~30
  call sites plus a new prop on the two most-used components — no small version
  exists, and it would reopen an API Tasks 4-6 just stabilised.
- The ten records are still `draft`. Promotion is human review via
  `atlas/data/REVIEW-QUEUE.md`, and both build gates fail until it happens.
- `Method.doc_url` is root-relative and still needs `site_url` in `docs/mkdocs.yml`.
- Whether to publish `litterature_review/summaries/` at all. Until that is
  decided, `summary_url` renders as a monospace path and never as a link — the
  file is in no MkDocs nav and no built site, so linking it would ship a dead link
  from a deployed research artifact.

## Carried, unresolved

- `.rail-list h3` uses `var(--sans)`, which is defined in `styles.css` but is not
  on the spec's property list. Inherited unchanged; worth reconciling the list.
- The Speakers disclosure toggle renders after the block-level "Sources disagree"
  paragraph, so it drops to its own line rather than sitting beside the figure.
- `InitiativePanel`'s `Languages` field is bundle-scoped with no scope note, while
  the initiatives table caption states that exception explicitly.
