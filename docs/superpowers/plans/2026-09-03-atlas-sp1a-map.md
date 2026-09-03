# Atlas SP1a — The Map Renders: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render the atlas as a clickable map that visually distinguishes a well-sourced coordinate from one its own record says is approximate.

**Architecture:** A Vite + React app inside the existing `atlas/` package. MapLibre is imperative and React owns state: one `useMap` hook holds the map instance and pushes data through `source.setData()`. All record-to-GeoJSON derivation lives in pure modules, so the substance is unit-testable with no browser and no map.

**Tech Stack:** Vite, React 19, MapLibre GL JS, TypeScript strict, Vitest (node + jsdom), Zod (already present).

**Spec:** `docs/superpowers/specs/2026-09-03-atlas-sp1a-map-design.md` — read it before starting, together with its parent `2026-09-03-indigenous-nlp-atlas-design.md` (decisions D1–D9 and §3a bind this work). This plan argues from the spec and does not restate its reasoning.

## Global Constraints

- **Node 22.22.2**, pinned in `atlas/.nvmrc`. Node is **not on PATH**; before any node/pnpm command run `export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"`. Node IS installed — do not conclude otherwise and do not install it.
- **Never run `pnpm approve-builds`.** Build approval already lives in `atlas/pnpm-workspace.yaml` as `allowBuilds: {esbuild: true}`. That command overwrites the file with an interactive placeholder and breaks `pnpm test`. Never add a `pnpm` field to `package.json` — pnpm 11 ignores it.
- **All commands run from `atlas/`.** `pnpm test` currently passes **73/73**; if it breaks, you broke it.
- **TypeScript strict**, `noUncheckedIndexedAccess: true`. No `any`.
- **Never edit `litterature_review/` or `docs/docs/`**; never hand-edit `data/derived/**`.
- **No polygons, no GeoJSON territory data, no `@turf/*`, no Native Land Digital.** Spec §3a. A language's presence is one point rendered as a blurred circle.
- **Each visual channel carries exactly one meaning** (spec §4). Softness of a language field means "no boundary claim" and must **never** also encode confidence, size, or speaker count.
- **Do not promote any record to `verified`.** All ten stay `draft`; `pnpm build:data` must keep exiting 1.
- Conventional commit prefixes. Commit after every task.

---

### Task 1: Vite + React toolchain

Adds the app shell to a package that is currently scripts-and-schemas only. Delivers a served page and a green suite in two environments.

**Files:**
- Create: `atlas/index.html`, `atlas/vite.config.ts`, `atlas/src/main.tsx`, `atlas/src/components/App.tsx`
- Modify: `atlas/package.json`, `atlas/vitest.config.ts`, `atlas/tsconfig.json`
- Test: `atlas/tests/app.test.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: `pnpm dev`, `pnpm build:app`, `pnpm preview`. `App` — a default-exported React component taking no props.

- [ ] **Step 1: Add dependencies**

In `atlas/package.json`, add to `devDependencies` (keep the existing entries):

```json
    "@testing-library/react": "^16.1.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.4",
    "jsdom": "^25.0.1",
    "maplibre-gl": "^5.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "vite": "^6.0.0"
```

Add to `scripts`:

```json
    "dev": "vite",
    "build:app": "vite build",
    "preview": "vite preview"
```

Then: `export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH" && pnpm install`

Expected: installs cleanly, no `ERR_PNPM_IGNORED_BUILDS`.

- [ ] **Step 2: Create the app shell**

`atlas/index.html`:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Atlas of Indigenous Language NLP</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`atlas/vite.config.ts`:
```ts
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  build: { outDir: 'dist' },
})
```

`atlas/src/components/App.tsx`:
```tsx
export default function App(): React.JSX.Element {
  return <main><h1>Atlas of Indigenous Language NLP</h1></main>
}
```

`atlas/src/main.tsx`:
```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './components/App.js'

const el = document.getElementById('root')
if (!el) throw new Error('#root not found')
createRoot(el).render(<StrictMode><App /></StrictMode>)
```

- [ ] **Step 3: Configure TypeScript and Vitest for two environments**

In `atlas/tsconfig.json` `compilerOptions`, add `"jsx": "react-jsx"` and add `"DOM"` to lib:
```json
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
```
In `include`, add `"*.ts"` so `vite.config.ts` is covered.

`atlas/vitest.config.ts` — keep node as the default environment. Component tests opt into jsdom with a docblock, which is version-stable across Vitest majors:
```ts
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    environment: 'node',
    globals: false,
  },
})
```

- [ ] **Step 4: Write the failing smoke test**

`atlas/tests/app.test.tsx`:
```tsx
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup } from '@testing-library/react'
import App from '../src/components/App.js'

afterEach(() => cleanup())

describe('App', () => {
  it('renders the atlas heading', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /atlas of indigenous language nlp/i })).toBeDefined()
  })
})
```

`cleanup()` is explicit because `globals: false` means Vitest does not auto-register Testing Library's cleanup. Without it, a second component test in the same file leaks the first render's DOM and assertions match the wrong element.

- [ ] **Step 5: Run it and verify it fails**

Run: `pnpm vitest run tests/app.test.tsx`
Expected: FAIL — module `../src/components/App.js` not found (until Step 2's files exist) or jsdom missing.

- [ ] **Step 6: Verify everything**

```bash
pnpm test        # 74  (73 before, plus this one)
pnpm typecheck   # exit 0
pnpm build:app   # writes dist/
```

If `pnpm test` reports anything other than 74, STOP and report the number rather than adjusting a test to fit.

- [ ] **Step 7: Commit**

```bash
cd .. && git add atlas && git commit -m "feat(atlas): Vite + React app shell"
```

---

### Task 2: `confidence` on centre and site

The schema change the whole visual design rests on. The map must read a field, not grep free-text caveats for words about location.

**Files:**
- Modify: `atlas/src/schema/language.ts`, `atlas/src/schema/initiative.ts`
- Modify: `atlas/data/languages/myaamia.yml`, `atlas/data/initiatives/masakhane.yml`
- Test: `atlas/tests/schema.test.ts`

**Interfaces:**
- Consumes: `SourceSchema`.
- Produces: `Language['centre']` and `Initiative['site']` each gain `confidence: 'sourced' | 'approximate'`. A new exported `LOCATION_CONFIDENCE = ['sourced', 'approximate'] as const` and `type LocationConfidence` in `atlas/src/schema/vocab.ts`.

- [ ] **Step 1: Add the vocabulary**

Append to `atlas/src/schema/vocab.ts`:
```ts
/** How much a coordinate can be trusted. `approximate` means the record's own
 *  text says so — a placeholder-looking centroid, or an organisation with no
 *  stated base. The map reads THIS, never the free-text `caveat`: a caveat may
 *  be about speaker counts rather than location. */
export const LOCATION_CONFIDENCE = ['sourced', 'approximate'] as const
export type LocationConfidence = (typeof LOCATION_CONFIDENCE)[number]
```

- [ ] **Step 2: Write the failing tests**

Add to the `LanguageSchema` describe block in `atlas/tests/schema.test.ts`:
```ts
  it('defaults a centre to sourced confidence', () => {
    const r = LanguageSchema.safeParse(language)
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.centre?.confidence).toBe('sourced')
  })

  it('accepts an approximate centre', () => {
    const r = LanguageSchema.safeParse({
      ...language,
      centre: { lat: 40.0, lon: -90.0, source: src, confidence: 'approximate' },
    })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.centre?.confidence).toBe('approximate')
  })

  it('rejects an unknown confidence value', () => {
    const r = LanguageSchema.safeParse({
      ...language,
      centre: { lat: 40.0, lon: -90.0, source: src, confidence: 'vibes' },
    })
    expect(r.success).toBe(false)
  })
```

Add to the `InitiativeSchema` describe block:
```ts
  it('defaults a site to sourced confidence', () => {
    const r = InitiativeSchema.safeParse(initiative)
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.site.confidence).toBe('sourced')
  })

  it('accepts an approximate site', () => {
    const r = InitiativeSchema.safeParse({
      ...initiative,
      site: { ...initiative.site, confidence: 'approximate' },
    })
    expect(r.success).toBe(true)
  })
```

- [ ] **Step 3: Run and verify they fail**

Run: `pnpm vitest run tests/schema.test.ts`
Expected: FAIL — `confidence` is `undefined`, and `'vibes'` is accepted because the field does not exist.

- [ ] **Step 4: Add the field to both schemas**

In `atlas/src/schema/language.ts`, import `LOCATION_CONFIDENCE` from `./vocab.js` and add the last line of `CentreSchema`:
```ts
const CentreSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  source: SourceSchema,
  /** `approximate` makes the map draw this differently. Additive with a
   *  default, so every existing record stays valid unedited. */
  confidence: z.enum(LOCATION_CONFIDENCE).default('sourced'),
})
```

In `atlas/src/schema/initiative.ts`, import `LOCATION_CONFIDENCE` and add the same last line to `SiteSchema`.

- [ ] **Step 5: Mark the two records whose own text already says so**

In `atlas/data/languages/myaamia.yml`, inside the `centre:` block, add `confidence: approximate`. Leave the `caveat` prose exactly as written — the enum tells the map what to draw, the caveat tells the reader why.

In `atlas/data/initiatives/masakhane.yml`, inside the `site:` block, add `confidence: approximate`. Leave `place` and `caveat` untouched.

Do not touch any other record: the remaining eight are `sourced` by default.

- [ ] **Step 6: Verify**

```bash
pnpm test        # 79
pnpm typecheck
pnpm build:data; echo "exit=$?"   # MUST still be 1, still 10 drafts
```

`build:data` exiting anything but 1 means you promoted a record or broke the gate. Report the count if `pnpm test` is not 79.

- [ ] **Step 7: Commit**

```bash
cd .. && git add atlas && git commit -m "feat(atlas): location confidence on centre and site

The map must read a field, not grep free-text caveats for words about
location — a caveat may be about speaker counts. Additive with a default,
so every existing record stays valid unedited."
```

---

### Task 3: The fixture bundle

SP1a builds against a fixture because the ten real records are `draft` and the bundler ships only `verified`. The fixture is a **complete bundle** and is validated against the real schemas, so it cannot drift into describing data the schemas would reject.

**Files:**
- Create: `atlas/src/fixtures/atlas.fixture.json`
- Test: `atlas/tests/fixture.test.ts`

**Interfaces:**
- Consumes: `LanguageSchema`, `InitiativeSchema`, `MethodSchema`, `PaperSchema`.
- Produces: `atlas/src/fixtures/atlas.fixture.json`, shape `{ generated, languages, initiatives, methods, papers }` — the same shape `scripts/bundle.ts` emits.

- [ ] **Step 1: Write the fixture**

`atlas/src/fixtures/atlas.fixture.json`. Every record is `status: verified` — this is a bundle, and the bundler only ever emits verified records. Each entry exists to exercise one path named in spec §8:

```json
{
  "generated": "2026-09-03T00:00:00.000Z",
  "languages": [
    {
      "id": "fixture-sourced", "name": "Sourced Centre Language", "also_known_as": [],
      "glottocode": null, "iso639_3": null, "tier": "indigenous", "family": "Fixture Family",
      "subfamily": null, "typology": ["polysynthetic"], "endangerment": null, "speakers": null,
      "region": "north-america", "countries": ["CA"],
      "centre": { "lat": 45.5, "lon": -73.6, "confidence": "sourced",
        "source": { "kind": "doc", "ref": "fixture", "retrieved": null, "quote": null } },
      "caveat": null, "status": "verified"
    },
    {
      "id": "fixture-approximate", "name": "Approximate Centre Language", "also_known_as": [],
      "glottocode": null, "iso639_3": null, "tier": "indigenous", "family": "Fixture Family",
      "subfamily": null, "typology": [], "endangerment": null, "speakers": null,
      "region": "north-america", "countries": ["US"],
      "centre": { "lat": 40.0, "lon": -90.0, "confidence": "approximate",
        "source": { "kind": "doc", "ref": "fixture", "retrieved": null, "quote": null } },
      "caveat": "A round placeholder-looking centroid, not a researched location.",
      "status": "verified"
    },
    {
      "id": "fixture-unmapped", "name": "Unmapped Language", "also_known_as": [],
      "glottocode": null, "iso639_3": null, "tier": "indigenous", "family": "Fixture Family",
      "subfamily": null, "typology": [], "endangerment": null, "speakers": null,
      "region": "north-america", "countries": ["CA"],
      "centre": null, "caveat": null, "status": "verified"
    },
    {
      "id": "fixture-adjacent", "name": "Adjacent Language", "also_known_as": [],
      "glottocode": null, "iso639_3": null, "tier": "adjacent", "family": "Fixture Family",
      "subfamily": null, "typology": [], "endangerment": null, "speakers": null,
      "region": "africa", "countries": ["ET"],
      "centre": null, "caveat": null, "status": "verified"
    },
    {
      "id": "fixture-conflict", "name": "Conflicted Speakers Language", "also_known_as": ["Alt Name"],
      "glottocode": null, "iso639_3": null, "tier": "indigenous", "family": "Fixture Family",
      "subfamily": null, "typology": [], "endangerment": null,
      "speakers": { "value": 9600, "as_of": null,
        "source": { "kind": "doc", "ref": "fixture-a", "retrieved": null, "quote": null },
        "conflicts": [{ "value": 300,
          "source": { "kind": "doc", "ref": "fixture-b", "retrieved": null, "quote": null } }] },
      "region": "north-america", "countries": ["US"],
      "centre": { "lat": 34.0, "lon": -89.0, "confidence": "sourced",
        "source": { "kind": "doc", "ref": "fixture", "retrieved": null, "quote": null } },
      "caveat": null, "status": "verified"
    }
  ],
  "initiatives": [
    {
      "id": "fixture-ongoing", "name": "Ongoing Initiative", "kind": "organisation",
      "tier": "indigenous", "languages": ["fixture-sourced"], "started": 2016, "ended": null,
      "site": { "lat": -35.11, "lon": 173.26, "place": "Fixture Place", "confidence": "sourced",
        "source": { "kind": "doc", "ref": "fixture", "retrieved": null, "quote": null } },
      "applications": ["asr", "tts"], "methods": ["fixture-method"], "models": ["wav2vec2"],
      "data_regime": "1k-10k",
      "governance": { "posture": "community-controlled", "licence": "Fixture Licence",
        "source": { "kind": "doc", "ref": "fixture", "retrieved": null, "quote": null } },
      "papers": ["fixture-paper"], "links": [], "transferability": null,
      "caveat": null, "status": "verified"
    },
    {
      "id": "fixture-ended", "name": "Ended Initiative", "kind": "project",
      "tier": "indigenous", "languages": ["fixture-conflict"], "started": 2018, "ended": 2021,
      "site": { "lat": 43.13, "lon": -79.92, "place": "Fixture Place Two", "confidence": "sourced",
        "source": { "kind": "doc", "ref": "fixture", "retrieved": null, "quote": null } },
      "applications": ["mt"], "methods": [], "models": [], "data_regime": null,
      "governance": null, "papers": [], "links": [], "transferability": null,
      "caveat": null, "status": "verified"
    },
    {
      "id": "fixture-adjacent-init", "name": "Adjacent Initiative", "kind": "organisation",
      "tier": "adjacent", "languages": ["fixture-adjacent"], "started": 2019, "ended": null,
      "site": { "lat": -1.18, "lon": 36.93,
        "place": "No stated base; pin marks the founding venue.", "confidence": "approximate",
        "source": { "kind": "doc", "ref": "fixture", "retrieved": null, "quote": null } },
      "applications": ["mt"], "methods": [], "models": [], "data_regime": null,
      "governance": null, "papers": [], "links": [],
      "transferability": { "transfers": ["participatory corpus building"],
        "does_not_transfer": ["open web-scale scraping"],
        "note": "Open release conflicts with community data sovereignty." },
      "caveat": "Distributed and online; the pin is the founding venue, not a base.",
      "status": "verified"
    }
  ],
  "methods": [
    { "id": "fixture-method", "name": "Fixture Method", "category": "ml",
      "data_regime": ["<1k", "1k-10k"], "data_regime_note": "<1K sentences / 1K-10K sentences",
      "applicable_languages": "polysynthetic", "doc_url": "/ml-techniques/fixture-method/" }
  ],
  "papers": [
    { "id": "fixture-paper", "title": "A Fixture Paper", "authors": "Fixture et al.", "year": 2025,
      "venue": "Fixture Proceedings", "themes": ["evaluation"],
      "summary_url": "litterature_review/summaries/fixture-paper.md" }
  ]
}
```

- [ ] **Step 2: Write the failing test**

`atlas/tests/fixture.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { InitiativeSchema, LanguageSchema, MethodSchema, PaperSchema } from '../src/schema/index.js'

const fixture = JSON.parse(
  readFileSync(fileURLToPath(new URL('../src/fixtures/atlas.fixture.json', import.meta.url)), 'utf8'),
) as Record<string, unknown[]>

describe('the fixture bundle', () => {
  it('parses every language against the real schema', () => {
    for (const l of fixture['languages']!) {
      const r = LanguageSchema.safeParse(l)
      expect(r.success, JSON.stringify(r.success ? '' : r.error.issues)).toBe(true)
    }
  })

  it('parses every initiative against the real schema', () => {
    for (const i of fixture['initiatives']!) {
      const r = InitiativeSchema.safeParse(i)
      expect(r.success, JSON.stringify(r.success ? '' : r.error.issues)).toBe(true)
    }
  })

  it('parses methods and papers', () => {
    for (const m of fixture['methods']!) expect(MethodSchema.safeParse(m).success).toBe(true)
    for (const p of fixture['papers']!) expect(PaperSchema.safeParse(p).success).toBe(true)
  })

  it('holds only verified records, because a bundle only ever contains verified records', () => {
    for (const r of [...fixture['languages']!, ...fixture['initiatives']!]) {
      expect((r as { status: string }).status).toBe('verified')
    }
  })

  it('exercises every path the map has to handle', () => {
    const langs = fixture['languages'] as { id: string; tier: string; centre: unknown }[]
    const inits = fixture['initiatives'] as { site: { confidence: string }; ended: number | null }[]
    expect(langs.some((l) => (l.centre as { confidence: string } | null)?.confidence === 'sourced')).toBe(true)
    expect(langs.some((l) => (l.centre as { confidence: string } | null)?.confidence === 'approximate')).toBe(true)
    expect(langs.some((l) => l.centre === null && l.tier === 'indigenous')).toBe(true)
    expect(langs.some((l) => l.tier === 'adjacent')).toBe(true)
    expect(inits.some((i) => i.site.confidence === 'approximate')).toBe(true)
    expect(inits.some((i) => i.ended !== null)).toBe(true)
    expect(inits.some((i) => i.ended === null)).toBe(true)
  })
})
```

The last test is the one that matters: it stops a future edit quietly deleting the awkward cases and leaving a fixture that only exercises the flattering ones.

- [ ] **Step 3: Run and verify**

Run: `pnpm vitest run tests/fixture.test.ts`
Expected: 5 PASS. If a schema rejects a fixture record, fix the **fixture** — never loosen the schema.

- [ ] **Step 4: Commit**

```bash
cd .. && git add atlas && git commit -m "feat(atlas): fixture bundle validated against the real schemas"
```

---

### Task 4: `load.ts` — choose and validate the bundle

Extends SP0's gate to the page: you cannot build a publishable artifact from an empty bundle.

**Files:**
- Create: `atlas/src/lib/load.ts`
- Test: `atlas/tests/load.test.ts`

**Interfaces:**
- Consumes: the fixture from Task 3.
- Produces:
  - `interface AtlasBundle { generated: string; languages: Language[]; initiatives: Initiative[]; methods: Method[]; papers: Paper[] }`
  - `chooseBundle(opts: { real: unknown | null; fixture: unknown; isProduction: boolean }): AtlasBundle` — PURE; throws on an absent or empty bundle in production.
  - `loadBundle(): AtlasBundle` — the module-level glue that calls `chooseBundle`.

- [ ] **Step 1: Write the failing test**

`atlas/tests/load.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { chooseBundle } from '../src/lib/load.js'

const fixture = JSON.parse(
  readFileSync(fileURLToPath(new URL('../src/fixtures/atlas.fixture.json', import.meta.url)), 'utf8'),
)
const empty = { generated: '2026-01-01T00:00:00.000Z', languages: [], initiatives: [], methods: [], papers: [] }

describe('chooseBundle', () => {
  it('uses the fixture in development when there is no real bundle', () => {
    const b = chooseBundle({ real: null, fixture, isProduction: false })
    expect(b.languages).toHaveLength(5)
  })

  it('prefers the real bundle when one exists', () => {
    const b = chooseBundle({ real: { ...empty, languages: [fixture.languages[0]] }, fixture, isProduction: false })
    expect(b.languages).toHaveLength(1)
  })

  it('refuses to build with no real bundle', () => {
    expect(() => chooseBundle({ real: null, fixture, isProduction: true }))
      .toThrow(/src\/data\/atlas\.json/)
  })

  it('refuses to build from a bundle with no records', () => {
    expect(() => chooseBundle({ real: empty, fixture, isProduction: true }))
      .toThrow(/no verified records/i)
  })

  it('never silently substitutes the fixture in production', () => {
    try {
      chooseBundle({ real: null, fixture, isProduction: true })
      throw new Error('should have thrown')
    } catch (e) {
      expect((e as Error).message).not.toMatch(/fixture/i)
    }
  })

  it('rejects a bundle whose records do not match the schema', () => {
    const bad = { ...empty, languages: [{ id: 'nope' }] }
    expect(() => chooseBundle({ real: bad, fixture, isProduction: true })).toThrow()
  })
})
```

- [ ] **Step 2: Run and verify it fails**

Run: `pnpm vitest run tests/load.test.ts`
Expected: FAIL — cannot resolve `../src/lib/load.js`.

- [ ] **Step 3: Write it**

`atlas/src/lib/load.ts`:
```ts
import { z } from 'zod'
import {
  InitiativeSchema, LanguageSchema, MethodSchema, PaperSchema,
  type Initiative, type Language, type Method, type Paper,
} from '../schema/index.js'

export interface AtlasBundle {
  generated: string
  languages: Language[]
  initiatives: Initiative[]
  methods: Method[]
  papers: Paper[]
}

const BundleSchema = z.object({
  generated: z.string(),
  languages: z.array(LanguageSchema),
  initiatives: z.array(InitiativeSchema),
  methods: z.array(MethodSchema),
  papers: z.array(PaperSchema),
})

/** Pure. `real` is the generated bundle or null when it does not exist.
 *  In production a missing or empty bundle is a BUILD FAILURE, never a silent
 *  fallback to the fixture — SP0's gate ships only verified records, so an
 *  empty bundle means nothing has been reviewed yet. */
export function chooseBundle(opts: {
  real: unknown | null
  fixture: unknown
  isProduction: boolean
}): AtlasBundle {
  const { real, fixture, isProduction } = opts

  if (isProduction) {
    if (real === null) {
      throw new Error(
        'No bundle at src/data/atlas.json. Run `pnpm build:data` — it exits non-zero ' +
          'while any record is still status: draft, which is the point.',
      )
    }
    const parsed = BundleSchema.parse(real)
    if (parsed.languages.length === 0 && parsed.initiatives.length === 0) {
      throw new Error(
        'src/data/atlas.json contains no verified records. A page built from it would ' +
          'show an empty map. Review the queue in data/REVIEW-QUEUE.md first.',
      )
    }
    return parsed
  }

  return BundleSchema.parse(real ?? fixture)
}
```

The production branch never mentions the fixture, so a build cannot quietly ship placeholder data — that is what the fifth test pins.

- [ ] **Step 4: Add the module-level glue**

Append to `atlas/src/lib/load.ts`:
```ts
/** Vite resolves this at build time; the glob is empty when the gitignored
 *  bundle has not been generated, which is the normal state of a fresh clone. */
const realModules = import.meta.glob('../data/*.json', { eager: true, import: 'default' })
const fixtureModule = await import('../fixtures/atlas.fixture.json')

export function loadBundle(): AtlasBundle {
  const entry = Object.entries(realModules).find(([path]) => path.endsWith('/atlas.json'))
  const real = entry?.[1] ?? null
  return chooseBundle({
    real,
    fixture: fixtureModule.default,
    isProduction: import.meta.env.PROD,
  })
}
```

- [ ] **Step 5: Verify**

```bash
pnpm test        # 90
pnpm typecheck
```

Report the number if it is not 85 rather than adjusting a test.

- [ ] **Step 6: Commit**

```bash
cd .. && git add atlas && git commit -m "feat(atlas): bundle loading that refuses to build from an empty dataset"
```

---

### Task 5: `confidence.ts` — the pure trust rule

One tiny module, its own task, because every visual decision in this app keys off it and it must be impossible to get wrong by reading prose.

**Files:**
- Create: `atlas/src/lib/confidence.ts`
- Test: `atlas/tests/confidence.test.ts`

**Interfaces:**
- Consumes: `LocationConfidence` from `../schema/index.js`.
- Produces: `type Sited = 'sourced' | 'approximate' | 'absent'` and
  `locationConfidence(loc: { confidence: LocationConfidence } | null | undefined): Sited`.

- [ ] **Step 1: Write the failing test**

`atlas/tests/confidence.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { locationConfidence } from '../src/lib/confidence.js'

describe('locationConfidence', () => {
  it('reports a sourced location', () => {
    expect(locationConfidence({ confidence: 'sourced' })).toBe('sourced')
  })

  it('reports an approximate location', () => {
    expect(locationConfidence({ confidence: 'approximate' })).toBe('approximate')
  })

  it('reports absent for null', () => {
    expect(locationConfidence(null)).toBe('absent')
  })

  it('reports absent for undefined', () => {
    expect(locationConfidence(undefined)).toBe('absent')
  })
})
```

- [ ] **Step 2: Run and verify it fails**

Run: `pnpm vitest run tests/confidence.test.ts`
Expected: FAIL — cannot resolve `../src/lib/confidence.js`.

- [ ] **Step 3: Write it**

`atlas/src/lib/confidence.ts`:
```ts
import type { LocationConfidence } from '../schema/index.js'

/** How the map should treat a coordinate. `absent` means there is no
 *  coordinate at all — the record still exists and is still listed, it just
 *  cannot be drawn. */
export type Sited = 'sourced' | 'approximate' | 'absent'

/** Reads the schema field ONLY. Never inspect `caveat` to decide this: a
 *  caveat may be about speaker counts rather than location, and treating one
 *  as the other would mark a well-sited pin untrustworthy. */
export function locationConfidence(
  loc: { confidence: LocationConfidence } | null | undefined,
): Sited {
  if (loc === null || loc === undefined) return 'absent'
  return loc.confidence
}
```

- [ ] **Step 4: Verify and commit**

```bash
pnpm test                                  # 94
pnpm vitest run tests/confidence.test.ts   # 4 PASS
cd .. && git add atlas && git commit -m "feat(atlas): pure location-confidence rule"
```

---

### Task 6: `layers.ts` — records to GeoJSON

The substance of the map, kept pure so it is testable with no browser and no map instance.

**Files:**
- Create: `atlas/src/map/layers.ts`
- Test: `atlas/tests/layers.test.ts`

**Interfaces:**
- Consumes: `AtlasBundle` from `../lib/load.js`; `locationConfidence` from `../lib/confidence.js`.
- Produces:
  - `interface PointCollection { type: 'FeatureCollection'; features: { type: 'Feature'; id: string; properties: Record<string, string | number | boolean | null>; geometry: { type: 'Point'; coordinates: [number, number] } }[] }`
  - `languageFields(languages: Language[]): PointCollection`
  - `initiativeSites(initiatives: Initiative[]): PointCollection`
  - `unmappedLanguages(languages: Language[]): { notMapped: Language[]; approximate: Language[] }`

- [ ] **Step 1: Write the failing test**

`atlas/tests/layers.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { initiativeSites, languageFields, unmappedLanguages } from '../src/map/layers.js'
import { InitiativeSchema, LanguageSchema } from '../src/schema/index.js'

const raw = JSON.parse(
  readFileSync(fileURLToPath(new URL('../src/fixtures/atlas.fixture.json', import.meta.url)), 'utf8'),
)
const languages = raw.languages.map((l: unknown) => LanguageSchema.parse(l))
const initiatives = raw.initiatives.map((i: unknown) => InitiativeSchema.parse(i))

describe('languageFields', () => {
  const fc = languageFields(languages)

  it('emits a feature only for a language that has a centre', () => {
    expect(fc.features).toHaveLength(3)
    expect(fc.features.map((f) => f.id).sort())
      .toEqual(['fixture-approximate', 'fixture-conflict', 'fixture-sourced'])
  })

  it('omits adjacent-tier languages, which carry no centre by D5', () => {
    expect(fc.features.map((f) => f.id)).not.toContain('fixture-adjacent')
  })

  it('omits a language whose centre is null rather than placing it at 0,0', () => {
    expect(fc.features.map((f) => f.id)).not.toContain('fixture-unmapped')
  })

  it('carries confidence as a property the map style can key on', () => {
    const approx = fc.features.find((f) => f.id === 'fixture-approximate')
    expect(approx?.properties['confidence']).toBe('approximate')
    const sourced = fc.features.find((f) => f.id === 'fixture-sourced')
    expect(sourced?.properties['confidence']).toBe('sourced')
  })

  it('writes coordinates in GeoJSON order, lon then lat', () => {
    const f = fc.features.find((x) => x.id === 'fixture-sourced')
    expect(f?.geometry.coordinates).toEqual([-73.6, 45.5])
  })
})

describe('initiativeSites', () => {
  const fc = initiativeSites(initiatives)

  it('emits every initiative, since site is never null', () => {
    expect(fc.features).toHaveLength(3)
  })

  it('carries tier so the style can draw adjacent pins hollow', () => {
    const adj = fc.features.find((f) => f.id === 'fixture-adjacent-init')
    expect(adj?.properties['tier']).toBe('adjacent')
  })

  it('carries confidence so an approximate site can be drawn out of focus', () => {
    const adj = fc.features.find((f) => f.id === 'fixture-adjacent-init')
    expect(adj?.properties['confidence']).toBe('approximate')
  })

  it('carries whether the initiative has ended', () => {
    expect(fc.features.find((f) => f.id === 'fixture-ended')?.properties['ended']).toBe(2021)
    expect(fc.features.find((f) => f.id === 'fixture-ongoing')?.properties['ended']).toBeNull()
  })
})

describe('unmappedLanguages', () => {
  const { notMapped, approximate } = unmappedLanguages(languages)

  it('lists languages with no centre, so a gap is stated rather than invisible', () => {
    expect(notMapped.map((l) => l.id).sort()).toEqual(['fixture-adjacent', 'fixture-unmapped'])
  })

  it('lists languages drawn but not to be trusted', () => {
    expect(approximate.map((l) => l.id)).toEqual(['fixture-approximate'])
  })

  it('never lists a language in both groups', () => {
    const overlap = notMapped.filter((n) => approximate.some((a) => a.id === n.id))
    expect(overlap).toEqual([])
  })
})
```

- [ ] **Step 2: Run and verify it fails**

Run: `pnpm vitest run tests/layers.test.ts`
Expected: FAIL — cannot resolve `../src/map/layers.js`.

- [ ] **Step 3: Write it**

`atlas/src/map/layers.ts`:
```ts
import type { Initiative, Language } from '../schema/index.js'
import { locationConfidence } from '../lib/confidence.js'

export interface PointFeature {
  type: 'Feature'
  id: string
  properties: Record<string, string | number | boolean | null>
  geometry: { type: 'Point'; coordinates: [number, number] }
}

export interface PointCollection {
  type: 'FeatureCollection'
  features: PointFeature[]
}

const collection = (features: PointFeature[]): PointCollection => ({
  type: 'FeatureCollection',
  features,
})

/** One point per language that has a centre. A language without one is NOT
 *  placed at a default coordinate — it is omitted here and surfaced by
 *  `unmappedLanguages`, so a gap in the data reads as a gap. */
export function languageFields(languages: Language[]): PointCollection {
  return collection(
    languages
      .filter((l) => l.centre !== null)
      .map((l) => ({
        type: 'Feature' as const,
        id: l.id,
        properties: {
          id: l.id,
          name: l.name,
          tier: l.tier,
          confidence: locationConfidence(l.centre),
        },
        geometry: { type: 'Point' as const, coordinates: [l.centre!.lon, l.centre!.lat] as [number, number] },
      })),
  )
}

/** One point per initiative. `site` is not nullable, so every initiative is
 *  drawn — but an `approximate` one is drawn out of focus. */
export function initiativeSites(initiatives: Initiative[]): PointCollection {
  return collection(
    initiatives.map((i) => ({
      type: 'Feature' as const,
      id: i.id,
      properties: {
        id: i.id,
        name: i.name,
        tier: i.tier,
        kind: i.kind,
        confidence: locationConfidence(i.site),
        started: i.started,
        ended: i.ended,
      },
      geometry: { type: 'Point' as const, coordinates: [i.site.lon, i.site.lat] as [number, number] },
    })),
  )
}

/** What the map cannot show faithfully. Rendered beside it so a reader can
 *  tell "we found nothing" from "there is nothing". */
export function unmappedLanguages(languages: Language[]): {
  notMapped: Language[]
  approximate: Language[]
} {
  return {
    notMapped: languages.filter((l) => locationConfidence(l.centre) === 'absent'),
    approximate: languages.filter((l) => locationConfidence(l.centre) === 'approximate'),
  }
}
```

- [ ] **Step 4: Verify and commit**

```bash
pnpm test        # 106
pnpm typecheck
cd .. && git add atlas && git commit -m "feat(atlas): pure record-to-GeoJSON derivation"
```

Report the number if it is not 106.

---

### Task 7: The map

MapLibre is imperative and React owns state. One hook owns the map; data flows through `source.setData()`.

**Files:**
- Create: `atlas/src/map/style.ts`, `atlas/src/map/useMap.ts`, `atlas/src/components/MapView.tsx`
- Test: `atlas/tests/style.test.ts`

**Interfaces:**
- Consumes: `PointCollection` from `../map/layers.js`.
- Produces:
  - from `style.ts`: `BASEMAP_STYLE` (a MapLibre style object) and `LAYERS` — an array of MapLibre layer specs, plus `SOURCE_LANGUAGES = 'language-fields'` and `SOURCE_INITIATIVES = 'initiative-sites'`.
  - from `useMap.ts`: `useMap(container, data)` where `data` is `{ languages: PointCollection; initiatives: PointCollection; selectedLanguageId: string | null }`.
  - from `MapView.tsx`: `MapView` — props `{ languages, initiatives, selectedLanguageId, onSelectLanguage, onSelectInitiative }`.

- [ ] **Step 1: Write the failing style test**

The style is data, so it is testable without a browser. `atlas/tests/style.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { BASEMAP_STYLE, LAYERS, SOURCE_INITIATIVES, SOURCE_LANGUAGES } from '../src/map/style.js'

const byId = (id: string) => LAYERS.find((l) => l.id === id)

describe('map style', () => {
  it('names a raster basemap with attribution, since CARTO requires it', () => {
    const src = BASEMAP_STYLE.sources['basemap'] as { attribution?: string }
    expect(src.attribution).toMatch(/carto/i)
  })

  it('draws language fields as a heavily blurred circle, not a heatmap or a polygon', () => {
    const l = byId('language-field')
    expect(l?.type).toBe('circle')
    expect(l?.source).toBe(SOURCE_LANGUAGES)
    expect(Number(l?.paint?.['circle-blur'])).toBeGreaterThanOrEqual(1)
  })

  it('desaturates an approximate language field rather than blurring it further', () => {
    const l = byId('language-field')
    expect(JSON.stringify(l?.paint?.['circle-color'])).toMatch(/approximate/)
    expect(typeof l?.paint?.['circle-blur']).toBe('number')
  })

  it('draws initiative pins crisp when sourced and blurred when approximate', () => {
    const l = byId('initiative-site')
    expect(l?.source).toBe(SOURCE_INITIATIVES)
    expect(JSON.stringify(l?.paint?.['circle-blur'])).toMatch(/approximate/)
  })

  it('draws adjacent-tier pins hollow so tier reads without a legend', () => {
    const l = byId('initiative-site')
    expect(JSON.stringify(l?.paint?.['circle-opacity'])).toMatch(/adjacent/)
  })

  it('separates selection into its own layer over the same source', () => {
    const sel = byId('language-field-selected')
    expect(sel?.source).toBe(SOURCE_LANGUAGES)
    expect(JSON.stringify(sel?.filter)).toMatch(/id/)
  })
})
```

The third and fifth tests are the spec's §4 constraint made executable: an approximate field must differ by **colour**, and the pin's blur must be driven by `confidence`. If someone later makes a field's blur depend on confidence, test three fails.

- [ ] **Step 2: Run and verify it fails**

Run: `pnpm vitest run tests/style.test.ts`
Expected: FAIL — cannot resolve `../src/map/style.js`.

- [ ] **Step 3: Write the style**

`atlas/src/map/style.ts`:
```ts
import type { CircleLayerSpecification, StyleSpecification } from 'maplibre-gl'

export const SOURCE_LANGUAGES = 'language-fields'
export const SOURCE_INITIATIVES = 'initiative-sites'

const INK = '#5b7a8c'
const ACCENT = '#c2703d'
const MUTED = '#9aa5ab'

export const BASEMAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    basemap: {
      type: 'raster',
      tiles: ['https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors © CARTO',
    },
  },
  layers: [{ id: 'basemap', type: 'raster', source: 'basemap' }],
}

/** Spec §4: each channel carries exactly ONE meaning.
 *  - A language field is ALWAYS heavily blurred. That softness is the
 *    "no boundary claim" statement; it never encodes confidence or size.
 *  - An approximate CENTRE differs by COLOUR (desaturated), never by blur.
 *  - An approximate SITE differs by BLUR — the pin is literally out of focus.
 *  - Tier is fill vs hollow on pins. */
/** All three are circle layers, typed concretely so `paint['circle-blur']` is
 *  reachable without a union narrowing dance in both the style and its test. */
export const LAYERS: CircleLayerSpecification[] = [
  {
    id: 'language-field',
    type: 'circle',
    source: SOURCE_LANGUAGES,
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 18, 6, 60, 10, 160],
      'circle-blur': 1.2,
      'circle-opacity': 0.35,
      'circle-color': ['match', ['get', 'confidence'], 'approximate', MUTED, INK],
    },
  },
  {
    id: 'language-field-selected',
    type: 'circle',
    source: SOURCE_LANGUAGES,
    filter: ['==', ['get', 'id'], ''],
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 18, 6, 60, 10, 160],
      'circle-blur': 1.2,
      'circle-opacity': 0.55,
      'circle-color': ACCENT,
    },
  },
  {
    id: 'initiative-site',
    type: 'circle',
    source: SOURCE_INITIATIVES,
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 4, 8, 9],
      'circle-blur': ['match', ['get', 'confidence'], 'approximate', 0.9, 0],
      'circle-color': ['match', ['get', 'confidence'], 'approximate', MUTED, INK],
      'circle-opacity': ['match', ['get', 'tier'], 'adjacent', 0.15, 0.95],
      'circle-stroke-width': 1.5,
      'circle-stroke-color': ['match', ['get', 'confidence'], 'approximate', MUTED, INK],
    },
  },
]
```

- [ ] **Step 4: Write the hook**

`atlas/src/map/useMap.ts`:
```ts
import maplibregl, { type Map as MapLibreMap } from 'maplibre-gl'
import { useEffect, useRef } from 'react'
import type { PointCollection } from './layers.js'
import { BASEMAP_STYLE, LAYERS, SOURCE_INITIATIVES, SOURCE_LANGUAGES } from './style.js'

const EMPTY: PointCollection = { type: 'FeatureCollection', features: [] }

export interface MapData {
  languages: PointCollection
  initiatives: PointCollection
  selectedLanguageId: string | null
}

export interface MapHandlers {
  onSelectLanguage: (id: string | null) => void
  onSelectInitiative: (id: string | null) => void
}

/** Creates the map once. Data changes go through `setData` and `setFilter` —
 *  never by removing and re-adding layers, which flickers and leaks handlers. */
export function useMap(
  container: React.RefObject<HTMLDivElement | null>,
  data: MapData,
  handlers: MapHandlers,
): void {
  const mapRef = useRef<MapLibreMap | null>(null)
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  useEffect(() => {
    if (!container.current || mapRef.current) return
    const map = new maplibregl.Map({
      container: container.current,
      style: BASEMAP_STYLE,
      center: [-40, 25],
      zoom: 1.6,
    })
    mapRef.current = map

    map.on('load', () => {
      map.addSource(SOURCE_LANGUAGES, { type: 'geojson', data: EMPTY })
      map.addSource(SOURCE_INITIATIVES, { type: 'geojson', data: EMPTY })
      for (const layer of LAYERS) map.addLayer(layer)

      map.on('click', 'initiative-site', (e) => {
        const id = e.features?.[0]?.properties?.['id']
        handlersRef.current.onSelectInitiative(typeof id === 'string' ? id : null)
      })
      map.on('click', 'language-field', (e) => {
        const id = e.features?.[0]?.properties?.['id']
        handlersRef.current.onSelectLanguage(typeof id === 'string' ? id : null)
      })
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [container])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return
    ;(map.getSource(SOURCE_LANGUAGES) as maplibregl.GeoJSONSource | undefined)?.setData(data.languages)
    ;(map.getSource(SOURCE_INITIATIVES) as maplibregl.GeoJSONSource | undefined)?.setData(data.initiatives)
    map.setFilter('language-field-selected', ['==', ['get', 'id'], data.selectedLanguageId ?? ''])
  }, [data])
}
```

`handlersRef` exists so the click handlers always see current callbacks without the map being torn down and rebuilt whenever a parent re-renders — that teardown is the usual source of flicker in React/MapLibre integrations.

- [ ] **Step 5: Write MapView**

`atlas/src/components/MapView.tsx`:
```tsx
import { useRef } from 'react'
import type { PointCollection } from '../map/layers.js'
import { useMap } from '../map/useMap.js'

export interface MapViewProps {
  languages: PointCollection
  initiatives: PointCollection
  selectedLanguageId: string | null
  onSelectLanguage: (id: string | null) => void
  onSelectInitiative: (id: string | null) => void
}

export default function MapView(props: MapViewProps): React.JSX.Element {
  const container = useRef<HTMLDivElement | null>(null)
  useMap(
    container,
    {
      languages: props.languages,
      initiatives: props.initiatives,
      selectedLanguageId: props.selectedLanguageId,
    },
    { onSelectLanguage: props.onSelectLanguage, onSelectInitiative: props.onSelectInitiative },
  )
  return <div ref={container} role="application" aria-label="Map of Indigenous language NLP initiatives" style={{ position: 'absolute', inset: 0 }} />
}
```

- [ ] **Step 6: Verify and commit**

```bash
pnpm test        # 112
pnpm typecheck
pnpm build:app
cd .. && git add atlas && git commit -m "feat(atlas): MapLibre map with confidence-aware styling"
```

---

### Task 8: Panels and the unmapped list

Closes SP1a. The panels are where "we don't know" has to read as a statement rather than a blank.

**Files:**
- Create: `atlas/src/components/LanguagePanel.tsx`, `atlas/src/components/InitiativePanel.tsx`, `atlas/src/components/UnmappedList.tsx`, `atlas/src/components/Field.tsx`
- Modify: `atlas/src/components/App.tsx`
- Test: `atlas/tests/panels.test.tsx`

**Interfaces:**
- Consumes: `Language`, `Initiative`, `Method` types; `unmappedLanguages` from `../map/layers.js`.
- Produces: `Field` — props `{ label: string; testId: string; children?: React.ReactNode }`, rendering "not recorded" when `children` is null, undefined, an empty string, or an empty array. `LanguagePanel` — `{ language, initiatives }`. `InitiativePanel` — `{ initiative, methods }`. `UnmappedList` — `{ languages, onSelect }`.

- [ ] **Step 1: Write the failing test**

`atlas/tests/panels.test.tsx`:
```tsx
// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { InitiativeSchema, LanguageSchema, MethodSchema } from '../src/schema/index.js'
import LanguagePanel from '../src/components/LanguagePanel.js'
import InitiativePanel from '../src/components/InitiativePanel.js'
import UnmappedList from '../src/components/UnmappedList.js'

const raw = JSON.parse(
  readFileSync(fileURLToPath(new URL('../src/fixtures/atlas.fixture.json', import.meta.url)), 'utf8'),
)
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
```

- [ ] **Step 2: Run and verify it fails**

Run: `pnpm vitest run tests/panels.test.tsx`
Expected: FAIL — cannot resolve `../src/components/LanguagePanel.js`.

- [ ] **Step 3: Write `Field`, the "not recorded" rule in one place**

`atlas/src/components/Field.tsx`:
```tsx
export interface FieldProps {
  label: string
  testId: string
  children?: React.ReactNode
}

const isEmpty = (v: React.ReactNode): boolean =>
  v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0)

/** An absent value renders as the words "not recorded", never as a blank cell.
 *  A blank reads as "nothing to say"; the words say "we don't know". All five
 *  real languages have an empty typology because nobody would assert one
 *  without a citation — that distinction is why they were left empty. */
export default function Field({ label, testId, children }: FieldProps): React.JSX.Element {
  return (
    <div data-testid={testId}>
      <dt>{label}</dt>
      <dd>{isEmpty(children) ? <em>not recorded</em> : children}</dd>
    </div>
  )
}
```

- [ ] **Step 4: Write the two panels and the unmapped list**

`atlas/src/components/LanguagePanel.tsx`:
```tsx
import type { Initiative, Language } from '../schema/index.js'
import Field from './Field.js'

export default function LanguagePanel({
  language, initiatives,
}: { language: Language; initiatives: Initiative[] }): React.JSX.Element {
  const s = language.speakers
  return (
    <aside aria-label={`Language: ${language.name}`}>
      <h2>{language.name}</h2>
      <dl>
        <Field label="Also known as" testId="field-aka">{language.also_known_as.join(', ')}</Field>
        <Field label="Family" testId="field-family">{language.family}</Field>
        <Field label="Typology" testId="field-typology">{language.typology.join(', ')}</Field>
        <Field label="Endangerment" testId="field-endangerment">{language.endangerment?.status}</Field>
        <Field label="Speakers" testId="field-speakers">
          {s === null ? null : (
            <>
              <span>{s.value.toLocaleString('en')}</span>
              {s.conflicts.length > 0 && (
                <p>
                  Sources disagree. Also reported:{' '}
                  {s.conflicts.map((c) => c.value.toLocaleString('en')).join(', ')}
                </p>
              )}
            </>
          )}
        </Field>
        <Field label="Centre" testId="field-centre">
          {language.centre === null ? null : (
            <>
              {language.centre.lat.toFixed(2)}, {language.centre.lon.toFixed(2)}
              {language.centre.confidence === 'approximate' && <strong> — approximate</strong>}
            </>
          )}
        </Field>
        <Field label="Note" testId="field-caveat">{language.caveat}</Field>
        <Field label="Initiatives" testId="field-initiatives">
          {initiatives.length === 0 ? null : <ul>{initiatives.map((i) => <li key={i.id}>{i.name}</li>)}</ul>}
        </Field>
      </dl>
    </aside>
  )
}
```

`atlas/src/components/InitiativePanel.tsx`:
```tsx
import type { Initiative, Method } from '../schema/index.js'
import Field from './Field.js'

export default function InitiativePanel({
  initiative, methods,
}: { initiative: Initiative; methods: Method[] }): React.JSX.Element {
  const mine = methods.filter((m) => initiative.methods.includes(m.id))
  const years =
    initiative.started === null
      ? null
      : `${initiative.started}–${initiative.ended === null ? 'ongoing' : initiative.ended}`
  return (
    <aside aria-label={`Initiative: ${initiative.name}`}>
      <h2>{initiative.name}</h2>
      <dl>
        <Field label="Years" testId="field-years">{years}</Field>
        <Field label="Applications" testId="field-applications">{initiative.applications.join(', ')}</Field>
        <Field label="Methods" testId="field-methods">
          {mine.length === 0 ? null : (
            <ul>{mine.map((m) => <li key={m.id}><a href={m.doc_url}>{m.name}</a></li>)}</ul>
          )}
        </Field>
        <Field label="Models" testId="field-models">{initiative.models.join(', ')}</Field>
        <Field label="Governance" testId="field-governance">{initiative.governance?.posture}</Field>
        <Field label="Location" testId="field-site">
          {initiative.site.place}
          {initiative.site.confidence === 'approximate' && <strong> — approximate</strong>}
        </Field>
        <Field label="Note" testId="field-caveat">{initiative.caveat}</Field>
        {initiative.transferability !== null && (
          <Field label="Does this transfer?" testId="field-transferability">
            <p>{initiative.transferability.note}</p>
            <p>Transfers: {initiative.transferability.transfers.join(', ')}</p>
            <p>Does not transfer: {initiative.transferability.does_not_transfer.join(', ')}</p>
          </Field>
        )}
      </dl>
    </aside>
  )
}
```

`atlas/src/components/UnmappedList.tsx`:
```tsx
import type { Language } from '../schema/index.js'
import { unmappedLanguages } from '../map/layers.js'

/** States the coverage gap instead of hiding it: without this, a language with
 *  no centre is simply invisible and a reader cannot tell "we found nothing"
 *  from "there is nothing". */
export default function UnmappedList({
  languages, onSelect,
}: { languages: Language[]; onSelect: (id: string) => void }): React.JSX.Element {
  const { notMapped, approximate } = unmappedLanguages(languages)
  return (
    <section aria-label="Languages the map cannot show faithfully">
      <div data-testid="group-not-mapped">
        <h3>Not mapped ({notMapped.length})</h3>
        <ul>
          {notMapped.map((l) => (
            <li key={l.id}>
              <button type="button" onClick={() => onSelect(l.id)}>{l.name}</button>
              {l.tier === 'adjacent' && <span> — adjacent tier, never mapped</span>}
            </li>
          ))}
        </ul>
      </div>
      <div data-testid="group-approximate">
        <h3>Approximate location ({approximate.length})</h3>
        <ul>
          {approximate.map((l) => (
            <li key={l.id}>
              <button type="button" onClick={() => onSelect(l.id)}>{l.name}</button>
              {l.caveat !== null && <p>{l.caveat}</p>}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
```

- [ ] **Step 5: Wire App together**

Replace `atlas/src/components/App.tsx`:
```tsx
import { useMemo, useState } from 'react'
import { loadBundle } from '../lib/load.js'
import { initiativeSites, languageFields } from '../map/layers.js'
import MapView from './MapView.js'
import LanguagePanel from './LanguagePanel.js'
import InitiativePanel from './InitiativePanel.js'
import UnmappedList from './UnmappedList.js'

export default function App(): React.JSX.Element {
  const bundle = useMemo(() => loadBundle(), [])
  const [languageId, setLanguageId] = useState<string | null>(null)
  const [initiativeId, setInitiativeId] = useState<string | null>(null)

  const language = bundle.languages.find((l) => l.id === languageId) ?? null
  const initiative = bundle.initiatives.find((i) => i.id === initiativeId) ?? null

  return (
    <main>
      <h1>Atlas of Indigenous Language NLP</h1>
      <MapView
        languages={languageFields(bundle.languages)}
        initiatives={initiativeSites(bundle.initiatives)}
        selectedLanguageId={languageId}
        onSelectLanguage={(id) => { setLanguageId(id); setInitiativeId(null) }}
        onSelectInitiative={(id) => { setInitiativeId(id); setLanguageId(null) }}
      />
      <UnmappedList languages={bundle.languages} onSelect={setLanguageId} />
      {language !== null && (
        <LanguagePanel
          language={language}
          initiatives={bundle.initiatives.filter((i) => i.languages.includes(language.id))}
        />
      )}
      {initiative !== null && <InitiativePanel initiative={initiative} methods={bundle.methods} />}
    </main>
  )
}
```

- [ ] **Step 6: Verify**

```bash
pnpm test        # 122
pnpm typecheck
pnpm build:app
pnpm build:data; echo "exit=$?"   # MUST still be 1 with 10 drafts
```

Report the number if `pnpm test` is not 122.

- [ ] **Step 7: Commit**

```bash
cd .. && git add atlas && git commit -m "feat(atlas): detail panels and the unmapped list

Closes SP1a. An absent value renders as 'not recorded' rather than as a
blank: a blank reads as nothing to say, the words say we don't know."
```

---

## Done when

- `pnpm test` (122) and `pnpm typecheck` are green; `pnpm build:app` produces `dist/`.
- `pnpm dev` serves a map rendering the fixture: three soft language fields, three initiative pins, one of each drawn as approximate.
- An approximate **centre** differs by colour; an approximate **site** differs by blur. Neither uses the other's channel.
- Languages the map cannot show faithfully are listed beside it, with adjacent-tier entries labelled as tier-excluded rather than as gaps.
- `pnpm build:data` still exits 1 listing 10 drafts — no record was promoted.

## Explicitly NOT in SP1a

- Facets, the range timeline, the table view, URL state — SP1b, spec written against this working map.
- Clustering at low zoom, hover tooltips, and legend chrome — deliberately deferred; they are polish on a map that does not exist yet.
- Deployment, the Zenodo DOI, and the stale Docusaurus references in `AGENTS.md` and `docs/README.md` — SP2.
