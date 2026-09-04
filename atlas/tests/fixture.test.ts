import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { InitiativeSchema, LanguageSchema, MethodSchema, PaperSchema } from '../src/schema/index.js'

const fixture = JSON.parse(
  readFileSync(fileURLToPath(new URL('../src/fixtures/atlas.fixture.json', import.meta.url)), 'utf8'),
) as Record<string, unknown[]>

describe('the fixture bundle', () => {
  it('parses every language against the real schema', () => {
    for (const l of fixture['languages']!) {
      const r = LanguageSchema.safeParse(l)
      expect(r.success, JSON.stringify(r.success ? '' : r.error.issues)).toBe(true)
    }
  })

  it('parses every initiative against the real schema', () => {
    for (const i of fixture['initiatives']!) {
      const r = InitiativeSchema.safeParse(i)
      expect(r.success, JSON.stringify(r.success ? '' : r.error.issues)).toBe(true)
    }
  })

  it('parses methods and papers', () => {
    for (const m of fixture['methods']!) expect(MethodSchema.safeParse(m).success).toBe(true)
    for (const p of fixture['papers']!) expect(PaperSchema.safeParse(p).success).toBe(true)
  })

  it('holds only verified records, because a bundle only ever contains verified records', () => {
    for (const r of [...fixture['languages']!, ...fixture['initiatives']!]) {
      expect((r as { status: string }).status).toBe('verified')
    }
  })

  it('exercises every path the map has to handle', () => {
    const langs = fixture['languages'] as { id: string; tier: string; centre: unknown }[]
    const inits = fixture['initiatives'] as { site: { confidence: string }; ended: number | null }[]
    expect(langs.some((l) => (l.centre as { confidence: string } | null)?.confidence === 'sourced')).toBe(true)
    expect(langs.some((l) => (l.centre as { confidence: string } | null)?.confidence === 'approximate')).toBe(true)
    expect(langs.some((l) => l.centre === null && l.tier === 'indigenous')).toBe(true)
    expect(langs.some((l) => l.tier === 'adjacent')).toBe(true)
    expect(inits.some((i) => i.site.confidence === 'approximate')).toBe(true)
    expect(inits.some((i) => i.ended !== null)).toBe(true)
    expect(inits.some((i) => i.ended === null)).toBe(true)
  })
})
