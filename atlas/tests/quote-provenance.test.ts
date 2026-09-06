import { describe, expect, it } from 'vitest'
import { quoteProvenance } from '../src/lib/quote-provenance.js'

/** Measured on the real corpus 2026-09-05: 86 of 92 summaries name Mohawk ONLY
 *  inside `## Relevance to Indigenous AI`, the section where the reviewer wrote
 *  about applicability to THIS project. A mapping built from such a sentence is
 *  indistinguishable by eye from a correct one, and would pin the whole corpus
 *  to Six Nations. This function is the only thing standing in front of that. */
const SUMMARY = `# A Paper About Nahuatl

**Authors:** Someone
**Year:** 2024

## Core Argument

We evaluate machine translation for Nahuatl.

## Relevance to Indigenous AI

The approach would transfer to Mohawk at Six Nations.
`

describe('quoteProvenance', () => {
  it('accepts a quote from the paper’s own subject matter', () => {
    expect(quoteProvenance(SUMMARY, 'machine translation for Nahuatl')).toBe('subject-matter')
  })

  it('accepts a quote from the title', () => {
    expect(quoteProvenance(SUMMARY, 'A Paper About Nahuatl')).toBe('subject-matter')
  })

  it('REFUSES a quote that appears only in the relevance section', () => {
    expect(quoteProvenance(SUMMARY, 'transfer to Mohawk at Six Nations')).toBe('relevance-only')
  })

  it('reports a quote that is in the summary nowhere', () => {
    expect(quoteProvenance(SUMMARY, 'a sentence nobody wrote')).toBe('absent')
  })

  /** A quote appearing in BOTH halves is subject-matter: the paper does say it.
   *  Reading it as relevance-only would reject correct mappings for the
   *  accident of the reviewer repeating a phrase. */
  it('is subject-matter when the phrase occurs in both halves', () => {
    expect(quoteProvenance(SUMMARY, 'Nahuatl')).toBe('subject-matter')
  })

  /** Whitespace in YAML block scalars is not the whitespace in the source file:
   *  a folded quote arrives with newlines collapsed to spaces. Comparing raw
   *  would reject correct quotes for a reason no curator could see. */
  it('normalises whitespace on both sides before comparing', () => {
    expect(quoteProvenance('## Core\n\nwe  evaluate\nmachine translation', 'we evaluate machine translation')).toBe('subject-matter')
  })

  /** A summary with no relevance heading is all subject matter. */
  it('treats a summary with no relevance section as entirely subject matter', () => {
    expect(quoteProvenance('# T\n\nwe study Cree', 'we study Cree')).toBe('subject-matter')
  })

  /** Fix-round-1, finding 1: `RELEVANCE_HEADING` only matches the exact
   *  `## Relevance` shape. Before this fix, a `###`-level (or otherwise
   *  spelled) relevance heading made `exec` return null, so the WHOLE
   *  summary — reviewer commentary included — was silently promoted to
   *  subject matter. That is the corpus-wide mispin this function exists to
   *  prevent, and it must fail loudly (as this new variant), not silently. */
  it('treats an unrecognised relevance heading as dangerous, not subject matter', () => {
    const summaryWithWrongHeadingLevel = `# A Paper About Nahuatl

## Core Argument

We evaluate machine translation for Nahuatl.

### Relevance to Indigenous AI

The approach would transfer to Mohawk at Six Nations.
`
    expect(quoteProvenance(summaryWithWrongHeadingLevel, 'machine translation for Nahuatl')).toBe(
      'unrecognised-relevance-heading',
    )
    expect(quoteProvenance(summaryWithWrongHeadingLevel, 'transfer to Mohawk at Six Nations')).toBe(
      'unrecognised-relevance-heading',
    )
  })

  /** Fix-round-1, finding 2: flattening the ENTIRE head into one string let a
   *  quote spliced from the tail of one paragraph and the head of the next
   *  read as one contiguous substring, and be accepted as subject-matter
   *  even though the paper never wrote that phrase as a run of text. */
  it('refuses a quote spliced across a paragraph boundary', () => {
    const summary = '## Core\n\nWe evaluate machine translation.\n\nThe results are strong.'
    expect(quoteProvenance(summary, 'translation. The results')).toBe('absent')
  })

  /** Same defect, but the splice crosses a sub-heading rather than a blank
   *  line — a heading must be its own block too, not glue between blocks. */
  it('refuses a quote spliced across a heading boundary', () => {
    const summary = '## Core\n\nWe evaluate machine translation.\n\n### Results\n\nThe results are strong.'
    expect(quoteProvenance(summary, 'machine translation. The results are strong')).toBe('absent')
  })

  /** The test above is already split by blank lines on both sides of
   *  `### Results`, so it passes whether or not `HEADING_LINE` does anything
   *  at all — the heading rule in `splitBlocks` was never the thing deciding
   *  it. This fixture has NO blank line anywhere near the heading, so blank
   *  lines alone would merge all three lines into one block and the spliced
   *  quote below WOULD be found there; only the heading-line rule keeps them
   *  apart. Mutation-checked: deleting the `HEADING_LINE.test(line)` branch
   *  from `splitBlocks` turns this failing (RED); restoring it turns it
   *  passing (GREEN) again. See the fix report for both runs. */
  it('refuses a quote spliced across a heading with no surrounding blank line', () => {
    const summary = 'We evaluate machine translation.\n### Results\nThe results are strong.'
    expect(quoteProvenance(summary, 'machine translation.\n### Results\nThe results are strong.')).toBe('absent')
  })
})
