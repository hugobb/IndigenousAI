import { describe, expect, it } from 'vitest'
import { fileURLToPath } from 'node:url'
import { extractPapers } from '../scripts/extract-papers.js'

const ROOT = fileURLToPath(new URL('./fixtures/review', import.meta.url))

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
})
