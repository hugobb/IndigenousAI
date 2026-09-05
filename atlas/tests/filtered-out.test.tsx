// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import UnmappedList from '../src/components/UnmappedList.js'
import { LanguageSchema } from '../src/schema/index.js'

afterEach(() => cleanup())

const src = { kind: 'doc' as const, ref: 't', retrieved: null, quote: null }
const lang = (id: string, over: Record<string, unknown> = {}) =>
  LanguageSchema.parse({
    id, name: id, tier: 'indigenous', typology: [], endangerment: null, speakers: null,
    region: null, centre: { lat: 1, lon: 2, source: src, confidence: 'sourced' },
    caveat: null, status: 'verified', ...over,
  })

describe('the no-matching-work group', () => {
  it('is absent when the filter removed nothing', () => {
    render(
      <UnmappedList languages={[lang('a')]} noMatchingWork={[]} workFiltered={true} onSelect={vi.fn()} />,
    )
    expect(screen.queryByTestId('group-no-matching-work')).toBeNull()
  })

  // Spec F1: filtering to ASR must not make Choctaw disappear — it must make
  // Choctaw say it has no ASR work.
  it('names each language that matched but has no matching work', () => {
    render(
      <UnmappedList
        languages={[lang('a')]} noMatchingWork={[lang('choctaw')]}
        workFiltered={true} onSelect={vi.fn()}
      />,
    )
    const group = screen.getByTestId('group-no-matching-work')
    expect(group.textContent).toContain('choctaw')
    expect(group.textContent).toContain('1')
  })

  it('keeps a filtered-out language selectable', () => {
    const onSelect = vi.fn()
    render(
      <UnmappedList
        languages={[]} noMatchingWork={[lang('choctaw')]}
        workFiltered={true} onSelect={onSelect}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /choctaw/i }))
    expect(onSelect).toHaveBeenCalledWith('choctaw')
  })

  it('still shows the two groups it had before', () => {
    render(
      <UnmappedList
        languages={[
          lang('nocentre', { centre: null }),
          lang('rough', { centre: { lat: 1, lon: 2, source: src, confidence: 'approximate' } }),
        ]}
        noMatchingWork={[]} workFiltered={true} onSelect={vi.fn()}
      />,
    )
    expect(screen.getByTestId('group-not-mapped')).toBeDefined()
    expect(screen.getByTestId('group-approximate')).toBeDefined()
  })

  // A zero-count heading is not information, and at
  // `?region=africa&application=asr` two of them stacked above the group that
  // carried the actual finding.
  it('suppresses a group that has nothing in it rather than heading it with a zero', () => {
    render(
      <UnmappedList
        languages={[lang('mapped')]}
        noMatchingWork={[lang('choctaw')]} workFiltered={true} onSelect={vi.fn()}
      />,
    )
    expect(screen.queryByTestId('group-not-mapped')).toBeNull()
    expect(screen.queryByTestId('group-approximate')).toBeNull()
    expect(screen.getByTestId('group-no-matching-work')).toBeDefined()
  })
})

describe('the workless group states what it can', () => {
  const workless = lang('choctaw')

  it('names it a filter result when a work filter is active', () => {
    render(
      <UnmappedList languages={[workless]} noMatchingWork={[workless]}
        workFiltered={true} onSelect={vi.fn()} />,
    )
    const group = screen.getByTestId('group-no-matching-work')
    expect(group.textContent).toMatch(/matches your filters, but no matching work/i)
    expect(group.textContent).not.toMatch(/no work in the atlas/i)
  })

  // Without a work filter the claim is about the DATASET, not the query.
  it('names it a dataset finding when no work filter is active', () => {
    render(
      <UnmappedList languages={[workless]} noMatchingWork={[workless]}
        workFiltered={false} onSelect={vi.fn()} />,
    )
    const group = screen.getByTestId('group-no-matching-work')
    expect(group.textContent).toMatch(/no work in the atlas/i)
    expect(group.textContent).not.toMatch(/matches your filters/i)
  })

  // Seam review (Task 8). The workless group used to live INSIDE the card
  // headed "What the map cannot show". That was right while `filteredOut` was
  // the complement of `languages` — such a language had been removed from the
  // map. Task 1 made `noMatchingWork` a SUBSET of `languages`, and App draws
  // all of `languages`, so this card was naming languages the map was
  // simultaneously drawing. `drawn` has a sourced centre precisely so that
  // contradiction is what fails here.
  it('states the work gap outside the card that says what the map cannot show', () => {
    const drawn = lang('drawn')
    render(
      <UnmappedList languages={[drawn]} noMatchingWork={[drawn]}
        workFiltered={false} onSelect={vi.fn()} />,
    )
    const card = screen.getByTestId('group-no-matching-work').closest('section')
    expect(card).not.toBeNull()
    expect(card!.getAttribute('aria-label')).not.toMatch(/map cannot show/i)
    // And the map card is not merely mis-titled but absent: nothing here is
    // unmappable, so there is no such finding to head.
    expect(screen.queryByLabelText(/map cannot show/i)).toBeNull()
  })

  // `?region=arctic` rendered "WHAT THE MAP CANNOT SHOW" over nothing at all —
  // a heading with no content reads as a rendering bug, which is the same
  // judgment `FacetGroup` already makes about a bare label.
  it('renders no card at all when it has nothing to report', () => {
    const { container } = render(
      <UnmappedList languages={[lang('drawn')]} noMatchingWork={[]}
        workFiltered={false} onSelect={vi.fn()} />,
    )
    expect(container.querySelectorAll('section').length).toBe(0)
  })

  // Both facts are true and both are stated. Suppressing either to avoid
  // repeating a name would hide a finding.
  it('names a language that is BOTH unmapped and workless in both groups', () => {
    const both = lang('unmapped-and-workless', { centre: null })
    render(
      <UnmappedList languages={[both]} noMatchingWork={[both]}
        workFiltered={false} onSelect={vi.fn()} />,
    )
    expect(screen.getByTestId('group-not-mapped').textContent).toContain(both.name)
    expect(screen.getByTestId('group-no-matching-work').textContent).toContain(both.name)
  })
})
