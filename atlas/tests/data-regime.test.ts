import { describe, expect, it } from 'vitest'
import { decodeEntities, normaliseValue } from '../scripts/lib/md.js'
import { resolveDataRegime, UnmappedDataRegimeError } from '../scripts/lib/data-regime.js'

describe('normalisation', () => {
  it('decodes the HTML entities left by the Docusaurus scaffold', () => {
    expect(decodeEntities('&lt;1K sentences &amp; more')).toBe('<1K sentences & more')
  })

  it('lowercases, decodes and collapses whitespace', () => {
    expect(normaliseValue('  &lt;1K   sentences / 1K–10K sentences ')).toBe('<1k sentences / 1k–10k sentences')
  })
})

describe('resolveDataRegime', () => {
  it('maps a single-bucket value', () => {
    expect(resolveDataRegime('Zero-resource (no parallel corpus required)')).toEqual(['zero'])
  })

  it('maps a value that spans two buckets, in ladder order', () => {
    expect(resolveDataRegime('&lt;1K sentences / 1K–10K sentences')).toEqual(['<1k', '1k-10k'])
  })

  it('maps a process technique to `any` rather than coercing it to zero', () => {
    expect(resolveDataRegime('any (evaluation methodology, not a training technique)')).toEqual(['any'])
  })

  it('resolves a missing Data Regime line to `any`', () => {
    expect(resolveDataRegime(null)).toEqual(['any'])
  })

  it('throws on prose it does not know, naming the offending value', () => {
    expect(() => resolveDataRegime('10M sentences, obviously')).toThrow(UnmappedDataRegimeError)
    try {
      resolveDataRegime('10M sentences, obviously')
    } catch (e) {
      expect((e as UnmappedDataRegimeError).value).toBe('10m sentences, obviously')
    }
  })
})
