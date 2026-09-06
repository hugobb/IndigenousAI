import { describe, expect, it } from 'vitest'
import { emptyRecordSetProblem } from '../scripts/lib/empty-record-set.js'

/** The hole this closes, found by the SP2b re-review.
 *
 *  `validate.ts` fails on any `status: draft` but passes a set that is entirely
 *  `rejected` — deliberately, because rejected is an OUTCOME of review, not an
 *  error. `bundle.ts` then filters to `status === 'verified'`, which leaves
 *  `languages: []` and `initiatives: []`. `recordDirStatus` does not catch it:
 *  it asks whether the directory can be listed, and it can — every file is
 *  present, readable, and reviewed.
 *
 *  So an atlas carrying no pins at all bundles green, builds green, and
 *  publishes as the real app. Nothing between validate and deploy refuses it. */

describe('emptyRecordSetProblem', () => {
  it('refuses a bundle with no records on either side', () => {
    const problem = emptyRecordSetProblem({ languages: [], initiatives: [] })
    expect(problem).toMatch(/no verified records/i)
    // Tells the reader what to do next, and does not assert a cause it cannot
    // observe: with every record still `draft`, naming `rejected` as the reason
    // would have been false.
    expect(problem).toMatch(/status: verified/)
  })

  it('permits a bundle carrying records', () => {
    expect(emptyRecordSetProblem({ languages: [{}], initiatives: [{}] })).toBeNull()
  })

  /** Deliberately narrow: it refuses the EMPTY set, not a lopsided one.
   *  Verified languages with every initiative rejected is a thin atlas, not a
   *  broken one, and it is a state a curator working through the review queue
   *  can legitimately reach. A guard that refused it would block real work to
   *  prevent a case nothing has shown to be wrong. */
  it('permits languages with no initiatives, and the reverse', () => {
    expect(emptyRecordSetProblem({ languages: [{}], initiatives: [] })).toBeNull()
    expect(emptyRecordSetProblem({ languages: [], initiatives: [{}] })).toBeNull()
  })
})
