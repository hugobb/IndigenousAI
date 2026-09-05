import { mkdirSync, mkdtempSync, rmSync, utimesSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { bundleIsStale, checkLinks, routedBundle, routesOf } from '../scripts/check-links.js'
import type { AtlasBundle } from '../src/lib/load.js'

let site: string
beforeEach(() => { site = mkdtempSync(join(tmpdir(), 'site-')) })
afterEach(() => rmSync(site, { recursive: true, force: true }))

/** MkDocs writes `<route>/index.html` for every page. */
function publish(route: string): void {
  const dir = join(site, route)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'index.html'), '<h1>ok</h1>')
}

const bundleWith = (
  papers: { id: string; summary_url: string }[],
  methods: { id: string; doc_url: string }[],
): AtlasBundle =>
  ({ generated: '2026-01-01', languages: [], initiatives: [], methods, papers } as unknown as AtlasBundle)

describe('checkLinks', () => {
  it('passes when every route resolves', () => {
    publish('summaries/a'); publish('ml-techniques/m')
    expect(checkLinks(
      bundleWith([{ id: 'a', summary_url: '/summaries/a/' }], [{ id: 'm', doc_url: '/ml-techniques/m/' }]),
      site,
    )).toEqual([])
  })

  // The failure this exists for: a summary that did not copy, or a slug that
  // does not match its file. Both produce a 404 on a citation and nothing else
  // in the system can see either.
  it('reports a summary route with no page behind it', () => {
    publish('ml-techniques/m')
    expect(checkLinks(
      bundleWith([{ id: 'a', summary_url: '/summaries/a/' }], [{ id: 'm', doc_url: '/ml-techniques/m/' }]),
      site,
    )).toEqual(['/summaries/a/'])
  })

  it('reports a technique route with no page behind it', () => {
    publish('summaries/a')
    expect(checkLinks(
      bundleWith([{ id: 'a', summary_url: '/summaries/a/' }], [{ id: 'm', doc_url: '/ml-techniques/m/' }]),
      site,
    )).toEqual(['/ml-techniques/m/'])
  })

  // A bundle with nothing to check must not read as a pass. An empty walk is
  // indistinguishable from a clean one, which is how this guard would quietly
  // stop guarding.
  it('throws rather than pass a bundle with no routes at all', () => {
    expect(() => checkLinks(bundleWith([], []), site)).toThrow(/no routes/i)
  })

  // The T5/T6 seam. `PaperSchema.summary_url` and `MethodSchema.doc_url` both
  // assert `.startsWith('/')` and so does this walk — two guards on one fact in
  // two files, which is the pair that drifts. Relaxing the schema used to make
  // the walk DROP the route while the CLI's count still included it, so a
  // route nobody checked was reported as resolving.
  it('refuses a route that is not root-relative rather than skipping it', () => {
    publish('ml-techniques/m')
    expect(() => checkLinks(
      bundleWith([{ id: 'a', summary_url: 'summaries/a/' }], [{ id: 'm', doc_url: '/ml-techniques/m/' }]),
      site,
    )).toThrow(/not root-relative[\s\S]*summaries\/a\//)
  })

  // Nothing is published here, so every walked route comes back dead — which is
  // how the walked SET becomes visible rather than only its size. The CLI's
  // "N routes" is `routesOf(bundle).length`, the same list.
  it('walks exactly the routes routesOf yields, and nothing else', () => {
    const bundle = bundleWith(
      [{ id: 'a', summary_url: '/summaries/a/' }],
      [{ id: 'm', doc_url: '/ml-techniques/m/' }],
    )
    expect(routesOf(bundle)).toEqual(['/summaries/a/', '/ml-techniques/m/'])
    expect(checkLinks(bundle, site)).toEqual(routesOf(bundle))
  })
})

/** `pnpm bundle` runs only after `validate` passes, so any validation failure
 *  leaves an atlas.json from an earlier run beside freshly regenerated derived
 *  files. Walking that bundle checks routes older than the ones just extracted —
 *  a newly added paper whose summary failed to copy would pass unseen while the
 *  log said every route resolves. */
describe('bundleIsStale', () => {
  it('is stale when either derived file was regenerated after the bundle', () => {
    expect(bundleIsStale(1_000, [900, 1_001])).toBe(true)
    expect(bundleIsStale(1_000, [1_001, 900])).toBe(true)
  })

  it('is not stale when the bundle was written after every derived file', () => {
    expect(bundleIsStale(2_000, [1_000, 1_500])).toBe(false)
  })

  // `pnpm bundle` reads both derived files and writes atlas.json in one run, so
  // equal timestamps are the ordinary successful case, not a near miss.
  it('is not stale when the timestamps are equal', () => {
    expect(bundleIsStale(1_000, [1_000, 1_000])).toBe(false)
  })
})

/** The wiring around `bundleIsStale`: which file the CLI actually opens. The
 *  predicate being right is not the same fact as the caller honouring it, and
 *  the whole defect this closes was a caller that opened the wrong file while
 *  reporting success. */
describe('routedBundle picks its source', () => {
  let root: string
  beforeEach(() => { root = mkdtempSync(join(tmpdir(), 'root-')) })
  afterEach(() => rmSync(root, { recursive: true, force: true }))

  const paper = (id: string) => ({
    id, title: id, authors: 'A', year: 2025, venue: null, themes: [],
    summary_url: `/summaries/${id}/`,
  })
  const method = (id: string) => ({
    id, name: id, category: 'ml' as const, data_regime: ['zero'] as const,
    data_regime_note: null, applicable_languages: null, doc_url: `/ml-techniques/${id}/`,
  })

  /** Writes the derived pair, and optionally a bundle `ageSeconds` older. */
  function seed(opts: { bundle?: { ageSeconds: number } }): void {
    mkdirSync(join(root, 'atlas/data/derived'), { recursive: true })
    writeFileSync(join(root, 'atlas/data/derived/papers.json'), JSON.stringify([paper('derived')]))
    writeFileSync(join(root, 'atlas/data/derived/methods.json'), JSON.stringify([method('derived')]))
    if (!opts.bundle) return
    mkdirSync(join(root, 'atlas/src/data'), { recursive: true })
    const at = join(root, 'atlas/src/data/atlas.json')
    writeFileSync(at, JSON.stringify({
      generated: '2026-01-01', languages: [], initiatives: [],
      papers: [paper('bundled')], methods: [method('bundled')],
    }))
    const when = Date.now() / 1000 - opts.bundle.ageSeconds
    utimesSync(at, when, when)
  }

  it('walks the derived files when there is no bundle', () => {
    seed({})
    const { bundle, source } = routedBundle(root)
    expect(bundle.papers.map((p) => p.summary_url)).toEqual(['/summaries/derived/'])
    expect(source).toMatch(/no bundle yet/)
  })

  it('walks the bundle when it is newer than the derived files', () => {
    seed({ bundle: { ageSeconds: -60 } })
    const { bundle, source } = routedBundle(root)
    expect(bundle.papers.map((p) => p.summary_url)).toEqual(['/summaries/bundled/'])
    expect(source).toMatch(/reviewed bundle/)
  })

  // The defect: `pnpm bundle` runs only after `validate` passes, so a validation
  // failure leaves a bundle from an earlier run beside freshly extracted derived
  // files. Trusting it checks routes that predate the change being made.
  it('ignores a bundle older than the derived files, and says so', () => {
    seed({ bundle: { ageSeconds: 3600 } })
    const { bundle, source } = routedBundle(root)
    expect(bundle.papers.map((p) => p.summary_url)).toEqual(['/summaries/derived/'])
    expect(source).toMatch(/STALE/)
  })
})
