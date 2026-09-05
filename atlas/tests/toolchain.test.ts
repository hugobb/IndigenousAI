import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/** The repository root's package.json exists only to tell Vercel and CI which
 *  toolchain to provision: `vercel.json` sets `framework: null`, and the only
 *  real package (atlas/) is a directory further down, so without it there is
 *  nothing at the root for Vercel to detect — no manifest, no lockfile, no
 *  Node version. `scripts/build-site.sh` then reaches `pnpm install
 *  --frozen-lockfile` on an image where pnpm may simply not be on PATH.
 *
 *  Those declarations are duplicates of facts stated elsewhere, which is what
 *  makes them worth a test: nothing at deploy time reconciles them, and the
 *  failure mode of drift is silent. Bump atlas/.nvmrc to 24 and the root still
 *  says 22.x — Vercel provisions the wrong Node, and the first anyone learns of
 *  it is a build on the deployed origin. This is the only guard that can catch
 *  that, because it is the only one that reads both files. */

const root = (p: string): string =>
  readFileSync(fileURLToPath(new URL(`../../${p}`, import.meta.url)), 'utf8')

interface RootManifest {
  packageManager?: string
  engines?: { node?: string }
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  scripts?: Record<string, string>
}

describe('the root toolchain declaration', () => {
  const manifest = JSON.parse(root('package.json')) as RootManifest

  it('pins the Node major that atlas/.nvmrc pins', () => {
    const nvmrc = root('atlas/.nvmrc').trim()
    expect(nvmrc).toMatch(/^\d+\.\d+\.\d+$/)
    // Vercel resolves `engines.node` to a major it actually ships and rejects an
    // exact patch, so the root can only state the major. That is precisely why
    // the two can drift apart without anyone noticing.
    expect(manifest.engines?.node).toBe(`${nvmrc.split('.')[0]}.x`)
  })

  it('pins an exact pnpm version', () => {
    expect(manifest.packageManager).toMatch(/^pnpm@\d+\.\d+\.\d+$/)
  })

  // A root that grows dependencies or a lockfile stops being a toolchain hint
  // and becomes a second, competing package — and `atlas/pnpm-workspace.yaml`
  // makes atlas/ its own workspace root, so the two would fight silently.
  it('stays a declaration and not a package', () => {
    expect(manifest.dependencies).toBeUndefined()
    expect(manifest.devDependencies).toBeUndefined()
    expect(manifest.scripts).toBeUndefined()
  })
})
