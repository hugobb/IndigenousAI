import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import yaml from 'js-yaml'
import { InitiativeSchema, LanguageSchema, type Initiative, type Language } from '../../src/schema/index.js'

function loadDir<T>(dir: string, parse: (raw: unknown, file: string) => T): T[] {
  let files: string[]
  try {
    files = readdirSync(dir).filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'))
  } catch {
    return []
  }
  return files.sort().map((f) => parse(yaml.load(readFileSync(join(dir, f), 'utf8')), join(dir, f)))
}

export function loadLanguages(dir: string): Language[] {
  return loadDir(dir, (raw, file) => {
    const r = LanguageSchema.safeParse(raw)
    if (!r.success) throw new Error(`${file}:\n${r.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n')}`)
    return r.data
  })
}

export function loadInitiatives(dir: string): Initiative[] {
  return loadDir(dir, (raw, file) => {
    const r = InitiativeSchema.safeParse(raw)
    if (!r.success) throw new Error(`${file}:\n${r.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n')}`)
    return r.data
  })
}
