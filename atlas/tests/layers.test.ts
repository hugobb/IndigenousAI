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

  it('omits adjacent-tier languages, which carry no centre by D5', () => {
    expect(fc.features.map((f) => f.id)).not.toContain('fixture-adjacent')
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
})

describe('initiativeSites', () => {
  const fc = initiativeSites(initiatives)

  it('emits every initiative, since site is never null', () => {
    expect(fc.features).toHaveLength(3)
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
