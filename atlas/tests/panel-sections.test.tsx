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

  // Task 6 adds `Identity` and `Evidence` along with the fields that fill
  // them. They were deferred out of Task 3 rather than created empty because
  // a section with no fields must fail the "never renders an empty section"
  // guard below.
  it('groups the initiative panel under headings', () => {
    render(<InitiativePanel initiative={bundle.initiatives[0]!} methods={bundle.methods} bundle={bundle} />)
    const headings = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
    expect(headings).toEqual(['Identity', 'Work', 'Governance', 'Place', 'Evidence', 'Note'])
  })

  // A heading with no fields under it is a rendering bug that reads as missing
  // data. Every section must own at least one field.
  //
  // Task 6: these last two ran against the LANGUAGE panel only, which is the
  // one panel that had no reason to grow an empty section — the two the plan
  // deferred were both on the INITIATIVE panel, and the guard that was cited
  // as the reason for deferring them never rendered it. Both now run over
  // each panel.
  const panels: [string, () => React.JSX.Element][] = [
    ['language', () => <LanguagePanel language={bundle.languages[0]!} initiatives={[]} filtered={true} />],
    ['initiative', () => <InitiativePanel initiative={bundle.initiatives[0]!} methods={bundle.methods} bundle={bundle} />],
  ]

  for (const [name, panel] of panels) {
    it(`never renders an empty section in the ${name} panel`, () => {
      render(panel())
      const headings = screen.getAllByRole('heading', { level: 3 })
      expect(headings.length).toBeGreaterThan(0)
      for (const h of headings) {
        const section = h.closest('section')
        expect(section).not.toBeNull()
        expect(within(section!).getAllByRole('term').length, `section "${h.textContent}" is empty`)
          .toBeGreaterThan(0)
      }
    })

    it(`keeps every ${name}-panel field inside a section, none loose`, () => {
      const { container } = render(panel())
      const terms = container.querySelectorAll('dt')
      expect(terms.length).toBeGreaterThan(0)
      for (const dt of terms) {
        expect(dt.closest('section')).not.toBeNull()
      }
    })
  }
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
  'field-glottocode': 'Identity',
  'field-iso639-3': 'Identity',
  'field-tier': 'Identity',
  'field-family': 'Identity',
  'field-subfamily': 'Identity',
  'field-typology': 'Situation',
  'field-endangerment': 'Situation',
  'field-speakers': 'Situation',
  'field-region': 'Situation',
  'field-countries': 'Situation',
  'field-centre': 'Place',
  'field-initiatives': 'Work',
  'field-caveat': 'Note',
}

const INITIATIVE_FIELD_SECTIONS: Record<string, string> = {
  'field-kind': 'Identity',
  'field-tier': 'Identity',
  'field-languages': 'Identity',
  'field-years': 'Work',
  'field-applications': 'Work',
  'field-methods': 'Work',
  'field-models': 'Work',
  'field-regime': 'Work',
  'field-governance': 'Governance',
  'field-licence': 'Governance',
  'field-site': 'Place',
  'field-papers': 'Evidence',
  'field-links': 'Evidence',
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
    const { container } = render(
      <InitiativePanel initiative={transferable} methods={bundle.methods} bundle={bundle} />,
    )
    assertFieldSections(container, INITIATIVE_FIELD_SECTIONS)
  })
})
