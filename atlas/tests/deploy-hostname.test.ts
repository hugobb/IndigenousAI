import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/** The deployment origin is stated twice — `site_url` in docs/mkdocs.yml and
 *  `url` in CITATION.cff — and nothing at deploy time reconciles them.
 *
 *  It is ASSUMED, not observed: no deploy has happened, so the first person to
 *  learn the real hostname will be editing these files by hand. Editing one and
 *  not the other fails silently and differently on each side — a citation
 *  pointing at a host that does not exist, or a guide whose canonical URLs and
 *  sitemap name one. Same shape as the root package.json / atlas/.nvmrc drift
 *  that tests/toolchain.test.ts exists for, and the same answer: the only guard
 *  that can catch it is the one that reads both files.
 *
 *  The path assertion is the load-bearing half. `Method.doc_url` is
 *  `/ml-techniques/<id>/` and `Paper.summary_url` is `/summaries/<id>/` — ROOT-
 *  relative, because spec D1 puts the guide at the origin root and the atlas at
 *  `/atlas/` on that same origin. Give the guide a path prefix and every
 *  citation in the atlas 404s, which is the one defect this artifact must not
 *  ship. `scripts/check-links.ts` cannot see it: it walks the built tree, which
 *  is laid out the same way whatever `site_url` says. */

const repo = (p: string): string =>
  readFileSync(fileURLToPath(new URL(`../../${p}`, import.meta.url)), 'utf8')

/** A top-level `key: value` from a YAML-ish file, quotes stripped. Read by
 *  regex rather than by a parser: docs/mkdocs.yml carries `!!python/name:` tags
 *  that js-yaml refuses outright. */
function field(source: string, key: string): string | undefined {
  const m = new RegExp(`^${key}:\\s*(.+?)\\s*$`, 'm').exec(source)
  return m?.[1]?.replace(/^["']|["']$/g, '')
}

describe('the deployment origin', () => {
  const siteUrl = field(repo('docs/mkdocs.yml'), 'site_url')
  const citationUrl = field(repo('CITATION.cff'), 'url')

  it('is stated in both files', () => {
    expect(siteUrl, 'docs/mkdocs.yml has no site_url').toBeDefined()
    expect(citationUrl, 'CITATION.cff has no url').toBeDefined()
  })

  it('is the same origin in docs/mkdocs.yml and CITATION.cff', () => {
    expect(citationUrl).toBe(siteUrl)
  })

  it('puts the guide at the origin ROOT, which every atlas citation depends on', () => {
    for (const [label, value] of [['site_url', siteUrl], ['CITATION.cff url', citationUrl]] as const) {
      const url = new URL(value as string)
      expect(url.protocol, `${label} must be https`).toBe('https:')
      expect(url.pathname, `${label} must have no path prefix — /summaries/<id>/ resolves from the root`).toBe('/')
    }
  })
})
