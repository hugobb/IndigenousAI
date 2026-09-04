// atlas/tests/columns.test.ts
import { describe, expect, it } from 'vitest'
import {
  INITIATIVE_COLUMNS, LANGUAGE_COLUMNS, columnIds, columnsFor, type TableContext,
} from '../src/lib/columns.js'
import type { Initiative, Language } from '../src/schema/index.js'

const ctx: TableContext = {
  languageName: (id) => (id === 'mri' ? 'Māori' : id),
  workCount: (id) => (id === 'cho' ? 0 : 3),
}

const lang = (over: Partial<Language> = {}): Language => ({
  id: 'cho', name: 'Choctaw', also_known_as: [], glottocode: null, iso639_3: null,
  tier: 'indigenous', family: null, subfamily: null, typology: [], endangerment: null,
  speakers: null, region: null, countries: [], centre: null, caveat: null, status: 'draft',
  ...over,
} as Language)

const init = (over: Partial<Initiative> = {}): Initiative => ({
  id: 'i1', name: 'Te Hiku Media', kind: 'organisation', tier: 'indigenous',
  languages: ['mri'], started: null, ended: null,
  site: {
    lat: 0, lon: 0, place: 'p',
    source: { kind: 'url', ref: 'https://e.x', retrieved: '2026-01-01', quote: null },
    confidence: 'sourced',
  },
  applications: [], methods: [], models: [], data_regime: null, governance: null,
  papers: [], links: [], transferability: null, caveat: null, status: 'draft',
  ...over,
} as unknown as Initiative)

const cellOf = <T>(cols: { id: string; cell: (r: T, c: TableContext) => unknown }[], id: string, r: T): unknown =>
  cols.find((c) => c.id === id)!.cell(r, ctx)

describe('columns', () => {
  it('declares exactly the seven specified columns per tab, in order', () => {
    expect(INITIATIVE_COLUMNS.map((c) => c.id)).toEqual([
      'name', 'tier', 'languages', 'started', 'applications', 'regime', 'governance',
    ])
    expect(LANGUAGE_COLUMNS.map((c) => c.id)).toEqual([
      'name', 'family', 'region', 'endangerment', 'speakers', 'work', 'location',
    ])
  })

  // The scope field is what makes the spec's scope-and-unit table enforceable
  // rather than documentary. A column with no scope is a number nobody can read.
  it('gives every column a scope', () => {
    for (const c of [...INITIATIVE_COLUMNS, ...LANGUAGE_COLUMNS]) {
      expect(['record', 'bundle', 'L1', 'I1']).toContain(c.scope)
    }
  })

  it('scopes matching work to I1, because 0 must not read as "no work exists"', () => {
    expect(LANGUAGE_COLUMNS.find((c) => c.id === 'work')!.scope).toBe('I1')
    expect(cellOf(LANGUAGE_COLUMNS, 'work', lang())).toEqual({ kind: 'number', value: 0, marker: null })
  })

  it('resolves language ids to names through the bundle-scoped context', () => {
    expect(LANGUAGE_COLUMNS.find((c) => c.id === 'name')!.scope).toBe('record')
    expect(INITIATIVE_COLUMNS.find((c) => c.id === 'languages')!.scope).toBe('bundle')
    expect(cellOf(INITIATIVE_COLUMNS, 'languages', init())).toEqual({ kind: 'list', values: ['Māori'] })
  })

  it('falls back to the raw id for a language the bundle does not hold', () => {
    expect(cellOf(INITIATIVE_COLUMNS, 'languages', init({ languages: ['zzz'] })))
      .toEqual({ kind: 'list', values: ['zzz'] })
  })

  it('marks a speaker count its sources disagree about', () => {
    const withConflict = lang({
      speakers: {
        value: 9600, as_of: 2020,
        source: { kind: 'url', ref: 'https://e.x', retrieved: '2026-01-01', quote: null },
        conflicts: [{
          value: 1000,
          source: { kind: 'url', ref: 'https://e.y', retrieved: '2026-01-01', quote: null },
        }],
      },
    } as Partial<Language>)
    expect(cellOf(LANGUAGE_COLUMNS, 'speakers', withConflict))
      .toEqual({ kind: 'number', value: 9600, marker: '†' })
  })

  it('leaves an unconflicted speaker count unmarked', () => {
    const plain = lang({
      speakers: {
        value: 150, as_of: null,
        source: { kind: 'url', ref: 'https://e.x', retrieved: '2026-01-01', quote: null },
        conflicts: [],
      },
    } as Partial<Language>)
    expect(cellOf(LANGUAGE_COLUMNS, 'speakers', plain))
      .toEqual({ kind: 'number', value: 150, marker: null })
  })

  // "not mapped" and "not recorded" are DIFFERENT claims. A null cell renders
  // "not recorded" — we don't know. A language with no centre is something we
  // do know, and saying "not recorded" there would understate the record.
  it('says "not mapped" rather than null for a language with no centre', () => {
    expect(cellOf(LANGUAGE_COLUMNS, 'location', lang({ centre: null })))
      .toEqual({ kind: 'text', value: 'not mapped', sub: null })
  })

  it('reports the centre confidence when there is one', () => {
    const mapped = lang({
      centre: {
        lat: 1, lon: 2,
        source: { kind: 'url', ref: 'https://e.x', retrieved: '2026-01-01', quote: null },
        confidence: 'approximate',
      },
    } as Partial<Language>)
    expect(cellOf(LANGUAGE_COLUMNS, 'location', mapped))
      .toEqual({ kind: 'text', value: 'approximate', sub: null })
  })

  it('carries the initiative kind as the name cell\'s secondary line', () => {
    expect(cellOf(INITIATIVE_COLUMNS, 'name', init()))
      .toEqual({ kind: 'text', value: 'Te Hiku Media', sub: 'organisation' })
  })

  // Spec §4: adjacent-tier rows stay visibly adjacent in BOTH tabs. That tier
  // means transferable work, not work on the language, and the languages tab
  // has no tier column — so the name cell carries it, exactly as the
  // initiatives tab carries `kind`.
  it('marks an adjacent-tier language in its name cell', () => {
    expect(cellOf(LANGUAGE_COLUMNS, 'name', lang({ tier: 'adjacent' })))
      .toEqual({ kind: 'text', value: 'Choctaw', sub: 'adjacent tier' })
    expect(cellOf(LANGUAGE_COLUMNS, 'name', lang({ tier: 'indigenous' })))
      .toEqual({ kind: 'text', value: 'Choctaw', sub: null })
  })

  it('renders absent scalars as null so the table can say "not recorded"', () => {
    expect(cellOf(LANGUAGE_COLUMNS, 'family', lang({ family: null })))
      .toEqual({ kind: 'text', value: null, sub: null })
    expect(cellOf(INITIATIVE_COLUMNS, 'started', init({ started: null })))
      .toEqual({ kind: 'text', value: null, sub: null })
    expect(cellOf(INITIATIVE_COLUMNS, 'governance', init({ governance: null })))
      .toEqual({ kind: 'text', value: null, sub: null })
  })

  // Seam review (Task 11): `started` is a YEAR. Declared `kind: 'number'` it
  // went through `DataTable`'s `toLocaleString`, which is correct for speaker
  // counts, and the initiatives table printed `2,016` while `InitiativePanel`
  // printed `2016` on the same screen. The renderer cannot tell a year from a
  // quantity; this module can, so it says so here. Sorting must stay numeric —
  // asserted alongside, because making the cell text is easy to "fix" by
  // making the sort key text too, which would order 1999 after 200.
  it('gives a year as a plain label, never as a grouped quantity', () => {
    expect(cellOf(INITIATIVE_COLUMNS, 'started', init({ started: 2016 })))
      .toEqual({ kind: 'text', value: '2016', sub: null })
    const col = INITIATIVE_COLUMNS.find((c) => c.id === 'started')!
    expect(col.sortValue!(init({ started: 2016 }), ctx)).toBe(2016)
  })

  it('has no columns for the map view', () => {
    expect(columnsFor('map')).toEqual([])
    expect(columnIds('map')).toEqual([])
    expect(columnIds('languages')).toContain('work')
  })
})
