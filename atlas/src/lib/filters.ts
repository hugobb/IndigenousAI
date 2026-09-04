import type { Initiative, Language } from '../schema/index.js'
import type { AtlasBundle } from './load.js'
import type { FilterState } from './url-state.js'
import {
  INITIATIVE_FACETS, LANGUAGE_FACETS, NOT_RECORDED,
  facetOptions, notRecordedCount, type FacetId,
} from './facets.js'

export interface Selection {
  languages: Language[]
  initiatives: Initiative[]
  /** Matched the language facets but has no initiative left. Spec F1: these are a
   *  finding, not an error — they are surfaced in the rail, never deleted. */
  filteredOut: Language[]
  undatedInitiatives: number
}

/** Selected values are OR within a facet; facets are AND with each other. The
 *  sentinel matches a record that carries nothing for the facet. */
function matches<T>(record: T, facet: { id: FacetId; values: (r: T) => string[] }, selected: string[]): boolean {
  if (selected.length === 0) return true
  const values = facet.values(record)
  if (values.length === 0) return selected.includes(NOT_RECORDED)
  return values.some((v) => selected.includes(v))
}

function languagePasses(l: Language, state: FilterState): boolean {
  return LANGUAGE_FACETS.every((f) => matches(l, f, state[f.id]))
}

function initiativePasses(i: Initiative, state: FilterState): boolean {
  return INITIATIVE_FACETS.every((f) => matches(i, f, state[f.id]))
}

/** Spec F5: an initiative with no `started` is outside the window's reach. The
 *  alternative deletes Te Hiku Media whenever the slider moves. */
function withinWindow(i: Initiative, state: FilterState): boolean {
  if (i.started === null) return true
  if (state.from !== null && i.started < state.from) return false
  if (state.to !== null && i.started > state.to) return false
  return true
}

const anyWorkFilter = (s: FilterState): boolean =>
  INITIATIVE_FACETS.some((f) => s[f.id].length > 0) || s.from !== null || s.to !== null

const anyLanguageFilter = (s: FilterState): boolean =>
  LANGUAGE_FACETS.some((f) => s[f.id].length > 0)

export function applyFilters(bundle: AtlasBundle, state: FilterState): Selection {
  const l1 = bundle.languages.filter((l) => languagePasses(l, state))
  const l1ids = new Set(l1.map((l) => l.id))

  // The language-intersection test is conditional. InitiativeSchema requires at
  // least one language, so with no language facet active the unconditional form
  // would behave identically today — but writing it conditionally keeps this rule
  // from depending on a `.min(1)` three files away.
  const i1 = bundle.initiatives.filter(
    (i) =>
      initiativePasses(i, state) &&
      withinWindow(i, state) &&
      (!anyLanguageFilter(state) || i.languages.some((id) => l1ids.has(id))),
  )

  // Spec §6: the timeline reports how many of the initiatives on screen it
  // cannot constrain. That is a standing property of `i1`, true on the very
  // first EMPTY_FILTERS render (Te Hiku Media has no `started`) — not
  // something that only becomes true once a work facet is touched. Computed
  // uniformly in both branches below.
  const undatedInitiatives = i1.filter((i) => i.started === null).length

  if (!anyWorkFilter(state)) {
    return { languages: l1, initiatives: i1, filteredOut: [], undatedInitiatives }
  }

  const covered = new Set(i1.flatMap((i) => i.languages))
  return {
    languages: l1.filter((l) => covered.has(l.id)),
    initiatives: i1,
    filteredOut: l1.filter((l) => !covered.has(l.id)),
    undatedInitiatives,
  }
}

export interface FacetSummary {
  id: FacetId
  label: string
  options: { value: string; count: number }[]
  /** How many records in the CURRENT pool carry nothing for this facet — the
   *  number behind the "not recorded" checkbox, so it must match what ticking
   *  it would select. */
  notRecorded: number
  /** How many records in the WHOLE bundle carry nothing for this facet. Only
   *  the "not yet curated" sentence uses this: that sentence is a claim about
   *  the dataset, not about the current filter, so a pool-scoped number there
   *  reads as a much smaller claim than the one being made. */
  notRecordedTotal: number
  curated: boolean
  selected: string[]
}

/** Counts are computed against the selection with THIS facet's own choices
 *  cleared, so an option never advertises a count that selecting it would not
 *  produce (spec F7). */
export function facetSummaries(bundle: AtlasBundle, state: FilterState): FacetSummary[] {
  const summarise = <T>(
    facet: { id: FacetId; label: string; values: (r: T) => string[] },
    pool: T[],
    all: T[],
  ): FacetSummary => ({
    id: facet.id,
    label: facet.label,
    options: facetOptions(pool, facet),
    notRecorded: notRecordedCount(pool, facet),
    notRecordedTotal: notRecordedCount(all, facet),
    // `curated` asks whether this dimension has data AT ALL, so it is measured
    // against the whole bundle. Measuring it against the filtered pool would make
    // a facet read "not yet curated" merely because the current filter excluded
    // its values — turning a filter result into a false claim about curation.
    curated: facetOptions(all, facet).length > 0,
    selected: state[facet.id],
  })

  return [
    // Spec F1, one layer up: a language demoted to `filteredOut` by a work
    // filter is still ON the rail, not gone. Counting only `.languages` (L2)
    // would let an option's badge undercount by exactly the languages a click
    // would newly reveal in the "no matching work" group — ruling: count
    // against L1 (`languages` + `filteredOut`), never the narrower L2 pool.
    ...LANGUAGE_FACETS.map((f) => {
      const sel = applyFilters(bundle, { ...state, [f.id]: [] })
      return summarise(f, [...sel.languages, ...sel.filteredOut], bundle.languages)
    }),
    // Initiative facets have no analogous demoted state — count against the
    // survivors exactly as before.
    ...INITIATIVE_FACETS.map((f) =>
      summarise(f, applyFilters(bundle, { ...state, [f.id]: [] }).initiatives, bundle.initiatives),
    ),
  ]
}

export type EmptyState = 'matched' | 'no-work-but-languages' | 'nothing-matched'

/** The SINGLE place the page decides whether anything matched. Two surfaces
 *  now render that decision — the rail and the table — and in SP1b two
 *  independent derivations of it disagreed on screen, printing a denial
 *  directly above the finding it denied. There is one predicate so there is
 *  one thing to be wrong. */
export function emptyState(s: Selection): EmptyState {
  if (s.languages.length === 0 && s.initiatives.length === 0 && s.filteredOut.length === 0) {
    return 'nothing-matched'
  }
  if (s.initiatives.length === 0 && s.filteredOut.length > 0) return 'no-work-but-languages'
  return 'matched'
}

export function yearRange(bundle: AtlasBundle): { min: number; max: number } | null {
  const years = bundle.initiatives.map((i) => i.started).filter((y): y is number => y !== null)
  if (years.length === 0) return null
  return { min: Math.min(...years), max: Math.max(...years) }
}
