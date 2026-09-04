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

/** Reads the CSS as text. This CANNOT prove a layout: jsdom computes no grid,
 *  so the actual regression these guard against — with the notice absent the
 *  rail and map fell into the `auto` row and the map went from 705px tall to
 *  337px at 1440x900 — was measured in a real browser and no test in this repo
 *  can measure it. What IS checkable here is the structural property that made
 *  it possible: whether any child of the grid is left to auto-placement. When
 *  every child names an area, no sibling's absence can move it. */
const CSS = read('../src/styles.css')

/** The declaration block of a top-level rule (`^` anchored, so `.atlas` does
 *  not also match `.atlas__map`). */
function ruleBody(css: string, selector: string): string {
  const m = new RegExp(`^\\${selector}\\s*\\{([^}]*)\\}`, 'm').exec(css)
  if (m?.[1] === undefined) throw new Error(`no rule for ${selector}`)
  return m[1]
}

/** The quoted row strings of a `grid-template-areas` declaration, in order. */
function areaRows(body: string): string[][] {
  const decl = /grid-template-areas:\s*([^;]+);/.exec(body)
  if (decl?.[1] === undefined) throw new Error('no grid-template-areas')
  return [...decl[1].matchAll(/'([^']+)'/g)].map((r) => (r[1] ?? '').trim().split(/\s+/))
}

const MEDIA = (() => {
  const at = CSS.indexOf('@media (max-width: 60rem)')
  if (at < 0) throw new Error('no narrow-view media query')
  return CSS.slice(at)
})()

describe('grid placement', () => {
  it('gives every direct child of the grid a named area, leaving nothing auto-placed', () => {
    // Rendered rather than hard-coded, so ADDING a pane to App.tsx without
    // placing it fails here too — that is the same defect wearing a new hat.
    render(<App />)
    const grid = document.querySelector('main.atlas')
    expect(grid).not.toBeNull()
    const children = [...(grid?.children ?? [])]
    expect(children.length).toBeGreaterThan(1)
    for (const child of children) {
      const cls = [...child.classList].find((c) => c.startsWith('atlas__'))
      expect(cls, `a child of .atlas carries no atlas__ class: ${child.outerHTML.slice(0, 80)}`)
        .toBeDefined()
      const body = ruleBody(CSS, `.${cls}`)
      expect(body, `.${cls} does not declare grid-area`).toMatch(/grid-area:\s*[\w-]+\s*;/)
    }
  })

  it('puts the rail and the map together in the row after the notice, in both layouts', () => {
    // The rail and the map share the last row; the masthead and the notice each
    // own a row above it. If the notice's row is ever merged away, an absent
    // notice starts moving the panes again.
    const wide = areaRows(ruleBody(CSS, '.atlas'))
    expect(wide.map((r) => [...new Set(r)].join('+')))
      .toEqual(['masthead', 'notice', 'timeline', 'rail+map'])

    // The narrow layout stacks them, but must place them just as explicitly.
    const narrow = areaRows(ruleBody(MEDIA.replace(/^\s+/gm, ''), '.atlas'))
    expect(narrow.map((r) => r.join('+'))).toEqual(['masthead', 'notice', 'timeline', 'map', 'rail'])
  })

  // The two below are SOURCE-TEXT assertions on the stylesheet, and nothing
  // more: they prove the rule is written, not that the page lays out. jsdom
  // computes no grid and no overflow (spec §8), so whether the timeline band
  // actually sits between the notice and the map, and whether the rail really
  // scrolls itself instead of the page, can only be checked in a browser.
  it('places the timeline pane by name, like every other pane', () => {
    expect(CSS).toMatch(/\.atlas__timeline\s*\{[^}]*grid-area:\s*timeline/)
    expect(CSS).toMatch(/grid-template-areas:[^;]*timeline/)
  })

  it('lets the rail scroll itself rather than the page', () => {
    // Without `min-height: 0` a grid child refuses to shrink below its content,
    // so `overflow-y: auto` on the rail never engages and the page scrolls.
    expect(CSS).toMatch(/\.atlas__rail\s*\{[^}]*min-height:\s*0/)
    expect(CSS).toMatch(/\.atlas__rail\s*\{[^}]*overflow-y:\s*auto/)
  })

  it('names an area for each child in the template, and no template area without a child', () => {
    const declared = new Set(areaRows(ruleBody(CSS, '.atlas')).flat())
    render(<App />)
    const placed = new Set(
      [...(document.querySelector('main.atlas')?.children ?? [])].flatMap((c) => {
        const cls = [...c.classList].find((x) => x.startsWith('atlas__'))
        const m = cls === undefined ? null : /grid-area:\s*([\w-]+)\s*;/.exec(ruleBody(CSS, `.${cls}`))
        return m?.[1] === undefined ? [] : [m[1]]
      }),
    )
    // Under the fixture every optional child renders, so these must match
    // exactly: an area with no child is a row that will never collapse as
    // intended, and a child with no area is the auto-placement bug.
    expect([...placed].sort()).toEqual([...declared].sort())
  })
})
