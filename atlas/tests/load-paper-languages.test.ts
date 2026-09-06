import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { loadPaperLanguages, paperLanguagesFileStatus } from '../scripts/lib/load-paper-languages.js'

let dir: string
const file = (): string => join(dir, 'paper-languages.yml')
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'plang-')) })
afterEach(() => rmSync(dir, { recursive: true, force: true }))

const ENTRY = `- paper: kuhn-et-al-2020-nrc-canada
  languages: [kanienkeha]
  source:
    kind: paper
    ref: /summaries/kuhn-et-al-2020-nrc-canada/
    quote: "instantiated for Kanyen'kéha (Mohawk)"
  status: draft
`

describe('loadPaperLanguages', () => {
  it('parses an entry', () => {
    writeFileSync(file(), ENTRY)
    const rows = loadPaperLanguages(file())
    expect(rows).toHaveLength(1)
    expect(rows[0]?.paper).toBe('kuhn-et-al-2020-nrc-canada')
    expect(rows[0]?.languages).toEqual(['kanienkeha'])
    expect(rows[0]?.status).toBe('draft')
    // `retrieved` and `note` default rather than being required of every entry.
    expect(rows[0]?.source.retrieved).toBeNull()
    expect(rows[0]?.note).toBeNull()
  })

  it('refuses an entry naming no language, which would map a paper nowhere', () => {
    writeFileSync(file(), '- paper: p\n  languages: []\n  source:\n    kind: paper\n    ref: r\n    quote: q\n  status: draft\n')
    expect(() => loadPaperLanguages(file())).toThrow(/at least one language/i)
  })

  it('refuses an entry with no quote: the quote IS the evidence', () => {
    writeFileSync(file(), '- paper: p\n  languages: [l]\n  source:\n    kind: paper\n    ref: r\n  status: draft\n')
    expect(() => loadPaperLanguages(file())).toThrow(/quote/i)
  })

  it('reads an empty list as empty, not as missing', () => {
    writeFileSync(file(), '[]\n')
    expect(loadPaperLanguages(file())).toEqual([])
    expect(paperLanguagesFileStatus(file())).toBe('ok')
  })

  /** The same distinction `recordDirStatus` draws one level up: zero mappings
   *  loaded from an absent file reads exactly like a file nobody has written
   *  yet, and only this tells them apart. */
  it('tells an absent file from an empty one', () => {
    expect(paperLanguagesFileStatus(file())).toBe('missing')
  })
})
