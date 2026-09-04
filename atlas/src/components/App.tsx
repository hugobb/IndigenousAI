import { useMemo } from 'react'
import { loadBundle } from '../lib/load.js'
import { applyFilters, facetSummaries, yearRange } from '../lib/filters.js'
import { snapshotDate } from '../lib/snapshot.js'
import { useFilters } from '../state/useFilters.js'
import { initiativeSites, languageFields } from '../map/layers.js'
import MapView from './MapView.js'
import LanguagePanel from './LanguagePanel.js'
import InitiativePanel from './InitiativePanel.js'
import UnmappedList from './UnmappedList.js'
import FacetPanel from './FacetPanel.js'
import Timeline from './Timeline.js'

export default function App(): React.JSX.Element {
  const bundle = useMemo(() => loadBundle(), [])
  const { state, dispatch } = useFilters()

  const selection = useMemo(() => applyFilters(bundle, state), [bundle, state])
  const summaries = useMemo(() => facetSummaries(bundle, state), [bundle, state])
  const years = useMemo(() => yearRange(bundle), [bundle])

  const language = selection.languages.find((l) => l.id === state.lang)
    ?? selection.filteredOut.find((l) => l.id === state.lang)
    ?? null
  const initiative = selection.initiatives.find((i) => i.id === state.init) ?? null

  // The timeline filters in `applyFilters` and occupies two URL keys, so it is
  // an active filter and has to be counted as one — otherwise constraining only
  // the date renders no Clear-all control at all, and the reader has no way back
  // short of editing the URL. It counts as ONE regardless of whether one bound
  // or both are set: it is one control.
  const timelineActive = state.from !== null || state.to !== null
  const activeCount =
    summaries.reduce((n, s) => n + s.selected.length, 0) + (timelineActive ? 1 : 0)

  // Spec F1: a non-empty `filteredOut` IS the answer to the reader's question —
  // "no work of this kind exists for these languages" — so it cannot also be
  // "nothing matches". Denying it here put a false denial ABOVE the true finding
  // at `?region=africa&application=asr`, on the one screen this all exists for.
  const noWorkButLanguages =
    selection.initiatives.length === 0 && selection.filteredOut.length > 0
  const nothingMatched =
    selection.languages.length === 0 &&
    selection.initiatives.length === 0 &&
    selection.filteredOut.length === 0
  const nFilteredOut = selection.filteredOut.length

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
        />
        {nothingMatched && (
          <p className="card empty" data-testid="empty-result">
            Nothing matches the current filters.
          </p>
        )}
        {noWorkButLanguages && (
          <p className="card empty" data-testid="no-matching-work">
            No initiative matches the current filters. {nFilteredOut}{' '}
            {nFilteredOut === 1 ? 'language' : 'languages'} matched your language filters
            and {nFilteredOut === 1 ? 'is' : 'are'} listed below.
          </p>
        )}
        <UnmappedList
          languages={selection.languages}
          filteredOut={selection.filteredOut}
          onSelect={(id) => dispatch({ type: 'selectLanguage', id })}
        />
        {language !== null && (
          <LanguagePanel
            language={language}
            initiatives={selection.initiatives.filter((i) => i.languages.includes(language.id))}
          />
        )}
        {initiative !== null && <InitiativePanel initiative={initiative} methods={bundle.methods} />}
      </div>

      <div className="atlas__map">
        <MapView
          languages={languageFields(selection.languages)}
          initiatives={initiativeSites(selection.initiatives)}
          selectedLanguageId={state.lang}
          onSelectLanguage={(id) => dispatch({ type: 'selectLanguage', id })}
          onSelectInitiative={(id) => dispatch({ type: 'selectInitiative', id })}
        />
      </div>
    </main>
  )
}
