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
  //
  // EMPTY_FILTERS never populates `filteredOut` (no work facet is active), so
  // asserting against `selection.filteredOut.length` there is trivially true
  // even if the languages tab dropped `filteredOut` from `rows` entirely — a
  // mutation check on the original assertion alone did not fail. This test
  // instead constructs a selection where `filteredOut` is non-empty and
  // disjoint from `languages`, so dropping either half changes the row count
  // AND the set of ids rendered.
  it('shows L1 in the languages tab, including languages with no matching work', () => {
    const kept = bundle.languages[0]!
    const dropped = bundle.languages[1]!
    render(
      <TableView
        view="languages"
        selection={{ languages: [kept], initiatives: [], filteredOut: [dropped], undatedInitiatives: 0 }}
        bundle={bundle} sort={null} onSort={() => {}} selectedId={null} onSelect={() => {}}
      />,
    )
    expect(screen.getAllByTestId(/^row-/).length).toBe(2)
    expect(screen.getByTestId(`row-${kept.id}`)).toBeDefined()
    expect(screen.getByTestId(`row-${dropped.id}`)).toBeDefined()
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

  // Mutation check 5 (task-5-brief Step 5): `workCount` must be built from
  // `selection.initiatives`, not `bundle.initiatives`. Neither the row-count
  // test above nor the caption tests read a cell's actual number, so a
  // `workCount` counting the whole bundle instead of the current selection
  // passed every other test in this file. This test pins the value: the
  // fixture's `fixture-sourced` language has one initiative in the FULL
  // bundle, but the selection handed to TableView here has none, so the
  // "Matching work" cell for it must read 0, not 1.
  it('scopes the matching-work count to the current selection, not the whole bundle', () => {
    const lang = bundle.languages.find((l) => l.id === 'fixture-sourced')
    if (lang === undefined) throw new Error('fixture missing fixture-sourced')
    render(
      <TableView
        view="languages"
        selection={{ languages: [lang], initiatives: [], filteredOut: [], undatedInitiatives: 0 }}
        bundle={bundle} sort={null} onSort={() => {}} selectedId={null} onSelect={() => {}}
      />,
    )
    const headers = screen.getAllByRole('columnheader').map((h) => h.textContent)
    const workIndex = headers.findIndex((h) => h === 'Matching work')
    expect(workIndex).toBeGreaterThanOrEqual(0)
    const row = screen.getByTestId(`row-${lang.id}`)
    const cell = within(row).getAllByRole('cell')[workIndex]
    expect(cell?.textContent).toBe('0')
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
