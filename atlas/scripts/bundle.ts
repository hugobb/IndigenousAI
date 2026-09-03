import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { Method, Paper } from '../src/schema/index.js'
import { loadInitiatives, loadLanguages } from './lib/load-records.js'

const url = (p: string): string => fileURLToPath(new URL(p, import.meta.url))
const readJson = <T>(p: string): T => JSON.parse(readFileSync(url(p), 'utf8')) as T

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
