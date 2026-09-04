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
    const langs = fixture['languages'] as {
      id: string
      tier: string
      centre: unknown
      speakers: { conflicts: unknown[] } | null
    }[]
    const inits = fixture['initiatives'] as {
      site: { confidence: string }
      started: number | null
      ended: number | null
    }[]
    expect(langs.some((l) => (l.centre as { confidence: string } | null)?.confidence === 'sourced')).toBe(true)
    expect(langs.some((l) => (l.centre as { confidence: string } | null)?.confidence === 'approximate')).toBe(true)
    expect(langs.some((l) => l.centre === null && l.tier === 'indigenous')).toBe(true)
    expect(langs.some((l) => l.tier === 'adjacent')).toBe(true)
    expect(inits.some((i) => i.site.confidence === 'approximate')).toBe(true)
    expect(inits.some((i) => i.ended !== null)).toBe(true)
    expect(inits.some((i) => i.ended === null)).toBe(true)
    // Spec F5: an initiative with no `started` must survive every date window,
    // because Te Hiku Media records none. Without an undated record HERE the
    // rule has no end-to-end path at all — not in `pnpm dev`, not in the demo
    // build, not in any App-level test — so it is asserted as a named awkward
    // case rather than left to whichever record happens to exist.
    expect(inits.some((i) => i.started === null)).toBe(true)
    expect(inits.some((i) => i.started !== null)).toBe(true)
    // Spec §8: a speaker-count disagreement is a named awkward case, not just
    // an incidental field value. Assert it exists, not merely that it parses.
    expect(langs.some((l) => l.speakers !== null && l.speakers.conflicts.length > 0)).toBe(true)
  })

  it('populates every collection the bundle is supposed to carry', () => {
    // A per-record loop (`for (const m of fixture['methods']!) expect(...)`)
    // asserts nothing when the array is empty, so emptying `methods` or
    // `papers` slipped past every other test here. Assert non-emptiness
    // directly, for every top-level collection.
    expect((fixture['languages'] as unknown[]).length).toBeGreaterThan(0)
    expect((fixture['initiatives'] as unknown[]).length).toBeGreaterThan(0)
    expect((fixture['methods'] as unknown[]).length).toBeGreaterThan(0)
    expect((fixture['papers'] as unknown[]).length).toBeGreaterThan(0)
  })

  it('links an initiative to a method and a paper that resolve within the fixture', () => {
    // Spec §8: the fixture must contain an initiative referencing a method id
    // and a paper id that resolve within the fixture — the link that makes
    // the map an index into the guide. Assert resolution, not just
    // non-emptiness: a dangling id is the more likely regression.
    const methodIds = new Set((fixture['methods'] as { id: string }[]).map((m) => m.id))
    const paperIds = new Set((fixture['papers'] as { id: string }[]).map((p) => p.id))
    const inits = fixture['initiatives'] as { methods: string[]; papers: string[] }[]
    const linked = inits.filter((i) => i.methods.length > 0 && i.papers.length > 0)
    expect(linked.length).toBeGreaterThan(0)
    for (const i of linked) {
      for (const id of i.methods) expect(methodIds.has(id)).toBe(true)
      for (const id of i.papers) expect(paperIds.has(id)).toBe(true)
    }
  })
})
