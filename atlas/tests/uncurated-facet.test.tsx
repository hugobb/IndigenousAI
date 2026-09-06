// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  InitiativeSchema, LanguageSchema, type Initiative, type Language,
} from '../src/schema/index.js'
import type { AtlasBundle } from '../src/lib/load.js'

// Ruling R15 routed this here as REQUIRED work. Task 7 gave `fixture-conflict`
// an `endangerment`, which closed a real coverage hole and retired the shared
// fixture's LAST uncurated facet: all eight now report `curated: true`, so the
// "Not yet curated" branch of `FacetGroup` — and the `notRecordedTotal` count
// that branch alone reads — had no end-to-end path through `App` at all.
//
// The rejected fix was to null `data_regime` on its one fixture holder. That
// relocates the gap rather than closing it (`regime` becomes the next single
// point of failure) and costs the demo its only populated Data-regime filter.
// This file takes the other option: its OWN minimal bundle, hand-built so that
// exactly ONE facet is uncurated, driven through the real `App`.
//
// `loadBundle` is mocked rather than the fixture edited, so nothing here can
// change what the demo shows.
const src = { kind: 'doc' as const, ref: 'test', retrieved: null, quote: null }

const languages: Language[] = [
  LanguageSchema.parse({
    id: 'alpha', name: 'Alpha', tier: 'indigenous', status: 'verified',
    family: 'Test Family', region: 'north-america',
    // `typology` is the deliberately uncurated dimension: NEITHER language
    // carries one, which is what `curated: false` means.
    typology: [],
    endangerment: { status: 'vulnerable', scale: 'unesco-2010', source: src },
  }),
  LanguageSchema.parse({
    id: 'beta', name: 'Beta', tier: 'indigenous', status: 'verified',
    family: 'Test Family', region: 'africa', typology: [],
  }),
]

const initiatives: Initiative[] = [
  InitiativeSchema.parse({
    id: 'work', name: 'Test Work', kind: 'project', tier: 'indigenous',
    languages: ['alpha'], status: 'verified',
    site: { lat: 0, lon: 0, place: 'Somewhere', source: src },
    applications: ['asr'], methods: ['test-method'], data_regime: '1k-10k',
    governance: { posture: 'open', licence: null, source: src },
  }),
]

const bundle: AtlasBundle = {
  generated: '2026-01-01T00:00:00.000Z',
  languages, initiatives, methods: [], papers: [], paperLanguages: [], isDemoData: true,
}

vi.mock('../src/lib/load.js', () => ({ loadBundle: () => bundle }))
vi.mock('../src/components/MapView.js', () => ({ default: () => <div /> }))

const { default: App } = await import('../src/components/App.js')

afterEach(() => cleanup())

const at = (search: string): void => {
  window.history.replaceState({}, '', search)
  render(<App />)
}

describe('a facet nobody has coded yet, end to end', () => {
  // The premise of every test below. If a later change to this file gives
  // `typology` a value, or takes the last value off another facet, this fails
  // and says so rather than letting the tests below pass vacuously.
  it('models exactly one uncurated facet, and it is typology', () => {
    at('/')
    const uncurated = ['family', 'typology', 'endangerment', 'region',
      'application', 'method', 'regime', 'governance']
      .filter((id) => /not yet curated/i.test(screen.getByTestId(`facet-${id}`).textContent ?? ''))
    expect(uncurated).toEqual(['typology'])
  })

  it('states the gap instead of rendering an empty set of checkboxes', () => {
    at('/')
    const group = screen.getByTestId('facet-typology')
    expect(group.textContent).toMatch(/not yet curated/i)
    expect(within(group).queryAllByRole('checkbox')).toHaveLength(0)
  })

  // The count belongs to the sentence, and the sentence is a claim about the
  // DATASET. `?region=africa` narrows the pool to one language while both are
  // still uncoded, so a pool-scoped count would read "1 record" here and
  // invite the reading that exactly one record was ever checked.
  it('counts the uncoded records across the whole dataset, not the current pool', () => {
    at('/?region=africa')
    const group = screen.getByTestId('facet-typology').textContent ?? ''
    expect(group).toMatch(/not yet curated \(2 records\)/i)
    expect(group).not.toMatch(/\(1 record\)/i)
  })

  // Mutation-check finding: measuring `curated` against the FILTERED pool
  // instead of the bundle left every test above green, because they all read
  // `facet-typology` and that facet is uncurated either way. `beta` carries no
  // `endangerment`, so at `?region=africa` the pool for that facet holds no
  // values at all — and calling it "not yet curated" there would turn a filter
  // result into a false claim about the dataset. This is the case that bites.
  it('does not call a curated facet uncurated merely because a filter excluded its values', () => {
    at('/?region=africa')
    const group = screen.getByTestId('facet-endangerment')
    expect(group.textContent).not.toMatch(/not yet curated/i)
    // It still has a control: the "not recorded" sentinel, which `beta` is in.
    expect(within(group).getAllByRole('checkbox').length).toBeGreaterThan(0)
  })

  // An uncurated group used to render no controls at all, so a cited
  // `?typology=_none` showed "Clear all (1)" with the selection nowhere on the
  // page — a filter the reader could neither see nor undo.
  it('renders a selection made against the uncurated facet, so it can be cleared', () => {
    at('/?typology=_none')
    const group = screen.getByTestId('facet-typology')
    expect(group.textContent).toMatch(/not yet curated/i)
    const box = within(group).getByRole('checkbox') as HTMLInputElement
    expect(box.checked).toBe(true)
    expect(within(group).getByTestId('facet-clear-typology')).toBeDefined()
    expect(screen.getByTestId('clear-all').textContent).toContain('1')
  })
})
