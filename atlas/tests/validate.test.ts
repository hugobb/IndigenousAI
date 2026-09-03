import { describe, expect, it } from 'vitest'
import { validate } from '../scripts/validate.js'
import type { Initiative, Language } from '../src/schema/index.js'

const src = { kind: 'url' as const, ref: 'https://example.test', retrieved: '2026-09-03', quote: null }

const lang = (over: Partial<Language> = {}): Language => ({
  id: 'kanienkeha', name: "Kanien'kéha", also_known_as: [], glottocode: null, iso639_3: null,
  tier: 'indigenous', family: 'Iroquoian', subfamily: null, typology: ['polysynthetic'],
  endangerment: null, speakers: null, region: 'north-america', countries: ['CA'],
  centre: null, status: 'verified', ...over,
})

const init = (over: Partial<Initiative> = {}): Initiative => ({
  id: 'onkwawenna', name: 'Onkwawenna Kentyohkwa', kind: 'organisation', tier: 'indigenous',
  languages: ['kanienkeha'], started: 1999, ended: null,
  site: { lat: 43.13, lon: -79.92, place: 'Six Nations', source: src },
  applications: ['education'], methods: [], models: [], data_regime: null, governance: null,
  papers: [], links: [], transferability: null, status: 'verified', ...over,
})

const base = { methodIds: new Set(['fst-morphological-segmentation']), paperIds: new Set(['x-2025']) }

describe('validate', () => {
  it('passes a consistent dataset', () => {
    expect(validate({ languages: [lang()], initiatives: [init()], ...base })).toEqual([])
  })

  it('fails when a record is still draft, naming it', () => {
    const problems = validate({ languages: [lang({ status: 'draft' })], initiatives: [init()], ...base })
    expect(problems).toHaveLength(1)
    expect(problems[0]).toMatch(/kanienkeha/)
    expect(problems[0]).toMatch(/draft/)
  })

  it('excludes rejected records instead of failing on them', () => {
    const problems = validate({
      languages: [lang(), lang({ id: 'dropped', status: 'rejected' })],
      initiatives: [init()], ...base,
    })
    expect(problems).toEqual([])
  })

  it('fails an initiative referencing an unknown language', () => {
    const problems = validate({ languages: [lang()], initiatives: [init({ languages: ['atlantis'] })], ...base })
    expect(problems[0]).toMatch(/atlantis/)
  })

  it('fails an initiative referencing an unknown method', () => {
    const problems = validate({ languages: [lang()], initiatives: [init({ methods: ['telepathy'] })], ...base })
    expect(problems[0]).toMatch(/telepathy/)
  })

  it('fails an initiative referencing an unknown paper', () => {
    const problems = validate({ languages: [lang()], initiatives: [init({ papers: ['nope-1999'] })], ...base })
    expect(problems[0]).toMatch(/nope-1999/)
  })

  it('fails on duplicate ids', () => {
    const problems = validate({ languages: [lang(), lang()], initiatives: [init()], ...base })
    expect(problems[0]).toMatch(/duplicate/i)
  })

  it('reports every problem at once rather than stopping at the first', () => {
    const problems = validate({
      languages: [lang({ status: 'draft' })],
      initiatives: [init({ methods: ['telepathy'], papers: ['nope-1999'] })],
      ...base,
    })
    expect(problems.length).toBeGreaterThanOrEqual(3)
  })
})
