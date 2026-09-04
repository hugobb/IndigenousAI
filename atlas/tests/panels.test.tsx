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

  it('shows a speaker-count disagreement as a disagreement', () => {
    render(<LanguagePanel language={lang('fixture-conflict')} initiatives={[]} />)
    expect(screen.getByText(/9,?600/)).toBeDefined()
    expect(screen.getByText(/300/)).toBeDefined()
  })

  it('surfaces the caveat when a centre is approximate', () => {
    render(<LanguagePanel language={lang('fixture-approximate')} initiatives={[]} />)
    expect(screen.getByText(/placeholder-looking centroid/i)).toBeDefined()
  })

  it('says so when a language has no centre at all', () => {
    render(<LanguagePanel language={lang('fixture-unmapped')} initiatives={[]} />)
    expect(screen.getByTestId('field-centre').textContent).toMatch(/not recorded/i)
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
    render(<UnmappedList languages={languages} onSelect={() => {}} />)
    expect(within(screen.getByTestId('group-not-mapped')).getByText(/Unmapped Language/)).toBeDefined()
    expect(within(screen.getByTestId('group-approximate')).getByText(/Approximate Centre Language/)).toBeDefined()
  })

  it('labels an adjacent-tier language as tier-excluded, not as a data gap', () => {
    render(<UnmappedList languages={languages} onSelect={() => {}} />)
    expect(within(screen.getByTestId('group-not-mapped')).getByText(/adjacent tier/i)).toBeDefined()
  })
})
