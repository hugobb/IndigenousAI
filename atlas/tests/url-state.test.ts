import { describe, expect, it } from 'vitest'
import { EMPTY_FILTERS, parseFilters, toSearch } from '../src/lib/url-state.js'
import { INITIATIVE_FACETS, LANGUAGE_FACETS, VOCAB_FOR } from '../src/lib/facets.js'
import methods from '../data/derived/methods.json'

describe('the URL contract', () => {
  // Hardcoded ON PURPOSE. Deriving these from FilterState would make the test a
  // mirror of the code: a breaking rename would silently stay green while every
  // URL printed in the paper broke.
  it('accepts exactly these twelve keys, spelled exactly this way', () => {
    const url =
      '?family=Algic&typology=polysynthetic&endangerment=vulnerable&region=north-america' +
      '&application=asr&method=fst-morphological-segmentation&regime=1k-10k' +
      '&governance=open&from=2000&to=2020&lang=myaamia&init=te-hiku-media'
    expect(parseFilters(url)).toEqual({
      family: ['Algic'], typology: ['polysynthetic'], endangerment: ['vulnerable'],
      region: ['north-america'], application: ['asr'],
      method: ['fst-morphological-segmentation'], regime: ['1k-10k'],
      governance: ['open'], from: 2000, to: 2020,
      lang: 'myaamia', init: 'te-hiku-media',
    })
  })

  it('round-trips a populated state', () => {
    const state = { ...EMPTY_FILTERS, application: ['asr', 'tts'], region: ['oceania'], from: 1999 }
    expect(parseFilters(toSearch(state))).toEqual(state)
  })

  it('writes nothing for an empty state', () => {
    expect(toSearch(EMPTY_FILTERS)).toBe('')
  })

  it('joins multiple values with commas', () => {
    expect(toSearch({ ...EMPTY_FILTERS, application: ['asr', 'tts'] })).toBe('?application=asr%2Ctts')
  })

  it('ignores an unknown key instead of failing', () => {
    expect(parseFilters('?colour=blue&region=africa')).toEqual({ ...EMPTY_FILTERS, region: ['africa'] })
  })

  it('drops an unknown value from a vocabulary facet, keeping the known ones', () => {
    expect(parseFilters('?region=africa,atlantis')).toEqual({ ...EMPTY_FILTERS, region: ['africa'] })
  })

  it('keeps any value for the two data-derived facets', () => {
    const r = parseFilters('?family=Some-New-Family&method=a-brand-new-method')
    expect(r.family).toEqual(['Some-New-Family'])
    expect(r.method).toEqual(['a-brand-new-method'])
  })

  it('carries the not-recorded sentinel through a round trip', () => {
    expect(parseFilters('?endangerment=_none').endangerment).toEqual(['_none'])
    expect(toSearch({ ...EMPTY_FILTERS, endangerment: ['_none'] })).toBe('?endangerment=_none')
  })

  it('ignores a non-integer year rather than producing NaN', () => {
    expect(parseFilters('?from=banana&to=2020')).toEqual({ ...EMPTY_FILTERS, from: null, to: 2020 })
  })

  it('emits keys in a stable order, so one state always yields one URL', () => {
    const a = toSearch({ ...EMPTY_FILTERS, region: ['africa'], application: ['asr'] })
    const b = toSearch({ ...EMPTY_FILTERS, application: ['asr'], region: ['africa'] })
    expect(a).toBe(b)
    expect(a.indexOf('region')).toBeLessThan(a.indexOf('application'))
  })

  // Comma-joining is only safe while no facet value contains a comma.
  it('has no comma in any vocabulary value or any data-derived facet value', () => {
    for (const values of Object.values(VOCAB_FOR)) {
      for (const v of values ?? []) expect(v).not.toContain(',')
    }
    for (const m of methods as { id: string }[]) expect(m.id).not.toContain(',')
  })

  it('names every facet in the registry as a key', () => {
    const parsed = parseFilters('')
    for (const f of [...LANGUAGE_FACETS, ...INITIATIVE_FACETS]) {
      expect(parsed).toHaveProperty(f.id)
    }
  })
})
