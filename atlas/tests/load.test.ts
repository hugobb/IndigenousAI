import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { chooseBundle } from '../src/lib/load.js'

const fixture = JSON.parse(
  readFileSync(fileURLToPath(new URL('../src/fixtures/atlas.fixture.json', import.meta.url)), 'utf8'),
)
const empty = { generated: '2026-01-01T00:00:00.000Z', languages: [], initiatives: [], methods: [], papers: [] }

describe('chooseBundle', () => {
  it('uses the fixture in development when there is no real bundle', () => {
    const b = chooseBundle({ real: null, fixture, isProduction: false })
    expect(b.languages).toHaveLength(5)
  })

  it('prefers the real bundle when one exists', () => {
    const b = chooseBundle({ real: { ...empty, languages: [fixture.languages[0]] }, fixture, isProduction: false })
    expect(b.languages).toHaveLength(1)
  })

  it('refuses to build with no real bundle', () => {
    expect(() => chooseBundle({ real: null, fixture, isProduction: true }))
      .toThrow(/src\/data\/atlas\.json/)
  })

  it('refuses to build from a bundle with no records', () => {
    expect(() => chooseBundle({ real: empty, fixture, isProduction: true }))
      .toThrow(/no verified records/i)
  })

  it('never silently substitutes the fixture in production', () => {
    let err: unknown
    try {
      chooseBundle({ real: null, fixture, isProduction: true })
    } catch (e) {
      err = e
    }
    expect(err).toBeInstanceOf(Error)
    expect((err as Error).message).not.toMatch(/fixture/i)
  })

  it('flags demo data when it fell back to the fixture', () => {
    expect(chooseBundle({ real: null, fixture, isProduction: false }).isDemoData).toBe(true)
  })

  it('does not flag demo data when a real bundle was returned', () => {
    const real = { ...empty, languages: [fixture.languages[0]] }
    expect(chooseBundle({ real, fixture, isProduction: false }).isDemoData).toBe(false)
  })

  it('derives the demo-data flag from what was returned, not from the production flag', () => {
    // A real bundle in production is the only path that legitimately returns
    // records with the flag false; assert it is the RETURNED object that
    // decides, by passing a real bundle while the flag says development.
    const real = { ...empty, initiatives: [fixture.initiatives[0]] }
    const dev = chooseBundle({ real, fixture, isProduction: false })
    const prod = chooseBundle({ real, fixture, isProduction: true })
    expect(dev.isDemoData).toBe(false)
    expect(prod.isDemoData).toBe(false)
    expect(dev.initiatives).toEqual(prod.initiatives)
  })

  it('rejects a bundle whose records do not match the schema', () => {
    const bad = { ...empty, languages: [{ id: 'nope' }] }
    expect(() => chooseBundle({ real: bad, fixture, isProduction: true })).toThrow()
  })
})
