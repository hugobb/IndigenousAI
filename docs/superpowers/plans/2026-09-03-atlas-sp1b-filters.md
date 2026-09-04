# Atlas SP1b — Querying the Map: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the atlas queryable — eight facet groups, a date window, a rail that reports what filtering removed, and a URL a paper can cite.

**Architecture:** The URL is the single source of truth. A pure codec turns it into `FilterState`; a pure pipeline turns `FilterState` plus the bundle into a `Selection`; React renders the selection and writes the URL from one effect. All the substance is pure functions, which is why it is testable without a browser.

**Tech Stack:** React 19, TypeScript strict, Vitest (node + jsdom), Testing Library. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-09-03-atlas-sp1b-filters-design.md` — read it first, together with its parent `2026-09-03-indigenous-nlp-atlas-design.md` (D6, D7) and `docs/superpowers/decisions/2026-09-03-atlas-sp1a-rulings.md`.

## Global Constraints

- **Node 22.22.2**, NOT on PATH. Before any node/pnpm command: `export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"`. Node IS installed — do not install it.
- **Never run `pnpm approve-builds`** — it overwrites `atlas/pnpm-workspace.yaml` and breaks `pnpm test`. Never add a `pnpm` field to `package.json`.
- All commands run from `atlas/`. **`pnpm test` starts at 159.** Never let it go down; never edit or delete a test to make a number work.
- `pnpm typecheck` clean. `pnpm build:data` must keep exiting **1** with all ten records `draft` — **never promote a record to `verified`**.
- `pnpm build:app` **fails by design** without a real bundle. Use `ATLAS_ALLOW_NO_BUNDLE=1 pnpm build:app` to compile-check.
- TypeScript strict, `noUncheckedIndexedAccess: true`, no `any`.
- Never edit `litterature_review/`, `docs/docs/`, `atlas/data/**`, or `atlas/src/data/**`.
- **No polygons, no GeoJSON territory data, no `@turf/*`, no Native Land Digital.**
- **Do not change the §4 visual encoding.** A language field's `circle-blur` stays the constant `1.2`. Filtering changes *which* records reach `languageFields`/`initiativeSites`, never how one is drawn. Filtering must never become a fifth visual channel.
- **No new dependencies.** No faceted-search library (spec F9), no Playwright (spec F8).
- **Every guard test must be mutation-checked**: make the change it forbids, watch it fail, restore. Four SP1a guards asserted less than their names claimed.
- Conventional commit prefixes. Commit at the end of every task.

## Record field mapping — read this before Task 1

The facet ids in the spec are **not** the record field names. Getting this wrong is the single most likely bug in this plan:

| Facet id | Entity | Reads from | Shape |
|---|---|---|---|
| `family` | Language | `l.family` | `string \| null` |
| `typology` | Language | `l.typology` | `Typology[]` (often `[]`) |
| `endangerment` | Language | `l.endangerment?.status` | **object** `{status, scale, source} \| null` |
| `region` | Language | `l.region` | `Region \| null` |
| `application` | Initiative | `i.applications` | `Application[]` — **plural on the record** |
| `method` | Initiative | `i.methods` | `string[]` (method ids) |
| `regime` | Initiative | `i.data_regime` | `DataRegime \| null` — **snake_case on the record** |
| `governance` | Initiative | `i.governance?.posture` | **object** `{posture, licence, source} \| null` |

## File structure

- `src/lib/facets.ts` — the one place the table above is encoded. Facet registry + option/count summaries. Pure.
- `src/lib/url-state.ts` — `parseFilters` / `toSearch`. Pure.
- `src/lib/filters.ts` — the `L1`/`I1`/`L2` pipeline. Pure.
- `src/state/useFilters.ts` — reducer + the single URL-writing effect.
- `src/components/Timeline.tsx` — two native range inputs.
- `src/components/FacetGroup.tsx` — one collapsible group.
- `src/components/FacetPanel.tsx` — the eight groups + clear-all.
- `src/components/UnmappedList.tsx` — gains a third group (modified).
- `src/components/App.tsx` — wiring (modified).
- `src/styles.css` — new grid area + facet/timeline rules (modified).

---
### Task 1: The facet registry

Encodes the record field mapping in one place, and computes per-facet options with counts. Everything downstream reads facets through this module, so no other file ever touches `data_regime` or `governance.posture` directly.

**Files:**
- Create: `atlas/src/lib/facets.ts`
- Test: `atlas/tests/facets.test.ts`

**Interfaces:**
- Consumes: `Language`, `Initiative`, and the vocabularies from `../schema/index.js`.
- Produces:
  - `NOT_RECORDED = '_none'`
  - `type FacetId = 'family'|'typology'|'endangerment'|'region'|'application'|'method'|'regime'|'governance'`
  - `LANGUAGE_FACETS: LanguageFacet[]` and `INITIATIVE_FACETS: InitiativeFacet[]`, each entry `{ id, label, values }` where `values` returns the record's values for that facet (`[]` means not recorded)
  - `VOCAB_FOR: Partial<Record<FacetId, readonly string[]>>` — the allowed values for vocabulary-backed facets; `family` and `method` are absent because they are data-derived
  - `facetOptions(records, facet): { value: string; count: number }[]` sorted by value
  - `notRecordedCount(records, facet): number`

- [ ] **Step 1: Write the failing test**

`atlas/tests/facets.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import {
  INITIATIVE_FACETS, LANGUAGE_FACETS, NOT_RECORDED, VOCAB_FOR,
  facetOptions, notRecordedCount,
} from '../src/lib/facets.js'
import { InitiativeSchema, LanguageSchema } from '../src/schema/index.js'

const src = { kind: 'doc' as const, ref: 'test', retrieved: null, quote: null }

const lang = (over: Record<string, unknown>) =>
  LanguageSchema.parse({
    id: 'l1', name: 'L1', tier: 'indigenous', typology: [], endangerment: null,
    speakers: null, region: null, centre: null, caveat: null, status: 'verified', ...over,
  })

const init = (over: Record<string, unknown>) =>
  InitiativeSchema.parse({
    id: 'i1', name: 'I1', kind: 'project', tier: 'indigenous', languages: ['l1'],
    started: null, ended: null,
    site: { lat: 0, lon: 0, place: 'p', source: src },
    applications: [], methods: [], models: [], data_regime: null,
    governance: null, papers: [], links: [], transferability: null,
    caveat: null, status: 'verified', ...over,
  })

const facet = (id: string) =>
  [...LANGUAGE_FACETS, ...INITIATIVE_FACETS].find((f) => f.id === id)!

describe('the facet registry', () => {
  it('covers exactly the eight facets D6 names', () => {
    expect([...LANGUAGE_FACETS, ...INITIATIVE_FACETS].map((f) => f.id)).toEqual([
      'family', 'typology', 'endangerment', 'region',
      'application', 'method', 'regime', 'governance',
    ])
  })

  it('reads endangerment from the nested status, not the object', () => {
    const l = lang({
      endangerment: { status: 'vulnerable', scale: 'unesco-2010', source: src },
    })
    expect((facet('endangerment') as { values: (x: unknown) => string[] }).values(l)).toEqual(['vulnerable'])
  })

  it('reads governance from the nested posture, not the object', () => {
    const i = init({ governance: { posture: 'open', licence: null, source: src } })
    expect((facet('governance') as { values: (x: unknown) => string[] }).values(i)).toEqual(['open'])
  })

  it('reads the application facet from the plural applications field', () => {
    const i = init({ applications: ['asr', 'tts'] })
    expect((facet('application') as { values: (x: unknown) => string[] }).values(i)).toEqual(['asr', 'tts'])
  })

  it('reads the regime facet from the snake_case data_regime field', () => {
    const i = init({ data_regime: '1k-10k' })
    expect((facet('regime') as { values: (x: unknown) => string[] }).values(i)).toEqual(['1k-10k'])
  })

  it('treats an absent value as not recorded, never as a value', () => {
    expect((facet('family') as { values: (x: unknown) => string[] }).values(lang({}))).toEqual([])
    expect((facet('typology') as { values: (x: unknown) => string[] }).values(lang({}))).toEqual([])
    expect((facet('endangerment') as { values: (x: unknown) => string[] }).values(lang({}))).toEqual([])
  })

  it('counts options and sorts them by value', () => {
    const ls = [lang({ id: 'a', region: 'oceania' }), lang({ id: 'b', region: 'africa' }), lang({ id: 'c', region: 'africa' })]
    expect(facetOptions(ls, facet('region') as never)).toEqual([
      { value: 'africa', count: 2 },
      { value: 'oceania', count: 1 },
    ])
  })

  it('counts records that carry nothing for the facet', () => {
    const ls = [lang({ id: 'a', region: 'africa' }), lang({ id: 'b' }), lang({ id: 'c' })]
    expect(notRecordedCount(ls, facet('region') as never)).toBe(2)
  })

  it('leaves the two data-derived facets out of the vocabulary map', () => {
    expect(VOCAB_FOR['family']).toBeUndefined()
    expect(VOCAB_FOR['method']).toBeUndefined()
    expect(VOCAB_FOR['region']).toContain('oceania')
  })

  it('uses a not-recorded sentinel no vocabulary value can collide with', () => {
    const all = Object.values(VOCAB_FOR).flatMap((v) => [...(v ?? [])])
    expect(all).not.toContain(NOT_RECORDED)
    expect(NOT_RECORDED.startsWith('_')).toBe(true)
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm vitest run tests/facets.test.ts`
Expected: FAIL — cannot resolve `../src/lib/facets.js`.

- [ ] **Step 3: Write the registry**

`atlas/src/lib/facets.ts`:
```ts
import type { Initiative, Language } from '../schema/index.js'
import {
  APPLICATIONS, DATA_REGIMES, ENDANGERMENT, GOVERNANCE_POSTURES, REGIONS, TYPOLOGIES,
} from '../schema/index.js'

/** Wire and UI form of "this record records nothing for this facet". A leading
 *  underscore cannot collide with a kebab-case vocabulary value. */
export const NOT_RECORDED = '_none'

export type FacetId =
  | 'family' | 'typology' | 'endangerment' | 'region'
  | 'application' | 'method' | 'regime' | 'governance'

export interface LanguageFacet { id: FacetId; label: string; values: (l: Language) => string[] }
export interface InitiativeFacet { id: FacetId; label: string; values: (i: Initiative) => string[] }

/** The facet id is NOT the record field name. `application` reads `applications`,
 *  `regime` reads `data_regime`, and `endangerment`/`governance` are objects whose
 *  facet value lives at `.status`/`.posture`. This module is the only place that
 *  knows that; nothing downstream touches those fields directly. */
export const LANGUAGE_FACETS: LanguageFacet[] = [
  { id: 'family', label: 'Family', values: (l) => (l.family === null ? [] : [l.family]) },
  { id: 'typology', label: 'Typology', values: (l) => l.typology },
  {
    id: 'endangerment', label: 'Endangerment',
    values: (l) => (l.endangerment == null ? [] : [l.endangerment.status]),
  },
  { id: 'region', label: 'Region', values: (l) => (l.region === null ? [] : [l.region]) },
]

export const INITIATIVE_FACETS: InitiativeFacet[] = [
  { id: 'application', label: 'Application', values: (i) => i.applications },
  { id: 'method', label: 'Method', values: (i) => i.methods },
  {
    id: 'regime', label: 'Data regime',
    values: (i) => (i.data_regime === null ? [] : [i.data_regime]),
  },
  {
    id: 'governance', label: 'Governance',
    values: (i) => (i.governance == null ? [] : [i.governance.posture]),
  },
]

/** Allowed values for vocabulary-backed facets. `family` and `method` are absent
 *  on purpose: their values come from the data, so any string is legitimate and
 *  the codec must not discard one it has not seen. */
export const VOCAB_FOR: Partial<Record<FacetId, readonly string[]>> = {
  typology: TYPOLOGIES,
  endangerment: ENDANGERMENT,
  region: REGIONS,
  application: APPLICATIONS,
  regime: DATA_REGIMES,
  governance: GOVERNANCE_POSTURES,
}

export function facetOptions<T>(
  records: T[], facet: { values: (r: T) => string[] },
): { value: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const r of records) {
    for (const v of facet.values(r)) counts.set(v, (counts.get(v) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => a.value.localeCompare(b.value))
}

export function notRecordedCount<T>(records: T[], facet: { values: (r: T) => string[] }): number {
  return records.filter((r) => facet.values(r).length === 0).length
}
```

- [ ] **Step 4: Run it and watch it pass**

Run: `pnpm vitest run tests/facets.test.ts` → PASS (10 tests).

- [ ] **Step 5: Verify and commit**

```bash
pnpm test        # 159 + 10 = 169 — report the number if it differs
pnpm typecheck   # exit 0
cd .. && git add atlas && git commit -m "feat(atlas): facet registry mapping facet ids to record fields"
```

---
### Task 2: The URL codec — the citable contract (spec F2)

**Files:**
- Create: `atlas/src/lib/url-state.ts`
- Test: `atlas/tests/url-state.test.ts`

**Interfaces:**
- Consumes: `FacetId`, `NOT_RECORDED`, `VOCAB_FOR` from `./facets.js`.
- Produces:
  - `interface FilterState { family: string[]; typology: string[]; endangerment: string[]; region: string[]; application: string[]; method: string[]; regime: string[]; governance: string[]; from: number | null; to: number | null; lang: string | null; init: string | null }`
  - `EMPTY_FILTERS: FilterState`
  - `parseFilters(search: string): FilterState`
  - `toSearch(state: FilterState): string` — returns `''` for empty state, otherwise `?a=b&...`

- [ ] **Step 1: Write the failing test**

`atlas/tests/url-state.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { EMPTY_FILTERS, parseFilters, toSearch } from '../src/lib/url-state.js'
import { INITIATIVE_FACETS, LANGUAGE_FACETS, VOCAB_FOR } from '../src/lib/facets.js'
import methods from '../data/derived/methods.json'

describe('the URL contract', () => {
  // Hardcoded ON PURPOSE. Deriving these from FilterState would make the test a
  // mirror of the code: a breaking rename would silently stay green while every
  // URL printed in the paper broke.
  it('accepts exactly these twelve keys, spelled exactly this way', () => {
    const url =
      '?family=Algic&typology=polysynthetic&endangerment=vulnerable&region=north-america' +
      '&application=asr&method=fst-morphological-segmentation&regime=1k-10k' +
      '&governance=open&from=2000&to=2020&lang=myaamia&init=te-hiku-media'
    expect(parseFilters(url)).toEqual({
      family: ['Algic'], typology: ['polysynthetic'], endangerment: ['vulnerable'],
      region: ['north-america'], application: ['asr'],
      method: ['fst-morphological-segmentation'], regime: ['1k-10k'],
      governance: ['open'], from: 2000, to: 2020,
      lang: 'myaamia', init: 'te-hiku-media',
    })
  })

  it('round-trips a populated state', () => {
    const state = { ...EMPTY_FILTERS, application: ['asr', 'tts'], region: ['oceania'], from: 1999 }
    expect(parseFilters(toSearch(state))).toEqual(state)
  })

  it('writes nothing for an empty state', () => {
    expect(toSearch(EMPTY_FILTERS)).toBe('')
  })

  it('joins multiple values with commas', () => {
    expect(toSearch({ ...EMPTY_FILTERS, application: ['asr', 'tts'] })).toBe('?application=asr%2Ctts')
  })

  it('ignores an unknown key instead of failing', () => {
    expect(parseFilters('?colour=blue&region=africa')).toEqual({ ...EMPTY_FILTERS, region: ['africa'] })
  })

  it('drops an unknown value from a vocabulary facet, keeping the known ones', () => {
    expect(parseFilters('?region=africa,atlantis')).toEqual({ ...EMPTY_FILTERS, region: ['africa'] })
  })

  it('keeps any value for the two data-derived facets', () => {
    const r = parseFilters('?family=Some-New-Family&method=a-brand-new-method')
    expect(r.family).toEqual(['Some-New-Family'])
    expect(r.method).toEqual(['a-brand-new-method'])
  })

  it('carries the not-recorded sentinel through a round trip', () => {
    expect(parseFilters('?endangerment=_none').endangerment).toEqual(['_none'])
    expect(toSearch({ ...EMPTY_FILTERS, endangerment: ['_none'] })).toBe('?endangerment=_none')
  })

  it('ignores a non-integer year rather than producing NaN', () => {
    expect(parseFilters('?from=banana&to=2020')).toEqual({ ...EMPTY_FILTERS, from: null, to: 2020 })
  })

  it('emits keys in a stable order, so one state always yields one URL', () => {
    const a = toSearch({ ...EMPTY_FILTERS, region: ['africa'], application: ['asr'] })
    const b = toSearch({ ...EMPTY_FILTERS, application: ['asr'], region: ['africa'] })
    expect(a).toBe(b)
    expect(a.indexOf('region')).toBeLessThan(a.indexOf('application'))
  })

  // Comma-joining is only safe while no facet value contains a comma.
  it('has no comma in any vocabulary value or any data-derived facet value', () => {
    for (const values of Object.values(VOCAB_FOR)) {
      for (const v of values ?? []) expect(v).not.toContain(',')
    }
    for (const m of methods as { id: string }[]) expect(m.id).not.toContain(',')
  })

  it('names every facet in the registry as a key', () => {
    const parsed = parseFilters('')
    for (const f of [...LANGUAGE_FACETS, ...INITIATIVE_FACETS]) {
      expect(parsed).toHaveProperty(f.id)
    }
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm vitest run tests/url-state.test.ts`
Expected: FAIL — cannot resolve `../src/lib/url-state.js`.

- [ ] **Step 3: Write the codec**

`atlas/src/lib/url-state.ts`:
```ts
import { NOT_RECORDED, VOCAB_FOR, type FacetId } from './facets.js'

export interface FilterState {
  family: string[]
  typology: string[]
  endangerment: string[]
  region: string[]
  application: string[]
  method: string[]
  regime: string[]
  governance: string[]
  from: number | null
  to: number | null
  lang: string | null
  init: string | null
}

/** Key order here IS the URL's key order, so one state always serialises to one
 *  string — which is what makes a cited URL comparable and a round-trip test
 *  meaningful. Append only; never rename. */
const FACET_KEYS: FacetId[] = [
  'family', 'typology', 'endangerment', 'region',
  'application', 'method', 'regime', 'governance',
]

export const EMPTY_FILTERS: FilterState = {
  family: [], typology: [], endangerment: [], region: [],
  application: [], method: [], regime: [], governance: [],
  from: null, to: null, lang: null, init: null,
}

/** A value survives if the facet is data-derived (no vocabulary to check against)
 *  or if the vocabulary knows it. The sentinel always survives. */
function keepValue(id: FacetId, value: string): boolean {
  if (value === NOT_RECORDED) return true
  const vocab = VOCAB_FOR[id]
  return vocab === undefined || vocab.includes(value)
}

export function parseFilters(search: string): FilterState {
  const p = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  const state: FilterState = { ...EMPTY_FILTERS }

  for (const id of FACET_KEYS) {
    const raw = p.get(id)
    if (raw === null) continue
    state[id] = raw.split(',').filter((v) => v !== '' && keepValue(id, v))
  }

  for (const k of ['from', 'to'] as const) {
    const raw = p.get(k)
    if (raw === null) continue
    const n = Number(raw)
    // A bad year is dropped, not coerced: NaN would silently empty the map.
    if (Number.isInteger(n)) state[k] = n
  }

  for (const k of ['lang', 'init'] as const) {
    const raw = p.get(k)
    if (raw !== null && raw !== '') state[k] = raw
  }

  return state
}

export function toSearch(state: FilterState): string {
  const p = new URLSearchParams()
  for (const id of FACET_KEYS) {
    if (state[id].length > 0) p.set(id, state[id].join(','))
  }
  if (state.from !== null) p.set('from', String(state.from))
  if (state.to !== null) p.set('to', String(state.to))
  if (state.lang !== null) p.set('lang', state.lang)
  if (state.init !== null) p.set('init', state.init)
  const s = p.toString()
  return s === '' ? '' : `?${s}`
}
```

- [ ] **Step 4: Run it and watch it pass**

Run: `pnpm vitest run tests/url-state.test.ts` → PASS (12 tests).

If `?application=asr%2Ctts` surprises you: `URLSearchParams.toString()` percent-encodes the comma. That is correct and round-trips; the test asserts the encoded form deliberately so nobody "fixes" it into something that does not round-trip.

- [ ] **Step 5: Mutation-check the contract test**

Rename the `'region'` entry in `FACET_KEYS` to `'regions'`, run `pnpm vitest run tests/url-state.test.ts`, and confirm the twelve-keys test FAILS. Restore with `git checkout`. A contract test that survives a rename is a mirror, not a contract.

- [ ] **Step 6: Verify and commit**

```bash
pnpm test        # 169 + 12 = 181 — report the number if it differs
pnpm typecheck
cd .. && git add atlas && git commit -m "feat(atlas): citable URL contract for filter state"
```

---
### Task 3: The filter pipeline

Spec §5, the heart of SP1b. Three pure steps, plus the live counts from F7.

**Files:**
- Create: `atlas/src/lib/filters.ts`
- Test: `atlas/tests/filters.test.ts`

**Interfaces:**
- Consumes: `FilterState` from `./url-state.js`; the facet registry from `./facets.js`; `Language`, `Initiative` types; `AtlasBundle` from `./load.js`.
- Produces:
  - `interface Selection { languages: Language[]; initiatives: Initiative[]; filteredOut: Language[]; undatedInitiatives: number }`
  - `applyFilters(bundle: AtlasBundle, state: FilterState): Selection`
  - `interface FacetSummary { id: FacetId; label: string; options: { value: string; count: number }[]; notRecorded: number; curated: boolean; selected: string[] }`
  - `facetSummaries(bundle: AtlasBundle, state: FilterState): FacetSummary[]`
  - `yearRange(bundle: AtlasBundle): { min: number; max: number } | null`

- [ ] **Step 1: Write the failing test**

`atlas/tests/filters.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { applyFilters, facetSummaries, yearRange } from '../src/lib/filters.js'
import { EMPTY_FILTERS } from '../src/lib/url-state.js'
import type { AtlasBundle } from '../src/lib/load.js'
import { InitiativeSchema, LanguageSchema } from '../src/schema/index.js'

const src = { kind: 'doc' as const, ref: 'test', retrieved: null, quote: null }
const centre = { lat: 1, lon: 2, source: src, confidence: 'sourced' as const }

const lang = (id: string, over: Record<string, unknown> = {}) =>
  LanguageSchema.parse({
    id, name: id, tier: 'indigenous', typology: [], endangerment: null, speakers: null,
    region: null, centre, caveat: null, status: 'verified', ...over,
  })

const init = (id: string, languages: string[], over: Record<string, unknown> = {}) =>
  InitiativeSchema.parse({
    id, name: id, kind: 'project', tier: 'indigenous', languages,
    started: null, ended: null,
    site: { lat: 0, lon: 0, place: 'p', source: src },
    applications: [], methods: [], models: [], data_regime: null, governance: null,
    papers: [], links: [], transferability: null, caveat: null, status: 'verified', ...over,
  })

const bundle = (languages: unknown[], initiatives: unknown[]): AtlasBundle => ({
  generated: '2026-09-03', languages, initiatives, methods: [], papers: [], isDemoData: true,
} as unknown as AtlasBundle)

describe('applyFilters', () => {
  it('returns everything when nothing is selected', () => {
    const b = bundle([lang('a'), lang('b')], [init('i', ['a'])])
    const s = applyFilters(b, EMPTY_FILTERS)
    expect(s.languages.map((l) => l.id)).toEqual(['a', 'b'])
    expect(s.initiatives.map((i) => i.id)).toEqual(['i'])
    expect(s.filteredOut).toEqual([])
  })

  it('narrows languages by a language facet', () => {
    const b = bundle([lang('a', { region: 'africa' }), lang('b', { region: 'oceania' })], [])
    const s = applyFilters(b, { ...EMPTY_FILTERS, region: ['africa'] })
    expect(s.languages.map((l) => l.id)).toEqual(['a'])
    expect(s.filteredOut).toEqual([])
  })

  it('drops an initiative whose language was filtered out', () => {
    const b = bundle(
      [lang('a', { region: 'africa' }), lang('b', { region: 'oceania' })],
      [init('ia', ['a']), init('ib', ['b'])],
    )
    const s = applyFilters(b, { ...EMPTY_FILTERS, region: ['africa'] })
    expect(s.initiatives.map((i) => i.id)).toEqual(['ia'])
  })

  // Spec F1: this is the whole point. A work facet must never delete a language.
  it('moves a language with no matching work into filteredOut, never deleting it', () => {
    const b = bundle([lang('a'), lang('b')], [init('ia', ['a'], { applications: ['asr'] })])
    const s = applyFilters(b, { ...EMPTY_FILTERS, application: ['asr'] })
    expect(s.languages.map((l) => l.id)).toEqual(['a'])
    expect(s.filteredOut.map((l) => l.id)).toEqual(['b'])
  })

  it('does not list languages excluded by a language facet as filteredOut', () => {
    const b = bundle(
      [lang('a', { region: 'africa' }), lang('b', { region: 'oceania' })],
      [init('ia', ['a'], { applications: ['asr'] })],
    )
    const s = applyFilters(b, { ...EMPTY_FILTERS, region: ['africa'], application: ['asr'] })
    expect(s.filteredOut).toEqual([])
  })

  it('matches the not-recorded sentinel against records carrying nothing', () => {
    const b = bundle([lang('a', { region: 'africa' }), lang('b')], [])
    const s = applyFilters(b, { ...EMPTY_FILTERS, region: ['_none'] })
    expect(s.languages.map((l) => l.id)).toEqual(['b'])
  })

  it('treats multiple values within one facet as OR', () => {
    const b = bundle([lang('a', { region: 'africa' }), lang('b', { region: 'oceania' }), lang('c')], [])
    const s = applyFilters(b, { ...EMPTY_FILTERS, region: ['africa', 'oceania'] })
    expect(s.languages.map((l) => l.id)).toEqual(['a', 'b'])
  })

  it('treats different facets as AND', () => {
    const b = bundle(
      [lang('a', { region: 'africa', typology: ['fusional'] }), lang('b', { region: 'africa' })],
      [],
    )
    const s = applyFilters(b, { ...EMPTY_FILTERS, region: ['africa'], typology: ['fusional'] })
    expect(s.languages.map((l) => l.id)).toEqual(['a'])
  })

  it('applies the timeline to dated initiatives', () => {
    const b = bundle([lang('a')], [init('old', ['a'], { started: 1990 }), init('new', ['a'], { started: 2020 })])
    const s = applyFilters(b, { ...EMPTY_FILTERS, from: 2000, to: 2025 })
    expect(s.initiatives.map((i) => i.id)).toEqual(['new'])
  })

  // Spec F5: Te Hiku Media has no start date. A slider must not delete it.
  it('never removes an undated initiative with the timeline, and counts them', () => {
    const b = bundle([lang('a')], [init('undated', ['a']), init('old', ['a'], { started: 1990 })])
    const s = applyFilters(b, { ...EMPTY_FILTERS, from: 2000, to: 2025 })
    expect(s.initiatives.map((i) => i.id)).toEqual(['undated'])
    expect(s.undatedInitiatives).toBe(1)
  })

  it('treats an open-ended window as unconstrained on that side', () => {
    const b = bundle([lang('a')], [init('old', ['a'], { started: 1990 })])
    expect(applyFilters(b, { ...EMPTY_FILTERS, to: 1995 }).initiatives).toHaveLength(1)
    expect(applyFilters(b, { ...EMPTY_FILTERS, from: 1995 }).initiatives).toHaveLength(0)
  })
})

describe('facetSummaries', () => {
  it('marks a facet with no values anywhere as uncurated', () => {
    const b = bundle([lang('a'), lang('b')], [])
    const typology = facetSummaries(b, EMPTY_FILTERS).find((f) => f.id === 'typology')!
    expect(typology.curated).toBe(false)
    expect(typology.options).toEqual([])
    expect(typology.notRecorded).toBe(2)
  })

  it('marks a facet with at least one value as curated', () => {
    const b = bundle([lang('a', { region: 'africa' }), lang('b')], [])
    const region = facetSummaries(b, EMPTY_FILTERS).find((f) => f.id === 'region')!
    expect(region.curated).toBe(true)
    expect(region.options).toEqual([{ value: 'africa', count: 1 }])
    expect(region.notRecorded).toBe(1)
  })

  // Spec F7: an option must never claim a count that selecting it would not yield.
  it('counts against other facets but ignores the group its own selection is in', () => {
    const b = bundle(
      [lang('a', { region: 'africa', typology: ['fusional'] }),
       lang('b', { region: 'oceania', typology: ['fusional'] }),
       lang('c', { region: 'africa', typology: ['isolating'] })],
      [],
    )
    const sums = facetSummaries(b, { ...EMPTY_FILTERS, typology: ['fusional'], region: ['africa'] })
    const region = sums.find((f) => f.id === 'region')!
    // Narrowed by typology, NOT by region's own selection: a and b both survive.
    expect(region.options).toEqual([
      { value: 'africa', count: 1 },
      { value: 'oceania', count: 1 },
    ])
    expect(region.selected).toEqual(['africa'])
  })

  it('reports all eight facets even when every one is empty', () => {
    expect(facetSummaries(bundle([], []), EMPTY_FILTERS)).toHaveLength(8)
  })

  // `curated` is a claim about the DATA, not about the current filter. If it were
  // measured against the filtered pool, narrowing to a region with no typology
  // would make the atlas announce that typology is uncurated, which is false.
  it('keeps a curated facet curated even when the filter excludes all its values', () => {
    const b = bundle(
      [lang('a', { region: 'africa', typology: ['fusional'] }), lang('b', { region: 'oceania' })],
      [],
    )
    const typology = facetSummaries(b, { ...EMPTY_FILTERS, region: ['oceania'] })
      .find((f) => f.id === 'typology')!
    expect(typology.options).toEqual([])
    expect(typology.curated).toBe(true)
  })
})

describe('yearRange', () => {
  it('spans the dated initiatives', () => {
    const b = bundle([lang('a')], [init('x', ['a'], { started: 1999 }), init('y', ['a'], { started: 2021 })])
    expect(yearRange(b)).toEqual({ min: 1999, max: 2021 })
  })

  it('is null when nothing is dated, so the timeline can hide itself', () => {
    expect(yearRange(bundle([lang('a')], [init('x', ['a'])]))).toBeNull()
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm vitest run tests/filters.test.ts`
Expected: FAIL — cannot resolve `../src/lib/filters.js`.

- [ ] **Step 3: Write the pipeline**

`atlas/src/lib/filters.ts`:
```ts
import type { Initiative, Language } from '../schema/index.js'
import type { AtlasBundle } from './load.js'
import type { FilterState } from './url-state.js'
import {
  INITIATIVE_FACETS, LANGUAGE_FACETS, NOT_RECORDED,
  facetOptions, notRecordedCount, type FacetId,
} from './facets.js'

export interface Selection {
  languages: Language[]
  initiatives: Initiative[]
  /** Matched the language facets but has no initiative left. Spec F1: these are a
   *  finding, not an error — they are surfaced in the rail, never deleted. */
  filteredOut: Language[]
  undatedInitiatives: number
}

/** Selected values are OR within a facet; facets are AND with each other. The
 *  sentinel matches a record that carries nothing for the facet. */
function matches<T>(record: T, facet: { id: FacetId; values: (r: T) => string[] }, selected: string[]): boolean {
  if (selected.length === 0) return true
  const values = facet.values(record)
  if (values.length === 0) return selected.includes(NOT_RECORDED)
  return values.some((v) => selected.includes(v))
}

function languagePasses(l: Language, state: FilterState): boolean {
  return LANGUAGE_FACETS.every((f) => matches(l, f, state[f.id]))
}

function initiativePasses(i: Initiative, state: FilterState): boolean {
  return INITIATIVE_FACETS.every((f) => matches(i, f, state[f.id]))
}

/** Spec F5: an initiative with no `started` is outside the window's reach. The
 *  alternative deletes Te Hiku Media whenever the slider moves. */
function withinWindow(i: Initiative, state: FilterState): boolean {
  if (i.started === null) return true
  if (state.from !== null && i.started < state.from) return false
  if (state.to !== null && i.started > state.to) return false
  return true
}

const anyWorkFilter = (s: FilterState): boolean =>
  INITIATIVE_FACETS.some((f) => s[f.id].length > 0) || s.from !== null || s.to !== null

const anyLanguageFilter = (s: FilterState): boolean =>
  LANGUAGE_FACETS.some((f) => s[f.id].length > 0)

export function applyFilters(bundle: AtlasBundle, state: FilterState): Selection {
  const l1 = bundle.languages.filter((l) => languagePasses(l, state))
  const l1ids = new Set(l1.map((l) => l.id))

  // The language-intersection test is conditional. InitiativeSchema requires at
  // least one language, so with no language facet active the unconditional form
  // would behave identically today — but writing it conditionally keeps this rule
  // from depending on a `.min(1)` three files away.
  const i1 = bundle.initiatives.filter(
    (i) =>
      initiativePasses(i, state) &&
      withinWindow(i, state) &&
      (!anyLanguageFilter(state) || i.languages.some((id) => l1ids.has(id))),
  )

  if (!anyWorkFilter(state)) {
    return { languages: l1, initiatives: i1, filteredOut: [], undatedInitiatives: 0 }
  }

  const covered = new Set(i1.flatMap((i) => i.languages))
  return {
    languages: l1.filter((l) => covered.has(l.id)),
    initiatives: i1,
    filteredOut: l1.filter((l) => !covered.has(l.id)),
    undatedInitiatives: i1.filter((i) => i.started === null).length,
  }
}

export interface FacetSummary {
  id: FacetId
  label: string
  options: { value: string; count: number }[]
  notRecorded: number
  curated: boolean
  selected: string[]
}

/** Counts are computed against the selection with THIS facet's own choices
 *  cleared, so an option never advertises a count that selecting it would not
 *  produce (spec F7). */
export function facetSummaries(bundle: AtlasBundle, state: FilterState): FacetSummary[] {
  const summarise = <T>(
    facet: { id: FacetId; label: string; values: (r: T) => string[] },
    pool: T[],
    all: T[],
  ): FacetSummary => ({
    id: facet.id,
    label: facet.label,
    options: facetOptions(pool, facet),
    notRecorded: notRecordedCount(pool, facet),
    // `curated` asks whether this dimension has data AT ALL, so it is measured
    // against the whole bundle. Measuring it against the filtered pool would make
    // a facet read "not yet curated" merely because the current filter excluded
    // its values — turning a filter result into a false claim about curation.
    curated: facetOptions(all, facet).length > 0,
    selected: state[facet.id],
  })

  return [
    ...LANGUAGE_FACETS.map((f) =>
      summarise(f, applyFilters(bundle, { ...state, [f.id]: [] }).languages, bundle.languages),
    ),
    ...INITIATIVE_FACETS.map((f) =>
      summarise(f, applyFilters(bundle, { ...state, [f.id]: [] }).initiatives, bundle.initiatives),
    ),
  ]
}

export function yearRange(bundle: AtlasBundle): { min: number; max: number } | null {
  const years = bundle.initiatives.map((i) => i.started).filter((y): y is number => y !== null)
  if (years.length === 0) return null
  return { min: Math.min(...years), max: Math.max(...years) }
}
```

- [ ] **Step 4: Run it and watch it pass**

Run: `pnpm vitest run tests/filters.test.ts` → PASS (18 tests).

- [ ] **Step 5: Mutation-check the two rules that matter**

Both must go RED, then be restored with `git checkout`:
1. Change `withinWindow`'s `if (i.started === null) return true` to `return false`. The undated-initiative test must fail.
2. In `applyFilters`, change `filteredOut` to `[]`. The "moves a language with no matching work into filteredOut" test must fail.

- [ ] **Step 6: Verify and commit**

```bash
pnpm test        # 181 + 18 = 199 — report the number if it differs
pnpm typecheck
cd .. && git add atlas && git commit -m "feat(atlas): filter pipeline that reports gaps instead of hiding them"
```

---
### Task 4: The state hook — URL as the single source of truth (spec F3)

**Files:**
- Create: `atlas/src/state/useFilters.ts`
- Test: `atlas/tests/use-filters.test.tsx`

**Interfaces:**
- Consumes: `FilterState`, `EMPTY_FILTERS`, `parseFilters`, `toSearch` from `../lib/url-state.js`.
- Produces:
  - `type FilterAction = { type: 'toggle'; facet: FacetId; value: string } | { type: 'clearFacet'; facet: FacetId } | { type: 'clearAll' } | { type: 'setRange'; from: number | null; to: number | null } | { type: 'selectLanguage'; id: string | null } | { type: 'selectInitiative'; id: string | null }`
  - `filterReducer(state: FilterState, action: FilterAction): FilterState` — pure, exported for testing
  - `useFilters(): { state: FilterState; dispatch: (a: FilterAction) => void }`

- [ ] **Step 1: Write the failing test**

`atlas/tests/use-filters.test.tsx`:
```tsx
// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { act } from 'react'
import { EMPTY_FILTERS } from '../src/lib/url-state.js'
import { filterReducer, useFilters, type FilterAction } from '../src/state/useFilters.js'

afterEach(() => cleanup())

describe('filterReducer', () => {
  it('adds a value on first toggle and removes it on the second', () => {
    const once = filterReducer(EMPTY_FILTERS, { type: 'toggle', facet: 'region', value: 'africa' })
    expect(once.region).toEqual(['africa'])
    expect(filterReducer(once, { type: 'toggle', facet: 'region', value: 'africa' }).region).toEqual([])
  })

  it('clears one facet without touching the others', () => {
    const s = { ...EMPTY_FILTERS, region: ['africa'], application: ['asr'] }
    const r = filterReducer(s, { type: 'clearFacet', facet: 'region' })
    expect(r.region).toEqual([])
    expect(r.application).toEqual(['asr'])
  })

  it('clears every facet and the range, but keeps the open panel', () => {
    const s = { ...EMPTY_FILTERS, region: ['africa'], from: 2000, lang: 'myaamia' }
    const r = filterReducer(s, { type: 'clearAll' })
    expect(r).toEqual({ ...EMPTY_FILTERS, lang: 'myaamia' })
  })

  it('keeps one selection at a time', () => {
    const s = filterReducer({ ...EMPTY_FILTERS, init: 'i' }, { type: 'selectLanguage', id: 'l' })
    expect(s).toMatchObject({ lang: 'l', init: null })
    expect(filterReducer(s, { type: 'selectInitiative', id: 'i' })).toMatchObject({ lang: null, init: 'i' })
  })

  it('never mutates the state it was given', () => {
    const s = { ...EMPTY_FILTERS }
    filterReducer(s, { type: 'toggle', facet: 'region', value: 'africa' })
    expect(s.region).toEqual([])
  })
})

function Probe(): React.JSX.Element {
  const { state, dispatch } = useFilters()
  ;(globalThis as { __dispatch?: (a: FilterAction) => void }).__dispatch = dispatch
  return <output data-testid="probe">{JSON.stringify(state.region)}</output>
}

const send = (a: FilterAction): void =>
  act(() => { (globalThis as { __dispatch?: (a: FilterAction) => void }).__dispatch!(a) })

describe('useFilters', () => {
  it('reads its initial state from the URL', () => {
    window.history.replaceState({}, '', '/?region=africa')
    render(<Probe />)
    expect(screen.getByTestId('probe').textContent).toBe('["africa"]')
  })

  it('writes a facet change into the URL', () => {
    window.history.replaceState({}, '', '/')
    render(<Probe />)
    send({ type: 'toggle', facet: 'region', value: 'oceania' })
    expect(window.location.search).toBe('?region=oceania')
  })

  it('leaves a clean URL when everything is cleared', () => {
    window.history.replaceState({}, '', '/?region=africa')
    render(<Probe />)
    send({ type: 'clearAll' })
    expect(window.location.search).toBe('')
  })

  it('pushes discrete changes so Back undoes a filter', () => {
    window.history.replaceState({}, '', '/')
    render(<Probe />)
    const before = window.history.length
    send({ type: 'toggle', facet: 'region', value: 'africa' })
    expect(window.history.length).toBeGreaterThan(before)
  })

  // A drag fires many setRange actions; each must NOT add a history entry.
  it('replaces rather than pushes while the range is moving', () => {
    window.history.replaceState({}, '', '/')
    render(<Probe />)
    const before = window.history.length
    send({ type: 'setRange', from: 2000, to: 2020 })
    send({ type: 'setRange', from: 2001, to: 2020 })
    send({ type: 'setRange', from: 2002, to: 2020 })
    expect(window.history.length).toBe(before)
    expect(window.location.search).toBe('?from=2002&to=2020')
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm vitest run tests/use-filters.test.tsx`
Expected: FAIL — cannot resolve `../src/state/useFilters.js`.

- [ ] **Step 3: Write the hook**

`atlas/src/state/useFilters.ts`:
```ts
import { useCallback, useEffect, useReducer, useRef } from 'react'
import type { FacetId } from '../lib/facets.js'
import { EMPTY_FILTERS, parseFilters, toSearch, type FilterState } from '../lib/url-state.js'

export type FilterAction =
  | { type: 'toggle'; facet: FacetId; value: string }
  | { type: 'clearFacet'; facet: FacetId }
  | { type: 'clearAll' }
  | { type: 'setRange'; from: number | null; to: number | null }
  | { type: 'selectLanguage'; id: string | null }
  | { type: 'selectInitiative'; id: string | null }

export function filterReducer(state: FilterState, action: FilterAction): FilterState {
  switch (action.type) {
    case 'toggle': {
      const current = state[action.facet]
      const next = current.includes(action.value)
        ? current.filter((v) => v !== action.value)
        : [...current, action.value]
      return { ...state, [action.facet]: next }
    }
    case 'clearFacet':
      return { ...state, [action.facet]: [] }
    case 'clearAll':
      // Clears the query, keeps the open panel: clearing filters should not also
      // close the record the reader is reading.
      return { ...EMPTY_FILTERS, lang: state.lang, init: state.init }
    case 'setRange':
      return { ...state, from: action.from, to: action.to }
    case 'selectLanguage':
      return { ...state, lang: action.id, init: null }
    case 'selectInitiative':
      return { ...state, init: action.id, lang: null }
  }
}

/** Only a range change replaces; everything else pushes. A drag emits a stream of
 *  setRange actions, and pushing each would bury the previous page under dozens
 *  of history entries. */
const REPLACES: FilterAction['type'] = 'setRange'

export function useFilters(): { state: FilterState; dispatch: (a: FilterAction) => void } {
  const [state, rawDispatch] = useReducer(
    filterReducer,
    undefined,
    () => parseFilters(window.location.search),
  )
  const lastAction = useRef<FilterAction['type'] | null>(null)

  const dispatch = useCallback((a: FilterAction): void => {
    lastAction.current = a.type
    rawDispatch(a)
  }, [])

  useEffect(() => {
    const search = toSearch(state)
    const url = `${window.location.pathname}${search}`
    if (url === `${window.location.pathname}${window.location.search}`) return
    if (lastAction.current === REPLACES) window.history.replaceState({}, '', url)
    else window.history.pushState({}, '', url)
  }, [state])

  return { state, dispatch }
}
```

- [ ] **Step 4: Run it and watch it pass**

Run: `pnpm vitest run tests/use-filters.test.tsx` → PASS (10 tests).

- [ ] **Step 5: Mutation-check the history rule**

Change `REPLACES` to `'clearAll'` so range changes push. The "replaces rather than pushes" test must FAIL. Restore with `git checkout`.

- [ ] **Step 6: Verify and commit**

```bash
pnpm test        # 199 + 10 = 209 — report the number if it differs
pnpm typecheck
cd .. && git add atlas && git commit -m "feat(atlas): URL-backed filter state"
```

---
### Task 5: The timeline

Spec F6: two native `<input type="range">`, not a custom two-thumb widget — keyboard-accessible for free, and testable in jsdom.

**Files:**
- Create: `atlas/src/components/Timeline.tsx`
- Test: `atlas/tests/timeline.test.tsx`

**Interfaces:**
- Consumes: nothing from earlier tasks beyond types.
- Produces: `Timeline` — props `{ min: number; max: number; from: number | null; to: number | null; undatedCount: number; onChange: (from: number | null, to: number | null) => void }`.

- [ ] **Step 1: Write the failing test**

`atlas/tests/timeline.test.tsx`:
```tsx
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import Timeline from '../src/components/Timeline.js'

afterEach(() => cleanup())

const props = {
  min: 1999, max: 2021, from: null, to: null, undatedCount: 0, onChange: () => {},
}

describe('Timeline', () => {
  it('defaults both handles to the full range', () => {
    render(<Timeline {...props} />)
    expect((screen.getByLabelText(/from/i) as HTMLInputElement).value).toBe('1999')
    expect((screen.getByLabelText(/to/i) as HTMLInputElement).value).toBe('2021')
  })

  it('shows the current window rather than making the reader read the handles', () => {
    render(<Timeline {...props} from={2005} to={2010} />)
    expect(screen.getByTestId('timeline-window').textContent).toContain('2005')
    expect(screen.getByTestId('timeline-window').textContent).toContain('2010')
  })

  it('reports a moved lower handle', () => {
    const onChange = vi.fn()
    render(<Timeline {...props} onChange={onChange} />)
    fireEvent.change(screen.getByLabelText(/from/i), { target: { value: '2005' } })
    expect(onChange).toHaveBeenCalledWith(2005, 2021)
  })

  it('pushes the upper handle when the lower one passes it', () => {
    const onChange = vi.fn()
    render(<Timeline {...props} from={2000} to={2010} onChange={onChange} />)
    fireEvent.change(screen.getByLabelText(/from/i), { target: { value: '2015' } })
    expect(onChange).toHaveBeenCalledWith(2015, 2015)
  })

  it('pushes the lower handle when the upper one passes it', () => {
    const onChange = vi.fn()
    render(<Timeline {...props} from={2010} to={2020} onChange={onChange} />)
    fireEvent.change(screen.getByLabelText(/to/i), { target: { value: '2005' } })
    expect(onChange).toHaveBeenCalledWith(2005, 2005)
  })

  it('reports nulls when returned to the full range, so the URL stays clean', () => {
    const onChange = vi.fn()
    render(<Timeline {...props} from={2005} to={2010} onChange={onChange} />)
    fireEvent.change(screen.getByLabelText(/from/i), { target: { value: '1999' } })
    fireEvent.change(screen.getByLabelText(/to/i), { target: { value: '2021' } })
    expect(onChange).toHaveBeenLastCalledWith(null, null)
  })

  // Spec F5, stated on screen rather than buried in a design document.
  it('says how many initiatives it cannot constrain', () => {
    render(<Timeline {...props} undatedCount={1} />)
    expect(screen.getByTestId('timeline-undated').textContent).toMatch(/1 initiative/i)
  })

  it('says nothing about undated initiatives when there are none', () => {
    render(<Timeline {...props} undatedCount={0} />)
    expect(screen.queryByTestId('timeline-undated')).toBeNull()
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm vitest run tests/timeline.test.tsx`
Expected: FAIL — cannot resolve `../src/components/Timeline.js`.

- [ ] **Step 3: Write the component**

`atlas/src/components/Timeline.tsx`:
```tsx
export interface TimelineProps {
  min: number
  max: number
  from: number | null
  to: number | null
  undatedCount: number
  onChange: (from: number | null, to: number | null) => void
}

/** Two native range inputs rather than a custom two-thumb track. A custom widget
 *  would be keyboard-hostile and untestable without a browser, and this project
 *  has no browser in CI (spec F8). */
export default function Timeline({
  min, max, from, to, undatedCount, onChange,
}: TimelineProps): React.JSX.Element {
  const lo = from ?? min
  const hi = to ?? max

  // A window equal to the full range is "unconstrained", reported as nulls so the
  // keys stay out of the URL and stay out of it after new data widens the range.
  const report = (nextLo: number, nextHi: number): void => {
    const isFull = nextLo <= min && nextHi >= max
    onChange(isFull ? null : nextLo, isFull ? null : nextHi)
  }

  return (
    <section className="timeline" aria-label="Filter initiatives by start year">
      <div className="timeline__controls">
        <label>
          <span>From</span>
          <input
            type="range" min={min} max={max} value={lo}
            onChange={(e) => {
              const v = Number(e.target.value)
              report(v, Math.max(v, hi))
            }}
          />
        </label>
        <label>
          <span>To</span>
          <input
            type="range" min={min} max={max} value={hi}
            onChange={(e) => {
              const v = Number(e.target.value)
              report(Math.min(v, lo), v)
            }}
          />
        </label>
      </div>
      <p className="timeline__window" data-testid="timeline-window">
        {lo}–{hi}
      </p>
      {undatedCount > 0 && (
        <p className="timeline__undated" data-testid="timeline-undated">
          {undatedCount} initiative{undatedCount === 1 ? '' : 's'} record no start year and
          {undatedCount === 1 ? ' is' : ' are'} always shown.
        </p>
      )}
    </section>
  )
}
```

- [ ] **Step 4: Run it and watch it pass**

Run: `pnpm vitest run tests/timeline.test.tsx` → PASS (8 tests).

- [ ] **Step 5: Mutation-check the clamp**

Change `report(v, Math.max(v, hi))` to `report(v, hi)`. The "pushes the upper handle" test must FAIL. Restore with `git checkout`.

- [ ] **Step 6: Verify and commit**

```bash
pnpm test        # 209 + 8 = 217 — report the number if it differs
pnpm typecheck
cd .. && git add atlas && git commit -m "feat(atlas): date-window timeline on native range inputs"
```

---

### Task 6: The facet panel

**Files:**
- Create: `atlas/src/components/FacetGroup.tsx`, `atlas/src/components/FacetPanel.tsx`
- Test: `atlas/tests/facet-panel.test.tsx`

**Interfaces:**
- Consumes: `FacetSummary` from `../lib/filters.js`; `NOT_RECORDED` from `../lib/facets.js`.
- Produces:
  - `FacetGroup` — props `{ summary: FacetSummary; onToggle: (value: string) => void }`
  - `FacetPanel` — props `{ summaries: FacetSummary[]; activeCount: number; onToggle: (facet: FacetId, value: string) => void; onClearAll: () => void }`
  - `TYPE_TO_NARROW_THRESHOLD = 12`

- [ ] **Step 1: Write the failing test**

`atlas/tests/facet-panel.test.tsx`:
```tsx
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import FacetPanel from '../src/components/FacetPanel.js'
import type { FacetSummary } from '../src/lib/filters.js'

afterEach(() => cleanup())

const summary = (over: Partial<FacetSummary>): FacetSummary => ({
  id: 'region', label: 'Region', options: [{ value: 'africa', count: 2 }],
  notRecorded: 0, curated: true, selected: [], ...over,
})

const panel = (summaries: FacetSummary[], onToggle = vi.fn()) => {
  render(
    <FacetPanel
      summaries={summaries}
      activeCount={summaries.reduce((n, s) => n + s.selected.length, 0)}
      onToggle={onToggle}
      onClearAll={vi.fn()}
    />,
  )
  return onToggle
}

describe('FacetPanel', () => {
  it('shows each option with its count', () => {
    panel([summary({})])
    expect(screen.getByLabelText(/africa/i)).toBeDefined()
    expect(screen.getByTestId('facet-region').textContent).toContain('2')
  })

  it('reports a toggled option', () => {
    const onToggle = panel([summary({})])
    fireEvent.click(screen.getByLabelText(/africa/i))
    expect(onToggle).toHaveBeenCalledWith('region', 'africa')
  })

  it('checks an option that is already selected', () => {
    panel([summary({ selected: ['africa'] })])
    expect((screen.getByLabelText(/africa/i) as HTMLInputElement).checked).toBe(true)
  })

  it('offers "not recorded" as a real option when some records lack the field', () => {
    panel([summary({ notRecorded: 3 })])
    expect(screen.getByLabelText(/not recorded/i)).toBeDefined()
  })

  it('does not offer "not recorded" when every record has a value', () => {
    panel([summary({ notRecorded: 0 })])
    expect(screen.queryByLabelText(/not recorded/i)).toBeNull()
  })

  // Spec F4: the curation gap is a finding, and must not look like an empty filter.
  it('renders an uncurated facet as a statement, with no checkboxes', () => {
    panel([summary({ id: 'typology', label: 'Typology', curated: false, options: [], notRecorded: 5 })])
    const group = screen.getByTestId('facet-typology')
    expect(group.textContent).toMatch(/not yet curated/i)
    expect(group.textContent).toContain('5')
    expect(group.querySelectorAll('input')).toHaveLength(0)
  })

  it('distinguishes an uncurated facet from a curated one with nothing selected', () => {
    panel([
      summary({ id: 'typology', label: 'Typology', curated: false, options: [], notRecorded: 5 }),
      summary({ id: 'region', curated: true, selected: [] }),
    ])
    expect(screen.getByTestId('facet-typology').textContent).toMatch(/not yet curated/i)
    expect(screen.getByTestId('facet-region').textContent).not.toMatch(/not yet curated/i)
  })

  it('shows a type-to-narrow box only once a group grows past the threshold', () => {
    const many = Array.from({ length: 13 }, (_, i) => ({ value: `m${i}`, count: 1 }))
    panel([summary({ id: 'method', label: 'Method', options: many })])
    expect(screen.getByTestId('facet-filter-method')).toBeDefined()
  })

  it('narrows the visible options as you type', () => {
    const many = Array.from({ length: 13 }, (_, i) => ({ value: `alpha${i}`, count: 1 }))
    many.push({ value: 'beta', count: 1 })
    panel([summary({ id: 'method', label: 'Method', options: many })])
    fireEvent.change(screen.getByTestId('facet-filter-method'), { target: { value: 'beta' } })
    expect(screen.getByLabelText(/beta/i)).toBeDefined()
    expect(screen.queryByLabelText(/alpha0/i)).toBeNull()
  })

  it('has no type-to-narrow box for a small group', () => {
    panel([summary({})])
    expect(screen.queryByTestId('facet-filter-region')).toBeNull()
  })

  it('offers clear-all only when something is selected', () => {
    panel([summary({ selected: ['africa'] })])
    expect(screen.getByTestId('clear-all').textContent).toContain('1')
  })

  it('hides clear-all when nothing is selected', () => {
    panel([summary({})])
    expect(screen.queryByTestId('clear-all')).toBeNull()
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm vitest run tests/facet-panel.test.tsx`
Expected: FAIL — cannot resolve `../src/components/FacetPanel.js`.

- [ ] **Step 3: Write `FacetGroup`**

`atlas/src/components/FacetGroup.tsx`:
```tsx
import { useState } from 'react'
import { NOT_RECORDED } from '../lib/facets.js'
import type { FacetSummary } from '../lib/filters.js'

export const TYPE_TO_NARROW_THRESHOLD = 12

/** An uncurated facet states the gap instead of rendering an empty control set.
 *  A group with no checkboxes and a group with unchecked checkboxes look the same
 *  at a glance, and they mean opposite things: "no data yet" versus "no filter
 *  applied". */
export default function FacetGroup({
  summary, onToggle,
}: { summary: FacetSummary; onToggle: (value: string) => void }): React.JSX.Element {
  const [needle, setNeedle] = useState('')

  if (!summary.curated) {
    return (
      <div className="facet facet--uncurated" data-testid={`facet-${summary.id}`}>
        <p className="facet__legend">{summary.label}</p>
        <p className="facet__uncurated">
          Not yet curated ({summary.notRecorded} record{summary.notRecorded === 1 ? '' : 's'})
        </p>
      </div>
    )
  }

  const showNeedle = summary.options.length > TYPE_TO_NARROW_THRESHOLD
  const visible = needle === ''
    ? summary.options
    : summary.options.filter((o) => o.value.toLowerCase().includes(needle.toLowerCase()))

  return (
    <fieldset className="facet" data-testid={`facet-${summary.id}`}>
      <legend className="facet__legend">
        {summary.label}
        {summary.selected.length > 0 && <span className="facet__count"> ({summary.selected.length})</span>}
      </legend>

      {showNeedle && (
        <input
          type="text" className="facet__needle" placeholder={`Filter ${summary.label.toLowerCase()}`}
          aria-label={`Filter ${summary.label} options`} data-testid={`facet-filter-${summary.id}`}
          value={needle} onChange={(e) => setNeedle(e.target.value)}
        />
      )}

      <ul className="facet__options">
        {visible.map((o) => (
          <li key={o.value}>
            <label>
              <input
                type="checkbox" checked={summary.selected.includes(o.value)}
                onChange={() => onToggle(o.value)}
              />
              <span>{o.value}</span> <span className="facet__n">{o.count}</span>
            </label>
          </li>
        ))}
        {summary.notRecorded > 0 && (
          <li>
            <label>
              <input
                type="checkbox" checked={summary.selected.includes(NOT_RECORDED)}
                onChange={() => onToggle(NOT_RECORDED)}
              />
              <span>not recorded</span> <span className="facet__n">{summary.notRecorded}</span>
            </label>
          </li>
        )}
      </ul>
    </fieldset>
  )
}
```

- [ ] **Step 4: Write `FacetPanel`**

`atlas/src/components/FacetPanel.tsx`:
```tsx
import type { FacetId } from '../lib/facets.js'
import type { FacetSummary } from '../lib/filters.js'
import FacetGroup from './FacetGroup.js'

export default function FacetPanel({
  summaries, activeCount, onToggle, onClearAll,
}: {
  summaries: FacetSummary[]
  activeCount: number
  onToggle: (facet: FacetId, value: string) => void
  onClearAll: () => void
}): React.JSX.Element {
  return (
    <section className="card facets" aria-label="Filters">
      <div className="facets__head">
        <p className="section-label">Filters</p>
        {activeCount > 0 && (
          <button type="button" className="link-button" data-testid="clear-all" onClick={onClearAll}>
            Clear all ({activeCount})
          </button>
        )}
      </div>
      {summaries.map((s) => (
        <FacetGroup key={s.id} summary={s} onToggle={(v) => onToggle(s.id, v)} />
      ))}
    </section>
  )
}
```

- [ ] **Step 5: Run it and watch it pass**

Run: `pnpm vitest run tests/facet-panel.test.tsx` → PASS (12 tests).

- [ ] **Step 6: Mutation-check the uncurated distinction**

Delete the `if (!summary.curated)` early return so uncurated facets render as ordinary empty groups. The "renders an uncurated facet as a statement" and "distinguishes an uncurated facet" tests must FAIL. Restore with `git checkout`.

- [ ] **Step 7: Verify and commit**

```bash
pnpm test        # 217 + 12 = 229 — report the number if it differs
pnpm typecheck
cd .. && git add atlas && git commit -m "feat(atlas): facet panel that states the curation gap"
```

---
### Task 7: The rail's third group, and wiring it all together

The task that makes SP1b real. `UnmappedList` gains the "matches but no matching work" group, and `App` swaps its local `useState` for `useFilters` and feeds the map the *filtered* collections.

`UnmappedList` keeps its name. Its card is headed "What the map cannot show", which is exactly what a filtered-out language is; renaming it would churn SP1a's tests for nothing.

**Files:**
- Modify: `atlas/src/components/UnmappedList.tsx`, `atlas/src/components/App.tsx`
- Test: `atlas/tests/filtered-out.test.tsx`, and `atlas/tests/app.test.tsx` (extend)

**Interfaces:**
- Consumes: `applyFilters`, `facetSummaries`, `yearRange` from `../lib/filters.js`; `useFilters` from `../state/useFilters.js`; `FacetPanel`, `Timeline`.
- Produces: `UnmappedList` gains a required `filteredOut: Language[]` prop.

- [ ] **Step 1: Write the failing test**

`atlas/tests/filtered-out.test.tsx`:
```tsx
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import UnmappedList from '../src/components/UnmappedList.js'
import { LanguageSchema } from '../src/schema/index.js'

afterEach(() => cleanup())

const src = { kind: 'doc' as const, ref: 't', retrieved: null, quote: null }
const lang = (id: string, over: Record<string, unknown> = {}) =>
  LanguageSchema.parse({
    id, name: id, tier: 'indigenous', typology: [], endangerment: null, speakers: null,
    region: null, centre: { lat: 1, lon: 2, source: src, confidence: 'sourced' },
    caveat: null, status: 'verified', ...over,
  })

describe('the filtered-out group', () => {
  it('is absent when the filter removed nothing', () => {
    render(<UnmappedList languages={[lang('a')]} filteredOut={[]} onSelect={vi.fn()} />)
    expect(screen.queryByTestId('group-filtered-out')).toBeNull()
  })

  // Spec F1: filtering to ASR must not make Choctaw disappear — it must make
  // Choctaw say it has no ASR work.
  it('names each language that matched but has no matching work', () => {
    render(<UnmappedList languages={[lang('a')]} filteredOut={[lang('choctaw')]} onSelect={vi.fn()} />)
    const group = screen.getByTestId('group-filtered-out')
    expect(group.textContent).toContain('choctaw')
    expect(group.textContent).toContain('1')
  })

  it('keeps a filtered-out language selectable', () => {
    const onSelect = vi.fn()
    render(<UnmappedList languages={[]} filteredOut={[lang('choctaw')]} onSelect={onSelect} />)
    fireEvent.click(screen.getByRole('button', { name: /choctaw/i }))
    expect(onSelect).toHaveBeenCalledWith('choctaw')
  })

  it('still shows the two groups it had before', () => {
    render(
      <UnmappedList
        languages={[lang('nocentre', { centre: null })]}
        filteredOut={[]} onSelect={vi.fn()}
      />,
    )
    expect(screen.getByTestId('group-not-mapped')).toBeDefined()
    expect(screen.getByTestId('group-approximate')).toBeDefined()
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm vitest run tests/filtered-out.test.tsx`
Expected: FAIL — `filteredOut` is not a prop of `UnmappedList`.

- [ ] **Step 3: Add the third group**

In `atlas/src/components/UnmappedList.tsx`, change the props to
`{ languages, filteredOut, onSelect }: { languages: Language[]; filteredOut: Language[]; onSelect: (id: string) => void }`
and insert this block immediately after the `group-approximate` div, before the closing `</section>`:

```tsx
      {filteredOut.length > 0 && (
        <div data-testid="group-filtered-out">
          <h3>Matches your filters, but no matching work ({filteredOut.length})</h3>
          <p className="hint">
            These languages match your language filters. No initiative in the current
            selection works on them — which is a finding, not an empty result.
          </p>
          <ul>
            {filteredOut.map((l) => (
              <li key={l.id}>
                <button type="button" className="link-button" onClick={() => onSelect(l.id)}>
                  {l.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
```

- [ ] **Step 4: Rewrite `App` to run on filtered state**

Replace the body of `atlas/src/components/App.tsx` with:

```tsx
import { useMemo } from 'react'
import { loadBundle } from '../lib/load.js'
import { applyFilters, facetSummaries, yearRange } from '../lib/filters.js'
import { useFilters } from '../state/useFilters.js'
import { initiativeSites, languageFields } from '../map/layers.js'
import MapView from './MapView.js'
import LanguagePanel from './LanguagePanel.js'
import InitiativePanel from './InitiativePanel.js'
import UnmappedList from './UnmappedList.js'
import FacetPanel from './FacetPanel.js'
import Timeline from './Timeline.js'

export default function App(): React.JSX.Element {
  const bundle = useMemo(() => loadBundle(), [])
  const { state, dispatch } = useFilters()

  const selection = useMemo(() => applyFilters(bundle, state), [bundle, state])
  const summaries = useMemo(() => facetSummaries(bundle, state), [bundle, state])
  const years = useMemo(() => yearRange(bundle), [bundle])

  const language = selection.languages.find((l) => l.id === state.lang)
    ?? selection.filteredOut.find((l) => l.id === state.lang)
    ?? null
  const initiative = selection.initiatives.find((i) => i.id === state.init) ?? null

  const activeCount = summaries.reduce((n, s) => n + s.selected.length, 0)
  const nothingMatched = selection.languages.length === 0 && selection.initiatives.length === 0

  return (
    <main className="atlas">
      <header className="atlas__masthead">
        <h1>Atlas of Indigenous Language NLP</h1>
        <p className="atlas__standfirst">
          Companion map to the review. Each point is a single approximate location, never a
          territory or a boundary.
        </p>
        <p className="atlas__generated" data-testid="data-version">
          Data snapshot: {bundle.generated}
        </p>
      </header>

      {bundle.isDemoData && (
        <p className="atlas__notice" role="alert" data-testid="demo-data-banner">
          <strong>Demonstration data.</strong> Every record on this page is an invented
          placeholder used for development. The places, families, coordinates and speaker
          counts shown here are not research data and must not be cited or screenshotted as
          such. The real atlas is built only from human-reviewed records.
        </p>
      )}

      <div className="atlas__timeline">
        {years !== null && (
          <Timeline
            min={years.min} max={years.max} from={state.from} to={state.to}
            undatedCount={selection.undatedInitiatives}
            onChange={(from, to) => dispatch({ type: 'setRange', from, to })}
          />
        )}
      </div>

      <div className="atlas__rail">
        <FacetPanel
          summaries={summaries}
          activeCount={activeCount}
          onToggle={(facet, value) => dispatch({ type: 'toggle', facet, value })}
          onClearAll={() => dispatch({ type: 'clearAll' })}
        />
        {nothingMatched && (
          <p className="card empty" data-testid="empty-result">
            Nothing matches the current filters.
          </p>
        )}
        <UnmappedList
          languages={selection.languages}
          filteredOut={selection.filteredOut}
          onSelect={(id) => dispatch({ type: 'selectLanguage', id })}
        />
        {language !== null && (
          <LanguagePanel
            language={language}
            initiatives={selection.initiatives.filter((i) => i.languages.includes(language.id))}
          />
        )}
        {initiative !== null && <InitiativePanel initiative={initiative} methods={bundle.methods} />}
      </div>

      <div className="atlas__map">
        <MapView
          languages={languageFields(selection.languages)}
          initiatives={initiativeSites(selection.initiatives)}
          selectedLanguageId={state.lang}
          onSelectLanguage={(id) => dispatch({ type: 'selectLanguage', id })}
          onSelectInitiative={(id) => dispatch({ type: 'selectInitiative', id })}
        />
      </div>
    </main>
  )
}
```

Note `language` also looks in `filteredOut`: a reader who clicks a filtered-out language must still get its panel, or the rail's buttons would do nothing.

- [ ] **Step 5: Add the filter-to-map seam test**

First append one test to `atlas/tests/app.test.tsx`, inside the existing `describe('App', ...)` (that file already mocks `maplibre-gl` and imports `cleanup`):

```tsx
  it('shows the data snapshot so a cited view can name it', () => {
    window.history.replaceState({}, '', '/')
    render(<App />)
    expect(screen.getByTestId('data-version').textContent).toMatch(/Data snapshot:/)
  })
```

Then create `atlas/tests/filter-map-seam.test.tsx`. **Do not add probe elements to `MapView`'s container div** — MapLibre takes that element over and manages its children, so anything rendered inside it is liable to be cleared. Mock the whole component instead, which keeps production code clean and asserts the seam just as well:

```tsx
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'

// Substituting MapView entirely lets us read exactly what App handed it.
// The map itself needs WebGL and cannot be asserted here (spec §8); the SEAM
// can, and the seam is what filtering has to get right.
vi.mock('../src/components/MapView.js', () => ({
  default: (p: {
    languages: { features: unknown[] }
    initiatives: { features: unknown[] }
  }) => (
    <div>
      <span data-testid="map-language-count">{p.languages.features.length}</span>
      <span data-testid="map-initiative-count">{p.initiatives.features.length}</span>
    </div>
  ),
}))

const { default: App } = await import('../src/components/App.js')

afterEach(() => cleanup())

const countsAt = (search: string): { languages: string; initiatives: string } => {
  window.history.replaceState({}, '', search)
  render(<App />)
  const languages = screen.getByTestId('map-language-count').textContent ?? ''
  const initiatives = screen.getByTestId('map-initiative-count').textContent ?? ''
  cleanup()
  return { languages, initiatives }
}

describe('what reaches the map', () => {
  it('gives the map fewer languages once a language facet excludes some', () => {
    const all = countsAt('/')
    const narrowed = countsAt('/?region=oceania')
    expect(Number(narrowed.languages)).toBeLessThan(Number(all.languages))
  })

  it('gives the map fewer initiatives once a work facet excludes some', () => {
    const all = countsAt('/')
    const narrowed = countsAt('/?application=asr')
    expect(Number(narrowed.initiatives)).toBeLessThan(Number(all.initiatives))
  })
})
```

If either count does not actually drop for the fixture's records, the fixture — not the assertion — is what to check: pick a facet value the fixture genuinely splits on and say in your report which you used.

- [ ] **Step 6: Run everything**

```bash
pnpm vitest run tests/filtered-out.test.tsx     # 4 pass
pnpm vitest run tests/filter-map-seam.test.tsx  # 2 pass
pnpm test        # 229 + 4 + 1 + 2 = 236 — report the number if it differs
pnpm typecheck
```

- [ ] **Step 7: Mutation-check the seam**

In `App.tsx`, change `languageFields(selection.languages)` back to `languageFields(bundle.languages)`. The "gives the map fewer languages" test must FAIL. Restore with `git checkout`.

- [ ] **Step 8: Commit**

```bash
cd .. && git add atlas && git commit -m "feat(atlas): wire filters through the rail, the panels and the map"
```

---

### Task 8: Layout for the new controls

Purely presentational, and the one task no test here can fully judge — jsdom has no layout engine (spec §8).

**Files:**
- Modify: `atlas/src/styles.css`
- Test: `atlas/tests/chrome.test.tsx` (extend)

**Interfaces:**
- Consumes: the class names introduced in Tasks 5–7 (`atlas__timeline`, `facets`, `facet`, `facet--uncurated`, `timeline`).
- Produces: nothing importable.

- [ ] **Step 1: Add the grid area**

`src/styles.css` places the layout with named `grid-template-areas` (SP1a fixed a collapse caused by auto-placement — do not reintroduce implicit placement). Add a `timeline` area between the notice and the map/rail rows, in **both** the desktop template and the narrow-viewport media query, and give `.atlas__timeline` `grid-area: timeline`.

Every direct child of `main.atlas` must name a `grid-area` that the template also names — `tests/chrome.test.tsx` already asserts this, so an unplaced pane fails the suite.

- [ ] **Step 2: Style the new controls**

Add rules for `.timeline` (the two range inputs side by side, the window label, the undated note), `.facets` and `.facet` (legend, options list, counts), `.facet--uncurated` (visually quieter, clearly not a control), `.facet__needle`, and `.hint`. Use the existing custom properties rather than new literals; harmonise with `src/map/style.ts`'s ink/accent/muted palette.

The rail now holds the facets, the unmapped groups and a panel, so give `.atlas__rail` its own `overflow-y: auto` and `min-height: 0` — without `min-height: 0` a grid child refuses to shrink and the rail pushes the page into a scroll instead of scrolling itself.

- [ ] **Step 3: Extend the chrome guard**

Add to `atlas/tests/chrome.test.tsx`:

```tsx
  it('places the timeline pane by name, like every other pane', () => {
    const css = readFileSync(
      fileURLToPath(new URL('../src/styles.css', import.meta.url)), 'utf8',
    )
    expect(css).toMatch(/\.atlas__timeline\s*\{[^}]*grid-area:\s*timeline/)
    expect(css).toMatch(/grid-template-areas:[^;]*timeline/)
  })

  it('lets the rail scroll itself rather than the page', () => {
    const css = readFileSync(
      fileURLToPath(new URL('../src/styles.css', import.meta.url)), 'utf8',
    )
    expect(css).toMatch(/\.atlas__rail\s*\{[^}]*min-height:\s*0/)
  })
```

Match the import style already used at the top of `chrome.test.tsx` rather than adding new imports if they are already there.

These are source-text assertions, and they are weaker than a browser check — they prove the rule is written, not that the page lays out. That limit is stated in spec §8 and the test's own comment should say so.

- [ ] **Step 4: Verify**

```bash
pnpm test        # 236 + 2 = 238 — report the number if it differs
pnpm typecheck
ATLAS_ALLOW_NO_BUNDLE=1 pnpm build:app   # must emit a CSS asset
pnpm build:data; echo "exit=$?"          # MUST still be 1, ten records draft
```

- [ ] **Step 5: Look at it**

Run `pnpm dev` and open the page. Confirm: the timeline sits between the banner and the map; the facet panel is in the rail with the four uncurated groups reading "not yet curated"; toggling a facet changes the map and the URL together; the filtered-out group appears when a work facet excludes a language; Back undoes a filter. Report what you saw. **If you cannot run a browser, say so plainly rather than claiming a check you did not make** — an honest "not verified" is worth more here than an assumed pass.

- [ ] **Step 6: Commit**

```bash
cd .. && git add atlas && git commit -m "style(atlas): lay out the timeline strip and facet panel"
```
