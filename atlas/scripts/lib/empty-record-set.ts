/** Why this bundle must not be published, or `null` if it may be.
 *
 *  `recordDirStatus` catches one way to end up with an atlas carrying no pins —
 *  a record directory that was renamed or became unreadable. This catches the
 *  other, which has no filesystem symptom at all: every record present,
 *  readable, and reviewed to `status: rejected`.
 *
 *  Nothing between review and deploy refused that set. `validate.ts` passes it
 *  by design (rejected is an outcome of review, not an error), `bundle.ts`
 *  filters to `verified` and writes two empty arrays, and the app builds and
 *  ships a map with nothing on it.
 *
 *  Takes the bundle rather than two counts on purpose: the guard reads the
 *  object that is about to be written, so it cannot drift from what ships.
 *
 *  Deliberately narrow — it refuses the EMPTY set, not a lopsided one.
 *  Verified languages with every initiative rejected is a thin atlas, not a
 *  broken one, and a curator working through `data/REVIEW-QUEUE.md` can
 *  legitimately be there. */
export function emptyRecordSetProblem(bundle: {
  languages: readonly unknown[]
  initiatives: readonly unknown[]
}): string | null {
  if (bundle.languages.length > 0 || bundle.initiatives.length > 0) return null
  // Says only what is observable from the bundle. An earlier wording named
  // `rejected` as the cause, which would have been simply false today: all ten
  // records are `draft`. A guard that misreports why it fired sends its reader
  // to the wrong file.
  return (
    'no verified records — the bundle would carry no pins at all, so it was not ' +
    'written. Every record is `draft` or `rejected`; `pnpm validate` says which. ' +
    'Set at least one to `status: verified`, or leave the atlas unpublished.'
  )
}
