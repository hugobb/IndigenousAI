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

  // The mount-time initialiser only runs once: `FacetGroup` is keyed by a
  // stable `summary.id` and never remounts, so a selection that ARRIVES via a
  // prop update (e.g. `useFilters` replaying `fromUrl` on `popstate`, which
  // Back/Forward triggers) must open the same instance, not merely a fresh
  // one. Starting from a mounted, long, UNSELECTED (collapsed) group and
  // rerendering it with a selection is what distinguishes this from the
  // "starts OPEN" mount test above.
  it('opens when a selection arrives on an already-mounted, collapsed group', () => {
    const { rerender } = render(
      <FacetGroup summary={summary({ options: many })} onToggle={() => {}} onClearFacet={() => {}} />,
    )
    expect(screen.getByTestId('facet-toggle-region').getAttribute('aria-expanded')).toBe('false')
    rerender(
      <FacetGroup summary={summary({ options: many, selected: ['v03'] })}
        onToggle={() => {}} onClearFacet={() => {}} />,
    )
    expect(screen.getByTestId('facet-toggle-region').getAttribute('aria-expanded')).toBe('true')
  })

  // A reader who deliberately collapses a group that already holds a
  // selection must stay collapsed — the fix for the mount-only bug above must
  // not become "always force open whenever selected.length > 0".
  it('keeps a group closed when the reader collapses it manually, selection and all', () => {
    render(
      <FacetGroup summary={summary({ selected: ['africa'] })} onToggle={() => {}} onClearFacet={() => {}} />,
    )
    const toggle = screen.getByTestId('facet-toggle-region')
    expect(toggle.getAttribute('aria-expanded')).toBe('true')
    fireEvent.click(toggle)
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
  })

  // Every table view renders the facet rail alongside a sortable table, and
  // several facets share a label with a sortable column (Region, Family,
  // Endangerment, Data regime, Governance). Without a distinguishing
  // accessible name, a screen-reader user hears two identically-named
  // buttons that do different things.
  it('gives the toggle an accessible name that will not collide with a same-named control elsewhere on the page', () => {
    render(<FacetGroup summary={summary()} onToggle={() => {}} onClearFacet={() => {}} />)
    expect(screen.getByRole('button', { name: /toggle region filters/i }))
      .toBe(screen.getByTestId('facet-toggle-region'))
  })
})
