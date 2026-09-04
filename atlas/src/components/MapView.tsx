import { useRef } from 'react'
import type { PointCollection } from '../map/layers.js'
import { useMap } from '../map/useMap.js'

export interface MapViewProps {
  languages: PointCollection
  initiatives: PointCollection
  selectedLanguageId: string | null
  onSelectLanguage: (id: string | null) => void
  onSelectInitiative: (id: string | null) => void
}

export default function MapView(props: MapViewProps): React.JSX.Element {
  const container = useRef<HTMLDivElement | null>(null)
  useMap(
    container,
    {
      languages: props.languages,
      initiatives: props.initiatives,
      selectedLanguageId: props.selectedLanguageId,
    },
    { onSelectLanguage: props.onSelectLanguage, onSelectInitiative: props.onSelectInitiative },
  )
  return <div ref={container} role="application" aria-label="Map of Indigenous language NLP initiatives" style={{ position: 'absolute', inset: 0 }} />
}
