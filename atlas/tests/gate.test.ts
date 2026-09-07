import { afterEach, describe, expect, it } from 'vitest'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import yaml from 'js-yaml'
import { validate } from '../scripts/validate.js'
import { findStrayFiles, loadInitiatives, loadLanguages, recordDirStatus } from '../scripts/lib/load-records.js'

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

/** Mirrors what `validate.ts`'s CLI assembles, so the gate is exercised through
 *  the same input the build actually builds. */
function inputFrom(d: string) {
  const dirs = ['languages', 'initiatives'] as const
  return {
    languages: loadLanguages(join(d, 'languages')),
    initiatives: loadInitiatives(join(d, 'initiatives')),
    methodIds: readIds('../data/derived/methods.json'),
    paperIds: readIds('../data/derived/papers.json'),
    missingDirs: dirs
      .filter((name) => recordDirStatus(join(d, name)) !== 'ok')
      .map((name) => `data/${name}`),
    strayFiles: dirs.flatMap((name) => findStrayFiles(join(d, name))),
    // This harness stages no mapping file at all; the paper-language mapping
    // gate is exercised on real data by validate.test.ts and paper-mappings.test.ts.
    paperLanguages: [],
    paperLanguageQuotes: [],
    missingMappingFile: false,
    // Likewise: this harness stages no resolution file, so every record it
    // loads must carry a null glottocode or the resolution guard would refuse
    // it as unfetched — true of every fixture under tests/fixtures/records
    // today. The guard itself is exercised on real data by
    // record-guards.test.ts and against the real resolution file by validate
    // being run for real in scripts/validate.ts's CLI section.
    glottologResolution: [],
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

  it('fails when a real record directory is renamed away on disk', () => {
    const d = stage()
    expect(validate(inputFrom(d)), 'fixture must start clean or this proves nothing').toEqual([])

    // Rename the PRODUCTION directory the loader actually reads. Before this
    // gate the loader returned [] and the build printed `validate: ok`.
    renameSync(join(d, 'languages'), join(d, 'languages_tmp'))

    const problems = validate(inputFrom(d))
    expect(problems.some((p) => p.includes('data/languages') && p.includes('missing or unreadable'))).toBe(true)
  })

  it('passes when a record directory is present but empty', () => {
    const d = stage()
    rmSync(join(d, 'initiatives'), { recursive: true, force: true })
    mkdirSync(join(d, 'initiatives'))
    expect(validate(inputFrom(d))).toEqual([])
  })
})
