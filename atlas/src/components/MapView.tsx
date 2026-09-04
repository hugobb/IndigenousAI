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
  // Fills its pane and is positioned WITHIN it. An earlier version was
  // `position: absolute; inset: 0`, which — with no positioned ancestor —
  // sized itself to the viewport and painted the opaque basemap over the
  // heading, the notice and both panels, swallowing their clicks. jsdom has
  // no layout engine, so no test in this suite could see that.
  return (
    <div
      ref={container}
      className="atlas__canvas"
      role="application"
      aria-label="Map of Indigenous language NLP initiatives"
    />
  )
}
