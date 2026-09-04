import { useCallback, useEffect, useReducer, useRef } from 'react'
import type { FacetId } from '../lib/facets.js'
import { columnIds, type SortState, type ViewId } from '../lib/columns.js'
import { EMPTY_FILTERS, parseFilters, toSearch, type FilterState } from '../lib/url-state.js'

export type FilterAction =
  | { type: 'toggle'; facet: FacetId; value: string }
  | { type: 'clearFacet'; facet: FacetId }
  | { type: 'clearAll' }
  | { type: 'setRange'; from: number | null; to: number | null }
  | { type: 'selectLanguage'; id: string | null }
  | { type: 'selectInitiative'; id: string | null }
  | { type: 'fromUrl'; state: FilterState }
  | { type: 'setView'; view: ViewId }
  | { type: 'setSort'; sort: SortState | null }
  | { type: 'dropUnknownSelection'; lang: boolean; init: boolean }

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
      // Clears the query, keeps the open panel and keeps where the reader is
      // looking: clearing filters should neither close the record being read
      // nor throw them back to the map.
      return {
        ...EMPTY_FILTERS,
        lang: state.lang, init: state.init,
        view: state.view, sort: state.sort,
      }
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
    case 'setView': {
      // A sort the new view has no column for would sit in the URL describing
      // nothing. Dropped here so state is canonical before it is serialised.
      const sort =
        state.sort !== null && columnIds(action.view).includes(state.sort.column)
          ? state.sort
          : null
      return { ...state, view: action.view, sort }
    }
    case 'setSort':
      return { ...state, sort: action.sort }
    case 'dropUnknownSelection':
      return {
        ...state,
        lang: action.lang ? null : state.lang,
        init: action.init ? null : state.init,
      }
  }
}

/** Actions whose URL write REPLACES rather than pushes. A range drag emits a
 *  stream of setRange actions and pushing each would bury the previous page.
 *  Dropping an unknown id is a correction the reader never asked for, so Back
 *  must not walk them into the broken URL they just left. */
const REPLACES = new Set<FilterAction['type']>(['setRange', 'dropUnknownSelection'])

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
    if (lastAction.current === null || REPLACES.has(lastAction.current)) {
      window.history.replaceState({}, '', url)
    } else {
      window.history.pushState({}, '', url)
    }
  }, [state])

  return { state, dispatch }
}
