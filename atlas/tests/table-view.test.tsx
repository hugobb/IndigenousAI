// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import TableView from '../src/components/TableView.js'
import { INITIATIVE_COLUMNS, LANGUAGE_COLUMNS } from '../src/lib/columns.js'
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
  // `selection.languages` IS L1 now, so the row set is that list verbatim.
  // The selection here names one workless language among the two, so a
  // languages tab that filtered its rows down to the ones WITH matching work
  // would render one row instead of two.
  it('shows L1 in the languages tab, including languages with no matching work', () => {
    const kept = bundle.languages[0]!
    const workless = bundle.languages[1]!
    render(
      <TableView
        view="languages"
        selection={{
          languages: [kept, workless], initiatives: [], noMatchingWork: [workless],
          undatedInitiatives: 0, workFiltered: true, languageFiltered: false,
        }}
        bundle={bundle} sort={null} onSort={() => {}} selectedId={null} onSelect={() => {}}
      />,
    )
    expect(screen.getAllByTestId(/^row-/).length).toBe(2)
    expect(screen.getByTestId(`row-${kept.id}`)).toBeDefined()
    expect(screen.getByTestId(`row-${workless.id}`)).toBeDefined()
  })

  // A bare "0" invites the reading "no work exists". The caption is the only
  // place that difference can be stated, and it is in the same DOM as the rows.
  //
  // Fix round 2: this test used to assert the WORK-FILTERED wording
  // (/every current filter/, /not.*no work/) against `view('languages')`,
  // whose module-level `selection` is built from `EMPTY_FILTERS` — zero
  // filters, `workFiltered: false`. That locked in the wrong branch: with no
  // work filter active, `workCount` is scoped to every initiative in the
  // atlas, so 0 there really DOES mean no work exists, and the caption must
  // say so rather than deny it. Re-pointed at the branch this call actually
  // renders; the other branch gets its own test below. Change of intent, not
  // a relaxation — the previous assertion was simply asserting the wrong
  // fact for this URL.
  it('states the scope of the matching-work count in the caption when no work filter is active', () => {
    view('languages')
    const caption = screen.getByTestId('table-caption').textContent ?? ''
    expect(caption).toMatch(/matching work/i)
    expect(caption).toMatch(/every initiative in the atlas/i)
    expect(caption).not.toMatch(/every current filter/i)
    expect(caption).not.toMatch(/not.*no work/i)
  })

  // The state the old assertion actually described: a work filter narrows
  // `workCount`, so 0 there is a filter result, not a dataset fact — the
  // caption must deny "no work exists" in exactly this case.
  it('states the scope of the matching-work count in the caption when a work filter is active', () => {
    render(
      <TableView
        view="languages"
        selection={{
          languages: selection.languages, initiatives: [], noMatchingWork: selection.languages,
          undatedInitiatives: 0, workFiltered: true, languageFiltered: true,
        }}
        bundle={bundle} sort={null} onSort={() => {}} selectedId={null} onSelect={() => {}}
      />,
    )
    const caption = screen.getByTestId('table-caption').textContent ?? ''
    expect(caption).toMatch(/matching work/i)
    expect(caption).toMatch(/every current filter/i)
    expect(caption).toMatch(/not.*no work/i)
    expect(caption).not.toMatch(/every initiative in the atlas/i)
  })

  // Seam review (Task 8). The caption opened "Languages matching the current
  // language filters (n)" in EVERY state, including the one this table is most
  // often read in: a work filter alone, where L1 is the whole atlas and no
  // language filter exists. Third surface of the same false credit; the rail
  // hint and the App banner are the other two, and all three now read one flag.
  it('does not credit a language filter in the caption when none is set', () => {
    view('languages')
    const caption = screen.getByTestId('table-caption').textContent ?? ''
    expect(caption).toMatch(/every language in the atlas/i)
    expect(caption).not.toMatch(/current language filters/i)
  })

  it('names the language filter in the caption when one is set', () => {
    render(
      <TableView
        view="languages"
        selection={{
          languages: selection.languages, initiatives: selection.initiatives,
          noMatchingWork: [], undatedInitiatives: 0,
          workFiltered: false, languageFiltered: true,
        }}
        bundle={bundle} sort={null} onSort={() => {}} selectedId={null} onSelect={() => {}}
      />,
    )
    const caption = screen.getByTestId('table-caption').textContent ?? ''
    expect(caption).toMatch(/current language filters/i)
    expect(caption).not.toMatch(/every language in the atlas/i)
  })

  it('explains the conflict dagger in the caption', () => {
    view('languages')
    expect(screen.getByTestId('table-caption').textContent).toMatch(/disagree/i)
  })

  // Minor 3 (review round 1): the initiatives caption was entirely
  // unasserted — blanking it to a single space passed every other test in
  // this file. "including the date window" is the initiatives-tab analogue
  // of the languages tab's scope sentence, which was already guarded.
  it('states the scope of the initiatives caption', () => {
    view('initiatives')
    const caption = screen.getByTestId('table-caption').textContent ?? ''
    expect(caption).toMatch(/initiatives matching the current filters/i)
    expect(caption).toMatch(/including the date window/i)
  })

  it('resolves initiative language ids to names', () => {
    view('initiatives')
    const names = bundle.languages.map((l) => l.name)
    const body = screen.getByRole('table').textContent ?? ''
    expect(names.some((n) => body.includes(n))).toBe(true)
  })

  // Minor 4 (review round 1): the dagger was only ever exercised through
  // DataTable's synthetic fixture, never through TableView against real
  // fixture data. `fixture-conflict` has a non-empty `speakers.conflicts` in
  // atlas.fixture.json, so its row must carry the dagger here too.
  it('renders the conflict dagger for a real fixture language through TableView', () => {
    const lang = bundle.languages.find((l) => l.id === 'fixture-conflict')
    if (lang === undefined) throw new Error('fixture missing fixture-conflict')
    render(
      <TableView
        view="languages"
        selection={{ languages: [lang], initiatives: [], noMatchingWork: [], undatedInitiatives: 0, workFiltered: false, languageFiltered: false }}
        bundle={bundle} sort={null} onSort={() => {}} selectedId={null} onSelect={() => {}}
      />,
    )
    expect(within(screen.getByTestId(`row-${lang.id}`)).getByText('†')).toBeDefined()
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
        selection={{ languages: [lang], initiatives: [], noMatchingWork: [], undatedInitiatives: 0, workFiltered: false, languageFiltered: false }}
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

  // Important 3 (whole-branch review): the caption's own `(n)` was
  // unguarded — every test above reads OTHER sentences in the caption, or
  // the row count separately, but nothing ties the two together. Swapping
  // `rows.length` for `bundle.initiatives.length` in TableView.tsx prints a
  // bundle-scoped count over I1 rows, the exact scope violation the caption
  // exists to prevent, and every other test here still passes.
  it('states the initiatives caption count as the rows actually rendered, not the whole bundle', () => {
    const only = bundle.initiatives[0]!
    render(
      <TableView
        view="initiatives"
        selection={{ languages: [], initiatives: [only], noMatchingWork: [], undatedInitiatives: 0, workFiltered: false, languageFiltered: false }}
        bundle={bundle} sort={null} onSort={() => {}} selectedId={null} onSelect={() => {}}
      />,
    )
    expect(bundle.initiatives.length).toBeGreaterThan(1)
    const rows = screen.getAllByTestId(/^row-/).length
    expect(rows).toBe(1)
    const caption = screen.getByTestId('table-caption').textContent ?? ''
    expect(caption).toContain(`(${rows})`)
    expect(caption).not.toContain(`(${bundle.initiatives.length})`)
  })

  // Same hole on the languages side: substituting a bundle-wide count for the
  // rows this table actually renders (L1) passes just as silently.
  it('states the languages caption count as the rows actually rendered (L1), not the bundle', () => {
    const kept = bundle.languages[0]!
    const workless = bundle.languages[1]!
    render(
      <TableView
        view="languages"
        selection={{
          languages: [kept, workless], initiatives: [], noMatchingWork: [workless],
          undatedInitiatives: 0, workFiltered: true, languageFiltered: false,
        }}
        bundle={bundle} sort={null} onSort={() => {}} selectedId={null} onSelect={() => {}}
      />,
    )
    expect(bundle.languages.length).toBeGreaterThan(2)
    const rows = screen.getAllByTestId(/^row-/).length
    expect(rows).toBe(2)
    const caption = screen.getByTestId('table-caption').textContent ?? ''
    expect(caption).toContain(`(${rows})`)
    expect(caption).not.toContain(`(${bundle.languages.length})`)
  })

  // `noMatchingWork` is a subset of `languages`, so the state this describes is
  // now written with the language present in BOTH lists — `languages: []` with
  // a non-empty second list is unconstructable, and would read `nothing-matched`.
  it('renders the shared empty-state sentence when no work matches', () => {
    render(
      <TableView
        view="initiatives"
        selection={{
          languages: [bundle.languages[0]!], initiatives: [],
          noMatchingWork: [bundle.languages[0]!], undatedInitiatives: 0, workFiltered: true, languageFiltered: false,
        }}
        bundle={bundle} sort={null} onSort={() => {}} selectedId={null} onSelect={() => {}}
      />,
    )
    expect(screen.getByTestId('table-empty').textContent).toMatch(/no matching work/i)
  })

  // Fix round 1: the sentence above used to be static, and so claimed a
  // filter was responsible even with none active. It now follows
  // `selection.workFiltered`, the same signal the rail and App banner
  // already use for this exact fact.
  describe('the no-work-but-languages message follows the filter state', () => {
    const selWith = (workFiltered: boolean) => ({
      languages: [bundle.languages[0]!], initiatives: [],
      noMatchingWork: [bundle.languages[0]!], undatedInitiatives: 0, workFiltered, languageFiltered: false,
    })

    it('names it a filter result when a work filter is active', () => {
      render(
        <TableView
          view="initiatives" selection={selWith(true)} bundle={bundle} sort={null}
          onSort={() => {}} selectedId={null} onSelect={() => {}}
        />,
      )
      const text = screen.getByTestId('table-empty').textContent ?? ''
      expect(text).toMatch(/no initiative matches the current filters/i)
      expect(text).not.toMatch(/records no initiative/i)
    })

    // Without a work filter, a zero-row initiatives table is a dataset fact,
    // not a query result — the same distinction Task 2 already drew for the
    // rail and the App empty-state banner.
    it('names it a dataset finding when no work filter is active', () => {
      render(
        <TableView
          view="initiatives" selection={selWith(false)} bundle={bundle} sort={null}
          onSort={() => {}} selectedId={null} onSelect={() => {}}
        />,
      )
      const text = screen.getByTestId('table-empty').textContent ?? ''
      expect(text).toMatch(/records no initiative/i)
      expect(text).not.toMatch(/no initiative matches the current filters/i)
    })
  })

  // Important 1 (review round 1): the `matched`-but-empty ruling in
  // TableView had no guard at all — reverting `matched:` back to `null` in
  // EMPTY_COPY passed every test in this file. The state it was built on
  // (languages present, initiatives empty) now reads `no-work-but-languages`
  // rather than `matched`, because `emptyState` no longer needs a non-empty
  // second list to say so. `matched` with zero rows in THIS table is still
  // reachable, on the other tab: work survives while the language list is
  // empty, so the languages table has nothing to show and a null message
  // would render bare column headers over nothing.
  it('renders a message rather than bare headers when matched but this table has no rows', () => {
    render(
      <TableView
        view="languages"
        selection={{
          languages: [], initiatives: [bundle.initiatives[0]!], noMatchingWork: [],
          undatedInitiatives: 0, workFiltered: false, languageFiltered: false,
        }}
        bundle={bundle} sort={null} onSort={() => {}} selectedId={null} onSelect={() => {}}
      />,
    )
    expect(screen.queryAllByTestId(/^row-/).length).toBe(0)
    expect(screen.getByTestId('table-empty').textContent?.trim()).not.toBe('')
  })

  // Seam review (Task 11). Every column carries a declared `scope`, and the
  // caption is the only place a non-`record` scope reaches a reader. Only
  // `work` (I1) had that sentence; `languages` is `scope: 'bundle'` — it names
  // every language an initiative works on, filters included — while the
  // caption beside it claimed "Every column reflects all current filters".
  // Driven off the declarations rather than hardcoded, so adding a scoped
  // column without stating it fails here instead of shipping a false caption.
  it.each([
    ['initiatives' as const, INITIATIVE_COLUMNS as { id: string; header: string; scope: string }[]],
    ['languages' as const, LANGUAGE_COLUMNS as { id: string; header: string; scope: string }[]],
  ])('states every non-record column scope in the %s caption', (v, columns) => {
    view(v)
    const caption = screen.getByTestId('table-caption').textContent ?? ''
    const scoped = columns.filter((c) => c.scope !== 'record')
    expect(scoped.length).toBeGreaterThan(0)
    for (const c of scoped) expect(caption).toContain(c.header)
  })

  // The defect this caught was visible on screen and in no test: `started` is
  // a year, and `DataTable` renders `kind: 'number'` through `toLocaleString`,
  // so the table printed `2,016` beside an `InitiativePanel` printing `2016`.
  // Asserted through the rendered cell, not the Cell descriptor, because the
  // grouping happens in the renderer.
  it('prints a year without a thousands separator', () => {
    const dated = bundle.initiatives.find((i) => i.started !== null)
    if (dated === undefined) throw new Error('fixture has no dated initiative')
    render(
      <TableView
        view="initiatives"
        selection={{ languages: [], initiatives: [dated], noMatchingWork: [], undatedInitiatives: 0, workFiltered: false, languageFiltered: false }}
        bundle={bundle} sort={null} onSort={() => {}} selectedId={null} onSelect={() => {}}
      />,
    )
    const row = screen.getByTestId(`row-${dated.id}`)
    expect(row.textContent).toContain(String(dated.started))
    expect(row.textContent).not.toContain(dated.started!.toLocaleString('en'))
  })
})
