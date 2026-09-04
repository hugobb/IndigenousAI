import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { initiativeSites, languageFields, unmappedLanguages } from '../src/map/layers.js'
import { InitiativeSchema, LanguageSchema } from '../src/schema/index.js'

const raw = JSON.parse(
  readFileSync(fileURLToPath(new URL('../src/fixtures/atlas.fixture.json', import.meta.url)), 'utf8'),
)
const languages = raw.languages.map((l: unknown) => LanguageSchema.parse(l))
const initiatives = raw.initiatives.map((i: unknown) => InitiativeSchema.parse(i))

describe('languageFields', () => {
  const fc = languageFields(languages)

  it('emits a feature only for a language that has a centre', () => {
    expect(fc.features).toHaveLength(3)
    expect(fc.features.map((f) => f.id).sort())
      .toEqual(['fixture-approximate', 'fixture-conflict', 'fixture-sourced'])
  })

  // D5 (an adjacent-tier language may not carry a centre) is NOT testable from
  // here: the schema makes such a record unconstructible, so any assertion
  // written at this level would only restate the `centre === null` case below.
  // D5 is tested where it is enforced, in `tests/schema.test.ts`.
  it('carries tier on every emitted feature, so the style can key on it', () => {
    expect(fc.features).not.toHaveLength(0)
    for (const f of fc.features) {
      expect(f.properties['tier']).toBe(
        languages.find((l: { id: string }) => l.id === f.id)?.tier,
      )
    }
  })

  it('omits a language whose centre is null rather than placing it at 0,0', () => {
    expect(fc.features.map((f) => f.id)).not.toContain('fixture-unmapped')
  })

  it('carries confidence as a property the map style can key on', () => {
    const approx = fc.features.find((f) => f.id === 'fixture-approximate')
    expect(approx?.properties['confidence']).toBe('approximate')
    const sourced = fc.features.find((f) => f.id === 'fixture-sourced')
    expect(sourced?.properties['confidence']).toBe('sourced')
  })

  it('writes coordinates in GeoJSON order, lon then lat', () => {
    const f = fc.features.find((x) => x.id === 'fixture-sourced')
    expect(f?.geometry.coordinates).toEqual([-73.6, 45.5])
  })

  it('carries name so a marker can be labeled', () => {
    const f = fc.features.find((x) => x.id === 'fixture-sourced')
    expect(f?.properties['name']).toBe('Sourced Centre Language')
  })
})

describe('initiativeSites', () => {
  const fc = initiativeSites(initiatives)

  it('emits every initiative, since site is never null', () => {
    // Bound to the fixture's own length rather than a literal: the claim is
    // "every initiative", and a hard-coded number turns growing the fixture
    // into a test failure that says nothing about `initiativeSites`.
    expect(fc.features).toHaveLength(initiatives.length)
    expect(initiatives.length).toBeGreaterThan(1)
  })

  it('carries tier so the style can draw adjacent pins hollow', () => {
    const adj = fc.features.find((f) => f.id === 'fixture-adjacent-init')
    expect(adj?.properties['tier']).toBe('adjacent')
  })

  it('carries confidence so an approximate site can be drawn out of focus', () => {
    const adj = fc.features.find((f) => f.id === 'fixture-adjacent-init')
    expect(adj?.properties['confidence']).toBe('approximate')
  })

  it('carries whether the initiative has ended', () => {
    expect(fc.features.find((f) => f.id === 'fixture-ended')?.properties['ended']).toBe(2021)
    expect(fc.features.find((f) => f.id === 'fixture-ongoing')?.properties['ended']).toBeNull()
  })

  it('carries started so the timeline can place it', () => {
    expect(fc.features.find((f) => f.id === 'fixture-ended')?.properties['started']).toBe(2018)
  })

  it('carries name so a marker can be labeled', () => {
    const f = fc.features.find((x) => x.id === 'fixture-ongoing')
    expect(f?.properties['name']).toBe('Ongoing Initiative')
  })

  it('writes coordinates in GeoJSON order, lon then lat', () => {
    const f = fc.features.find((x) => x.id === 'fixture-ongoing')
    expect(f?.geometry.coordinates).toEqual([173.26, -35.11])
  })
})

describe('unmappedLanguages', () => {
  const { notMapped, approximate } = unmappedLanguages(languages)

  it('lists languages with no centre, so a gap is stated rather than invisible', () => {
    expect(notMapped.map((l) => l.id).sort()).toEqual(['fixture-adjacent', 'fixture-unmapped'])
  })

  it('lists languages drawn but not to be trusted', () => {
    expect(approximate.map((l) => l.id)).toEqual(['fixture-approximate'])
  })

  it('never lists a language in both groups', () => {
    const overlap = notMapped.filter((n) => approximate.some((a) => a.id === n.id))
    expect(overlap).toEqual([])
  })
})
