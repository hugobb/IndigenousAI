import maplibregl, { type Map as MapLibreMap } from 'maplibre-gl'
import { useEffect, useRef } from 'react'
import type { PointCollection } from './layers.js'
import { BASEMAP_STYLE, LAYERS, SOURCE_INITIATIVES, SOURCE_LANGUAGES } from './style.js'

const EMPTY: PointCollection = { type: 'FeatureCollection', features: [] }

export interface MapData {
  languages: PointCollection
  initiatives: PointCollection
  selectedLanguageId: string | null
}

export interface MapHandlers {
  onSelectLanguage: (id: string | null) => void
  onSelectInitiative: (id: string | null) => void
}

/** Creates the map once. Data changes go through `setData` and `setFilter` —
 *  never by removing and re-adding layers, which flickers and leaks handlers. */
export function useMap(
  container: React.RefObject<HTMLDivElement | null>,
  data: MapData,
  handlers: MapHandlers,
): void {
  const mapRef = useRef<MapLibreMap | null>(null)
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  useEffect(() => {
    if (!container.current || mapRef.current) return
    const map = new maplibregl.Map({
      container: container.current,
      style: BASEMAP_STYLE,
      center: [-40, 25],
      zoom: 1.6,
    })
    mapRef.current = map

    map.on('load', () => {
      map.addSource(SOURCE_LANGUAGES, { type: 'geojson', data: EMPTY })
      map.addSource(SOURCE_INITIATIVES, { type: 'geojson', data: EMPTY })
      for (const layer of LAYERS) map.addLayer(layer)

      map.on('click', 'initiative-site', (e) => {
        const id = e.features?.[0]?.properties?.['id']
        handlersRef.current.onSelectInitiative(typeof id === 'string' ? id : null)
      })
      map.on('click', 'language-field', (e) => {
        const id = e.features?.[0]?.properties?.['id']
        handlersRef.current.onSelectLanguage(typeof id === 'string' ? id : null)
      })
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [container])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return
    ;(map.getSource(SOURCE_LANGUAGES) as maplibregl.GeoJSONSource | undefined)?.setData(data.languages)
    ;(map.getSource(SOURCE_INITIATIVES) as maplibregl.GeoJSONSource | undefined)?.setData(data.initiatives)
    map.setFilter('language-field-selected', ['==', ['get', 'id'], data.selectedLanguageId ?? ''])
  }, [data])
}
