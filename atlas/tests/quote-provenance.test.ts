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
})
