# Atlas SP1c — The Table View: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a table view of the current selection behind a new `view` URL key, close SP1b's four recorded carry-overs, and build the browser regression harness owed since SP1a.

**Architecture:** A pure `src/lib/columns.ts` declares columns as data (`{ id, header, scope, cell, sortValue }`) exactly as `src/lib/facets.ts` declares facet-to-field mapping; a dumb `DataTable` renders the `Cell` descriptors it returns. `applyFilters` is untouched — the table consumes the same `Selection` the map consumes. Two new URL keys (`view`, `sort`) take the citable contract from twelve keys to fourteen.

**Tech Stack:** TypeScript strict (`noUncheckedIndexedAccess`), React 19, Vite 6, Vitest 2 (node + jsdom), Playwright (new, browser tests only), pnpm, Node 22.22.2.

**Spec:** `docs/superpowers/specs/2026-09-04-atlas-sp1c-table-design.md` — read it before Task 1. Also read `docs/superpowers/decisions/2026-09-03-atlas-sp1a-rulings.md` and `2026-09-04-atlas-sp1b-rulings.md`: several tasks below exist only because of defects recorded there.

## Global Constraints

- **Node is not on PATH.** Every shell command in this plan must be preceded, once per shell, by `export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"`.
- **Never run `pnpm approve-builds`.** It overwrites `atlas/pnpm-workspace.yaml` and breaks `pnpm test`.
- **Never promote a record to `verified`.** `pnpm build:data` must keep exiting non-zero. Do not edit `atlas/data/**`.
- **Never fabricate a value.** Unknown is `null` and must *read* as unknown — the words "not recorded", never a blank.
- **`src/lib/**` is pure:** no React, no JSX, no DOM, no imports from `src/components/`. Type-only imports from `src/schema/` are fine.
- **Every guard test must be mutation-checked** during implementation: make the change the test forbids, run it, watch it fail, restore. Seven guards across SP1a and SP1b asserted less than their names claimed and every one was found this way. A task's report must name each guard it mutation-checked.
- **`pnpm test` stays green, fast and offline.** Playwright tests never run under it.
- **Never loosen an existing assertion to make it pass.** Task 9 changes a shared fixture and will shift numbers in existing tests; update the expected numbers, never the strictness.
- All work happens in a git worktree, never the primary checkout. Commit trailer on every commit: `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>`.

## File Structure

**Create**
- `src/lib/columns.ts` — column declarations for both tabs, the `Cell` descriptor union, and sorting. Pure.
- `src/components/DataTable.tsx` — renders `Cell` descriptors into a real `<table>`. Knows nothing about the atlas.
- `src/components/TableView.tsx` — picks a tab's columns and rows, builds the `TableContext`, writes the caption.
- `src/components/ViewSwitch.tsx` — the map / initiatives / languages control.
- `src/components/NotRecorded.tsx` — the words "not recorded", one implementation shared by `Field` and `DataTable`.
- `src/components/OutsideFiltersNotice.tsx` — the marker for a selected record the filters exclude.
- `playwright.config.ts`, `browser-tests/atlas.spec.ts` — the harness.
- Tests: `tests/columns.test.ts`, `tests/sort.test.ts`, `tests/empty-state.test.ts`, `tests/data-table.test.tsx`, `tests/table-view.test.tsx`, `tests/view-switch.test.tsx`, `tests/facet-collapse.test.tsx`, `tests/selection-outside.test.tsx`, `tests/fixture-coverage.test.ts`.

**Modify**
- `src/lib/url-state.ts` — `view` and `sort` on `FilterState`; parse and serialise.
- `src/lib/filters.ts` — `emptyState(selection)`, the one predicate both surfaces use.
- `src/state/useFilters.ts` — `setView`, `setSort`, `dropUnknownSelection`; `REPLACES` becomes a set.
- `src/components/App.tsx` — wiring, the pane swap, the outside-filters notice.
- `src/components/FacetGroup.tsx`, `src/components/FacetPanel.tsx` — collapsible groups, per-group clear.
- `src/components/Field.tsx` — use `NotRecorded`.
- `src/styles.css` — the pane, the switch, the table.
- `src/fixtures/atlas.fixture.json` — one record gains two nulls.
- `package.json` — `test:browser`, the Playwright devDependency.
- Existing tests whose expected numbers shift in Task 9.

---

### Task 1: `columns.ts` — the projection module

**Files:**
- Create: `atlas/src/lib/columns.ts`
- Test: `atlas/tests/columns.test.ts`

**Interfaces:**
- Consumes: `Initiative`, `Language` from `../schema/index.js`; `TIERS`, `DATA_REGIMES`, `GOVERNANCE_POSTURES`, `REGIONS`, `ENDANGERMENT`, `LOCATION_CONFIDENCE` from the same barrel.
- Produces: `VIEWS`, `ViewId`, `TableViewId`, `SortDirection`, `SortState`, `Scope`, `Cell`, `Column<T>`, `TableContext`, `INITIATIVE_COLUMNS`, `LANGUAGE_COLUMNS`, `columnsFor(view)`, `columnIds(view)`. Tasks 2, 3, 5 and 6 all import from here. **This module must not import `url-state.ts`** — `url-state.ts` imports *it*, and the reverse would be a cycle.

- [ ] **Step 1: Write the failing test**

```ts
// atlas/tests/columns.test.ts
import { describe, expect, it } from 'vitest'
import {
  INITIATIVE_COLUMNS, LANGUAGE_COLUMNS, columnIds, columnsFor, type TableContext,
} from '../src/lib/columns.js'
import type { Initiative, Language } from '../src/schema/index.js'

const ctx: TableContext = {
  languageName: (id) => (id === 'mri' ? 'Māori' : id),
  workCount: (id) => (id === 'cho' ? 0 : 3),
}

const lang = (over: Partial<Language> = {}): Language => ({
  id: 'cho', name: 'Choctaw', also_known_as: [], glottocode: null, iso639_3: null,
  tier: 'indigenous', family: null, subfamily: null, typology: [], endangerment: null,
  speakers: null, region: null, countries: [], centre: null, caveat: null, status: 'draft',
  ...over,
} as Language)

const init = (over: Partial<Initiative> = {}): Initiative => ({
  id: 'i1', name: 'Te Hiku Media', kind: 'organisation', tier: 'indigenous',
  languages: ['mri'], started: null, ended: null,
  site: { lat: 0, lon: 0, place: 'p', source: { url: 'https://e.x', retrieved: '2026-01-01' }, confidence: 'sourced' },
  applications: [], methods: [], models: [], data_regime: null, governance: null,
  papers: [], links: [], transferability: null, caveat: null, status: 'draft',
} as unknown as Initiative)

const cellOf = <T>(cols: { id: string; cell: (r: T, c: TableContext) => unknown }[], id: string, r: T): unknown =>
  cols.find((c) => c.id === id)!.cell(r, ctx)

describe('columns', () => {
  it('declares exactly the seven specified columns per tab, in order', () => {
    expect(INITIATIVE_COLUMNS.map((c) => c.id)).toEqual([
      'name', 'tier', 'languages', 'started', 'applications', 'regime', 'governance',
    ])
    expect(LANGUAGE_COLUMNS.map((c) => c.id)).toEqual([
      'name', 'family', 'region', 'endangerment', 'speakers', 'work', 'location',
    ])
  })

  // The scope field is what makes the spec's scope-and-unit table enforceable
  // rather than documentary. A column with no scope is a number nobody can read.
  it('gives every column a scope', () => {
    for (const c of [...INITIATIVE_COLUMNS, ...LANGUAGE_COLUMNS]) {
      expect(['record', 'bundle', 'L1', 'I1']).toContain(c.scope)
    }
  })

  it('scopes matching work to I1, because 0 must not read as "no work exists"', () => {
    expect(LANGUAGE_COLUMNS.find((c) => c.id === 'work')!.scope).toBe('I1')
    expect(cellOf(LANGUAGE_COLUMNS, 'work', lang())).toEqual({ kind: 'number', value: 0, marker: null })
  })

  it('resolves language ids to names through the bundle-scoped context', () => {
    expect(LANGUAGE_COLUMNS.find((c) => c.id === 'name')!.scope).toBe('record')
    expect(INITIATIVE_COLUMNS.find((c) => c.id === 'languages')!.scope).toBe('bundle')
    expect(cellOf(INITIATIVE_COLUMNS, 'languages', init())).toEqual({ kind: 'list', values: ['Māori'] })
  })

  it('falls back to the raw id for a language the bundle does not hold', () => {
    expect(cellOf(INITIATIVE_COLUMNS, 'languages', init({ languages: ['zzz'] })))
      .toEqual({ kind: 'list', values: ['zzz'] })
  })

  it('marks a speaker count its sources disagree about', () => {
    const withConflict = lang({
      speakers: {
        value: 9600, as_of: 2020, source: { url: 'https://e.x', retrieved: '2026-01-01' },
        conflicts: [{ value: 1000, source: { url: 'https://e.y', retrieved: '2026-01-01' } }],
      },
    } as Partial<Language>)
    expect(cellOf(LANGUAGE_COLUMNS, 'speakers', withConflict))
      .toEqual({ kind: 'number', value: 9600, marker: '†' })
  })

  it('leaves an unconflicted speaker count unmarked', () => {
    const plain = lang({
      speakers: {
        value: 150, as_of: null, source: { url: 'https://e.x', retrieved: '2026-01-01' }, conflicts: [],
      },
    } as Partial<Language>)
    expect(cellOf(LANGUAGE_COLUMNS, 'speakers', plain))
      .toEqual({ kind: 'number', value: 150, marker: null })
  })

  // "not mapped" and "not recorded" are DIFFERENT claims. A null cell renders
  // "not recorded" — we don't know. A language with no centre is something we
  // do know, and saying "not recorded" there would understate the record.
  it('says "not mapped" rather than null for a language with no centre', () => {
    expect(cellOf(LANGUAGE_COLUMNS, 'location', lang({ centre: null })))
      .toEqual({ kind: 'text', value: 'not mapped', sub: null })
  })

  it('reports the centre confidence when there is one', () => {
    const mapped = lang({
      centre: { lat: 1, lon: 2, source: { url: 'https://e.x', retrieved: '2026-01-01' }, confidence: 'approximate' },
    } as Partial<Language>)
    expect(cellOf(LANGUAGE_COLUMNS, 'location', mapped))
      .toEqual({ kind: 'text', value: 'approximate', sub: null })
  })

  it('carries the initiative kind as the name cell\'s secondary line', () => {
    expect(cellOf(INITIATIVE_COLUMNS, 'name', init()))
      .toEqual({ kind: 'text', value: 'Te Hiku Media', sub: 'organisation' })
  })

  // Spec §4: adjacent-tier rows stay visibly adjacent in BOTH tabs. That tier
  // means transferable work, not work on the language, and the languages tab
  // has no tier column — so the name cell carries it, exactly as the
  // initiatives tab carries `kind`.
  it('marks an adjacent-tier language in its name cell', () => {
    expect(cellOf(LANGUAGE_COLUMNS, 'name', lang({ tier: 'adjacent' })))
      .toEqual({ kind: 'text', value: 'Choctaw', sub: 'adjacent tier' })
    expect(cellOf(LANGUAGE_COLUMNS, 'name', lang({ tier: 'indigenous' })))
      .toEqual({ kind: 'text', value: 'Choctaw', sub: null })
  })

  it('renders absent scalars as null so the table can say "not recorded"', () => {
    expect(cellOf(LANGUAGE_COLUMNS, 'family', lang({ family: null })))
      .toEqual({ kind: 'text', value: null, sub: null })
    expect(cellOf(INITIATIVE_COLUMNS, 'started', init({ started: null })))
      .toEqual({ kind: 'number', value: null, marker: null })
    expect(cellOf(INITIATIVE_COLUMNS, 'governance', init({ governance: null })))
      .toEqual({ kind: 'text', value: null, sub: null })
  })

  it('has no columns for the map view', () => {
    expect(columnsFor('map')).toEqual([])
    expect(columnIds('map')).toEqual([])
    expect(columnIds('languages')).toContain('work')
  })
})
```

- [ ] **Step 2: Run the test and watch it fail**

```bash
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"
cd atlas && pnpm exec vitest run tests/columns.test.ts
```

Expected: FAIL — `Failed to resolve import "../src/lib/columns.js"`.

- [ ] **Step 3: Write the implementation**

```ts
// atlas/src/lib/columns.ts
import type { Initiative, Language } from '../schema/index.js'
import {
  DATA_REGIMES, ENDANGERMENT, GOVERNANCE_POSTURES, LOCATION_CONFIDENCE, REGIONS, TIERS,
} from '../schema/index.js'

export const VIEWS = ['map', 'initiatives', 'languages'] as const
export type ViewId = (typeof VIEWS)[number]
export type TableViewId = Exclude<ViewId, 'map'>

export type SortDirection = 'asc' | 'desc'
export interface SortState { column: string; direction: SortDirection }

/** What population a cell's value is derived from. `record` is the record
 *  itself; the rest name a set whose size the reader cannot see, which is
 *  exactly when a number needs its scope stated on screen. */
export type Scope = 'record' | 'bundle' | 'L1' | 'I1'

/** A cell is DATA, not markup: `lib/` stays pure and `DataTable` owns every
 *  rendering decision, including the one that matters — that an absent value
 *  reads as the words "not recorded". */
export type Cell =
  | { kind: 'text'; value: string | null; sub: string | null }
  | { kind: 'list'; values: string[] }
  | { kind: 'number'; value: number | null; marker: string | null }

/** Everything a cell may need that is not on the record. Both members are
 *  scoped: `languageName` reads the whole bundle (an initiative may name a
 *  language the current filters exclude), `workCount` reads I1. */
export interface TableContext {
  languageName: (id: string) => string
  workCount: (languageId: string) => number
}

export interface Column<T> {
  id: string
  header: string
  scope: Scope
  cell: (record: T, ctx: TableContext) => Cell
  /** Absent means the column is not sortable. */
  sortValue?: (record: T, ctx: TableContext) => string | number | null
}

/** Enumerated values sort by their declaration order, which is meaningful,
 *  rather than alphabetically, which is an accident of spelling. */
const vocabIndex = <T extends string>(order: readonly T[], value: T): number => order.indexOf(value)

export const INITIATIVE_COLUMNS: Column<Initiative>[] = [
  {
    id: 'name', header: 'Name', scope: 'record',
    cell: (i) => ({ kind: 'text', value: i.name, sub: i.kind }),
    sortValue: (i) => i.name,
  },
  {
    id: 'tier', header: 'Tier', scope: 'record',
    cell: (i) => ({ kind: 'text', value: i.tier, sub: null }),
    sortValue: (i) => vocabIndex(TIERS, i.tier),
  },
  {
    id: 'languages', header: 'Languages', scope: 'bundle',
    cell: (i, ctx) => ({ kind: 'list', values: i.languages.map((id) => ctx.languageName(id)) }),
    sortValue: (i) => i.languages.length,
  },
  {
    id: 'started', header: 'Started', scope: 'record',
    cell: (i) => ({ kind: 'number', value: i.started, marker: null }),
    sortValue: (i) => i.started,
  },
  {
    id: 'applications', header: 'Applications', scope: 'record',
    cell: (i) => ({ kind: 'list', values: [...i.applications] }),
  },
  {
    id: 'regime', header: 'Data regime', scope: 'record',
    cell: (i) => ({ kind: 'text', value: i.data_regime, sub: null }),
    sortValue: (i) => (i.data_regime === null ? null : vocabIndex(DATA_REGIMES, i.data_regime)),
  },
  {
    id: 'governance', header: 'Governance', scope: 'record',
    cell: (i) => ({ kind: 'text', value: i.governance?.posture ?? null, sub: null }),
    sortValue: (i) =>
      i.governance == null ? null : vocabIndex(GOVERNANCE_POSTURES, i.governance.posture),
  },
]

export const LANGUAGE_COLUMNS: Column<Language>[] = [
  {
    id: 'name', header: 'Name', scope: 'record',
    // The languages tab has no tier column, and an adjacent-tier language must
    // still read as adjacent: that tier is transferable work, not work on the
    // language, and flattening it would overstate coverage.
    cell: (l) => ({ kind: 'text', value: l.name, sub: l.tier === 'adjacent' ? 'adjacent tier' : null }),
    sortValue: (l) => l.name,
  },
  {
    id: 'family', header: 'Family', scope: 'record',
    cell: (l) => ({ kind: 'text', value: l.family, sub: null }),
    sortValue: (l) => l.family,
  },
  {
    id: 'region', header: 'Region', scope: 'record',
    cell: (l) => ({ kind: 'text', value: l.region, sub: null }),
    sortValue: (l) => (l.region === null ? null : vocabIndex(REGIONS, l.region)),
  },
  {
    id: 'endangerment', header: 'Endangerment', scope: 'record',
    cell: (l) => ({ kind: 'text', value: l.endangerment?.status ?? null, sub: null }),
    sortValue: (l) =>
      l.endangerment == null ? null : vocabIndex(ENDANGERMENT, l.endangerment.status),
  },
  {
    id: 'speakers', header: 'Speakers', scope: 'record',
    cell: (l) => ({
      kind: 'number',
      value: l.speakers?.value ?? null,
      // The schema keeps disagreeing figures rather than resolving them
      // (Choctaw is recorded at both 9,600 and 1,000). Silently printing one
      // of them would undo that decision in the one place it is most visible.
      marker: (l.speakers?.conflicts.length ?? 0) > 0 ? '†' : null,
    }),
    sortValue: (l) => l.speakers?.value ?? null,
  },
  {
    id: 'work', header: 'Matching work', scope: 'I1',
    cell: (l, ctx) => ({ kind: 'number', value: ctx.workCount(l.id), marker: null }),
    sortValue: (l, ctx) => ctx.workCount(l.id),
  },
  {
    // `not mapped` is a VALUE, not a null: we know this language has no cited
    // centre. Rendering it as null would print "not recorded", which claims
    // less than the record actually says.
    id: 'location', header: 'Location', scope: 'record',
    cell: (l) => ({
      kind: 'text',
      value: l.centre === null ? 'not mapped' : l.centre.confidence,
      sub: null,
    }),
    sortValue: (l) =>
      l.centre === null ? LOCATION_CONFIDENCE.length : vocabIndex(LOCATION_CONFIDENCE, l.centre.confidence),
  },
]

export function columnsFor(view: ViewId): Column<Initiative>[] | Column<Language>[] {
  if (view === 'initiatives') return INITIATIVE_COLUMNS
  if (view === 'languages') return LANGUAGE_COLUMNS
  return []
}

/** Written as three branches rather than `columnsFor(view).map(...)`: mapping
 *  over a union of array types does not type-check, because TypeScript cannot
 *  pick one call signature for the union. */
export function columnIds(view: ViewId): string[] {
  if (view === 'initiatives') return INITIATIVE_COLUMNS.map((c) => c.id)
  if (view === 'languages') return LANGUAGE_COLUMNS.map((c) => c.id)
  return []
}
```

- [ ] **Step 4: Run the test and watch it pass**

```bash
cd atlas && pnpm exec vitest run tests/columns.test.ts && pnpm typecheck
```

Expected: PASS, and `tsc --noEmit` clean.

- [ ] **Step 5: Mutation-check the three guards**

Do each, watch the named test go red, restore:
1. Change the `work` column's `scope` from `'I1'` to `'record'` → "scopes matching work to I1" fails.
2. Change the `location` cell's `'not mapped'` to `null` → "says 'not mapped' rather than null" fails.
3. Change the speakers `marker` condition to `> 1` → "marks a speaker count its sources disagree about" fails.

Record in the task report which guards you mutated and that each failed.

- [ ] **Step 6: Commit**

```bash
git add src/lib/columns.ts tests/columns.test.ts
git commit -m "feat(atlas): declare table columns as data

Columns are a pure projection module in the shape of lib/facets.ts: the
single place a column id meets a record field. Each declares its scope, so
the spec's scope-and-unit table is a field the renderer reads rather than a
document that drifts.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Sorting, and its three guards

**Files:**
- Modify: `atlas/src/lib/columns.ts` (append)
- Test: `atlas/tests/sort.test.ts`

**Interfaces:**
- Consumes: `Column<T>`, `SortState`, `TableContext` from Task 1.
- Produces: `sortRows<T>(rows: T[], columns: Column<T>[], sort: SortState | null, ctx: TableContext): T[]` — returns a new array, never mutates its input. Task 5 calls it.

- [ ] **Step 1: Write the failing test**

```ts
// atlas/tests/sort.test.ts
import { describe, expect, it } from 'vitest'
import { sortRows, type Column, type TableContext } from '../src/lib/columns.js'

interface Row { id: string; name: string; n: number | null; rank: number | null }

const ctx: TableContext = { languageName: (id) => id, workCount: () => 0 }

const COLUMNS: Column<Row>[] = [
  { id: 'name', header: 'Name', scope: 'record',
    cell: (r) => ({ kind: 'text', value: r.name, sub: null }), sortValue: (r) => r.name },
  { id: 'n', header: 'N', scope: 'record',
    cell: (r) => ({ kind: 'number', value: r.n, marker: null }), sortValue: (r) => r.n },
  { id: 'rank', header: 'Rank', scope: 'record',
    cell: (r) => ({ kind: 'number', value: r.rank, marker: null }), sortValue: (r) => r.rank },
  { id: 'plain', header: 'Plain', scope: 'record',
    cell: (r) => ({ kind: 'text', value: r.name, sub: null }) },
]

const rows: Row[] = [
  { id: 'c', name: 'Cree', n: 3, rank: 2 },
  { id: 'a', name: 'Anishinaabemowin', n: null, rank: 0 },
  { id: 'm', name: 'Māori', n: 1, rank: null },
]
const ids = (rs: Row[]): string[] => rs.map((r) => r.id)

describe('sortRows', () => {
  // Rule 1. A null floated to the top of a descending sort makes "not
  // recorded" read as the maximum value in the column.
  it('sorts nulls last ascending', () => {
    expect(ids(sortRows(rows, COLUMNS, { column: 'n', direction: 'asc' }, ctx)))
      .toEqual(['m', 'c', 'a'])
  })

  it('sorts nulls last DESCENDING too', () => {
    expect(ids(sortRows(rows, COLUMNS, { column: 'n', direction: 'desc' }, ctx)))
      .toEqual(['c', 'm', 'a'])
  })

  // Rule 3. Without a tie-break the order of equal rows depends on the input
  // array, so a cited URL shows different rows in a different order elsewhere.
  it('breaks ties by name, ascending, in BOTH directions', () => {
    const tied: Row[] = [
      { id: 'z', name: 'Zuni', n: 5, rank: null },
      { id: 'b', name: 'Blackfoot', n: 5, rank: null },
      { id: 'k', name: 'Kanienʼkéha', n: 5, rank: null },
    ]
    expect(ids(sortRows(tied, COLUMNS, { column: 'n', direction: 'asc' }, ctx)))
      .toEqual(['b', 'k', 'z'])
    expect(ids(sortRows(tied, COLUMNS, { column: 'n', direction: 'desc' }, ctx)))
      .toEqual(['b', 'k', 'z'])
  })

  it('defaults to name ascending when no sort is given', () => {
    expect(ids(sortRows(rows, COLUMNS, null, ctx))).toEqual(['a', 'c', 'm'])
  })

  it('sorts strings by locale, not code point', () => {
    expect(ids(sortRows(rows, COLUMNS, { column: 'name', direction: 'desc' }, ctx)))
      .toEqual(['m', 'c', 'a'])
  })

  it('ignores a sort naming an unknown column and falls back to name', () => {
    expect(ids(sortRows(rows, COLUMNS, { column: 'nope', direction: 'desc' }, ctx)))
      .toEqual(['a', 'c', 'm'])
  })

  it('ignores a sort naming a column that declares no sortValue', () => {
    expect(ids(sortRows(rows, COLUMNS, { column: 'plain', direction: 'desc' }, ctx)))
      .toEqual(['a', 'c', 'm'])
  })

  it('does not mutate the array it was given', () => {
    const original = [...rows]
    sortRows(rows, COLUMNS, { column: 'n', direction: 'desc' }, ctx)
    expect(rows).toEqual(original)
  })

  // Rule 2 lives in Task 1's column declarations; this asserts sortRows
  // actually honours a numeric index rather than stringifying it. `rank` 0
  // must not sort as the string "0" against 2.
  it('compares numeric sort values numerically', () => {
    expect(ids(sortRows(rows, COLUMNS, { column: 'rank', direction: 'asc' }, ctx)))
      .toEqual(['a', 'c', 'm'])
  })
})
```

- [ ] **Step 2: Run the test and watch it fail**

```bash
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"
cd atlas && pnpm exec vitest run tests/sort.test.ts
```

Expected: FAIL — `sortRows is not exported`.

- [ ] **Step 3: Write the implementation**

Append to `atlas/src/lib/columns.ts`:

```ts
/** Sorting obeys three rules, each with its own guard in tests/sort.test.ts:
 *  nulls last in BOTH directions, enumerated columns by vocabulary order
 *  (declared on each column's `sortValue`), and ties broken by name so the
 *  order is total. The third is what makes a `?sort=` URL reproducible on
 *  someone else's machine. */
export function sortRows<T>(
  rows: T[],
  columns: Column<T>[],
  sort: SortState | null,
  ctx: TableContext,
): T[] {
  const nameColumn = columns.find((c) => c.id === 'name')
  const nameOf = (r: T): string => {
    if (nameColumn === undefined) return ''
    const cell = nameColumn.cell(r, ctx)
    return cell.kind === 'text' ? (cell.value ?? '') : ''
  }

  const active = sort === null ? undefined : columns.find((c) => c.id === sort.column)
  const sortValue = active?.sortValue
  const dir = sort?.direction === 'desc' ? -1 : 1

  return [...rows].sort((a, b) => {
    if (sortValue !== undefined) {
      const av = sortValue(a, ctx)
      const bv = sortValue(b, ctx)
      // `dir` is deliberately NOT applied to these two lines: absence is not a
      // value at one end of the range, so it sits at the bottom either way.
      if (av === null && bv !== null) return 1
      if (bv === null && av !== null) return -1
      if (typeof av === 'number' && typeof bv === 'number' && av !== bv) {
        return (av - bv) * dir
      }
      if (typeof av === 'string' && typeof bv === 'string') {
        const c = av.localeCompare(bv)
        if (c !== 0) return c * dir
      }
    }
    return nameOf(a).localeCompare(nameOf(b))
  })
}
```

- [ ] **Step 4: Run the test and watch it pass**

```bash
cd atlas && pnpm exec vitest run tests/sort.test.ts && pnpm typecheck
```

Expected: PASS, `tsc --noEmit` clean.

- [ ] **Step 5: Mutation-check the three rules**

1. Apply `dir` to the null branches (`return 1 * dir`) → "sorts nulls last DESCENDING too" fails.
2. Delete the final `return nameOf(a).localeCompare(nameOf(b))` and return `0` → "breaks ties by name" fails.
3. Replace the numeric branch with `String(av).localeCompare(String(bv)) * dir` → "compares numeric sort values numerically" fails.

Restore after each. Name all three in the task report.

- [ ] **Step 6: Commit**

```bash
git add src/lib/columns.ts tests/sort.test.ts
git commit -m "feat(atlas): sort table rows under three guarded rules

Nulls last in both directions, enumerated columns by vocabulary order, ties
broken by name. The third makes the order total, which is what lets a cited
?sort= URL show the same rows in the same order on another machine.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: `view` and `sort` in the URL contract

**Files:**
- Modify: `atlas/src/lib/url-state.ts`, `atlas/src/state/useFilters.ts`
- Test: `atlas/tests/url-state.test.ts` (extend), `atlas/tests/use-filters.test.tsx` (extend)

**Interfaces:**
- Consumes: `VIEWS`, `ViewId`, `SortState`, `columnIds` from Task 1.
- Produces: `FilterState` gains `view: ViewId` and `sort: SortState | null`; `FilterAction` gains `{ type: 'setView'; view: ViewId }` and `{ type: 'setSort'; sort: SortState | null }`. Tasks 5, 6 and 8 consume both.

**Ruling carried into this task:** `sort` is retained only while it names a column of the **current** view. `view=map` therefore always drops `sort`. The cost — switching to the map loses your sort order — is accepted deliberately, because the alternative is a URL like `?view=map&sort=speakers:asc` that encodes a state the page cannot be in, and a URL able to say something meaningless will eventually be cited saying it.

- [ ] **Step 1: Write the failing tests**

Append to `atlas/tests/url-state.test.ts`:

```ts
describe('view and sort', () => {
  // The key list is hardcoded ON PURPOSE. A test deriving it from FilterState
  // would follow a rename and stay green while every URL in the paper broke.
  it('serialises exactly fourteen keys, in this order', () => {
    const search = toSearch({
      family: ['a'], typology: ['b'], endangerment: ['c'], region: ['d'],
      application: ['e'], method: ['f'], regime: ['g'], governance: ['h'],
      from: 1990, to: 2020, lang: 'cho', init: 'i1',
      view: 'languages', sort: { column: 'work', direction: 'desc' },
    })
    expect(search).toBe(
      '?family=a&typology=b&endangerment=c&region=d&application=e&method=f' +
      '&regime=g&governance=h&from=1990&to=2020&lang=cho&init=i1' +
      '&view=languages&sort=work%3Adesc',
    )
  })

  it('defaults to the map and omits the default from the URL', () => {
    expect(parseFilters('').view).toBe('map')
    expect(toSearch({ ...EMPTY_FILTERS, view: 'map' })).toBe('')
  })

  it('degrades an unknown view to the map', () => {
    expect(parseFilters('?view=banana').view).toBe('map')
  })

  it('round-trips a table view with a sort', () => {
    const s = parseFilters('?view=initiatives&sort=started:desc')
    expect(s.view).toBe('initiatives')
    expect(s.sort).toEqual({ column: 'started', direction: 'desc' })
    expect(parseFilters(toSearch(s))).toEqual(s)
  })

  it('drops a sort naming a column the current view does not have', () => {
    expect(parseFilters('?view=initiatives&sort=speakers:asc').sort).toBeNull()
    expect(parseFilters('?view=languages&sort=speakers:asc').sort)
      .toEqual({ column: 'speakers', direction: 'asc' })
  })

  it('drops any sort in map view, where there are no columns', () => {
    expect(parseFilters('?view=map&sort=name:asc').sort).toBeNull()
    expect(parseFilters('?sort=name:asc').sort).toBeNull()
  })

  it('drops a malformed sort rather than coercing it', () => {
    for (const bad of ['', 'name', 'name:', ':asc', 'name:sideways', 'name:asc:desc']) {
      expect(parseFilters(`?view=languages&sort=${encodeURIComponent(bad)}`).sort).toBeNull()
    }
  })
})
```

Append to `atlas/tests/use-filters.test.tsx`:

```ts
describe('view and sort actions', () => {
  it('setView drops a sort the new view cannot honour', () => {
    const withSort = filterReducer(
      { ...EMPTY_FILTERS, view: 'languages' },
      { type: 'setSort', sort: { column: 'speakers', direction: 'asc' } },
    )
    expect(filterReducer(withSort, { type: 'setView', view: 'initiatives' }).sort).toBeNull()
    expect(filterReducer(withSort, { type: 'setView', view: 'map' }).sort).toBeNull()
  })

  it('setView keeps a sort the new view still has', () => {
    const withSort = filterReducer(
      { ...EMPTY_FILTERS, view: 'languages' },
      { type: 'setSort', sort: { column: 'name', direction: 'desc' } },
    )
    expect(filterReducer(withSort, { type: 'setView', view: 'initiatives' }).sort)
      .toEqual({ column: 'name', direction: 'desc' })
  })

  // Clearing the query must not also throw the reader back to the map. It
  // already preserves the open panel for the same reason.
  it('clearAll keeps the view, the sort and the open panel', () => {
    const state = filterReducer(
      { ...EMPTY_FILTERS, view: 'languages', lang: 'cho', init: null,
        sort: { column: 'work', direction: 'asc' }, region: ['africa'] },
      { type: 'clearAll' },
    )
    expect(state.region).toEqual([])
    expect(state.view).toBe('languages')
    expect(state.sort).toEqual({ column: 'work', direction: 'asc' })
    expect(state.lang).toBe('cho')
  })
})
```

- [ ] **Step 2: Run the tests and watch them fail**

```bash
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"
cd atlas && pnpm exec vitest run tests/url-state.test.ts tests/use-filters.test.tsx
```

Expected: FAIL — `view` is not a property of `FilterState`; type errors on the new action types.

- [ ] **Step 3: Write the implementation**

In `atlas/src/lib/url-state.ts`, add the import, extend the interface and `EMPTY_FILTERS`, and add the two parse blocks and two serialise lines:

```ts
import { VIEWS, columnIds, type SortState, type ViewId } from './columns.js'

export interface FilterState {
  // ...existing eight facet arrays, from, to, lang, init...
  view: ViewId
  sort: SortState | null
}

export const EMPTY_FILTERS: FilterState = deepFreezeFilterState({
  family: [], typology: [], endangerment: [], region: [],
  application: [], method: [], regime: [], governance: [],
  from: null, to: null, lang: null, init: null,
  view: 'map', sort: null,
})
```

In `parseFilters`, **after** the `lang`/`init` loop and before `return state`:

```ts
  // View is parsed BEFORE sort, because which columns exist — and therefore
  // which sorts are meaningful — depends on it.
  const rawView = p.get('view')
  if (rawView !== null && (VIEWS as readonly string[]).includes(rawView)) {
    state.view = rawView as ViewId
  }

  const rawSort = p.get('sort')
  if (rawSort !== null) {
    const parts = rawSort.split(':')
    const column = parts[0]
    const direction = parts[1]
    if (
      parts.length === 2 &&
      column !== undefined && column !== '' &&
      (direction === 'asc' || direction === 'desc') &&
      columnIds(state.view).includes(column)
    ) {
      state.sort = { column, direction }
    }
  }
```

In `toSearch`, after the `init` line:

```ts
  // The default is omitted so the landing URL stays empty and a cited URL
  // carries only what the citer actually chose.
  if (state.view !== 'map') p.set('view', state.view)
  if (state.sort !== null) p.set('sort', `${state.sort.column}:${state.sort.direction}`)
```

In `atlas/src/state/useFilters.ts`, add the import and the two actions:

```ts
import { columnIds, type SortState, type ViewId } from '../lib/columns.js'

export type FilterAction =
  // ...existing...
  | { type: 'setView'; view: ViewId }
  | { type: 'setSort'; sort: SortState | null }
```

```ts
    case 'setView': {
      // A sort the new view has no column for would sit in the URL describing
      // nothing. Dropped here so state is canonical before it is serialised.
      const sort =
        state.sort !== null && columnIds(action.view).includes(state.sort.column)
          ? state.sort
          : null
      return { ...state, view: action.view, sort }
    }
    case 'setSort':
      return { ...state, sort: action.sort }
```

and change `clearAll` to preserve the view and sort:

```ts
    case 'clearAll':
      // Clears the query, keeps the open panel and keeps where the reader is
      // looking: clearing filters should neither close the record being read
      // nor throw them back to the map.
      return {
        ...EMPTY_FILTERS,
        lang: state.lang, init: state.init,
        view: state.view, sort: state.sort,
      }
```

- [ ] **Step 4: Run the whole suite and watch it pass**

```bash
cd atlas && pnpm test && pnpm typecheck
```

Expected: PASS. Existing tests that construct a `FilterState` literal will need `view: 'map', sort: null` added — that is a required update, not a loosening.

- [ ] **Step 5: Mutation-check the guards**

1. Move the `view` parse block *after* the `sort` block → "drops a sort naming a column the current view does not have" fails for the `languages` case.
2. Delete `if (state.view !== 'map')` so the view is always written → "defaults to the map and omits the default" fails.
3. Remove `view` and `sort` from the `clearAll` result → "clearAll keeps the view, the sort and the open panel" fails.
4. Rename the `sort` URL key to `order` in both `parseFilters` and `toSearch` → the fourteen-key contract test fails. This is the test's whole purpose; confirm it does.

- [ ] **Step 6: Commit**

```bash
git add src/lib/url-state.ts src/state/useFilters.ts tests/
git commit -m "feat(atlas): put view and sort in the URL contract

Twelve keys become fourteen. Sort is retained only while it names a column of
the current view, so ?view=map&sort=speakers:asc — a state the page cannot be
in — is unrepresentable rather than merely unlikely.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: One `emptyState` predicate for both surfaces

**Files:**
- Modify: `atlas/src/lib/filters.ts`, `atlas/src/components/App.tsx`
- Test: `atlas/tests/empty-state.test.ts`

**Interfaces:**
- Consumes: `Selection` from `filters.ts`.
- Produces: `export type EmptyState = 'matched' | 'no-work-but-languages' | 'nothing-matched'` and `export function emptyState(s: Selection): EmptyState`. Task 5's `TableView` and `App`'s rail both call it — and nothing else may re-derive it.

**Why this task exists:** in SP1b the rail computed "nothing matched" from `languages` and `initiatives` while the finding it was about to render lived in `filteredOut`. At `?region=africa&application=asr` the page printed "Nothing matches the current filters" directly above a populated *"matches your filters, but no matching work"* group. Copying today's corrected predicate into the table would repeat the defect one surface later.

- [ ] **Step 1: Write the failing test**

```ts
// atlas/tests/empty-state.test.ts
import { describe, expect, it } from 'vitest'
import { emptyState, type Selection } from '../src/lib/filters.js'
import type { Initiative, Language } from '../src/schema/index.js'

const l = { id: 'x' } as Language
const sel = (over: Partial<Selection>): Selection =>
  ({ languages: [], initiatives: [], filteredOut: [], undatedInitiatives: 0, ...over })

describe('emptyState', () => {
  it('is nothing-matched only when all three collections are empty', () => {
    expect(emptyState(sel({}))).toBe('nothing-matched')
  })

  // The defect this function exists to prevent: filteredOut IS the finding, so
  // a non-empty filteredOut can never be "nothing matched".
  it('never says nothing-matched while filteredOut carries the finding', () => {
    expect(emptyState(sel({ filteredOut: [l] }))).toBe('no-work-but-languages')
  })

  it('reports no-work-but-languages when work is empty and languages remain', () => {
    expect(emptyState(sel({ languages: [], filteredOut: [l] }))).toBe('no-work-but-languages')
  })

  it('reports matched when there is work', () => {
    const i = { id: 'i' } as unknown as Initiative
    expect(emptyState(sel({ languages: [l], initiatives: [i] }))).toBe('matched')
  })
})
```

- [ ] **Step 2: Run the test and watch it fail**

```bash
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"
cd atlas && pnpm exec vitest run tests/empty-state.test.ts
```

Expected: FAIL — `emptyState is not exported`.

- [ ] **Step 3: Write the implementation**

Append to `atlas/src/lib/filters.ts`:

```ts
export type EmptyState = 'matched' | 'no-work-but-languages' | 'nothing-matched'

/** The SINGLE place the page decides whether anything matched. Two surfaces
 *  now render that decision — the rail and the table — and in SP1b two
 *  independent derivations of it disagreed on screen, printing a denial
 *  directly above the finding it denied. There is one predicate so there is
 *  one thing to be wrong. */
export function emptyState(s: Selection): EmptyState {
  if (s.languages.length === 0 && s.initiatives.length === 0 && s.filteredOut.length === 0) {
    return 'nothing-matched'
  }
  if (s.initiatives.length === 0 && s.filteredOut.length > 0) return 'no-work-but-languages'
  return 'matched'
}
```

In `atlas/src/components/App.tsx`, replace the two local booleans:

```tsx
import { applyFilters, emptyState, facetSummaries, yearRange } from '../lib/filters.js'
```

```tsx
  const empty = emptyState(selection)
  const nFilteredOut = selection.filteredOut.length
```

and change the two guards to `{empty === 'nothing-matched' && (` and `{empty === 'no-work-but-languages' && (`. Delete the `noWorkButLanguages` and `nothingMatched` locals and the comment block above them, which now belongs on `emptyState` itself.

- [ ] **Step 4: Run the whole suite and watch it pass**

```bash
cd atlas && pnpm test && pnpm typecheck
```

Expected: PASS — including the existing `tests/filtered-out.test.tsx`, which asserts the rail's behaviour and must keep passing unchanged.

- [ ] **Step 5: Mutation-check**

Change the first condition in `emptyState` to drop `s.filteredOut.length === 0` → both "never says nothing-matched while filteredOut carries the finding" and the existing rail test must fail. Restore.

- [ ] **Step 6: Commit**

```bash
git add src/lib/filters.ts src/components/App.tsx tests/empty-state.test.ts
git commit -m "refactor(atlas): one empty-state predicate, not one per surface

The rail and the table both have to say whether anything matched. In SP1b two
derivations of that question disagreed and the page denied its own finding.
Hoisted into filters.ts before the second consumer exists rather than after.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: `DataTable`, `TableView`, `ViewSwitch`, `NotRecorded`

**Files:**
- Create: `atlas/src/components/DataTable.tsx`, `atlas/src/components/TableView.tsx`, `atlas/src/components/ViewSwitch.tsx`, `atlas/src/components/NotRecorded.tsx`
- Modify: `atlas/src/components/Field.tsx`
- Test: `atlas/tests/data-table.test.tsx`, `atlas/tests/table-view.test.tsx`, `atlas/tests/view-switch.test.tsx`

**Interfaces:**
- Consumes: `Column`, `Cell`, `SortState`, `TableContext`, `ViewId`, `columnsFor`, `sortRows` (Tasks 1–2); `Selection`, `emptyState` (Task 4); `AtlasBundle` from `../lib/load.js`.
- Produces:
  - `DataTable<T extends { id: string }>(props)` where props are `{ caption, columns: Column<T>[], rows: T[], sort, onSort, selectedId, onSelect, ctx, emptyMessage }`.
  - `TableView(props)` where props are `{ view: 'initiatives' | 'languages', selection: Selection, bundle: AtlasBundle, sort: SortState | null, onSort: (s: SortState) => void, selectedId: string | null, onSelect: (id: string) => void }`.
  - `ViewSwitch(props)` where props are `{ view: ViewId, counts: { initiatives: number; languages: number }, onChange: (v: ViewId) => void }`.
  - `NotRecorded()` renders `<em>not recorded</em>`.
- Task 6 mounts all three in `App`.

- [ ] **Step 1: Write the failing tests**

```tsx
// atlas/tests/data-table.test.tsx
// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import DataTable from '../src/components/DataTable.js'
import type { Column, TableContext } from '../src/lib/columns.js'

afterEach(() => cleanup())

interface Row { id: string; name: string; n: number | null }
const ctx: TableContext = { languageName: (id) => id, workCount: () => 0 }
const COLUMNS: Column<Row>[] = [
  { id: 'name', header: 'Name', scope: 'record',
    cell: (r) => ({ kind: 'text', value: r.name, sub: null }), sortValue: (r) => r.name },
  { id: 'n', header: 'N', scope: 'record',
    cell: (r) => ({ kind: 'number', value: r.n, marker: r.n === 9600 ? '†' : null }),
    sortValue: (r) => r.n },
  { id: 'tags', header: 'Tags', scope: 'record', cell: () => ({ kind: 'list', values: [] }) },
]
const rows: Row[] = [{ id: 'a', name: 'Anishinaabemowin', n: 9600 }, { id: 'b', name: 'Blackfoot', n: null }]

const table = (over: Partial<React.ComponentProps<typeof DataTable<Row>>> = {}) =>
  render(
    <DataTable<Row>
      caption="Some rows (2)." columns={COLUMNS} rows={rows} sort={null}
      onSort={() => {}} selectedId={null} onSelect={() => {}} ctx={ctx} emptyMessage={null}
      {...over}
    />,
  )

describe('DataTable', () => {
  it('renders a real table with a caption and column headers', () => {
    table()
    expect(screen.getByRole('table')).toBeDefined()
    expect(screen.getByText('Some rows (2).')).toBeDefined()
    expect(screen.getAllByRole('columnheader').map((h) => h.textContent))
      .toEqual(['Name', 'N', 'Tags'])
  })

  it('renders an absent value as the words "not recorded", never a blank cell', () => {
    table()
    const row = screen.getByTestId('row-b')
    expect(within(row).getAllByText(/not recorded/i).length).toBe(2)
  })

  it('renders a conflict marker next to a disputed number', () => {
    table()
    expect(within(screen.getByTestId('row-a')).getByText('†')).toBeDefined()
  })

  it('selects a row through its name button', () => {
    const onSelect = vi.fn()
    table({ onSelect })
    fireEvent.click(screen.getByRole('button', { name: /blackfoot/i }))
    expect(onSelect).toHaveBeenCalledWith('b')
  })

  it('marks the selected row', () => {
    table({ selectedId: 'a' })
    expect(screen.getByTestId('row-a').getAttribute('aria-selected')).toBe('true')
    expect(screen.getByTestId('row-b').getAttribute('aria-selected')).toBe('false')
  })

  it('announces sort state on the active header only', () => {
    table({ sort: { column: 'n', direction: 'desc' } })
    const [name, n] = screen.getAllByRole('columnheader')
    expect(n!.getAttribute('aria-sort')).toBe('descending')
    expect(name!.getAttribute('aria-sort')).toBe('none')
  })

  it('sorts ascending on first click and toggles on the second', () => {
    const onSort = vi.fn()
    const { rerender } = table({ onSort })
    fireEvent.click(screen.getByRole('button', { name: /^n$/i }))
    expect(onSort).toHaveBeenCalledWith({ column: 'n', direction: 'asc' })
    rerender(
      <DataTable<Row>
        caption="c" columns={COLUMNS} rows={rows} sort={{ column: 'n', direction: 'asc' }}
        onSort={onSort} selectedId={null} onSelect={() => {}} ctx={ctx} emptyMessage={null}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /^n$/i }))
    expect(onSort).toHaveBeenLastCalledWith({ column: 'n', direction: 'desc' })
  })

  it('gives an unsortable column no header button', () => {
    table()
    expect(screen.queryByRole('button', { name: /^tags$/i })).toBeNull()
  })

  it('actually orders the rows it is given', () => {
    table({ sort: { column: 'n', direction: 'asc' } })
    // n: null sorts last whatever the direction, so Blackfoot is below.
    expect(screen.getAllByTestId(/^row-/).map((r) => r.getAttribute('data-testid')))
      .toEqual(['row-a', 'row-b'])
  })

  it('states why the body is empty instead of showing bare headers', () => {
    table({ rows: [], emptyMessage: 'No initiative matches the current filters.' })
    expect(screen.getByTestId('table-empty').textContent)
      .toMatch(/no initiative matches the current filters/i)
  })
})
```

```tsx
// atlas/tests/table-view.test.tsx
// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import TableView from '../src/components/TableView.js'
import { loadBundle } from '../src/lib/load.js'
import { applyFilters } from '../src/lib/filters.js'
import { EMPTY_FILTERS } from '../src/lib/url-state.js'

afterEach(() => cleanup())

const bundle = loadBundle()
const selection = applyFilters(bundle, EMPTY_FILTERS)

const view = (v: 'initiatives' | 'languages') =>
  render(
    <TableView
      view={v} selection={selection} bundle={bundle} sort={null}
      onSort={() => {}} selectedId={null} onSelect={() => {}}
    />,
  )

describe('TableView', () => {
  it('shows I1 in the initiatives tab', () => {
    view('initiatives')
    expect(screen.getAllByTestId(/^row-/).length).toBe(selection.initiatives.length)
  })

  // Spec T5: L1, not L2. A language the map drops for having no matching work
  // is exactly the row the table exists to show.
  it('shows L1 in the languages tab, including languages with no matching work', () => {
    view('languages')
    expect(screen.getAllByTestId(/^row-/).length)
      .toBe(selection.languages.length + selection.filteredOut.length)
  })

  // A bare "0" invites the reading "no work exists". The caption is the only
  // place that difference can be stated, and it is in the same DOM as the rows.
  it('states the scope of the matching-work count in the caption', () => {
    view('languages')
    const caption = screen.getByTestId('table-caption').textContent ?? ''
    expect(caption).toMatch(/matching work/i)
    expect(caption).toMatch(/every current filter/i)
    expect(caption).toMatch(/not.*no work/i)
  })

  it('explains the conflict dagger in the caption', () => {
    view('languages')
    expect(screen.getByTestId('table-caption').textContent).toMatch(/disagree/i)
  })

  it('resolves initiative language ids to names', () => {
    view('initiatives')
    const names = bundle.languages.map((l) => l.name)
    const body = screen.getByRole('table').textContent ?? ''
    expect(names.some((n) => body.includes(n))).toBe(true)
  })

  it('renders the shared empty-state sentence when no work matches', () => {
    render(
      <TableView
        view="initiatives"
        selection={{ languages: [], initiatives: [], filteredOut: [bundle.languages[0]!], undatedInitiatives: 0 }}
        bundle={bundle} sort={null} onSort={() => {}} selectedId={null} onSelect={() => {}}
      />,
    )
    expect(screen.getByTestId('table-empty').textContent).toMatch(/no matching work/i)
  })
})
```

```tsx
// atlas/tests/view-switch.test.tsx
// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ViewSwitch from '../src/components/ViewSwitch.js'

afterEach(() => cleanup())

describe('ViewSwitch', () => {
  it('offers all three views and marks the current one', () => {
    render(<ViewSwitch view="languages" counts={{ initiatives: 4, languages: 5 }} onChange={() => {}} />)
    expect(screen.getByRole('button', { name: /^map$/i }).getAttribute('aria-pressed')).toBe('false')
    expect(screen.getByRole('button', { name: /languages \(5\)/i }).getAttribute('aria-pressed')).toBe('true')
  })

  it('shows the row count each table would hold', () => {
    render(<ViewSwitch view="map" counts={{ initiatives: 4, languages: 5 }} onChange={() => {}} />)
    expect(screen.getByRole('button', { name: /initiatives \(4\)/i })).toBeDefined()
  })

  it('reports the chosen view', () => {
    const onChange = vi.fn()
    render(<ViewSwitch view="map" counts={{ initiatives: 4, languages: 5 }} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: /initiatives/i }))
    expect(onChange).toHaveBeenCalledWith('initiatives')
  })
})
```

- [ ] **Step 2: Run the tests and watch them fail**

```bash
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"
cd atlas && pnpm exec vitest run tests/data-table.test.tsx tests/table-view.test.tsx tests/view-switch.test.tsx
```

Expected: FAIL — the three components do not resolve.

- [ ] **Step 3: Write the implementations**

```tsx
// atlas/src/components/NotRecorded.tsx
/** One implementation of the words, shared by `Field` and `DataTable`. A blank
 *  reads as "nothing to say"; the words say "we don't know". */
export default function NotRecorded(): React.JSX.Element {
  return <em className="not-recorded">not recorded</em>
}
```

In `atlas/src/components/Field.tsx`, import it and replace the literal:

```tsx
import NotRecorded from './NotRecorded.js'
// ...
      <dd>{isEmpty(children) ? <NotRecorded /> : children}</dd>
```

```tsx
// atlas/src/components/DataTable.tsx
import { sortRows, type Cell, type Column, type SortState, type TableContext } from '../lib/columns.js'
import NotRecorded from './NotRecorded.js'

function renderCell(c: Cell): React.ReactNode {
  switch (c.kind) {
    case 'text':
      if (c.value === null) return <NotRecorded />
      return c.sub === null ? c.value : (
        <>
          <span>{c.value}</span>
          <small className="cell__sub">{c.sub}</small>
        </>
      )
    case 'list':
      return c.values.length === 0 ? <NotRecorded /> : c.values.join(', ')
    case 'number':
      if (c.value === null) return <NotRecorded />
      return (
        <>
          {c.value.toLocaleString('en')}
          {c.marker !== null && <abbr title="sources disagree about this figure">{c.marker}</abbr>}
        </>
      )
  }
}

const ARIA_SORT = { asc: 'ascending', desc: 'descending' } as const

/** Knows nothing about the atlas: it renders `Cell` descriptors and reports
 *  clicks. Everything domain-shaped lives in `lib/columns.ts`. */
export default function DataTable<T extends { id: string }>({
  caption, columns, rows, sort, onSort, selectedId, onSelect, ctx, emptyMessage,
}: {
  caption: string
  columns: Column<T>[]
  rows: T[]
  sort: SortState | null
  onSort: (s: SortState) => void
  selectedId: string | null
  onSelect: (id: string) => void
  ctx: TableContext
  emptyMessage: string | null
}): React.JSX.Element {
  const ordered = sortRows(rows, columns, sort, ctx)

  return (
    <div className="table-wrap">
      <table className="data-table">
        <caption data-testid="table-caption">{caption}</caption>
        <thead>
          <tr>
            {columns.map((c) => {
              const active = sort !== null && sort.column === c.id
              return (
                <th
                  key={c.id} scope="col"
                  aria-sort={active ? ARIA_SORT[sort.direction] : 'none'}
                >
                  {c.sortValue === undefined ? c.header : (
                    <button
                      type="button" className="th-sort"
                      onClick={() =>
                        onSort({
                          column: c.id,
                          // First click on a new column starts ascending; a
                          // second click on the same column reverses it.
                          direction: active && sort.direction === 'asc' ? 'desc' : 'asc',
                        })
                      }
                    >
                      {c.header}
                    </button>
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {ordered.length === 0 && emptyMessage !== null && (
            <tr>
              <td colSpan={columns.length} data-testid="table-empty">{emptyMessage}</td>
            </tr>
          )}
          {ordered.map((r) => (
            <tr
              key={r.id} data-testid={`row-${r.id}`}
              aria-selected={r.id === selectedId}
              className={r.id === selectedId ? 'is-selected' : undefined}
            >
              {columns.map((c, n) => (
                <td key={c.id}>
                  {n === 0 ? (
                    <button type="button" className="link-button" onClick={() => onSelect(r.id)}>
                      {renderCell(c.cell(r, ctx))}
                    </button>
                  ) : (
                    renderCell(c.cell(r, ctx))
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

```tsx
// atlas/src/components/TableView.tsx
import { useMemo } from 'react'
import { INITIATIVE_COLUMNS, LANGUAGE_COLUMNS, type SortState, type TableContext } from '../lib/columns.js'
import { emptyState, type Selection } from '../lib/filters.js'
import type { AtlasBundle } from '../lib/load.js'
import type { Initiative, Language } from '../schema/index.js'
import DataTable from './DataTable.js'

const EMPTY_COPY = {
  'nothing-matched': 'Nothing matches the current filters.',
  'no-work-but-languages':
    'No initiative matches the current filters. The languages that matched are listed in the Languages view and in the rail — no matching work is a finding, not an empty result.',
  matched: null,
} as const

export default function TableView({
  view, selection, bundle, sort, onSort, selectedId, onSelect,
}: {
  view: 'initiatives' | 'languages'
  selection: Selection
  bundle: AtlasBundle
  sort: SortState | null
  onSort: (s: SortState) => void
  selectedId: string | null
  onSelect: (id: string) => void
}): React.JSX.Element {
  // Bundle-scoped on purpose: an initiative may name a language the current
  // filters exclude, and printing its raw id there would be a worse answer
  // than printing its name.
  const ctx = useMemo<TableContext>(() => {
    const names = new Map(bundle.languages.map((l) => [l.id, l.name]))
    const work = new Map<string, number>()
    for (const i of selection.initiatives) {
      for (const id of i.languages) work.set(id, (work.get(id) ?? 0) + 1)
    }
    return {
      languageName: (id) => names.get(id) ?? id,
      workCount: (id) => work.get(id) ?? 0,
    }
  }, [bundle, selection])

  const empty = EMPTY_COPY[emptyState(selection)]

  if (view === 'initiatives') {
    const rows = selection.initiatives
    return (
      <DataTable<Initiative>
        caption={`Initiatives matching the current filters (${rows.length}). Every column reflects all current filters, including the date window.`}
        columns={INITIATIVE_COLUMNS} rows={rows} sort={sort} onSort={onSort}
        selectedId={selectedId} onSelect={onSelect} ctx={ctx} emptyMessage={empty}
      />
    )
  }

  // L1: the languages the map keeps PLUS the ones it drops for having no
  // matching work. Dropping the second group here would delete the finding.
  const rows: Language[] = [...selection.languages, ...selection.filteredOut]
  return (
    <DataTable<Language>
      caption={`Languages matching the current language filters (${rows.length}). “Matching work” counts initiatives surviving every current filter, so 0 means no matching work — not that no work exists. † marks a speaker count sources disagree about.`}
      columns={LANGUAGE_COLUMNS} rows={rows} sort={sort} onSort={onSort}
      selectedId={selectedId} onSelect={onSelect} ctx={ctx} emptyMessage={empty}
    />
  )
}
```

```tsx
// atlas/src/components/ViewSwitch.tsx
import { VIEWS, type ViewId } from '../lib/columns.js'

const LABELS: Record<ViewId, string> = {
  map: 'Map', initiatives: 'Initiatives', languages: 'Languages',
}

/** Buttons with `aria-pressed`, not an ARIA tablist: this swaps the whole
 *  pane rather than switching panels inside one. */
export default function ViewSwitch({
  view, counts, onChange,
}: {
  view: ViewId
  counts: { initiatives: number; languages: number }
  onChange: (v: ViewId) => void
}): React.JSX.Element {
  return (
    <div className="view-switch" role="group" aria-label="View">
      {VIEWS.map((v) => (
        <button
          key={v} type="button" aria-pressed={v === view}
          data-testid={`view-${v}`} onClick={() => onChange(v)}
        >
          {LABELS[v]}
          {v !== 'map' && <span className="view-switch__n"> ({counts[v]})</span>}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Run the tests and watch them pass**

```bash
cd atlas && pnpm test && pnpm typecheck
```

Expected: PASS.

- [ ] **Step 5: Mutation-check the guards**

1. In `TableView`'s languages branch, change `rows` to `selection.languages` only → "shows L1 in the languages tab" fails.
2. Delete the "not that no work exists" clause from the languages caption → "states the scope of the matching-work count" fails.
3. In `DataTable`, replace `sortRows(rows, columns, sort, ctx)` with `rows` → "actually orders the rows it is given" fails.
4. In `renderCell`, return `''` instead of `<NotRecorded />` for a null text value → "renders an absent value as the words" fails.
5. Make `workCount` count `bundle.initiatives` instead of `selection.initiatives` → the languages-tab row-count and caption tests still pass, but note this in the report: it is caught in Task 11's seam review, not here. If you can write a test that catches it now, do.

- [ ] **Step 6: Commit**

```bash
git add src/components/ tests/
git commit -m "feat(atlas): the table, the view switch, and shared not-recorded

DataTable renders Cell descriptors and knows nothing about the atlas.
TableView picks the rows: I1 for initiatives, L1 for languages — including the
languages the map drops for having no matching work, which is the row the
table exists to show. The caption carries the scope sentence and the dagger
key, in the same DOM as the rows.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Wire the pane, and rename the grid area

**Files:**
- Modify: `atlas/src/components/App.tsx`, `atlas/src/styles.css`
- Test: `atlas/tests/app-wiring.test.tsx` (extend)

**Interfaces:**
- Consumes: `ViewSwitch`, `TableView` (Task 5); `setView`, `setSort` (Task 3).
- Produces: nothing new; `App` is the wiring point.

**The rename:** the grid area currently called `map` will hold a table. `grid-area: map` containing a languages table is exactly the misleading structure that makes a later reader wire something wrong. Rename the area and the class to `pane`. **There are two `grid-template-areas` blocks in `styles.css`** — the base one near line 65 and the narrow-viewport one near line 553 — and both must change. SP1a's worst layout defect was a grid area that existed in one block and not the other.

**The constant-substitution rule (SP1b rulings 13/16):** for every prop `App` computes there must be an App-level test that fails if it is replaced by a constant. In SP1b five such substitutions stayed green, including deleting the entire `<Timeline>`.

- [ ] **Step 1: Write the failing tests**

Append to `atlas/tests/app-wiring.test.tsx` (it already mocks `maplibre-gl`; reuse that mock). These tests use `cleanup`, `fireEvent`, `screen` and `within` — add whichever the file does not already import from `@testing-library/react`.

```tsx
describe('view wiring', () => {
  const renderAt = (search: string) => {
    window.history.replaceState({}, '', `/${search}`)
    return render(<App />)
  }

  it('renders the map pane by default and no table', () => {
    renderAt('')
    expect(screen.queryByRole('table')).toBeNull()
    expect(screen.getByTestId('view-map').getAttribute('aria-pressed')).toBe('true')
  })

  it('renders the table instead of the map at ?view=initiatives', () => {
    renderAt('?view=initiatives')
    expect(screen.getByRole('table')).toBeDefined()
    expect(screen.queryByTestId('map-container')).toBeNull()
  })

  it('switching the view rewrites the URL', () => {
    renderAt('')
    fireEvent.click(screen.getByTestId('view-languages'))
    expect(window.location.search).toBe('?view=languages')
  })

  // Constant-substitution guards. Each fails if App passes a literal instead
  // of the value it computes.
  it('passes the live row counts to the switch, not a constant', () => {
    renderAt('?application=asr')
    const withFilter = screen.getByTestId('view-initiatives').textContent
    cleanup()
    renderAt('')
    expect(screen.getByTestId('view-initiatives').textContent).not.toBe(withFilter)
  })

  it('passes the URL sort down to the table, not a constant', () => {
    renderAt('?view=languages&sort=name:desc')
    const headers = screen.getAllByRole('columnheader')
    expect(headers[0]!.getAttribute('aria-sort')).toBe('descending')
  })

  it('sorting from the table writes the sort to the URL', () => {
    renderAt('?view=languages')
    fireEvent.click(screen.getByRole('button', { name: /^family$/i }))
    expect(window.location.search).toContain('sort=family%3Aasc')
  })

  it('selecting a table row opens that record, not a constant one', () => {
    renderAt('?view=languages')
    const first = screen.getAllByTestId(/^row-/)[0]!
    const name = within(first).getAllByRole('button')[0]!
    fireEvent.click(name)
    expect(window.location.search).toMatch(/lang=/)
  })

  it('feeds the table the filtered selection, not the whole bundle', () => {
    renderAt('?view=initiatives&application=asr')
    const filtered = screen.getAllByTestId(/^row-/).length
    cleanup()
    renderAt('?view=initiatives')
    expect(screen.getAllByTestId(/^row-/).length).toBeGreaterThan(filtered)
  })
})
```

- [ ] **Step 2: Run the tests and watch them fail**

```bash
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"
cd atlas && pnpm exec vitest run tests/app-wiring.test.tsx
```

Expected: FAIL — `view-map` test id does not exist.

- [ ] **Step 3: Write the implementation**

In `atlas/src/components/App.tsx`, add the imports and replace the map block:

```tsx
import TableView from './TableView.js'
import ViewSwitch from './ViewSwitch.js'
```

```tsx
      <div className="atlas__pane">
        <ViewSwitch
          view={state.view}
          counts={{
            initiatives: selection.initiatives.length,
            languages: selection.languages.length + selection.filteredOut.length,
          }}
          onChange={(view) => dispatch({ type: 'setView', view })}
        />
        {state.view === 'map' ? (
          <MapView
            languages={languageFields(selection.languages)}
            initiatives={initiativeSites(selection.initiatives)}
            selectedLanguageId={state.lang}
            onSelectLanguage={(id) => dispatch({ type: 'selectLanguage', id })}
            onSelectInitiative={(id) => dispatch({ type: 'selectInitiative', id })}
          />
        ) : (
          <TableView
            view={state.view}
            selection={selection}
            bundle={bundle}
            sort={state.sort}
            onSort={(sort) => dispatch({ type: 'setSort', sort })}
            selectedId={state.view === 'languages' ? state.lang : state.init}
            onSelect={(id) =>
              dispatch(
                state.view === 'languages'
                  ? { type: 'selectLanguage', id }
                  : { type: 'selectInitiative', id },
              )
            }
          />
        )}
      </div>
```

In `atlas/src/styles.css`, in **both** `grid-template-areas` blocks, rename `map` to `pane`, and rename the `.atlas__map` rules to `.atlas__pane`. Then add:

```css
/* The pane is a column: a fixed switch above a scrolling body. `min-height: 0`
   on both the pane and the scroller is what lets the body shrink inside the
   grid row — without it a flex child refuses to go below its content height
   and the table pushes the page into a horizontal scroll. */
.atlas__pane {
  grid-area: pane;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.view-switch { display: flex; gap: 0.25rem; padding: 0.5rem; border-bottom: 1px solid var(--rule); }
.view-switch button[aria-pressed='true'] { font-weight: 600; }

.table-wrap { flex: 1 1 auto; min-height: 0; overflow: auto; }
.data-table { border-collapse: collapse; width: 100%; font-size: 0.875rem; }
.data-table caption { text-align: left; padding: 0.5rem; color: var(--muted); }
.data-table th { position: sticky; top: 0; background: var(--bg); text-align: left; }
.data-table th, .data-table td { padding: 0.35rem 0.5rem; border-bottom: 1px solid var(--rule); vertical-align: top; }
.cell__sub { display: block; color: var(--muted); }
.data-table tr.is-selected { background: var(--accent-muted-bg, rgba(207, 157, 128, 0.18)); }
```

Adjust `var(--muted)`, `var(--bg)` and `var(--rule)` to whatever the existing custom properties in `styles.css` are actually called; do not invent new ones.

- [ ] **Step 4: Run the whole suite and watch it pass**

```bash
cd atlas && pnpm test && pnpm typecheck
```

Expected: PASS. Grep for stragglers: `grep -rn 'atlas__map\|grid-area: map' src tests` must return nothing.

- [ ] **Step 5: Mutation-check every wiring guard**

For each of the six wiring tests, make the substitution it forbids and watch it fail:
1. `counts={{ initiatives: 4, languages: 5 }}` → "passes the live row counts" fails.
2. `sort={null}` → "passes the URL sort down" fails.
3. `onSort={() => {}}` → "sorting from the table writes the sort" fails.
4. `onSelect={() => {}}` → "selecting a table row opens that record" fails.
5. `selection={applyFilters(bundle, EMPTY_FILTERS)}` → "feeds the table the filtered selection" fails.
6. Delete the whole `<ViewSwitch>` → the first three fail.

Restore after each. Report all six.

- [ ] **Step 6: Commit**

```bash
git add src/components/App.tsx src/styles.css tests/app-wiring.test.tsx
git commit -m "feat(atlas): swap the pane between map and table

Renames the grid area from map to pane in both grid-template-areas blocks: an
area called map holding a languages table is the kind of misleading structure
that gets something wired wrong later.

Every prop App computes has a test that fails if it is replaced by a constant.
In SP1b five such substitutions stayed green, including deleting the timeline.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Collapsible facet groups and per-group clear

**Files:**
- Modify: `atlas/src/components/FacetGroup.tsx`, `atlas/src/components/FacetPanel.tsx`, `atlas/src/components/App.tsx`, `atlas/src/styles.css`
- Test: `atlas/tests/facet-collapse.test.tsx`

**Interfaces:**
- Consumes: `FacetSummary`, `TYPE_TO_NARROW_THRESHOLD` (already exported from `FacetGroup.tsx`), the `clearFacet` action (already in the reducer, dispatched by nobody).
- Produces: `FacetGroup` gains `onClearFacet: () => void`; `FacetPanel` gains `onClearFacet: (facet: FacetId) => void`.

**Why:** spec §6 of SP1b mandated collapsible groups and they were never built — a silent narrowing of an approved spec, recorded in the SP1b decision record rather than lost. `clearFacet` was implemented and tested in SP1b and wired to nothing.

- [ ] **Step 1: Write the failing test**

```tsx
// atlas/tests/facet-collapse.test.tsx
// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import FacetGroup, { TYPE_TO_NARROW_THRESHOLD } from '../src/components/FacetGroup.js'
import type { FacetSummary } from '../src/lib/filters.js'

afterEach(() => cleanup())

const summary = (over: Partial<FacetSummary> = {}): FacetSummary => ({
  id: 'region', label: 'Region',
  options: [{ value: 'africa', count: 2 }, { value: 'oceania', count: 1 }],
  notRecorded: 0, notRecordedTotal: 0, curated: true, selected: [], ...over,
})

const many = Array.from({ length: TYPE_TO_NARROW_THRESHOLD + 1 }, (_, n) => ({
  value: `v${String(n).padStart(2, '0')}`, count: 1,
}))

describe('FacetGroup disclosure', () => {
  it('gives the group a disclosure button wired to its body', () => {
    render(<FacetGroup summary={summary()} onToggle={() => {}} onClearFacet={() => {}} />)
    const toggle = screen.getByTestId('facet-toggle-region')
    expect(toggle.getAttribute('aria-expanded')).toBe('true')
    const bodyId = toggle.getAttribute('aria-controls')
    expect(bodyId).not.toBeNull()
    expect(document.getElementById(bodyId!)).not.toBeNull()
  })

  it('collapses and expands on click', () => {
    render(<FacetGroup summary={summary()} onToggle={() => {}} onClearFacet={() => {}} />)
    const toggle = screen.getByTestId('facet-toggle-region')
    const body = document.getElementById(toggle.getAttribute('aria-controls')!)!
    expect(body.hasAttribute('hidden')).toBe(false)
    fireEvent.click(toggle)
    expect(body.hasAttribute('hidden')).toBe(true)
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
  })

  it('starts collapsed when the list is longer than the narrow threshold', () => {
    render(<FacetGroup summary={summary({ options: many })} onToggle={() => {}} onClearFacet={() => {}} />)
    expect(screen.getByTestId('facet-toggle-region').getAttribute('aria-expanded')).toBe('false')
  })

  // SP1b ruling 17, one layer up: a selection hidden behind a collapsed
  // disclosure is exactly as unclearable as one counted out of its own group.
  it('starts OPEN when the group holds a selection, however long the list', () => {
    render(
      <FacetGroup summary={summary({ options: many, selected: ['v03'] })}
        onToggle={() => {}} onClearFacet={() => {}} />,
    )
    expect(screen.getByTestId('facet-toggle-region').getAttribute('aria-expanded')).toBe('true')
  })

  it('offers a clear control only when the group holds a selection', () => {
    const onClearFacet = vi.fn()
    const { rerender } = render(
      <FacetGroup summary={summary()} onToggle={() => {}} onClearFacet={onClearFacet} />,
    )
    expect(screen.queryByTestId('facet-clear-region')).toBeNull()
    rerender(
      <FacetGroup summary={summary({ selected: ['africa'] })}
        onToggle={() => {}} onClearFacet={onClearFacet} />,
    )
    fireEvent.click(screen.getByTestId('facet-clear-region'))
    expect(onClearFacet).toHaveBeenCalled()
  })

  it('gives an uncurated group the same disclosure', () => {
    render(
      <FacetGroup summary={summary({ curated: false, options: [], notRecordedTotal: 3 })}
        onToggle={() => {}} onClearFacet={() => {}} />,
    )
    expect(screen.getByTestId('facet-toggle-region')).toBeDefined()
    expect(screen.getByText(/not yet curated \(3 records\)/i)).toBeDefined()
  })
})
```

Add to `atlas/tests/app-wiring.test.tsx`:

```tsx
  it('clearing one group clears only that group', () => {
    window.history.replaceState({}, '', '/?region=africa&application=mt')
    render(<App />)
    fireEvent.click(screen.getByTestId('facet-clear-region'))
    expect(window.location.search).toBe('?application=mt')
  })
```

- [ ] **Step 2: Run the tests and watch them fail**

```bash
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"
cd atlas && pnpm exec vitest run tests/facet-collapse.test.tsx tests/app-wiring.test.tsx
```

Expected: FAIL — `onClearFacet` is not a prop; no `facet-toggle-region`.

- [ ] **Step 3: Write the implementation**

In `atlas/src/components/FacetGroup.tsx`, add `useState` for the disclosure and restructure both branches to share one legend. Keep every existing comment and every existing behaviour — the `rows` union, the surviving selection, the `showNotRecorded` rule and the needle are unchanged.

```tsx
export default function FacetGroup({
  summary, onToggle, onClearFacet,
}: {
  summary: FacetSummary
  onToggle: (value: string) => void
  onClearFacet: () => void
}): React.JSX.Element {
  const [needle, setNeedle] = useState('')
  // ...existing `isSelected`, `rows`, `showNotRecorded`, `showNeedle`, `visible`, `options`...

  const bodyId = `facet-body-${summary.id}`
  // Long lists start collapsed, reusing the threshold that already governs the
  // same judgment about the same lists. A selection always wins: hiding one
  // behind a closed disclosure makes it unclearable.
  const [open, setOpen] = useState(
    () => summary.selected.length > 0 || rows.length <= TYPE_TO_NARROW_THRESHOLD,
  )

  const legend = (
    <legend className="facet__legend">
      <button
        type="button" className="facet__toggle"
        aria-expanded={open} aria-controls={bodyId}
        data-testid={`facet-toggle-${summary.id}`}
        onClick={() => setOpen(!open)}
      >
        {summary.label}
        {summary.selected.length > 0 && (
          <span className="facet__count"> ({summary.selected.length})</span>
        )}
      </button>
      {summary.selected.length > 0 && (
        <button
          type="button" className="link-button"
          data-testid={`facet-clear-${summary.id}`}
          onClick={onClearFacet}
        >
          clear
        </button>
      )}
    </legend>
  )

  if (!summary.curated) {
    const n = summary.notRecordedTotal
    return (
      <fieldset className="facet facet--uncurated" data-testid={`facet-${summary.id}`}>
        {legend}
        <div id={bodyId} hidden={!open}>
          <p className="facet__uncurated">
            Not yet curated ({n} record{n === 1 ? '' : 's'})
          </p>
          {summary.selected.length > 0 && options}
        </div>
      </fieldset>
    )
  }

  return (
    <fieldset className="facet" data-testid={`facet-${summary.id}`}>
      {legend}
      <div id={bodyId} hidden={!open}>
        {showNeedle && (
          <input
            type="text" className="facet__needle"
            placeholder={`Filter ${summary.label.toLowerCase()}`}
            aria-label={`Filter ${summary.label} options`}
            data-testid={`facet-filter-${summary.id}`}
            value={needle} onChange={(e) => setNeedle(e.target.value)}
          />
        )}
        {rows.length === 0 && !showNotRecorded ? (
          <p className="facet__empty">No values in the current selection.</p>
        ) : (
          options
        )}
      </div>
    </fieldset>
  )
}
```

In `atlas/src/components/FacetPanel.tsx`, add the prop and pass it down:

```tsx
  onClearFacet: (facet: FacetId) => void
```
```tsx
  <FacetGroup key={s.id} summary={s} onToggle={(v) => onToggle(s.id, v)}
    onClearFacet={() => onClearFacet(s.id)} />
```

In `atlas/src/components/App.tsx`, on `<FacetPanel>`:

```tsx
  onClearFacet={(facet) => dispatch({ type: 'clearFacet', facet })}
```

In `atlas/src/styles.css`:

```css
.facet__legend { display: flex; align-items: baseline; gap: 0.5rem; width: 100%; }
.facet__toggle { background: none; border: 0; padding: 0; font: inherit; cursor: pointer; text-align: left; }
.facet__toggle[aria-expanded='false']::before { content: '▸ '; }
.facet__toggle[aria-expanded='true']::before { content: '▾ '; }
```

- [ ] **Step 4: Run the whole suite and watch it pass**

```bash
cd atlas && pnpm test && pnpm typecheck
```

Expected: PASS. The existing `tests/facet-panel.test.tsx` must keep passing — if it queries inside a now-collapsed long group, expand the group in the test rather than changing the default.

- [ ] **Step 5: Mutation-check**

1. Drop `summary.selected.length > 0 ||` from the `open` initialiser → "starts OPEN when the group holds a selection" fails.
2. Render the clear button unconditionally → "offers a clear control only when" fails.
3. Have `onClearFacet` dispatch `clearAll` in `App` → "clearing one group clears only that group" fails.

- [ ] **Step 6: Commit**

```bash
git add src/components/ src/styles.css tests/
git commit -m "feat(atlas): collapsible facet groups with a per-group clear

Closes a spec narrowing recorded in SP1b: §6 mandated collapsible groups and
they were never built. Wires clearFacet, which SP1b implemented, tested, and
dispatched from nowhere.

A group holding a selection always starts open — ruling 17 one layer up: a
hidden selection is as unclearable as one counted out of its own group.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: A selection is never silently dropped

**Files:**
- Create: `atlas/src/components/OutsideFiltersNotice.tsx`
- Modify: `atlas/src/components/App.tsx`, `atlas/src/state/useFilters.ts`
- Test: `atlas/tests/selection-outside.test.tsx`

**Interfaces:**
- Consumes: `Selection`, `AtlasBundle`.
- Produces: `FilterAction` gains `{ type: 'dropUnknownSelection'; lang: boolean; init: boolean }`; `REPLACES` becomes a `Set<FilterAction['type']>`; `OutsideFiltersNotice({ kind, onClearFilters, onDeselect })`.

**Why:** today a selected initiative excluded by the current filters becomes a silent `null` — the panel vanishes and nothing accounts for it. That is the defect class recorded three times on this project: a change in one control invisibly deleting something in another.

- [ ] **Step 1: Write the failing test**

```tsx
// atlas/tests/selection-outside.test.tsx
// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../src/components/App.js'
import { loadBundle } from '../src/lib/load.js'

vi.mock('maplibre-gl', () => ({
  default: { Map: class { on(): void {} remove(): void {} } },
}))

afterEach(() => cleanup())
beforeEach(() => window.history.replaceState({}, '', '/'))

const bundle = loadBundle()

describe('a selected record the filters exclude', () => {
  it('still renders the panel, marked as outside the filters', () => {
    // fixture-adjacent is the only africa-region language; asr excludes its
    // one initiative, so the language is excluded from L1 by region+application.
    const lang = bundle.languages.find((l) => l.region === 'north-america')!
    window.history.replaceState({}, '', `/?lang=${lang.id}&region=africa`)
    render(<App />)
    expect(screen.getByTestId('outside-filters')).toBeDefined()
    // The panel is still rendered — assert the record is on the page rather
    // than guessing which element the panel uses for its title.
    expect(document.body.textContent).toContain(lang.name)
  })

  it('offers a way out that clears the filters and keeps the record', () => {
    const lang = bundle.languages.find((l) => l.region === 'north-america')!
    window.history.replaceState({}, '', `/?lang=${lang.id}&region=africa`)
    render(<App />)
    fireEvent.click(screen.getByTestId('outside-clear-filters'))
    expect(window.location.search).toBe(`?lang=${lang.id}`)
  })

  it('offers a way out that drops the selection and keeps the filters', () => {
    const lang = bundle.languages.find((l) => l.region === 'north-america')!
    window.history.replaceState({}, '', `/?lang=${lang.id}&region=africa`)
    render(<App />)
    fireEvent.click(screen.getByTestId('outside-deselect'))
    expect(window.location.search).toBe('?region=africa')
  })

  it('does the same for an initiative excluded by a work filter', () => {
    const init = bundle.initiatives.find((i) => i.applications.includes('mt'))!
    window.history.replaceState({}, '', `/?init=${init.id}&application=asr`)
    render(<App />)
    expect(screen.getByTestId('outside-filters')).toBeDefined()
    expect(document.body.textContent).toContain(init.name)
  })

  it('shows no notice when the selected record is inside the filters', () => {
    const lang = bundle.languages[0]!
    window.history.replaceState({}, '', `/?lang=${lang.id}`)
    render(<App />)
    expect(screen.queryByTestId('outside-filters')).toBeNull()
  })
})

describe('a selected id the bundle does not hold', () => {
  it('drops the key from the URL', () => {
    window.history.replaceState({}, '', '/?lang=not-a-language&region=africa')
    render(<App />)
    expect(window.location.search).toBe('?region=africa')
  })

  // SP1b rulings 8-10: a write the reader never asked for must not be
  // undoable, or Back walks them into the broken URL they just left.
  it('replaces rather than pushes, so Back does not return to it', () => {
    const push = vi.spyOn(window.history, 'pushState')
    window.history.replaceState({}, '', '/?init=nope')
    render(<App />)
    expect(window.location.search).toBe('')
    expect(push).not.toHaveBeenCalled()
    push.mockRestore()
  })
})
```

- [ ] **Step 2: Run the test and watch it fail**

```bash
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"
cd atlas && pnpm exec vitest run tests/selection-outside.test.tsx
```

Expected: FAIL — no `outside-filters` element; the unknown id is not dropped.

- [ ] **Step 3: Write the implementation**

```tsx
// atlas/src/components/OutsideFiltersNotice.tsx
/** A selected record the current filters exclude used to become a silent null:
 *  the panel simply vanished and nothing on the page accounted for it. The
 *  record still exists, so the page says so and offers both ways out. */
export default function OutsideFiltersNotice({
  kind, onClearFilters, onDeselect,
}: {
  kind: 'language' | 'initiative'
  onClearFilters: () => void
  onDeselect: () => void
}): React.JSX.Element {
  return (
    <p className="card notice" data-testid="outside-filters" role="status">
      This {kind} is outside your current filters. It is still in the atlas — the
      filters simply do not select it.{' '}
      <button type="button" className="link-button" data-testid="outside-clear-filters" onClick={onClearFilters}>
        Clear the filters
      </button>{' '}
      or{' '}
      <button type="button" className="link-button" data-testid="outside-deselect" onClick={onDeselect}>
        close this record
      </button>.
    </p>
  )
}
```

In `atlas/src/state/useFilters.ts`:

```ts
export type FilterAction =
  // ...existing...
  | { type: 'dropUnknownSelection'; lang: boolean; init: boolean }
```
```ts
    case 'dropUnknownSelection':
      return {
        ...state,
        lang: action.lang ? null : state.lang,
        init: action.init ? null : state.init,
      }
```
```ts
/** Actions whose URL write REPLACES rather than pushes. A range drag emits a
 *  stream of setRange actions and pushing each would bury the previous page.
 *  Dropping an unknown id is a correction the reader never asked for, so Back
 *  must not walk them into the broken URL they just left. */
const REPLACES = new Set<FilterAction['type']>(['setRange', 'dropUnknownSelection'])
```
and in the URL effect change the test to `if (lastAction.current === null || REPLACES.has(lastAction.current))`.

In `atlas/src/components/App.tsx`, replace the `language` / `initiative` derivation:

```tsx
  // Looked up in the BUNDLE, not the selection: a record the filters exclude
  // still exists, and the page has to be able to say so.
  const language = bundle.languages.find((l) => l.id === state.lang) ?? null
  const initiative = bundle.initiatives.find((i) => i.id === state.init) ?? null

  const languageInSelection =
    selection.languages.some((l) => l.id === state.lang) ||
    selection.filteredOut.some((l) => l.id === state.lang)
  const initiativeInSelection = selection.initiatives.some((i) => i.id === state.init)

  const outside: 'language' | 'initiative' | null =
    language !== null && !languageInSelection ? 'language'
    : initiative !== null && !initiativeInSelection ? 'initiative'
    : null

  // A stale or mistyped id names nothing. Degrading it away matches how the
  // codec already treats unknown keys and values.
  useEffect(() => {
    const lang = state.lang !== null && language === null
    const init = state.init !== null && initiative === null
    if (lang || init) dispatch({ type: 'dropUnknownSelection', lang, init })
  }, [state.lang, state.init, language, initiative, dispatch])
```

and render the notice immediately above the panels:

```tsx
        {outside !== null && (
          <OutsideFiltersNotice
            kind={outside}
            onClearFilters={() => dispatch({ type: 'clearAll' })}
            onDeselect={() =>
              dispatch(
                outside === 'language'
                  ? { type: 'selectLanguage', id: null }
                  : { type: 'selectInitiative', id: null },
              )
            }
          />
        )}
```

Add `useEffect` to the React import and import `OutsideFiltersNotice`.

- [ ] **Step 4: Run the whole suite and watch it pass**

```bash
cd atlas && pnpm test && pnpm typecheck
```

Expected: PASS. The existing `tests/selection.test.tsx` and `tests/panels.test.tsx` must keep passing.

- [ ] **Step 5: Mutation-check**

1. Look `language` up in `selection.languages` instead of `bundle.languages` → "still renders the panel, marked as outside" fails.
2. Remove `'dropUnknownSelection'` from `REPLACES` → "replaces rather than pushes" fails.
3. Delete the `useEffect` → "drops the key from the URL" fails.

- [ ] **Step 6: Commit**

```bash
git add src/components/ src/state/useFilters.ts tests/selection-outside.test.tsx
git commit -m "feat(atlas): never drop a selection silently

A selected record the filters exclude kept its panel and gains a marker with
both ways out. Previously it became a silent null: the panel vanished and
nothing accounted for it, which is the defect class this project has recorded
three times. An id the bundle does not hold is dropped with replaceState, so
Back does not return the reader to the broken URL.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: The fixture's honesty obligation, and the `_none` collision guard

**Files:**
- Modify: `atlas/src/fixtures/atlas.fixture.json`
- Test: `atlas/tests/fixture-coverage.test.ts`, and expected numbers in existing tests
- Test: `atlas/tests/facets.test.ts` (append the collision guard)

**Interfaces:** none. This task changes data and adds guards.

**Why:** the fixture is what the dev server, the demo build and every App-level test render. An honesty case it does not model is unrenderable and untestable end to end — which is how the undated-initiative rule went unexercised until SP1b's final review.

**Current state, already verified:** the fixture holds an undated initiative (`fixture-undated`), two languages with no centre (`fixture-unmapped`, `fixture-adjacent`), a conflicting speaker count (`fixture-conflict`), an adjacent-tier initiative with `transferability` (`fixture-adjacent-init`), an uncurated dimension (`endangerment` is null on all five languages), and a language with no matching work (`fixture-approximate`). **One case is missing:** no language has a null `family` or `region`, so no text column and no `_none` facet row for those dimensions has an end-to-end path.

- [ ] **Step 1: Write the failing test**

```ts
// atlas/tests/fixture-coverage.test.ts
import { describe, expect, it } from 'vitest'
import { loadBundle } from '../src/lib/load.js'

/** The fixture is a first-class artifact with an obligation: it is what the
 *  dev server, the demo build and every App-level test render, so each honesty
 *  case the spec turns on must have a record here or the case cannot be
 *  exercised end to end. Each assertion below names the case it protects. */
describe('the fixture models every honesty case', () => {
  const b = loadBundle()

  it('is the fixture, not a real bundle', () => {
    expect(b.isDemoData).toBe(true)
  })

  it('has an initiative with no start year (a date window must not delete it)', () => {
    expect(b.initiatives.some((i) => i.started === null)).toBe(true)
  })

  it('has a language with no centre (renders "not mapped")', () => {
    expect(b.languages.some((l) => l.centre === null)).toBe(true)
  })

  it('has a language whose centre is approximate (drawn differently)', () => {
    expect(b.languages.some((l) => l.centre?.confidence === 'approximate')).toBe(true)
  })

  it('has a speaker count its sources disagree about (renders the dagger)', () => {
    expect(b.languages.some((l) => (l.speakers?.conflicts.length ?? 0) > 0)).toBe(true)
  })

  it('has a language with family, region and endangerment all absent', () => {
    expect(
      b.languages.some((l) => l.family === null && l.region === null && l.endangerment === null),
    ).toBe(true)
  })

  it('has a dimension nothing is coded for (renders "not yet curated")', () => {
    expect(b.languages.every((l) => l.endangerment === null)).toBe(true)
  })

  it('has an adjacent-tier initiative carrying a transferability note', () => {
    expect(b.initiatives.some((i) => i.tier === 'adjacent' && i.transferability !== null)).toBe(true)
  })

  it('has a language with no matching work, so the coverage finding shows on first load', () => {
    const worked = new Set(b.initiatives.flatMap((i) => i.languages))
    expect(b.languages.some((l) => !worked.has(l.id))).toBe(true)
  })
})
```

Append to `atlas/tests/facets.test.ts`:

```ts
// The sentinel lives in the VALUE space, not the type system: `family` and
// `method` are free text, so '_none' and a family literally named '_none' are
// the same type and no branded type could tell them apart. The convention is
// enforced here, the way comma-safety already is.
describe('the not-recorded sentinel cannot collide', () => {
  it('is not a member of any vocabulary', () => {
    for (const vocab of Object.values(VOCAB_FOR)) {
      if (vocab !== undefined) expect(vocab).not.toContain(NOT_RECORDED)
    }
  })

  it('is not a value any record in the bundle carries', () => {
    const b = loadBundle()
    for (const f of LANGUAGE_FACETS) {
      for (const l of b.languages) expect(f.values(l)).not.toContain(NOT_RECORDED)
    }
    for (const f of INITIATIVE_FACETS) {
      for (const i of b.initiatives) expect(f.values(i)).not.toContain(NOT_RECORDED)
    }
  })
})
```

Add whatever imports that file still needs (`loadBundle`, `VOCAB_FOR`, `LANGUAGE_FACETS`, `INITIATIVE_FACETS`, `NOT_RECORDED`).

- [ ] **Step 2: Run the tests and watch them fail**

```bash
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"
cd atlas && pnpm exec vitest run tests/fixture-coverage.test.ts tests/facets.test.ts
```

Expected: FAIL on "has a language with family, region and endangerment all absent". Everything else should already pass — if any other case fails, the fixture regressed and that is the finding.

- [ ] **Step 3: Change the fixture**

In `atlas/src/fixtures/atlas.fixture.json`, on the `fixture-approximate` language only, set `"family": null` and `"region": null`. Change nothing else — do not add or remove records.

This deliberately does double duty: it is the missing "all absent" case, and it gives the `family` and `region` facets a non-zero `notRecorded`, so the `_none` checkbox has an end-to-end path it did not have before.

- [ ] **Step 4: Run the whole suite and repair the counts**

```bash
cd atlas && pnpm test
```

Existing tests that assert `family` or `region` facet counts will now fail. **Update the expected numbers to the new correct ones. Never loosen an assertion to make it pass** — if a test asserted `options.length === 1` and the honest new value is `1` with `notRecorded === 1`, say both.

```bash
cd atlas && pnpm test && pnpm typecheck
```

Expected: PASS.

- [ ] **Step 5: Mutation-check**

1. Revert `fixture-approximate`'s `family` to its old string → "has a language with family, region and endangerment all absent" fails.
2. Give one fixture language an `endangerment` → "has a dimension nothing is coded for" fails.
3. Add `"_none"` as a `family` on any fixture language → the collision guard fails.

Restore after each.

- [ ] **Step 6: Commit**

```bash
git add src/fixtures/atlas.fixture.json tests/
git commit -m "test(atlas): make the fixture prove it models every honesty case

The fixture is what the dev server, the demo build and every App-level test
render, so a case it does not model cannot be exercised end to end — which is
how the undated-initiative rule went unexercised until SP1b's final review.
One language loses its family and region, which is both the missing case and
the first end-to-end path for the _none sentinel on those dimensions.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 10: The browser regression harness

**Files:**
- Create: `atlas/playwright.config.ts`, `atlas/browser-tests/atlas.spec.ts`
- Modify: `atlas/package.json`, `atlas/.gitignore`
- Test: the harness is the test.

**Interfaces:** none consumed by other tasks.

**Why:** owed since SP1a and deferred twice. SP1a's two worst defects — a CSS Grid collapse and the fixture build leak — were both invisible to jsdom, and SP1c adds a new pane and a switch strip to that same grid.

**Two constraints that are not negotiable:**
- **It drives `vite dev`, not `vite preview`.** `vite preview` serves `dist/`, which `vite build` produces with `__ATLAS_ALLOW_FIXTURE__` baked in as `false`; with no `src/data/atlas.json` — the normal state — `chooseBundle` throws. No build-shaped artifact can render the fixture, which is SP1a's guard working as designed.
- **`vitest.config.ts` includes only `tests/**/*.test.ts(x)`,** so specs in `browser-tests/` are not swept into `pnpm test`. Do not widen that include.

- [ ] **Step 1: Install Playwright**

```bash
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"
cd atlas && pnpm add -D @playwright/test && pnpm exec playwright install chromium
```

**If pnpm reports ignored build scripts, do NOT run `pnpm approve-builds`** — it overwrites `atlas/pnpm-workspace.yaml` and breaks `pnpm test`. `pnpm exec playwright install chromium` downloads the browser explicitly and is all that is needed.

Verify the install did not disturb the workspace file:

```bash
git diff --stat pnpm-workspace.yaml
```

Expected: no output. If that file changed, restore it with `git checkout -- pnpm-workspace.yaml` and report it.

- [ ] **Step 2: Write the config and the script**

```ts
// atlas/playwright.config.ts
import { defineConfig } from '@playwright/test'

/** Drives `vite dev`, never `vite preview`: a built dist/ has
 *  __ATLAS_ALLOW_FIXTURE__ false and throws without a generated bundle, so the
 *  dev server is the only surface where this app has records to render. */
export default defineConfig({
  testDir: './browser-tests',
  fullyParallel: false,
  use: { baseURL: 'http://localhost:5174' },
  webServer: {
    command: 'pnpm dev --port 5174 --strictPort',
    url: 'http://localhost:5174',
    reuseExistingServer: false,
    timeout: 60_000,
  },
})
```

In `atlas/package.json`, add to `scripts`:

```json
    "test:browser": "playwright test",
```

Add to `atlas/.gitignore`:

```
test-results/
playwright-report/
```

- [ ] **Step 3: Write the harness**

```ts
// atlas/browser-tests/atlas.spec.ts
import { expect, test, type Page } from '@playwright/test'

/** Basemap tiles are the only network this page needs. Blocking them makes the
 *  harness deterministic and offline: MapLibre still renders our circles and
 *  pins from GeoJSON without a single tile. */
async function offline(page: Page): Promise<void> {
  await page.route('**://tiles.openfreemap.org/**', (r) => r.abort())
}

const paneBox = async (page: Page): Promise<{ width: number; height: number }> => {
  const box = await page.locator('.atlas__pane').boundingBox()
  expect(box).not.toBeNull()
  return { width: box!.width, height: box!.height }
}

test.beforeEach(async ({ page }) => { await offline(page) })

// SP1a's actual defect: the grid collapsed the map from 705px to 337px when
// the demo banner was absent, because a named area was missing from one of the
// two grid-template-areas blocks. Parameterised over both view modes.
for (const view of ['map', 'initiatives', 'languages']) {
  test(`the pane has real height in ${view} view`, async ({ page }) => {
    await page.goto(view === 'map' ? '/' : `/?view=${view}`)
    const { height } = await paneBox(page)
    expect(height).toBeGreaterThan(300)
  })
}

test('the body never scrolls horizontally, even with the widest table', async ({ page }) => {
  await page.goto('/?view=initiatives')
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)
})

test('the table scrolls inside its own pane rather than growing the page', async ({ page }) => {
  await page.goto('/?view=languages')
  const wrap = page.locator('.table-wrap')
  const [wrapH, paneH] = await Promise.all([
    wrap.evaluate((e) => e.getBoundingClientRect().height),
    page.locator('.atlas__pane').evaluate((e) => e.getBoundingClientRect().height),
  ])
  expect(wrapH).toBeLessThanOrEqual(paneH + 1)
})

test('the view switch does not wrap at a narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 380, height: 720 })
  await page.goto('/?view=initiatives')
  const heights = await page.locator('.view-switch button').evaluateAll(
    (els) => els.map((e) => e.getBoundingClientRect().top),
  )
  expect(new Set(heights).size).toBe(1)
})

// A named SP1b blind spot: nothing asserted the map actually repaints when a
// filter changes. A DIFFERENCE assertion, never a golden image — a golden
// would rot into flake on the first font or driver change.
test('the map repaints when a filter removes records', async ({ page }) => {
  await page.goto('/')
  const pane = page.locator('.atlas__pane')
  await expect(pane).toBeVisible()
  await page.waitForTimeout(1500)
  const before = await pane.screenshot()
  await page.goto('/?region=africa')
  await page.waitForTimeout(1500)
  const after = await pane.screenshot()
  expect(Buffer.compare(before, after)).not.toBe(0)
})

test('a table row is reachable and openable from the keyboard', async ({ page }) => {
  await page.goto('/?view=languages')
  const firstRowName = page.locator('tbody tr td:first-child button').first()
  await firstRowName.focus()
  await expect(firstRowName).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/lang=/)
})
```

- [ ] **Step 4: Run the harness and watch it pass**

```bash
cd atlas && pnpm test:browser
```

Expected: all pass. Then confirm the unit suite is untouched and still offline:

```bash
cd atlas && pnpm test
```

Expected: PASS, with no Playwright spec collected.

- [ ] **Step 5: Mutation-check the harness**

1. In `styles.css`, delete `pane` from the narrow-viewport `grid-template-areas` block → a "pane has real height" test fails. **This is the SP1a defect reproduced**; confirm it is caught, then restore.
2. Remove `min-height: 0` from `.table-wrap` → "the table scrolls inside its own pane" fails.
3. Change the repaint test's filter to `?region=north-america` (which removes nothing on the fixture) and confirm the difference assertion fails — proving it is testing repaint and not merely screenshotting twice. Restore.

- [ ] **Step 6: Commit**

```bash
git add playwright.config.ts browser-tests/ package.json pnpm-lock.yaml .gitignore
git commit -m "test(atlas): a browser harness for what jsdom cannot see

Owed since SP1a and deferred twice. Asserts the five things unit tests are
structurally blind to: the grid not collapsing in either view, no horizontal
page scroll, the table scrolling inside its pane, the switch not wrapping, and
the map genuinely repainting on a filter change.

Drives vite dev, not vite preview: a built dist/ has __ATLAS_ALLOW_FIXTURE__
false and throws without a generated bundle, so the dev server is the only
surface where this app has records. Kept out of pnpm test, which stays fast
and offline.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 11: The seam review

**Files:** none created. Findings are fixed in the files they belong to.

**Why this is a task and not a review step:** per-task review cannot catch the composition defect by construction, and this project is three for three on shipping one. Each instance was two individually-correct decisions in different tasks. A reviewer looking at either task alone had no cause to object.

- [ ] **Step 1: Write the seam table**

Produce a table with one row per pair of tasks sharing a file or an interface. At minimum:

| seam | what one side produces | what the other consumes | check |
| --- | --- | --- | --- |
| Task 4 ↔ Task 5 | `emptyState(selection)` | rail copy and `TableView`'s `emptyMessage` | do the two surfaces ever render contradictory sentences at the same time? Try `?region=africa&application=asr` in all three views. |
| Task 1 ↔ Task 5 | column `scope` | the caption's scope sentence | does every `scope: 'I1'` column have its scope stated where a reader sees the number? |
| Task 5 ↔ Task 5 | `TableContext.workCount` | the `work` column | is it built from `selection.initiatives` (I1) and not `bundle.initiatives`? A bundle-scoped count would make `0` mean something else entirely, and Task 5's own tests do not catch it. |
| Task 3 ↔ Task 6 | `setView` dropping an invalid sort | the URL effect | after switching tabs with a sort set, does the address bar match what the table shows? |
| Task 3 ↔ Task 8 | `REPLACES` as a set | `dropUnknownSelection` | does Back from a corrected URL return the reader to the broken one? |
| Task 7 ↔ Task 8 | `clearAll` from the outside-filters notice | `clearAll` preserving view and sort | does clearing filters from the notice keep the reader in the table? |
| Task 9 ↔ Tasks 1, 5 | the fixture's nulls | the table's "not recorded" | does a real fixture row render the words, in the running app? |

- [ ] **Step 2: Walk the running app**

```bash
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"
cd atlas && pnpm dev
```

Visit, and read what the page actually says at each:
- `/` — the map, no table.
- `/?view=languages` — is there a row with `matching work` 0 on first load?
- `/?view=languages&region=africa&application=asr` — does any surface deny the finding another is reporting?
- `/?view=initiatives&sort=speakers:desc` — does the URL correct itself without a history entry?
- `/?lang=<an id excluded by a filter you then apply>` — is the notice there?
- `/?view=languages&sort=work:asc` — are the zeroes at the top?

- [ ] **Step 3: Fix what the seams surfaced**

Fix each finding in the task's own files, with a test that fails without the fix. If a finding is real but out of scope, record it in the task report for the decision record rather than fixing it silently.

- [ ] **Step 4: Run everything**

```bash
cd atlas && pnpm test && pnpm typecheck && pnpm test:browser
```

Then confirm the two standing gates still hold:

```bash
cd atlas && pnpm build:data; echo "build:data exit: $?"
cd atlas && pnpm build:app; echo "build:app exit: $?"
```

Expected: both exit **non-zero**. `build:data` must still refuse while records are `draft`; `build:app` must still refuse without a real bundle. A zero here is a serious regression, not a convenience.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "fix(atlas): findings from the SP1c seam review

Per-task review cannot catch a defect made of two individually-correct
decisions in different tasks; this project has shipped three. The seam table
and the walk-through are in the task report.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```
