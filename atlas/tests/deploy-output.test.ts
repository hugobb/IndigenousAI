import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative, resolve } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { atlasIndexBranch, atlasIndexProblems, expectedBranch } from './lib/atlas-index.js'
import { loadInitiatives, loadLanguages } from '../scripts/lib/load-records.js'
import { loadPaperLanguages } from '../scripts/lib/load-paper-languages.js'

/** Excluded from `pnpm test` in vitest.config.ts and run only by `pnpm test:site`:
 *  it shells out to scripts/build-site.sh, which runs `pip install` and
 *  `pnpm install`. The default unit run stays offline and fast. */

const REPO = resolve(import.meta.dirname, '../..')
const out = mkdtempSync(join(tmpdir(), 'atlas-deploy-'))
afterAll(() => rmSync(out, { recursive: true, force: true }))

/** Every invented-record identifier found in the emitted tree, as
 *  `<path>: <needle>`.
 *
 *  Returns the hits rather than the haystack, the way `leaks()` in
 *  build-artifact.test.ts does. An earlier version concatenated all ~6 MB of
 *  emitted HTML/JS/JSON/CSS and asserted `not.toMatch(/fixture-/)` on it, which
 *  worked — but a failure printed the whole deployed tree, several hundred KB of
 *  MkDocs' bundled Lunr stemmers included, before it reached the assertion. The
 *  one time this guard fires will be the one time somebody needs to read it. */
function fixtureLeaks(dir: string): string[] {
  const hits: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true, recursive: true })) {
    if (!entry.isFile()) continue
    if (!/\.(html|js|json|css)$/.test(entry.name)) continue
    const p = join(entry.parentPath, entry.name)
    const found = new Set(readFileSync(p, 'utf8').match(/fixture-[\w-]*/g) ?? [])
    for (const needle of found) hits.push(`${relative(dir, p)}: ${needle}`)
  }
  return hits.sort()
}

describe('the deployed tree', () => {
  it(
    'builds, and puts something at /atlas/',
    () => {
      execFileSync('bash', [join(REPO, 'scripts/build-site.sh')], {
        cwd: REPO,
        env: { ...process.env, SITE_OUT: out },
        stdio: 'pipe',
      })
      expect(existsSync(join(out, 'index.html'))).toBe(true)
      expect(existsSync(join(out, 'atlas/index.html'))).toBe(true)
    },
    900_000,
  )

  // The whole point. While `build:data` exits non-zero the atlas cannot ship
  // data, and the ONLY acceptable substitute is the hand-written holding page.
  // The fixture is invented; `ATLAS_ALLOW_NO_BUNDLE=1` compiles an app with no
  // data. Either reaching a deployable tree is the failure this guards.
  it('never emits a fixture record, whichever path /atlas/ took', () => {
    expect(fixtureLeaks(out)).toEqual([])
  })

  /** `build-site.sh` publishes ONE of two things at /atlas/, and which one swaps
   *  over exactly once: the holding page while `pnpm build:data` exits non-zero,
   *  the built app the day the ten curated records are promoted.
   *
   *  This used to assert the holding page unconditionally, which would have
   *  failed ON THAT PROMOTION — turning CI's `site` job red at the moment
   *  `records-reviewed` finally went green, on a repository whose release
   *  procedure is "push, promote, then tag". So it checks the branch the tree
   *  actually took. `atlasIndexProblems` is pure and both of its branches are
   *  covered in tests/atlas-index.test.ts; only the holding one can be reached
   *  by a real build today. */
  it('publishes a coherent /atlas/, whichever branch the build took', () => {
    const dir = join(out, 'atlas')
    const html = readFileSync(join(dir, 'index.html'), 'utf8')
    const files = readdirSync(dir, { recursive: true }).map(String)
    // Resolved against the WHOLE deployed tree, not just /atlas/: the holding
    // page links out into the guide.
    const routeExists = (r: string): boolean =>
      existsSync(join(out, r, 'index.html')) || existsSync(join(out, r))
    expect(atlasIndexProblems(html, files, routeExists)).toEqual([])
  })

  /** Which branch it took, checked against the RECORDS rather than stated as a
   *  constant. `expect(…).toBe('holding')` is what stood here, and it would have
   *  failed on the promotion — reintroducing, inside the fix for it, exactly the
   *  timing that fix removed: `pnpm test:site` red at the moment
   *  `records-reviewed` goes green.
   *
   *  Read the way round that matters: an app published at /atlas/ while any
   *  record is still `status: draft` is the review gate breached on the tree
   *  that actually deploys, and nothing else looks at that. */
  it('serves the branch the record review state calls for', () => {
    const html = readFileSync(join(out, 'atlas/index.html'), 'utf8')
    const data = join(REPO, 'atlas/data')
    // THREE record types can each independently block `build:data` and put
    // the holding page up: languages, initiatives, and (since SP3a Task 4)
    // paper-language mappings. This canary is only as good as this list —
    // when a fourth gating record type is added, it has to join this array
    // too, or `expectedBranch` will keep predicting 'app' from the first two
    // while the real build correctly serves 'holding' because of the third.
    // That silent mismatch (Task 4's mappings going unnoticed here) is
    // exactly what SP3a Task 8's fix round 1 found and fixed.
    const statuses = [
      ...loadLanguages(join(data, 'languages')),
      ...loadInitiatives(join(data, 'initiatives')),
      ...loadPaperLanguages(join(data, 'paper-languages.yml')),
    ].map((r) => r.status)
    expect(statuses.length, 'no records were read, so this would pass vacuously').toBeGreaterThan(0)
    expect(atlasIndexBranch(html)).toBe(expectedBranch(statuses))
  })
})
