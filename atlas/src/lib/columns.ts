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
