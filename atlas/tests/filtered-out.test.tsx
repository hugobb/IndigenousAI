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
      <UnmappedList languages={[lang('a')]} noMatchingWork={[]} workFiltered={true} languageFiltered={false} noLanguagePapers={[]} languageNotMappedPapers={[]} onSelect={vi.fn()} />,
    )
    expect(screen.queryByTestId('group-no-matching-work')).toBeNull()
  })

  // Spec F1: filtering to ASR must not make Choctaw disappear — it must make
  // Choctaw say it has no ASR work.
  it('names each language that matched but has no matching work', () => {
    render(
      <UnmappedList
        languages={[lang('a')]} noMatchingWork={[lang('choctaw')]}
        workFiltered={true} languageFiltered={false} noLanguagePapers={[]} languageNotMappedPapers={[]} onSelect={vi.fn()}
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
        workFiltered={true} languageFiltered={false} noLanguagePapers={[]} languageNotMappedPapers={[]} onSelect={onSelect}
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
        noMatchingWork={[]} workFiltered={true} languageFiltered={false} noLanguagePapers={[]} languageNotMappedPapers={[]} onSelect={vi.fn()}
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
        noMatchingWork={[lang('choctaw')]} workFiltered={true} languageFiltered={false} noLanguagePapers={[]} languageNotMappedPapers={[]} onSelect={vi.fn()}
      />,
    )
    expect(screen.queryByTestId('group-not-mapped')).toBeNull()
    expect(screen.queryByTestId('group-approximate')).toBeNull()
    expect(screen.getByTestId('group-no-matching-work')).toBeDefined()
  })
})

describe('the workless group states what it can', () => {
  const workless = lang('choctaw')

  // Final review, finding 1: re-pointed rather than relaxed. This test's intent
  // is "a work filter is responsible", and the heading that says so is the one
  // for a list a LANGUAGE filter also narrowed — `languageFiltered={false}` is
  // now a third state with its own heading, tested below. Both assertions are
  // as strong as before and one is stronger (it names the whole heading).
  it('names it a filter result when a work filter is active', () => {
    render(
      <UnmappedList languages={[workless]} noMatchingWork={[workless]}
        workFiltered={true} languageFiltered={true} noLanguagePapers={[]} languageNotMappedPapers={[]} onSelect={vi.fn()} />,
    )
    const group = screen.getByTestId('group-no-matching-work')
    expect(group.textContent).toMatch(/matches your filters, but no matching work/i)
    expect(group.textContent).not.toMatch(/no work in the atlas/i)
  })

  // The third state, which had no heading of its own and so borrowed the one
  // above: the work filter is responsible, but nothing selected the languages.
  it('does not say the languages matched anything when no language filter is set', () => {
    render(
      <UnmappedList languages={[workless]} noMatchingWork={[workless]}
        workFiltered={true} languageFiltered={false} noLanguagePapers={[]} languageNotMappedPapers={[]} onSelect={vi.fn()} />,
    )
    const heading = screen.getByRole('heading', { level: 3 }).textContent ?? ''
    expect(heading).toMatch(/in the atlas, but no matching work/i)
    expect(heading).not.toMatch(/matches your filters/i)
    expect(heading).not.toMatch(/no work in the atlas for these languages/i)
  })

  // The heading and the hint are one sentence pair, and the defect they hid was
  // that each was pinned separately: two guards, each right about its own
  // string, locking a contradiction in place between them. This reads BOTH, in
  // all three states, and asserts they credit the same filters.
  it.each([
    [false, false, /no work in the atlas for these languages/i, /no initiative anywhere in this atlas/i],
    [true, true, /matches your filters, but no matching work/i, /these languages match your language filters/i],
    [true, false, /in the atlas, but no matching work/i, /no language filter is narrowing this list/i],
  ])(
    'heads the group with a claim its own hint supports (work=%s, language=%s)',
    (workFiltered, languageFiltered, headingPattern, hintPattern) => {
      const { container } = render(
        <UnmappedList languages={[workless]} noMatchingWork={[workless]}
          workFiltered={workFiltered} languageFiltered={languageFiltered} noLanguagePapers={[]} languageNotMappedPapers={[]} onSelect={vi.fn()} />,
      )
      const heading = screen.getByRole('heading', { level: 3 }).textContent ?? ''
      const hint = container.querySelector('.hint')?.textContent ?? ''
      expect(heading).toMatch(headingPattern)
      expect(hint).toMatch(hintPattern)
      // The contradiction itself, stated directly: a heading crediting the
      // reader's filters with selecting these languages cannot stand over a
      // hint saying no language filter narrowed them.
      const creditsFilters = /matches your filters, but no matching work/i.test(heading)
      const deniesLanguageFilter = /no language filter is narrowing/i.test(hint)
      expect(creditsFilters && deniesLanguageFilter).toBe(false)
    },
  )

  // Without a work filter the claim is about the DATASET, not the query.
  it('names it a dataset finding when no work filter is active', () => {
    render(
      <UnmappedList languages={[workless]} noMatchingWork={[workless]}
        workFiltered={false} languageFiltered={false} noLanguagePapers={[]} languageNotMappedPapers={[]} onSelect={vi.fn()} />,
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
        workFiltered={false} languageFiltered={false} noLanguagePapers={[]} languageNotMappedPapers={[]} onSelect={vi.fn()} />,
    )
    const card = screen.getByTestId('group-no-matching-work').closest('section')
    expect(card).not.toBeNull()
    expect(card!.getAttribute('aria-label')).not.toMatch(/map cannot show/i)
    // And the map card is not merely mis-titled but absent: nothing here is
    // unmappable, so there is no such finding to head.
    expect(screen.queryByLabelText(/map cannot show/i)).toBeNull()
  })

  // Final review, finding 4. An approximately located language IS drawn, only
  // desaturated, so the map card's claim is only true with the adverb its own
  // accessible name has always carried — and the visible label dropped it.
  // Asserted on BOTH, because the defect was that they disagreed.
  it('qualifies the map card, since an approximately located language is drawn', () => {
    render(
      <UnmappedList
        languages={[lang('rough', { centre: { lat: 1, lon: 2, source: src, confidence: 'approximate' } })]}
        noMatchingWork={[]} workFiltered={false} languageFiltered={false} noLanguagePapers={[]} languageNotMappedPapers={[]} onSelect={vi.fn()} />,
    )
    const card = screen.getByTestId('group-approximate').closest('section')!
    expect(card.querySelector('.section-label')?.textContent).toMatch(/cannot show faithfully/i)
    expect(card.getAttribute('aria-label')).toMatch(/cannot show faithfully/i)
  })

  // `?region=arctic` rendered "WHAT THE MAP CANNOT SHOW" over nothing at all —
  // a heading with no content reads as a rendering bug, which is the same
  // judgment `FacetGroup` already makes about a bare label.
  it('renders no card at all when it has nothing to report', () => {
    const { container } = render(
      <UnmappedList languages={[lang('drawn')]} noMatchingWork={[]}
        workFiltered={false} languageFiltered={false} noLanguagePapers={[]} languageNotMappedPapers={[]} onSelect={vi.fn()} />,
    )
    expect(container.querySelectorAll('section').length).toBe(0)
  })

  // Seam review (Task 8). The hint said "These languages match your language
  // filters" whenever a WORK filter was active — the state that populates this
  // group most often, and the one where L1 is the whole atlas because no
  // language facet is set at all.
  it('does not credit a language filter in the hint when none is set', () => {
    const workless = lang('choctaw')
    render(
      <UnmappedList languages={[workless]} noMatchingWork={[workless]}
        workFiltered={true} languageFiltered={false} noLanguagePapers={[]} languageNotMappedPapers={[]} onSelect={vi.fn()} />,
    )
    const group = screen.getByTestId('group-no-matching-work').textContent ?? ''
    expect(group).toMatch(/no language filter is narrowing/i)
    expect(group).not.toMatch(/match your language filters/i)
  })

  it('names the language filter in the hint when one is set', () => {
    const workless = lang('choctaw')
    render(
      <UnmappedList languages={[workless]} noMatchingWork={[workless]}
        workFiltered={true} languageFiltered={true} noLanguagePapers={[]} languageNotMappedPapers={[]} onSelect={vi.fn()} />,
    )
    const group = screen.getByTestId('group-no-matching-work').textContent ?? ''
    expect(group).toMatch(/match your language filters/i)
    expect(group).not.toMatch(/no language filter is narrowing/i)
  })

  // Both facts are true and both are stated. Suppressing either to avoid
  // repeating a name would hide a finding.
  it('names a language that is BOTH unmapped and workless in both groups', () => {
    const both = lang('unmapped-and-workless', { centre: null })
    render(
      <UnmappedList languages={[both]} noMatchingWork={[both]}
        workFiltered={false} languageFiltered={false} noLanguagePapers={[]} languageNotMappedPapers={[]} onSelect={vi.fn()} />,
    )
    expect(screen.getByTestId('group-not-mapped').textContent).toContain(both.name)
    expect(screen.getByTestId('group-no-matching-work').textContent).toContain(both.name)
  })
})
