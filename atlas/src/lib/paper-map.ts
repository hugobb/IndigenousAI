import type { Language, Paper, PaperLanguage } from '../schema/index.js'

export interface PaperMapInput {
  papers: Paper[]
  languages: Language[]
  paperLanguages: PaperLanguage[]
}

/** The papers that STUDY this language, per the curated mappings. */
export function papersForLanguage(input: PaperMapInput, languageId: string): Paper[] {
  const ids = new Set(
    input.paperLanguages.filter((m) => m.languages.includes(languageId)).map((m) => m.paper),
  )
  return input.papers.filter((p) => ids.has(p.id))
}

/** The two reasons a paper is not on the map, kept apart (spec D4).
 *
 *  `noLanguage` — no mapping names it. 59 of 92 papers in this corpus study no
 *  specific language at all: surveys, tokenizer methods, process papers. That
 *  is a property of the literature, not a sourcing gap.
 *
 *  `languageNotMapped` — mapped, but no language it maps to has a `centre`, so
 *  the map draws nothing for it (spec D3). Not an error and not a gap in the
 *  mapping: `choctaw`, `kanienkeha` and `amharic` all deliberately have no
 *  centre. Merging this with the group above would tell a reader the atlas
 *  knows nothing about a paper it has in fact placed. */
export function unmappedPapers(input: PaperMapInput): {
  noLanguage: Paper[]
  languageNotMapped: { paper: Paper; languages: Language[] }[]
} {
  const byPaper = new Map(input.paperLanguages.map((m) => [m.paper, m.languages]))
  const byId = new Map(input.languages.map((l) => [l.id, l]))
  const noLanguage: Paper[] = []
  const languageNotMapped: { paper: Paper; languages: Language[] }[] = []

  for (const p of input.papers) {
    const ids = byPaper.get(p.id)
    if (ids === undefined || ids.length === 0) {
      noLanguage.push(p)
      continue
    }
    const langs = ids.map((id) => byId.get(id)).filter((l): l is Language => l !== undefined)
    // Drawn if ANY of its languages can be drawn — the paper is visible on the
    // map, so reporting it as unmapped would contradict the map beside it.
    if (!langs.some((l) => l.centre !== null)) languageNotMapped.push({ paper: p, languages: langs })
  }
  return { noLanguage, languageNotMapped }
}
