// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { act } from 'react'
import { EMPTY_FILTERS } from '../src/lib/url-state.js'
import { filterReducer, useFilters, type FilterAction } from '../src/state/useFilters.js'

// Testing Library sets IS_REACT_ACT_ENVIRONMENT around its own render/fireEvent
// calls and restores it afterward. This file calls act() directly around a
// dispatch and around a raw popstate event, both outside that window, so React
// does not consider itself in an act environment and warns on every call. Set
// the flag for this file only (no global vitest setup) — it also makes act()
// flush effects synchronously the way it is meant to, not just silence the
// warning.
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

afterEach(() => cleanup())

describe('filterReducer', () => {
  it('adds a value on first toggle and removes it on the second', () => {
    // A spread copy, never the shared EMPTY_FILTERS singleton directly: the
    // singleton is deep-frozen, and passing it live here would make the
    // "never mutates" guard below depend on this test having run first.
    const once = filterReducer({ ...EMPTY_FILTERS }, { type: 'toggle', facet: 'region', value: 'africa' })
    expect(once.region).toEqual(['africa'])
    expect(filterReducer(once, { type: 'toggle', facet: 'region', value: 'africa' }).region).toEqual([])
  })

  it('clears one facet without touching the others', () => {
    const s = { ...EMPTY_FILTERS, region: ['africa'], application: ['asr'] }
    const r = filterReducer(s, { type: 'clearFacet', facet: 'region' })
    expect(r.region).toEqual([])
    expect(r.application).toEqual(['asr'])
  })

  it('clears every facet and the range, but keeps the open panel', () => {
    const s = { ...EMPTY_FILTERS, region: ['africa'], from: 2000, lang: 'myaamia' }
    const r = filterReducer(s, { type: 'clearAll' })
    expect(r).toEqual({ ...EMPTY_FILTERS, lang: 'myaamia' })
  })

  it('keeps one selection at a time', () => {
    const s = filterReducer({ ...EMPTY_FILTERS, init: 'i' }, { type: 'selectLanguage', id: 'l' })
    expect(s).toMatchObject({ lang: 'l', init: null })
    expect(filterReducer(s, { type: 'selectInitiative', id: 'i' })).toMatchObject({ lang: null, init: 'i' })
  })

  it('replaces the whole state wholesale on fromUrl, not a merge', () => {
    const s = { ...EMPTY_FILTERS, region: ['africa'], lang: 'myaamia' }
    const incoming = { ...EMPTY_FILTERS, application: ['asr'] }
    expect(filterReducer(s, { type: 'fromUrl', state: incoming })).toEqual(incoming)
  })

  it('never mutates the state it was given', () => {
    // Deliberately a fresh copy, not the frozen EMPTY_FILTERS singleton — a
    // mutation here would throw (frozen) rather than silently poisoning every
    // other test in the file, which is what makes this guard trustworthy in
    // isolation instead of only when run in file order.
    const s = { ...EMPTY_FILTERS }
    filterReducer(s, { type: 'toggle', facet: 'region', value: 'africa' })
    expect(s.region).toEqual([])
  })
})

describe('view and sort actions', () => {
  it('setView drops a sort the new view cannot honour', () => {
    const withSort = filterReducer(
      { ...EMPTY_FILTERS, view: 'languages' },
      { type: 'setSort', sort: { column: 'speakers', direction: 'asc' } },
    )
    expect(filterReducer(withSort, { type: 'setView', view: 'initiatives' }).sort).toBeNull()
    expect(filterReducer(withSort, { type: 'setView', view: 'map' }).sort).toBeNull()
  })

  it('setView keeps a sort the new view still has', () => {
    const withSort = filterReducer(
      { ...EMPTY_FILTERS, view: 'languages' },
      { type: 'setSort', sort: { column: 'name', direction: 'desc' } },
    )
    expect(filterReducer(withSort, { type: 'setView', view: 'initiatives' }).sort)
      .toEqual({ column: 'name', direction: 'desc' })
  })

  // Clearing the query must not also throw the reader back to the map. It
  // already preserves the open panel for the same reason.
  it('clearAll keeps the view, the sort and the open panel', () => {
    const state = filterReducer(
      { ...EMPTY_FILTERS, view: 'languages', lang: 'cho', init: null,
        sort: { column: 'work', direction: 'asc' }, region: ['africa'] },
      { type: 'clearAll' },
    )
    expect(state.region).toEqual([])
    expect(state.view).toBe('languages')
    expect(state.sort).toEqual({ column: 'work', direction: 'asc' })
    expect(state.lang).toBe('cho')
  })
})

function Probe(): React.JSX.Element {
  const { state, dispatch } = useFilters()
  ;(globalThis as { __dispatch?: (a: FilterAction) => void }).__dispatch = dispatch
  return <output data-testid="probe">{JSON.stringify(state.region)}</output>
}

const send = (a: FilterAction): void =>
  act(() => { (globalThis as { __dispatch?: (a: FilterAction) => void }).__dispatch!(a) })

describe('useFilters', () => {
  it('reads its initial state from the URL', () => {
    window.history.replaceState({}, '', '/?region=africa')
    render(<Probe />)
    expect(screen.getByTestId('probe').textContent).toBe('["africa"]')
  })

  it('writes a facet change into the URL', () => {
    window.history.replaceState({}, '', '/')
    render(<Probe />)
    send({ type: 'toggle', facet: 'region', value: 'oceania' })
    expect(window.location.search).toBe('?region=oceania')
  })

  it('leaves a clean URL when everything is cleared', () => {
    window.history.replaceState({}, '', '/?region=africa')
    render(<Probe />)
    send({ type: 'clearAll' })
    expect(window.location.search).toBe('')
  })

  it('pushes discrete changes so a history entry exists to go Back to', () => {
    window.history.replaceState({}, '', '/')
    render(<Probe />)
    const before = window.history.length
    send({ type: 'toggle', facet: 'region', value: 'africa' })
    expect(window.history.length).toBeGreaterThan(before)
  })

  // A drag fires many setRange actions; each must NOT add a history entry.
  it('replaces rather than pushes while the range is moving', () => {
    window.history.replaceState({}, '', '/')
    render(<Probe />)
    const before = window.history.length
    send({ type: 'setRange', from: 2000, to: 2020 })
    send({ type: 'setRange', from: 2001, to: 2020 })
    send({ type: 'setRange', from: 2002, to: 2020 })
    expect(window.history.length).toBe(before)
    expect(window.location.search).toBe('?from=2002&to=2020')
  })

  // The name of this test is the point: a pushed history entry is only useful
  // if Back actually changes what's on screen, not just the address bar.
  it('re-syncs the rendered state when the browser navigates Back (popstate)', () => {
    window.history.replaceState({}, '', '/')
    render(<Probe />)
    send({ type: 'toggle', facet: 'region', value: 'africa' })
    expect(screen.getByTestId('probe').textContent).toBe('["africa"]')

    // The browser moves `window.location` on its own before it fires
    // `popstate` — a real Back press does not go through this hook's dispatch
    // at all, so the test drives the two steps separately, the same way a
    // real navigation does.
    act(() => {
      window.history.replaceState({}, '', '/')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })

    expect(screen.getByTestId('probe').textContent).toBe('[]')
  })

  // A reader following a link from the paper to a non-canonical URL must not
  // get a phantom history entry: pressing Back from there should leave the
  // site entirely, not bounce to the pre-canonicalisation URL they never saw.
  it('canonicalises a non-canonical URL on mount by replacing, not pushing', () => {
    window.history.replaceState({}, '', '/?region=africa&colour=blue')
    const before = window.history.length
    render(<Probe />)
    expect(window.location.search).toBe('?region=africa')
    expect(window.history.length).toBe(before)
  })

  // The regression this guards: writing the URL on every render (even when it
  // already matches) would silently turn every push into two, or — worse —
  // fire on a render that followed no user action, breaking Back.
  it('does not touch history on a plain render with no dispatch', () => {
    window.history.replaceState({}, '', '/')
    const before = window.history.length
    render(<Probe />)
    expect(window.history.length).toBe(before)
  })

  // The reducer always returns a fresh object (even when the resulting values
  // are identical to the current ones), so re-dispatching the same selection
  // re-runs the write effect with an unchanged serialised URL. Without the
  // no-op guard that second run would push a second, indistinguishable
  // history entry — one Back press would look like it did nothing.
  it('does not push a duplicate history entry when a dispatch does not change the URL', () => {
    window.history.replaceState({}, '', '/')
    render(<Probe />)
    send({ type: 'selectLanguage', id: 'myaamia' })
    const afterFirst = window.history.length
    send({ type: 'selectLanguage', id: 'myaamia' })
    expect(window.history.length).toBe(afterFirst)
  })
})
