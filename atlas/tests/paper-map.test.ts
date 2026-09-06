import { describe, expect, it } from 'vitest'
import { papersForLanguage, unmappedPapers } from '../src/lib/paper-map.js'
import type { Language, Paper, PaperLanguage } from '../src/schema/index.js'

const paper = (id: string): Paper => ({
  id, title: id, authors: 'A', year: 2024, venue: null, themes: [], summary_url: `/summaries/${id}/`,
})
const lang = (id: string, mapped: boolean): Language => ({
  id, name: id, also_known_as: [], glottocode: 'x', iso639_3: 'x', tier: 'indigenous',
  family: 'f', subfamily: null, typology: [], endangerment: null, speakers: null,
  region: 'north-america', countries: ['US'], caveat: null, status: 'verified',
  centre: mapped ? { lat: 1, lon: 2, source: { kind: 'url', ref: 'r', retrieved: '2026-01-01', quote: null }, confidence: 'sourced' } : null,
} as Language)
const map = (p: string, langs: string[]): PaperLanguage => ({
  paper: p, languages: langs,
  source: { kind: 'paper', ref: 'r', retrieved: null, quote: 'q' }, note: null, status: 'verified',
})

const BUNDLE = {
  papers: [paper('drawn'), paper('undrawn'), paper('placeless')],
  languages: [lang('has-centre', true), lang('no-centre', false)],
  paperLanguages: [map('drawn', ['has-centre']), map('undrawn', ['no-centre'])],
}

describe('papersForLanguage', () => {
  it('returns the papers that study that language', () => {
    expect(papersForLanguage(BUNDLE, 'has-centre').map((p) => p.id)).toEqual(['drawn'])
  })
  it('returns nothing for a language nothing studies', () => {
    expect(papersForLanguage(BUNDLE, 'unstudied')).toEqual([])
  })
})

describe('unmappedPapers', () => {
  /** Spec D4: two REASONS, never merged. A paper nobody mapped and a paper
   *  mapped to a language the map cannot draw are different facts, and a reader
   *  who cannot tell them apart learns the wrong thing about coverage. */
  it('separates "no language named" from "language has no centre"', () => {
    const { noLanguage, languageNotMapped } = unmappedPapers(BUNDLE)
    expect(noLanguage.map((p) => p.id)).toEqual(['placeless'])
    expect(languageNotMapped.map((x) => x.paper.id)).toEqual(['undrawn'])
    expect(languageNotMapped[0]?.languages.map((l) => l.id)).toEqual(['no-centre'])
  })

  /** Spec D3's consequence, asserted rather than assumed: a mapped paper is not
   *  necessarily a drawn paper. In SP3a this is the MAJORITY case — 8 of 11
   *  mappable papers map to kanienkeha or amharic, neither of which has a
   *  centre. */
  it('does not count a drawn paper as unmapped', () => {
    const { noLanguage, languageNotMapped } = unmappedPapers(BUNDLE)
    const ids = [...noLanguage, ...languageNotMapped.map((x) => x.paper)].map((p) => p.id)
    expect(ids).not.toContain('drawn')
  })

  /** A paper mapped to two languages, one drawable, is DRAWN — it appears on
   *  the map, so listing it as unmapped would contradict the map beside it. */
  it('treats a paper as drawn when any of its languages has a centre', () => {
    const b = { ...BUNDLE, paperLanguages: [map('undrawn', ['no-centre', 'has-centre'])] }
    expect(unmappedPapers(b).languageNotMapped).toEqual([])
  })
})
