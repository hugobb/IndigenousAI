import { afterEach, describe, expect, it } from 'vitest'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'
import { MethodSchema, PaperSchema } from '../src/schema/index.js'
import { readDerived } from '../scripts/lib/read-derived.js'

const url = (p: string): string => fileURLToPath(new URL(p, import.meta.url))

let dir: string | null = null
afterEach(() => {
  if (dir) rmSync(dir, { recursive: true, force: true })
  dir = null
})

/** Stages a copy of a REAL derived file, so what is parsed is production data
 *  rather than a hand-built object that could quietly stop resembling it. */
function stage(name: string): string {
  dir = mkdtempSync(join(tmpdir(), 'atlas-derived-'))
  const path = join(dir, name)
  writeFileSync(path, readFileSync(url(`../data/derived/${name}`), 'utf8'))
  return path
}

const papers = { label: 'data/derived/papers.json', regenerate: 'pnpm extract:papers' }
const methods = { label: 'data/derived/methods.json', regenerate: 'pnpm extract:methods' }

describe('bundling a derived file', () => {
  // Fix round 2. `bundle.ts` used to CAST both derived files. A cast does not
  // avoid the failure, it relocates it: `chooseBundle` parses in the visitor's
  // browser and vite.config.ts's gate only checks that src/data/atlas.json
  // EXISTS, so a stale derived file was measured to bundle, build and deploy
  // green and then white-screen on first render.
  it('parses the real papers.json rather than trusting it', () => {
    const parsed = readDerived({ path: stage('papers.json'), ...papers, schema: z.array(PaperSchema) })
    // NOT vacuous: the file has content, and the parse actually reached it.
    expect(parsed.length).toBeGreaterThan(0)
    expect(parsed.every((p) => p.summary_url.startsWith('/'))).toBe(true)
  })

  it('parses the real methods.json rather than trusting it', () => {
    const parsed = readDerived({ path: stage('methods.json'), ...methods, schema: z.array(MethodSchema) })
    expect(parsed.length).toBeGreaterThan(0)
    expect(parsed.every((m) => m.doc_url.startsWith('/'))).toBe(true)
  })

  // The exact stale file Task 5 shipped in its first commit: `summary_url`
  // holding the pre-SP2b repo path, which `PaperSchema.startsWith('/')` rejects.
  it('refuses a papers.json left behind by an older generator', () => {
    const path = stage('papers.json')
    const records = JSON.parse(readFileSync(path, 'utf8')) as { id: string; summary_url: string }[]
    records[0]!.summary_url = `litterature_review/summaries/${records[0]!.id}.md`
    writeFileSync(path, JSON.stringify(records, null, 2))
    expect(() => readDerived({ path, ...papers, schema: z.array(PaperSchema) })).toThrow()
  })

  // Both files, not one: closing papers and leaving methods means the next
  // person to change extract-methods.ts finds out in a browser.
  it('refuses a methods.json left behind by an older generator', () => {
    const path = stage('methods.json')
    const records = JSON.parse(readFileSync(path, 'utf8')) as { id: string; doc_url: string }[]
    records[0]!.doc_url = `docs/ml-techniques/${records[0]!.id}.md`
    writeFileSync(path, JSON.stringify(records, null, 2))
    expect(() => readDerived({ path, ...methods, schema: z.array(MethodSchema) })).toThrow()
  })

  // The person hitting this has a Zod path like `0.summary_url` and no reason
  // to suspect a file they never edited. The diagnostic has to name the STALE
  // FILE and the command that rebuilds it, or it sends them into the schema.
  it('names the stale file and how to regenerate it, not just the schema', () => {
    const path = stage('papers.json')
    const records = JSON.parse(readFileSync(path, 'utf8')) as { summary_url: string }[]
    records[0]!.summary_url = 'litterature_review/summaries/whatever.md'
    writeFileSync(path, JSON.stringify(records, null, 2))

    let message = ''
    try {
      readDerived({ path, ...papers, schema: z.array(PaperSchema) })
    } catch (e) {
      message = e instanceof Error ? e.message : String(e)
    }
    expect(message).toContain('data/derived/papers.json')
    expect(message).toContain('pnpm extract:papers')
    expect(message).toMatch(/stale/i)
    // And it still says WHICH field, or the reader cannot tell a stale file
    // from a genuinely broken generator.
    expect(message).toContain('summary_url')
  })
})
