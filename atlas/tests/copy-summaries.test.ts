import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { copySummaries, summaryRoute } from '../scripts/copy-summaries.js'

let work: string
const src = (): string => join(work, 'src')
const dst = (): string => join(work, 'dst')

function give(id: string, body = `# ${id}\n`): void {
  mkdirSync(src(), { recursive: true })
  writeFileSync(join(src(), `${id}.md`), body)
}

afterEach(() => rmSync(work, { recursive: true, force: true }))
beforeEach(() => { work = mkdtempSync(join(tmpdir(), 'summaries-')) })

describe('summaryRoute', () => {
  // The single source of truth for where a summary lives. extract-papers.ts
  // imports THIS — two independent derivations that drift by one character turn
  // every citation into a 404 and nothing else in the system notices.
  it('is the published route, not a repo path', () => {
    expect(summaryRoute('ajani-et-al-2024-revitalizing')).toBe('/summaries/ajani-et-al-2024-revitalizing/')
  })

  it('matches the shape Method.doc_url already uses', () => {
    expect(summaryRoute('x')).toMatch(/^\/[a-z-]+\/x\/$/)
  })
})

describe('copySummaries', () => {
  it('copies every summary and reports them sorted', () => {
    give('b-paper'); give('a-paper')
    expect(copySummaries(src(), dst())).toEqual(['a-paper', 'b-paper'])
    expect(readFileSync(join(dst(), 'a-paper.md'), 'utf8')).toBe('# a-paper\n')
  })

  // An index that silently lists fewer than it copied is how a summary goes
  // missing from the site while every file is present on disk.
  it('writes an index naming every copied summary', () => {
    give('a-paper'); give('b-paper')
    copySummaries(src(), dst())
    const index = readFileSync(join(dst(), 'index.md'), 'utf8')
    expect(index).toMatch(/\(a-paper\.md\)/)
    expect(index).toMatch(/\(b-paper\.md\)/)
  })

  it('takes the title from the summary rather than the filename', () => {
    give('a-paper', '# Towards Measuring "Culture" in LLMs\n\nbody\n')
    copySummaries(src(), dst())
    expect(readFileSync(join(dst(), 'index.md'), 'utf8'))
      .toMatch(/Towards Measuring "Culture" in LLMs/)
  })

  // Stale output is worse than none: a summary deleted upstream would keep
  // being served, and the index would stop matching the directory.
  it('clears output left by a previous run', () => {
    give('a-paper')
    mkdirSync(dst(), { recursive: true })
    writeFileSync(join(dst(), 'gone.md'), '# gone\n')
    copySummaries(src(), dst())
    expect(() => readFileSync(join(dst(), 'gone.md'), 'utf8')).toThrow()
  })

  // Refuses to succeed at nothing. An empty copy would sail through the build
  // and produce a site where every citation 404s.
  it('throws rather than copy nothing', () => {
    mkdirSync(src(), { recursive: true })
    expect(() => copySummaries(src(), dst())).toThrow(/no summaries/i)
  })
})
