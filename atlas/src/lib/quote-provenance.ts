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

/** A looser net than `RELEVANCE_HEADING`: any heading level, any case,
 *  containing "Relevance". All 92 real summaries carry the exact heading
 *  today, but the guide documents dozens more papers still to be added, and
 *  a future summary that spells the heading differently (`### Relevance...`,
 *  `## RELEVANCE...`) must not fall through to being treated as pure subject
 *  matter — that would silently promote reviewer commentary about US into
 *  evidence about the paper. This pattern exists only to CATCH that case, not
 *  to parse it: see `unrecognised-relevance-heading` below. */
const RELEVANCE_HEADING_LOOSE = /^#{1,6}\s*Relevance/im

/** `'unrecognised-relevance-heading'` is the fail-unsafe branch: the summary
 *  looks like it has a relevance section, but not in the one shape we know
 *  how to split on, so we refuse to guess where the paper's own words end. */
export type QuoteProvenance =
  | 'subject-matter'
  | 'relevance-only'
  | 'absent'
  | 'unrecognised-relevance-heading'

/** Collapse runs of whitespace so a YAML folded scalar compares equal to the
 *  source it was copied from. Without this, a correct quote whose line breaks
 *  fell differently is rejected for a reason invisible to the curator. */
const flat = (s: string): string => s.replace(/\s+/g, ' ').trim()

/** A markdown heading line is atomic: it forms a block by itself, distinct
 *  from the paragraphs around it. This is what lets "accepts a quote from
 *  the title" work while still refusing a quote spliced across a heading. */
const HEADING_LINE = /^#{1,6}\s/

/** Split a chunk of markdown into paragraph-ish blocks, breaking on blank
 *  lines and on heading lines. A quote is only real if SOME SINGLE block
 *  contains it whole — otherwise a phrase built from the tail of one
 *  sentence and the head of the next (or from either side of a heading)
 *  would read as one contiguous string once whitespace is flattened, and a
 *  quote the paper never wrote would be accepted as evidence. */
function splitBlocks(text: string): string[] {
  const lines = text.split('\n')
  const blocks: string[] = []
  let current: string[] = []
  const flushCurrent = (): void => {
    if (current.length > 0) {
      blocks.push(current.join('\n'))
      current = []
    }
  }
  for (const line of lines) {
    if (line.trim() === '') {
      flushCurrent()
      continue
    }
    if (HEADING_LINE.test(line)) {
      flushCurrent()
      blocks.push(line)
      continue
    }
    current.push(line)
  }
  flushCurrent()
  return blocks
}

/** True when some single block of `text` contains `needle` once each block
 *  (not the whole text) has had its internal whitespace flattened. */
function containsInSomeBlock(text: string, needle: string): boolean {
  return splitBlocks(text).some((block) => flat(block).includes(needle))
}

export function quoteProvenance(summary: string, quote: string): QuoteProvenance {
  const needle = flat(quote)
  if (needle === '') return 'absent'

  const exact = RELEVANCE_HEADING.exec(summary)
  if (exact === null) {
    // No exact heading. Before treating the whole summary as subject matter,
    // check whether it merely spells the heading differently — if so this is
    // the dangerous case a naive rule would silently get wrong, so refuse it.
    if (RELEVANCE_HEADING_LOOSE.test(summary)) return 'unrecognised-relevance-heading'
    return containsInSomeBlock(summary, needle) ? 'subject-matter' : 'absent'
  }

  const head = summary.slice(0, exact.index)
  const tail = summary.slice(exact.index)
  if (containsInSomeBlock(head, needle)) return 'subject-matter'
  return containsInSomeBlock(tail, needle) ? 'relevance-only' : 'absent'
}
