/** Where a mapping's quote sits inside its summary — spec D2's rule, isolated.
 *
 *  Every summary in `litterature_review/` ends with a
 *  `## Relevance to Indigenous AI` section in which the REVIEWER wrote about
 *  applicability to this project's Six Nations context. Measured 2026-09-05:
 *  86 of the 92 summaries name Mohawk/Kanien'kéha there and only 6 name it in
 *  their own subject matter. So "the language appears in the summary" is not
 *  evidence the paper studies it, and a rule built on that would produce a map
 *  with all 92 papers on one pin — looking entirely plausible.
 *
 *  Everything before the heading is the paper speaking. Everything from the
 *  heading on is the reviewer speaking about us. Only the first is evidence. */
export const RELEVANCE_HEADING = /^##\s*Relevance\b/m

export type QuoteProvenance = 'subject-matter' | 'relevance-only' | 'absent'

/** Collapse runs of whitespace so a YAML folded scalar compares equal to the
 *  source it was copied from. Without this, a correct quote whose line breaks
 *  fell differently is rejected for a reason invisible to the curator. */
const flat = (s: string): string => s.replace(/\s+/g, ' ').trim()

export function quoteProvenance(summary: string, quote: string): QuoteProvenance {
  const needle = flat(quote)
  if (needle === '') return 'absent'
  const m = RELEVANCE_HEADING.exec(summary)
  const head = flat(m === null ? summary : summary.slice(0, m.index))
  if (head.includes(needle)) return 'subject-matter'
  return flat(summary).includes(needle) ? 'relevance-only' : 'absent'
}
