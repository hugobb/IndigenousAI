// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { InitiativeSchema, LanguageSchema, MethodSchema, type Language } from '../src/schema/index.js'
import LanguagePanel from '../src/components/LanguagePanel.js'
import InitiativePanel from '../src/components/InitiativePanel.js'
import UnmappedList from '../src/components/UnmappedList.js'

// NOT `new URL('...', import.meta.url)`: under the jsdom environment vitest
// runs this file through Vite's client transform, which statically rewrites
// that exact literal-plus-import.meta.url pattern into a dev-server asset URL
// (`http://localhost:3000/...`) instead of leaving it for runtime file
// resolution — `fileURLToPath` then rejects it as non-`file:`. Building the
// path from `dirname(fileURLToPath(import.meta.url))` doesn't match the
// pattern the plugin looks for, so it resolves for real at runtime instead.
const here = dirname(fileURLToPath(import.meta.url))
const raw = JSON.parse(readFileSync(join(here, '../src/fixtures/atlas.fixture.json'), 'utf8'))
const languages = raw.languages.map((l: unknown) => LanguageSchema.parse(l))
const initiatives = raw.initiatives.map((i: unknown) => InitiativeSchema.parse(i))
const methods = raw.methods.map((m: unknown) => MethodSchema.parse(m))
const lang = (id: string) => languages.find((l: { id: string }) => l.id === id)!
const init = (id: string) => initiatives.find((i: { id: string }) => i.id === id)!

afterEach(() => cleanup())

describe('LanguagePanel', () => {
  it('renders an empty typology as "not recorded", not as a blank', () => {
    render(<LanguagePanel language={lang('fixture-approximate')} initiatives={[]} filtered={true} />)
    const row = screen.getByTestId('field-typology')
    expect(within(row).getByText(/not recorded/i)).toBeDefined()
  })

  // Seam review (Task 11). `initiatives` here is I1 — App passes the
  // initiatives that survived every current filter — so an empty list is a
  // FILTER RESULT. Routed through `Field`'s null branch it printed "not
  // recorded", i.e. "we do not know", while the languages table beside it
  // rendered the same fact as `0` under a caption saying 0 does not mean no
  // work exists. Two surfaces, one moment, and the panel made the stronger,
  // false claim. Both halves asserted: the words must be gone AND the scope
  // must be stated, so deleting the sentence entirely cannot pass.
  it('does not call a filtered-away initiative list "not recorded"', () => {
    render(<LanguagePanel language={lang('fixture-sourced')} initiatives={[]} filtered={true} />)
    const row = screen.getByTestId('field-initiatives')
    expect(within(row).queryByText(/not recorded/i)).toBeNull()
    expect(row.textContent).toMatch(/current filters/i)
    expect(row.textContent).toMatch(/no work exists/i)
  })

  it('lists the matching initiatives when there are any', () => {
    render(
      <LanguagePanel language={lang('fixture-sourced')} initiatives={[init('fixture-ongoing')]} filtered={true} />,
    )
    const row = screen.getByTestId('field-initiatives')
    expect(row.textContent).toContain('Ongoing Initiative')
    expect(row.textContent).not.toMatch(/current filters/i)
  })

  it('shows a speaker-count disagreement as a disagreement', () => {
    render(<LanguagePanel language={lang('fixture-conflict')} initiatives={[]} filtered={true} />)
    expect(screen.getByText(/9,?600/)).toBeDefined()
    expect(screen.getByText(/300/)).toBeDefined()
  })

  // The speakers field can show two disagreeing figures, and each carries its
  // OWN source. One reference under two numbers leaves the reader unable to
  // tell which source says which — and being able to tell is the whole reason
  // the schema keeps both figures instead of picking one.
  it('attributes each disagreeing speaker count to its own source', () => {
    const l: Language = languages.find((x: Language) => (x.speakers?.conflicts.length ?? 0) > 0)!
    render(<LanguagePanel language={l} initiatives={[]} filtered={true} />)
    fireEvent.click(screen.getByTestId('source-field-speakers'))
    const body = screen.getByTestId('source-body-field-speakers')
    expect(body.textContent).toContain(l.speakers!.source.ref)
    for (const c of l.speakers!.conflicts) {
      // The disclosure formats a figure exactly as the field above it does, so
      // the assertion formats it too. `String(c.value)` would pass only by
      // accident, for conflict values under 1,000.
      expect(body.textContent).toContain(c.value.toLocaleString('en'))
      expect(body.textContent).toContain(c.source.ref)
    }
  })

  it('surfaces the caveat when a centre is approximate', () => {
    render(<LanguagePanel language={lang('fixture-approximate')} initiatives={[]} filtered={true} />)
    expect(screen.getByText(/placeholder-looking centroid/i)).toBeDefined()
  })

  // We KNOW this language has no cited centre — that is a value, not an
  // unknown — and the table's Location column and the rail's "Not mapped"
  // heading already say so in those words. "not recorded" claims we do not
  // know, which is a stronger and false claim; this guard fails on that
  // regression the same way it fails on the field going blank.
  it('says "not mapped", not "not recorded", when a language has no centre at all', () => {
    render(<LanguagePanel language={lang('fixture-unmapped')} initiatives={[]} filtered={true} />)
    const field = screen.getByTestId('field-centre')
    expect(field.textContent).toMatch(/not mapped/i)
    expect(field.textContent).not.toMatch(/not recorded/i)
  })

  // Fix round 1: found while auditing for a fourth/fifth "matches the current
  // filters" sentence. This field is reachable with zero filters at all — a
  // reader can select a language the atlas simply has no initiative for — and
  // the old unconditional wording both blamed a filter that wasn't there and
  // denied "no work exists" in exactly the case where that IS the fact.
  describe('the empty matching-initiatives message follows the filter state', () => {
    it('names it a filter result when a work filter is active', () => {
      render(
        <LanguagePanel language={lang('fixture-sourced')} initiatives={[]} filtered={true} />,
      )
      const row = screen.getByTestId('field-initiatives')
      expect(row.textContent).toMatch(/no work exists/i)
      expect(row.textContent).not.toMatch(/atlas records/i)
    })

    it('names it a dataset finding when no work filter is active', () => {
      render(
        <LanguagePanel language={lang('fixture-sourced')} initiatives={[]} filtered={false} />,
      )
      const row = screen.getByTestId('field-initiatives')
      expect(row.textContent).toMatch(/atlas records/i)
      expect(row.textContent).not.toMatch(/no work exists/i)
    })
  })
})

describe('InitiativePanel', () => {
  it('links a method into the mkdocs guide', () => {
    render(<InitiativePanel initiative={init('fixture-ongoing')} methods={methods} />)
    const link = screen.getByRole('link', { name: /fixture method/i })
    expect(link.getAttribute('href')).toBe('/ml-techniques/fixture-method/')
  })

  it('shows the transferability note on an adjacent-tier initiative', () => {
    render(<InitiativePanel initiative={init('fixture-adjacent-init')} methods={methods} />)
    expect(screen.getByText(/participatory corpus building/i)).toBeDefined()
  })

  it('shows no transferability section on an indigenous-tier initiative', () => {
    render(<InitiativePanel initiative={init('fixture-ongoing')} methods={methods} />)
    expect(screen.queryByTestId('field-transferability')).toBeNull()
  })

  it('marks an ongoing initiative as ongoing rather than leaving the end blank', () => {
    render(<InitiativePanel initiative={init('fixture-ongoing')} methods={methods} />)
    expect(screen.getByTestId('field-years').textContent).toMatch(/ongoing/i)
  })
})

describe('UnmappedList', () => {
  it('separates languages with no centre from those drawn but untrusted', () => {
    render(<UnmappedList languages={languages} noMatchingWork={[]} workFiltered={false} onSelect={() => {}} />)
    expect(within(screen.getByTestId('group-not-mapped')).getByText(/Unmapped Language/)).toBeDefined()
    expect(within(screen.getByTestId('group-approximate')).getByText(/Approximate Centre Language/)).toBeDefined()
  })

  it('labels an adjacent-tier language as tier-excluded, not as a data gap', () => {
    render(<UnmappedList languages={languages} noMatchingWork={[]} workFiltered={false} onSelect={() => {}} />)
    expect(within(screen.getByTestId('group-not-mapped')).getByText(/adjacent tier/i)).toBeDefined()
  })
})

// SP1c shipped five facet/column disclosure pairs whose accessible names were
// identical, and only the one a test happened to name was noticed. This is the
// class guard, not the case guard: it walks EVERY disclosure a panel renders
// and checks its name against its own field's label, so a new sourced field
// added with a copied `label` fails here rather than reaching a screen reader
// as one more indistinguishable "source" button.
function disclosureNames(container: HTMLElement): string[] {
  const buttons = Array.from(container.querySelectorAll<HTMLElement>('button[data-testid^="source-"]'))
  return buttons.map((b) => {
    const field = b.closest('[data-testid^="field-"]')
    expect(field, 'a source disclosure sits outside any field').not.toBeNull()
    const label = field!.querySelector('dt')?.textContent
    expect(b.getAttribute('aria-label')).toBe(`Source for ${label}`)
    return b.getAttribute('aria-label') ?? ''
  })
}

describe('source disclosure names', () => {
  // Built here rather than taken from the fixture: no fixture language carries
  // an endangerment status, so the third of the language panel's disclosures
  // would otherwise never be rendered by any panel test at all.
  const conflicted: Language = languages.find((x: Language) => (x.speakers?.conflicts.length ?? 0) > 0)!
  const withEndangerment: Language = LanguageSchema.parse({
    ...conflicted,
    endangerment: {
      status: 'severely-endangered', scale: 'unesco-2010',
      source: { kind: 'doc', ref: 'fixture-endangerment', retrieved: null, quote: null },
    },
  })

  it('names each language-panel disclosure after its own field, all distinct', () => {
    const { container } = render(
      <LanguagePanel language={withEndangerment} initiatives={[]} filtered={true} />,
    )
    const names = disclosureNames(container)
    expect(names.sort()).toEqual(['Source for Centre', 'Source for Endangerment', 'Source for Speakers'])
    expect(new Set(names).size).toBe(names.length)
  })

  it('names each initiative-panel disclosure after its own field, all distinct', () => {
    const { container } = render(
      <InitiativePanel initiative={init('fixture-ongoing')} methods={methods} />,
    )
    const names = disclosureNames(container)
    expect(names.sort()).toEqual(['Source for Governance', 'Source for Location'])
    expect(new Set(names).size).toBe(names.length)
  })

  // The counterpart rule: a field that carries no `Source` in the schema shows
  // NO toggle, and that silence only means "structurally cannot have one" if a
  // toggle is never rendered empty.
  it('renders no disclosure on the fields the schema gives no source', () => {
    const { container } = render(
      <LanguagePanel language={withEndangerment} initiatives={[]} filtered={true} />,
    )
    for (const testId of ['field-aka', 'field-family', 'field-typology', 'field-initiatives', 'field-caveat']) {
      const field = container.querySelector(`[data-testid="${testId}"]`)
      expect(field, testId).not.toBeNull()
      expect(field!.querySelector('button[data-testid^="source-"]'), testId).toBeNull()
    }
  })
})
