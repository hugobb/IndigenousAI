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

  // Task 7 gives `endangerment` a fixture path (extra scope, ruled in
  // alongside the brief): a language now carries a status, so `endangerment`
  // is no longer a dimension nothing is coded for — it was the only one of
  // the four language facets (family, typology, endangerment, region) with
  // zero coverage, so this assertion can no longer hold for ANY of them. That
  // failure is the signal the new fixture path exists, not a regression: the
  // "not yet curated" render itself stays independently guarded against
  // synthetic `FacetGroup` summaries in facet-panel.test.tsx and
  // facet-collapse.test.tsx, which never depended on the real fixture. The
  // fixture's new fact is the opposite one — assert it explicitly rather than
  // deleting the guard.
  it('has some coded value for every language facet, now that endangerment does too', () => {
    expect(b.languages.some((l) => l.family !== null)).toBe(true)
    expect(b.languages.some((l) => l.typology.length > 0)).toBe(true)
    expect(b.languages.some((l) => l.endangerment !== null)).toBe(true)
    expect(b.languages.some((l) => l.region !== null)).toBe(true)
  })

  it('has an initiative with a link, so the links field has a path', () => {
    expect(b.initiatives.some((i) => i.links.length > 0)).toBe(true)
  })

  it('has a language with every identifier populated', () => {
    expect(
      b.languages.some(
        (l) => l.glottocode !== null && l.iso639_3 !== null &&
               l.subfamily !== null && l.countries.length > 0,
      ),
    ).toBe(true)
  })

  // Exercises the rule that `retrieved` is omitted rather than called
  // "not recorded" for a non-url source.
  it('has a doc source with no retrieval date', () => {
    const sources = [
      ...b.languages.flatMap((l) => [l.centre?.source, l.speakers?.source, l.endangerment?.source]),
      ...b.initiatives.flatMap((i) => [i.site.source, i.governance?.source]),
    ].filter((s) => s != null)
    expect(sources.some((s) => s.kind === 'doc' && s.retrieved === null)).toBe(true)
  })

  // Extra scope (ruled in alongside Task 7's brief): tasks 4-6 each found a
  // guard for the joined-array rendering rule with no fixture record to
  // exercise it. `typology` already had an empty-array case (four fixture
  // languages carry `[]`); `countries` did not, on either side.
  it('has a language with an empty countries array, so a joined empty list has a path', () => {
    expect(b.languages.some((l) => l.countries.length === 0)).toBe(true)
  })

  it('has a language with more than one country, so the ", "-joined list has a path', () => {
    expect(b.languages.some((l) => l.countries.length > 1)).toBe(true)
  })

  it('has an adjacent-tier initiative carrying a transferability note', () => {
    expect(b.initiatives.some((i) => i.tier === 'adjacent' && i.transferability !== null)).toBe(true)
  })

  it('has a language with no matching work, so the coverage finding shows on first load', () => {
    const worked = new Set(b.initiatives.flatMap((i) => i.languages))
    expect(b.languages.some((l) => !worked.has(l.id))).toBe(true)
  })
})
