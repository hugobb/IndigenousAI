// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup } from '@testing-library/react'
import LanguagePanel from '../src/components/LanguagePanel.js'
import type { Language, Paper } from '../src/schema/index.js'

afterEach(cleanup)

const LANG = {
  id: 'l', name: 'Testish', also_known_as: [], glottocode: 'g', iso639_3: 'i',
  tier: 'indigenous', family: 'f', subfamily: null, typology: [], endangerment: null,
  speakers: null, region: 'north-america', countries: ['US'], centre: null,
  caveat: null, status: 'verified',
} as unknown as Language
const PAPER: Paper = {
  id: 'a-paper', title: 'A Paper About Testish', authors: 'X', year: 2024,
  venue: null, themes: [], summary_url: '/summaries/a-paper/',
}

describe('the language panel’s Papers section', () => {
  it('links each paper to its published summary', () => {
    render(<LanguagePanel language={LANG} initiatives={[]} filtered={false} papers={[{ paper: PAPER, note: null }]} />)
    const link = screen.getByRole('link', { name: /A Paper About Testish/ })
    expect(link.getAttribute('href')).toBe('/summaries/a-paper/')
  })

  /** "not recorded" claims we do not know. We do know: no paper in this atlas
   *  studies this language. The same distinction the Work section already
   *  draws, and the reason that section carries a hint instead of a null. */
  it('says no paper studies it, rather than "not recorded"', () => {
    render(<LanguagePanel language={LANG} initiatives={[]} filtered={false} papers={[]} />)
    expect(screen.getByTestId('field-papers').textContent).toMatch(/no paper in this atlas/i)
    expect(screen.getByTestId('field-papers').textContent).not.toMatch(/not recorded/i)
  })

  /** FIX 1 of the whole-branch review: `papersForLanguage` used to return a
   *  bare `Paper[]`, so a mapping's hedge (e.g.
   *  `feng-et-al-2025-culfit`'s "Amharic is one of 23 evaluation languages,
   *  not the paper's subject") never reached a reader — the panel listed it
   *  identically to a title-level match. This pins that the note now renders
   *  beside the entry it belongs to. */
  it('renders a mapping’s note beside the paper it hedges', () => {
    render(
      <LanguagePanel
        language={LANG}
        initiatives={[]}
        filtered={false}
        papers={[{ paper: PAPER, note: 'One of 23 evaluation languages, not the paper’s subject.' }]}
      />,
    )
    expect(screen.getByTestId('field-papers').textContent).toMatch(
      /One of 23 evaluation languages, not the paper’s subject\./,
    )
  })

  it('renders no hedge text when the mapping carries no note', () => {
    render(<LanguagePanel language={LANG} initiatives={[]} filtered={false} papers={[{ paper: PAPER, note: null }]} />)
    expect(screen.getByTestId('field-papers').querySelector('p.hint')).toBeNull()
  })
})
