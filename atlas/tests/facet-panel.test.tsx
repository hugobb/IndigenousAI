// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import FacetPanel from '../src/components/FacetPanel.js'
import type { FacetSummary } from '../src/lib/filters.js'

afterEach(() => cleanup())

const summary = (over: Partial<FacetSummary>): FacetSummary => ({
  id: 'region', label: 'Region', options: [{ value: 'africa', count: 2 }],
  notRecorded: 0, curated: true, selected: [], ...over,
})

const panel = (summaries: FacetSummary[], onToggle = vi.fn()) => {
  render(
    <FacetPanel
      summaries={summaries}
      activeCount={summaries.reduce((n, s) => n + s.selected.length, 0)}
      onToggle={onToggle}
      onClearAll={vi.fn()}
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
    panel([summary({ id: 'typology', label: 'Typology', curated: false, options: [], notRecorded: 5 })])
    const group = screen.getByTestId('facet-typology')
    expect(group.textContent).toMatch(/not yet curated/i)
    expect(group.textContent).toContain('5')
    expect(group.querySelectorAll('input')).toHaveLength(0)
  })

  it('distinguishes an uncurated facet from a curated one with nothing selected', () => {
    panel([
      summary({ id: 'typology', label: 'Typology', curated: false, options: [], notRecorded: 5 }),
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
})
