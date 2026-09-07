import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { coverTermProblems, resolutionProblems } from '../src/lib/record-guards.js'
import { loadLanguages } from '../scripts/lib/load-records.js'
import { loadGlottologResolution } from '../scripts/lib/load-glottolog-resolution.js'

const LANGUAGES_DIR = fileURLToPath(new URL('../data/languages', import.meta.url))
const RESOLUTION_FILE = fileURLToPath(new URL('../data/glottolog-resolution.yml', import.meta.url))

/** `record-guards.test.ts` proves the guards' logic against synthetic
 *  fixtures. It cannot catch a real record drifting from the real
 *  `data/glottolog-resolution.yml` — only `pnpm validate` exercised both
 *  against the real files, and nothing in `pnpm test` did. A coordinate typo
 *  in a language record could therefore leave the whole suite green. This
 *  file closes that gap: it runs the two record-guard checks over the real
 *  `data/languages` directory and the real resolution file, exactly as
 *  `scripts/validate.ts` does, so a future record (Tasks 5 and 6 included)
 *  that disagrees with what Glottolog actually returned fails `pnpm test`,
 *  not only `pnpm validate`. */
describe('record guards against the real data', () => {
  // Same status filter validate.ts applies before running these two guards:
  // a rejected record is withdrawn from every gate, not merely excused from
  // the "status is draft" check.
  const languages = loadLanguages(LANGUAGES_DIR).filter((l) => l.status !== 'rejected')
  const resolution = loadGlottologResolution(RESOLUTION_FILE)

  it('has more than a handful of real records loaded (the check below is vacuous otherwise)', () => {
    expect(languages.length).toBeGreaterThan(5)
  })

  it('raises no coverTermProblems against the real language records', () => {
    expect(coverTermProblems(languages)).toEqual([])
  })

  it('raises no resolutionProblems against the real language records and resolution file', () => {
    expect(resolutionProblems(languages, resolution)).toEqual([])
  })
})
