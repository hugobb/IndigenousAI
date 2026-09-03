import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { Method, Paper } from '../src/schema/index.js'
import { loadInitiatives, loadLanguages, recordDirStatus } from './lib/load-records.js'

const url = (p: string): string => fileURLToPath(new URL(p, import.meta.url))
const readJson = <T>(p: string): T => JSON.parse(readFileSync(url(p), 'utf8')) as T

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

const bundle = {
  generated: new Date().toISOString(),
  languages: loadLanguages(url('../data/languages')).filter((l) => l.status === 'verified'),
  initiatives: loadInitiatives(url('../data/initiatives')).filter((i) => i.status === 'verified'),
  methods: readJson<Method[]>('../data/derived/methods.json'),
  papers: readJson<Paper[]>('../data/derived/papers.json'),
}

mkdirSync(new URL('../src/data/', import.meta.url), { recursive: true })
writeFileSync(url('../src/data/atlas.json'), `${JSON.stringify(bundle, null, 2)}\n`)
console.log(
  `bundle: ${bundle.languages.length} languages, ${bundle.initiatives.length} initiatives, ` +
    `${bundle.methods.length} methods, ${bundle.papers.length} papers -> src/data/atlas.json`,
)
