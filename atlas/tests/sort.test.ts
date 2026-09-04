// atlas/tests/sort.test.ts
import { describe, expect, it } from 'vitest'
import { sortRows, INITIATIVE_COLUMNS, LANGUAGE_COLUMNS, type Column, type TableContext } from '../src/lib/columns.js'
import type { Initiative, Language, Source } from '../src/schema/index.js'

interface Row { id: string; name: string; n: number | null; rank: number | null }

const ctx: TableContext = { languageName: (id) => id, workCount: () => 0 }

const COLUMNS: Column<Row>[] = [
  { id: 'name', header: 'Name', scope: 'record',
    cell: (r) => ({ kind: 'text', value: r.name, sub: null }), sortValue: (r) => r.name },
  { id: 'n', header: 'N', scope: 'record',
    cell: (r) => ({ kind: 'number', value: r.n, marker: null }), sortValue: (r) => r.n },
  { id: 'rank', header: 'Rank', scope: 'record',
    cell: (r) => ({ kind: 'number', value: r.rank, marker: null }), sortValue: (r) => r.rank },
  { id: 'plain', header: 'Plain', scope: 'record',
    cell: (r) => ({ kind: 'text', value: r.name, sub: null }) },
]

const rows: Row[] = [
  // rank uses 2 and 10 rather than e.g. 2 and 0: those diverge under
  // string comparison ("10" < "2" lexicographically) but not under numeric
  // comparison (2 < 10), so only this pair actually distinguishes
  // `sortValue` being compared as numbers from being stringified first.
  { id: 'c', name: 'Cree', n: 3, rank: 10 },
  { id: 'a', name: 'Anishinaabemowin', n: null, rank: 2 },
  { id: 'm', name: 'Māori', n: 1, rank: null },
]
const ids = (rs: Row[]): string[] => rs.map((r) => r.id)

describe('sortRows', () => {
  // Rule 1. A null floated to the top of a descending sort makes "not
  // recorded" read as the maximum value in the column.
  it('sorts nulls last ascending', () => {
    expect(ids(sortRows(rows, COLUMNS, { column: 'n', direction: 'asc' }, ctx)))
      .toEqual(['m', 'c', 'a'])
  })

  it('sorts nulls last DESCENDING too', () => {
    expect(ids(sortRows(rows, COLUMNS, { column: 'n', direction: 'desc' }, ctx)))
      .toEqual(['c', 'm', 'a'])
  })

  // Rule 3. Without a tie-break the order of equal rows depends on the input
  // array, so a cited URL shows different rows in a different order elsewhere.
  it('breaks ties by name, ascending, in BOTH directions', () => {
    const tied: Row[] = [
      { id: 'z', name: 'Zuni', n: 5, rank: null },
      { id: 'b', name: 'Blackfoot', n: 5, rank: null },
      { id: 'k', name: 'Kanienʼkéha', n: 5, rank: null },
    ]
    expect(ids(sortRows(tied, COLUMNS, { column: 'n', direction: 'asc' }, ctx)))
      .toEqual(['b', 'k', 'z'])
    expect(ids(sortRows(tied, COLUMNS, { column: 'n', direction: 'desc' }, ctx)))
      .toEqual(['b', 'k', 'z'])
  })

  it('defaults to name ascending when no sort is given', () => {
    expect(ids(sortRows(rows, COLUMNS, null, ctx))).toEqual(['a', 'c', 'm'])
  })

  it('sorts strings by locale, not code point', () => {
    expect(ids(sortRows(rows, COLUMNS, { column: 'name', direction: 'desc' }, ctx)))
      .toEqual(['m', 'c', 'a'])
  })

  it('ignores a sort naming an unknown column and falls back to name', () => {
    expect(ids(sortRows(rows, COLUMNS, { column: 'nope', direction: 'desc' }, ctx)))
      .toEqual(['a', 'c', 'm'])
  })

  it('ignores a sort naming a column that declares no sortValue', () => {
    expect(ids(sortRows(rows, COLUMNS, { column: 'plain', direction: 'desc' }, ctx)))
      .toEqual(['a', 'c', 'm'])
  })

  it('does not mutate the array it was given', () => {
    const original = [...rows]
    sortRows(rows, COLUMNS, { column: 'n', direction: 'desc' }, ctx)
    expect(rows).toEqual(original)
  })

  // Rule 2 lives in Task 1's column declarations; this asserts sortRows
  // actually honours a numeric index rather than stringifying it. `rank` 0
  // must not sort as the string "0" against 2.
  it('compares numeric sort values numerically', () => {
    expect(ids(sortRows(rows, COLUMNS, { column: 'rank', direction: 'asc' }, ctx)))
      .toEqual(['a', 'c', 'm'])
  })
})

// The tests above exercise sortRows against synthetic columns built for this
// file. None of that touches INITIATIVE_COLUMNS or LANGUAGE_COLUMNS
// themselves, so nothing proves their real `sortValue` functions actually
// honour vocabulary order rather than alphabetical order. That distinction
// only bites on real enumerated fields (`endangerment`, `location`, `tier` /
// `governance`), so it has to be checked through the real columns.

const urlSource = (ref = 'https://example.org'): Source =>
  ({ kind: 'url', ref, retrieved: '2026-01-01', quote: null })

const lang = (over: Partial<Language> = {}): Language => ({
  id: 'cho', name: 'Choctaw', also_known_as: [], glottocode: null, iso639_3: null,
  tier: 'indigenous', family: null, subfamily: null, typology: [], endangerment: null,
  speakers: null, region: null, countries: [], centre: null, caveat: null, status: 'draft',
  ...over,
} as Language)

const init = (over: Partial<Initiative> = {}): Initiative => ({
  id: 'i1', name: 'Te Hiku Media', kind: 'organisation', tier: 'indigenous',
  languages: ['mri'], started: null, ended: null,
  site: { lat: 0, lon: 0, place: 'p', source: urlSource(), confidence: 'sourced' },
  applications: [], methods: [], models: [], data_regime: null, governance: null,
  papers: [], links: [], transferability: null, caveat: null, status: 'draft',
  ...over,
} as unknown as Initiative)

const realCtx: TableContext = { languageName: (id) => id, workCount: () => 0 }

describe('sortRows against the real INITIATIVE_COLUMNS / LANGUAGE_COLUMNS declarations', () => {
  // ENDANGERMENT is declared safe < vulnerable < definitely-endangered <
  // severely-endangered < critically-endangered < extinct (severity order).
  // These three languages are chosen so alphabetical-by-name, alphabetical-
  // by-status-string, and severity order all disagree with each other —
  // only severity order should win.
  it("sorts LANGUAGE_COLUMNS' endangerment column by severity, not alphabetically", () => {
    const atikamekw = lang({
      id: 'atj', name: 'Atikamekw',
      endangerment: { status: 'critically-endangered', scale: 'unesco-2010', source: urlSource() },
    })
    const blackfoot = lang({
      id: 'bla', name: 'Blackfoot',
      endangerment: { status: 'safe', scale: 'unesco-2010', source: urlSource() },
    })
    const cree = lang({
      id: 'cr', name: 'Cree',
      endangerment: { status: 'vulnerable', scale: 'unesco-2010', source: urlSource() },
    })
    const languages = [atikamekw, blackfoot, cree]

    // Name-alphabetical would read Atikamekw, Blackfoot, Cree.
    // Status-string-alphabetical would read Blackfoot (critically-endangered
    // sorts wrong there too — see below), Atikamekw, ... — neither matches
    // severity order.
    expect(ids2(sortRows(languages, LANGUAGE_COLUMNS, { column: 'endangerment', direction: 'asc' }, realCtx)))
      .toEqual(['bla', 'cr', 'atj'])
    expect(ids2(sortRows(languages, LANGUAGE_COLUMNS, { column: 'endangerment', direction: 'desc' }, realCtx)))
      .toEqual(['atj', 'cr', 'bla'])
  })

  // `location` sorts sourced < approximate < not-mapped. A language with
  // `centre: null` must land after both known confidences, and must NOT be
  // treated as a null sort value (which would instead float it to the top on
  // desc, per Rule 1) — it is a known fact ("not mapped"), not an absence.
  it("sorts LANGUAGE_COLUMNS' location column sourced, then approximate, then not-mapped", () => {
    const sourced = lang({
      id: 'src', name: 'Sourced Lang',
      centre: { lat: 1, lon: 1, source: urlSource(), confidence: 'sourced' },
    })
    const approximate = lang({
      id: 'apx', name: 'Approximate Lang',
      centre: { lat: 2, lon: 2, source: urlSource(), confidence: 'approximate' },
    })
    const notMapped = lang({ id: 'nom', name: 'Not Mapped Lang', centre: null })
    const languages = [notMapped, approximate, sourced]

    expect(ids2(sortRows(languages, LANGUAGE_COLUMNS, { column: 'location', direction: 'asc' }, realCtx)))
      .toEqual(['src', 'apx', 'nom'])

    // Descending mirrors ascending exactly (not-mapped first, then
    // approximate, then sourced) rather than pinning not-mapped to the
    // bottom in both directions. That mirroring is the proof it is a real
    // vocabulary index — LOCATION_CONFIDENCE.length, one past the end — and
    // not Rule 1's null special-case, which never reorders across direction.
    expect(ids2(sortRows(languages, LANGUAGE_COLUMNS, { column: 'location', direction: 'desc' }, realCtx)))
      .toEqual(['nom', 'apx', 'src'])
  })

  // GOVERNANCE_POSTURES is declared community-controlled < restricted <
  // open < unstated. Alphabetically by name (Alpha, Beta, Gamma) and
  // alphabetically by posture string (community-controlled, open,
  // restricted) both disagree with the declared order — only vocabulary
  // order should win.
  it("sorts INITIATIVE_COLUMNS' governance column by vocabulary order, not alphabetically", () => {
    const alpha = init({
      id: 'a1', name: 'Alpha',
      governance: { posture: 'open', licence: null, source: urlSource() },
    })
    const beta = init({
      id: 'b1', name: 'Beta',
      governance: { posture: 'community-controlled', licence: null, source: urlSource() },
    })
    const gamma = init({
      id: 'g1', name: 'Gamma',
      governance: { posture: 'restricted', licence: null, source: urlSource() },
    })
    const initiatives = [alpha, beta, gamma]

    expect(ids2(sortRows(initiatives, INITIATIVE_COLUMNS, { column: 'governance', direction: 'asc' }, realCtx)))
      .toEqual(['b1', 'g1', 'a1'])
    expect(ids2(sortRows(initiatives, INITIATIVE_COLUMNS, { column: 'governance', direction: 'desc' }, realCtx)))
      .toEqual(['a1', 'g1', 'b1'])
  })
})

const ids2 = (rs: { id: string }[]): string[] => rs.map((r) => r.id)
