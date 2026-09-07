import { describe, expect, it } from 'vitest'
import { coverTermProblems, resolutionProblems } from '../src/lib/record-guards.js'
import { LanguageSchema, type GlottologResolution, type Language, type Source } from '../src/schema/index.js'

const src = (): Source => ({ kind: 'url', ref: 'https://glottolog.org/', retrieved: '2026-09-06', quote: 'q' })
// NonNullable, not `Language['centre']`: this always returns an object, never
// null, and a nullable return type here makes `{ ...centre(), confidence:
// 'approximate' }` below infer every spread property as optional — which
// then fails to satisfy the non-null centre shape it is spread into.
const centre = (o: Partial<{ lat: number; lon: number }> = {}): NonNullable<Language['centre']> =>
  ({ lat: o.lat ?? 35.4664, lon: o.lon ?? -83.163, source: src(), confidence: 'sourced' })
/** Over LanguageSchema.parse so schema defaults fill in and the fixture cannot
 *  drift from the real record shape. `name` has no schema default (unlike
 *  everything else this leaves unset), so it defaults to `id` here — nothing
 *  under test reads it. */
const lang = (o: Partial<Language> & { id: string }): Language =>
  LanguageSchema.parse({ tier: 'indigenous', status: 'draft', name: o.id, ...o })
const res = (o: Partial<GlottologResolution> & { glottocode: string }): GlottologResolution => ({
  searched: o.glottocode, name: 'X', level: 'language', iso639_3: null,
  latitude: null, longitude: null, classification: [], retrieved: '2026-09-06', note: null, ...o,
})

describe('coverTermProblems', () => {
  it('accepts an indigenous record with a centre', () => {
    expect(coverTermProblems([lang({ id: 'a', tier: 'indigenous', centre: centre(), caveat: null })])).toEqual([])
  })

  it('refuses an indigenous record with no centre and no caveat', () => {
    // D8: a cover term has no centre. Without a caveat the reader cannot tell
    // a cover term from a language whose centre simply was not sourced, and
    // the panel prints "not mapped" for both.
    const problems = coverTermProblems([lang({ id: 'quechua', tier: 'indigenous', centre: null, caveat: null })])
    expect(problems).toHaveLength(1)
    expect(problems[0]).toContain('quechua')
  })

  it('accepts an indigenous record with no centre when it carries a caveat', () => {
    expect(coverTermProblems([
      lang({ id: 'quechua', tier: 'indigenous', centre: null, caveat: 'A cover term spanning 43 Glottolog languages.' }),
    ])).toEqual([])
  })

  it('does not require a caveat of an adjacent record', () => {
    // D6 gives every adjacent record centre: null by rule, so requiring a
    // caveat there would demand an explanation of the rule on every row.
    expect(coverTermProblems([lang({ id: 'persian', tier: 'adjacent', centre: null, caveat: null })])).toEqual([])
  })
})

describe('resolutionProblems', () => {
  const cherokee = res({ searched: 'Cherokee', glottocode: 'cher1273', level: 'language', latitude: 35.4664, longitude: -83.163 })

  it('accepts a record whose glottocode and centre match the resolution', () => {
    expect(resolutionProblems(
      [lang({ id: 'cherokee', glottocode: 'cher1273', centre: centre({ lat: 35.4664, lon: -83.163 }) })],
      [cherokee],
    )).toEqual([])
  })

  it('refuses a glottocode that appears in no resolution row', () => {
    const problems = resolutionProblems([lang({ id: 'x', glottocode: 'zzzz9999' })], [cherokee])
    expect(problems.some((p) => p.includes('zzzz9999'))).toBe(true)
  })

  it('refuses a family-level glottocode on a language record', () => {
    // The schema's pattern cannot tell a family code from a language code.
    const family = res({ searched: 'Quechua', glottocode: 'quec1387', level: 'family', latitude: null, longitude: null })
    const problems = resolutionProblems([lang({ id: 'quechua', glottocode: 'quec1387' })], [family])
    expect(problems.some((p) => p.includes('quec1387') && p.includes('family'))).toBe(true)
  })

  it('refuses a centre that disagrees with the fetched coordinates', () => {
    const problems = resolutionProblems(
      [lang({ id: 'cherokee', glottocode: 'cher1273', centre: centre({ lat: 35.5, lon: -83.163 }) })],
      [cherokee],
    )
    expect(problems.some((p) => p.includes('cherokee'))).toBe(true)
  })

  it('accepts a dialect-level glottocode on a record', () => {
    // Glottolog gives a dialect no coordinate, so such a record carries
    // centre: null — but the code itself identifies the lect precisely and is
    // not the category error a family code would be.
    const dialect = res({ searched: 'SENĆOŦEN', glottocode: 'saan1246', level: 'dialect', latitude: null, longitude: null })
    expect(resolutionProblems([lang({ id: 'sencoten', glottocode: 'saan1246', centre: null, caveat: 'c' })], [dialect])).toEqual([])
  })

  it('exempts an approximate centre from the coordinate check', () => {
    expect(resolutionProblems(
      [lang({ id: 'myaamia', glottocode: 'cher1273', centre: { ...centre({ lat: 40, lon: -90 }), confidence: 'approximate' } })],
      [cherokee],
    )).toEqual([])
  })

  it('ignores a record with no glottocode', () => {
    // D8 cover terms carry glottocode: null deliberately.
    expect(resolutionProblems([lang({ id: 'quechua', glottocode: null, centre: null })], [cherokee])).toEqual([])
  })
})
