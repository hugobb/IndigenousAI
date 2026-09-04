import { describe, expect, it } from 'vitest'
import {
  INITIATIVE_FACETS, LANGUAGE_FACETS, NOT_RECORDED, VOCAB_FOR,
  facetOptions, notRecordedCount,
} from '../src/lib/facets.js'
import { InitiativeSchema, LanguageSchema } from '../src/schema/index.js'

const src = { kind: 'doc' as const, ref: 'test', retrieved: null, quote: null }

const lang = (over: Record<string, unknown>) =>
  LanguageSchema.parse({
    id: 'l1', name: 'L1', tier: 'indigenous', typology: [], endangerment: null,
    speakers: null, region: null, centre: null, caveat: null, status: 'verified', ...over,
  })

const init = (over: Record<string, unknown>) =>
  InitiativeSchema.parse({
    id: 'i1', name: 'I1', kind: 'project', tier: 'indigenous', languages: ['l1'],
    started: null, ended: null,
    site: { lat: 0, lon: 0, place: 'p', source: src },
    applications: [], methods: [], models: [], data_regime: null,
    governance: null, papers: [], links: [], transferability: null,
    caveat: null, status: 'verified', ...over,
  })

const facet = (id: string) =>
  [...LANGUAGE_FACETS, ...INITIATIVE_FACETS].find((f) => f.id === id)!

describe('the facet registry', () => {
  it('covers exactly the eight facets D6 names', () => {
    expect([...LANGUAGE_FACETS, ...INITIATIVE_FACETS].map((f) => f.id)).toEqual([
      'family', 'typology', 'endangerment', 'region',
      'application', 'method', 'regime', 'governance',
    ])
  })

  it('reads endangerment from the nested status, not the object', () => {
    const l = lang({
      endangerment: { status: 'vulnerable', scale: 'unesco-2010', source: src },
    })
    expect((facet('endangerment') as { values: (x: unknown) => string[] }).values(l)).toEqual(['vulnerable'])
  })

  it('reads governance from the nested posture, not the object', () => {
    const i = init({ governance: { posture: 'open', licence: null, source: src } })
    expect((facet('governance') as { values: (x: unknown) => string[] }).values(i)).toEqual(['open'])
  })

  it('reads the application facet from the plural applications field', () => {
    const i = init({ applications: ['asr', 'tts'] })
    expect((facet('application') as { values: (x: unknown) => string[] }).values(i)).toEqual(['asr', 'tts'])
  })

  it('reads the regime facet from the snake_case data_regime field', () => {
    const i = init({ data_regime: '1k-10k' })
    expect((facet('regime') as { values: (x: unknown) => string[] }).values(i)).toEqual(['1k-10k'])
  })

  it('treats an absent value as not recorded, never as a value', () => {
    expect((facet('family') as { values: (x: unknown) => string[] }).values(lang({}))).toEqual([])
    expect((facet('typology') as { values: (x: unknown) => string[] }).values(lang({}))).toEqual([])
    expect((facet('endangerment') as { values: (x: unknown) => string[] }).values(lang({}))).toEqual([])
  })

  it('counts options and sorts them by value', () => {
    const ls = [lang({ id: 'a', region: 'oceania' }), lang({ id: 'b', region: 'africa' }), lang({ id: 'c', region: 'africa' })]
    expect(facetOptions(ls, facet('region') as never)).toEqual([
      { value: 'africa', count: 2 },
      { value: 'oceania', count: 1 },
    ])
  })

  it('counts records that carry nothing for the facet', () => {
    const ls = [lang({ id: 'a', region: 'africa' }), lang({ id: 'b' }), lang({ id: 'c' })]
    expect(notRecordedCount(ls, facet('region') as never)).toBe(2)
  })

  it('leaves the two data-derived facets out of the vocabulary map', () => {
    expect(VOCAB_FOR['family']).toBeUndefined()
    expect(VOCAB_FOR['method']).toBeUndefined()
    expect(VOCAB_FOR['region']).toContain('oceania')
  })

  it('uses a not-recorded sentinel no vocabulary value can collide with', () => {
    const all = Object.values(VOCAB_FOR).flatMap((v) => [...(v ?? [])])
    expect(all).not.toContain(NOT_RECORDED)
    expect(NOT_RECORDED.startsWith('_')).toBe(true)
  })
})
