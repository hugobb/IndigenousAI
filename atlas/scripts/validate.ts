import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { Initiative, Language } from '../src/schema/index.js'
import { loadInitiatives, loadLanguages } from './lib/load-records.js'

export interface ValidateInput {
  languages: Language[]
  initiatives: Initiative[]
  methodIds: Set<string>
  paperIds: Set<string>
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

  return problems
}

const url = (p: string): string => fileURLToPath(new URL(p, import.meta.url))
const readIds = (p: string): Set<string> =>
  new Set((JSON.parse(readFileSync(url(p), 'utf8')) as { id: string }[]).map((x) => x.id))

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const problems = validate({
    languages: loadLanguages(url('../data/languages')),
    initiatives: loadInitiatives(url('../data/initiatives')),
    methodIds: readIds('../data/derived/methods.json'),
    paperIds: readIds('../data/derived/papers.json'),
  })
  if (problems.length > 0) {
    console.error(`\nvalidate: ${problems.length} problem(s)\n`)
    for (const p of problems) console.error(`  ✗ ${p}`)
    console.error('\nNothing was built. Fix the above, or set status: rejected to exclude a record.\n')
    process.exit(1)
  }
  console.log('validate: ok')
}
