import { describe, expect, it } from 'vitest'
import { BASEMAP_STYLE, LAYERS, SOURCE_INITIATIVES, SOURCE_LANGUAGES } from '../src/map/style.js'

const byId = (id: string) => LAYERS.find((l) => l.id === id)

describe('map style', () => {
  it('points at a basemap style that needs no API key', () => {
    // The previous basemap was CARTO's keyless raster endpoint, which had begun
    // stamping "API KEY REQUIRED" diagonally across every tile — a watermark
    // that would have ended up in a published figure. A credential in this URL
    // means the basemap has stopped being usable for this artifact.
    expect(BASEMAP_STYLE).toBe('https://tiles.openfreemap.org/styles/positron')
    expect(BASEMAP_STYLE).not.toMatch(/[?&]|apikey|api_key|access_token|token=/i)
  })

  it('leaves the basemap a bare style URL, with no layers of our own baked in', () => {
    // Everything we draw goes through LAYERS, added after 'load'. If a basemap
    // layer ever appears in LAYERS, the §4 channel assertions below stop
    // covering the whole of what the map draws.
    expect(typeof BASEMAP_STYLE).toBe('string')
    expect(LAYERS.map((l) => l.source).sort()).toEqual(
      [SOURCE_INITIATIVES, SOURCE_LANGUAGES, SOURCE_LANGUAGES].sort(),
    )
  })

  it('holds the language-field blur constant, so softness only ever means "no boundary claim"', () => {
    // Not a duplicate of the blur assertions below: this one is about the two
    // language layers AGREEING. The moment they differ, blur has started to
    // encode something (selection, confidence, size) and §4 is broken.
    const base = byId('language-field')?.paint?.['circle-blur']
    const selected = byId('language-field-selected')?.paint?.['circle-blur']
    expect(typeof base).toBe('number')
    expect(selected).toBe(base)
  })

  it('draws language fields as a heavily blurred circle, not a heatmap or a polygon', () => {
    const l = byId('language-field')
    expect(l?.type).toBe('circle')
    expect(l?.source).toBe(SOURCE_LANGUAGES)
    expect(Number(l?.paint?.['circle-blur'])).toBeGreaterThanOrEqual(1)
  })

  it('desaturates an approximate language field rather than blurring it further', () => {
    const l = byId('language-field')
    expect(JSON.stringify(l?.paint?.['circle-color'])).toMatch(/approximate/)
    expect(typeof l?.paint?.['circle-blur']).toBe('number')
  })

  it('draws initiative pins crisp when sourced and blurred when approximate', () => {
    const l = byId('initiative-site')
    expect(l?.source).toBe(SOURCE_INITIATIVES)
    expect(JSON.stringify(l?.paint?.['circle-blur'])).toMatch(/approximate/)
  })

  it('draws adjacent-tier pins hollow so tier reads without a legend', () => {
    // Asserting the VALUES, not merely that the expression mentions 'adjacent'.
    // The previous version of this test passed for a 0.15 fill, for the two
    // branches swapped, and for any pair of numbers at all — which is how a
    // near-invisible adjacent pin shipped under a test named "hollow".
    const l = byId('initiative-site')
    expect(l?.paint?.['circle-opacity']).toEqual(['match', ['get', 'tier'], 'adjacent', 0, 1])
  })

  it('keeps the outline of a hollow pin fully opaque, or tier would erase it', () => {
    const l = byId('initiative-site')
    expect(l?.paint?.['circle-stroke-opacity']).toBe(1)
    expect(Number(l?.paint?.['circle-stroke-width'])).toBeGreaterThan(0)
  })

  it('never lets tier and confidence share a channel on the pins', () => {
    const l = byId('initiative-site')
    // Tier owns opacity; confidence owns colour and blur. Each channel names
    // exactly one of the two properties, never both (spec §4).
    const tierOnly = ['circle-opacity']
    const confidenceOnly = ['circle-color', 'circle-blur', 'circle-stroke-color']
    for (const key of tierOnly) {
      const json = JSON.stringify(l?.paint?.[key as 'circle-opacity'])
      expect(json).toMatch(/tier/)
      expect(json).not.toMatch(/confidence/)
    }
    for (const key of confidenceOnly) {
      const json = JSON.stringify(l?.paint?.[key as 'circle-color'])
      expect(json).toMatch(/confidence/)
      expect(json).not.toMatch(/tier/)
    }
  })

  it('separates selection into its own layer over the same source', () => {
    const sel = byId('language-field-selected')
    expect(sel?.source).toBe(SOURCE_LANGUAGES)
    expect(JSON.stringify(sel?.filter)).toMatch(/id/)
  })

  it('keeps confidence visible on a selected language field, not masked by the accent colour', () => {
    const sel = byId('language-field-selected')
    expect(JSON.stringify(sel?.paint?.['circle-color'])).toMatch(/approximate/)
    // Selection must never borrow the language layer's one constant meaning.
    expect(typeof sel?.paint?.['circle-blur']).toBe('number')
    expect(Number(sel?.paint?.['circle-blur'])).toBeGreaterThanOrEqual(1)
  })
})
