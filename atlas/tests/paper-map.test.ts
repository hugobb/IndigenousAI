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
const map = (p: string, langs: string[], note: string | null = null): PaperLanguage => ({
  paper: p, languages: langs,
  source: { kind: 'paper', ref: 'r', retrieved: null, quote: 'q' }, note, status: 'verified',
})

const BUNDLE = {
  papers: [paper('drawn'), paper('undrawn'), paper('placeless')],
  languages: [lang('has-centre', true), lang('no-centre', false)],
  paperLanguages: [map('drawn', ['has-centre']), map('undrawn', ['no-centre'])],
}

describe('papersForLanguage', () => {
  it('returns the papers that study that language', () => {
    expect(papersForLanguage(BUNDLE, 'has-centre').map((x) => x.paper.id)).toEqual(['drawn'])
  })
  it('returns nothing for a language nothing studies', () => {
    expect(papersForLanguage(BUNDLE, 'unstudied')).toEqual([])
  })
  /** The whole point of returning `{ paper, note }` instead of a bare `Paper`
   *  (FIX 1 of the whole-branch review): a mapping's `note` is the curator's
   *  hedge and the schema's own doc comment says it "travels into the
   *  bundle" — dropping it here is how it stopped reaching `LanguagePanel`. */
  it('carries the mapping’s note alongside its paper', () => {
    const b = {
      ...BUNDLE,
      paperLanguages: [map('drawn', ['has-centre'], 'weaker than title-level evidence')],
    }
    expect(papersForLanguage(b, 'has-centre')).toEqual([
      { paper: b.papers[0], note: 'weaker than title-level evidence' },
    ])
  })
  it('reports no note when the mapping does not carry one', () => {
    expect(papersForLanguage(BUNDLE, 'has-centre')).toEqual([{ paper: BUNDLE.papers[0], note: null }])
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

  it('aggregates a paper’s languages across several entries rather than overwriting', () => {
    // D7: a shared task needs one entry per quote. `drawn` has a centre and
    // `undrawn` does not, so if the second entry overwrites the first the paper
    // is wrongly reported as languageNotMapped.
    const result = unmappedPapers({
      papers: [paper('shared-task')],
      languages: [lang('drawn', true), lang('undrawn', false)],
      paperLanguages: [map('shared-task', ['undrawn']), map('shared-task', ['drawn'])],
    })
    expect(result.languageNotMapped).toEqual([])
    expect(result.noLanguage).toEqual([])
  })

  it('reports a paper as languageNotMapped only when NO entry names a drawn language', () => {
    const result = unmappedPapers({
      papers: [paper('shared-task')],
      languages: [lang('undrawn', false), lang('also-undrawn', false)],
      paperLanguages: [map('shared-task', ['undrawn']), map('shared-task', ['also-undrawn'])],
    })
    expect(result.languageNotMapped.map((x) => x.paper.id)).toEqual(['shared-task'])
    // Both languages travel to the UI, not just the last entry’s.
    expect(result.languageNotMapped[0]?.languages.map((l) => l.id).sort()).toEqual(['also-undrawn', 'undrawn'])
  })
})
