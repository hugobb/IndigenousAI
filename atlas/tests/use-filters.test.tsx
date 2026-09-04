// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { act } from 'react'
import { EMPTY_FILTERS } from '../src/lib/url-state.js'
import { filterReducer, useFilters, type FilterAction } from '../src/state/useFilters.js'

afterEach(() => cleanup())

describe('filterReducer', () => {
  it('adds a value on first toggle and removes it on the second', () => {
    const once = filterReducer(EMPTY_FILTERS, { type: 'toggle', facet: 'region', value: 'africa' })
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

  it('never mutates the state it was given', () => {
    const s = { ...EMPTY_FILTERS }
    filterReducer(s, { type: 'toggle', facet: 'region', value: 'africa' })
    expect(s.region).toEqual([])
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

  it('pushes discrete changes so Back undoes a filter', () => {
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
})
