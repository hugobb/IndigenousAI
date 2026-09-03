# Atlas SP0 — Schema and Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the data layer for the Indigenous language NLP atlas — typed schemas, extractors that derive Methods and Papers from the existing corpus, a build gate that refuses unverified records, and a seeding pass that produces a human review queue.

**Architecture:** A TypeScript package at `atlas/`. Hand-curated `Language` and `Initiative` records live as one YAML file each under `atlas/data/`; `Method`, `Paper` and `Area` are generated into `atlas/data/derived/` from `docs/docs/*-techniques/*.md` and `litterature_review/`. A single `validate.ts` gate enforces cross-references and record status and is the artifact's entire defensibility story. Nothing renders a map in SP0.

**Tech Stack:** Node 22.22.2 (pinned via `.nvmrc`), pnpm, TypeScript strict, Zod for schemas, `js-yaml` for records, Vitest for tests, `@turf/simplify` for polygon simplification.

**Spec:** `docs/superpowers/specs/2026-09-03-indigenous-nlp-atlas-design.md` — read it before starting; this plan argues from it and does not restate its reasoning.

## Global Constraints

- **Node 22.22.2**, pinned in `atlas/.nvmrc`. Node is **not on PATH** on the dev machine; it lives under nvm. Every command below assumes `export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"` has been run in the shell first. Do not conclude Node is missing.
- **All commands run from `atlas/`** unless stated otherwise.
- **TypeScript strict mode.** No `any`. Nullable fields are `| null`, not optional-and-undefined, wherever the YAML will carry an explicit null.
- **The repo's docs are mkdocs-material**, not Docusaurus, regardless of what `AGENTS.md` says. Do not edit `docs/mkdocs.yml` in this plan.
- **Never edit `atlas/data/derived/**` by hand.** It is generated and is regenerated on every build.
- **Never edit files under `litterature_review/` or `docs/docs/` in this plan.** They are the source corpus; SP0 reads them and must not reshape them to suit a parser.
- Controlled vocabulary for data regime is exactly: `any`, `zero`, `<1k`, `1k-10k`, `10k+`.
- Commit after every task. Conventional commit prefixes (`feat:`, `test:`, `chore:`).

---

### Task 1: Toolchain and package skeleton

Establishes the Node package so every later task has a test runner. Delivers nothing user-visible; delivers a green `pnpm test`.

**Files:**
- Create: `atlas/.nvmrc`, `atlas/package.json`, `atlas/tsconfig.json`, `atlas/vitest.config.ts`, `atlas/.gitignore`, `atlas/README.md`
- Create: `atlas/src/schema/vocab.ts`
- Test: `atlas/tests/vocab.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `pnpm test`, `pnpm typecheck`. Exports from `src/schema/vocab.ts`: `TIERS`, `DATA_REGIMES`, `APPLICATIONS`, `GOVERNANCE_POSTURES`, `INITIATIVE_KINDS`, `REGIONS`, `TYPOLOGIES`, `ENDANGERMENT`, `RECORD_STATUS` — each a `readonly string[]` via `as const`, plus a matching exported type per constant (`Tier`, `DataRegime`, `Application`, `GovernancePosture`, `InitiativeKind`, `Region`, `Typology`, `Endangerment`, `RecordStatus`).

- [ ] **Step 1: Create the package files**

`atlas/.nvmrc`:
```
22.22.2
```

`atlas/package.json`:
```json
{
  "name": "@indigenous-ai/atlas",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "extract:methods": "tsx scripts/extract-methods.ts",
    "extract:papers": "tsx scripts/extract-papers.ts",
    "fetch:areas": "tsx scripts/fetch-areas.ts",
    "validate": "tsx scripts/validate.ts",
    "bundle": "tsx scripts/bundle.ts",
    "seed": "tsx scripts/seed.ts",
    "build:data": "pnpm extract:methods && pnpm extract:papers && pnpm validate && pnpm bundle"
  },
  "pnpm": {
    "onlyBuiltDependencies": ["esbuild"]
  },
  "devDependencies": {
    "@turf/simplify": "^7.1.0",
    "@types/js-yaml": "^4.0.9",
    "@types/node": "^22.10.0",
    "js-yaml": "^4.1.0",
    "tsx": "^4.19.0",
    "typescript": "^5.7.0",
    "vitest": "^2.1.0",
    "zod": "^3.24.0"
  }
}
```

`atlas/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "noEmit": true,
    "types": ["node"]
  },
  "include": ["src", "scripts", "tests"]
}
```

`atlas/vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
})
```

`atlas/.gitignore`:
```
node_modules/
dist/
```

`atlas/README.md`:
```markdown
# Atlas — data layer

Data pipeline for the Indigenous language NLP atlas.
Design: `../docs/superpowers/specs/2026-09-03-indigenous-nlp-atlas-design.md`

## Node is not on PATH

Node lives under nvm on this machine. Before any command:

    export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"

`node: command not found` means this step was skipped — Node is installed.

## Commands

    pnpm install
    pnpm test          # unit tests
    pnpm typecheck     # tsc --noEmit
    pnpm build:data    # extract -> validate -> bundle

`pnpm build:data` exits non-zero if any hand-curated record is still `status: draft`.
That is intended: it is what stops an unreviewed record reaching a published figure.

## What is hand-edited and what is not

- `data/languages/*.yml`, `data/initiatives/*.yml` — hand-curated, reviewable diffs.
- `data/derived/**`, `data/language-areas.geojson` — GENERATED. Never hand-edit.
```

- [ ] **Step 2: Install and confirm the toolchain runs**

```bash
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"
cd atlas && pnpm install
```
Expected: installs cleanly, `node -v` prints `v22.22.2`.

`pnpm.onlyBuiltDependencies` is not optional. pnpm 11 runs a dependency-status
check before every script, which re-runs `install` and exits with
`ERR_PNPM_IGNORED_BUILDS` if any package has an unapproved build script. Without
that field, `pnpm test` fails on this and every other task. esbuild is vitest's
bundler; nothing else is approved.

- [ ] **Step 3: Write the failing vocabulary test**

`atlas/tests/vocab.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { DATA_REGIMES, TIERS, RECORD_STATUS } from '../src/schema/vocab.js'

describe('vocabularies', () => {
  it('orders the data regime ladder from unconstrained to largest', () => {
    expect(DATA_REGIMES).toEqual(['any', 'zero', '<1k', '1k-10k', '10k+'])
  })

  it('has exactly two tiers', () => {
    expect(TIERS).toEqual(['indigenous', 'adjacent'])
  })

  it('can represent a reviewed-and-excluded record', () => {
    expect(RECORD_STATUS).toContain('rejected')
  })
})
```

- [ ] **Step 4: Run it and verify it fails**

Run: `pnpm vitest run tests/vocab.test.ts`
Expected: FAIL — cannot resolve `../src/schema/vocab.js`.

- [ ] **Step 5: Write the vocabularies**

`atlas/src/schema/vocab.ts`:
```ts
export const TIERS = ['indigenous', 'adjacent'] as const
export type Tier = (typeof TIERS)[number]

/** Ordered from unconstrained to largest. `any` is not a size — it means the
 *  technique applies regardless of data volume (13 of the 25 technique-doc
 *  Data Regime values read this way). */
export const DATA_REGIMES = ['any', 'zero', '<1k', '1k-10k', '10k+'] as const
export type DataRegime = (typeof DATA_REGIMES)[number]

export const APPLICATIONS = [
  'asr', 'tts', 'mt', 'dictionary', 'spellcheck', 'keyboard', 'chatbot',
  'education', 'ocr', 'igt', 'corpus', 'tokenizer', 'evaluation',
] as const
export type Application = (typeof APPLICATIONS)[number]

export const GOVERNANCE_POSTURES = [
  'community-controlled', 'restricted', 'open', 'unstated',
] as const
export type GovernancePosture = (typeof GOVERNANCE_POSTURES)[number]

export const INITIATIVE_KINDS = [
  'organisation', 'project', 'shared-task', 'workshop', 'tool',
] as const
export type InitiativeKind = (typeof INITIATIVE_KINDS)[number]

export const REGIONS = [
  'north-america', 'central-america', 'south-america',
  'oceania', 'africa', 'eurasia', 'arctic',
] as const
export type Region = (typeof REGIONS)[number]

export const TYPOLOGIES = [
  'polysynthetic', 'agglutinative', 'fusional', 'isolating', 'synthetic',
] as const
export type Typology = (typeof TYPOLOGIES)[number]

/** UNESCO 2010 Atlas scale. */
export const ENDANGERMENT = [
  'safe', 'vulnerable', 'definitely-endangered',
  'severely-endangered', 'critically-endangered', 'extinct',
] as const
export type Endangerment = (typeof ENDANGERMENT)[number]

/** `draft` blocks the build. `rejected` is retained so seeding does not
 *  re-propose a record a human already excluded. */
export const RECORD_STATUS = ['draft', 'verified', 'rejected'] as const
export type RecordStatus = (typeof RECORD_STATUS)[number]
```

- [ ] **Step 6: Run tests and typecheck**

Run: `pnpm test && pnpm typecheck`
Expected: 3 tests PASS, typecheck clean.

- [ ] **Step 7: Commit**

```bash
cd .. && git add atlas && git commit -m "feat(atlas): package skeleton and controlled vocabularies"
```

---

### Task 2: Source value type

`Source` is embedded in nearly every field of every record. It gets its own task because its one non-obvious rule — a URL claim must say when it was retrieved — is what makes the provenance story hold up a year from now.

**Files:**
- Create: `atlas/src/schema/source.ts`
- Test: `atlas/tests/source.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `SourceSchema` (a `z.ZodType`), and `type Source = z.infer<typeof SourceSchema>` with fields `{ kind: 'url' | 'paper' | 'doc'; ref: string; retrieved: string | null; quote: string | null }`.

- [ ] **Step 1: Write the failing test**

`atlas/tests/source.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { SourceSchema } from '../src/schema/source.js'

describe('SourceSchema', () => {
  it('accepts a url source with a retrieval date', () => {
    const r = SourceSchema.safeParse({
      kind: 'url', ref: 'https://tehiku.nz/about', retrieved: '2026-09-03',
    })
    expect(r.success).toBe(true)
  })

  it('rejects a url source with no retrieval date', () => {
    const r = SourceSchema.safeParse({ kind: 'url', ref: 'https://tehiku.nz/about' })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error.issues[0]?.message).toMatch(/retrieved/i)
    }
  })

  it('does not require a retrieval date for a paper source', () => {
    const r = SourceSchema.safeParse({ kind: 'paper', ref: 'gibert-et-al-2025-americas-nlp' })
    expect(r.success).toBe(true)
  })

  it('rejects a malformed retrieval date', () => {
    const r = SourceSchema.safeParse({ kind: 'url', ref: 'https://x.test', retrieved: '03-09-2026' })
    expect(r.success).toBe(false)
  })

  it('rejects an empty ref', () => {
    expect(SourceSchema.safeParse({ kind: 'doc', ref: '' }).success).toBe(false)
  })
})
```

- [ ] **Step 2: Run it and verify it fails**

Run: `pnpm vitest run tests/source.test.ts`
Expected: FAIL — cannot resolve `../src/schema/source.js`.

- [ ] **Step 3: Write the schema**

`atlas/src/schema/source.ts`:
```ts
import { z } from 'zod'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/** Where a claim came from. Embedded wherever the data asserts something.
 *  A `url` source must record when it was read: web pages change, and a
 *  citation to a page with no retrieval date is not a citation. */
export const SourceSchema = z
  .object({
    kind: z.enum(['url', 'paper', 'doc']),
    ref: z.string().min(1, 'ref must not be empty'),
    retrieved: z.string().regex(ISO_DATE, 'retrieved must be YYYY-MM-DD').nullable().default(null),
    quote: z.string().nullable().default(null),
  })
  .superRefine((v, ctx) => {
    if (v.kind === 'url' && v.retrieved === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['retrieved'],
        message: 'a url source must record `retrieved` (YYYY-MM-DD)',
      })
    }
  })

export type Source = z.infer<typeof SourceSchema>
```

- [ ] **Step 4: Run tests**

Run: `pnpm vitest run tests/source.test.ts`
Expected: 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd .. && git add atlas && git commit -m "feat(atlas): Source value type with retrieval-date rule for urls"
```

---

### Task 3: Data regime mapping table

The technique docs express data regime as free prose — 25 distinct values across 38 docs. This task turns that into the controlled ladder via a **committed lookup table**, not heuristics, so that a reviewer can audit every mapping and any future edit to a technique doc fails the build loudly rather than being silently re-bucketed.

**Files:**
- Create: `atlas/data/data-regime-map.yml`
- Create: `atlas/scripts/lib/md.ts`
- Create: `atlas/scripts/lib/data-regime.ts`
- Test: `atlas/tests/data-regime.test.ts`

**Interfaces:**
- Consumes: `DATA_REGIMES`, `DataRegime` from `src/schema/vocab.ts`.
- Produces:
  - from `scripts/lib/md.ts`: `decodeEntities(s: string): string`, `normaliseValue(s: string): string`
  - from `scripts/lib/data-regime.ts`: `resolveDataRegime(prose: string | null): DataRegime[]` (throws `UnmappedDataRegimeError` on an unknown value; returns `['any']` for `null`), and `class UnmappedDataRegimeError extends Error` with a public `value: string`.

- [ ] **Step 1: Write the mapping table**

`atlas/data/data-regime-map.yml` — keys are normalised prose (entities decoded, whitespace collapsed, lowercased); values are ladder buckets. Every one of the 25 values found in the corpus on 2026-09-03:

```yaml
# Generated once by audit, maintained by hand. Keys are NORMALISED prose
# (see scripts/lib/md.ts: normaliseValue). An unknown key fails the build.
"any": [any]
"any (a sequencing framework; applies before any technical work begins)": [any]
"any (applies before any technical decision is made)": [any]
"any (applies regardless of data availability; structures the human relationship at the center of language work)": [any]
"any (applies to any data collection effort; most valuable when human annotator time is the binding constraint)": [any]
"any (especially relevant when comparing data budgets across languages)": [any]
"any (evaluation methodology, not a training technique)": [any]
"any (guides investment decisions across all regimes)": [any]
"any (rule-based; no training data required — requires linguistic expertise and fst grammar)": [any]
"any (word-list based; works with as few as a few hundred words; no parallel data required)": [any]
"any — applies at deployment regardless of training data regime": [any]
"any — applies before and during deployment regardless of data availability": [any]
"any — the metric is computed on a text sample of the target language; even small samples (hundreds of sentences) are sufficient for ranking": [any]
"zero-resource (no parallel corpus required)": [zero]
"zero-resource (no reference translations available)": [zero]
"zero-resource (no training data in the target language required); requires only a text transcript and an audio recording": [zero]
"zero-resource / <1k sentences": [zero, "<1k"]
"zero-resource / <1k sentences (requires only a bilingual or multilingual dictionary; no parallel corpus)": [zero, "<1k"]
"zero-resource / <1k sentences — no parallel corpus required; requires only monolingual text in the target language and a dictionary or word-level translation resource": [zero, "<1k"]
"zero-resource to <1k parallel sentences (requires a dictionary and monolingual corpus; no parallel corpus needed to start)": [zero, "<1k"]
"<1k labeled examples (minimal-resource: fewer than 1,000 annotated word-segmentation pairs)": ["<1k"]
"<1k sentences / 1k–10k sentences": ["<1k", "1k-10k"]
"<1k sentences / 1k–10k sentences (elr: fewer than a few thousand parallel sentences)": ["<1k", "1k-10k"]
"<1k sentences / 1k–10k sentences (requires at least minimal translation quality as a seed)": ["<1k", "1k-10k"]
"<1k–10k sentences (fine-tuning); as few as ~245 sentences minimum observed": ["<1k", "1k-10k"]
```

- [ ] **Step 2: Write the failing test**

`atlas/tests/data-regime.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { decodeEntities, normaliseValue } from '../scripts/lib/md.js'
import { resolveDataRegime, UnmappedDataRegimeError } from '../scripts/lib/data-regime.js'

describe('normalisation', () => {
  it('decodes the HTML entities left by the Docusaurus scaffold', () => {
    expect(decodeEntities('&lt;1K sentences &amp; more')).toBe('<1K sentences & more')
  })

  it('lowercases, decodes and collapses whitespace', () => {
    expect(normaliseValue('  &lt;1K   sentences / 1K–10K sentences ')).toBe('<1k sentences / 1k–10k sentences')
  })
})

describe('resolveDataRegime', () => {
  it('maps a single-bucket value', () => {
    expect(resolveDataRegime('Zero-resource (no parallel corpus required)')).toEqual(['zero'])
  })

  it('maps a value that spans two buckets, in ladder order', () => {
    expect(resolveDataRegime('&lt;1K sentences / 1K–10K sentences')).toEqual(['<1k', '1k-10k'])
  })

  it('maps a process technique to `any` rather than coercing it to zero', () => {
    expect(resolveDataRegime('any (evaluation methodology, not a training technique)')).toEqual(['any'])
  })

  it('resolves a missing Data Regime line to `any`', () => {
    expect(resolveDataRegime(null)).toEqual(['any'])
  })

  it('throws on prose it does not know, naming the offending value', () => {
    expect(() => resolveDataRegime('10M sentences, obviously')).toThrow(UnmappedDataRegimeError)
    try {
      resolveDataRegime('10M sentences, obviously')
    } catch (e) {
      expect((e as UnmappedDataRegimeError).value).toBe('10m sentences, obviously')
    }
  })
})
```

- [ ] **Step 3: Run it and verify it fails**

Run: `pnpm vitest run tests/data-regime.test.ts`
Expected: FAIL — cannot resolve `../scripts/lib/md.js`.

- [ ] **Step 4: Write the markdown helpers**

`atlas/scripts/lib/md.ts`:
```ts
const ENTITIES: Record<string, string> = {
  '&lt;': '<', '&gt;': '>', '&amp;': '&', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ',
}

/** The technique docs still carry HTML entities escaped for Docusaurus MDX
 *  (e.g. `&lt;1K sentences`). mkdocs does not need them; the parser must not
 *  be fooled by them. */
export function decodeEntities(s: string): string {
  return s.replace(/&(?:lt|gt|amp|quot|#39|nbsp);/g, (m) => ENTITIES[m] ?? m)
}

/** Lookup key for the data-regime table: entities decoded, unicode normalised,
 *  whitespace collapsed, trimmed, lowercased. Dashes are NOT normalised —
 *  en-dash and em-dash are meaningful in the source and kept verbatim. */
export function normaliseValue(s: string): string {
  return decodeEntities(s).normalize('NFC').replace(/\s+/g, ' ').trim().toLowerCase()
}
```

- [ ] **Step 5: Write the resolver**

`atlas/scripts/lib/data-regime.ts`:
```ts
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import yaml from 'js-yaml'
import { DATA_REGIMES, type DataRegime } from '../../src/schema/vocab.js'
import { normaliseValue } from './md.js'

export class UnmappedDataRegimeError extends Error {
  constructor(public readonly value: string) {
    super(
      `Unmapped Data Regime: ${JSON.stringify(value)}\n` +
        `Add it to atlas/data/data-regime-map.yml with the ladder buckets it means.\n` +
        `Buckets: ${DATA_REGIMES.join(', ')}`,
    )
    this.name = 'UnmappedDataRegimeError'
  }
}

const MAP_PATH = fileURLToPath(new URL('../../data/data-regime-map.yml', import.meta.url))

function loadMap(): Map<string, DataRegime[]> {
  const raw = yaml.load(readFileSync(MAP_PATH, 'utf8')) as Record<string, string[]>
  const m = new Map<string, DataRegime[]>()
  for (const [k, v] of Object.entries(raw)) {
    for (const bucket of v) {
      if (!DATA_REGIMES.includes(bucket as DataRegime)) {
        throw new Error(`data-regime-map.yml: ${JSON.stringify(k)} maps to unknown bucket ${JSON.stringify(bucket)}`)
      }
    }
    m.set(normaliseValue(k), v as DataRegime[])
  }
  return m
}

const TABLE = loadMap()

/** Prose Data Regime -> ladder buckets, in ladder order.
 *  `null` (the doc has no Data Regime line) resolves to `['any']`; unknown
 *  prose throws, so a technique doc edit surfaces as a build failure rather
 *  than a silent re-bucketing. */
export function resolveDataRegime(prose: string | null): DataRegime[] {
  if (prose === null) return ['any']
  const key = normaliseValue(prose)
  const hit = TABLE.get(key)
  if (!hit) throw new UnmappedDataRegimeError(key)
  return [...hit].sort((a, b) => DATA_REGIMES.indexOf(a) - DATA_REGIMES.indexOf(b))
}
```

- [ ] **Step 6: Run tests**

Run: `pnpm vitest run tests/data-regime.test.ts`
Expected: 7 tests PASS.

- [ ] **Step 7: Commit**

```bash
cd .. && git add atlas && git commit -m "feat(atlas): committed data-regime mapping table and resolver"
```

---

### Task 4: Language and Initiative schemas

The two hand-curated types. Three rules here are not decoration — they enforce spec decisions D2 and D5 at the type level, so a curator cannot skip them by accident.

**Files:**
- Create: `atlas/src/schema/language.ts`, `atlas/src/schema/initiative.ts`, `atlas/src/schema/index.ts`
- Test: `atlas/tests/schema.test.ts`

**Interfaces:**
- Consumes: `SourceSchema` from `src/schema/source.ts`; vocabularies from `src/schema/vocab.ts`.
- Produces: `LanguageSchema`, `InitiativeSchema`, `type Language`, `type Initiative`; `src/schema/index.ts` re-exports everything from `vocab`, `source`, `language`, `initiative`.

- [ ] **Step 1: Write the failing test**

`atlas/tests/schema.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { InitiativeSchema, LanguageSchema } from '../src/schema/index.js'

const src = { kind: 'url', ref: 'https://example.test', retrieved: '2026-09-03' }

const language = {
  id: 'kanienkeha',
  name: "Kanien'kéha",
  tier: 'indigenous',
  family: 'Iroquoian',
  typology: ['polysynthetic'],
  region: 'north-america',
  countries: ['CA', 'US'],
  endangerment: { status: 'definitely-endangered', scale: 'unesco-2010', source: src },
  area: { source: 'native-land-digital', nld_id: 'x1', present: true },
  status: 'verified',
}

const initiative = {
  id: 'te-hiku-media',
  name: 'Te Hiku Media',
  kind: 'organisation',
  tier: 'indigenous',
  languages: ['te-reo-maori'],
  started: 2016,
  ended: null,
  site: { lat: -35.11, lon: 173.26, place: 'Kaitaia', source: src },
  applications: ['asr', 'tts'],
  methods: [],
  data_regime: '1k-10k',
  governance: { posture: 'community-controlled', licence: 'Kaitiakitanga', source: src },
  status: 'verified',
}

describe('LanguageSchema', () => {
  it('accepts a well-formed indigenous language', () => {
    expect(LanguageSchema.safeParse(language).success).toBe(true)
  })

  it('keeps a speaker-count conflict instead of resolving it', () => {
    const r = LanguageSchema.safeParse({
      ...language,
      speakers: { value: 9600, as_of: 2015, source: src, conflicts: [{ value: 1000, source: src }] },
    })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.speakers?.conflicts).toHaveLength(1)
  })

  it('rejects an adjacent-tier language carrying an area (spec D5)', () => {
    const r = LanguageSchema.safeParse({ ...language, id: 'manchu', tier: 'adjacent' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.issues[0]?.message).toMatch(/adjacent/i)
  })

  it('accepts an adjacent-tier language with no area', () => {
    const { area: _area, ...rest } = language
    const r = LanguageSchema.safeParse({ ...rest, id: 'manchu', tier: 'adjacent' })
    expect(r.success).toBe(true)
  })
})

describe('InitiativeSchema', () => {
  it('accepts a well-formed indigenous initiative', () => {
    expect(InitiativeSchema.safeParse(initiative).success).toBe(true)
  })

  it('rejects an adjacent initiative with no transferability note (spec D2)', () => {
    const r = InitiativeSchema.safeParse({ ...initiative, id: 'masakhane', tier: 'adjacent' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.issues[0]?.message).toMatch(/transferability/i)
  })

  it('accepts an adjacent initiative that answers the transferability question', () => {
    const r = InitiativeSchema.safeParse({
      ...initiative,
      id: 'masakhane',
      tier: 'adjacent',
      transferability: {
        transfers: ['participatory corpus building'],
        does_not_transfer: ['open web-scale scraping'],
        note: 'Open release conflicts with OCAP.',
      },
    })
    expect(r.success).toBe(true)
  })

  it('rejects a transferability note on an indigenous-tier initiative', () => {
    const r = InitiativeSchema.safeParse({
      ...initiative,
      transferability: { transfers: [], does_not_transfer: [], note: 'n/a' },
    })
    expect(r.success).toBe(false)
  })

  it('rejects an end year before the start year', () => {
    expect(InitiativeSchema.safeParse({ ...initiative, started: 2020, ended: 2016 }).success).toBe(false)
  })
})
```

- [ ] **Step 2: Run it and verify it fails**

Run: `pnpm vitest run tests/schema.test.ts`
Expected: FAIL — cannot resolve `../src/schema/index.js`.

- [ ] **Step 3: Write the Language schema**

`atlas/src/schema/language.ts`:
```ts
import { z } from 'zod'
import { SourceSchema } from './source.js'
import { ENDANGERMENT, RECORD_STATUS, REGIONS, TIERS, TYPOLOGIES } from './vocab.js'

const SpeakerCountSchema = z.object({
  value: z.number().int().nonnegative(),
  as_of: z.number().int().min(1900).max(2100).nullable().default(null),
  source: SourceSchema,
  /** Disagreeing figures are KEPT, not resolved. Draft.md already records
   *  Choctaw at both 9,600 and 1,000; the page shows that as disagreement. */
  conflicts: z
    .array(z.object({ value: z.number().int().nonnegative(), source: SourceSchema }))
    .default([]),
})

const AreaSchema = z.object({
  source: z.literal('native-land-digital'),
  nld_id: z.string().min(1),
  present: z.boolean(),
})

export const LanguageSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/, 'id must be lowercase kebab-case'),
    name: z.string().min(1),
    also_known_as: z.array(z.string()).default([]),
    glottocode: z.string().regex(/^[a-z0-9]{4}\d{4}$/).nullable().default(null),
    iso639_3: z.string().length(3).nullable().default(null),
    tier: z.enum(TIERS),
    family: z.string().min(1),
    subfamily: z.string().nullable().default(null),
    typology: z.array(z.enum(TYPOLOGIES)).default([]),
    endangerment: z
      .object({
        status: z.enum(ENDANGERMENT),
        scale: z.literal('unesco-2010'),
        source: SourceSchema,
      })
      .nullable()
      .default(null),
    speakers: SpeakerCountSchema.nullable().default(null),
    region: z.enum(REGIONS),
    countries: z.array(z.string().length(2)).default([]),
    area: AreaSchema.nullable().default(null),
    status: z.enum(RECORD_STATUS),
  })
  .superRefine((v, ctx) => {
    // Spec D5: fields are an indigenous-tier feature. An adjacent language
    // must not be able to acquire a shaded region by accident.
    if (v.tier === 'adjacent' && v.area !== null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['area'],
        message: 'an adjacent-tier language must not carry an area (spec D5): the adjacent tier is pins only',
      })
    }
  })

export type Language = z.infer<typeof LanguageSchema>
```

- [ ] **Step 4: Write the Initiative schema**

`atlas/src/schema/initiative.ts`:
```ts
import { z } from 'zod'
import { SourceSchema } from './source.js'
import {
  APPLICATIONS, DATA_REGIMES, GOVERNANCE_POSTURES, INITIATIVE_KINDS, RECORD_STATUS, TIERS,
} from './vocab.js'

const SiteSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  place: z.string().min(1),
  /** Self-stated: taken from the initiative's own public materials.
   *  We site the people doing the work, never the language. */
  source: SourceSchema,
})

const TransferabilitySchema = z.object({
  transfers: z.array(z.string()).default([]),
  does_not_transfer: z.array(z.string()).default([]),
  note: z.string().min(1),
})

export const InitiativeSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/, 'id must be lowercase kebab-case'),
    name: z.string().min(1),
    kind: z.enum(INITIATIVE_KINDS),
    tier: z.enum(TIERS),
    languages: z.array(z.string()).min(1, 'an initiative must name at least one language'),
    started: z.number().int().min(1900).max(2100),
    ended: z.number().int().min(1900).max(2100).nullable().default(null),
    site: SiteSchema,
    applications: z.array(z.enum(APPLICATIONS)).default([]),
    methods: z.array(z.string()).default([]),
    models: z.array(z.string()).default([]),
    data_regime: z.enum(DATA_REGIMES).nullable().default(null),
    governance: z
      .object({
        posture: z.enum(GOVERNANCE_POSTURES),
        licence: z.string().nullable().default(null),
        source: SourceSchema,
      })
      .nullable()
      .default(null),
    papers: z.array(z.string()).default([]),
    links: z
      .array(z.object({ label: z.string().min(1), url: z.string().url(), retrieved: z.string() }))
      .default([]),
    transferability: TransferabilitySchema.nullable().default(null),
    status: z.enum(RECORD_STATUS),
  })
  .superRefine((v, ctx) => {
    // Spec D2: the adjacent tier exists to answer "does this transfer?".
    // The schema refuses to let that question go unanswered.
    if (v.tier === 'adjacent' && v.transferability === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['transferability'],
        message: 'an adjacent-tier initiative must carry a transferability note (spec D2)',
      })
    }
    if (v.tier === 'indigenous' && v.transferability !== null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['transferability'],
        message: 'transferability applies only to the adjacent tier',
      })
    }
    if (v.ended !== null && v.ended < v.started) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['ended'],
        message: `ended (${v.ended}) is before started (${v.started})`,
      })
    }
  })

export type Initiative = z.infer<typeof InitiativeSchema>
```

`atlas/src/schema/index.ts`:
```ts
export * from './vocab.js'
export * from './source.js'
export * from './language.js'
export * from './initiative.js'
export * from './method.js'
export * from './paper.js'
```

`method.ts` and `paper.ts` do not exist yet (Tasks 5 and 6). Add those two lines when you reach Task 6;
until then `index.ts` carries only the first four.

- [ ] **Step 5: Run tests and typecheck**

Run: `pnpm test && pnpm typecheck`
Expected: all PASS (3 + 5 + 7 + 10 = 25 tests), typecheck clean.

- [ ] **Step 6: Commit**

```bash
cd .. && git add atlas && git commit -m "feat(atlas): Language and Initiative schemas enforcing spec D2 and D5"
```

---

### Task 5: Method extractor

Parses the 39 technique docs in `docs/docs/{ml,process}-techniques/` into `data/derived/methods.json`. These become the controlled vocabulary that `Initiative.methods` must resolve against, and the link targets that make the map an index into the guide.

**Files:**
- Create: `atlas/src/schema/method.ts`
- Create: `atlas/scripts/extract-methods.ts`
- Create: `atlas/tests/fixtures/techniques/ml-techniques/sample-technique.md`
- Create: `atlas/tests/fixtures/techniques/process-techniques/sample-process.md`
- Create: `atlas/tests/fixtures/techniques/ml-techniques/index.md`
- Test: `atlas/tests/extract-methods.test.ts`

**Interfaces:**
- Consumes: `resolveDataRegime` from `scripts/lib/data-regime.ts`; `decodeEntities` from `scripts/lib/md.ts`.
- Produces: `MethodSchema` and `type Method` from `src/schema/method.ts` with fields `{ id, name, category: 'ml' | 'process', data_regime: DataRegime[], data_regime_note: string | null, applicable_languages: string | null, doc_url: string }`; and from `scripts/extract-methods.ts` an exported `extractMethods(techniquesRoot: string): Method[]` plus a CLI entry point writing `data/derived/methods.json`.

- [ ] **Step 1: Create fixtures mirroring the real docs exactly**

Real docs begin with a blank line, then the H1, then a blank line, then the keyed header lines. Entities are present. Reproduce that faithfully.

`atlas/tests/fixtures/techniques/ml-techniques/sample-technique.md`:
```markdown

# FST Morphological Segmentation for Polysynthetic MT

**Category:** ML Technique
**Data Regime:** &lt;1K sentences / 1K–10K sentences
**Applicable Languages:** polysynthetic; especially Algonquian, Iroquoian, and other languages with extreme OOV rates

## Description

Body text that the parser must ignore.
```

`atlas/tests/fixtures/techniques/process-techniques/sample-process.md`:
```markdown

# Community Data Sovereignty

**Category:** Process & Methodology Technique
**Applicable Languages:** Any Indigenous language project where language data is collected

## Description

This fixture deliberately has NO Data Regime line, mirroring
task-appropriate-data-selection.md. It must resolve to ["any"], not fail.
```

`atlas/tests/fixtures/techniques/ml-techniques/index.md`:
```markdown

# ML Techniques

An index page. It has no Category line and must be skipped, not treated as
a technique with missing metadata.
```

- [ ] **Step 2: Write the failing test**

`atlas/tests/extract-methods.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { fileURLToPath } from 'node:url'
import { extractMethods } from '../scripts/extract-methods.js'

const ROOT = fileURLToPath(new URL('./fixtures/techniques', import.meta.url))

describe('extractMethods', () => {
  const methods = extractMethods(ROOT)

  it('skips index.md rather than treating it as a technique', () => {
    expect(methods.map((m) => m.id)).not.toContain('index')
    expect(methods).toHaveLength(2)
  })

  it('derives the id from the filename', () => {
    expect(methods.map((m) => m.id).sort()).toEqual(['sample-process', 'sample-technique'])
  })

  it('takes the name from the H1, not the filename', () => {
    const m = methods.find((x) => x.id === 'sample-technique')
    expect(m?.name).toBe('FST Morphological Segmentation for Polysynthetic MT')
  })

  it('normalises the two category values to ml and process', () => {
    expect(methods.find((x) => x.id === 'sample-technique')?.category).toBe('ml')
    expect(methods.find((x) => x.id === 'sample-process')?.category).toBe('process')
  })

  it('resolves an entity-escaped, two-bucket data regime', () => {
    expect(methods.find((x) => x.id === 'sample-technique')?.data_regime).toEqual(['<1k', '1k-10k'])
  })

  it('retains the original prose alongside the buckets', () => {
    expect(methods.find((x) => x.id === 'sample-technique')?.data_regime_note)
      .toBe('<1K sentences / 1K–10K sentences')
  })

  it('resolves a doc with no Data Regime line to any', () => {
    const m = methods.find((x) => x.id === 'sample-process')
    expect(m?.data_regime).toEqual(['any'])
    expect(m?.data_regime_note).toBeNull()
  })

  it('builds a doc_url pointing into the mkdocs guide', () => {
    expect(methods.find((x) => x.id === 'sample-technique')?.doc_url)
      .toBe('/ml-techniques/sample-technique/')
  })
})
```

- [ ] **Step 3: Run it and verify it fails**

Run: `pnpm vitest run tests/extract-methods.test.ts`
Expected: FAIL — cannot resolve `../scripts/extract-methods.js`.

- [ ] **Step 4: Write the Method schema**

`atlas/src/schema/method.ts`:
```ts
import { z } from 'zod'
import { DATA_REGIMES } from './vocab.js'

export const MethodSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.enum(['ml', 'process']),
  /** A set, not one value: several technique docs span a range. */
  data_regime: z.array(z.enum(DATA_REGIMES)).min(1),
  /** The original prose, kept so the bucketing stays auditable. */
  data_regime_note: z.string().nullable(),
  applicable_languages: z.string().nullable(),
  /** Link into the mkdocs guide — this is what makes the map an index. */
  doc_url: z.string().min(1),
})

export type Method = z.infer<typeof MethodSchema>
```

- [ ] **Step 5: Write the extractor**

`atlas/scripts/extract-methods.ts`:
```ts
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { MethodSchema, type Method } from '../src/schema/method.js'
import { resolveDataRegime } from './lib/data-regime.js'
import { decodeEntities } from './lib/md.js'

const SUBDIRS = [
  { dir: 'ml-techniques', category: 'ml' as const },
  { dir: 'process-techniques', category: 'process' as const },
]

/** `**Key:** value` on its own line, before the first `##` heading. */
function readHeaderField(body: string, key: string): string | null {
  const head = body.split(/^## /m)[0] ?? body
  const m = head.match(new RegExp(`^\\*\\*${key}:\\*\\*\\s*(.+)$`, 'm'))
  return m?.[1] ? decodeEntities(m[1].trim()) : null
}

function readTitle(body: string): string | null {
  const m = body.match(/^#\s+(.+)$/m)
  return m?.[1] ? decodeEntities(m[1].trim()) : null
}

export function extractMethods(techniquesRoot: string): Method[] {
  const out: Method[] = []
  for (const { dir, category } of SUBDIRS) {
    let files: string[]
    try {
      files = readdirSync(join(techniquesRoot, dir)).filter((f) => f.endsWith('.md'))
    } catch {
      continue
    }
    for (const file of files.sort()) {
      if (file === 'index.md') continue
      const path = join(techniquesRoot, dir, file)
      const body = readFileSync(path, 'utf8')

      // An index or stub page has no Category line. Skip rather than fail:
      // only docs that declare themselves techniques are techniques.
      if (readHeaderField(body, 'Category') === null) continue

      const id = basename(file, '.md')
      const name = readTitle(body)
      if (name === null) throw new Error(`${path}: no H1 title`)

      const note = readHeaderField(body, 'Data Regime')
      out.push(
        MethodSchema.parse({
          id,
          name,
          category,
          data_regime: resolveDataRegime(note),
          data_regime_note: note,
          applicable_languages: readHeaderField(body, 'Applicable Languages'),
          doc_url: `/${dir}/${id}/`,
        }),
      )
    }
  }
  return out
}

const OUT = fileURLToPath(new URL('../data/derived/methods.json', import.meta.url))
const REAL_ROOT = fileURLToPath(new URL('../../docs/docs', import.meta.url))

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const methods = extractMethods(REAL_ROOT)
  mkdirSync(new URL('../data/derived/', import.meta.url), { recursive: true })
  writeFileSync(OUT, `${JSON.stringify(methods, null, 2)}\n`)
  console.log(`extract-methods: ${methods.length} methods -> data/derived/methods.json`)
}
```

- [ ] **Step 6: Run the fixture tests**

Run: `pnpm vitest run tests/extract-methods.test.ts`
Expected: 8 tests PASS.

- [ ] **Step 7: Run against the real corpus**

Run: `pnpm extract:methods`
Expected: `extract-methods: 39 methods -> data/derived/methods.json`.

If it instead throws `UnmappedDataRegimeError`, a technique doc has been edited since the 2026-09-03 audit. That is the mechanism working — read the named value, add it to `data/data-regime-map.yml` with the buckets it means, and re-run. Do not widen the resolver to guess.

- [ ] **Step 8: Commit**

```bash
cd .. && git add atlas && git commit -m "feat(atlas): extract Method vocabulary from the 39 technique docs"
```

---

### Task 6: Paper extractor

Derives `Paper` records from `litterature_review/`. **`OVERVIEW.md`'s index table is authoritative** — it carries all 92 rows with title, authors, year and themes. Summary files supply only `venue`, and are secondary because 5 of the 92 use a different header format.

**Files:**
- Create: `atlas/src/schema/paper.ts`
- Create: `atlas/scripts/extract-papers.ts`
- Create: `atlas/tests/fixtures/review/OVERVIEW.md`
- Create: `atlas/tests/fixtures/review/summaries/alpha-et-al-2025-thing.md`
- Create: `atlas/tests/fixtures/review/summaries/beta-et-al-2025-other.md`
- Test: `atlas/tests/extract-papers.test.ts`

**Interfaces:**
- Consumes: `decodeEntities` from `scripts/lib/md.ts`.
- Produces: `PaperSchema`, `type Paper` with fields `{ id, title, authors, year, venue: string | null, themes: string[], summary_url }`; and `extractPapers(reviewRoot: string): Paper[]` from `scripts/extract-papers.ts`.

- [ ] **Step 1: Create fixtures matching both real header formats**

`atlas/tests/fixtures/review/OVERVIEW.md`:
```markdown
# Literature Review — Synthesis

> Last updated: 2026-05-28. 2 papers reviewed.

## Paper Index

| # | Title | Authors | Year | Themes |
| --- | --- | --- | --- | --- |
| 1 | [A Thing About Language](summaries/alpha-et-al-2025-thing.md) | Alpha et al. | 2025 | evaluation, low-resource-nlp |
| 2 | [Another Paper Entirely](summaries/beta-et-al-2025-other.md) | Beta & Gamma | 2025 | methodology |

---

## Thematic Synthesis

Prose the parser must ignore, including | pipe | characters.
```

`atlas/tests/fixtures/review/summaries/alpha-et-al-2025-thing.md` — the majority format (87 of 92):
```markdown
# A Thing About Language

**Authors:** Alpha, A., Beta, B.
**Year:** 2025
**Venue:** Proceedings of ACL 2025

---

## Core Argument
```

`atlas/tests/fixtures/review/summaries/beta-et-al-2025-other.md` — the minority format (5 of 92, e.g. `sadr-et-al-2025-taarof.md`):
```markdown
# Another Paper Entirely

**Citation:** Beta, B., & Gamma, G. (2025). Another Paper Entirely. In *Proceedings of EMNLP 2025*, pages 1–10.

---

## Core Argument
```

- [ ] **Step 2: Write the failing test**

`atlas/tests/extract-papers.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { fileURLToPath } from 'node:url'
import { extractPapers } from '../scripts/extract-papers.js'

const ROOT = fileURLToPath(new URL('./fixtures/review', import.meta.url))

describe('extractPapers', () => {
  const papers = extractPapers(ROOT)

  it('reads every row of the OVERVIEW index table', () => {
    expect(papers).toHaveLength(2)
  })

  it('ignores prose containing pipe characters', () => {
    expect(papers.map((p) => p.title)).not.toContain('pipe')
  })

  it('takes the id from the summary link, not the row number', () => {
    expect(papers.map((p) => p.id)).toEqual(['alpha-et-al-2025-thing', 'beta-et-al-2025-other'])
  })

  it('parses title, authors and year from the table', () => {
    const p = papers[0]
    expect(p?.title).toBe('A Thing About Language')
    expect(p?.authors).toBe('Alpha et al.')
    expect(p?.year).toBe(2025)
  })

  it('splits themes into a list', () => {
    expect(papers[0]?.themes).toEqual(['evaluation', 'low-resource-nlp'])
  })

  it('takes venue from a **Venue:** header when present', () => {
    expect(papers[0]?.venue).toBe('Proceedings of ACL 2025')
  })

  it('leaves venue null for the **Citation:** format rather than guessing', () => {
    expect(papers[1]?.venue).toBeNull()
  })
})
```

- [ ] **Step 3: Run it and verify it fails**

Run: `pnpm vitest run tests/extract-papers.test.ts`
Expected: FAIL — cannot resolve `../scripts/extract-papers.js`.

- [ ] **Step 4: Write the Paper schema**

`atlas/src/schema/paper.ts`:
```ts
import { z } from 'zod'

export const PaperSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  authors: z.string().min(1),
  year: z.number().int().min(1900).max(2100),
  /** Null when the summary uses the APA `**Citation:**` form. We do not
   *  regex a venue out of a citation string — a wrong venue is worse
   *  than an absent one in a cited artifact. */
  venue: z.string().nullable(),
  themes: z.array(z.string()).default([]),
  summary_url: z.string().min(1),
})

export type Paper = z.infer<typeof PaperSchema>
```

- [ ] **Step 5: Write the extractor**

`atlas/scripts/extract-papers.ts`:
```ts
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PaperSchema, type Paper } from '../src/schema/paper.js'
import { decodeEntities } from './lib/md.js'

/** `| 1 | [Title](summaries/slug.md) | Authors | 2025 | a, b |` */
const ROW = /^\|\s*(\d+)\s*\|\s*\[([^\]]+)\]\(summaries\/([^)]+?)\.md\)\s*\|([^|]*)\|([^|]*)\|([^|]*)\|\s*$/

function readVenue(reviewRoot: string, id: string): string | null {
  const path = join(reviewRoot, 'summaries', `${id}.md`)
  if (!existsSync(path)) return null
  const head = readFileSync(path, 'utf8').split(/^---$/m)[0] ?? ''
  const m = head.match(/^\*\*Venue:\*\*\s*(.+)$/m)
  // The 5 `**Citation:**`-form summaries fall through to null deliberately.
  return m?.[1] ? decodeEntities(m[1].trim()) : null
}

export function extractPapers(reviewRoot: string): Paper[] {
  const overview = readFileSync(join(reviewRoot, 'OVERVIEW.md'), 'utf8')
  const out: Paper[] = []
  const seen = new Set<string>()

  for (const line of overview.split('\n')) {
    const m = line.match(ROW)
    if (!m) continue
    const [, , title, id, authors, year, themes] = m
    if (!id || !title || !authors || !year) continue
    if (seen.has(id)) throw new Error(`OVERVIEW.md: duplicate paper id ${id}`)
    seen.add(id)

    out.push(
      PaperSchema.parse({
        id,
        title: decodeEntities(title.trim()),
        authors: authors.trim(),
        year: Number(year.trim()),
        venue: readVenue(reviewRoot, id),
        themes: (themes ?? '').split(',').map((t) => t.trim()).filter(Boolean),
        summary_url: `litterature_review/summaries/${id}.md`,
      }),
    )
  }
  return out
}

const OUT = fileURLToPath(new URL('../data/derived/papers.json', import.meta.url))
const REAL_ROOT = fileURLToPath(new URL('../../litterature_review', import.meta.url))

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const papers = extractPapers(REAL_ROOT)
  mkdirSync(new URL('../data/derived/', import.meta.url), { recursive: true })
  writeFileSync(OUT, `${JSON.stringify(papers, null, 2)}\n`)
  console.log(`extract-papers: ${papers.length} papers -> data/derived/papers.json`)
}
```

- [ ] **Step 6: Run the fixture tests**

Run: `pnpm vitest run tests/extract-papers.test.ts`
Expected: 7 tests PASS.

- [ ] **Step 7: Run against the real corpus and sanity-check the count**

Run: `pnpm extract:papers`
Expected: `extract-papers: 92 papers -> data/derived/papers.json`.

92 is the known row count in `OVERVIEW.md` and the known file count in `summaries/`. Any other number means the table drifted from the directory — investigate before continuing; do not adjust the parser to make the number come out right.

- [ ] **Step 8: Commit**

```bash
cd .. && git add atlas && git commit -m "feat(atlas): extract Paper records from the OVERVIEW index"
```

---

### Task 7: Record loader and the build gate

The gate is the whole defensibility story: it is what stops an unreviewed record becoming a pin in a published figure. Its own test therefore mutates a **real** record rather than a fixture — a gate proven only against a fixture proves nothing about the gate.

**Files:**
- Create: `atlas/scripts/lib/load-records.ts`
- Create: `atlas/scripts/validate.ts`
- Create: `atlas/data/languages/.gitkeep`, `atlas/data/initiatives/.gitkeep`
- Test: `atlas/tests/validate.test.ts`

**Interfaces:**
- Consumes: `LanguageSchema`, `InitiativeSchema` from `src/schema/index.ts`; `MethodSchema`, `PaperSchema`.
- Produces:
  - from `scripts/lib/load-records.ts`: `loadLanguages(dir: string): Language[]`, `loadInitiatives(dir: string): Initiative[]`
  - from `scripts/validate.ts`: `validate(input: ValidateInput): string[]` returning a list of human-readable problems (empty means valid), where `ValidateInput = { languages: Language[]; initiatives: Initiative[]; methodIds: Set<string>; paperIds: Set<string> }`; plus a CLI entry that exits 1 and prints the problems.

- [ ] **Step 1: Write the failing test**

`atlas/tests/validate.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { validate } from '../scripts/validate.js'
import type { Initiative, Language } from '../src/schema/index.js'

const src = { kind: 'url' as const, ref: 'https://example.test', retrieved: '2026-09-03', quote: null }

const lang = (over: Partial<Language> = {}): Language => ({
  id: 'kanienkeha', name: "Kanien'kéha", also_known_as: [], glottocode: null, iso639_3: null,
  tier: 'indigenous', family: 'Iroquoian', subfamily: null, typology: ['polysynthetic'],
  endangerment: null, speakers: null, region: 'north-america', countries: ['CA'],
  area: null, status: 'verified', ...over,
})

const init = (over: Partial<Initiative> = {}): Initiative => ({
  id: 'onkwawenna', name: 'Onkwawenna Kentyohkwa', kind: 'organisation', tier: 'indigenous',
  languages: ['kanienkeha'], started: 1999, ended: null,
  site: { lat: 43.13, lon: -79.92, place: 'Six Nations', source: src },
  applications: ['education'], methods: [], models: [], data_regime: null, governance: null,
  papers: [], links: [], transferability: null, status: 'verified', ...over,
})

const base = { methodIds: new Set(['fst-morphological-segmentation']), paperIds: new Set(['x-2025']) }

describe('validate', () => {
  it('passes a consistent dataset', () => {
    expect(validate({ languages: [lang()], initiatives: [init()], ...base })).toEqual([])
  })

  it('fails when a record is still draft, naming it', () => {
    const problems = validate({ languages: [lang({ status: 'draft' })], initiatives: [init()], ...base })
    expect(problems).toHaveLength(1)
    expect(problems[0]).toMatch(/kanienkeha/)
    expect(problems[0]).toMatch(/draft/)
  })

  it('excludes rejected records instead of failing on them', () => {
    const problems = validate({
      languages: [lang(), lang({ id: 'dropped', status: 'rejected' })],
      initiatives: [init()], ...base,
    })
    expect(problems).toEqual([])
  })

  it('fails an initiative referencing an unknown language', () => {
    const problems = validate({ languages: [lang()], initiatives: [init({ languages: ['atlantis'] })], ...base })
    expect(problems[0]).toMatch(/atlantis/)
  })

  it('fails an initiative referencing an unknown method', () => {
    const problems = validate({ languages: [lang()], initiatives: [init({ methods: ['telepathy'] })], ...base })
    expect(problems[0]).toMatch(/telepathy/)
  })

  it('fails an initiative referencing an unknown paper', () => {
    const problems = validate({ languages: [lang()], initiatives: [init({ papers: ['nope-1999'] })], ...base })
    expect(problems[0]).toMatch(/nope-1999/)
  })

  it('fails on duplicate ids', () => {
    const problems = validate({ languages: [lang(), lang()], initiatives: [init()], ...base })
    expect(problems[0]).toMatch(/duplicate/i)
  })

  it('reports every problem at once rather than stopping at the first', () => {
    const problems = validate({
      languages: [lang({ status: 'draft' })],
      initiatives: [init({ methods: ['telepathy'], papers: ['nope-1999'] })],
      ...base,
    })
    expect(problems.length).toBeGreaterThanOrEqual(3)
  })
})
```

- [ ] **Step 2: Run it and verify it fails**

Run: `pnpm vitest run tests/validate.test.ts`
Expected: FAIL — cannot resolve `../scripts/validate.js`.

- [ ] **Step 3: Write the record loader**

`atlas/scripts/lib/load-records.ts`:
```ts
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import yaml from 'js-yaml'
import { InitiativeSchema, LanguageSchema, type Initiative, type Language } from '../../src/schema/index.js'

function loadDir<T>(dir: string, parse: (raw: unknown, file: string) => T): T[] {
  let files: string[]
  try {
    files = readdirSync(dir).filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'))
  } catch {
    return []
  }
  return files.sort().map((f) => parse(yaml.load(readFileSync(join(dir, f), 'utf8')), join(dir, f)))
}

export function loadLanguages(dir: string): Language[] {
  return loadDir(dir, (raw, file) => {
    const r = LanguageSchema.safeParse(raw)
    if (!r.success) throw new Error(`${file}:\n${r.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n')}`)
    return r.data
  })
}

export function loadInitiatives(dir: string): Initiative[] {
  return loadDir(dir, (raw, file) => {
    const r = InitiativeSchema.safeParse(raw)
    if (!r.success) throw new Error(`${file}:\n${r.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n')}`)
    return r.data
  })
}
```

- [ ] **Step 4: Write the gate**

`atlas/scripts/validate.ts`:
```ts
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { Initiative, Language } from '../src/schema/index.js'
import { loadInitiatives, loadLanguages } from './lib/load-records.js'

export interface ValidateInput {
  languages: Language[]
  initiatives: Initiative[]
  methodIds: Set<string>
  paperIds: Set<string>
}

function findDuplicates(ids: string[], kind: string): string[] {
  const seen = new Set<string>()
  const problems: string[] = []
  for (const id of ids) {
    if (seen.has(id)) problems.push(`duplicate ${kind} id: ${id}`)
    seen.add(id)
  }
  return problems
}

/** Returns every problem found. Empty means the dataset is shippable.
 *  `rejected` records are excluded from the shipped set, not treated as errors:
 *  they are retained so seeding does not re-propose them. */
export function validate(input: ValidateInput): string[] {
  const problems: string[] = []

  const languages = input.languages.filter((l) => l.status !== 'rejected')
  const initiatives = input.initiatives.filter((i) => i.status !== 'rejected')

  problems.push(...findDuplicates(languages.map((l) => l.id), 'language'))
  problems.push(...findDuplicates(initiatives.map((i) => i.id), 'initiative'))

  for (const l of languages) {
    if (l.status === 'draft') {
      problems.push(`language ${l.id}: status is draft — review it and set status: verified, or status: rejected`)
    }
  }

  const languageIds = new Set(languages.map((l) => l.id))

  for (const i of initiatives) {
    if (i.status === 'draft') {
      problems.push(`initiative ${i.id}: status is draft — review it and set status: verified, or status: rejected`)
    }
    for (const ref of i.languages) {
      if (!languageIds.has(ref)) problems.push(`initiative ${i.id}: unknown language "${ref}"`)
    }
    for (const ref of i.methods) {
      if (!input.methodIds.has(ref)) problems.push(`initiative ${i.id}: unknown method "${ref}" (not a technique doc)`)
    }
    for (const ref of i.papers) {
      if (!input.paperIds.has(ref)) problems.push(`initiative ${i.id}: unknown paper "${ref}" (not in OVERVIEW.md)`)
    }
  }

  return problems
}

const url = (p: string): string => fileURLToPath(new URL(p, import.meta.url))
const readIds = (p: string): Set<string> =>
  new Set((JSON.parse(readFileSync(url(p), 'utf8')) as { id: string }[]).map((x) => x.id))

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const problems = validate({
    languages: loadLanguages(url('../data/languages')),
    initiatives: loadInitiatives(url('../data/initiatives')),
    methodIds: readIds('../data/derived/methods.json'),
    paperIds: readIds('../data/derived/papers.json'),
  })
  if (problems.length > 0) {
    console.error(`\nvalidate: ${problems.length} problem(s)\n`)
    for (const p of problems) console.error(`  ✗ ${p}`)
    console.error('\nNothing was built. Fix the above, or set status: rejected to exclude a record.\n')
    process.exit(1)
  }
  console.log('validate: ok')
}
```

- [ ] **Step 5: Run tests and typecheck**

Run: `pnpm test && pnpm typecheck`
Expected: all PASS, typecheck clean.

- [ ] **Step 6: Commit**

```bash
cd .. && git add atlas && git commit -m "feat(atlas): record loader and the draft-blocking build gate"
```

---

### Task 8: Fetch Native Land language polygons

Fetches the polygons that become the feathered fields. The network call is isolated from the transformation so the transformation is testable offline; the output is committed so the published page never calls the API.

**Files:**
- Create: `atlas/scripts/fetch-areas.ts`
- Create: `atlas/tests/fixtures/nld-languages.geojson`
- Test: `atlas/tests/fetch-areas.test.ts`

**Interfaces:**
- Consumes: `loadLanguages` from `scripts/lib/load-records.ts`; `@turf/simplify`.
- Produces: `selectAreas(raw: NldCollection, languages: Language[]): NldCollection` from `scripts/fetch-areas.ts`, plus a CLI entry that fetches, selects and writes `data/language-areas.geojson`. `NldCollection` is `{ type: 'FeatureCollection'; features: { type: 'Feature'; properties: Record<string, unknown>; geometry: unknown }[] }`.

- [ ] **Step 1: Verify the current Native Land endpoint before writing any URL into the code**

Native Land Digital has changed its API shape over time, and this plan does not hard-code an endpoint it has not confirmed.

Open `https://native-land.ca/resources/api-docs/` and record the current Languages-layer endpoint and whether it requires a key. Write what you find into `atlas/README.md` under a `## Native Land` heading, together with:

```markdown
Territory data © Native Land Digital (native-land.ca). Not authoritative;
does not represent official or legal boundaries. Educational use, attributed.
```

If the API is unavailable or requires an application, download the Languages GeoJSON by hand, save it to `atlas/data/raw/nld-languages.geojson`, and note that in the README. Either path is fine — the committed output is what matters, and Step 4's logic is identical.

- [ ] **Step 2: Create a fixture standing in for the API response**

`atlas/tests/fixtures/nld-languages.geojson`:
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": { "Name": "Kanien'kéha (Mohawk)", "ID": "nld-moh", "description": "…" },
      "geometry": { "type": "Polygon", "coordinates": [[[-74.6,43.0],[-74.0,43.0],[-74.0,43.6],[-74.3,43.6],[-74.6,43.6],[-74.6,43.0]]] }
    },
    {
      "type": "Feature",
      "properties": { "Name": "Some Other Language", "ID": "nld-other" },
      "geometry": { "type": "Polygon", "coordinates": [[[0,0],[1,0],[1,1],[0,1],[0,0]]] }
    }
  ]
}
```

- [ ] **Step 3: Write the failing test**

`atlas/tests/fetch-areas.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { selectAreas } from '../scripts/fetch-areas.js'
import type { Language } from '../src/schema/index.js'

const raw = JSON.parse(readFileSync(fileURLToPath(new URL('./fixtures/nld-languages.geojson', import.meta.url)), 'utf8'))

const lang = (over: Partial<Language>): Language => ({
  id: 'kanienkeha', name: "Kanien'kéha", also_known_as: [], glottocode: null, iso639_3: null,
  tier: 'indigenous', family: 'Iroquoian', subfamily: null, typology: [], endangerment: null,
  speakers: null, region: 'north-america', countries: ['CA'],
  area: { source: 'native-land-digital', nld_id: 'nld-moh', present: true },
  status: 'verified', ...over,
})

describe('selectAreas', () => {
  it('keeps only polygons a language record claims by nld_id', () => {
    const fc = selectAreas(raw, [lang({})])
    expect(fc.features).toHaveLength(1)
    expect(fc.features[0]?.properties?.language_id).toBe('kanienkeha')
  })

  it('stamps our language id onto the feature so the map can join on it', () => {
    const fc = selectAreas(raw, [lang({})])
    expect(fc.features[0]?.properties?.nld_id).toBe('nld-moh')
  })

  // [-74.3,43.6] is exactly collinear between [-74.0,43.6] and [-74.6,43.6],
  // so simplification must drop it: 6 vertices in, 5 out.
  it('simplifies geometry, dropping redundant vertices', () => {
    const fc = selectAreas(raw, [lang({})])
    const ring = (fc.features[0]?.geometry as { coordinates: number[][][] }).coordinates[0]
    expect(ring!.length).toBeLessThan(6)
  })

  it('skips languages with area.present false', () => {
    const l = lang({ area: { source: 'native-land-digital', nld_id: 'nld-moh', present: false } })
    expect(selectAreas(raw, [l]).features).toHaveLength(0)
  })

  it('skips adjacent-tier languages, which never carry an area', () => {
    expect(selectAreas(raw, [lang({ tier: 'adjacent', area: null })]).features).toHaveLength(0)
  })

  it('throws when a language claims an nld_id the source does not contain', () => {
    const l = lang({ area: { source: 'native-land-digital', nld_id: 'nld-missing', present: true } })
    expect(() => selectAreas(raw, [l])).toThrow(/nld-missing/)
  })
})
```

- [ ] **Step 4: Run it and verify it fails**

Run: `pnpm vitest run tests/fetch-areas.test.ts`
Expected: FAIL — cannot resolve `../scripts/fetch-areas.js`.

- [ ] **Step 5: Write the selector and CLI**

`atlas/scripts/fetch-areas.ts`:
```ts
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import simplify from '@turf/simplify'
import type { Language } from '../src/schema/index.js'
import { loadLanguages } from './lib/load-records.js'

interface NldFeature { type: 'Feature'; properties: Record<string, unknown>; geometry: unknown }
export interface NldCollection { type: 'FeatureCollection'; features: NldFeature[] }

/** Keeps only the polygons our language records actually claim, stamps our own
 *  id onto each, and simplifies. Adjacent-tier languages carry no area by
 *  schema rule (spec D5), so they are never selected. */
export function selectAreas(raw: NldCollection, languages: Language[]): NldCollection {
  const byNldId = new Map<string, NldFeature>()
  for (const f of raw.features) {
    const id = f.properties['ID']
    if (typeof id === 'string') byNldId.set(id, f)
  }

  const features: NldFeature[] = []
  for (const l of languages) {
    if (l.area === null || !l.area.present) continue
    const f = byNldId.get(l.area.nld_id)
    if (!f) throw new Error(`language ${l.id}: no Native Land feature with ID "${l.area.nld_id}"`)

    const simplified = simplify(
      { type: 'Feature', properties: {}, geometry: f.geometry } as never,
      { tolerance: 0.01, highQuality: true, mutate: false },
    ) as { geometry: unknown }

    features.push({
      type: 'Feature',
      properties: { language_id: l.id, language_name: l.name, nld_id: l.area.nld_id },
      geometry: simplified.geometry,
    })
  }
  return { type: 'FeatureCollection', features }
}

const url = (p: string): string => fileURLToPath(new URL(p, import.meta.url))

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const rawPath = url('../data/raw/nld-languages.geojson')
  if (!existsSync(rawPath)) {
    console.error(
      `Missing ${rawPath}\n` +
        `Fetch the Native Land Languages layer (see atlas/README.md, "Native Land")\n` +
        `and save it there. It is deliberately a manual, dated step: the published\n` +
        `page must never call the API at runtime.`,
    )
    process.exit(1)
  }
  const raw = JSON.parse(readFileSync(rawPath, 'utf8')) as NldCollection
  const fc = selectAreas(raw, loadLanguages(url('../data/languages')))
  mkdirSync(new URL('../data/', import.meta.url), { recursive: true })
  writeFileSync(url('../data/language-areas.geojson'), `${JSON.stringify(fc)}\n`)
  console.log(`fetch-areas: ${fc.features.length} language areas -> data/language-areas.geojson`)
}
```

- [ ] **Step 6: Run tests**

Run: `pnpm vitest run tests/fetch-areas.test.ts`
Expected: 6 tests PASS.

- [ ] **Step 7: Commit**

```bash
cd .. && git add atlas && git commit -m "feat(atlas): select and simplify Native Land language polygons"
```

---

### Task 9: Seeding pass

Produces the human review queue. Everything it writes is `status: draft`, which the Task 7 gate refuses to ship — so seeding can be generous without risk, and the queue enforces itself.

**Files:**
- Create: `atlas/scripts/seed.ts`
- Test: `atlas/tests/seed.test.ts`

**Interfaces:**
- Consumes: `extractPapers`; `loadLanguages`; `LanguageSchema`.
- Produces: `seedLanguagesFromDraft(draftMarkdown: string): Language[]` (all `status: 'draft'`), and a CLI writing one YAML file per new language into `data/languages/`, skipping ids that already exist in any status.

- [ ] **Step 1: Write the failing test**

`atlas/tests/seed.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { seedLanguagesFromDraft } from '../scripts/seed.js'

const DRAFT = `# Review Paper

## Languages

### Choctaw

Population: 195,000
Number of speakers: 9600 -> 1000 speakers cited in another paper ?
Language family: Muskogean
Morphological Typology: Polysynthetic & Agglutinative
UNESCO classification: Vulnerable

### Lakota

Population: 170,000
Number of fluent speakers: 2,000 speakers
Language family: Siouan
Morphological Typology: Synthetic and Agglutinative
UNESCO classification: Critically endangered
`

describe('seedLanguagesFromDraft', () => {
  const seeded = seedLanguagesFromDraft(DRAFT)

  it('finds each language heading', () => {
    expect(seeded.map((l) => l.id)).toEqual(['choctaw', 'lakota'])
  })

  it('marks everything draft so the gate blocks it until reviewed', () => {
    expect(seeded.every((l) => l.status === 'draft')).toBe(true)
  })

  it('parses the language family', () => {
    expect(seeded[0]?.family).toBe('Muskogean')
  })

  it('maps the UNESCO wording onto the controlled scale', () => {
    expect(seeded[0]?.endangerment?.status).toBe('vulnerable')
    expect(seeded[1]?.endangerment?.status).toBe('critically-endangered')
  })

  it('splits a compound typology into controlled terms', () => {
    expect(seeded[0]?.typology).toEqual(['polysynthetic', 'agglutinative'])
  })

  it('keeps the second speaker figure as a conflict rather than picking one', () => {
    expect(seeded[0]?.speakers?.value).toBe(9600)
    expect(seeded[0]?.speakers?.conflicts[0]?.value).toBe(1000)
  })
})
```

- [ ] **Step 2: Run it and verify it fails**

Run: `pnpm vitest run tests/seed.test.ts`
Expected: FAIL — cannot resolve `../scripts/seed.js`.

- [ ] **Step 3: Write the seeder**

`atlas/scripts/seed.ts`:
```ts
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import yaml from 'js-yaml'
import { LanguageSchema, TYPOLOGIES, type Endangerment, type Language, type Typology } from '../src/schema/index.js'

const UNESCO: Record<string, Endangerment> = {
  safe: 'safe',
  vulnerable: 'vulnerable',
  'definitely endangered': 'definitely-endangered',
  'severely endangered': 'severely-endangered',
  'critically endangered': 'critically-endangered',
  extinct: 'extinct',
}

const slug = (s: string): string => s.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const field = (block: string, label: RegExp): string | null => block.match(label)?.[1]?.trim() ?? null

/** Reads the ad-hoc language profiles in papers/review-paper/Draft.md into
 *  draft Language records. Everything it cannot determine is left null for a
 *  human to fill — it never invents a value to make a record look complete. */
export function seedLanguagesFromDraft(draftMarkdown: string): Language[] {
  const out: Language[] = []
  const sections = draftMarkdown.split(/^### /m).slice(1)

  for (const section of sections) {
    const name = section.split('\n')[0]?.trim()
    if (!name) continue

    const typologyRaw = (field(section, /^Morphological Typology:\s*(.+)$/m) ?? '').toLowerCase()
    // Word-boundary, not substring: `includes('synthetic')` is true of
    // "polysynthetic", which would tag every polysynthetic language as
    // synthetic as well.
    const typology = TYPOLOGIES.filter((t) => new RegExp(`\\b${t}\\b`).test(typologyRaw)) as Typology[]

    const unescoRaw = (field(section, /^UNESCO classification:\s*(.+)$/m) ?? '').toLowerCase().trim()
    const status = UNESCO[unescoRaw] ?? null

    // "9600 -> 1000 speakers cited in another paper ?" — both figures are kept.
    const speakersRaw = field(section, /^Number of (?:fluent )?speakers:\s*(.+)$/m)
    const figures = (speakersRaw ?? '').match(/\d[\d,]*/g)?.map((n) => Number(n.replace(/,/g, ''))) ?? []

    const source = {
      kind: 'doc' as const,
      ref: 'papers/review-paper/Draft.md',
      retrieved: null,
      quote: null,
    }

    out.push(
      LanguageSchema.parse({
        id: slug(name),
        name,
        // Draft.md's Languages section is Indigenous languages. Adjacent-tier
        // languages are added by hand, never seeded.
        tier: 'indigenous',
        family: field(section, /^Language family:\s*(.+)$/m) ?? 'UNKNOWN',
        typology,
        region: 'north-america',
        endangerment: status === null ? null : { status, scale: 'unesco-2010', source },
        speakers:
          figures.length === 0
            ? null
            : {
                value: figures[0]!,
                as_of: null,
                source,
                conflicts: figures.slice(1).map((value) => ({ value, source })),
              },
        area: null,
        status: 'draft',
      }),
    )
  }
  return out
}

const url = (p: string): string => fileURLToPath(new URL(p, import.meta.url))

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dir = url('../data/languages')
  mkdirSync(dir, { recursive: true })
  const seeded = seedLanguagesFromDraft(readFileSync(url('../../papers/review-paper/Draft.md'), 'utf8'))
  let written = 0
  for (const l of seeded) {
    const path = join(dir, `${l.id}.yml`)
    if (existsSync(path)) continue // never clobber a reviewed record
    writeFileSync(path, yaml.dump(l, { lineWidth: 100, quotingType: '"' }))
    written += 1
  }
  console.log(`seed: ${written} new draft language(s); ${seeded.length - written} already present`)
  console.log('All are status: draft — `pnpm validate` will refuse to build until each is reviewed.')
}
```

- [ ] **Step 4: Run tests**

Run: `pnpm vitest run tests/seed.test.ts`
Expected: 6 tests PASS.

- [ ] **Step 5: Run the seeder and confirm the gate then blocks**

```bash
pnpm seed
pnpm extract:methods && pnpm extract:papers
pnpm validate
```
Expected: `seed` writes draft records; `validate` exits **1**, listing each drafted language. That failure is the deliverable of this step — it demonstrates the gate holding.

- [ ] **Step 6: Commit**

```bash
cd .. && git add atlas && git commit -m "feat(atlas): seed draft Language records from the review-paper draft"
```

---

### Task 10: Bundle, hand-verified seed set, green pipeline

Closes SP0. Delivers `bundle.ts`, a small hand-verified dataset that exercises every code path, and a passing end-to-end run — plus the gate's mutation test, which belongs here because it needs a real verified record to mutate.

**Files:**
- Create: `atlas/scripts/bundle.ts`
- Create: `atlas/src/data/.gitkeep`
- Create: `atlas/data/languages/*.yml` (5 hand-verified), `atlas/data/initiatives/*.yml` (5 hand-verified)
- Test: `atlas/tests/gate.test.ts`

**Interfaces:**
- Consumes: everything above.
- Produces: `src/data/atlas.json` shaped `{ generated: string; languages: Language[]; initiatives: Initiative[]; methods: Method[]; papers: Paper[] }` — the single file SP1's app imports.

- [ ] **Step 1: Write the bundler**

`atlas/scripts/bundle.ts`:
```ts
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { loadInitiatives, loadLanguages } from './lib/load-records.js'

import type { Method, Paper } from '../src/schema/index.js'

const url = (p: string): string => fileURLToPath(new URL(p, import.meta.url))
const readJson = <T>(p: string): T => JSON.parse(readFileSync(url(p), 'utf8')) as T

const bundle = {
  generated: new Date().toISOString(),
  languages: loadLanguages(url('../data/languages')).filter((l) => l.status === 'verified'),
  initiatives: loadInitiatives(url('../data/initiatives')).filter((i) => i.status === 'verified'),
  methods: readJson<Method[]>('../data/derived/methods.json'),
  papers: readJson<Paper[]>('../data/derived/papers.json'),
}

mkdirSync(new URL('../src/data/', import.meta.url), { recursive: true })
writeFileSync(url('../src/data/atlas.json'), `${JSON.stringify(bundle, null, 2)}\n`)
console.log(
  `bundle: ${bundle.languages.length} languages, ${bundle.initiatives.length} initiatives, ` +
    `${bundle.methods.length} methods, ${bundle.papers.length} papers -> src/data/atlas.json`,
)
```

- [ ] **Step 2: Hand-verify five languages and five initiatives**

This is research, not typing. For each record, read the initiative's own public materials, fill every field you can support, leave the rest null, and cite each claim.

The five must together exercise every code path: **at least one adjacent-tier initiative** (so `transferability` is exercised), **at least one adjacent-tier language** (so the D5 no-area rule is exercised), and **at least one indigenous language with `area.present: false`** (so the "not mapped" path is exercised).

Suggested set, all named in the brainstorm or already in the corpus:

| Record | Tier | Exercises |
| --- | --- | --- |
| `te-hiku-media` (initiative) + `te-reo-maori` | indigenous | governance: community-controlled, a real licence |
| `onkwawenna-kentyohkwa` (initiative) + `kanienkeha` | indigenous | the project's own focus language |
| `myaamia-center` (initiative) + `myaamia` | indigenous | TTS; profile already drafted in `Draft.md` |
| `americasnlp` (initiative, shared-task) + `choctaw` | indigenous | multi-language initiative; speaker-count conflict; **`area.present: false`** |
| `masakhane` (initiative) + `amharic` | **adjacent** | **`transferability` required; language must carry no area** |

Set `status: verified` only on records you have actually checked. Anything else stays `draft`.

- [ ] **Step 3: Write the gate mutation test**

This is the test the spec calls for by name. It mutates a **real** record on disk, asserts the gate rejects it, and restores it — proving the gate consumes `status`, not merely that a fixture parses.

`atlas/tests/gate.test.ts`:
```ts
import { afterEach, describe, expect, it } from 'vitest'
import { copyFileSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import yaml from 'js-yaml'
import { validate } from '../scripts/validate.js'
import { loadInitiatives, loadLanguages } from '../scripts/lib/load-records.js'

const url = (p: string): string => fileURLToPath(new URL(p, import.meta.url))
const LANG_DIR = url('../data/languages')
const readIds = (p: string): Set<string> =>
  new Set((JSON.parse(readFileSync(url(p), 'utf8')) as { id: string }[]).map((x) => x.id))

const input = () => ({
  languages: loadLanguages(LANG_DIR),
  initiatives: loadInitiatives(url('../data/initiatives')),
  methodIds: readIds('../data/derived/methods.json'),
  paperIds: readIds('../data/derived/papers.json'),
})

let backup: string | null = null
let target: string | null = null

afterEach(() => {
  if (backup && target) {
    copyFileSync(backup, target)
    rmSync(backup)
    backup = null
    target = null
  }
})

describe('the build gate, against the real dataset', () => {
  it('passes on the committed dataset', () => {
    expect(validate(input())).toEqual([])
  })

  it('fails when a real verified record is demoted to draft', () => {
    const file = readdirSync(LANG_DIR).find((f) => f.endsWith('.yml'))
    expect(file, 'no language records — Task 10 Step 2 is incomplete').toBeDefined()

    target = join(LANG_DIR, file!)
    backup = `${target}.bak`
    copyFileSync(target, backup)

    const record = yaml.load(readFileSync(target, 'utf8')) as Record<string, unknown>
    expect(record['status'], 'the chosen record was not verified to begin with').toBe('verified')

    // Mutate the PRODUCTION value, not a copy: this is what proves the gate
    // reads status rather than merely that a fixture parses.
    record['status'] = 'draft'
    writeFileSync(target, yaml.dump(record))

    const problems = validate(input())
    expect(problems.length).toBeGreaterThan(0)
    expect(problems.some((p) => p.includes('draft'))).toBe(true)
  })

  it('restores cleanly', () => {
    // The mutated record is whichever sorts first, so assert on the class of
    // leftovers rather than on one filename.
    expect(readdirSync(LANG_DIR).filter((f) => f.endsWith('.bak'))).toEqual([])
    expect(validate(input())).toEqual([])
  })
})
```

- [ ] **Step 4: Run the whole pipeline green**

```bash
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"
cd atlas
pnpm build:data
```
Expected, in order:
```
extract-methods: 39 methods -> data/derived/methods.json
extract-papers: 92 papers -> data/derived/papers.json
validate: ok
bundle: 5 languages, 5 initiatives, 39 methods, 92 papers -> src/data/atlas.json
```

If `validate` exits 1, read the list: every line names a record and what is wrong with it. Records you have not reviewed should be `status: draft` and are *supposed* to block — either review them or mark them `rejected`. Do not weaken the gate to get a green run.

- [ ] **Step 5: Run the full suite and typecheck**

Run: `pnpm test && pnpm typecheck`
Expected: all tests PASS (vocab 3, source 5, data-regime 7, schema 10, extract-methods 8, extract-papers 7, validate 8, fetch-areas 6, seed 6, gate 3 = 63), typecheck clean.

- [ ] **Step 6: Commit**

```bash
cd .. && git add atlas && git commit -m "feat(atlas): bundler, hand-verified seed set, and the gate mutation test

Closes SP0. The pipeline runs green against 5 verified languages and 5 verified
initiatives spanning both tiers; every remaining record sits in the review queue
as a draft, which the gate refuses to ship."
```

---

## Done when

- `pnpm build:data` exits 0 and writes `src/data/atlas.json`.
- `pnpm test` and `pnpm typecheck` are green.
- Five languages and five initiatives are `verified`, covering both tiers, a `transferability` note, a speaker-count conflict, and one `area.present: false`.
- Every other seeded record is `draft` and visibly blocks the build.

## Explicitly NOT in SP0

- `sample-fields.ts` and anything about feathering — it depends on the SP1 spike.
- Any map, filter UI, timeline or table view.
- Curating the full ~60-initiative inventory. SP0 delivers the pipeline and the queue; promoting drafts to verified is human review and is deliberately outside this plan.
- Deployment, Zenodo DOI, and the `AGENTS.md` / `docs/README.md` Docusaurus corrections — all SP2.
