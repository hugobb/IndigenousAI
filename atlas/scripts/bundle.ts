import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'
import { MethodSchema, PaperSchema } from '../src/schema/index.js'
import { emptyRecordSetProblem } from './lib/empty-record-set.js'
import { loadInitiatives, loadLanguages, recordDirStatus } from './lib/load-records.js'
import { loadPaperLanguages, paperLanguagesFileStatus } from './lib/load-paper-languages.js'
import { readDerived } from './lib/read-derived.js'

const url = (p: string): string => fileURLToPath(new URL(p, import.meta.url))

// The gate checks this too, but `pnpm bundle` can be run on its own and an
// absent record directory would otherwise write an atlas with no pins.
for (const label of ['data/languages', 'data/initiatives']) {
  const status = recordDirStatus(url(`../${label}`))
  if (status !== 'ok') {
    throw new Error(
      `record directory "${label}" is ${status} — nothing was loaded from it; refusing to bundle a partial dataset`,
    )
  }
}

// Same failure class as the record directories above, one level down: a
// missing/unreadable mapping FILE yields zero mappings, indistinguishable from
// "nobody has mapped a paper yet" unless we say so before loading it.
const mappingsFile = 'data/paper-languages.yml'
const mappingsStatus = paperLanguagesFileStatus(url(`../${mappingsFile}`))
if (mappingsStatus !== 'ok') {
  throw new Error(
    `paper-languages file "${mappingsFile}" is ${mappingsStatus} — nothing was loaded from it; refusing to bundle a partial dataset`,
  )
}

const bundle = {
  generated: new Date().toISOString(),
  languages: loadLanguages(url('../data/languages')).filter((l) => l.status === 'verified'),
  initiatives: loadInitiatives(url('../data/initiatives')).filter((i) => i.status === 'verified'),
  // BOTH derived files, parsed rather than cast — see `readDerived`. Closing
  // one and leaving the other means the next person to change a generator finds
  // out in a visitor's browser instead of here.
  methods: readDerived({
    path: url('../data/derived/methods.json'),
    label: 'data/derived/methods.json',
    regenerate: 'pnpm extract:methods',
    schema: z.array(MethodSchema),
  }),
  papers: readDerived({
    path: url('../data/derived/papers.json'),
    label: 'data/derived/papers.json',
    regenerate: 'pnpm extract:papers',
    schema: z.array(PaperSchema),
  }),
  // Only mappings that survived review, mirroring the language and initiative
  // filters directly above: `rejected` and `draft` are both excluded, so the
  // bundle carries exactly what a reader may see.
  paperLanguages: loadPaperLanguages(url(`../${mappingsFile}`)).filter((m) => m.status === 'verified'),
}

// Read off the object that is about to be written, not off the record files a
// second time: the guard and the artifact cannot disagree.
const problem = emptyRecordSetProblem(bundle)
if (problem !== null) throw new Error(problem)

mkdirSync(new URL('../src/data/', import.meta.url), { recursive: true })
writeFileSync(url('../src/data/atlas.json'), `${JSON.stringify(bundle, null, 2)}\n`)
console.log(
  `bundle: ${bundle.languages.length} languages, ${bundle.initiatives.length} initiatives, ` +
    `${bundle.methods.length} methods, ${bundle.papers.length} papers, ` +
    `${bundle.paperLanguages.length} mappings -> src/data/atlas.json`,
)
