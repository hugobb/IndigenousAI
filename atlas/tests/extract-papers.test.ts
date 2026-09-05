import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'
import { PaperSchema } from '../src/schema/paper.js'
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

describe('the committed derived artifact', () => {
  // A commit must not ship a tracked artifact that its own validator rejects.
  // Nothing else catches it: `gate.test.ts` reads only the ids out of this file
  // and `bundle.ts` reads it with a CAST rather than a parse, so a stale copy
  // stays invisible until `chooseBundle` throws in a production build — the
  // guard firing at the worst possible moment, on a machine that is deploying.
  //
  // Fix round 1 exists because the first Task 5 commit shipped exactly that:
  // 92 records holding repo paths, every one rejected by the `startsWith('/')`
  // the same commit added to `PaperSchema`. `data/derived/` is generator output
  // and must be regenerated whenever its generator changes; this is the test
  // that says so out loud.
  it('parses against the schema its own generator writes it with', () => {
    const path = fileURLToPath(new URL('../data/derived/papers.json', import.meta.url))
    const papers = z.array(PaperSchema).parse(JSON.parse(readFileSync(path, 'utf8')))
    expect(papers.length).toBeGreaterThan(0)
    // Not merely schema-valid — actually the route the generator would emit
    // today, so a file left behind by an older generator fails here even if the
    // old shape happened to satisfy the schema.
    for (const p of papers) expect(p.summary_url).toBe(summaryRoute(p.id))
  })
})
