import { useMemo } from 'react'
import { INITIATIVE_COLUMNS, LANGUAGE_COLUMNS, type SortState, type TableContext } from '../lib/columns.js'
import { emptyState, type Selection } from '../lib/filters.js'
import type { AtlasBundle } from '../lib/load.js'
import type { Initiative, Language } from '../schema/index.js'
import DataTable from './DataTable.js'

// Ruling (Task 5): `DataTable` must never receive a null `emptyMessage`. The
// `matched` state is reachable with zero rows in THIS table — a language-only
// filter with no work facet active leaves `filteredOut: []` and
// `initiatives: []`, so the shared predicate reports `matched` while the
// initiatives table has nothing to show. A null message there renders bare
// column headers over nothing, which reads as a rendering bug, not a finding.
// `emptyState` still answers "did anything match"; stating this table's own
// row count is not re-deriving that.
const EMPTY_COPY = {
  'nothing-matched': 'Nothing matches the current filters.',
  'no-work-but-languages':
    'No initiative matches the current filters. The languages that matched are listed in the Languages view and in the rail — no matching work is a finding, not an empty result.',
  matched: 'Nothing in this view matches the current filters.',
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
        // Every column with a scope other than `record` states that scope
        // here, in the same DOM as the rows. “Languages” is declared
        // `scope: 'bundle'` in columns.ts — it lists every language the
        // initiative names, filters included — so the blanket sentence
        // that used to stand alone contradicted the column beside it.
        caption={`Initiatives matching the current filters (${rows.length}). Every column reflects all current filters, including the date window — except “Languages”, which names every language the initiative works on, including any your filters exclude.`}
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
