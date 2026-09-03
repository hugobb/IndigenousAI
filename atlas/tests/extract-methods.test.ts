import { describe, expect, it } from 'vitest'
import { fileURLToPath } from 'node:url'
import { extractMethods } from '../scripts/extract-methods.js'

const ROOT = fileURLToPath(new URL('./fixtures/techniques', import.meta.url))

describe('extractMethods', () => {
  const methods = extractMethods(ROOT)

  it('skips index.md rather than treating it as a technique', () => {
    expect(methods.map((m) => m.id)).not.toContain('index')
    expect(methods).toHaveLength(2)
  })

  it('derives the id from the filename', () => {
    expect(methods.map((m) => m.id).sort()).toEqual(['sample-process', 'sample-technique'])
  })

  it('takes the name from the H1, not the filename', () => {
    const m = methods.find((x) => x.id === 'sample-technique')
    expect(m?.name).toBe('FST Morphological Segmentation for Polysynthetic MT')
  })

  it('normalises the two category values to ml and process', () => {
    expect(methods.find((x) => x.id === 'sample-technique')?.category).toBe('ml')
    expect(methods.find((x) => x.id === 'sample-process')?.category).toBe('process')
  })

  it('resolves an entity-escaped, two-bucket data regime', () => {
    expect(methods.find((x) => x.id === 'sample-technique')?.data_regime).toEqual(['<1k', '1k-10k'])
  })

  it('retains the original prose alongside the buckets', () => {
    expect(methods.find((x) => x.id === 'sample-technique')?.data_regime_note)
      .toBe('<1K sentences / 1K–10K sentences')
  })

  it('resolves a doc with no Data Regime line to any', () => {
    const m = methods.find((x) => x.id === 'sample-process')
    expect(m?.data_regime).toEqual(['any'])
    expect(m?.data_regime_note).toBeNull()
  })

  it('builds a doc_url pointing into the mkdocs guide', () => {
    expect(methods.find((x) => x.id === 'sample-technique')?.doc_url)
      .toBe('/ml-techniques/sample-technique/')
  })
})
