import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { GlottologResolution, Initiative, Language, PaperLanguage } from '../src/schema/index.js'
import type { QuoteProvenance } from '../src/lib/quote-provenance.js'
import { quoteProvenance } from '../src/lib/quote-provenance.js'
import { coverTermProblems, resolutionProblems } from '../src/lib/record-guards.js'
import { findStrayFiles, loadInitiatives, loadLanguages, recordDirStatus } from './lib/load-records.js'
import { loadPaperLanguages, paperLanguagesFileStatus } from './lib/load-paper-languages.js'
import { glottologResolutionFileStatus, loadGlottologResolution } from './lib/load-glottolog-resolution.js'

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
   *  because `validate` stays pure and filesystem-free. Spec D2.
   *
   *  `where` adds `'summary-unreadable'` to `QuoteProvenance`'s four outcomes:
   *  a failure that happens before `quoteProvenance` (which is pure and never
   *  touches disk) can even run, when the CLI could not read the summary file
   *  at all. `summaryPath` is carried alongside so that branch's message can
   *  name the exact path the CLI looked for — otherwise a curator cannot tell
   *  a wrong paper id from a summary that was simply never added. */
  paperLanguageQuotes: { paper: string; languages: string[]; where: QuoteProvenance | 'summary-unreadable'; summaryPath: string }[]
  /** The mapping file is absent or unreadable — the same failure class as a
   *  missing record directory: zero mappings loaded reads exactly like a file
   *  nobody has written. */
  missingMappingFile: boolean
  /** What Glottolog actually returned for every glottocode in the atlas
   *  (`data/glottolog-resolution.yml`), checked against the language records
   *  by `resolutionProblems`. Unlike the mapping file above, an absent or
   *  unreadable resolution file needs no dedicated "missing" flag here: with
   *  zero rows, every record with a non-null glottocode already fails
   *  "appears in no row" on its own, which is the correct diagnosis for a
   *  missing file too. */
  glottologResolution: GlottologResolution[]
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

  // Spec D8/D9. `languages` above is already rejected-filtered — a withdrawn
  // record is withdrawn from every gate, exactly like a rejected mapping is
  // below.
  problems.push(...coverTermProblems(languages))
  problems.push(...resolutionProblems(languages, input.glottologResolution))

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
  // A paper may appear several times — once per evidential quote (D7). What
  // must never repeat is a (paper, language) PAIR: two entries claiming the
  // same link would list the paper twice on one language panel and make the
  // second quote's evidence unfalsifiable, since either could satisfy the
  // check on its own.
  problems.push(
    ...findDuplicates(
      mappings.flatMap((m) => m.languages.map((l) => `${m.paper} -> ${l}`)),
      'paper mapping',
    ),
  )

  // Every message below names the languages alongside the paper, not just the
  // paper id: a paper may now carry several entries (D7), so `mapping x-2025:`
  // alone would not tell a maintainer WHICH entry is at fault. Typed on the
  // shape both `PaperLanguage` and a `paperLanguageQuotes` row share, so the
  // quote-provenance messages below can use the same phrasing.
  const where = (m: { paper: string; languages: string[] }): string => `mapping ${m.paper} -> [${m.languages.join(', ')}]`

  for (const m of mappings) {
    if (m.status === 'draft') {
      problems.push(`${where(m)}: status is draft — review it and set status: verified, or status: rejected`)
    }
    if (!input.paperIds.has(m.paper)) {
      problems.push(`${where(m)}: unknown paper "${m.paper}" (not in data/derived/papers.json)`)
    }
    for (const ref of m.languages) {
      if (!languageIds.has(ref)) problems.push(`${where(m)}: unknown language "${ref}"`)
    }
  }

  // Spec D2. Kept separate from the loop above because it is the rule most
  // likely to be quietly relaxed by someone who does not know why it exists.
  //
  // The tool's own closing line tells a curator that `status: rejected` is
  // how to withdraw a mapping — including one whose quote is the problem.
  // Every check below must honour that, or the escape hatch it recommends is
  // false for whichever mapping happens to have a bad quote. `mappings`
  // above is already the rejected-filtered set; a quote is only checked when
  // it belongs to one of those, never to a mapping that was rejected (or to
  // no mapping at all).
  const mappingPaperIds = new Set(mappings.map((m) => m.paper))
  for (const q of input.paperLanguageQuotes.filter((q) => mappingPaperIds.has(q.paper))) {
    if (q.where === 'relevance-only') {
      problems.push(
        `${where(q)}: the quote appears in the summary only at or after ` +
          '"## Relevance to Indigenous AI". ' +
          'That section is the reviewer writing about applicability to this project, not the paper ' +
          'describing itself — 86 of 92 summaries name Mohawk there. Quote the paper, or drop the mapping.',
      )
    }
    if (q.where === 'absent') {
      problems.push(`${where(q)}: the quote does not appear in its summary at all`)
    }
    if (q.where === 'unrecognised-relevance-heading') {
      problems.push(
        `${where(q)}: its summary's relevance heading was not recognised (expected "## Relevance..."), ` +
          'so the mapping cannot be checked — fix the heading or drop the mapping',
      )
    }
    if (q.where === 'summary-unreadable') {
      problems.push(
        `${where(q)}: could not read its summary at "${q.summaryPath}" — ` +
          'check the mapping\'s paper id, or that the summary file actually exists',
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
const GLOTTOLOG_RESOLUTION = url('../data/glottolog-resolution.yml')

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dirs = RECORD_DIRS.map((label) => ({ label, path: url(`../${label}`) }))
  const mappingStatus = paperLanguagesFileStatus(MAPPINGS)
  const paperLanguages = mappingStatus === 'ok' ? loadPaperLanguages(MAPPINGS) : []
  // A missing/unreadable resolution file needs no separate "missing" problem:
  // with zero rows, `resolutionProblems` already refuses every record with a
  // non-null glottocode as "appears in no row", which is the right diagnosis
  // for that case too.
  const glottologResolution =
    glottologResolutionFileStatus(GLOTTOLOG_RESOLUTION) === 'ok' ? loadGlottologResolution(GLOTTOLOG_RESOLUTION) : []
  const problems = validate({
    languages: loadLanguages(url('../data/languages')),
    initiatives: loadInitiatives(url('../data/initiatives')),
    methodIds: readIds('../data/derived/methods.json'),
    paperIds: readIds('../data/derived/papers.json'),
    missingDirs: dirs.filter((d) => recordDirStatus(d.path) !== 'ok').map((d) => d.label),
    strayFiles: dirs.flatMap((d) => findStrayFiles(d.path)),
    paperLanguages,
    glottologResolution,
    // Rejected mappings are skipped here too: nobody is going to publish one,
    // so its summary is never read and it can never trip the unreadable-file
    // path below on a mapping the maintainer already withdrew.
    paperLanguageQuotes: paperLanguages
      .filter((m) => m.status !== 'rejected')
      .map((m) => {
        const summaryPath = join(SUMMARY_DIR, `${m.paper}.md`)
        try {
          return {
            paper: m.paper,
            languages: m.languages,
            where: quoteProvenance(readFileSync(summaryPath, 'utf8'), m.source.quote ?? ''),
            summaryPath,
          }
        } catch {
          // A missing/unreadable summary must become a listed problem, not an
          // uncaught exception that kills the script before it can print one.
          return { paper: m.paper, languages: m.languages, where: 'summary-unreadable' as const, summaryPath }
        }
      }),
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
