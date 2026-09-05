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
