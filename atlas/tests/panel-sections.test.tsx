// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import LanguagePanel from '../src/components/LanguagePanel.js'
import InitiativePanel from '../src/components/InitiativePanel.js'
import { loadBundle } from '../src/lib/load.js'

afterEach(() => cleanup())
const bundle = loadBundle()

describe('panel sections', () => {
  it('groups the language panel under headings', () => {
    render(<LanguagePanel language={bundle.languages[0]!} initiatives={[]} filtered={true} />)
    const headings = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
    expect(headings).toEqual(['Identity', 'Situation', 'Place', 'Work', 'Note'])
  })

  // Task 3 gives the initiative panel four sections, not six: `Identity` and
  // `Evidence` have no fields until Task 6 populates them, and a section with
  // no fields must fail the "never renders an empty section" guard below.
  // Task 6 adds both sections along with the fields that fill them and
  // updates this expectation then.
  it('groups the initiative panel under headings', () => {
    render(<InitiativePanel initiative={bundle.initiatives[0]!} methods={bundle.methods} />)
    const headings = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
    expect(headings).toEqual(['Work', 'Governance', 'Place', 'Note'])
  })

  // A heading with no fields under it is a rendering bug that reads as missing
  // data. Every section must own at least one field.
  it('never renders an empty section', () => {
    render(<LanguagePanel language={bundle.languages[0]!} initiatives={[]} filtered={true} />)
    for (const h of screen.getAllByRole('heading', { level: 3 })) {
      const section = h.closest('section')
      expect(section).not.toBeNull()
      expect(within(section!).getAllByRole('term').length).toBeGreaterThan(0)
    }
  })

  it('keeps every field inside a section, none loose', () => {
    const { container } = render(<LanguagePanel language={bundle.languages[0]!} initiatives={[]} filtered={true} />)
    for (const dt of container.querySelectorAll('dt')) {
      expect(dt.closest('section')).not.toBeNull()
    }
  })
})

// The tests above check headings, emptiness and looseness, but none of them
// checks that a GIVEN field sits under its INTENDED heading — a field could
// move to the wrong section (or disappear) and every test above would still
// pass. These two maps are the single source of truth for "which section owns
// which field", by `testId`. Tasks 4 and 5 add rows here when they add fields
// to these panels; Task 6 adds InitiativePanel's `Identity`/`Evidence` rows
// alongside the fields that populate them. The check below is symmetric on
// purpose: it fails if a mapped field goes missing from the render (deleted,
// or moved to a section not listed) AND if the render grows a `field-*`
// `testId` this map doesn't know about (added without updating the table) —
// so extending a panel with a new field and forgetting to add it here is a
// failing test, not a silently-passing one.
const LANGUAGE_FIELD_SECTIONS: Record<string, string> = {
  'field-aka': 'Identity',
  'field-family': 'Situation',
  'field-typology': 'Situation',
  'field-endangerment': 'Situation',
  'field-speakers': 'Situation',
  'field-centre': 'Place',
  'field-initiatives': 'Work',
  'field-caveat': 'Note',
}

const INITIATIVE_FIELD_SECTIONS: Record<string, string> = {
  'field-years': 'Work',
  'field-applications': 'Work',
  'field-methods': 'Work',
  'field-models': 'Work',
  'field-governance': 'Governance',
  'field-site': 'Place',
  'field-caveat': 'Note',
  'field-transferability': 'Note',
}

/** Asserts, for a rendered panel, that the set of `field-*` testIds present
 *  is EXACTLY the set of keys in `expected` (not a subset in either
 *  direction), and that each one's nearest `<section>` carries the expected
 *  `<h3>` heading text. */
function assertFieldSections(container: HTMLElement, expected: Record<string, string>): void {
  const rendered = Array.from(container.querySelectorAll<HTMLElement>('[data-testid^="field-"]'))
  const renderedIds = rendered.map((el) => el.getAttribute('data-testid')!).sort()
  const expectedIds = Object.keys(expected).sort()
  expect(renderedIds).toEqual(expectedIds)

  for (const el of rendered) {
    const testId = el.getAttribute('data-testid')!
    const section = el.closest('section')
    expect(section, `${testId} is not inside any <section>`).not.toBeNull()
    const heading = section!.querySelector('h3')?.textContent
    expect(heading, `${testId} should render under "${expected[testId]}", not "${heading}"`).toBe(expected[testId])
  }
}

describe('panel field-to-section mapping', () => {
  it('pins every language-panel field to its intended section', () => {
    const { container } = render(<LanguagePanel language={bundle.languages[0]!} initiatives={[]} filtered={true} />)
    assertFieldSections(container, LANGUAGE_FIELD_SECTIONS)
  })

  it('pins every initiative-panel field to its intended section', () => {
    // Rendered against an initiative WITH a transferability note (not
    // `bundle.initiatives[0]`) so `field-transferability` is present and the
    // mapping check above is exhaustive over every field this panel can show.
    const transferable = bundle.initiatives.find((i) => i.transferability !== null)!
    const { container } = render(<InitiativePanel initiative={transferable} methods={bundle.methods} />)
    assertFieldSections(container, INITIATIVE_FIELD_SECTIONS)
  })
})
