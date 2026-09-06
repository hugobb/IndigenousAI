import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Initiative, Language, PaperLanguage } from '../src/schema/index.js'
import type { QuoteProvenance } from '../src/lib/quote-provenance.js'
import { quoteProvenance } from '../src/lib/quote-provenance.js'
import { findStrayFiles, loadInitiatives, loadLanguages, recordDirStatus } from './lib/load-records.js'
import { loadPaperLanguages, paperLanguagesFileStatus } from './lib/load-paper-languages.js'

export interface ValidateInput {
  languages: Language[]
  initiatives: Initiative[]
  methodIds: Set<string>
  paperIds: Set<string>
  /** Record directories that are absent or unreadable, by the name a curator
   *  would recognise (e.g. `data/languages`). A skipped DIRECTORY is the same
   *  failure class as a skipped file, one level up: zero records loaded reads
   *  exactly like a directory nobody has populated yet. */
  missingDirs: string[]
  /** Files in the record directories that the loader cannot read. Each is a
   *  build failure: a silently skipped record is indistinguishable from a
   *  record that was never written. */
  strayFiles: string[]
  /** Hand-curated paper→language links. Gated exactly like the record
   *  directories: a draft blocks the build and an unresolvable id is refused. */
  paperLanguages: PaperLanguage[]
  /** Where each mapping's quote sits in its summary, computed by the CLI below
   *  because `validate` stays pure and filesystem-free. Spec D2. */
  paperLanguageQuotes: { paper: string; where: QuoteProvenance }[]
  /** The mapping file is absent or unreadable — the same failure class as a
   *  missing record directory: zero mappings loaded reads exactly like a file
   *  nobody has written. */
  missingMappingFile: boolean
}

function findDuplicates(ids: string[], kind: string): string[] {
  const seen = new Set<string>()
  const problems: string[] = []
  for (const id of ids) {
    if (seen.has(id)) problems.push(`duplicate ${kind} id: ${id}`)
    seen.add(id)
  }
  return problems
}

/** Returns every problem found. Empty means the dataset is shippable.
 *  `rejected` records are excluded from the shipped set, not treated as errors:
 *  they are retained so seeding does not re-propose them. */
export function validate(input: ValidateInput): string[] {
  const problems: string[] = []

  // First: if a whole directory did not load, every count below is meaningless.
  for (const d of input.missingDirs) {
    problems.push(`record directory "${d}" is missing or unreadable — nothing was loaded from it; the build will not proceed on a partial dataset`)
  }

  for (const f of input.strayFiles) {
    problems.push(`stray file "${f}": not a .yml/.yaml record, so it was NOT loaded or validated — rename it or move it out of the record directories`)
  }

  const languages = input.languages.filter((l) => l.status !== 'rejected')
  const initiatives = input.initiatives.filter((i) => i.status !== 'rejected')

  problems.push(...findDuplicates(languages.map((l) => l.id), 'language'))
  problems.push(...findDuplicates(initiatives.map((i) => i.id), 'initiative'))

  for (const l of languages) {
    if (l.status === 'draft') {
      problems.push(`language ${l.id}: status is draft — review it and set status: verified, or status: rejected`)
    }
  }

  const languageIds = new Set(languages.map((l) => l.id))

  for (const i of initiatives) {
    if (i.status === 'draft') {
      problems.push(`initiative ${i.id}: status is draft — review it and set status: verified, or status: rejected`)
    }
    for (const ref of i.languages) {
      if (!languageIds.has(ref)) problems.push(`initiative ${i.id}: unknown language "${ref}"`)
    }
    for (const ref of i.methods) {
      if (!input.methodIds.has(ref)) problems.push(`initiative ${i.id}: unknown method "${ref}" (not a technique doc)`)
    }
    for (const ref of i.papers) {
      if (!input.paperIds.has(ref)) problems.push(`initiative ${i.id}: unknown paper "${ref}" (not in OVERVIEW.md)`)
    }
  }

  if (input.missingMappingFile) {
    problems.push('data/paper-languages.yml is missing or unreadable — no paper maps to any language, which is not the same as an empty list')
  }

  const mappings = input.paperLanguages.filter((m) => m.status !== 'rejected')
  problems.push(...findDuplicates(mappings.map((m) => m.paper), 'paper mapping'))

  for (const m of mappings) {
    if (m.status === 'draft') {
      problems.push(`mapping ${m.paper}: status is draft — review it and set status: verified, or status: rejected`)
    }
    if (!input.paperIds.has(m.paper)) {
      problems.push(`mapping ${m.paper}: unknown paper "${m.paper}" (not in data/derived/papers.json)`)
    }
    for (const ref of m.languages) {
      if (!languageIds.has(ref)) problems.push(`mapping ${m.paper}: unknown language "${ref}"`)
    }
  }

  // Spec D2. Kept separate from the loop above because it is the rule most
  // likely to be quietly relaxed by someone who does not know why it exists.
  for (const q of input.paperLanguageQuotes) {
    if (q.where === 'relevance-only') {
      problems.push(
        `mapping ${q.paper}: the quote appears in the summary only at or after ` +
          '"## Relevance to Indigenous AI". ' +
          'That section is the reviewer writing about applicability to this project, not the paper ' +
          'describing itself — 86 of 92 summaries name Mohawk there. Quote the paper, or drop the mapping.',
      )
    }
    if (q.where === 'absent') {
      problems.push(`mapping ${q.paper}: the quote does not appear in its summary at all`)
    }
    if (q.where === 'unrecognised-relevance-heading') {
      problems.push(
        `mapping ${q.paper}: its summary's relevance heading was not recognised (expected "## Relevance..."), ` +
          'so the mapping cannot be checked — fix the heading or drop the mapping',
      )
    }
  }

  return problems
}

const url = (p: string): string => fileURLToPath(new URL(p, import.meta.url))
const readIds = (p: string): Set<string> =>
  new Set((JSON.parse(readFileSync(url(p), 'utf8')) as { id: string }[]).map((x) => x.id))

/** The hand-curated record directories, by the path a curator would type. */
const RECORD_DIRS = ['data/languages', 'data/initiatives'] as const

const MAPPINGS = url('../data/paper-languages.yml')
const SUMMARY_DIR = url('../../litterature_review/summaries')

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dirs = RECORD_DIRS.map((label) => ({ label, path: url(`../${label}`) }))
  const mappingStatus = paperLanguagesFileStatus(MAPPINGS)
  const paperLanguages = mappingStatus === 'ok' ? loadPaperLanguages(MAPPINGS) : []
  const problems = validate({
    languages: loadLanguages(url('../data/languages')),
    initiatives: loadInitiatives(url('../data/initiatives')),
    methodIds: readIds('../data/derived/methods.json'),
    paperIds: readIds('../data/derived/papers.json'),
    missingDirs: dirs.filter((d) => recordDirStatus(d.path) !== 'ok').map((d) => d.label),
    strayFiles: dirs.flatMap((d) => findStrayFiles(d.path)),
    paperLanguages,
    paperLanguageQuotes: paperLanguages.map((m) => ({
      paper: m.paper,
      where: quoteProvenance(readFileSync(join(SUMMARY_DIR, `${m.paper}.md`), 'utf8'), m.source.quote ?? ''),
    })),
    missingMappingFile: mappingStatus !== 'ok',
  })
  if (problems.length > 0) {
    console.error(`\nvalidate: ${problems.length} problem(s)\n`)
    for (const p of problems) console.error(`  ✗ ${p}`)
    console.error('\nNothing was built. Fix the above, or set status: rejected to exclude a record.\n')
    process.exit(1)
  }
  console.log('validate: ok')
}
