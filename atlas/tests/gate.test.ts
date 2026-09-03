import { afterEach, describe, expect, it } from 'vitest'
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import yaml from 'js-yaml'
import { validate } from '../scripts/validate.js'
import { findStrayFiles, loadInitiatives, loadLanguages } from '../scripts/lib/load-records.js'

const FIXTURES = fileURLToPath(new URL('./fixtures/records', import.meta.url))
const url = (p: string): string => fileURLToPath(new URL(p, import.meta.url))
const readIds = (p: string): Set<string> =>
  new Set((JSON.parse(readFileSync(url(p), 'utf8')) as { id: string }[]).map((x) => x.id))

let dir: string | null = null

function stage(): string {
  dir = mkdtempSync(join(tmpdir(), 'atlas-gate-'))
  cpSync(FIXTURES, dir, { recursive: true })
  return dir
}

function inputFrom(d: string) {
  return {
    languages: loadLanguages(join(d, 'languages')),
    initiatives: loadInitiatives(join(d, 'initiatives')),
    methodIds: readIds('../data/derived/methods.json'),
    paperIds: readIds('../data/derived/papers.json'),
    strayFiles: [...findStrayFiles(join(d, 'languages')), ...findStrayFiles(join(d, 'initiatives'))],
  }
}

afterEach(() => {
  if (dir) rmSync(dir, { recursive: true, force: true })
  dir = null
})

describe('the build gate, against real YAML records on disk', () => {
  it('passes on a verified dataset loaded from disk', () => {
    expect(validate(inputFrom(stage()))).toEqual([])
  })

  it('fails when a real verified record on disk is demoted to draft', () => {
    const d = stage()
    const file = join(d, 'languages', 'testlang.yml')
    const record = yaml.load(readFileSync(file, 'utf8')) as Record<string, unknown>
    expect(record['status'], 'fixture must start verified or this proves nothing').toBe('verified')

    // Mutate the PRODUCTION value the loader actually reads.
    record['status'] = 'draft'
    writeFileSync(file, yaml.dump(record))

    const problems = validate(inputFrom(d))
    expect(problems.some((p) => p.includes('draft') && p.includes('testlang'))).toBe(true)
  })

  it('fails when a stray file is dropped into a record directory', () => {
    const d = stage()
    writeFileSync(join(d, 'languages', 'notes.txt'), 'scratch')
    expect(validate(inputFrom(d)).some((p) => p.includes('notes.txt'))).toBe(true)
  })
})
