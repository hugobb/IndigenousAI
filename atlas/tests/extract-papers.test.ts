import { describe, expect, it } from 'vitest'
import { fileURLToPath } from 'node:url'
import { extractPapers } from '../scripts/extract-papers.js'
import { summaryRoute } from '../scripts/copy-summaries.js'

const ROOT = fileURLToPath(new URL('./fixtures/review', import.meta.url))
const BROKEN = fileURLToPath(new URL('./fixtures/review-broken', import.meta.url))

describe('extractPapers', () => {
  const papers = extractPapers(ROOT)

  it('reads every row of the OVERVIEW index table', () => {
    expect(papers).toHaveLength(2)
  })

  it('ignores prose containing pipe characters', () => {
    expect(papers.map((p) => p.title)).not.toContain('pipe')
  })

  it('takes the id from the summary link, not the row number', () => {
    expect(papers.map((p) => p.id)).toEqual(['alpha-et-al-2025-thing', 'beta-et-al-2025-other'])
  })

  it('parses title, authors and year from the table', () => {
    const p = papers[0]
    expect(p?.title).toBe('A Thing About Language')
    expect(p?.authors).toBe('Alpha et al.')
    expect(p?.year).toBe(2025)
  })

  it('splits themes into a list', () => {
    expect(papers[0]?.themes).toEqual(['evaluation', 'low-resource-nlp'])
  })

  it('takes venue from a **Venue:** header when present', () => {
    expect(papers[0]?.venue).toBe('Proceedings of ACL 2025')
  })

  it('leaves venue null for the **Citation:** format rather than guessing', () => {
    expect(papers[1]?.venue).toBeNull()
  })

  // The route is CONSUMED from `copy-summaries.ts`, never derived a second
  // time here: `copySummaries` decides where a summary is published, and two
  // derivations that drift by one character turn every citation in the atlas
  // into a 404 nothing else in the system can see. Asserted against
  // `summaryRoute` rather than a literal so this test cannot itself become the
  // second derivation.
  it('gives every paper the published route for its summary, not a repo path', () => {
    for (const p of papers) expect(p.summary_url).toBe(summaryRoute(p.id))
    expect(papers[0]?.summary_url).toBe('/summaries/alpha-et-al-2025-thing/')
  })
})

describe('the row-count invariant', () => {
  // The real corpus yields 92 of 92, so this asserts something silently true
  // today: a title containing `]`, or a `|` inside a cell, must not lose a
  // paper the way it used to — quietly, with `continue`.
  it('throws naming the index rows that failed to parse', () => {
    expect(() => extractPapers(BROKEN)).toThrow(/3 index row\(s\) but only 1 parsed/)
    expect(() => extractPapers(BROKEN)).toThrow(/row\(s\) 2, 3/)
  })

  it('does not throw on the well-formed corpus fixture', () => {
    expect(() => extractPapers(ROOT)).not.toThrow()
  })
})
