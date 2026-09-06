import { describe, expect, it } from 'vitest'
import { applyFilters, emptyState } from '../src/lib/filters.js'
import { INITIATIVE_FACETS, LANGUAGE_FACETS, NOT_RECORDED, VOCAB_FOR } from '../src/lib/facets.js'
import { loadBundle } from '../src/lib/load.js'
import { EMPTY_FILTERS } from '../src/lib/url-state.js'
import type { AtlasBundle } from '../src/lib/load.js'
import type { FilterState } from '../src/lib/url-state.js'
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
  ({ generated: '2026-01-01', languages, initiatives, methods: [], papers: [], paperLanguages: [], isDemoData: true })

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
  //
  // Final review, finding 3: this test could not fail on a complement. Neither
  // state it swept set a LANGUAGE facet, so `l1 === bundle.languages` and a
  // complement is indistinguishable from a subset — building `noMatchingWork`
  // from `bundle.languages` instead of `l1` left it green. A third language the
  // region facet excludes is what makes the two differ: it is workless, so a
  // complement would name it, and it is not in L1, so a subset cannot.
  it('is always a subset of languages, never a complement', () => {
    const b = bundleOf(
      [lang('a', { region: 'africa' }), lang('b', { region: 'africa' }),
        lang('excluded', { region: 'oceania' })],
      [init('i', ['a'], { applications: ['asr'] })],
    )
    const states = [
      EMPTY_FILTERS,
      { ...EMPTY_FILTERS, application: ['asr'] },
      { ...EMPTY_FILTERS, region: ['africa'] },
      { ...EMPTY_FILTERS, region: ['africa'], application: ['asr'] },
    ]
    let sawExcludedLanguage = false
    for (const state of states) {
      const s = applyFilters(b, state)
      if (!s.languages.some((l) => l.id === 'excluded')) sawExcludedLanguage = true
      for (const l of s.noMatchingWork) expect(s.languages, JSON.stringify(state)).toContain(l)
    }
    // Without a state that excludes a workless language from L1, every
    // assertion above holds for a complement too and the test proves nothing.
    expect(sawExcludedLanguage).toBe(true)
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

// Seam review (Task 8), settling the question Task 1's reviewer routed here:
// is `emptyState === 'matched'` with an EMPTY language list reachable?
//
// It is not, and the argument has three legs, each checked somewhere:
//  1. With a language facet active, an empty L1 forces I1 empty through the
//     intersection clause in `applyFilters` — so `matched` cannot hold. That
//     is what the sweep below checks, over every filter state the fixture can
//     express one and two facets deep.
//  2. With NO language facet active, L1 IS `bundle.languages`, so the state
//     needs a bundle with initiatives and no languages at all.
//  3. That bundle cannot be built: `InitiativeSchema` requires at least one
//     language id, and `scripts/validate.ts` fails both on any unresolved
//     language reference and on any record still `draft` — so every verified
//     initiative's languages are verified languages too. (Guarded by
//     "fails an initiative referencing an unknown language" in
//     tests/validate.test.ts.)
//
// The guard in tests/table-view.test.tsx is therefore NOT deleted but
// re-pointed: it now asserts the property that is actually load-bearing —
// no `EmptyState` may leave a zero-row table with no message — rather than
// claiming this state occurs.
describe('an empty language list never coexists with surviving work', () => {
  const bundle = loadBundle()

  const states = (): FilterState[] => {
    const single: FilterState[] = [EMPTY_FILTERS]
    const language: FilterState[] = []
    const initiative: FilterState[] = []
    // The WHOLE vocabulary, not just the values the fixture happens to carry:
    // `?region=arctic` is the state that empties L1, and a sweep built only
    // from present values would never reach it — and would then pass
    // vacuously. `family` and `method` have no vocabulary (any string is a
    // legitimate value), so they get an absent one by hand.
    const allValues = <T>(
      f: { id: string; values: (r: T) => string[] }, records: T[],
    ): string[] => [
      NOT_RECORDED, 'no-such-value',
      ...new Set([...(VOCAB_FOR[f.id as never] ?? []), ...records.flatMap((r) => f.values(r))]),
    ]
    for (const f of LANGUAGE_FACETS) {
      for (const v of allValues(f, bundle.languages)) {
        language.push({ ...EMPTY_FILTERS, [f.id]: [v] })
      }
    }
    for (const f of INITIATIVE_FACETS) {
      for (const v of allValues(f, bundle.initiatives)) {
        initiative.push({ ...EMPTY_FILTERS, [f.id]: [v] })
      }
    }
    // Every language facet crossed with every initiative facet, which is the
    // shape that produces an empty L1 beside surviving work if anything does.
    const crossed = language.flatMap((l) =>
      initiative.map((i) => ({ ...l, ...Object.fromEntries(
        INITIATIVE_FACETS.map((f) => [f.id, i[f.id]]),
      ) }) as FilterState),
    )
    return [...single, ...language, ...initiative, ...crossed]
  }

  it('holds across every one- and two-facet filter state the fixture can express', () => {
    const all = states()
    expect(all.length).toBeGreaterThan(50)
    let sawEmptyL1 = false
    for (const state of all) {
      const s = applyFilters(bundle, state)
      if (s.languages.length === 0) {
        sawEmptyL1 = true
        expect(s.initiatives, JSON.stringify(state)).toEqual([])
        expect(emptyState(s), JSON.stringify(state)).toBe('nothing-matched')
      }
    }
    // The sweep would pass vacuously if no state ever emptied L1.
    expect(sawEmptyL1).toBe(true)
  })
})
