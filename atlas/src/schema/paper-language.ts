import { z } from 'zod'
import { SourceSchema } from './source.js'
import { RECORD_STATUS } from './vocab.js'

/** Links one paper to the language(s) it STUDIES.
 *
 *  Separate from `data/derived/papers.json` because that file is generator
 *  output, rewritten by `pnpm extract:papers`, and from
 *  `litterature_review/OVERVIEW.md` because that tree is never edited. This is
 *  the only hand-curated place the link can live.
 *
 *  `source.quote` is mandatory and is the entire evidence for the mapping:
 *  spec D2 requires it to come from the paper's own subject matter, and
 *  `validate.ts` refuses a quote that appears in the summary only at or after
 *  `## Relevance to Indigenous AI`. A quote-less mapping could not be checked
 *  against that rule at all, so the schema does not permit one. */
export const PaperLanguageSchema = z.object({
  /** A paper id from `data/derived/papers.json`. Checked by `validate.ts`. */
  paper: z.string().min(1),
  /** Language ids from `data/languages/`. A paper may study more than one. */
  languages: z.array(z.string()).min(1, 'an entry must name at least one language'),
  source: SourceSchema.refine((s) => s.quote !== null && s.quote.trim() !== '', {
    message: 'a mapping needs a `quote`: the quote is the evidence for the mapping',
    path: ['quote'],
  }),
  /** The curator's hedge, carried into the bundle. YAML comments are dropped
   *  by `js-yaml.load`, so a hedge written as a comment never reaches a reader. */
  note: z.string().min(1).nullable().default(null),
  status: z.enum(RECORD_STATUS),
})

export type PaperLanguage = z.infer<typeof PaperLanguageSchema>
