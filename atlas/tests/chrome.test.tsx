// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../src/components/App.js'

// See app.test.tsx: maplibre-gl cannot be imported for real under jsdom.
vi.mock('maplibre-gl', () => ({
  default: { Map: class { on(): void {} remove(): void {} } },
}))

afterEach(() => cleanup())

const read = (rel: string): string =>
  readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8')

// jsdom has NO layout engine, so nothing here can prove the map does not cover
// the page — that was checked in a real browser. These are the narrower facts
// that a regression would have to break first: the map is a sibling of the
// reading column rather than an ancestor of it, and the stylesheets that make
// the layout exist are actually imported.
describe('page chrome', () => {
  it('imports the MapLibre stylesheet, without which the canvas and the attribution are unstyled', () => {
    expect(read('../src/main.tsx')).toMatch(/maplibre-gl\/dist\/maplibre-gl\.css/)
  })

  it('imports the page stylesheet', () => {
    expect(read('../src/main.tsx')).toMatch(/\.\/styles\.css/)
  })

  it('never sizes the map container against the viewport', () => {
    // `position: absolute` with no positioned ancestor is what made the map
    // fill the viewport and paint over everything else in flow.
    const src = read('../src/components/MapView.tsx')
    expect(src).not.toMatch(/position:\s*'absolute'/)
    expect(read('../src/styles.css')).toMatch(/\.atlas__canvas\s*\{[^}]*position:\s*relative/)
  })

  it('keeps the heading, the notice, the list and the panels outside the map container', () => {
    render(<App />)
    const map = screen.getByRole('application')
    expect(map.contains(screen.getByRole('heading', { level: 1 }))).toBe(false)
    expect(map.contains(screen.getByTestId('demo-data-banner'))).toBe(false)
    expect(map.contains(screen.getByTestId('group-not-mapped'))).toBe(false)
  })
})
