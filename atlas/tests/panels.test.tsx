// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import {
  InitiativeSchema, LanguageSchema, MethodSchema, PaperSchema, type Language,
} from '../src/schema/index.js'
import type { AtlasBundle } from '../src/lib/load.js'
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
const papers = raw.papers.map((p: unknown) => PaperSchema.parse(p))
const lang = (id: string) => languages.find((l: { id: string }) => l.id === id)!
const init = (id: string) => initiatives.find((i: { id: string }) => i.id === id)!

// `InitiativePanel` resolves paper ids and language ids through the whole
// bundle — an initiative may name a language the current filters exclude, and
// the panel still has to print its name. Assembled from the arrays parsed
// above rather than from `loadBundle()`, so `bundle.initiatives[0]` and
// `init('fixture-ongoing')` are the same object rather than two parses of it.
const bundle: AtlasBundle = {
  generated: raw.generated, languages, initiatives, methods, papers, isDemoData: true,
}

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

  // Spec §7 named these identifiers; the panel never displayed them.
  it('shows the identity fields a reader would use to look the language up', () => {
    render(<LanguagePanel language={lang('fixture-sourced')} initiatives={[]} filtered={true} />)
    for (const id of ['field-glottocode', 'field-iso639-3', 'field-tier', 'field-subfamily']) {
      expect(screen.getByTestId(id)).toBeDefined()
    }
  })

  it('shows region and countries', () => {
    render(<LanguagePanel language={lang('fixture-sourced')} initiatives={[]} filtered={true} />)
    expect(screen.getByTestId('field-region')).toBeDefined()
    expect(screen.getByTestId('field-countries')).toBeDefined()
  })

  // Every one of these is nullable and several are null across the fixture.
  it('renders an absent identifier as the words, never as a blank', () => {
    const l = languages.find((x: Language) => x.glottocode === null)!
    render(<LanguagePanel language={l} initiatives={[]} filtered={true} />)
    expect(screen.getByTestId('field-glottocode').textContent).toMatch(/not recorded/i)
  })

  // D5: an adjacent-tier language is never mapped — it is included because
  // work on it transfers, not because the atlas claims coverage of it.
  // Without the tier on the panel a reader has no way to tell that apart
  // from a coverage gap.
  it('names the tier, so an adjacent-tier language is legible as one', () => {
    const l = languages.find((x: Language) => x.tier === 'adjacent')!
    render(<LanguagePanel language={l} initiatives={[]} filtered={true} />)
    expect(screen.getByTestId('field-tier').textContent).toContain('adjacent')
  })

  it('carries no source disclosure on a field the schema gives no source', () => {
    render(<LanguagePanel language={lang('fixture-sourced')} initiatives={[]} filtered={true} />)
    expect(screen.queryByTestId('source-field-family')).toBeNull()
    expect(screen.queryByTestId('source-field-region')).toBeNull()
  })
})

describe('InitiativePanel', () => {
  it('links a method into the mkdocs guide', () => {
    render(<InitiativePanel bundle={bundle} initiative={init('fixture-ongoing')} methods={methods} />)
    const link = screen.getByRole('link', { name: /fixture method/i })
    expect(link.getAttribute('href')).toBe('/ml-techniques/fixture-method/')
  })

  it('shows the transferability note on an adjacent-tier initiative', () => {
    render(<InitiativePanel bundle={bundle} initiative={init('fixture-adjacent-init')} methods={methods} />)
    expect(screen.getByText(/participatory corpus building/i)).toBeDefined()
  })

  it('shows no transferability section on an indigenous-tier initiative', () => {
    render(<InitiativePanel bundle={bundle} initiative={init('fixture-ongoing')} methods={methods} />)
    expect(screen.queryByTestId('field-transferability')).toBeNull()
  })

  it('marks an ongoing initiative as ongoing rather than leaving the end blank', () => {
    render(<InitiativePanel bundle={bundle} initiative={init('fixture-ongoing')} methods={methods} />)
    expect(screen.getByTestId('field-years').textContent).toMatch(/ongoing/i)
  })

  // `bundle.papers` has been loaded and schema-validated since SP0 and shown
  // on no surface at all. An initiative's `papers` is a list of ids; the
  // citation a reader can act on lives on the paper record.
  it('resolves papers through the bundle', () => {
    const i = bundle.initiatives.find((x) => x.papers.length > 0)!
    const p = bundle.papers.find((x) => x.id === i.papers[0])!
    render(<InitiativePanel initiative={i} methods={bundle.methods} bundle={bundle} />)
    const field = screen.getByTestId('field-papers')
    expect(field.textContent).toContain(p.title)
    expect(field.textContent).toContain(p.authors)
    expect(field.textContent).toContain(String(p.year))
  })

  // summary_url points at an unpublished repo path. An anchor would be dead
  // from the deployed origin, which is inventing a destination.
  it('does not link a paper to its unpublished summary path', () => {
    const i = bundle.initiatives.find((x) => x.papers.length > 0)!
    render(<InitiativePanel initiative={i} methods={bundle.methods} bundle={bundle} />)
    const links = within(screen.getByTestId('field-papers')).queryAllByRole('link')
    expect(links).toEqual([])
  })

  // The path is still SHOWN — inert is not the same as hidden — and it has to
  // read as a repository location rather than as a link that failed to render.
  it('names the summary path as a repository file, not as a page of this site', () => {
    const i = bundle.initiatives.find((x) => x.papers.length > 0)!
    const p = bundle.papers.find((x) => x.id === i.papers[0])!
    render(<InitiativePanel initiative={i} methods={bundle.methods} bundle={bundle} />)
    const field = screen.getByTestId('field-papers')
    expect(field.textContent).toContain(p.summary_url)
    expect(field.textContent).toMatch(/repository/i)
    expect(field.textContent).toMatch(/not (a )?(page|published)/i)
  })

  it('renders an unresolvable paper id rather than dropping it', () => {
    const i = { ...bundle.initiatives[0]!, papers: ['no-such-paper'] }
    render(<InitiativePanel initiative={i} methods={bundle.methods} bundle={bundle} />)
    const field = screen.getByTestId('field-papers')
    expect(field.textContent).toContain('no-such-paper')
    expect(field.textContent).toMatch(/unresolved/i)
  })

  it('shows kind, tier, languages and data regime', () => {
    const i = bundle.initiatives[0]!
    render(<InitiativePanel initiative={i} methods={bundle.methods} bundle={bundle} />)
    for (const id of ['field-kind', 'field-tier', 'field-languages', 'field-regime']) {
      expect(screen.getByTestId(id)).toBeDefined()
    }
  })

  it('resolves initiative language ids to names', () => {
    const i = bundle.initiatives[0]!
    const name = bundle.languages.find((l) => l.id === i.languages[0])!.name
    render(<InitiativePanel initiative={i} methods={bundle.methods} bundle={bundle} />)
    expect(screen.getByTestId('field-languages').textContent).toContain(name)
  })

  it('shows links with their retrieval date', () => {
    const i = bundle.initiatives.find((x) => x.links.length > 0)!
    render(<InitiativePanel initiative={i} methods={bundle.methods} bundle={bundle} />)
    const field = screen.getByTestId('field-links')
    expect(field.textContent).toContain(i.links[0]!.label)
    expect(field.textContent).toContain(i.links[0]!.retrieved)
    expect(within(field).getByRole('link').getAttribute('href')).toBe(i.links[0]!.url)
  })

  it('shows the governance licence', () => {
    render(<InitiativePanel initiative={bundle.initiatives[0]!} methods={bundle.methods} bundle={bundle} />)
    expect(screen.getByTestId('field-licence')).toBeDefined()
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
// class guard, not the case guard.
//
// ONE walker, both panels (fix round 1: the first version covered only the
// language panel, and a guard that has to be remembered twice is a guard that
// will be remembered once). It is SYMMETRIC, like the section mapping table:
// the set of fields carrying a disclosure must be EXACTLY the expected set, so
// it fails BOTH when a sourced field loses its disclosure AND when a field the
// schema gives no source acquires one — which is the whole content of "no
// source, no toggle". Tasks 5 and 6 add rows here when they add sourced fields.
function assertDisclosures(container: HTMLElement, expected: Record<string, string>): void {
  const fields = Array.from(container.querySelectorAll<HTMLElement>('[data-testid^="field-"]'))
  expect(fields.length).toBeGreaterThan(0)

  const found: Record<string, string> = {}
  for (const field of fields) {
    const testId = field.getAttribute('data-testid')!
    const buttons = field.querySelectorAll<HTMLElement>('button[data-testid^="source-"]')
    expect(buttons.length, `${testId} renders ${buttons.length} source disclosures`)
      .toBeLessThanOrEqual(1)
    const button = buttons[0]
    if (button === undefined) continue
    // Named after its OWN field, read from the rendered `<dt>` rather than
    // from this table, so a copied `label` fails here rather than reaching a
    // screen reader as one more indistinguishable "source" button.
    const label = field.querySelector('dt')?.textContent
    expect(button.getAttribute('aria-label'), `${testId} is named for "${label}"`)
      .toBe(`Source for ${label}`)
    found[testId] = button.getAttribute('aria-label')!
  }

  expect(found).toEqual(expected)
  const names = Object.values(found)
  expect(new Set(names).size, `duplicate accessible names: ${names.join(', ')}`).toBe(names.length)
}

describe('source disclosures', () => {
  // Built here rather than taken from the fixture: no fixture language carries
  // an endangerment status, so the third of the language panel's disclosures
  // would otherwise never be rendered by any panel test at all. Fixture growth
  // belongs to Task 7.
  const conflicted: Language = languages.find((x: Language) => (x.speakers?.conflicts.length ?? 0) > 0)!
  const withEndangerment: Language = LanguageSchema.parse({
    ...conflicted,
    endangerment: {
      status: 'severely-endangered', scale: 'unesco-2010',
      source: { kind: 'doc', ref: 'fixture-endangerment', retrieved: null, quote: null },
    },
  })

  it('gives the language panel exactly the disclosures the schema sources', () => {
    const { container } = render(
      <LanguagePanel language={withEndangerment} initiatives={[]} filtered={true} />,
    )
    assertDisclosures(container, {
      'field-endangerment': 'Source for Endangerment',
      'field-speakers': 'Source for Speakers',
      'field-centre': 'Source for Centre',
    })
  })

  it('gives the initiative panel exactly the disclosures the schema sources', () => {
    const { container } = render(
      <InitiativePanel bundle={bundle} initiative={init('fixture-ongoing')} methods={methods} />,
    )
    assertDisclosures(container, {
      'field-governance': 'Source for Governance',
      'field-site': 'Source for Location',
    })
  })

  // Rendered against the adjacent-tier initiative so `field-transferability`
  // is present — `TransferabilitySchema` carries no `Source`, and Task 6 owns
  // the `Evidence` section, so a toggle here would invent an attribution.
  // `fixture-adjacent-init` also has a null `governance`, which is the other
  // half: an absent sub-object contributes no disclosure either.
  it('gives an adjacent-tier initiative no disclosure it has no source for', () => {
    const { container } = render(
      <InitiativePanel bundle={bundle} initiative={init('fixture-adjacent-init')} methods={methods} />,
    )
    expect(container.querySelector('[data-testid="field-transferability"]')).not.toBeNull()
    assertDisclosures(container, { 'field-site': 'Source for Location' })
  })
})
