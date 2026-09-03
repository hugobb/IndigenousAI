import { describe, expect, it } from 'vitest'
import { SourceSchema } from '../src/schema/source.js'

describe('SourceSchema', () => {
  it('accepts a url source with a retrieval date', () => {
    const r = SourceSchema.safeParse({
      kind: 'url', ref: 'https://tehiku.nz/about', retrieved: '2026-09-03',
    })
    expect(r.success).toBe(true)
  })

  it('rejects a url source with no retrieval date', () => {
    const r = SourceSchema.safeParse({ kind: 'url', ref: 'https://tehiku.nz/about' })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error.issues[0]?.message).toMatch(/retrieved/i)
    }
  })

  it('does not require a retrieval date for a paper source', () => {
    const r = SourceSchema.safeParse({ kind: 'paper', ref: 'gibert-et-al-2025-americas-nlp' })
    expect(r.success).toBe(true)
  })

  it('rejects a malformed retrieval date', () => {
    const r = SourceSchema.safeParse({ kind: 'url', ref: 'https://x.test', retrieved: '03-09-2026' })
    expect(r.success).toBe(false)
  })

  it('rejects an empty ref', () => {
    expect(SourceSchema.safeParse({ kind: 'doc', ref: '' }).success).toBe(false)
  })
})
