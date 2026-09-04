// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'

// Substituting MapView entirely lets us read exactly what App handed it.
// The map itself needs WebGL and cannot be asserted here (spec §8); the SEAM
// can, and the seam is what filtering has to get right.
vi.mock('../src/components/MapView.js', () => ({
  default: (p: {
    languages: { features: unknown[] }
    initiatives: { features: unknown[] }
  }) => (
    <div>
      <span data-testid="map-language-count">{p.languages.features.length}</span>
      <span data-testid="map-initiative-count">{p.initiatives.features.length}</span>
    </div>
  ),
}))

const { default: App } = await import('../src/components/App.js')

afterEach(() => cleanup())

const countsAt = (search: string): { languages: string; initiatives: string } => {
  window.history.replaceState({}, '', search)
  render(<App />)
  const languages = screen.getByTestId('map-language-count').textContent ?? ''
  const initiatives = screen.getByTestId('map-initiative-count').textContent ?? ''
  cleanup()
  return { languages, initiatives }
}

describe('what reaches the map', () => {
  // The dev/test fixture (src/fixtures/atlas.fixture.json) has no language with
  // region "oceania" — that value would zero out the language set rather than
  // genuinely split it. `region=africa` matches exactly one of its five
  // languages (fixture-adjacent), so this is a real partial split.
  it('gives the map fewer languages once a language facet excludes some', () => {
    const all = countsAt('/')
    const narrowed = countsAt('/?region=africa')
    expect(Number(narrowed.languages)).toBeLessThan(Number(all.languages))
  })

  it('gives the map fewer initiatives once a work facet excludes some', () => {
    const all = countsAt('/')
    const narrowed = countsAt('/?application=asr')
    expect(Number(narrowed.initiatives)).toBeLessThan(Number(all.initiatives))
  })
})
