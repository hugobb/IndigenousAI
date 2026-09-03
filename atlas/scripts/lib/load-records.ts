import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import yaml from 'js-yaml'
import { InitiativeSchema, LanguageSchema, type Initiative, type Language } from '../../src/schema/index.js'

const IGNORED_FILENAMES = new Set(['.gitkeep', '.DS_Store'])

/** Whether a record directory could be read at all.
 *  `ok` includes a directory that is present and empty — that is a legitimate
 *  state. `missing` and `unreadable` are not: both yield zero records, which is
 *  indistinguishable from an empty directory unless we say so out loud. */
export type RecordDirStatus = 'ok' | 'missing' | 'unreadable'

/** Read a directory, returning null rather than throwing. The single place
 *  where a `readdirSync` failure is swallowed, so `recordDirStatus` stays the
 *  only thing that decides what such a failure means. */
function tryReaddir(dir: string): string[] | null {
  try {
    return readdirSync(dir)
  } catch {
    return null
  }
}

/** Does this record directory exist and can we list it?
 *  `loadDir` returns `[]` for a directory that is absent, unreadable, or merely
 *  empty. Renaming `data/languages` used to produce a green build and a bundle
 *  with no pins; the caller uses this to tell those cases apart. */
export function recordDirStatus(dir: string): RecordDirStatus {
  try {
    readdirSync(dir)
    return 'ok'
  } catch (e) {
    return (e as NodeJS.ErrnoException).code === 'ENOENT' ? 'missing' : 'unreadable'
  }
}

/** Names of entries in a record directory that `loadDir` would silently skip.
 *  A curator who typos an extension or leaves a backup file must find out from
 *  a failing build, not from a pin missing on a published map. */
export function findStrayFiles(dir: string): string[] {
  const entries = tryReaddir(dir)
  if (entries === null) return [] // reported by `recordDirStatus`, not here
  return entries
    .filter((f) => !IGNORED_FILENAMES.has(f))
    .filter((f) => !f.endsWith('.yml') && !f.endsWith('.yaml'))
    .sort()
}

function loadDir<T>(dir: string, parse: (raw: unknown, file: string) => T): T[] {
  const entries = tryReaddir(dir)
  if (entries === null) return [] // reported by `recordDirStatus`, not here
  const files = entries.filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'))
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
