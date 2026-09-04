import type { Initiative, Language } from '../schema/index.js'
import {
  APPLICATIONS, DATA_REGIMES, ENDANGERMENT, GOVERNANCE_POSTURES, REGIONS, TYPOLOGIES,
} from '../schema/index.js'

/** Wire and UI form of "this record records nothing for this facet". A leading
 *  underscore cannot collide with a kebab-case vocabulary value. */
export const NOT_RECORDED = '_none'

export type FacetId =
  | 'family' | 'typology' | 'endangerment' | 'region'
  | 'application' | 'method' | 'regime' | 'governance'

export interface LanguageFacet { id: FacetId; label: string; values: (l: Language) => string[] }
export interface InitiativeFacet { id: FacetId; label: string; values: (i: Initiative) => string[] }

/** The facet id is NOT the record field name. `application` reads `applications`,
 *  `regime` reads `data_regime`, and `endangerment`/`governance` are objects whose
 *  facet value lives at `.status`/`.posture`. This module is the only place that
 *  knows that; nothing downstream touches those fields directly. */
export const LANGUAGE_FACETS: LanguageFacet[] = [
  { id: 'family', label: 'Family', values: (l) => (l.family === null ? [] : [l.family]) },
  { id: 'typology', label: 'Typology', values: (l) => l.typology },
  {
    id: 'endangerment', label: 'Endangerment',
    values: (l) => (l.endangerment == null ? [] : [l.endangerment.status]),
  },
  { id: 'region', label: 'Region', values: (l) => (l.region === null ? [] : [l.region]) },
]

export const INITIATIVE_FACETS: InitiativeFacet[] = [
  { id: 'application', label: 'Application', values: (i) => i.applications },
  { id: 'method', label: 'Method', values: (i) => i.methods },
  {
    id: 'regime', label: 'Data regime',
    values: (i) => (i.data_regime === null ? [] : [i.data_regime]),
  },
  {
    id: 'governance', label: 'Governance',
    values: (i) => (i.governance == null ? [] : [i.governance.posture]),
  },
]

/** Allowed values for vocabulary-backed facets. `family` and `method` are absent
 *  on purpose: their values come from the data, so any string is legitimate and
 *  the codec must not discard one it has not seen. */
export const VOCAB_FOR: Partial<Record<FacetId, readonly string[]>> = {
  typology: TYPOLOGIES,
  endangerment: ENDANGERMENT,
  region: REGIONS,
  application: APPLICATIONS,
  regime: DATA_REGIMES,
  governance: GOVERNANCE_POSTURES,
}

export function facetOptions<T>(
  records: T[], facet: { values: (r: T) => string[] },
): { value: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const r of records) {
    for (const v of facet.values(r)) counts.set(v, (counts.get(v) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => a.value.localeCompare(b.value))
}

export function notRecordedCount<T>(records: T[], facet: { values: (r: T) => string[] }): number {
  return records.filter((r) => facet.values(r).length === 0).length
}
