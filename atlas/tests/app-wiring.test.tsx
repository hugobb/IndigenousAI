// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'

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

/** Every prop `App` computes needs a test that fails when it is replaced by a
 *  constant. Five mutations used to leave the whole suite green — App was the
 *  one module with no test of its own wiring, and it is the module that decides
 *  what every other one is shown. Each test below names the mutation it kills. */
describe('what App actually wires up', () => {
  // MUTATION: `languages={languageFields([...selection.languages,
  // ...selection.filteredOut])}` — the union of L1 instead of L2.
  //
  // This is spec F1's other half. A language with no matching work is demoted
  // to the rail, and it must NOT stay on the map: a pin says "work happens
  // here", and drawing one for a language the current filter found no work for
  // states the opposite of the finding. `?region=africa` cannot catch this —
  // its `filteredOut` is empty, so the two expressions are equal. `?application=asr`
  // splits them: one language survives, four are demoted, and two of those four
  // carry a centre and would therefore appear as extra pins.
  it('gives the map only the languages with matching work, never the demoted ones', () => {
    at('/?application=asr')
    expect(screen.getByTestId('map-language-ids').textContent).toBe('fixture-sourced')

    // Proves the assertion above is doing work: a demoted language that HAS a
    // centre is on the rail and off the map at the same moment.
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

  it('heads no group with a zero when that group is empty', () => {
    at('/?region=africa&application=asr')
    expect(screen.queryByTestId('group-not-mapped')).toBeNull()
    expect(screen.queryByTestId('group-approximate')).toBeNull()
    expect(screen.getByTestId('group-filtered-out')).toBeDefined()
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
