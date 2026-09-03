import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import yaml from 'js-yaml'
import { DATA_REGIMES, type DataRegime } from '../../src/schema/vocab.js'
import { normaliseValue } from './md.js'

export class UnmappedDataRegimeError extends Error {
  constructor(public readonly value: string) {
    super(
      `Unmapped Data Regime: ${JSON.stringify(value)}\n` +
        `Add it to atlas/data/data-regime-map.yml with the ladder buckets it means.\n` +
        `Buckets: ${DATA_REGIMES.join(', ')}`,
    )
    this.name = 'UnmappedDataRegimeError'
  }
}

const MAP_PATH = fileURLToPath(new URL('../../data/data-regime-map.yml', import.meta.url))

function loadMap(): Map<string, DataRegime[]> {
  const raw = yaml.load(readFileSync(MAP_PATH, 'utf8')) as Record<string, string[]>
  const m = new Map<string, DataRegime[]>()
  for (const [k, v] of Object.entries(raw)) {
    for (const bucket of v) {
      if (!DATA_REGIMES.includes(bucket as DataRegime)) {
        throw new Error(`data-regime-map.yml: ${JSON.stringify(k)} maps to unknown bucket ${JSON.stringify(bucket)}`)
      }
    }
    m.set(normaliseValue(k), v as DataRegime[])
  }
  return m
}

const TABLE = loadMap()

/** Prose Data Regime -> ladder buckets, in ladder order.
 *  `null` (the doc has no Data Regime line) resolves to `['any']`; unknown
 *  prose throws, so a technique doc edit surfaces as a build failure rather
 *  than a silent re-bucketing. */
export function resolveDataRegime(prose: string | null): DataRegime[] {
  if (prose === null) return ['any']
  const key = normaliseValue(prose)
  const hit = TABLE.get(key)
  if (!hit) throw new UnmappedDataRegimeError(key)
  return [...hit].sort((a, b) => DATA_REGIMES.indexOf(a) - DATA_REGIMES.indexOf(b))
}
