import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'

/** Excluded from `pnpm test` in vitest.config.ts and run only by `pnpm test:site`:
 *  it shells out to scripts/build-site.sh, which runs `pip install` and
 *  `pnpm install`. The default unit run stays offline and fast. */

const REPO = resolve(import.meta.dirname, '../..')
const out = mkdtempSync(join(tmpdir(), 'atlas-deploy-'))
afterAll(() => rmSync(out, { recursive: true, force: true }))

/** Every file the build emitted, as one string. Small enough to scan whole. */
function emitted(dir: string): string {
  let text = ''
  for (const entry of readdirSync(dir, { withFileTypes: true, recursive: true })) {
    if (!entry.isFile()) continue
    const p = join(entry.parentPath, entry.name)
    if (/\.(html|js|json|css)$/.test(entry.name)) text += readFileSync(p, 'utf8')
  }
  return text
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
    expect(emitted(out)).not.toMatch(/fixture-/)
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
