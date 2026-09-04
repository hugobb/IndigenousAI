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

  return (
    <main>
      <h1>Atlas of Indigenous Language NLP</h1>
      <MapView
        languages={languageFields(bundle.languages)}
        initiatives={initiativeSites(bundle.initiatives)}
        selectedLanguageId={languageId}
        onSelectLanguage={(id) => { setLanguageId(id); setInitiativeId(null) }}
        onSelectInitiative={(id) => { setInitiativeId(id); setLanguageId(null) }}
      />
      <UnmappedList languages={bundle.languages} onSelect={setLanguageId} />
      {language !== null && (
        <LanguagePanel
          language={language}
          initiatives={bundle.initiatives.filter((i) => i.languages.includes(language.id))}
        />
      )}
      {initiative !== null && <InitiativePanel initiative={initiative} methods={bundle.methods} />}
    </main>
  )
}
