import { describe, expect, it } from 'vitest'
import { BASEMAP_STYLE, LAYERS, SOURCE_INITIATIVES, SOURCE_LANGUAGES } from '../src/map/style.js'

const byId = (id: string) => LAYERS.find((l) => l.id === id)

describe('map style', () => {
  it('names a raster basemap with attribution, since CARTO requires it', () => {
    const src = BASEMAP_STYLE.sources['basemap'] as { attribution?: string }
    expect(src.attribution).toMatch(/carto/i)
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
    const l = byId('initiative-site')
    expect(JSON.stringify(l?.paint?.['circle-opacity'])).toMatch(/adjacent/)
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
