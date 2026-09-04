// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import DataTable from '../src/components/DataTable.js'
import type { Column, TableContext } from '../src/lib/columns.js'

afterEach(() => cleanup())

interface Row { id: string; name: string; n: number | null; note: string | null }
const ctx: TableContext = { languageName: (id) => id, workCount: () => 0 }
const COLUMNS: Column<Row>[] = [
  { id: 'name', header: 'Name', scope: 'record',
    cell: (r) => ({ kind: 'text', value: r.name, sub: null }), sortValue: (r) => r.name },
  { id: 'n', header: 'N', scope: 'record',
    cell: (r) => ({ kind: 'number', value: r.n, marker: r.n === 9600 ? '†' : null }),
    sortValue: (r) => r.n },
  { id: 'tags', header: 'Tags', scope: 'record', cell: () => ({ kind: 'list', values: [] }) },
  // A nullable TEXT column (as opposed to `name`, whose value is never null in
  // this fixture, and `n`/`tags`, whose null branches are `number`/`list`).
  // Without this, the `text` branch of null-handling in `renderCell` has no
  // row that exercises it, and swapping its `<NotRecorded />` for `''` passes
  // every test in this file.
  { id: 'note', header: 'Note', scope: 'record', cell: (r) => ({ kind: 'text', value: r.note, sub: null }) },
]
// A third row (c, n: 100) is deliberate: with only 'a' (9600) and 'b' (null),
// declaration order already equals ascending order (the lone defined value
// stays put, null sorts last either way) — a `sortRows` call replaced with a
// no-op `rows` pass-through would still satisfy "actually orders the rows it
// is given" below. With a second defined value smaller than 'a's, ascending
// order must swap 'a' and 'c', which only a real sort produces.
const rows: Row[] = [
  { id: 'a', name: 'Anishinaabemowin', n: 9600, note: 'has a note' },
  { id: 'b', name: 'Blackfoot', n: null, note: null },
  { id: 'c', name: 'Cree', n: 100, note: 'has a note' },
]

const table = (over: Partial<React.ComponentProps<typeof DataTable<Row>>> = {}) =>
  render(
    <DataTable<Row>
      caption="Some rows (3)." columns={COLUMNS} rows={rows} sort={null}
      onSort={() => {}} selectedId={null} onSelect={() => {}} ctx={ctx} emptyMessage={null}
      {...over}
    />,
  )

describe('DataTable', () => {
  it('renders a real table with a caption and column headers', () => {
    table()
    expect(screen.getByRole('table')).toBeDefined()
    expect(screen.getByText('Some rows (3).')).toBeDefined()
    expect(screen.getAllByRole('columnheader').map((h) => h.textContent))
      .toEqual(['Name', 'N', 'Tags', 'Note'])
  })

  it('renders an absent value as the words "not recorded", never a blank cell', () => {
    table()
    const row = screen.getByTestId('row-b')
    // Three null cells: n (number), tags (list, empty) and note (text) — all
    // three Cell kinds' null branches, not just number and list.
    expect(within(row).getAllByText(/not recorded/i).length).toBe(3)
  })

  it('renders a conflict marker next to a disputed number', () => {
    table()
    expect(within(screen.getByTestId('row-a')).getByText('†')).toBeDefined()
  })

  // Important 2 (review round 1): clicking one row and asserting that row's
  // id lets `onSelect` be implemented as a constant `'b'` and still pass.
  // Click two different rows and assert each call distinctly.
  it('selects a row through its name button', () => {
    const onSelect = vi.fn()
    table({ onSelect })
    fireEvent.click(screen.getByRole('button', { name: /blackfoot/i }))
    expect(onSelect).toHaveBeenLastCalledWith('b')
    fireEvent.click(screen.getByRole('button', { name: /^cree$/i }))
    expect(onSelect).toHaveBeenLastCalledWith('c')
    expect(onSelect).toHaveBeenCalledTimes(2)
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

  // Seam review (Task 11). `sortRows` breaks every tie on `name`, so a null
  // `sort` renders name-ascending rows — while every header announced
  // `aria-sort="none"` and the first click on `Name` asked for the order
  // already on screen, a control that did nothing. The header row announces
  // and toggles against the EFFECTIVE order, not the URL key.
  it('announces the default name-ascending order rather than claiming none', () => {
    table()
    const [name, n] = screen.getAllByRole('columnheader')
    expect(name!.getAttribute('aria-sort')).toBe('ascending')
    expect(n!.getAttribute('aria-sort')).toBe('none')
  })

  it('reverses the default order on the first click of the name header', () => {
    const onSort = vi.fn()
    table({ onSort })
    fireEvent.click(screen.getByRole('button', { name: /^name$/i }))
    expect(onSort).toHaveBeenCalledWith({ column: 'name', direction: 'desc' })
  })

  // The guard on the guard, and it took a mutation to get right: the first
  // version of it rendered a column set with NO name column and asserted every
  // header read `none` — which is true whether or not the default is announced
  // at all, because no header matches `name` either way. It survived the exact
  // mutation it was written to catch. This one instead ties the ANNOUNCEMENT to
  // the ORDER: the header claiming a direction must be the column the rows are
  // actually in, so flipping `DEFAULT_SORT.direction` — announcing a descending
  // sort over ascending rows — fails here.
  it('announces the direction the rows are actually in', () => {
    table()
    const [name] = screen.getAllByRole('columnheader')
    const announced = name!.getAttribute('aria-sort')
    const shown = screen.getAllByTestId(/^row-/).map((r) => r.getAttribute('data-testid'))
    const ascending = [...rows]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((r) => `row-${r.id}`)
    expect(shown).toEqual(ascending)
    expect(announced).toBe('ascending')
  })

  it('gives an unsortable column no header button', () => {
    table()
    expect(screen.queryByRole('button', { name: /^tags$/i })).toBeNull()
  })

  it('actually orders the rows it is given', () => {
    table({ sort: { column: 'n', direction: 'asc' } })
    // n: null sorts last whatever the direction, so Blackfoot is below both
    // defined values — and Cree (100) must move ahead of Anishinaabemowin
    // (9600), which only happens if the rows were genuinely re-sorted rather
    // than passed through in declaration order.
    expect(screen.getAllByTestId(/^row-/).map((r) => r.getAttribute('data-testid')))
      .toEqual(['row-c', 'row-a', 'row-b'])
  })

  it('states why the body is empty instead of showing bare headers', () => {
    table({ rows: [], emptyMessage: 'No initiative matches the current filters.' })
    expect(screen.getByTestId('table-empty').textContent)
      .toMatch(/no initiative matches the current filters/i)
  })
})
