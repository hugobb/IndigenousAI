// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import UnmappedList from '../src/components/UnmappedList.js'
import type { Language, Paper } from '../src/schema/index.js'

afterEach(cleanup)

const paper = (id: string): Paper => ({
  id, title: id, authors: 'A', year: 2024, venue: null, themes: [], summary_url: `/summaries/${id}/`,
})
const LANG = { id: 'l', name: 'Testish', centre: null, tier: 'indigenous', caveat: null } as unknown as Language
const base = {
  languages: [], noMatchingWork: [], workFiltered: false, languageFiltered: false,
  onSelect: () => {}, noLanguagePapers: [], languageNotMappedPapers: [],
}

describe('unmapped papers', () => {
  it('lists papers that study no specific language', () => {
    render(<UnmappedList {...base} noLanguagePapers={[paper('a-survey')]} />)
    expect(screen.getByTestId('group-papers-no-language').textContent).toContain('a-survey')
  })

  it('lists papers whose language the map cannot draw, and names the language', () => {
    render(<UnmappedList {...base} languageNotMappedPapers={[{ paper: paper('p'), languages: [LANG] }]} />)
    const group = screen.getByTestId('group-papers-language-not-mapped')
    expect(group.textContent).toContain('p')
    expect(group.textContent).toContain('Testish')
  })

  /** Two REASONS, never one card. A paper nobody placed and a paper placed on a
   *  language the map cannot draw are different facts about coverage. */
  it('keeps the two reasons in separate groups', () => {
    render(<UnmappedList {...base} noLanguagePapers={[paper('a-survey')]} languageNotMappedPapers={[{ paper: paper('p'), languages: [LANG] }]} />)
    expect(screen.getByTestId('group-papers-no-language').textContent).not.toContain('Testish')
    expect(screen.getByTestId('group-papers-language-not-mapped').textContent).not.toContain('a-survey')
  })

  /** A headed card with nothing under it reads as a rendering bug — the lesson
   *  this component already records for its language groups. */
  it('renders neither group when both are empty', () => {
    render(<UnmappedList {...base} />)
    expect(screen.queryByTestId('group-papers-no-language')).toBeNull()
    expect(screen.queryByTestId('group-papers-language-not-mapped')).toBeNull()
  })

  // Task 6's review flagged this as reachable only in principle — `validate.ts`
  // refuses an unknown language id at build time — but the brief's JSX renders
  // `languages.map((l) => l.name).join(', ')`, which for an empty array prints
  // an empty string. A card stating a reason while naming no language reads as
  // a rendering bug, the same class of defect this component's other groups
  // already guard against.
  it('states that the language is unknown rather than naming none, when the languages array is empty', () => {
    render(<UnmappedList {...base} languageNotMappedPapers={[{ paper: paper('p'), languages: [] }]} />)
    const group = screen.getByTestId('group-papers-language-not-mapped')
    const text = group.textContent ?? ''
    expect(text).toContain('p')
    expect(text).not.toMatch(/\(\s*\)/)
    expect(text).toMatch(/unknown/i)
  })
})
