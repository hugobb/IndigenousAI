import { readFileSync } from 'node:fs'
import yaml from 'js-yaml'
import { GlottologResolutionSchema, type GlottologResolution } from '../../src/schema/index.js'

/** Whether the resolution file could be read at all. `ok` includes an empty
 *  list — a legitimate state before any name has been resolved. `missing`
 *  and `unreadable` are not: both yield zero rows, which is indistinguishable
 *  from an empty list unless we say so out loud. Same distinction
 *  `paperLanguagesFileStatus` draws for the mapping file. */
export type GlottologResolutionFileStatus = 'ok' | 'missing' | 'unreadable'

export function glottologResolutionFileStatus(file: string): GlottologResolutionFileStatus {
  try {
    readFileSync(file, 'utf8')
    return 'ok'
  } catch (e) {
    return (e as NodeJS.ErrnoException).code === 'ENOENT' ? 'missing' : 'unreadable'
  }
}

export function loadGlottologResolution(file: string): GlottologResolution[] {
  const raw = yaml.load(readFileSync(file, 'utf8')) ?? []
  if (!Array.isArray(raw)) {
    throw new Error(`${file}: expected a YAML list of resolutions, got ${typeof raw}`)
  }
  return raw.map((row, i) => {
    const parsed = GlottologResolutionSchema.safeParse(row)
    if (!parsed.success) {
      const where = (row as { searched?: string })?.searched ?? `entry ${i + 1}`
      throw new Error(`${file}: ${where}: ${parsed.error.issues.map((x) => `${x.path.join('.')}: ${x.message}`).join('; ')}`)
    }
    return parsed.data
  })
}
