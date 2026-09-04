import type { CircleLayerSpecification, StyleSpecification } from 'maplibre-gl'

export const SOURCE_LANGUAGES = 'language-fields'
export const SOURCE_INITIATIVES = 'initiative-sites'

const INK = '#5b7a8c'
const ACCENT = '#c2703d'
const ACCENT_MUTED = '#cf9d80' // desaturated ACCENT, mirroring the INK/MUTED pairing
const MUTED = '#9aa5ab'

export const BASEMAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    basemap: {
      type: 'raster',
      tiles: ['https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors © CARTO',
    },
  },
  layers: [{ id: 'basemap', type: 'raster', source: 'basemap' }],
}

/** Spec §4: each channel carries exactly ONE meaning.
 *  - A language field is ALWAYS heavily blurred. That softness is the
 *    "no boundary claim" statement; it never encodes confidence or size.
 *  - An approximate CENTRE differs by COLOUR (desaturated), never by blur.
 *  - An approximate SITE differs by BLUR — the pin is literally out of focus.
 *  - Tier is fill vs hollow on pins. */
/** All three are circle layers, typed concretely so `paint['circle-blur']` is
 *  reachable without a union narrowing dance in both the style and its test. */
export const LAYERS: CircleLayerSpecification[] = [
  {
    id: 'language-field',
    type: 'circle',
    source: SOURCE_LANGUAGES,
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 18, 6, 60, 10, 160],
      'circle-blur': 1.2,
      'circle-opacity': 0.35,
      'circle-color': ['match', ['get', 'confidence'], 'approximate', MUTED, INK],
    },
  },
  {
    id: 'language-field-selected',
    type: 'circle',
    source: SOURCE_LANGUAGES,
    filter: ['==', ['get', 'id'], ''],
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 18, 6, 60, 10, 160],
      'circle-blur': 1.2,
      'circle-opacity': 0.55,
      // Selection is its own channel (accent vs. ink), confidence is another
      // (saturated vs. muted) — they must stay independent, or a selected
      // approximate centre reads as sourced right when a reader is looking
      // most closely at it.
      'circle-color': ['match', ['get', 'confidence'], 'approximate', ACCENT_MUTED, ACCENT],
    },
  },
  {
    id: 'initiative-site',
    type: 'circle',
    source: SOURCE_INITIATIVES,
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 4, 8, 9],
      'circle-blur': ['match', ['get', 'confidence'], 'approximate', 0.9, 0],
      'circle-color': ['match', ['get', 'confidence'], 'approximate', MUTED, INK],
      // Tier is fill-vs-no-fill and NOTHING else: an adjacent pin has no fill
      // at all, an indigenous one is solid. A partial opacity (this was 0.15)
      // reads to most viewers as low confidence, which is the exact conflation
      // §4 exists to prevent — and it compounded with the approximate blur
      // above into a pin nobody could see.
      'circle-opacity': ['match', ['get', 'tier'], 'adjacent', 0, 1],
      'circle-stroke-width': 1.5,
      // The stroke is what makes a hollow pin visible at all, so it is fully
      // opaque for both tiers. Only its COLOUR varies, and only by confidence.
      'circle-stroke-opacity': 1,
      'circle-stroke-color': ['match', ['get', 'confidence'], 'approximate', MUTED, INK],
    },
  },
]
