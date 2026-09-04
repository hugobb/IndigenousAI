import { afterEach, describe, expect, it } from 'vitest'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Finding 1 existed because every test asserted on source, and none on the
 *  artifact a deployer actually uploads. `NODE_ENV=development pnpm exec vite
 *  build` exited 0 and emitted a dist/ carrying invented "Fixture Place" /
 *  "Fixture Family" records marked `"status": "verified"`. For an artifact whose
 *  first rule is that nothing may be fabricated, that is the leak worth ~20s of
 *  test time to close, so these tests really do shell out to `vite build`. */

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const BUNDLE = fileURLToPath(new URL('../src/data/atlas.json', import.meta.url))

/** Every string that identifies an invented record, read from the fixture
 *  itself so the test cannot drift as the fixture changes, plus the blunt
 *  `Fixture` grep. No identifier in `src/` may carry that word — see the note
 *  on `AtlasBundle.isDemoData`. */
function fixtureNeedles(): string[] {
  const f = JSON.parse(
    readFileSync(fileURLToPath(new URL('../src/fixtures/atlas.fixture.json', import.meta.url)), 'utf8'),
  ) as Record<string, Record<string, unknown>[]>
  const needles = new Set<string>(['Fixture'])
  for (const collection of Object.values(f)) {
    if (!Array.isArray(collection)) continue
    for (const record of collection) {
      for (const key of ['id', 'name', 'title', 'family']) {
        const v = record[key]
        if (typeof v === 'string' && v.length > 0) needles.add(v)
      }
    }
  }
  return [...needles]
}

const NEEDLES = fixtureNeedles()

/** The production guard's message. Its presence proves the guard survived
 *  minification, so a green run is not green merely because the app failed to
 *  compile into anything. */
const GUARD = 'No bundle at src/data/atlas.json'

/** Returns the leaked strings, not a boolean — asserting `toEqual([])` keeps a
 *  failure readable, where `expect(js).not.toContain(...)` prints a 1.3 MB diff. */
function leaks(js: string): string[] {
  return NEEDLES.filter((n) => js.includes(n))
}
const VITE = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url))

const scratch: string[] = []

afterEach(() => {
  for (const d of scratch.splice(0)) rmSync(d, { recursive: true, force: true })
})

/** Builds into a throwaway directory so `dist/` is never clobbered, and returns
 *  the concatenated JS the build emitted. */
function buildAndReadJs(env: Record<string, string>): string {
  const out = mkdtempSync(join(tmpdir(), 'atlas-build-artifact-'))
  scratch.push(out)

  // Vitest sets NODE_ENV=test in this process; inheriting it would make the
  // "normal build" case something other than a normal build. Start from an
  // env with NODE_ENV removed and let each case say what it wants.
  const base: Record<string, string> = {}
  for (const [k, v] of Object.entries(process.env)) {
    if (k !== 'NODE_ENV' && v !== undefined) base[k] = v
  }

  const result = spawnSync(process.execPath, [VITE, 'build', '--outDir', out], {
    cwd: ROOT,
    encoding: 'utf8',
    // ATLAS_ALLOW_NO_BUNDLE: a fresh clone has no src/data/atlas.json, and the
    // build gate is meant to refuse that. This test is about what a build that
    // does run emits, so it takes the documented compile-only escape hatch.
    env: { ...base, ATLAS_ALLOW_NO_BUNDLE: '1', ...env },
  })
  expect(result.status, `vite build failed:\n${result.stdout}\n${result.stderr}`).toBe(0)

  const assets = join(out, 'assets')
  const js = readdirSync(assets).filter((f) => f.endsWith('.js'))
  expect(js.length, 'the build emitted no JS at all, so any grep below would pass vacuously')
    .toBeGreaterThan(0)
  return js.map((f) => readFileSync(join(assets, f), 'utf8')).join('\n')
}

describe('the built artifact', () => {
  it('carries no fixture record when built with an ambient NODE_ENV=development', () => {
    const js = buildAndReadJs({ NODE_ENV: 'development' })
    // The leak assertion comes first so a failure names the fabricated strings
    // that shipped, which is the whole point of this test.
    expect(leaks(js)).toEqual([])
    // Positive control: prove we are looking at a real app bundle whose guard
    // survived, not at an empty file. Asserted on a boolean, because a failing
    // `toContain` against 1.3 MB of minified JS prints the whole bundle.
    expect(js.includes(GUARD), 'the build guard is missing from the emitted JS').toBe(true)
  }, 180_000)

  it('carries no fixture record in a normal build', () => {
    const js = buildAndReadJs({})
    expect(leaks(js)).toEqual([])
    expect(js.includes(GUARD), 'the build guard is missing from the emitted JS').toBe(true)
  }, 180_000)
})

describe('the build gate', () => {
  // Skipped only in a tree that has already generated a real bundle. That is
  // not the normal state: src/data/atlas.json is gitignored, and `build:data`
  // exits non-zero while any record is still draft, so this runs in a fresh
  // clone and in CI.
  it.skipIf(existsSync(BUNDLE))(
    'refuses to build at all when there is no generated bundle',
    () => {
      const out = mkdtempSync(join(tmpdir(), 'atlas-build-gate-'))
      scratch.push(out)
      const base: Record<string, string> = {}
      for (const [k, v] of Object.entries(process.env)) {
        if (k !== 'ATLAS_ALLOW_NO_BUNDLE' && v !== undefined) base[k] = v
      }
      const result = spawnSync(process.execPath, [VITE, 'build', '--outDir', out], {
        cwd: ROOT,
        encoding: 'utf8',
        env: base,
      })
      expect(result.status, 'a build with no bundle must not exit 0').not.toBe(0)
      expect(`${result.stdout}${result.stderr}`).toMatch(/pnpm build:data/)
    },
    180_000,
  )
})
