import { NOT_RECORDED, VOCAB_FOR, type FacetId } from './facets.js'

export interface FilterState {
  family: string[]
  typology: string[]
  endangerment: string[]
  region: string[]
  application: string[]
  method: string[]
  regime: string[]
  governance: string[]
  from: number | null
  to: number | null
  lang: string | null
  init: string | null
}

/** Key order here IS the URL's key order, so one state always serialises to one
 *  string — which is what makes a cited URL comparable and a round-trip test
 *  meaningful. Append only; never rename. */
const FACET_KEYS: FacetId[] = [
  'family', 'typology', 'endangerment', 'region',
  'application', 'method', 'regime', 'governance',
]

export const EMPTY_FILTERS: FilterState = {
  family: [], typology: [], endangerment: [], region: [],
  application: [], method: [], regime: [], governance: [],
  from: null, to: null, lang: null, init: null,
}

/** A value survives if the facet is data-derived (no vocabulary to check against)
 *  or if the vocabulary knows it. The sentinel always survives. */
function keepValue(id: FacetId, value: string): boolean {
  if (value === NOT_RECORDED) return true
  const vocab = VOCAB_FOR[id]
  return vocab === undefined || vocab.includes(value)
}

export function parseFilters(search: string): FilterState {
  const p = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  const state: FilterState = { ...EMPTY_FILTERS }

  for (const id of FACET_KEYS) {
    const raw = p.get(id)
    if (raw === null) continue
    state[id] = raw.split(',').filter((v) => v !== '' && keepValue(id, v))
  }

  for (const k of ['from', 'to'] as const) {
    const raw = p.get(k)
    // Reject '' explicitly: Number('') is 0, and Number.isInteger(0) is true,
    // so an empty value would otherwise slip past the integer check and yield
    // year zero instead of being dropped like any other bad year.
    if (raw === null || raw === '') continue
    const n = Number(raw)
    // A bad year is dropped, not coerced: NaN would silently empty the map.
    if (Number.isInteger(n)) state[k] = n
  }

  for (const k of ['lang', 'init'] as const) {
    const raw = p.get(k)
    if (raw !== null && raw !== '') state[k] = raw
  }

  return state
}

export function toSearch(state: FilterState): string {
  const p = new URLSearchParams()
  for (const id of FACET_KEYS) {
    if (state[id].length > 0) p.set(id, state[id].join(','))
  }
  if (state.from !== null) p.set('from', String(state.from))
  if (state.to !== null) p.set('to', String(state.to))
  if (state.lang !== null) p.set('lang', state.lang)
  if (state.init !== null) p.set('init', state.init)
  const s = p.toString()
  return s === '' ? '' : `?${s}`
}
