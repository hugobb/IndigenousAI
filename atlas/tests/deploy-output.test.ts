import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative, resolve } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'

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

  it('serves the holding page while the data build fails', () => {
    const html = readFileSync(join(out, 'atlas/index.html'), 'utf8')
    expect(html).toMatch(/awaiting record review/i)
    // A holding page that shipped the app shell would carry its script bundle.
    expect(html).not.toMatch(/<script[^>]+src=/)
  })

  // `base: '/atlas/'` is deliberately NOT asserted here. While `build:data`
  // exits non-zero the holding-page branch is taken, no app assets exist in
  // this tree, and any assertion about their URLs would pass vacuously —
  // exactly the shape of guard this project has been bitten by. It is asserted
  // instead in tests/build-artifact.test.ts, on a build that always runs.
})
