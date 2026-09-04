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

/** The order `sortRows` produces when `sort` is null — it falls through to the
 *  name tiebreak, so the rows on screen ARE name-ascending. Exported because
 *  the header row has to announce that: with `aria-sort="none"` everywhere a
 *  screen reader was told the table was unsorted while it visibly was not, and
 *  the first click on `Name` asked for the order already showing, so the
 *  control did nothing. Kept out of the URL: `sort` carries only what the
 *  citer chose (§3), and this is the default, not a choice. */
export const DEFAULT_SORT: SortState = { column: 'name', direction: 'asc' }

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
    // A YEAR, not a quantity. `Cell.kind: 'number'` is rendered through
    // `toLocaleString`, which is right for speaker counts and wrong here: it
    // printed `2,016` in the table while `InitiativePanel` printed `2016` on
    // the same screen. Only this module knows which numbers have magnitude,
    // so the distinction is made here rather than in the renderer. Sorting
    // stays numeric — `sortValue` is untouched.
    id: 'started', header: 'Started', scope: 'record',
    cell: (i) => ({ kind: 'text', value: i.started === null ? null : String(i.started), sub: null }),
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
