import { useEffect, useMemo } from 'react'
import { loadBundle } from '../lib/load.js'
import { applyFilters, emptyState, facetSummaries, yearRange } from '../lib/filters.js'
import { snapshotDate } from '../lib/snapshot.js'
import { useFilters } from '../state/useFilters.js'
import { initiativeSites, languageFields } from '../map/layers.js'
import MapView from './MapView.js'
import LanguagePanel from './LanguagePanel.js'
import InitiativePanel from './InitiativePanel.js'
import UnmappedList from './UnmappedList.js'
import FacetPanel from './FacetPanel.js'
import Timeline from './Timeline.js'
import TableView from './TableView.js'
import ViewSwitch from './ViewSwitch.js'
import OutsideFiltersNotice from './OutsideFiltersNotice.js'

export default function App(): React.JSX.Element {
  const bundle = useMemo(() => loadBundle(), [])
  const { state, dispatch } = useFilters()

  const selection = useMemo(() => applyFilters(bundle, state), [bundle, state])
  const summaries = useMemo(() => facetSummaries(bundle, state), [bundle, state])
  const years = useMemo(() => yearRange(bundle), [bundle])

  // Looked up in the BUNDLE, not the selection: a record the filters exclude
  // still exists, and the page has to be able to say so.
  const language = bundle.languages.find((l) => l.id === state.lang) ?? null
  const initiative = bundle.initiatives.find((i) => i.id === state.init) ?? null

  const languageInSelection = selection.languages.some((l) => l.id === state.lang)
  const initiativeInSelection = selection.initiatives.some((i) => i.id === state.init)

  // `selection.workFiltered` alone under-reports whether a filter could
  // explain an empty work list on the LanguagePanel: a language a facet has
  // excluded from L1 can still name a real initiative, one the
  // language-intersection clause in `applyFilters` then drops from
  // `selection.initiatives` with no work filter active at all (fix round 2 —
  // this was a false "no work exists" claim on a language whose work a
  // region/typology/etc. filter, not the atlas, was hiding).
  const languagePanelFiltered = selection.workFiltered || !languageInSelection

  const outside: 'language' | 'initiative' | null =
    language !== null && !languageInSelection ? 'language'
    : initiative !== null && !initiativeInSelection ? 'initiative'
    : null

  // A stale or mistyped id names nothing. Degrading it away matches how the
  // codec already treats unknown keys and values.
  useEffect(() => {
    const lang = state.lang !== null && language === null
    const init = state.init !== null && initiative === null
    if (lang || init) dispatch({ type: 'dropUnknownSelection', lang, init })
  }, [state.lang, state.init, language, initiative, dispatch])

  // The timeline filters in `applyFilters` and occupies two URL keys, so it is
  // an active filter and has to be counted as one — otherwise constraining only
  // the date renders no Clear-all control at all, and the reader has no way back
  // short of editing the URL. It counts as ONE regardless of whether one bound
  // or both are set: it is one control.
  const timelineActive = state.from !== null || state.to !== null
  const activeCount =
    summaries.reduce((n, s) => n + s.selected.length, 0) + (timelineActive ? 1 : 0)

  const empty = emptyState(selection)
  const nWorkless = selection.noMatchingWork.length

  return (
    <main className="atlas">
      <header className="atlas__masthead">
        <h1>Atlas of Indigenous Language NLP</h1>
        <p className="atlas__standfirst">
          Companion map to the review. Each point is a single approximate location, never a
          territory or a boundary.
        </p>
        <p className="atlas__generated" data-testid="data-version">
          Data snapshot: {snapshotDate(bundle.generated)}
        </p>
      </header>

      {bundle.isDemoData && (
        <p className="atlas__notice" role="alert" data-testid="demo-data-banner">
          <strong>Demonstration data.</strong> Every record on this page is an invented
          placeholder used for development. The places, families, coordinates and speaker
          counts shown here are not research data and must not be cited or screenshotted as
          such. The real atlas is built only from human-reviewed records.
        </p>
      )}

      <div className="atlas__timeline">
        {years !== null && (
          <Timeline
            min={years.min} max={years.max} from={state.from} to={state.to}
            undatedCount={selection.undatedInitiatives}
            onChange={(from, to) => dispatch({ type: 'setRange', from, to })}
          />
        )}
      </div>

      <div className="atlas__rail">
        <FacetPanel
          summaries={summaries}
          activeCount={activeCount}
          onToggle={(facet, value) => dispatch({ type: 'toggle', facet, value })}
          onClearAll={() => dispatch({ type: 'clearAll' })}
          onClearFacet={(facet) => dispatch({ type: 'clearFacet', facet })}
        />
        {empty === 'nothing-matched' && (
          <p className="card empty" data-testid="empty-result">
            Nothing matches the current filters.
          </p>
        )}
        {empty === 'no-work-but-languages' && (
          <p className="card empty" data-testid="no-matching-work">
            {selection.workFiltered
              ? 'No initiative matches the current filters.'
              : 'No initiative in this atlas works on these languages.'}{' '}
            {nWorkless}{' '}
            {nWorkless === 1 ? 'language' : 'languages'} matched your language filters
            and {nWorkless === 1 ? 'is' : 'are'} listed below.
          </p>
        )}
        <UnmappedList
          languages={selection.languages}
          noMatchingWork={selection.noMatchingWork}
          workFiltered={selection.workFiltered}
          onSelect={(id) => dispatch({ type: 'selectLanguage', id })}
        />
        {outside !== null && (
          <OutsideFiltersNotice
            kind={outside}
            onClearFilters={() => dispatch({ type: 'clearAll' })}
            onDeselect={() =>
              dispatch(
                outside === 'language'
                  ? { type: 'selectLanguage', id: null }
                  : { type: 'selectInitiative', id: null },
              )
            }
          />
        )}
        {language !== null && (
          <LanguagePanel
            language={language}
            initiatives={selection.initiatives.filter((i) => i.languages.includes(language.id))}
            filtered={languagePanelFiltered}
          />
        )}
        {initiative !== null && <InitiativePanel initiative={initiative} methods={bundle.methods} />}
      </div>

      <div className="atlas__pane">
        <ViewSwitch
          view={state.view}
          counts={{
            initiatives: selection.initiatives.length,
            languages: selection.languages.length,
          }}
          onChange={(view) => dispatch({ type: 'setView', view })}
        />
        {state.view === 'map' ? (
          <MapView
            languages={languageFields(selection.languages)}
            initiatives={initiativeSites(selection.initiatives)}
            selectedLanguageId={state.lang}
            onSelectLanguage={(id) => dispatch({ type: 'selectLanguage', id })}
            onSelectInitiative={(id) => dispatch({ type: 'selectInitiative', id })}
          />
        ) : (
          <TableView
            view={state.view}
            selection={selection}
            bundle={bundle}
            sort={state.sort}
            onSort={(sort) => dispatch({ type: 'setSort', sort })}
            selectedId={state.view === 'languages' ? state.lang : state.init}
            onSelect={(id) =>
              dispatch(
                state.view === 'languages'
                  ? { type: 'selectLanguage', id }
                  : { type: 'selectInitiative', id },
              )
            }
          />
        )}
      </div>
    </main>
  )
}
