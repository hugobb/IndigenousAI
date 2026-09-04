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
