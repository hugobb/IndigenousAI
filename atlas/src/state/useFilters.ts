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
  | { type: 'fromUrl'; state: FilterState }

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
    case 'fromUrl':
      // The browser already changed the address (Back/Forward); the state
      // just has to catch up wholesale, not merge.
      return action.state
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
  // `null` covers two cases that must both replace rather than push: the
  // initial mount (nothing was dispatched yet) and a `popstate` catch-up
  // (the browser already moved history; re-writing must not move it again).
  const lastAction = useRef<FilterAction['type'] | null>(null)

  const dispatch = useCallback((a: FilterAction): void => {
    lastAction.current = a.type
    rawDispatch(a)
  }, [])

  // Back/Forward changes `window.location` without touching React state: without
  // this listener the address bar moves and the view does not, which is exactly
  // the URL/view disagreement this hook exists to prevent.
  useEffect(() => {
    const onPopState = (): void => {
      lastAction.current = null
      rawDispatch({ type: 'fromUrl', state: parseFilters(window.location.search) })
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    const search = toSearch(state)
    const url = `${window.location.pathname}${search}`
    // Skips the write when the URL already matches — both when nothing new
    // needs saying and, critically, right after `popstate`: dispatching
    // `fromUrl` re-renders with state parsed from the URL the browser just
    // navigated to, and re-serialising it here must be a no-op rather than
    // fighting the navigation that just happened.
    if (url === `${window.location.pathname}${window.location.search}`) return
    // `null` means this write was not requested by a user action — either the
    // initial mount canonicalising a non-canonical URL, or a `popstate`
    // catch-up — so it must replace, never push: a write the reader never
    // asked for must not be undoable with Back.
    if (lastAction.current === null || lastAction.current === REPLACES) {
      window.history.replaceState({}, '', url)
    } else {
      window.history.pushState({}, '', url)
    }
  }, [state])

  return { state, dispatch }
}
