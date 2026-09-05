# Atlas SP2a — The Owed Corrections: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the `filteredOut` asymmetry, give the panels the spec §7 fields they lack, and display the provenance the data has always carried.

**Architecture:** `Selection.filteredOut` becomes `noMatchingWork` — a *subset* of `languages` rather than its complement — and is computed for every filter state; `languages` becomes L1 unconditionally so the map stops dropping languages the rail is about to name. The panels gain two small shared components (`PanelSection`, `SourcedField`) and stay explicit JSX.

**Tech Stack:** TypeScript strict (`noUncheckedIndexedAccess`), React 19, Vite 6, Vitest 2 (node + jsdom), Playwright, pnpm, Node 22.22.2.

**Spec:** `docs/superpowers/specs/2026-09-04-atlas-sp2a-corrections-design.md` — read it before Task 1. Also read `docs/superpowers/decisions/2026-09-04-atlas-sp1c-rulings.md`: two tasks below exist because of what it records.

## Global Constraints

- **Node is not on PATH.** Once per shell: `export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"`.
- **Never run `pnpm approve-builds`.** It overwrites `atlas/pnpm-workspace.yaml` and breaks `pnpm test`.
- **Never promote a record to `status: verified`**, and never edit `atlas/data/**`. `pnpm build:data` and `pnpm build:app` must both keep exiting non-zero.
- **Never fabricate a value.** Unknown is `null` and reads as the words "not recorded". A value we *do* know reads as what we know — a language with no cited centre is **"not mapped"**, never "not recorded".
- **Never invent a destination.** `summary_url` points at an unpublished file; papers render metadata and no anchor.
- `src/lib/**` is pure: no React, no JSX, no DOM.
- **Every guard test must be mutation-checked**: make the change it forbids, run it, watch it fail, restore. Report each. SP1c shipped sixteen guards that asserted less than their names claimed, every one found this way.
- **Never loosen an assertion to make it pass.** Several tasks change shared shapes; update expected values, never the strictness.
- `pnpm test` stays green and offline; `pnpm test:browser` is separate.
- All work in a git worktree. Commit trailer: `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>`

## File Structure

**Create**
- `src/components/PanelSection.tsx` — a heading plus its own `<dl>`. No domain knowledge.
- `src/components/SourcedField.tsx` — wraps `Field`, adds a source disclosure when a `Source` exists.
- `tests/sourced-field.test.tsx`, `tests/panel-sections.test.tsx`, `tests/no-matching-work.test.ts`

**Modify**
- `src/lib/filters.ts` — the `Selection` shape, `applyFilters`, `emptyState`, `facetSummaries`.
- `src/components/App.tsx` — the four `filteredOut` sites.
- `src/components/TableView.tsx` — the languages-tab rows.
- `src/components/UnmappedList.tsx` — the prop, the filter-dependent heading.
- `src/components/LanguagePanel.tsx`, `src/components/InitiativePanel.tsx` — sections, provenance, new fields.
- `src/styles.css` — section and disclosure rules.
- `src/fixtures/atlas.fixture.json` — the new honesty cases.
- Existing tests whose expected values change.

---

### Task 1: `noMatchingWork` — the rename, always computed

**Files:**
- Modify: `atlas/src/lib/filters.ts`, `atlas/src/components/App.tsx`, `atlas/src/components/TableView.tsx`, `atlas/src/components/UnmappedList.tsx`
- Test: `atlas/tests/no-matching-work.test.ts` (create), plus updates to `tests/filters.test.ts`, `tests/empty-state.test.ts`, `tests/table-view.test.tsx`, `tests/filtered-out.test.tsx`, `tests/panels.test.tsx`

**Interfaces:**
- Produces: `Selection { languages, initiatives, noMatchingWork, undatedInitiatives, workFiltered }`. `noMatchingWork` is a **subset** of `languages`. Tasks 2–8 all consume this shape.

**This task must land atomically.** The type change breaks every consumer, so the consumers move with it or the suite ends red. The rename is the safety mechanism: every site that today writes `[...sel.languages, ...sel.filteredOut]` must become `sel.languages` alone, and the compiler is what finds them. **Do not silence a compiler error by keeping the concatenation under the new name** — that is the one way this change goes wrong silently.

- [ ] **Step 1: Write the failing test**

```ts
// atlas/tests/no-matching-work.test.ts
import { describe, expect, it } from 'vitest'
import { applyFilters, emptyState } from '../src/lib/filters.js'
import { EMPTY_FILTERS } from '../src/lib/url-state.js'
import type { AtlasBundle } from '../src/lib/load.js'
import type { Initiative, Language } from '../src/schema/index.js'

const lang = (id: string, over: Partial<Language> = {}): Language => ({
  id, name: id.toUpperCase(), also_known_as: [], glottocode: null, iso639_3: null,
  tier: 'indigenous', family: null, subfamily: null, typology: [], endangerment: null,
  speakers: null, region: null, countries: [], centre: null, caveat: null, status: 'draft',
  ...over,
} as Language)

const init = (id: string, languages: string[], over: Partial<Initiative> = {}): Initiative => ({
  id, name: id.toUpperCase(), kind: 'project', tier: 'indigenous', languages,
  started: 2020, ended: null,
  site: { lat: 0, lon: 0, place: 'p', confidence: 'sourced',
    source: { kind: 'doc', ref: 'fixture', retrieved: null, quote: null } },
  applications: [], methods: [], models: [], data_regime: null, governance: null,
  papers: [], links: [], transferability: null, caveat: null, status: 'draft',
  ...over,
} as unknown as Initiative)

const bundleOf = (languages: Language[], initiatives: Initiative[]): AtlasBundle =>
  ({ generated: '2026-01-01', languages, initiatives, methods: [], papers: [], isDemoData: true })

describe('noMatchingWork', () => {
  // The asymmetry this task exists to remove: the SAME language, with the same
  // absence of work, was reported under a work filter and silently dropped
  // under a language filter.
  it('reports a workless language with NO filters at all', () => {
    const s = applyFilters(bundleOf([lang('a'), lang('b')], [init('i', ['a'])]), EMPTY_FILTERS)
    expect(s.noMatchingWork.map((l) => l.id)).toEqual(['b'])
  })

  it('reports it under a language-only filter', () => {
    const b = bundleOf(
      [lang('a', { region: 'africa' }), lang('b', { region: 'africa' })],
      [init('i', ['a'])],
    )
    const s = applyFilters(b, { ...EMPTY_FILTERS, region: ['africa'] })
    expect(s.noMatchingWork.map((l) => l.id)).toEqual(['b'])
  })

  it('reports it under a work filter, as it always did', () => {
    const b = bundleOf([lang('a'), lang('b')], [init('i', ['a'], { applications: ['asr'] })])
    const s = applyFilters(b, { ...EMPTY_FILTERS, application: ['asr'] })
    expect(s.noMatchingWork.map((l) => l.id)).toEqual(['b'])
  })

  // The invariant the rename exists to protect. Before this change the field
  // was a COMPLEMENT of `languages`; now it is a SUBSET, and every call site
  // that concatenated the two would double-count.
  it('is always a subset of languages, never a complement', () => {
    const b = bundleOf([lang('a'), lang('b')], [init('i', ['a'], { applications: ['asr'] })])
    for (const state of [EMPTY_FILTERS, { ...EMPTY_FILTERS, application: ['asr'] }]) {
      const s = applyFilters(b, state)
      for (const l of s.noMatchingWork) expect(s.languages).toContain(l)
    }
  })

  // C2: the map draws L1. A language the rail is about to name must not have
  // been deleted from the map by the same filter.
  it('keeps a workless language in `languages` under a work filter', () => {
    const b = bundleOf([lang('a'), lang('b')], [init('i', ['a'], { applications: ['asr'] })])
    const s = applyFilters(b, { ...EMPTY_FILTERS, application: ['asr'] })
    expect(s.languages.map((l) => l.id)).toEqual(['a', 'b'])
  })

  it('excludes a language the LANGUAGE facets rejected, rather than calling it workless', () => {
    const b = bundleOf([lang('a', { region: 'africa' }), lang('b', { region: 'oceania' })], [init('i', ['a'])])
    const s = applyFilters(b, { ...EMPTY_FILTERS, region: ['africa'] })
    expect(s.languages.map((l) => l.id)).toEqual(['a'])
    expect(s.noMatchingWork).toEqual([])
  })

  // The state SP1c parked and could not explain: languages match, no
  // initiative survives, the old `filteredOut` was empty, so `emptyState`
  // returned `matched` and no surface said anything at all. Now reachable AND
  // explained, because `noMatchingWork` is populated in exactly this case.
  it('explains a work filter that leaves no work at all', () => {
    const b = bundleOf([lang('a')], [init('i', ['a'], { applications: ['asr'] })])
    const s = applyFilters(b, { ...EMPTY_FILTERS, application: ['mt'] })
    expect(s.initiatives).toEqual([])
    expect(s.noMatchingWork.map((l) => l.id)).toEqual(['a'])
    expect(emptyState(s)).toBe('no-work-but-languages')
  })

  it('reports whether a work filter is active', () => {
    const b = bundleOf([lang('a')], [init('i', ['a'])])
    expect(applyFilters(b, EMPTY_FILTERS).workFiltered).toBe(false)
    expect(applyFilters(b, { ...EMPTY_FILTERS, application: ['asr'] }).workFiltered).toBe(true)
    expect(applyFilters(b, { ...EMPTY_FILTERS, from: 2000 }).workFiltered).toBe(true)
    expect(applyFilters(b, { ...EMPTY_FILTERS, region: ['africa'] }).workFiltered).toBe(false)
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

```bash
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"
cd atlas && pnpm exec vitest run tests/no-matching-work.test.ts
```

Expected: FAIL — `noMatchingWork` does not exist on `Selection`.

- [ ] **Step 3: Change `filters.ts`**

Replace the `Selection` interface and the body of `applyFilters`:

```ts
export interface Selection {
  /** L1: every language passing the language facets. The map draws all of
   *  these — a language is never deleted by a filter, only labelled. */
  languages: Language[]
  initiatives: Initiative[]
  /** A SUBSET of `languages` — those with no covering initiative in `initiatives`.
   *  Computed for every filter state, not only under a work filter: reporting
   *  this finding in one case and not the other made the map and the rail
   *  disagree about the same language depending on which control was touched.
   *  NOT a complement. `[...languages, ...noMatchingWork]` double-counts. */
  noMatchingWork: Language[]
  undatedInitiatives: number
  /** `anyWorkFilter(state)`, exposed rather than re-derived: the rail's heading
   *  makes a different and stronger claim when no work filter is active. */
  workFiltered: boolean
}
```

```ts
export function applyFilters(bundle: AtlasBundle, state: FilterState): Selection {
  const l1 = bundle.languages.filter((l) => languagePasses(l, state))
  const l1ids = new Set(l1.map((l) => l.id))

  // The language-intersection test is conditional. InitiativeSchema requires at
  // least one language, so with no language facet active the unconditional form
  // would behave identically today — but writing it conditionally keeps this rule
  // from depending on a `.min(1)` three files away.
  const i1 = bundle.initiatives.filter(
    (i) =>
      initiativePasses(i, state) &&
      withinWindow(i, state) &&
      (!anyLanguageFilter(state) || i.languages.some((id) => l1ids.has(id))),
  )

  const covered = new Set(i1.flatMap((i) => i.languages))

  return {
    languages: l1,
    initiatives: i1,
    noMatchingWork: l1.filter((l) => !covered.has(l.id)),
    undatedInitiatives: i1.filter((i) => i.started === null).length,
    workFiltered: anyWorkFilter(state),
  }
}
```

In `facetSummaries`, the language-facet branch loses its concatenation — `sel.languages` is already L1:

```ts
    ...LANGUAGE_FACETS.map((f) => {
      // `languages` is L1: every language passing the OTHER language facets,
      // workless ones included. Concatenating `noMatchingWork` here would
      // count those languages twice, because it is now a subset of this list.
      const sel = applyFilters(bundle, { ...state, [f.id]: [] })
      return summarise(f, sel.languages, bundle.languages)
    }),
```

And `emptyState` loses a clause, because `noMatchingWork ⊆ languages` makes the third check redundant:

```ts
export function emptyState(s: Selection): EmptyState {
  if (s.languages.length === 0 && s.initiatives.length === 0) return 'nothing-matched'
  // Reachable now in every filter state, not only under a work filter — which
  // is what made the SP1c-parked case (languages match, no work, nothing said)
  // unexplainable.
  if (s.initiatives.length === 0) return 'no-work-but-languages'
  return 'matched'
}
```

- [ ] **Step 4: Update the four consumer sites**

`App.tsx:32` — `languageInSelection` no longer needs the second clause, since `languages` is L1:

```tsx
  const languageInSelection = selection.languages.some((l) => l.id === state.lang)
```

`App.tsx:58` and the rail sentence — rename the local and read the new field:

```tsx
  const nWorkless = selection.noMatchingWork.length
```
```tsx
        {empty === 'no-work-but-languages' && (
          <p className="card empty" data-testid="no-matching-work">
            No initiative matches the current filters. {nWorkless}{' '}
            {nWorkless === 1 ? 'language' : 'languages'} matched your language filters
            and {nWorkless === 1 ? 'is' : 'are'} listed below.
          </p>
        )}
```

`App.tsx:114` — pass the renamed prop (the prop rename lands in Task 2; for now pass `noMatchingWork` to the existing `filteredOut` prop name and leave `UnmappedList` otherwise untouched):

```tsx
          filteredOut={selection.noMatchingWork}
```

`App.tsx:144` — the tab count is now just `languages`:

```tsx
            languages: selection.languages.length,
```

`TableView.tsx:71` — the languages tab reads L1 directly:

```tsx
  // `selection.languages` IS L1 now, workless languages included. The old
  // concatenation would double-count every one of them.
  const rows: Language[] = selection.languages
```

- [ ] **Step 5: Update the existing tests and run everything**

```bash
cd atlas && pnpm test && pnpm typecheck
```

**`tests/app-wiring.test.tsx` holds a guard tying the Languages tab count to the rendered row count** (SP1c's final fix wave added it). The count expression changes in this task, so re-run its mutation — drop a term from the count — and confirm it still fails.

Every `Selection` object literal in tests needs `noMatchingWork` and `workFiltered`. Expected counts change in `tests/filters.test.ts` (a workless language is now reported with no filters), `tests/empty-state.test.ts`, `tests/table-view.test.tsx` and `tests/filter-map-seam.test.tsx`. **Update the expected values to the new correct ones; never relax an assertion.** If a test's *premise* no longer holds — for instance `tests/filters.test.ts:35` asserting `filteredOut` is empty with no filters — rewrite it to assert the new behaviour explicitly rather than deleting it.

- [ ] **Step 6: Mutation-check**

1. Restore the early return (`if (!anyWorkFilter(state)) return { ...noMatchingWork: [] }`) → "reports a workless language with NO filters at all" fails.
2. Change `languages: l1` to `l1.filter((l) => covered.has(l.id))` → "keeps a workless language in `languages`" fails.
3. Put the concatenation back in `facetSummaries` → the language-facet count test in `tests/filters.test.ts` must fail on a doubled count. **If it does not, that is a finding** — write the guard.
4. Make `workFiltered` always `true` → the `workFiltered` test fails.

- [ ] **Step 7: Commit**

```bash
git add src/lib/filters.ts src/components/ tests/
git commit -m "refactor(atlas): noMatchingWork, always computed

filteredOut was a complement of languages and reported only under a work
filter; the same language with the same absence of work was named in the rail
under one control and silently drawn on the map under another. It is now a
SUBSET of languages, computed in every filter state, and the map draws L1.

The rename is the safety mechanism: every call site that concatenated the two
lists would double-count under the new meaning, and the compiler finds them.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: The rail says something stronger without filters

**Files:**
- Modify: `atlas/src/components/UnmappedList.tsx`, `atlas/src/components/App.tsx`
- Test: `atlas/tests/filtered-out.test.tsx` (extend)

**Interfaces:**
- Consumes: `Selection.noMatchingWork`, `Selection.workFiltered` (Task 1).
- Produces: `UnmappedList` props become `{ languages, noMatchingWork, workFiltered, onSelect }`.

**Why the heading changes.** With a work filter active, "no matching work" is a filter result. With no work filter, `initiatives` is every initiative in the atlas — so zero coverage means the atlas holds no work for that language at all. That is a finding about the dataset, not about the query, and it deserves different words. Two claims of different strength must not share one sentence.

**The double-listing is correct and must be preserved.** `languages` is L1 now, so `unmappedLanguages(languages)` will include workless languages: a language that is both unmapped and workless appears in "Not mapped" *and* in the workless group. Those groups state different facts — "we cannot place it" and "no work exists for it" — and both are true. Neither may be suppressed to avoid the repeat; each group's own heading is what explains why the name appears twice.

- [ ] **Step 1: Write the failing test**

Append to `atlas/tests/filtered-out.test.tsx`:

```tsx
describe('the workless group states what it can', () => {
  const workless = lang('choctaw')

  it('names it a filter result when a work filter is active', () => {
    render(
      <UnmappedList languages={[workless]} noMatchingWork={[workless]}
        workFiltered={true} onSelect={vi.fn()} />,
    )
    const group = screen.getByTestId('group-no-matching-work')
    expect(group.textContent).toMatch(/matches your filters, but no matching work/i)
    expect(group.textContent).not.toMatch(/no work in the atlas/i)
  })

  // Without a work filter the claim is about the DATASET, not the query.
  it('names it a dataset finding when no work filter is active', () => {
    render(
      <UnmappedList languages={[workless]} noMatchingWork={[workless]}
        workFiltered={false} onSelect={vi.fn()} />,
    )
    const group = screen.getByTestId('group-no-matching-work')
    expect(group.textContent).toMatch(/no work in the atlas/i)
    expect(group.textContent).not.toMatch(/matches your filters/i)
  })

  // Both facts are true and both are stated. Suppressing either to avoid
  // repeating a name would hide a finding.
  it('names a language that is BOTH unmapped and workless in both groups', () => {
    const both = lang('unmapped-and-workless')
    render(
      <UnmappedList languages={[both]} noMatchingWork={[both]}
        workFiltered={false} onSelect={vi.fn()} />,
    )
    expect(screen.getByTestId('group-not-mapped').textContent).toContain(both.name)
    expect(screen.getByTestId('group-no-matching-work').textContent).toContain(both.name)
  })
})
```

The existing `lang()` helper in that file creates a language with `centre: null`; confirm that before relying on it for the "not mapped" assertion, and give it a centre in the first two cases if it would otherwise land in the not-mapped group and confuse the reading.

- [ ] **Step 2: Run it and watch it fail**

```bash
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"
cd atlas && pnpm exec vitest run tests/filtered-out.test.tsx
```

Expected: FAIL — `UnmappedList` has no `noMatchingWork` or `workFiltered` prop.

- [ ] **Step 3: Change `UnmappedList.tsx`**

```tsx
export default function UnmappedList({
  languages, noMatchingWork, workFiltered, onSelect,
}: {
  languages: Language[]
  /** A subset of `languages`, so a language may legitimately appear here AND
   *  in a location group. Both facts are true and both are stated. */
  noMatchingWork: Language[]
  workFiltered: boolean
  onSelect: (id: string) => void
}): React.JSX.Element {
```

Replace the third group:

```tsx
      {noMatchingWork.length > 0 && (
        <div data-testid="group-no-matching-work">
          <h3>
            {workFiltered
              ? `Matches your filters, but no matching work (${noMatchingWork.length})`
              : `No work in the atlas for these languages (${noMatchingWork.length})`}
          </h3>
          <p className="hint">
            {workFiltered
              ? 'These languages match your language filters. No initiative in the current selection works on them — which is a finding, not an empty result.'
              : 'No initiative anywhere in this atlas names these languages. That is the coverage gap this map exists to show, not a result of your filters.'}
          </p>
          <ul>
            {noMatchingWork.map((l) => (
              <li key={l.id}>
                <button type="button" className="link-button" onClick={() => onSelect(l.id)}>
                  {l.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
```

In `App.tsx`, pass the new props:

```tsx
        <UnmappedList
          languages={selection.languages}
          noMatchingWork={selection.noMatchingWork}
          workFiltered={selection.workFiltered}
          onSelect={(id) => dispatch({ type: 'selectLanguage', id })}
        />
```

- [ ] **Step 4: Run everything**

```bash
cd atlas && pnpm test && pnpm typecheck
```

Expected: PASS. Tests referencing `group-filtered-out` must be updated to `group-no-matching-work` — a rename, not a relaxation.

- [ ] **Step 5: Mutation-check**

1. Make the heading unconditional (always the work-filter wording) → "names it a dataset finding" fails.
2. Make it unconditional the other way → "names it a filter result" fails.
3. Filter workless languages out of the not-mapped group → "names a language that is BOTH" fails.
4. In `App`, hardcode `workFiltered={false}` → an App-level test must fail. **If none does, write one** — this is the constant-substitution rule from SP1c ruling 13/16.

- [ ] **Step 6: Commit**

```bash
git add src/components/ tests/
git commit -m "feat(atlas): the rail's workless heading follows the filter state

With no work filter active, `initiatives` is every initiative in the atlas, so
zero coverage is a finding about the dataset rather than about the query. Two
claims of different strength no longer share one sentence.

A language that is both unmapped and workless is now named in both groups.
They state different facts and both are true.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: `PanelSection`, and both panels grouped

**Files:**
- Create: `atlas/src/components/PanelSection.tsx`
- Modify: `atlas/src/components/LanguagePanel.tsx`, `atlas/src/components/InitiativePanel.tsx`, `atlas/src/styles.css`
- Test: `atlas/tests/panel-sections.test.tsx` (create)

**Interfaces:**
- Produces: `PanelSection({ title, children })` rendering `<section><h3>{title}</h3><dl>{children}</dl></section>`. Tasks 4–6 place fields inside it.

**No fields move in or out in this task and no `data-testid` changes.** This is a pure regrouping, so `tests/panels.test.tsx` must pass **unchanged** — if it needs editing, something moved that should not have.

- [ ] **Step 1: Write the failing test**

```tsx
// atlas/tests/panel-sections.test.tsx
// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import LanguagePanel from '../src/components/LanguagePanel.js'
import InitiativePanel from '../src/components/InitiativePanel.js'
import { loadBundle } from '../src/lib/load.js'

afterEach(() => cleanup())
const bundle = loadBundle()

describe('panel sections', () => {
  it('groups the language panel under headings', () => {
    render(<LanguagePanel language={bundle.languages[0]!} initiatives={[]} />)
    const headings = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
    expect(headings).toEqual(['Identity', 'Situation', 'Place', 'Work', 'Note'])
  })

  it('groups the initiative panel under headings', () => {
    render(<InitiativePanel initiative={bundle.initiatives[0]!} methods={bundle.methods} bundle={bundle} />)
    const headings = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
    expect(headings).toEqual(['Identity', 'Work', 'Governance', 'Place', 'Evidence', 'Note'])
  })

  // A heading with no fields under it is a rendering bug that reads as missing
  // data. Every section must own at least one field.
  it('never renders an empty section', () => {
    render(<LanguagePanel language={bundle.languages[0]!} initiatives={[]} />)
    for (const h of screen.getAllByRole('heading', { level: 3 })) {
      const section = h.closest('section')
      expect(section).not.toBeNull()
      expect(within(section!).getAllByRole('term').length).toBeGreaterThan(0)
    }
  })

  it('keeps every field inside a section, none loose', () => {
    const { container } = render(<LanguagePanel language={bundle.languages[0]!} initiatives={[]} />)
    for (const dt of container.querySelectorAll('dt')) {
      expect(dt.closest('section')).not.toBeNull()
    }
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

```bash
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"
cd atlas && pnpm exec vitest run tests/panel-sections.test.tsx
```

Expected: FAIL — no level-3 headings in either panel.

- [ ] **Step 3: Write `PanelSection` and regroup**

```tsx
// atlas/src/components/PanelSection.tsx
/** A titled group of fields. The panels grew past the point where one flat
 *  `<dl>` was scannable; each section owns its own list so the heading and its
 *  fields are associated structurally, not just visually. */
export default function PanelSection({
  title, children,
}: { title: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <section className="panel__section">
      <h3 className="panel__section-title">{title}</h3>
      <dl>{children}</dl>
    </section>
  )
}
```

In `LanguagePanel.tsx`, replace the single `<dl>` with five `PanelSection`s, moving the **existing** fields — no additions, no `testId` changes:

- `Identity` — Also known as
- `Situation` — Family, Typology, Endangerment, Speakers
- `Place` — Centre
- `Work` — Matching initiatives
- `Note` — Note

In `InitiativePanel.tsx`, six sections over the existing fields:

- `Identity` — (empty for now; see below)
- `Work` — Years, Applications, Methods, Models
- `Governance` — Governance
- `Place` — Location
- `Evidence` — (empty for now; see below)
- `Note` — Note, and the adjacent-tier "Does this transfer?" block

**`Identity` and `Evidence` have no fields until Task 6.** A section with no fields fails the "never renders an empty section" guard, which is correct — so in this task **do not create them**. Render four sections for the initiative panel (`Work`, `Governance`, `Place`, `Note`) and change the expected heading list in the test above to match; Task 6 adds `Identity` and `Evidence` along with the fields that populate them, and updates that expectation then. Ordering the sections as they will finally appear is fine; inventing empty ones is not.

Add to `src/styles.css` (only these custom properties exist: `--ink`, `--accent`, `--muted`, `--accent-ink`, `--paper`, `--panel`, `--rule`, `--text`, `--text-soft`, `--notice-bg`, `--rail-width`, `--gutter`):

```css
.panel__section { margin-top: 0.75rem; }
.panel__section:first-of-type { margin-top: 0; }
.panel__section-title {
  font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.06em;
  color: var(--text-soft); margin: 0 0 0.25rem; border-bottom: 1px solid var(--rule);
  padding-bottom: 0.15rem;
}
```

- [ ] **Step 4: Run everything**

```bash
cd atlas && pnpm test && pnpm typecheck
```

Expected: PASS, with `tests/panels.test.tsx` **unedited**. If it fails, a field moved or a `testId` changed — fix the panel, not the test.

- [ ] **Step 5: Mutation-check**

1. Render one field outside any `PanelSection` → "keeps every field inside a section" fails.
2. Add a `PanelSection` with no children → "never renders an empty section" fails.
3. Reorder two sections → the heading-list test fails. Confirm the list is asserted in order, not as a set.

- [ ] **Step 6: Commit**

```bash
git add src/components/ src/styles.css tests/panel-sections.test.tsx
git commit -m "feat(atlas): group panel fields into titled sections

Pure regrouping — no field added, removed or renamed, and panels.test.tsx
passes unchanged. Empty sections are a guard rather than a possibility: a
heading over nothing reads as missing data.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: `SourcedField` — provenance, per claim

**Files:**
- Create: `atlas/src/components/SourcedField.tsx`
- Modify: `atlas/src/components/LanguagePanel.tsx`, `atlas/src/components/InitiativePanel.tsx`, `atlas/src/styles.css`
- Test: `atlas/tests/sourced-field.test.tsx` (create)

**Interfaces:**
- Consumes: `PanelSection` (Task 3), `Source` from `../schema/index.js` (re-exported by `export * from './source.js'`).
- Modifies: `Field` gains an optional `aside?: React.ReactNode` prop.
- Produces: `SourcedField({ label, testId, source, children })`.

**`Field` needs one change first, and skipping it introduces a silent bug.** `Field` chooses between the value and the words "not recorded" with `isEmpty(children)`. If `SourcedField` passes the disclosure button *inside* `children`, `children` is never empty — so a null-valued sourced field would render its toggle and lose its "not recorded". `Field` therefore gains `aside`, rendered inside the `<dd>` **after** the value, leaving `isEmpty` testing the value alone:

```tsx
export interface FieldProps {
  label: string
  testId: string
  children?: React.ReactNode
  /** Rendered after the value, inside the same `<dd>`. Deliberately NOT part
   *  of `children`: `isEmpty` tests the value, and folding a control into it
   *  makes every field carrying a control look non-empty — so a null value
   *  would silently lose its "not recorded". */
  aside?: React.ReactNode
}
```
```tsx
      <dd>{isEmpty(children) ? <NotRecorded /> : children}{aside}</dd>
```

Today every sourced field's value and source are co-present in the schema — a null `endangerment` carries no source either — so the bug is not currently reachable. That is exactly why it would have survived review. Add the guard anyway.

**The rules, each of which is a guard:**
- **No source, no toggle.** `family`, `region`, `typology`, `countries`, `subfamily`, `glottocode` and `iso639_3` carry no `Source` in the schema. The absence of a toggle therefore means "this field structurally cannot have a source", not "a source is missing" — which only holds if a toggle is never rendered empty.
- **`ref` is a link only when `kind === 'url'`.** For `paper` and `doc` it is a citation string or a repo path; an anchor would invent a resource.
- **`retrieved` is omitted, not "not recorded", when null.** The schema requires it only for `url` sources, so for a paper its absence is correct rather than unknown. This is the one place `Field`'s usual convention would say something false.
- **Each disclosure's accessible name includes the field label.** A panel holds five or six; identical names give a screen-reader user six indistinguishable controls. SP1c hit exactly this across five facet/column pairs and only the one a test touched was noticed.

- [ ] **Step 1: Write the failing test**

```tsx
// atlas/tests/sourced-field.test.tsx
// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import SourcedField from '../src/components/SourcedField.js'
import type { Source } from '../src/schema/index.js'

afterEach(() => cleanup())

const url: Source = { kind: 'url', ref: 'https://example.org/x', retrieved: '2026-09-03', quote: 'nine thousand' }
const doc: Source = { kind: 'doc', ref: 'data/REVIEW-QUEUE.md', retrieved: null, quote: null }

describe('SourcedField', () => {
  it('renders no disclosure when the field carries no source', () => {
    render(<SourcedField label="Family" testId="field-family" source={null}>Muskogean</SourcedField>)
    expect(screen.queryByTestId('source-field-family')).toBeNull()
  })

  it('renders a disclosure when it does, collapsed by default', () => {
    render(<SourcedField label="Speakers" testId="field-speakers" source={url}>9,600</SourcedField>)
    const toggle = screen.getByTestId('source-field-speakers')
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByText(/example\.org/)).toBeNull()
  })

  it('names the disclosure after its field, so several on one panel differ', () => {
    render(<SourcedField label="Speakers" testId="field-speakers" source={url}>9,600</SourcedField>)
    expect(screen.getByRole('button', { name: /source for speakers/i })).toBeDefined()
  })

  it('reveals kind, ref, retrieved and quote on expand', () => {
    render(<SourcedField label="Speakers" testId="field-speakers" source={url}>9,600</SourcedField>)
    fireEvent.click(screen.getByTestId('source-field-speakers'))
    const body = screen.getByTestId('source-body-field-speakers')
    expect(body.textContent).toMatch(/url/i)
    expect(body.textContent).toContain('https://example.org/x')
    expect(body.textContent).toContain('2026-09-03')
    expect(body.textContent).toContain('nine thousand')
  })

  it('linkifies a url ref', () => {
    render(<SourcedField label="Speakers" testId="field-speakers" source={url}>9,600</SourcedField>)
    fireEvent.click(screen.getByTestId('source-field-speakers'))
    const a = screen.getByRole('link', { name: /example\.org/ })
    expect(a.getAttribute('href')).toBe('https://example.org/x')
  })

  // A doc ref is a repo path, not a resource. An anchor would invent one.
  it('does NOT linkify a doc or paper ref', () => {
    render(<SourcedField label="Centre" testId="field-centre" source={doc}>0, 0</SourcedField>)
    fireEvent.click(screen.getByTestId('source-field-centre'))
    expect(screen.getByTestId('source-body-field-centre').textContent).toContain('data/REVIEW-QUEUE.md')
    expect(screen.queryByRole('link')).toBeNull()
  })

  // The schema requires `retrieved` only for url sources, so its absence on a
  // doc source is correct — not unknown. "not recorded" would be false here.
  it('omits retrieved rather than calling it not recorded', () => {
    render(<SourcedField label="Centre" testId="field-centre" source={doc}>0, 0</SourcedField>)
    fireEvent.click(screen.getByTestId('source-field-centre'))
    const body = screen.getByTestId('source-body-field-centre')
    expect(body.textContent).not.toMatch(/not recorded/i)
    expect(body.textContent).not.toMatch(/retrieved/i)
  })

  it('still renders the field value itself', () => {
    render(<SourcedField label="Speakers" testId="field-speakers" source={url}>9,600</SourcedField>)
    expect(screen.getByTestId('field-speakers').textContent).toContain('9,600')
  })

  // If the toggle goes through `children`, `isEmpty` sees a non-empty node and
  // the words disappear from a field that has no value.
  it('still says "not recorded" for a null value that carries a source', () => {
    render(<SourcedField label="Speakers" testId="field-speakers" source={url}>{null}</SourcedField>)
    expect(screen.getByTestId('field-speakers').textContent).toMatch(/not recorded/i)
    expect(screen.getByTestId('source-field-speakers')).toBeDefined()
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

```bash
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"
cd atlas && pnpm exec vitest run tests/sourced-field.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write `SourcedField`**

```tsx
// atlas/src/components/SourcedField.tsx
import { useState } from 'react'
import type { Source } from '../schema/index.js'
import Field from './Field.js'

/** Every claim in this dataset carries a source, and until now none of them
 *  were shown. Provenance sits with the claim it supports rather than pooled
 *  at the panel foot: pooled, a reader checking one number has to match it to
 *  a source by eye.
 *
 *  A field with `source === null` renders NO toggle, and that silence is
 *  meaningful — those fields carry no `Source` in the schema at all. It only
 *  stays meaningful if a toggle is never rendered empty. */
export default function SourcedField({
  label, testId, source, children,
}: {
  label: string
  testId: string
  source: Source | null
  children?: React.ReactNode
}): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const bodyId = `source-body-${testId}`

  return (
    <>
      <Field
        label={label} testId={testId}
        aside={source === null ? null : (
          <button
            type="button" className="source-toggle"
            aria-expanded={open} aria-controls={bodyId}
            // Named after the field: a panel holds five or six of these, and
            // identical names leave a screen-reader user unable to tell them
            // apart. SP1c shipped exactly that collision across five pairs.
            aria-label={`Source for ${label}`}
            data-testid={`source-${testId}`}
            onClick={() => setOpen(!open)}
          >
            source
          </button>
        )}
      >
        {children}
        {source !== null && (
          <div id={bodyId} hidden={!open} data-testid={bodyId} className="source-body">
            <span className="source-kind">{source.kind}</span>{' '}
            {/* Only a url ref is a resource. A paper ref is a citation string
                and a doc ref is a repo path; linking either invents a
                destination we do not have. */}
            {source.kind === 'url'
              ? <a href={source.ref} rel="noreferrer">{source.ref}</a>
              : <span>{source.ref}</span>}
            {/* Required by the schema only for url sources, so absence here is
                correct rather than unknown — "not recorded" would be false. */}
            {source.retrieved !== null && <span> · retrieved {source.retrieved}</span>}
            {source.quote !== null && <blockquote>{source.quote}</blockquote>}
          </div>
        )}
      </Field>
    </>
  )
}
```

Swap the five sourced fields over. In `LanguagePanel.tsx`: `Endangerment` (`language.endangerment?.source ?? null`), `Speakers` (`language.speakers?.source ?? null`), `Centre` (`language.centre?.source ?? null`). In `InitiativePanel.tsx`: `Location` (`initiative.site.source`), `Governance` (`initiative.governance?.source ?? null`).

Add to `src/styles.css`:

```css
.source-toggle {
  background: none; border: 0; padding: 0 0 0 0.4rem; font: inherit;
  font-size: 0.75rem; color: var(--accent-ink); cursor: pointer; text-decoration: underline;
}
.source-body {
  font-size: 0.75rem; color: var(--text-soft); margin-top: 0.2rem;
  padding-left: 0.5rem; border-left: 2px solid var(--rule);
}
.source-kind { text-transform: uppercase; letter-spacing: 0.04em; }
.source-body blockquote { margin: 0.2rem 0 0; font-style: italic; }
```

- [ ] **Step 4: Add the conflicting-sources rule**

The speakers field displays two disagreeing numbers when `conflicts` is non-empty, and each conflict carries **its own** source. One source under a field showing two numbers leaves the reader unable to tell which source says which — and being able to tell is the entire reason the schema keeps both instead of picking one.

Write this test in `tests/panels.test.tsx`:

```tsx
  it('attributes each disagreeing speaker count to its own source', () => {
    const l = bundle.languages.find((x) => (x.speakers?.conflicts.length ?? 0) > 0)!
    render(<LanguagePanel language={l} initiatives={[]} />)
    fireEvent.click(screen.getByTestId('source-field-speakers'))
    const body = screen.getByTestId('source-body-field-speakers')
    expect(body.textContent).toContain(l.speakers!.source.ref)
    for (const c of l.speakers!.conflicts) {
      expect(body.textContent).toContain(String(c.value))
      expect(body.textContent).toContain(c.source.ref)
    }
  })
```

Make it pass by rendering, inside the speakers disclosure, one line per figure — the primary value with its source, then each conflict's value with its own source. Keep `SourcedField` generic: pass the extra lines as the field's children, or give the speakers field a bespoke disclosure body rather than widening `SourcedField`'s API for one case.

- [ ] **Step 5: Run everything**

```bash
cd atlas && pnpm test && pnpm typecheck
```

- [ ] **Step 6: Mutation-check**

0. Pass the toggle through `children` instead of `aside` → "still says 'not recorded' for a null value that carries a source" fails.
1. Render the toggle unconditionally → "renders no disclosure when the field carries no source" fails.
2. Drop the `aria-label` → "names the disclosure after its field" fails.
3. Linkify every ref → "does NOT linkify a doc or paper ref" fails.
4. Render `retrieved` as `<NotRecorded />` when null → "omits retrieved" fails.
5. Show only the primary source in the speakers disclosure → the attribution test fails.

- [ ] **Step 7: Commit**

```bash
git add src/components/ src/styles.css tests/
git commit -m "feat(atlas): show the provenance the data has always carried

Every Source in this dataset was validated and shown to nobody, on an artifact
whose premise is that every claim carries one. Provenance now sits with its
claim, behind a disclosure named after the field.

A doc or paper ref is not linkified and a null `retrieved` is omitted rather
than called 'not recorded' — the schema requires it only for url sources, so
its absence there is correct, not unknown.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: The language panel's missing fields

**Files:**
- Modify: `atlas/src/components/LanguagePanel.tsx`
- Test: `atlas/tests/panels.test.tsx` (extend)

**Interfaces:** Consumes `PanelSection` (Task 3) and `SourcedField` (Task 4). None of these fields carries a `Source`, so all use plain `Field`.

Add to **Identity**: `glottocode` (`field-glottocode`), `iso639_3` (`field-iso639-3`), `tier` (`field-tier`), `subfamily` (`field-subfamily`) — `family` moves here from Situation. Add to **Situation**: `region` (`field-region`), `countries` (`field-countries`).

**Two are beyond spec §7 and deliberate.** `region` is a facet the reader can filter by, and filtering on a dimension the record never shows is a gap the spec did not anticipate. `tier` is load-bearing under D5 — an adjacent-tier language is never mapped — and a reader looking at one record has no other way to know.

- [ ] **Step 1: Write the failing test**

```tsx
  it('shows the identity fields a reader would use to look the language up', () => {
    const l = bundle.languages[0]!
    render(<LanguagePanel language={l} initiatives={[]} />)
    for (const id of ['field-glottocode', 'field-iso639-3', 'field-tier', 'field-subfamily']) {
      expect(screen.getByTestId(id)).toBeDefined()
    }
  })

  it('shows region and countries', () => {
    render(<LanguagePanel language={bundle.languages[0]!} initiatives={[]} />)
    expect(screen.getByTestId('field-region')).toBeDefined()
    expect(screen.getByTestId('field-countries')).toBeDefined()
  })

  // Every one of these is nullable and several are null across the fixture.
  it('renders an absent identifier as the words, never as a blank', () => {
    const l = bundle.languages.find((x) => x.glottocode === null)!
    render(<LanguagePanel language={l} initiatives={[]} />)
    expect(screen.getByTestId('field-glottocode').textContent).toMatch(/not recorded/i)
  })

  it('names the tier, so an adjacent-tier language is legible as one', () => {
    const l = bundle.languages.find((x) => x.tier === 'adjacent')!
    render(<LanguagePanel language={l} initiatives={[]} />)
    expect(screen.getByTestId('field-tier').textContent).toContain('adjacent')
  })

  it('carries no source disclosure on a field the schema gives no source', () => {
    render(<LanguagePanel language={bundle.languages[0]!} initiatives={[]} />)
    expect(screen.queryByTestId('source-field-family')).toBeNull()
    expect(screen.queryByTestId('source-field-region')).toBeNull()
  })
```

- [ ] **Step 2: Run it and watch it fail**

```bash
cd atlas && pnpm exec vitest run tests/panels.test.tsx
```

Expected: FAIL — no `field-glottocode`.

- [ ] **Step 3: Add the fields**

```tsx
      <PanelSection title="Identity">
        <Field label="Also known as" testId="field-aka">{language.also_known_as.join(', ')}</Field>
        <Field label="Glottocode" testId="field-glottocode">{language.glottocode}</Field>
        <Field label="ISO 639-3" testId="field-iso639-3">{language.iso639_3}</Field>
        {/* D5: an adjacent-tier language is never mapped. Without this the
            reader has no way to tell one from a coverage gap. */}
        <Field label="Tier" testId="field-tier">{language.tier}</Field>
        <Field label="Family" testId="field-family">{language.family}</Field>
        <Field label="Subfamily" testId="field-subfamily">{language.subfamily}</Field>
      </PanelSection>
```

and in Situation, after Speakers:

```tsx
        {/* A facet the reader can filter by. Filtering on a dimension the
            record never displays is a gap spec §7 did not anticipate. */}
        <Field label="Region" testId="field-region">{language.region}</Field>
        <Field label="Countries" testId="field-countries">{language.countries.join(', ')}</Field>
```

- [ ] **Step 4: Run everything**

```bash
cd atlas && pnpm test && pnpm typecheck
```

Update `tests/panel-sections.test.tsx`'s expectations only if the *heading list* changed — it should not have.

- [ ] **Step 5: Mutation-check**

1. Render `glottocode` as `{language.glottocode ?? ''}` → "renders an absent identifier as the words" fails.
2. Drop the tier field → "names the tier" fails.
3. Wrap `family` in `SourcedField` with a fabricated source → "carries no source disclosure" fails.

- [ ] **Step 6: Commit**

```bash
git add src/components/LanguagePanel.tsx tests/panels.test.tsx
git commit -m "feat(atlas): the language panel's missing identity fields

Adds glottocode, ISO 639-3, subfamily, countries — spec §7 named them and the
panel omitted them — plus tier and region. Tier is load-bearing under D5 and
region is a facet you can filter by; a record that never shows a dimension you
can filter on is a gap the spec did not anticipate.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: The initiative panel's missing fields, papers and links

**Files:**
- Modify: `atlas/src/components/InitiativePanel.tsx`, `atlas/src/components/App.tsx`
- Test: `atlas/tests/panels.test.tsx` (extend), `atlas/tests/panel-sections.test.tsx` (update heading list)

**Interfaces:**
- `InitiativePanel` gains a `bundle: AtlasBundle` prop so papers can resolve. `App` passes `bundle={bundle}`.
- Adds the `Identity` and `Evidence` sections deferred from Task 3; update the expected heading list to `['Identity', 'Work', 'Governance', 'Place', 'Evidence', 'Note']`.

**`summary_url` is NOT rendered as a link.** It holds `litterature_review/summaries/<id>.md` — a repo-relative path to a file that is not in the MkDocs nav and not in the built site. `Method.doc_url` is different and *is* a published route. Linking `summary_url` would ship a dead link from the deployed atlas; papers render metadata only.

**An unresolvable paper id renders as the raw id with a marker, never as nothing** — the same rule `columns.ts` applies when it cannot resolve a language name. Silently dropping a reference understates what the record claims.

- [ ] **Step 1: Write the failing test**

```tsx
  it('resolves papers through the bundle', () => {
    const i = bundle.initiatives.find((x) => x.papers.length > 0)!
    const p = bundle.papers.find((x) => x.id === i.papers[0])!
    render(<InitiativePanel initiative={i} methods={bundle.methods} bundle={bundle} />)
    const field = screen.getByTestId('field-papers')
    expect(field.textContent).toContain(p.title)
    expect(field.textContent).toContain(p.authors)
    expect(field.textContent).toContain(String(p.year))
  })

  // summary_url points at an unpublished repo path. An anchor would be dead
  // from the deployed origin, which is inventing a destination.
  it('does not link a paper to its unpublished summary path', () => {
    const i = bundle.initiatives.find((x) => x.papers.length > 0)!
    render(<InitiativePanel initiative={i} methods={bundle.methods} bundle={bundle} />)
    const links = within(screen.getByTestId('field-papers')).queryAllByRole('link')
    expect(links).toEqual([])
  })

  it('renders an unresolvable paper id rather than dropping it', () => {
    const i = { ...bundle.initiatives[0]!, papers: ['no-such-paper'] }
    render(<InitiativePanel initiative={i} methods={bundle.methods} bundle={bundle} />)
    const field = screen.getByTestId('field-papers')
    expect(field.textContent).toContain('no-such-paper')
    expect(field.textContent).toMatch(/unresolved/i)
  })

  it('shows kind, tier, languages and data regime', () => {
    const i = bundle.initiatives[0]!
    render(<InitiativePanel initiative={i} methods={bundle.methods} bundle={bundle} />)
    for (const id of ['field-kind', 'field-tier', 'field-languages', 'field-regime']) {
      expect(screen.getByTestId(id)).toBeDefined()
    }
  })

  it('resolves initiative language ids to names', () => {
    const i = bundle.initiatives[0]!
    const name = bundle.languages.find((l) => l.id === i.languages[0])!.name
    render(<InitiativePanel initiative={i} methods={bundle.methods} bundle={bundle} />)
    expect(screen.getByTestId('field-languages').textContent).toContain(name)
  })

  it('shows links with their retrieval date', () => {
    const i = bundle.initiatives.find((x) => x.links.length > 0)!
    render(<InitiativePanel initiative={i} methods={bundle.methods} bundle={bundle} />)
    const field = screen.getByTestId('field-links')
    expect(field.textContent).toContain(i.links[0]!.label)
    expect(field.textContent).toContain(i.links[0]!.retrieved)
    expect(within(field).getByRole('link').getAttribute('href')).toBe(i.links[0]!.url)
  })

  it('shows the governance licence', () => {
    render(<InitiativePanel initiative={bundle.initiatives[0]!} methods={bundle.methods} bundle={bundle} />)
    expect(screen.getByTestId('field-licence')).toBeDefined()
  })
```

The `links` test needs a fixture initiative with a link, and none has one. **Add it in this task** — a task must not end on a red suite. In `atlas/src/fixtures/atlas.fixture.json`, on `fixture-ongoing`, replace `"links": []` with:

```json
      "links": [
        { "label": "Fixture project page", "url": "https://example.org/fixture-project",
          "retrieved": "2026-09-03" }
      ],
```

Change nothing else in the fixture — Task 7 owns the rest. Do not weaken the test to pass against an empty array.

- [ ] **Step 2: Run it and watch it fail**

```bash
cd atlas && pnpm exec vitest run tests/panels.test.tsx
```

Expected: FAIL — `InitiativePanel` takes no `bundle` prop.

- [ ] **Step 3: Add the sections and fields**

```tsx
export default function InitiativePanel({
  initiative, methods, bundle,
}: { initiative: Initiative; methods: Method[]; bundle: AtlasBundle }): React.JSX.Element {
  const mine = methods.filter((m) => initiative.methods.includes(m.id))
  const names = new Map(bundle.languages.map((l) => [l.id, l.name]))
  const papers = initiative.papers.map((id) => ({
    id, paper: bundle.papers.find((p) => p.id === id) ?? null,
  }))
```

`Identity`:

```tsx
      <PanelSection title="Identity">
        <Field label="Kind" testId="field-kind">{initiative.kind}</Field>
        {/* Adjacent tier means transferable work, not work on the language.
            Flattening that would overstate coverage on the one record a
            reader is looking at closely. */}
        <Field label="Tier" testId="field-tier">{initiative.tier}</Field>
        <Field label="Languages" testId="field-languages">
          {initiative.languages.map((id) => names.get(id) ?? id).join(', ')}
        </Field>
      </PanelSection>
```

`Data regime` joins Work; `Licence` joins Governance (`initiative.governance?.licence ?? null`). `Evidence`:

```tsx
      <PanelSection title="Evidence">
        <Field label="Papers" testId="field-papers">
          {papers.length === 0 ? null : (
            <ul>
              {papers.map(({ id, paper }) => (
                <li key={id}>
                  {paper === null ? (
                    // Never silently drop a reference the record makes — the
                    // same rule columns.ts uses for an unresolvable language.
                    <span>{id} <em>(unresolved)</em></span>
                  ) : (
                    <>
                      {paper.title} · {paper.authors} · {paper.year}
                      {paper.venue !== null && <> · {paper.venue}</>}
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Field>
        <Field label="Links" testId="field-links">
          {initiative.links.length === 0 ? null : (
            <ul>
              {initiative.links.map((l) => (
                <li key={l.url}>
                  <a href={l.url} rel="noreferrer">{l.label}</a> · retrieved {l.retrieved}
                </li>
              ))}
            </ul>
          )}
        </Field>
      </PanelSection>
```

In `App.tsx`, pass the bundle:

```tsx
        {initiative !== null && (
          <InitiativePanel initiative={initiative} methods={bundle.methods} bundle={bundle} />
        )}
```

- [ ] **Step 4: Run everything**

```bash
cd atlas && pnpm test && pnpm typecheck
```

Update the initiative heading list in `tests/panel-sections.test.tsx` to the full six.

- [ ] **Step 5: Mutation-check**

1. Drop unresolvable ids (`.filter(p => p.paper !== null)`) → "renders an unresolvable paper id" fails.
2. Wrap the paper title in `<a href={paper.summary_url}>` → "does not link a paper" fails.
3. Render `initiative.languages.join(', ')` raw → "resolves initiative language ids to names" fails.
4. In `App`, pass `bundle={{ ...bundle, papers: [] }}` → "resolves papers through the bundle" must fail. **If it does not, that is a finding**: the App-level wiring is substitutable.

- [ ] **Step 6: Commit**

```bash
git add src/components/ tests/
git commit -m "feat(atlas): the initiative panel's evidence, and papers at last

bundle.papers has been loaded and validated since SP0 and displayed nowhere.
Adds kind, tier, languages, data regime, licence, papers and links.

summary_url is deliberately not linkified: it points at an unpublished repo
path, and an anchor would be dead from the deployed origin. An unresolvable
paper id renders as itself, marked, rather than vanishing.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: The fixture grows again

**Files:**
- Modify: `atlas/src/fixtures/atlas.fixture.json`
- Test: `atlas/tests/fixture-coverage.test.ts` (extend)

**Why.** The fixture is what the dev server, the demo build and every App-level test render. A case it does not model cannot be exercised end to end anywhere — which is how the undated-initiative rule went unexercised until SP1b's final review, and why SP1c gave the fixture a coverage test.

**Already present, verified:** an initiative with a resolvable paper (`fixture-ongoing` → `fixture-paper`).
**Missing:** an initiative with a non-empty `links`; a language with `subfamily`, `countries`, `glottocode` and `iso639_3` all populated; and a `kind: 'doc'` source with null `retrieved`.

**The unresolvable-paper-id case stays a synthetic unit test** (Task 6 builds it inline). Putting a dangling reference in the fixture would model bad data rather than an honesty case.

- [ ] **Step 1: Write the failing assertions**

Append to `tests/fixture-coverage.test.ts`:

```ts
  it('has an initiative with a link, so the links field has a path', () => {
    expect(b.initiatives.some((i) => i.links.length > 0)).toBe(true)
  })

  it('has a language with every identifier populated', () => {
    expect(
      b.languages.some(
        (l) => l.glottocode !== null && l.iso639_3 !== null &&
               l.subfamily !== null && l.countries.length > 0,
      ),
    ).toBe(true)
  })

  // Exercises the rule that `retrieved` is omitted rather than called
  // "not recorded" for a non-url source.
  it('has a doc source with no retrieval date', () => {
    const sources = [
      ...b.languages.flatMap((l) => [l.centre?.source, l.speakers?.source, l.endangerment?.source]),
      ...b.initiatives.flatMap((i) => [i.site.source, i.governance?.source]),
    ].filter((s) => s != null)
    expect(sources.some((s) => s.kind === 'doc' && s.retrieved === null)).toBe(true)
  })
```

- [ ] **Step 2: Run and watch them fail**

```bash
cd atlas && pnpm exec vitest run tests/fixture-coverage.test.ts
```

Expected: the links and identifier assertions fail. The doc-source one may already pass — check rather than assume.

- [ ] **Step 3: Edit the fixture**

The link on `fixture-ongoing` was added in Task 6; leave it as it is. On `fixture-sourced`, set `"glottocode": "fixt1234"`, `"iso639_3": "fix"`, `"subfamily": "Fixture Subfamily"`. It already has `"countries": ["CA"]`.

Add nothing else. **Do not add or remove records.**

- [ ] **Step 4: Run everything and repair honestly**

```bash
cd atlas && pnpm test && pnpm typecheck
```

Any facet-count or panel assertion that shifts gets its **expected number updated to the new correct one**. Never relax an assertion, never delete a test, never skip one.

- [ ] **Step 5: Mutation-check**

1. Empty the `links` array again → the links assertion fails.
2. Null one of the four identifiers on `fixture-sourced` → the identifier assertion fails.
3. Give the doc source a `retrieved` date → the doc-source assertion fails.

- [ ] **Step 6: Commit**

```bash
git add src/fixtures/atlas.fixture.json tests/fixture-coverage.test.ts
git commit -m "test(atlas): fixture paths for links, identifiers and a dateless source

The fixture is what the dev server, the demo build and every App-level test
render, so a case it does not model cannot be exercised end to end. Adds the
three the new panel fields need, and asserts each by name.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: The seam review

**Files:** none created. Findings are fixed where they belong.

**Why this is a task and not a step.** Composition defects on this project are five for five, and each was two individually-correct decisions in different tasks. SP1c made this a task and it found five defects that ten per-task reviews had passed — including a year printed as `2,016` beside `2016` on the same screen. Per-task review cannot catch this class by construction.

- [ ] **Step 1: Build the seam table**

One row per pair of tasks sharing a file or an interface. At minimum:

| seam | one side produces | the other consumes | check |
| --- | --- | --- | --- |
| T1 ↔ T2 | `noMatchingWork` as a subset | the rail group AND the location groups | is a language that is both unmapped and workless named twice, each under its own heading? |
| T1 ↔ T6 | `languages` = L1 | the languages table rows, tab count, facet counts | do the tab count, the caption count and the rendered row count all agree? |
| T1 ↔ map | `languages` = L1 | `languageFields(selection.languages)` | is a workless language drawn on the map under a work filter, where it used to vanish? |
| T3 ↔ T5/T6 | section grouping | new fields | does any section render empty, and is every field inside one? |
| T4 ↔ T5/T6 | `SourcedField` | fields with and without sources | does any field with no schema source render a toggle, or any sourced field lack one? |
| T4 ↔ T4 | five disclosures per panel | accessible names | are all of them distinct within one rendered panel? |
| T6 ↔ T7 | papers and links | the fixture | do both render from real fixture data in the running app? |

- [ ] **Step 2: Walk the running app**

```bash
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"
cd atlas && pnpm dev
```

Read what each page **says**, rather than reasoning about what the code should produce. Every composition defect this project has shipped was visible on screen and invisible in the tests.

- `/` — is a workless language named in the rail on first load, with the dataset-strength wording?
- `/?application=asr` — same language, now with the filter-strength wording, and still drawn on the map.
- `/?view=languages` — do the tab count, the caption count and the row count agree?
- `/?lang=<a workless, unmapped language>` — is it named in two rail groups, each explaining itself?
- Open a language panel and expand every source disclosure; then an initiative panel and do the same. Do any two toggles read identically?
- `/?view=languages&region=africa&application=asr` — the historical reproduction. Does any surface contradict another?

- [ ] **Step 3: Fix what the seams surfaced**

Each finding in the file it belongs to, with a test that fails without the fix. A finding that is real but out of scope goes in the report for the decision record — never fixed silently, never dropped silently.

- [ ] **Step 4: Run everything, including the gates**

```bash
cd atlas && pnpm test && pnpm typecheck && pnpm test:browser
cd atlas && pnpm build:data; echo "build:data exit: $?"
cd atlas && pnpm build:app;  echo "build:app exit: $?"
```

**Both gates must exit non-zero.** A zero is a serious regression, not a convenience — report it and do not relax the gate.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "fix(atlas): findings from the SP2a seam review

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```
