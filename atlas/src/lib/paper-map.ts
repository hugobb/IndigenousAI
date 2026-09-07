import type { Language, Paper, PaperLanguage } from '../schema/index.js'

export interface PaperMapInput {
  papers: Paper[]
  languages: Language[]
  paperLanguages: PaperLanguage[]
}

/** The papers that STUDY this language, per the curated mappings, paired with
 *  the mapping's own `note` — the curator's hedge on how strong that evidence
 *  is (spec D2, `PaperLanguageSchema.note`'s own doc comment: "the curator's
 *  hedge and it travels into the bundle"). Returning the bare `Paper[]` this
 *  used to return drops that hedge on the floor: `feng-et-al-2025-culfit`
 *  carries a note saying Amharic is one of 23 evaluation languages, not the
 *  paper's subject, and a reader of the bare list would see it listed
 *  identically to a title-level match with no qualifier at all. */
export function papersForLanguage(
  input: PaperMapInput,
  languageId: string,
): { paper: Paper; note: string | null }[] {
  const byId = new Map(input.papers.map((p) => [p.id, p]))
  return input.paperLanguages
    .filter((m) => m.languages.includes(languageId))
    .flatMap((m) => {
      const paper = byId.get(m.paper)
      return paper === undefined ? [] : [{ paper, note: m.note }]
    })
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
  // A paper may carry SEVERAL entries — one per evidential quote (spec D7): a
  // shared task reports results for languages that no single sentence names
  // together, and the location rule forbids stitching one. Keyed assignment
  // (`new Map(rows.map((m) => [m.paper, m.languages]))`) silently kept only the
  // last entry, so a paper mapped to a drawn language by one quote and an
  // undrawn one by another was reported by whichever happened to come last.
  const byPaper = new Map<string, string[]>()
  for (const m of input.paperLanguages) {
    byPaper.set(m.paper, [...(byPaper.get(m.paper) ?? []), ...m.languages])
  }
  const byId = new Map(input.languages.map((l) => [l.id, l]))
  const noLanguage: Paper[] = []
  const languageNotMapped: { paper: Paper; languages: Language[] }[] = []

  for (const p of input.papers) {
    const ids = byPaper.get(p.id)
    if (ids === undefined || ids.length === 0) {
      noLanguage.push(p)
      continue
    }
    // De-duplicated so a language named by two of a paper's quotes is listed once.
    const langs = [...new Set(ids)]
      .map((id) => byId.get(id))
      .filter((l): l is Language => l !== undefined)
    // Drawn if ANY of its languages can be drawn — the paper is visible on the
    // map, so reporting it as unmapped would contradict the map beside it.
    if (!langs.some((l) => l.centre !== null)) languageNotMapped.push({ paper: p, languages: langs })
  }
  return { noLanguage, languageNotMapped }
}
