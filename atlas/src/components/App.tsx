import { useMemo, useState } from 'react'
import { loadBundle } from '../lib/load.js'
import { initiativeSites, languageFields } from '../map/layers.js'
import MapView from './MapView.js'
import LanguagePanel from './LanguagePanel.js'
import InitiativePanel from './InitiativePanel.js'
import UnmappedList from './UnmappedList.js'

export default function App(): React.JSX.Element {
  const bundle = useMemo(() => loadBundle(), [])
  const [languageId, setLanguageId] = useState<string | null>(null)
  const [initiativeId, setInitiativeId] = useState<string | null>(null)

  const language = bundle.languages.find((l) => l.id === languageId) ?? null
  const initiative = bundle.initiatives.find((i) => i.id === initiativeId) ?? null

  // One selection at a time, and the SAME handler for both ways in. The
  // unmapped list used to call `setLanguageId` bare, which left a stale
  // initiative panel open beside the new language panel — two records
  // presented as one reading.
  const selectLanguage = (id: string | null): void => {
    setLanguageId(id)
    setInitiativeId(null)
  }
  const selectInitiative = (id: string | null): void => {
    setInitiativeId(id)
    setLanguageId(null)
  }

  return (
    <main className="atlas">
      <header className="atlas__masthead">
        <h1>Atlas of Indigenous Language NLP</h1>
        <p className="atlas__standfirst">
          Companion map to the review. Each point is a single approximate location, never a
          territory or a boundary.
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

      <div className="atlas__rail">
        <UnmappedList languages={bundle.languages} onSelect={selectLanguage} />
        {language !== null && (
          <LanguagePanel
            language={language}
            initiatives={bundle.initiatives.filter((i) => i.languages.includes(language.id))}
          />
        )}
        {initiative !== null && <InitiativePanel initiative={initiative} methods={bundle.methods} />}
      </div>

      <div className="atlas__map">
        <MapView
          languages={languageFields(bundle.languages)}
          initiatives={initiativeSites(bundle.initiatives)}
          selectedLanguageId={languageId}
          onSelectLanguage={selectLanguage}
          onSelectInitiative={selectInitiative}
        />
      </div>
    </main>
  )
}
