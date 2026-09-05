import { describe, expect, it } from 'vitest'
import { applyFilters, emptyState } from '../src/lib/filters.js'
import { EMPTY_FILTERS } from '../src/lib/url-state.js'
import type { AtlasBundle } from '../src/lib/load.js'
import type { Initiative, Language } from '../src/schema/index.js'

const lang = (id: string, over: Partial<Language> = {}): Language => ({
  id, name: id.toUpperCase(), also_known_as: [], glottocode: null, iso639_3: null,
  tier: 'indigenous', family: null, subfamily: null, typology: [], endangerment: null,
  speakers: null, region: null, countries: [], centre: null, caveat: null, status: 'draft',
  ...over,
} as Language)

const init = (id: string, languages: string[], over: Partial<Initiative> = {}): Initiative => ({
  id, name: id.toUpperCase(), kind: 'project', tier: 'indigenous', languages,
  started: 2020, ended: null,
  site: { lat: 0, lon: 0, place: 'p', confidence: 'sourced',
    source: { kind: 'doc', ref: 'fixture', retrieved: null, quote: null } },
  applications: [], methods: [], models: [], data_regime: null, governance: null,
  papers: [], links: [], transferability: null, caveat: null, status: 'draft',
  // The brief's fixture omitted this spread, so `over` was silently dropped and
  // every initiative carried `applications: []` — which made "reports it under a
  // work filter" fail for the wrong reason (the initiative was excluded, so BOTH
  // languages were workless) rather than because the field was wrong.
  ...over,
} as unknown as Initiative)

const bundleOf = (languages: Language[], initiatives: Initiative[]): AtlasBundle =>
  ({ generated: '2026-01-01', languages, initiatives, methods: [], papers: [], isDemoData: true })

describe('noMatchingWork', () => {
  // The asymmetry this task exists to remove: the SAME language, with the same
  // absence of work, was reported under a work filter and silently dropped
  // under a language filter.
  it('reports a workless language with NO filters at all', () => {
    const s = applyFilters(bundleOf([lang('a'), lang('b')], [init('i', ['a'])]), EMPTY_FILTERS)
    expect(s.noMatchingWork.map((l) => l.id)).toEqual(['b'])
  })

  it('reports it under a language-only filter', () => {
    const b = bundleOf(
      [lang('a', { region: 'africa' }), lang('b', { region: 'africa' })],
      [init('i', ['a'])],
    )
    const s = applyFilters(b, { ...EMPTY_FILTERS, region: ['africa'] })
    expect(s.noMatchingWork.map((l) => l.id)).toEqual(['b'])
  })

  it('reports it under a work filter, as it always did', () => {
    const b = bundleOf([lang('a'), lang('b')], [init('i', ['a'], { applications: ['asr'] })])
    const s = applyFilters(b, { ...EMPTY_FILTERS, application: ['asr'] })
    expect(s.noMatchingWork.map((l) => l.id)).toEqual(['b'])
  })

  // The invariant the rename exists to protect. Before this change the field
  // was a COMPLEMENT of `languages`; now it is a SUBSET, and every call site
  // that concatenated the two would double-count.
  it('is always a subset of languages, never a complement', () => {
    const b = bundleOf([lang('a'), lang('b')], [init('i', ['a'], { applications: ['asr'] })])
    for (const state of [EMPTY_FILTERS, { ...EMPTY_FILTERS, application: ['asr'] }]) {
      const s = applyFilters(b, state)
      for (const l of s.noMatchingWork) expect(s.languages).toContain(l)
    }
  })

  // C2: the map draws L1. A language the rail is about to name must not have
  // been deleted from the map by the same filter.
  it('keeps a workless language in `languages` under a work filter', () => {
    const b = bundleOf([lang('a'), lang('b')], [init('i', ['a'], { applications: ['asr'] })])
    const s = applyFilters(b, { ...EMPTY_FILTERS, application: ['asr'] })
    expect(s.languages.map((l) => l.id)).toEqual(['a', 'b'])
  })

  it('excludes a language the LANGUAGE facets rejected, rather than calling it workless', () => {
    const b = bundleOf([lang('a', { region: 'africa' }), lang('b', { region: 'oceania' })], [init('i', ['a'])])
    const s = applyFilters(b, { ...EMPTY_FILTERS, region: ['africa'] })
    expect(s.languages.map((l) => l.id)).toEqual(['a'])
    expect(s.noMatchingWork).toEqual([])
  })

  // The state SP1c parked and could not explain: languages match, no
  // initiative survives, the old `filteredOut` was empty, so `emptyState`
  // returned `matched` and no surface said anything at all. Now reachable AND
  // explained, because `noMatchingWork` is populated in exactly this case.
  it('explains a work filter that leaves no work at all', () => {
    const b = bundleOf([lang('a')], [init('i', ['a'], { applications: ['asr'] })])
    const s = applyFilters(b, { ...EMPTY_FILTERS, application: ['mt'] })
    expect(s.initiatives).toEqual([])
    expect(s.noMatchingWork.map((l) => l.id)).toEqual(['a'])
    expect(emptyState(s)).toBe('no-work-but-languages')
  })

  it('reports whether a work filter is active', () => {
    const b = bundleOf([lang('a')], [init('i', ['a'])])
    expect(applyFilters(b, EMPTY_FILTERS).workFiltered).toBe(false)
    expect(applyFilters(b, { ...EMPTY_FILTERS, application: ['asr'] }).workFiltered).toBe(true)
    expect(applyFilters(b, { ...EMPTY_FILTERS, from: 2000 }).workFiltered).toBe(true)
    expect(applyFilters(b, { ...EMPTY_FILTERS, region: ['africa'] }).workFiltered).toBe(false)
  })

  // Seam review (Task 8). The symmetric flag, and it must be symmetric: a
  // work facet or the date window must NOT set it, or the three surfaces that
  // read it go back to crediting a language filter nobody applied.
  it('reports whether a language filter is active', () => {
    const b = bundleOf([lang('a')], [init('i', ['a'])])
    expect(applyFilters(b, EMPTY_FILTERS).languageFiltered).toBe(false)
    expect(applyFilters(b, { ...EMPTY_FILTERS, region: ['africa'] }).languageFiltered).toBe(true)
    expect(applyFilters(b, { ...EMPTY_FILTERS, family: ['Algic'] }).languageFiltered).toBe(true)
    expect(applyFilters(b, { ...EMPTY_FILTERS, application: ['asr'] }).languageFiltered).toBe(false)
    expect(applyFilters(b, { ...EMPTY_FILTERS, from: 2000 }).languageFiltered).toBe(false)
  })
})
