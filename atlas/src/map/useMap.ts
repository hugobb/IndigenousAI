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

/** Pushes the current data onto an already-loaded map. Pulled out of the
 *  effects so both the 'load' handler (first population) and the data
 *  effect (subsequent updates) call the exact same code. */
function syncData(map: MapLibreMap, data: MapData): void {
  ;(map.getSource(SOURCE_LANGUAGES) as maplibregl.GeoJSONSource | undefined)?.setData(data.languages)
  ;(map.getSource(SOURCE_INITIATIVES) as maplibregl.GeoJSONSource | undefined)?.setData(data.initiatives)
  map.setFilter('language-field-selected', ['==', ['get', 'id'], data.selectedLanguageId ?? ''])
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
  const dataRef = useRef(data)
  dataRef.current = data
  // `map.isStyleLoaded()` reflects transient style/tile state and can go back
  // to false after 'load' has already fired — it is not a reliable "can I
  // call setData now" gate. This ref is set once, inside 'load', and stays
  // true for the life of the map instance.
  const readyRef = useRef(false)

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

      // The data effect below may already have run once (and no-opped,
      // since the style wasn't ready) before 'load' fires — most likely on
      // the very first render, since loadBundle() is eager and synchronous
      // and the map may never receive a second data effect run. Populate
      // with whatever the latest data is right now so that first population
      // is never dropped.
      readyRef.current = true
      syncData(map, dataRef.current)
    })

    return () => {
      map.remove()
      mapRef.current = null
      readyRef.current = false
    }
  }, [container])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !readyRef.current) return
    syncData(map, data)
  }, [data])
}
