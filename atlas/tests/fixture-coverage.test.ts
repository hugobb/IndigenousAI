import { describe, expect, it } from 'vitest'
import { loadBundle } from '../src/lib/load.js'

/** The fixture is a first-class artifact with an obligation: it is what the
 *  dev server, the demo build and every App-level test render, so each honesty
 *  case the spec turns on must have a record here or the case cannot be
 *  exercised end to end. Each assertion below names the case it protects. */
describe('the fixture models every honesty case', () => {
  const b = loadBundle()

  it('is the fixture, not a real bundle', () => {
    expect(b.isDemoData).toBe(true)
  })

  it('has an initiative with no start year (a date window must not delete it)', () => {
    expect(b.initiatives.some((i) => i.started === null)).toBe(true)
  })

  it('has a language with no centre (renders "not mapped")', () => {
    expect(b.languages.some((l) => l.centre === null)).toBe(true)
  })

  it('has a language whose centre is approximate (drawn differently)', () => {
    expect(b.languages.some((l) => l.centre?.confidence === 'approximate')).toBe(true)
  })

  it('has a speaker count its sources disagree about (renders the dagger)', () => {
    expect(b.languages.some((l) => (l.speakers?.conflicts.length ?? 0) > 0)).toBe(true)
  })

  it('has a language with family, region and endangerment all absent', () => {
    expect(
      b.languages.some((l) => l.family === null && l.region === null && l.endangerment === null),
    ).toBe(true)
  })

  it('has a dimension nothing is coded for (renders "not yet curated")', () => {
    expect(b.languages.every((l) => l.endangerment === null)).toBe(true)
  })

  it('has an adjacent-tier initiative carrying a transferability note', () => {
    expect(b.initiatives.some((i) => i.tier === 'adjacent' && i.transferability !== null)).toBe(true)
  })

  it('has a language with no matching work, so the coverage finding shows on first load', () => {
    const worked = new Set(b.initiatives.flatMap((i) => i.languages))
    expect(b.languages.some((l) => !worked.has(l.id))).toBe(true)
  })
})
