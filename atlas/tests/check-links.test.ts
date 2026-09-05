import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { checkLinks } from '../scripts/check-links.js'
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
})
