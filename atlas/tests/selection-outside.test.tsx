// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../src/components/App.js'
import { loadBundle } from '../src/lib/load.js'

vi.mock('maplibre-gl', () => ({
  default: { Map: class { on(): void {} remove(): void {} } },
}))

afterEach(() => cleanup())
beforeEach(() => window.history.replaceState({}, '', '/'))

const bundle = loadBundle()

describe('a selected record the filters exclude', () => {
  it('still renders the panel, marked as outside the filters', () => {
    // fixture-adjacent is the only africa-region language; asr excludes its
    // one initiative, so the language is excluded from L1 by region+application.
    const lang = bundle.languages.find((l) => l.region === 'north-america')!
    window.history.replaceState({}, '', `/?lang=${lang.id}&region=africa`)
    render(<App />)
    expect(screen.getByTestId('outside-filters')).toBeDefined()
    // The panel is still rendered — assert the record is on the page rather
    // than guessing which element the panel uses for its title.
    expect(document.body.textContent).toContain(lang.name)
  })

  it('offers a way out that clears the filters and keeps the record', () => {
    const lang = bundle.languages.find((l) => l.region === 'north-america')!
    window.history.replaceState({}, '', `/?lang=${lang.id}&region=africa`)
    render(<App />)
    fireEvent.click(screen.getByTestId('outside-clear-filters'))
    expect(window.location.search).toBe(`?lang=${lang.id}`)
  })

  it('offers a way out that drops the selection and keeps the filters', () => {
    const lang = bundle.languages.find((l) => l.region === 'north-america')!
    window.history.replaceState({}, '', `/?lang=${lang.id}&region=africa`)
    render(<App />)
    fireEvent.click(screen.getByTestId('outside-deselect'))
    expect(window.location.search).toBe('?region=africa')
  })

  it('does the same for an initiative excluded by a work filter', () => {
    const init = bundle.initiatives.find((i) => i.applications.includes('mt'))!
    window.history.replaceState({}, '', `/?init=${init.id}&application=asr`)
    render(<App />)
    expect(screen.getByTestId('outside-filters')).toBeDefined()
    expect(document.body.textContent).toContain(init.name)
  })

  it('shows no notice when the selected record is inside the filters', () => {
    const lang = bundle.languages[0]!
    window.history.replaceState({}, '', `/?lang=${lang.id}`)
    render(<App />)
    expect(screen.queryByTestId('outside-filters')).toBeNull()
  })
})

describe('a selected id the bundle does not hold', () => {
  it('drops the key from the URL', () => {
    window.history.replaceState({}, '', '/?lang=not-a-language&region=africa')
    render(<App />)
    expect(window.location.search).toBe('?region=africa')
  })

  // SP1b rulings 8-10: a write the reader never asked for must not be
  // undoable, or Back walks them into the broken URL they just left.
  it('replaces rather than pushes, so Back does not return to it', () => {
    const push = vi.spyOn(window.history, 'pushState')
    window.history.replaceState({}, '', '/?init=nope')
    render(<App />)
    expect(window.location.search).toBe('')
    expect(push).not.toHaveBeenCalled()
    push.mockRestore()
  })
})
