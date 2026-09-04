import { useCallback, useEffect, useReducer, useRef } from 'react'
import type { FacetId } from '../lib/facets.js'
import { EMPTY_FILTERS, parseFilters, toSearch, type FilterState } from '../lib/url-state.js'

export type FilterAction =
  | { type: 'toggle'; facet: FacetId; value: string }
  | { type: 'clearFacet'; facet: FacetId }
  | { type: 'clearAll' }
  | { type: 'setRange'; from: number | null; to: number | null }
  | { type: 'selectLanguage'; id: string | null }
  | { type: 'selectInitiative'; id: string | null }

export function filterReducer(state: FilterState, action: FilterAction): FilterState {
  switch (action.type) {
    case 'toggle': {
      const current = state[action.facet]
      const next = current.includes(action.value)
        ? current.filter((v) => v !== action.value)
        : [...current, action.value]
      return { ...state, [action.facet]: next }
    }
    case 'clearFacet':
      return { ...state, [action.facet]: [] }
    case 'clearAll':
      // Clears the query, keeps the open panel: clearing filters should not also
      // close the record the reader is reading.
      return { ...EMPTY_FILTERS, lang: state.lang, init: state.init }
    case 'setRange':
      return { ...state, from: action.from, to: action.to }
    case 'selectLanguage':
      return { ...state, lang: action.id, init: null }
    case 'selectInitiative':
      return { ...state, init: action.id, lang: null }
  }
}

/** Only a range change replaces; everything else pushes. A drag emits a stream of
 *  setRange actions, and pushing each would bury the previous page under dozens
 *  of history entries. */
const REPLACES: FilterAction['type'] = 'setRange'

export function useFilters(): { state: FilterState; dispatch: (a: FilterAction) => void } {
  const [state, rawDispatch] = useReducer(
    filterReducer,
    undefined,
    () => parseFilters(window.location.search),
  )
  const lastAction = useRef<FilterAction['type'] | null>(null)

  const dispatch = useCallback((a: FilterAction): void => {
    lastAction.current = a.type
    rawDispatch(a)
  }, [])

  useEffect(() => {
    const search = toSearch(state)
    const url = `${window.location.pathname}${search}`
    if (url === `${window.location.pathname}${window.location.search}`) return
    if (lastAction.current === REPLACES) window.history.replaceState({}, '', url)
    else window.history.pushState({}, '', url)
  }, [state])

  return { state, dispatch }
}
