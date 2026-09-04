// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { loadBundle } from '../src/lib/load.js'

// Same substitution as `filter-map-seam.test.tsx`, one step more specific: the
// feature IDS are exposed, not just their count, so a test can say WHICH
// languages reached the map rather than only how many.
vi.mock('../src/components/MapView.js', () => ({
  default: (p: {
    languages: { features: { id: string }[] }
    initiatives: { features: { id: string }[] }
  }) => (
    <div>
      <span data-testid="map-language-ids">{p.languages.features.map((f) => f.id).join(' ')}</span>
      <span data-testid="map-initiative-ids">
        {p.initiatives.features.map((f) => f.id).join(' ')}
      </span>
    </div>
  ),
}))

const { default: App } = await import('../src/components/App.js')

afterEach(() => cleanup())

const at = (search: string): void => {
  window.history.replaceState({}, '', search)
  render(<App />)
}

// Same fixture the rest of this file renders against — derived, not
// hardcoded, so a later task that changes the fixture does not need to hunt
// down a magic id string here.
const bundle = loadBundle()

/** Every prop `App` computes needs a test that fails when it is replaced by a
 *  constant. Five mutations used to leave the whole suite green — App was the
 *  one module with no test of its own wiring, and it is the module that decides
 *  what every other one is shown. Each test below names the mutation it kills. */
describe('what App actually wires up', () => {
  // REVERSED BY TASK 1 (ruling C2). This test previously asserted the
  // opposite: that a work filter deletes a workless language from the map.
  // That is the asymmetry `noMatchingWork` exists to remove — the same
  // language, with the same absence of work, was drawn under a language
  // filter and erased under a work filter, so the map and the rail disagreed
  // about it depending on which control the reader touched. The map now draws
  // L1 in every filter state: a language is labelled, never deleted.
  //
  // MUTATION this still kills: `languages={languageFields(
  //   selection.languages.filter((l) => !selection.noMatchingWork.includes(l)))}`
  // — the old L2 map. `?region=africa` cannot catch that (its `noMatchingWork`
  // would be the whole list); `?application=asr` splits them: fixture-sourced
  // keeps its work, the other four do not, and two of those four carry a
  // centre and must still be drawn.
  it('gives the map every L1 language with a centre, including the workless ones', () => {
    at('/?application=asr')
    const ids = (screen.getByTestId('map-language-ids').textContent ?? '').split(' ')
    // Derived, not hardcoded: L1 under a work filter is every language in the
    // bundle, and `languageFields` draws exactly the ones with a centre.
    expect(ids).toEqual(bundle.languages.filter((l) => l.centre !== null).map((l) => l.id))
    // The point of the ruling: a language the rail names as having no matching
    // work is on the rail and ON the map at the same moment.
    expect(ids).toContain('fixture-approximate')
    const group = screen.getByTestId('group-filtered-out')
    expect(group.textContent).toMatch(/Approximate Centre Language/)
  })

  // MUTATION: delete the `<Timeline />` element, keeping `.atlas__timeline`.
  // The container is placed by the grid and would still satisfy the chrome
  // tests, which assert on the pane, not on what is inside it.
  it('renders the timeline itself, not just the pane that holds it', () => {
    at('/')
    const pane = document.querySelector('.atlas__timeline')
    expect(pane).not.toBeNull()
    expect(within(pane as HTMLElement).getByTestId('timeline-window').textContent)
      .toMatch(/\d{4}–\d{4}/)
  })

  // MUTATION: `onToggle={() => {}}`. Every FacetPanel test hands the panel its
  // own spy, so none of them notices that App drops the callback on the floor.
  it('turns a facet click into filter state and into the URL', () => {
    at('/')
    const box = screen.getByLabelText(/north-america/i) as HTMLInputElement
    expect(box.checked).toBe(false)
    fireEvent.click(box)
    expect((screen.getByLabelText(/north-america/i) as HTMLInputElement).checked).toBe(true)
    expect(window.location.search).toContain('region=north-america')
  })

  // MUTATION: `onClearAll={() => {}}`.
  it('clears every filter from the state and the URL when Clear all is pressed', () => {
    at('/?region=africa')
    fireEvent.click(screen.getByTestId('clear-all'))
    expect(window.location.search).not.toContain('region')
    expect(screen.queryByTestId('clear-all')).toBeNull()
  })

  // MUTATION: `onClearFacet` dispatching `clearAll` instead of `clearFacet` —
  // both regions and application would vanish instead of only region.
  it('clearing one group clears only that group', () => {
    window.history.replaceState({}, '', '/?region=africa&application=mt')
    render(<App />)
    fireEvent.click(screen.getByTestId('facet-clear-region'))
    expect(window.location.search).toBe('?application=mt')
  })

  // MUTATION: `undatedCount={0}`. The Timeline's own tests pass the number in
  // directly, so they say nothing about whether App ever computes it.
  it('tells the timeline how many initiatives it cannot constrain', () => {
    at('/')
    const undated = screen.getByTestId('timeline-undated')
    expect(undated.textContent).toMatch(/1 initiative/)
    expect(undated.textContent).toMatch(/no start year/)
  })
})

describe('the rail under a filter that finds no work', () => {
  // The reproduction: the rail rendered "Nothing matches the current filters."
  // ABOVE "Matches your filters, but no matching work (1)". A false denial on
  // top of the true finding.
  it('does not deny a result it is about to report', () => {
    at('/?region=africa&application=asr')
    expect(screen.queryByTestId('empty-result')).toBeNull()
    const said = screen.getByTestId('no-matching-work')
    expect(said.textContent).toMatch(/No initiative matches/i)
    expect(said.textContent).toMatch(/1 language/)
    expect(screen.getByTestId('group-filtered-out').textContent).toMatch(/Adjacent Language/)
  })

  it('still says nothing matched when nothing did, filtered-out included', () => {
    // No language is `arctic`, so L1 is empty and there is nothing to demote.
    at('/?region=arctic')
    expect(screen.getByTestId('empty-result').textContent).toMatch(/Nothing matches/i)
    expect(screen.queryByTestId('no-matching-work')).toBeNull()
  })

  // The URL this used to assert on was `?region=africa&application=asr`, where
  // the old L2 `languages` was empty and so both mapping groups were. L1 keeps
  // fixture-adjacent now, and it has no centre, so "Not mapped" is legitimately
  // non-empty there — the state no longer exercises suppression. `?region=africa`
  // alone reaches it instead: fixture-adjacent is the only L1 language, it has
  // no centre (so "Not mapped" is the one group with content), and its own
  // initiative survives (so "no matching work" is genuinely empty).
  it('heads no group with a zero when that group is empty', () => {
    at('/?region=africa')
    expect(screen.getByTestId('group-not-mapped')).toBeDefined()
    expect(screen.queryByTestId('group-approximate')).toBeNull()
    expect(screen.queryByTestId('group-filtered-out')).toBeNull()
  })
})

describe('the timeline as a filter', () => {
  // It filters in `applyFilters` and occupies two URL keys, so a reader who has
  // constrained only the date has one filter on — and needs the one control
  // that turns it off.
  it('offers Clear all when the date window is the only thing constrained', () => {
    at('/?from=2018')
    expect(screen.getByTestId('clear-all').textContent).toContain('1')
  })

  it('clears the date window along with everything else', () => {
    at('/?from=2018')
    fireEvent.click(screen.getByTestId('clear-all'))
    expect(window.location.search).not.toContain('from=')
    expect(screen.queryByTestId('clear-all')).toBeNull()
  })

  it('counts the window once, not once per bound', () => {
    at('/?from=2017&to=2018')
    expect(screen.getByTestId('clear-all').textContent).toContain('1')
  })
})

describe('the masthead snapshot line', () => {
  // It exists so a citation can name the data behind a filtered view. A
  // machine timestamp with milliseconds and a trailing Z is not that.
  it('names the snapshot as a plain date', () => {
    at('/')
    const text = screen.getByTestId('data-version').textContent ?? ''
    expect(text).toMatch(/Data snapshot: \d{4}-\d{2}-\d{2}$/)
    expect(text).not.toMatch(/T\d{2}:\d{2}/)
    expect(text).not.toMatch(/Z/)
  })
})

describe('view wiring', () => {
  const renderAt = (search: string): ReturnType<typeof render> => {
    window.history.replaceState({}, '', `/${search}`)
    return render(<App />)
  }

  it('renders the map pane by default and no table', () => {
    renderAt('')
    expect(screen.queryByRole('table')).toBeNull()
    expect(screen.getByTestId('view-map').getAttribute('aria-pressed')).toBe('true')
  })

  // Important 4 (whole-branch review): narrowing `counts.languages` to the
  // languages WITH matching work — after this task, subtracting
  // `selection.noMatchingWork.length` — makes the view-switch strip read
  // "Languages (1)" above a five-row table captioned "(5)": two numbers for
  // one thing on one screen, counting the coverage-gap languages OUT of the
  // very tab that exists to show them. The count is now a single term, so the
  // mutation is the subtraction rather than dropping an addend; the failure it
  // produces is the same. Uses the same `?application=asr` fixture scenario as
  // the map test above (one language keeps matching work, four do not but
  // still render as table rows).
  it('counts the workless languages in the Languages tab total, not just the ones with matching work', () => {
    at('/?view=languages&application=asr')
    const rows = screen.getAllByTestId(/^row-/).length
    expect(rows).toBeGreaterThan(1)
    const label = screen.getByTestId('view-languages').textContent ?? ''
    expect(label).toContain(`(${rows})`)
  })

  // Correction to the brief: the brief's version of this test asserted
  // `queryByTestId('map-container')` is null — no such test id exists anywhere
  // in this component tree, so the assertion would pass vacuously no matter
  // what App rendered. `MapView` is mocked wholesale at the top of this file
  // and its mock exposes `map-language-ids` instead; that id disappearing is
  // what actually proves the map was swapped out for the table.
  it('renders the table instead of the map at ?view=initiatives', () => {
    renderAt('?view=initiatives')
    expect(screen.getByRole('table')).toBeDefined()
    expect(screen.queryByTestId('map-language-ids')).toBeNull()
  })

  it('switching the view rewrites the URL', () => {
    renderAt('')
    fireEvent.click(screen.getByTestId('view-languages'))
    expect(window.location.search).toBe('?view=languages')
  })

  // Constant-substitution guards. Each fails if App passes a literal instead
  // of the value it computes.
  it('passes the live row counts to the switch, not a constant', () => {
    renderAt('?application=asr')
    const withFilter = screen.getByTestId('view-initiatives').textContent
    cleanup()
    renderAt('')
    expect(screen.getByTestId('view-initiatives').textContent).not.toBe(withFilter)
  })

  it('passes the URL sort down to the table, not a constant', () => {
    renderAt('?view=languages&sort=name:desc')
    const headers = screen.getAllByRole('columnheader')
    expect(headers[0]!.getAttribute('aria-sort')).toBe('descending')
  })

  it('sorting from the table writes the sort to the URL', () => {
    renderAt('?view=languages')
    fireEvent.click(screen.getByRole('button', { name: /^family$/i }))
    expect(window.location.search).toContain('sort=family%3Aasc')
  })

  it('selecting a table row opens that record, not a constant one', () => {
    renderAt('?view=languages')
    const first = screen.getAllByTestId(/^row-/)[0]!
    const name = within(first).getAllByRole('button')[0]!
    fireEvent.click(name)
    expect(window.location.search).toMatch(/lang=/)
  })

  it('feeds the table the filtered selection, not the whole bundle', () => {
    renderAt('?view=initiatives&application=asr')
    const filtered = screen.getAllByTestId(/^row-/).length
    cleanup()
    renderAt('?view=initiatives')
    expect(screen.getAllByTestId(/^row-/).length).toBeGreaterThan(filtered)
  })

  // MUTATION: `selectedId={null}`, or `selectedId={state.lang}` unconditionally
  // (which passes the languages case below while silently breaking this one).
  // `state.view === 'languages' ? state.lang : state.init` reads a different
  // URL key per branch, so both branches need their own row-level assertion —
  // a test of only one leaves the other substitutable.
  it('marks the row named by the URL as selected on the languages tab, not a constant one', () => {
    const lang = bundle.languages[0]!
    renderAt(`?view=languages&lang=${lang.id}`)
    const rows = screen.getAllByTestId(/^row-/)
    expect(rows.length).toBeGreaterThan(1)
    const selected = screen.getByTestId(`row-${lang.id}`)
    expect(selected.getAttribute('aria-current')).toBe('true')
    for (const row of rows) {
      if (row !== selected) expect(row.getAttribute('aria-current')).toBeNull()
    }
  })

  // MUTATION: `selectedId={state.init}` unconditionally — passes this case
  // while silently breaking the languages one above.
  it('marks the row named by the URL as selected on the initiatives tab, not a constant one', () => {
    const init = bundle.initiatives[0]!
    renderAt(`?view=initiatives&init=${init.id}`)
    const rows = screen.getAllByTestId(/^row-/)
    expect(rows.length).toBeGreaterThan(1)
    const selected = screen.getByTestId(`row-${init.id}`)
    expect(selected.getAttribute('aria-current')).toBe('true')
    for (const row of rows) {
      if (row !== selected) expect(row.getAttribute('aria-current')).toBeNull()
    }
  })
})
