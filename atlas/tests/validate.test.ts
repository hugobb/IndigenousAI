import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { findStrayFiles, recordDirStatus } from '../scripts/lib/load-records.js'
import { validate } from '../scripts/validate.js'
import type { Initiative, Language, PaperLanguage } from '../src/schema/index.js'

const src = { kind: 'url' as const, ref: 'https://example.test', retrieved: '2026-09-03', quote: null }

// `caveat` defaults to a placeholder, not null: this fixture is `tier:
// indigenous` with `centre: null`, which is exactly the shape
// `coverTermProblems` refuses without a caveat (spec D8). The real
// kanienkeha record this fixture is modelled on carries one for the same
// reason. Tests that specifically exercise the cover-term guard override
// `caveat: null` explicitly.
const lang = (over: Partial<Language> = {}): Language => ({
  id: 'kanienkeha', name: "Kanien'kéha", also_known_as: [], glottocode: null, iso639_3: null,
  tier: 'indigenous', family: 'Iroquoian', subfamily: null, typology: ['polysynthetic'],
  endangerment: null, speakers: null, region: 'north-america', countries: ['CA'],
  centre: null, caveat: 'Not mapped: fixture record.', status: 'verified', ...over,
})

const init = (over: Partial<Initiative> = {}): Initiative => ({
  id: 'onkwawenna', name: 'Onkwawenna Kentyohkwa', kind: 'organisation', tier: 'indigenous',
  languages: ['kanienkeha'], started: 1999, ended: null,
  site: { lat: 43.13, lon: -79.92, place: 'Six Nations', source: src, confidence: 'sourced' as const },
  applications: ['education'], methods: [], models: [], data_regime: null, governance: null,
  papers: [], links: [], transferability: null, caveat: null, status: 'verified', ...over,
})

const base = {
  methodIds: new Set(['fst-morphological-segmentation']),
  paperIds: new Set(['x-2025']),
  missingDirs: [],
  strayFiles: [],
  paperLanguages: [],
  paperLanguageQuotes: [],
  missingMappingFile: false,
  glottologResolution: [],
}

describe('validate', () => {
  it('passes a consistent dataset', () => {
    expect(validate({ languages: [lang()], initiatives: [init()], ...base })).toEqual([])
  })

  it('fails when a record is still draft, naming it', () => {
    const problems = validate({ languages: [lang({ status: 'draft' })], initiatives: [init()], ...base })
    expect(problems).toHaveLength(1)
    expect(problems[0]).toMatch(/kanienkeha/)
    expect(problems[0]).toMatch(/draft/)
  })

  it('excludes rejected records instead of failing on them', () => {
    const problems = validate({
      languages: [lang(), lang({ id: 'dropped', status: 'rejected' })],
      initiatives: [init()], ...base,
    })
    expect(problems).toEqual([])
  })

  it('fails an initiative referencing an unknown language', () => {
    const problems = validate({ languages: [lang()], initiatives: [init({ languages: ['atlantis'] })], ...base })
    expect(problems[0]).toMatch(/atlantis/)
  })

  it('fails an initiative referencing an unknown method', () => {
    const problems = validate({ languages: [lang()], initiatives: [init({ methods: ['telepathy'] })], ...base })
    expect(problems[0]).toMatch(/telepathy/)
  })

  it('fails an initiative referencing an unknown paper', () => {
    const problems = validate({ languages: [lang()], initiatives: [init({ papers: ['nope-1999'] })], ...base })
    expect(problems[0]).toMatch(/nope-1999/)
  })

  it('fails on duplicate ids', () => {
    const problems = validate({ languages: [lang(), lang()], initiatives: [init()], ...base })
    expect(problems[0]).toMatch(/duplicate/i)
  })

  it('reports every problem at once rather than stopping at the first', () => {
    const problems = validate({
      languages: [lang({ status: 'draft' })],
      initiatives: [init({ methods: ['telepathy'], papers: ['nope-1999'] })],
      ...base,
    })
    expect(problems.length).toBeGreaterThanOrEqual(3)
  })

  it('fails on a stray file, naming it', () => {
    const problems = validate({
      languages: [lang()], initiatives: [init()], ...base,
      strayFiles: ['kanienkeha.yaml.orig'],
    })
    expect(problems).toHaveLength(1)
    expect(problems[0]).toMatch(/kanienkeha\.yaml\.orig/)
    expect(problems[0]).toMatch(/NOT loaded/)
  })

  it('reports stray files before other problems', () => {
    const problems = validate({
      languages: [lang({ status: 'draft' })], initiatives: [init()], ...base,
      strayFiles: ['oops.txt'],
    })
    expect(problems[0]).toMatch(/oops\.txt/)
  })

  it('passes when there are no stray files', () => {
    expect(validate({ languages: [lang()], initiatives: [init()], ...base, strayFiles: [] })).toEqual([])
  })

  it('findStrayFiles ignores .gitkeep and .DS_Store but reports real strays', () => {
    const dir = mkdtempSync(join(tmpdir(), 'atlas-stray-'))
    writeFileSync(join(dir, 'good.yml'), '')
    writeFileSync(join(dir, '.gitkeep'), '')
    writeFileSync(join(dir, '.DS_Store'), '')
    writeFileSync(join(dir, 'kanienkeha.yaml.orig'), '')
    expect(findStrayFiles(dir)).toEqual(['kanienkeha.yaml.orig'])
    rmSync(dir, { recursive: true, force: true })
  })

  it('fails when a record directory is missing, naming it and saying what it means', () => {
    const problems = validate({
      languages: [], initiatives: [], ...base,
      missingDirs: ['data/languages'],
    })
    expect(problems).toHaveLength(1)
    expect(problems[0]).toMatch(/data\/languages/)
    expect(problems[0]).toMatch(/missing or unreadable/)
    expect(problems[0]).toMatch(/nothing was loaded/)
  })

  it('reports a missing directory before anything else, including stray files', () => {
    const problems = validate({
      languages: [lang({ status: 'draft' })], initiatives: [init()], ...base,
      missingDirs: ['data/initiatives'],
      strayFiles: ['oops.txt'],
    })
    expect(problems[0]).toMatch(/data\/initiatives/)
  })

  it('recordDirStatus tells an absent directory apart from a present, empty one', () => {
    const parent = mkdtempSync(join(tmpdir(), 'atlas-dirstatus-'))
    const empty = join(parent, 'languages')
    mkdirSync(empty)

    // A directory that exists with no records in it is a legitimate state and
    // must NOT fail the build; only one that could not be read at all does.
    expect(recordDirStatus(empty)).toBe('ok')
    expect(validate({ languages: [], initiatives: [], ...base, missingDirs: [] })).toEqual([])

    expect(recordDirStatus(join(parent, 'renamed-by-accident'))).toBe('missing')
    rmSync(parent, { recursive: true, force: true })
  })

  it('reports a cover-term record with no caveat', () => {
    const problems = validate({
      languages: [lang({ id: 'quechua', tier: 'indigenous', centre: null, caveat: null, status: 'draft' })],
      initiatives: [init()], ...base,
    })
    expect(problems.some((p) => p.includes('quechua') && p.includes('caveat'))).toBe(true)
  })

  it('excludes a rejected record from the cover-term check', () => {
    const problems = validate({
      languages: [lang({ id: 'quechua', tier: 'indigenous', centre: null, caveat: null, status: 'rejected' })],
      initiatives: [init()], ...base,
    })
    expect(problems.some((p) => p.includes('quechua') && p.includes('caveat'))).toBe(false)
  })
})

/** A mapping is a record like any other: draft blocks the build, unknown ids
 *  are refused, and a quote from the relevance section is refused loudest —
 *  it is the one error that looks correct in review. */
describe('paper-language mappings', () => {
  const mapping = (over: Partial<PaperLanguage> = {}): PaperLanguage => ({
    paper: 'x-2025', languages: ['kanienkeha'],
    source: { kind: 'paper', ref: 'r', retrieved: null, quote: 'q' },
    note: null, status: 'verified', ...over,
  })
  const run = (over: Record<string, unknown>) =>
    validate({ languages: [lang()], initiatives: [init()], ...base, ...over })

  it('accepts one paper carrying two entries with different languages', () => {
    const problems = run({
      languages: [lang(), lang({ id: 'second' })],
      paperLanguages: [mapping({ languages: ['kanienkeha'] }), mapping({ languages: ['second'] })],
    })
    expect(problems.filter((p) => p.includes('duplicate'))).toEqual([])
  })

  it('refuses the same paper-language pair twice', () => {
    const problems = run({
      paperLanguages: [mapping({ languages: ['kanienkeha'] }), mapping({ languages: ['kanienkeha'] })],
    })
    expect(problems.some((p) => p.includes('x-2025 -> kanienkeha'))).toBe(true)
  })

  it('blocks the build while a mapping is draft', () => {
    expect(run({ paperLanguages: [mapping({ status: 'draft' })] }).join('\n'))
      .toMatch(/mapping x-2025 -> \[kanienkeha\]: status is draft/)
  })

  it('refuses a mapping naming an unknown paper', () => {
    expect(run({ paperLanguages: [mapping({ paper: 'nope' })] }).join('\n'))
      .toMatch(/unknown paper "nope"/)
  })

  it('refuses a mapping naming an unknown language', () => {
    expect(run({ paperLanguages: [mapping({ languages: ['nope'] })] }).join('\n'))
      .toMatch(/unknown language "nope"/)
  })

  it('refuses a quote taken from the relevance section', () => {
    // A quote check is only meaningful attached to a real (non-rejected)
    // mapping — the CLI always builds `paperLanguageQuotes` from `paperLanguages`
    // this way, so an orphaned quote entry with no matching mapping is not a
    // state the real build can produce.
    expect(run({
      paperLanguages: [mapping()],
      paperLanguageQuotes: [{ paper: 'x-2025', languages: ['kanienkeha'], where: 'relevance-only', summaryPath: 'unused' }],
    }).join('\n')).toMatch(/relevance/i)
  })

  it('refuses a quote that is not in the summary at all', () => {
    expect(run({
      paperLanguages: [mapping()],
      paperLanguageQuotes: [{ paper: 'x-2025', languages: ['kanienkeha'], where: 'absent', summaryPath: 'unused' }],
    }).join('\n')).toMatch(/does not appear/i)
  })

  it('refuses a mapping whose summary file could not be read at all, naming the paper', () => {
    // This happens before `quoteProvenance` (pure, no filesystem access) ever
    // runs: the CLI could not read the summary file, so it reports
    // 'summary-unreadable' instead of throwing and killing the build silently.
    expect(run({
      paperLanguages: [mapping()],
      paperLanguageQuotes: [{ paper: 'x-2025', languages: ['kanienkeha'], where: 'summary-unreadable', summaryPath: '/no/such/file.md' }],
    }).join('\n')).toMatch(/x-2025/)
  })

  it('excludes a rejected mapping from the quote-provenance gate too', () => {
    // Regression test for the hole where `status: rejected` — the escape
    // hatch the tool's own closing message recommends — did not actually
    // withdraw a mapping from the D2 quote check, so a curator rejecting a
    // mapping specifically because its quote was bad still had the build
    // blocked by that same quote.
    expect(run({
      paperLanguages: [mapping({ status: 'rejected' })],
      paperLanguageQuotes: [{ paper: 'x-2025', languages: ['kanienkeha'], where: 'relevance-only', summaryPath: 'unused' }],
    })).toEqual([])
  })

  it('excludes a rejected mapping naming an unknown paper too, consistently with every other check', () => {
    expect(run({ paperLanguages: [mapping({ status: 'rejected', paper: 'nope' })] })).toEqual([])
  })

  it('says so when the mapping file is absent, which is not the same as empty', () => {
    expect(run({ missingMappingFile: true }).join('\n')).toMatch(/paper-languages\.yml/)
  })

  it('passes a clean mapping', () => {
    // A sanity check, not primary coverage: this alone would also pass
    // against a `validate` that checked nothing at all. The tests above are
    // what actually prove the gate fires.
    expect(run({
      paperLanguages: [mapping()],
      paperLanguageQuotes: [{ paper: 'x-2025', languages: ['kanienkeha'], where: 'subject-matter', summaryPath: 'unused' }],
    })).toEqual([])
  })
})
