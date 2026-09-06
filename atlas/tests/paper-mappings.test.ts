import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { loadPaperLanguages, paperLanguagesFileStatus } from '../scripts/lib/load-paper-languages.js'
import { quoteProvenance } from '../src/lib/quote-provenance.js'
import { loadLanguages } from '../scripts/lib/load-records.js'

const url = (p: string): string => fileURLToPath(new URL(p, import.meta.url))
const FILE = url('../data/paper-languages.yml')
const SUMMARIES = url('../../litterature_review/summaries')
const paperIds = new Set(
  (JSON.parse(readFileSync(url('../data/derived/papers.json'), 'utf8')) as { id: string }[]).map((p) => p.id),
)

describe('the curated paper-language mappings', () => {
  const rows = loadPaperLanguages(FILE)
  const languages = loadLanguages(url('../data/languages'))
  /** Every surface form (`name` plus `also_known_as`) a language record
   *  offers, lowercased. Built from the record rather than hardcoded so this
   *  test keeps working as records change — a new alias in `also_known_as`
   *  is picked up automatically, and a renamed language cannot go stale. */
  const surfaceForms = new Map<string, string[]>(
    languages.map((l) => [l.id, [l.name, ...l.also_known_as].map((s) => s.toLowerCase())]),
  )

  it('the file exists and is non-empty', () => {
    expect(paperLanguagesFileStatus(FILE)).toBe('ok')
    expect(rows.length).toBeGreaterThan(0)
  })

  it('every paper id resolves against data/derived/papers.json', () => {
    expect(rows.filter((r) => !paperIds.has(r.paper)).map((r) => r.paper)).toEqual([])
  })

  it('every language id resolves against data/languages/', () => {
    const known = new Set(loadLanguages(url('../data/languages')).map((l) => l.id))
    const bad = rows.flatMap((r) => r.languages.filter((l) => !known.has(l)).map((l) => `${r.paper} -> ${l}`))
    expect(bad).toEqual([])
  })

  it('names each paper at most once', () => {
    const seen = new Set<string>()
    const dupes = rows.filter((r) => (seen.has(r.paper) ? true : (seen.add(r.paper), false)))
    expect(dupes.map((r) => r.paper)).toEqual([])
  })

  /** Spec D2, applied to the real corpus. This is the test that stops the atlas
   *  pinning 92 papers to Six Nations on the strength of the reviewer's own
   *  relevance notes. */
  it('sources every quote from the paper’s own subject matter, never the relevance section', () => {
    const bad = rows
      .map((r) => ({
        paper: r.paper,
        where: quoteProvenance(readFileSync(`${SUMMARIES}/${r.paper}.md`, 'utf8'), r.source.quote ?? ''),
      }))
      .filter((x) => x.where !== 'subject-matter')
    expect(bad).toEqual([])
  })

  it('ships nothing as verified: promotion is the maintainer’s signature', () => {
    expect(rows.filter((r) => r.status === 'verified')).toEqual([])
  })

  /** Being sourced from the right SECTION (the test above) says nothing about
   *  whether the quote actually names the language it is mapped to. A quote
   *  could sit safely before the Relevance heading and still not mention the
   *  language at all. Surface forms come from the language record itself
   *  (`name` + `also_known_as`), not a hardcoded list, so this keeps working
   *  as records change. */
  it('names the mapped language somewhere in its own quote', () => {
    const bad = rows.flatMap((r) => {
      const quote = (r.source.quote ?? '').toLowerCase()
      return r.languages
        .filter((lang) => !(surfaceForms.get(lang) ?? []).some((form) => quote.includes(form)))
        .map((lang) => `${r.paper} -> ${lang}`)
    })
    expect(bad).toEqual([])
  })
})
