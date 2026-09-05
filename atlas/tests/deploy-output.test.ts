import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative, resolve } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { atlasIndexBranch, atlasIndexProblems } from './lib/atlas-index.js'

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
    expect(atlasIndexProblems(html, files)).toEqual([])
  })

  // Which branch it took today, stated out loud. When this flips, the atlas has
  // shipped — and the assertion above is what will still be checking it.
  it('is serving the holding page, because records are still under review', () => {
    const html = readFileSync(join(out, 'atlas/index.html'), 'utf8')
    expect(atlasIndexBranch(html)).toBe('holding')
  })
})
