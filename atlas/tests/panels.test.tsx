// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { InitiativeSchema, LanguageSchema, MethodSchema } from '../src/schema/index.js'
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
    render(<LanguagePanel language={lang('fixture-approximate')} initiatives={[]} />)
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
    render(<LanguagePanel language={lang('fixture-sourced')} initiatives={[]} />)
    const row = screen.getByTestId('field-initiatives')
    expect(within(row).queryByText(/not recorded/i)).toBeNull()
    expect(row.textContent).toMatch(/current filters/i)
    expect(row.textContent).toMatch(/no work exists/i)
  })

  it('lists the matching initiatives when there are any', () => {
    render(
      <LanguagePanel language={lang('fixture-sourced')} initiatives={[init('fixture-ongoing')]} />,
    )
    const row = screen.getByTestId('field-initiatives')
    expect(row.textContent).toContain('Ongoing Initiative')
    expect(row.textContent).not.toMatch(/current filters/i)
  })

  it('shows a speaker-count disagreement as a disagreement', () => {
    render(<LanguagePanel language={lang('fixture-conflict')} initiatives={[]} />)
    expect(screen.getByText(/9,?600/)).toBeDefined()
    expect(screen.getByText(/300/)).toBeDefined()
  })

  it('surfaces the caveat when a centre is approximate', () => {
    render(<LanguagePanel language={lang('fixture-approximate')} initiatives={[]} />)
    expect(screen.getByText(/placeholder-looking centroid/i)).toBeDefined()
  })

  // We KNOW this language has no cited centre — that is a value, not an
  // unknown — and the table's Location column and the rail's "Not mapped"
  // heading already say so in those words. "not recorded" claims we do not
  // know, which is a stronger and false claim; this guard fails on that
  // regression the same way it fails on the field going blank.
  it('says "not mapped", not "not recorded", when a language has no centre at all', () => {
    render(<LanguagePanel language={lang('fixture-unmapped')} initiatives={[]} />)
    const field = screen.getByTestId('field-centre')
    expect(field.textContent).toMatch(/not mapped/i)
    expect(field.textContent).not.toMatch(/not recorded/i)
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
