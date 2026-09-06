import { readFileSync } from 'node:fs'
import yaml from 'js-yaml'
import { PaperLanguageSchema, type PaperLanguage } from '../../src/schema/index.js'

/** Whether the mapping file could be read at all. `ok` includes an empty list —
 *  a legitimate state before any paper has been mapped. `missing` and
 *  `unreadable` are not: both yield zero mappings, which is indistinguishable
 *  from an empty list unless we say so out loud. Same distinction
 *  `recordDirStatus` draws for the record directories. */
export type PaperLanguagesFileStatus = 'ok' | 'missing' | 'unreadable'

export function paperLanguagesFileStatus(file: string): PaperLanguagesFileStatus {
  try {
    readFileSync(file, 'utf8')
    return 'ok'
  } catch (e) {
    return (e as NodeJS.ErrnoException).code === 'ENOENT' ? 'missing' : 'unreadable'
  }
}

export function loadPaperLanguages(file: string): PaperLanguage[] {
  const raw = yaml.load(readFileSync(file, 'utf8')) ?? []
  if (!Array.isArray(raw)) {
    throw new Error(`${file}: expected a YAML list of mappings, got ${typeof raw}`)
  }
  return raw.map((row, i) => {
    const parsed = PaperLanguageSchema.safeParse(row)
    if (!parsed.success) {
      const where = (row as { paper?: string })?.paper ?? `entry ${i + 1}`
      throw new Error(`${file}: ${where}: ${parsed.error.issues.map((x) => `${x.path.join('.')}: ${x.message}`).join('; ')}`)
    }
    return parsed.data
  })
}
