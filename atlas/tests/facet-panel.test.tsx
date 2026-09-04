// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import FacetPanel from '../src/components/FacetPanel.js'
import type { FacetSummary } from '../src/lib/filters.js'

afterEach(() => cleanup())

const summary = (over: Partial<FacetSummary>): FacetSummary => ({
  id: 'region', label: 'Region', options: [{ value: 'africa', count: 2 }],
  notRecorded: 0, notRecordedTotal: 0, curated: true, selected: [], ...over,
})

const panel = (summaries: FacetSummary[], onToggle = vi.fn()) => {
  render(
    <FacetPanel
      summaries={summaries}
      activeCount={summaries.reduce((n, s) => n + s.selected.length, 0)}
      onToggle={onToggle}
      onClearAll={vi.fn()}
      onClearFacet={vi.fn()}
    />,
  )
  return onToggle
}

describe('FacetPanel', () => {
  it('shows each option with its count', () => {
    panel([summary({})])
    expect(screen.getByLabelText(/africa/i)).toBeDefined()
    expect(screen.getByTestId('facet-region').textContent).toContain('2')
  })

  it('reports a toggled option', () => {
    const onToggle = panel([summary({})])
    fireEvent.click(screen.getByLabelText(/africa/i))
    expect(onToggle).toHaveBeenCalledWith('region', 'africa')
  })

  it('checks an option that is already selected', () => {
    panel([summary({ selected: ['africa'] })])
    expect((screen.getByLabelText(/africa/i) as HTMLInputElement).checked).toBe(true)
  })

  it('offers "not recorded" as a real option when some records lack the field', () => {
    panel([summary({ notRecorded: 3 })])
    expect(screen.getByLabelText(/not recorded/i)).toBeDefined()
  })

  it('does not offer "not recorded" when every record has a value', () => {
    panel([summary({ notRecorded: 0 })])
    expect(screen.queryByLabelText(/not recorded/i)).toBeNull()
  })

  // Spec F4: the curation gap is a finding, and must not look like an empty filter.
  it('renders an uncurated facet as a statement, with no checkboxes', () => {
    panel([summary({ id: 'typology', label: 'Typology', curated: false, options: [], notRecorded: 5, notRecordedTotal: 5 })])
    const group = screen.getByTestId('facet-typology')
    expect(group.textContent).toMatch(/not yet curated/i)
    expect(group.textContent).toContain('5')
    expect(group.querySelectorAll('input')).toHaveLength(0)
  })

  it('distinguishes an uncurated facet from a curated one with nothing selected', () => {
    panel([
      summary({ id: 'typology', label: 'Typology', curated: false, options: [], notRecorded: 5, notRecordedTotal: 5 }),
      summary({ id: 'region', curated: true, selected: [] }),
    ])
    expect(screen.getByTestId('facet-typology').textContent).toMatch(/not yet curated/i)
    expect(screen.getByTestId('facet-region').textContent).not.toMatch(/not yet curated/i)
  })

  it('shows a type-to-narrow box only once a group grows past the threshold', () => {
    const many = Array.from({ length: 13 }, (_, i) => ({ value: `m${i}`, count: 1 }))
    panel([summary({ id: 'method', label: 'Method', options: many })])
    expect(screen.getByTestId('facet-filter-method')).toBeDefined()
  })

  it('narrows the visible options as you type', () => {
    const many = Array.from({ length: 13 }, (_, i) => ({ value: `alpha${i}`, count: 1 }))
    many.push({ value: 'beta', count: 1 })
    panel([summary({ id: 'method', label: 'Method', options: many })])
    fireEvent.change(screen.getByTestId('facet-filter-method'), { target: { value: 'beta' } })
    expect(screen.getByLabelText(/beta/i)).toBeDefined()
    expect(screen.queryByLabelText(/alpha0/i)).toBeNull()
  })

  it('has no type-to-narrow box for a small group', () => {
    panel([summary({})])
    expect(screen.queryByTestId('facet-filter-region')).toBeNull()
  })

  it('offers clear-all only when something is selected', () => {
    panel([summary({ selected: ['africa'] })])
    expect(screen.getByTestId('clear-all').textContent).toContain('1')
  })

  it('hides clear-all when nothing is selected', () => {
    panel([summary({})])
    expect(screen.queryByTestId('clear-all')).toBeNull()
  })

  it('treats a curated facet with no visible options as filtered, not as uncurated', () => {
    panel([summary({ id: 'typology', label: 'Typology', curated: true, options: [], notRecorded: 4 })])
    const group = screen.getByTestId('facet-typology')
    expect(group.textContent).not.toMatch(/not yet curated/i)
    expect(screen.getByLabelText(/not recorded/i)).toBeDefined()
  })

  // `summary.options` is the pool with THIS facet cleared but the others
  // applied, so a selection can be counted out of its own list. The group then
  // advertises a "(1)" that the reader can neither see nor untick.
  it('renders a selected value the pool no longer holds, still checked, at count 0', () => {
    panel([summary({
      id: 'application', label: 'Application',
      options: [{ value: 'mt', count: 1 }], selected: ['asr'],
    })])
    const box = screen.getByLabelText(/asr/i) as HTMLInputElement
    expect(box.checked).toBe(true)
    const row = box.closest('li')
    expect(row?.textContent).toContain('0')
  })

  it('lets a selected value that fell out of its pool be unticked', () => {
    const onToggle = panel([summary({
      id: 'application', label: 'Application', options: [], selected: ['asr'],
    })])
    fireEvent.click(screen.getByLabelText(/asr/i))
    expect(onToggle).toHaveBeenCalledWith('application', 'asr')
  })

  it('keeps the "not recorded" row when it is selected but the pool holds none', () => {
    panel([summary({ notRecorded: 0, selected: ['_none'] })])
    const box = screen.getByLabelText(/not recorded/i) as HTMLInputElement
    expect(box.checked).toBe(true)
  })

  // A cited `?typology=_none` against an uncurated Typology showed
  // "Clear all (1)" with no visible selection anywhere on the page.
  it('renders a selection inside an uncurated group so it can be removed', () => {
    const onToggle = panel([summary({
      id: 'typology', label: 'Typology', curated: false, options: [],
      notRecorded: 0, notRecordedTotal: 9, selected: ['_none'],
    })])
    const group = screen.getByTestId('facet-typology')
    expect(group.textContent).toMatch(/not yet curated/i)
    const box = screen.getByLabelText(/not recorded/i) as HTMLInputElement
    expect(box.checked).toBe(true)
    fireEvent.click(box)
    expect(onToggle).toHaveBeenCalledWith('typology', '_none')
  })

  it('does not narrow a selected value away as you type', () => {
    const many = Array.from({ length: 13 }, (_, i) => ({ value: `alpha${i}`, count: 1 }))
    panel([summary({ id: 'method', label: 'Method', options: many, selected: ['zulu-method'] })])
    fireEvent.change(screen.getByTestId('facet-filter-method'), { target: { value: 'alpha0' } })
    expect(screen.getByLabelText(/zulu-method/i)).toBeDefined()
  })

  // Spec F4 again, from the other side: "curated but empty" was a bare label
  // above nothing, which reads as a rendering fault rather than a filter result.
  it('says so when a curated group has nothing to offer under the current filters', () => {
    panel([summary({ id: 'method', label: 'Method', curated: true, options: [], notRecorded: 0 })])
    const group = screen.getByTestId('facet-method')
    expect(group.textContent).toMatch(/no values in the current selection/i)
    expect(group.textContent).not.toMatch(/not yet curated/i)
  })

  it('does not say "no values" when there is still a "not recorded" row to tick', () => {
    panel([summary({ id: 'method', label: 'Method', curated: true, options: [], notRecorded: 4 })])
    expect(screen.getByTestId('facet-method').textContent)
      .not.toMatch(/no values in the current selection/i)
  })

  // The sentence claims the DIMENSION is uncurated, so its number must be the
  // dataset's. Taking it from the filtered pool made `?region=oceania` read
  // "Not yet curated (1 record)".
  it('counts "not yet curated" against the whole dataset, not the filtered pool', () => {
    panel([summary({
      id: 'typology', label: 'Typology', curated: false, options: [],
      notRecorded: 1, notRecordedTotal: 42,
    })])
    const group = screen.getByTestId('facet-typology')
    expect(group.textContent).toContain('42')
    expect(group.textContent).toMatch(/42 records/)
  })
})
