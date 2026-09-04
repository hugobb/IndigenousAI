import { describe, expect, it } from 'vitest'
import { applyFilters, facetSummaries, yearRange } from '../src/lib/filters.js'
import { EMPTY_FILTERS } from '../src/lib/url-state.js'
import type { AtlasBundle } from '../src/lib/load.js'
import { InitiativeSchema, LanguageSchema } from '../src/schema/index.js'

const src = { kind: 'doc' as const, ref: 'test', retrieved: null, quote: null }
const centre = { lat: 1, lon: 2, source: src, confidence: 'sourced' as const }

const lang = (id: string, over: Record<string, unknown> = {}) =>
  LanguageSchema.parse({
    id, name: id, tier: 'indigenous', typology: [], endangerment: null, speakers: null,
    region: null, centre, caveat: null, status: 'verified', ...over,
  })

const init = (id: string, languages: string[], over: Record<string, unknown> = {}) =>
  InitiativeSchema.parse({
    id, name: id, kind: 'project', tier: 'indigenous', languages,
    started: null, ended: null,
    site: { lat: 0, lon: 0, place: 'p', source: src },
    applications: [], methods: [], models: [], data_regime: null, governance: null,
    papers: [], links: [], transferability: null, caveat: null, status: 'verified', ...over,
  })

const bundle = (languages: unknown[], initiatives: unknown[]): AtlasBundle => ({
  generated: '2026-09-03', languages, initiatives, methods: [], papers: [], isDemoData: true,
} as unknown as AtlasBundle)

describe('applyFilters', () => {
  it('returns everything when nothing is selected', () => {
    const b = bundle([lang('a'), lang('b')], [init('i', ['a'])])
    const s = applyFilters(b, EMPTY_FILTERS)
    expect(s.languages.map((l) => l.id)).toEqual(['a', 'b'])
    expect(s.initiatives.map((i) => i.id)).toEqual(['i'])
    expect(s.filteredOut).toEqual([])
  })

  it('narrows languages by a language facet', () => {
    const b = bundle([lang('a', { region: 'africa' }), lang('b', { region: 'oceania' })], [])
    const s = applyFilters(b, { ...EMPTY_FILTERS, region: ['africa'] })
    expect(s.languages.map((l) => l.id)).toEqual(['a'])
    expect(s.filteredOut).toEqual([])
  })

  it('drops an initiative whose language was filtered out', () => {
    const b = bundle(
      [lang('a', { region: 'africa' }), lang('b', { region: 'oceania' })],
      [init('ia', ['a']), init('ib', ['b'])],
    )
    const s = applyFilters(b, { ...EMPTY_FILTERS, region: ['africa'] })
    expect(s.initiatives.map((i) => i.id)).toEqual(['ia'])
  })

  // Spec F1: this is the whole point. A work facet must never delete a language.
  it('moves a language with no matching work into filteredOut, never deleting it', () => {
    const b = bundle([lang('a'), lang('b')], [init('ia', ['a'], { applications: ['asr'] })])
    const s = applyFilters(b, { ...EMPTY_FILTERS, application: ['asr'] })
    expect(s.languages.map((l) => l.id)).toEqual(['a'])
    expect(s.filteredOut.map((l) => l.id)).toEqual(['b'])
  })

  it('does not list languages excluded by a language facet as filteredOut', () => {
    const b = bundle(
      [lang('a', { region: 'africa' }), lang('b', { region: 'oceania' })],
      [init('ia', ['a'], { applications: ['asr'] })],
    )
    const s = applyFilters(b, { ...EMPTY_FILTERS, region: ['africa'], application: ['asr'] })
    expect(s.filteredOut).toEqual([])
  })

  it('matches the not-recorded sentinel against records carrying nothing', () => {
    const b = bundle([lang('a', { region: 'africa' }), lang('b')], [])
    const s = applyFilters(b, { ...EMPTY_FILTERS, region: ['_none'] })
    expect(s.languages.map((l) => l.id)).toEqual(['b'])
  })

  it('treats multiple values within one facet as OR', () => {
    const b = bundle([lang('a', { region: 'africa' }), lang('b', { region: 'oceania' }), lang('c')], [])
    const s = applyFilters(b, { ...EMPTY_FILTERS, region: ['africa', 'oceania'] })
    expect(s.languages.map((l) => l.id)).toEqual(['a', 'b'])
  })

  it('treats different facets as AND', () => {
    const b = bundle(
      [lang('a', { region: 'africa', typology: ['fusional'] }), lang('b', { region: 'africa' })],
      [],
    )
    const s = applyFilters(b, { ...EMPTY_FILTERS, region: ['africa'], typology: ['fusional'] })
    expect(s.languages.map((l) => l.id)).toEqual(['a'])
  })

  it('applies the timeline to dated initiatives', () => {
    const b = bundle([lang('a')], [init('old', ['a'], { started: 1990 }), init('new', ['a'], { started: 2020 })])
    const s = applyFilters(b, { ...EMPTY_FILTERS, from: 2000, to: 2025 })
    expect(s.initiatives.map((i) => i.id)).toEqual(['new'])
  })

  // Spec F5: Te Hiku Media has no start date. A slider must not delete it.
  it('never removes an undated initiative with the timeline, and counts them', () => {
    const b = bundle([lang('a')], [init('undated', ['a']), init('old', ['a'], { started: 1990 })])
    const s = applyFilters(b, { ...EMPTY_FILTERS, from: 2000, to: 2025 })
    expect(s.initiatives.map((i) => i.id)).toEqual(['undated'])
    expect(s.undatedInitiatives).toBe(1)
  })

  it('treats an open-ended window as unconstrained on that side', () => {
    const b = bundle([lang('a')], [init('old', ['a'], { started: 1990 })])
    expect(applyFilters(b, { ...EMPTY_FILTERS, to: 1995 }).initiatives).toHaveLength(1)
    expect(applyFilters(b, { ...EMPTY_FILTERS, from: 1995 }).initiatives).toHaveLength(0)
  })

  // Fix round 1, Fix 1: the only prior undated-count test had a dated initiative
  // pruned by the very window under test, so `i1` was `['undated']` and
  // `i1.length` equalled the correct answer by coincidence. Here a dated
  // initiative also survives, so `undatedInitiatives` must be strictly less
  // than `i1.length` for the count to mean anything.
  it('counts only the undated initiatives among several survivors, not all of them', () => {
    const b = bundle(
      [lang('a')],
      [init('undated', ['a']), init('current', ['a'], { started: 2020 })],
    )
    const s = applyFilters(b, { ...EMPTY_FILTERS, from: 2000, to: 2025 })
    expect(s.initiatives.map((i) => i.id)).toEqual(['undated', 'current'])
    expect(s.undatedInitiatives).toBe(1)
    expect(s.undatedInitiatives).toBeLessThan(s.initiatives.length)
  })

  // Fix round 1, Fix 2: the timeline caveat is a standing property of the data,
  // not something that only becomes true once a work facet is touched. Under
  // EMPTY_FILTERS — the very first thing a reader sees — an undated initiative
  // must still be counted.
  it('counts undated initiatives even under EMPTY_FILTERS, with no work filter active', () => {
    const b = bundle(
      [lang('a')],
      [init('undated', ['a']), init('dated', ['a'], { started: 2020 })],
    )
    const s = applyFilters(b, EMPTY_FILTERS)
    expect(s.initiatives.map((i) => i.id)).toEqual(['undated', 'dated'])
    expect(s.undatedInitiatives).toBe(1)
  })
})

describe('facetSummaries', () => {
  it('marks a facet with no values anywhere as uncurated', () => {
    const b = bundle([lang('a'), lang('b')], [])
    const typology = facetSummaries(b, EMPTY_FILTERS).find((f) => f.id === 'typology')!
    expect(typology.curated).toBe(false)
    expect(typology.options).toEqual([])
    expect(typology.notRecorded).toBe(2)
  })

  it('marks a facet with at least one value as curated', () => {
    const b = bundle([lang('a', { region: 'africa' }), lang('b')], [])
    const region = facetSummaries(b, EMPTY_FILTERS).find((f) => f.id === 'region')!
    expect(region.curated).toBe(true)
    expect(region.options).toEqual([{ value: 'africa', count: 1 }])
    expect(region.notRecorded).toBe(1)
  })

  // Spec F7: an option must never claim a count that selecting it would not yield.
  it('counts against other facets but ignores the group its own selection is in', () => {
    const b = bundle(
      [lang('a', { region: 'africa', typology: ['fusional'] }),
       lang('b', { region: 'oceania', typology: ['fusional'] }),
       lang('c', { region: 'africa', typology: ['isolating'] })],
      [],
    )
    const sums = facetSummaries(b, { ...EMPTY_FILTERS, typology: ['fusional'], region: ['africa'] })
    const region = sums.find((f) => f.id === 'region')!
    // Narrowed by typology, NOT by region's own selection: a and b both survive.
    expect(region.options).toEqual([
      { value: 'africa', count: 1 },
      { value: 'oceania', count: 1 },
    ])
    expect(region.selected).toEqual(['africa'])
  })

  it('reports all eight facets even when every one is empty', () => {
    expect(facetSummaries(bundle([], []), EMPTY_FILTERS)).toHaveLength(8)
  })

  // `curated` is a claim about the DATA, not about the current filter. If it were
  // measured against the filtered pool, narrowing to a region with no typology
  // would make the atlas announce that typology is uncurated, which is false.
  it('keeps a curated facet curated even when the filter excludes all its values', () => {
    const b = bundle(
      [lang('a', { region: 'africa', typology: ['fusional'] }), lang('b', { region: 'oceania' })],
      [],
    )
    const typology = facetSummaries(b, { ...EMPTY_FILTERS, region: ['oceania'] })
      .find((f) => f.id === 'typology')!
    expect(typology.options).toEqual([])
    expect(typology.curated).toBe(true)
  })

  // Fix round 1, Fix 3: a language facet's option count must be computed
  // against L1 (languages + filteredOut), never against the narrower L2
  // (`.languages` alone). Under a work filter, 'b' has no matching work and
  // ends up in filteredOut rather than being deleted (spec F1) — the region
  // option must still count it, or a reader who clicks it discovers a second
  // language they weren't told about.
  it("counts a language facet option against filteredOut too, not only the survivors", () => {
    const b = bundle(
      [lang('a', { region: 'africa' }), lang('b', { region: 'africa' })],
      [init('ia', ['a'], { applications: ['asr'] })],
    )
    const sel = applyFilters(b, { ...EMPTY_FILTERS, application: ['asr'] })
    expect(sel.languages.map((l) => l.id)).toEqual(['a'])
    expect(sel.filteredOut.map((l) => l.id)).toEqual(['b'])

    const region = facetSummaries(b, { ...EMPTY_FILTERS, application: ['asr'] })
      .find((f) => f.id === 'region')!
    expect(region.options).toEqual([{ value: 'africa', count: 2 }])
  })
})

describe('yearRange', () => {
  it('spans the dated initiatives', () => {
    const b = bundle([lang('a')], [init('x', ['a'], { started: 1999 }), init('y', ['a'], { started: 2021 })])
    expect(yearRange(b)).toEqual({ min: 1999, max: 2021 })
  })

  it('is null when nothing is dated, so the timeline can hide itself', () => {
    expect(yearRange(bundle([lang('a')], [init('x', ['a'])]))).toBeNull()
  })
})
