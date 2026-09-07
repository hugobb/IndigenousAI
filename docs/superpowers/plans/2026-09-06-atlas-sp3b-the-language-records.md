# SP3b — The Language Records Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Source the ~30 remaining language records the corpus actually studies, and widen `data/paper-languages.yml` so the literature reaches them — taking the map from 2 pins to roughly a dozen.

**Architecture:** Records are hand-curated YAML in `atlas/data/languages/`, each field either sourced with a verbatim quote or left `null`. Glottolog's JSON endpoint supplies glottocode, ISO 639-3, family and coordinates; a committed resolution file records exactly what was fetched, and a guard checks every record against it so a transcription slip or a family-code-in-a-language-field cannot pass silently. Mappings gain the ability to carry more than one evidential quote per paper, which is what D7's shared tasks require.

**Tech Stack:** TypeScript strict, Zod 3, js-yaml, Vitest 2, Node 22.22.2, pnpm 11.

**Spec:** `docs/superpowers/specs/2026-09-05-atlas-sp3-papers-on-the-map-design.md` — read D1–D5 for the machinery SP3a built, and **D6–D9 for this sub-project's rules**.

## Global Constraints

- **Never promote a record to `status: verified`.** Promotion is the maintainer's signature. Every record and mapping this plan creates ships at `status: draft`.
- **Never fabricate a value.** Unknown is `null` and reads "not recorded"; a known absence reads as what we know. An unsourced field is `null`, never a plausible guess.
- **Never invent a destination.** No coordinate that is not quoted from a fetched Glottolog response.
- `pnpm build:data` and `pnpm build:app` must both keep **exiting non-zero** while any record is `draft`. That refusal is the feature; do not "fix" it.
- **Never edit** `litterature_review/`, `docs/docs/`, or `atlas/src/data/**`. `atlas/data/derived/**` is generator output — never hand-edit.
- `ATLAS_ALLOW_NO_BUNDLE=1` is a compile-check escape, never a deploy path.
- **Never run `pnpm approve-builds`** — it overwrites `atlas/pnpm-workspace.yaml`.
- Node is off PATH: `export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"` before any command.
- Work in the worktree `.worktrees/atlas-sp3b` on branch `feat/atlas-sp3b`. All paths below are relative to `atlas/` unless stated otherwise.
- A guard nobody has watched fail is not yet a guard. Every guard added here gets a unit test over an in-memory fixture that is **watched failing** before the production path is wired up.

## The evidence rules (from the spec — every mapping obeys all three)

1. **LOCATION rule (D2).** The quote must come from the paper's own subject matter: its title, its header block, or a section **before** `## Relevance to Indigenous AI`. `validate.ts` and `tests/paper-mappings.test.ts` both refuse a quote from the relevance section. 86 of 92 summaries name Mohawk there.
2. **STUDIES rule (D2, curator judgment).** Passing the location rule does not make a quote evidence the paper *studies* the language. A mapping asserts the paper builds for it, runs experiments on it, or takes it as its subject. A typological example, a comparison, a speaker-count illustration or a passing artifact mention is **not enough**. Ambiguity means **omit**.
3. **SURVEY rule (D7).** A shared task maps to every language it reports measured results for. A survey maps to **none**, however many it names.

## File Structure

| File | Responsibility |
| --- | --- |
| `data/glottolog-resolution.yml` | **New, curated.** One row per resolved language name: what was searched, the glottocode chosen, and the `name`/`level`/`latitude`/`longitude`/`iso639-3` Glottolog returned. The audit trail for D9's silent-failure step. |
| `data/languages/<id>.yml` | **New, ~30 records.** One per language, all `status: draft`. |
| `data/paper-languages.yml` | **Extended.** Gains mappings; gains the ability to hold several entries per paper. |
| `data/REVIEW-QUEUE.md` | **Extended.** What was and was not sourced, per record — what the maintainer reviews from. |
| `src/lib/record-guards.ts` | **New.** Pure guards: cover-term records must explain themselves; records must agree with the resolution file. |
| `src/lib/paper-map.ts` | **Modified.** `unmappedPapers` must aggregate a paper's languages across entries instead of overwriting. |
| `scripts/lib/load-glottolog-resolution.ts` | **New.** Loader + Zod schema for the resolution file. |
| `scripts/validate.ts` | **Modified.** Per-pair duplicate rule; new guards wired in. |
| `tests/*.test.ts` | Unit tests per guard over fixtures, plus assertions over the real records. |

---

### Task 1: Let one paper carry several evidential quotes

D7 requires it and the current code forbids it three different ways. `gibert-et-al-2025-americas-nlp` names Bribri, Guarani, Maya and Nahuatl in one sentence and Quechua and Rarámuri in another — there is no single quote covering all six, and inventing one would violate the location rule. This task must land before any mapping is written.

**The latent defect this fixes:** `unmappedPapers` builds `new Map(input.paperLanguages.map((m) => [m.paper, m.languages]))`. With two entries for one paper the second **silently overwrites** the first, so a paper mapped to a drawn language by entry 1 and an undrawn one by entry 2 would be reported by whichever came last. Nothing currently catches this because nothing currently produces two entries.

**Files:**
- Modify: `src/lib/paper-map.ts` (`unmappedPapers`)
- Modify: `scripts/validate.ts:102` (the duplicate rule) and its mapping error messages
- Modify: `tests/paper-mappings.test.ts` (the `names each paper at most once` case)
- Test: `tests/paper-map.test.ts`, `tests/validate.test.ts`

**Interfaces:**
- Consumes: `PaperLanguage` from `src/schema/paper-language.ts` (unchanged — the schema already allows repeats; only the guards forbade them).
- Produces: the invariant later tasks rely on — **a (paper, language) PAIR is unique; a paper id is not.**

- [ ] **Step 1: Write the failing test for aggregation**

In `tests/paper-map.test.ts`, add to the `unmappedPapers` describe block:

The file already defines exactly three helpers, and this task adds none:
`paper(id)`, `lang(id, mapped)` — `mapped: true` gives it a centre — and
`map(paper, languages, note?)`. Use them as they are; do not introduce a
parallel set.

```ts
it('aggregates a paper’s languages across several entries rather than overwriting', () => {
  // D7: a shared task needs one entry per quote. `drawn` has a centre and
  // `undrawn` does not, so if the second entry overwrites the first the paper
  // is wrongly reported as languageNotMapped.
  const result = unmappedPapers({
    papers: [paper('shared-task')],
    languages: [lang('drawn', true), lang('undrawn', false)],
    paperLanguages: [map('shared-task', ['undrawn']), map('shared-task', ['drawn'])],
  })
  expect(result.languageNotMapped).toEqual([])
  expect(result.noLanguage).toEqual([])
})

it('reports a paper as languageNotMapped only when NO entry names a drawn language', () => {
  const result = unmappedPapers({
    papers: [paper('shared-task')],
    languages: [lang('undrawn', false), lang('also-undrawn', false)],
    paperLanguages: [map('shared-task', ['undrawn']), map('shared-task', ['also-undrawn'])],
  })
  expect(result.languageNotMapped.map((x) => x.paper.id)).toEqual(['shared-task'])
  // Both languages travel to the UI, not just the last entry’s.
  expect(result.languageNotMapped[0]?.languages.map((l) => l.id).sort()).toEqual(['also-undrawn', 'undrawn'])
})
```

- [ ] **Step 2: Run the tests and watch them fail**

```bash
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"
cd atlas && pnpm vitest run tests/paper-map.test.ts
```

Expected: the first new case FAILS with `languageNotMapped` containing `shared-task` (the overwrite), and the second FAILS on the `languages` array holding only one entry. **If either passes already, stop and report** — the premise of this task is wrong and the controller must know.

- [ ] **Step 3: Make `unmappedPapers` aggregate**

Replace the `byPaper` construction and the per-paper lookup in `src/lib/paper-map.ts`:

```ts
  // A paper may carry SEVERAL entries — one per evidential quote (spec D7): a
  // shared task reports results for languages that no single sentence names
  // together, and the location rule forbids stitching one. Keyed assignment
  // (`new Map(rows.map((m) => [m.paper, m.languages]))`) silently kept only the
  // last entry, so a paper mapped to a drawn language by one quote and an
  // undrawn one by another was reported by whichever happened to come last.
  const byPaper = new Map<string, string[]>()
  for (const m of input.paperLanguages) {
    byPaper.set(m.paper, [...(byPaper.get(m.paper) ?? []), ...m.languages])
  }
```

and de-duplicate the language ids where they are resolved, so a language named by two of a paper's quotes is listed once:

```ts
    const langs = [...new Set(ids)]
      .map((id) => byId.get(id))
      .filter((l): l is Language => l !== undefined)
```

- [ ] **Step 4: Run the tests and watch them pass**

```bash
pnpm vitest run tests/paper-map.test.ts
```
Expected: PASS, with every pre-existing case in the file still passing.

- [ ] **Step 5: Move the duplicate rule from paper to pair**

In `scripts/validate.ts`, replace line 102's per-paper duplicate check:

```ts
  // A paper may appear several times — once per evidential quote (D7). What
  // must never repeat is a (paper, language) PAIR: two entries claiming the
  // same link would list the paper twice on one language panel and make the
  // second quote's evidence unfalsifiable, since either could satisfy the
  // check on its own.
  problems.push(
    ...findDuplicates(
      mappings.flatMap((m) => m.languages.map((l) => `${m.paper} -> ${l}`)),
      'paper mapping',
    ),
  )
```

- [ ] **Step 6: Disambiguate the mapping error messages**

Every message in `validate.ts` reading `mapping ${m.paper}:` now identifies a paper that may have several entries. Make each name the languages too, so a maintainer can tell which entry is at fault. Apply to the draft, unknown-paper, unknown-language and quote-provenance messages:

```ts
const where = (m: PaperLanguage): string => `mapping ${m.paper} -> [${m.languages.join(', ')}]`
```

For the quote checks driven by `input.paperLanguageQuotes`, add the mapped languages to the `paperLanguageQuotes` rows so the same phrasing is available there. Extend the row type to `{ paper: string; languages: string[]; where: QuoteProvenance | 'summary-unreadable'; summaryPath: string }` and populate `languages` where the rows are built (`validate.ts:181`).

- [ ] **Step 7: Update the mapping test's uniqueness case**

In `tests/paper-mappings.test.ts`, replace the `names each paper at most once` case:

```ts
  /** D7 lets a paper carry several entries, one per evidential quote. What may
   *  never repeat is the (paper, language) pair. */
  it('names each paper-language pair at most once', () => {
    const seen = new Set<string>()
    const dupes = rows
      .flatMap((r) => r.languages.map((l) => `${r.paper} -> ${l}`))
      .filter((k) => (seen.has(k) ? true : (seen.add(k), false)))
    expect(dupes).toEqual([])
  })
```

- [ ] **Step 8: Add a validate-level test for the pair rule**

In `tests/validate.test.ts`, following the file's existing `ValidateInput` builder convention (there are two builders in the repo — this file's and `tests/gate.test.ts`'s; update only this one):

```ts
it('accepts one paper carrying two entries with different languages', () => {
  const problems = validate(input({
    paperLanguages: [
      pl({ paper: 'p1', languages: ['a'], status: 'draft' }),
      pl({ paper: 'p1', languages: ['b'], status: 'draft' }),
    ],
  }))
  expect(problems.filter((p) => p.includes('duplicate'))).toEqual([])
})

it('refuses the same paper-language pair twice', () => {
  const problems = validate(input({
    paperLanguages: [
      pl({ paper: 'p1', languages: ['a'], status: 'draft' }),
      pl({ paper: 'p1', languages: ['a'], status: 'draft' }),
    ],
  }))
  expect(problems.some((p) => p.includes('p1 -> a'))).toBe(true)
})
```

- [ ] **Step 9: Run the full suite and typecheck**

```bash
pnpm test && pnpm typecheck
```
Expected: all green. Baseline before this task is 622 passing.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat(sp3b): let one paper carry several evidential quotes

D7 maps a shared task to every language it reports results for, but no
single sentence in the AmericasNLP summaries names all of them and the
location rule forbids stitching one. Uniqueness moves from the paper id to
the (paper, language) pair.

unmappedPapers keyed a Map by paper id, so a second entry silently
overwrote the first — a paper mapped to a drawn language by one quote and
an undrawn one by another was reported by whichever came last. It now
aggregates across entries and de-duplicates the ids.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Resolve every candidate name against Glottolog, and record what came back

D9 names this the one step that can fail silently: "Maya" matches ~86 languoids on Glottolog's search, "Nahuatl" ~144, "Quechua" ~185, and picking the wrong one produces a record that looks entirely correct. This task produces the audit trail; Task 3 turns it into a guard.

**Files:**
- Create: `data/glottolog-resolution.yml`
- Create: `scripts/lib/load-glottolog-resolution.ts`
- Create: `src/schema/glottolog-resolution.ts`
- Test: `tests/glottolog-resolution.test.ts`

**Interfaces:**
- Produces: `loadGlottologResolution(file): GlottologResolution[]` and the type
  ```ts
  interface GlottologResolution {
    searched: string          // the name as the CORPUS writes it, e.g. "Rarámuri"
    glottocode: string        // e.g. "cher1273"
    name: string              // Glottolog's own name, verbatim
    level: 'language' | 'family' | 'dialect'
    iso639_3: string | null
    latitude: number | null
    longitude: number | null
    classification: string[]  // outermost family first, verbatim `name` values
    retrieved: string         // YYYY-MM-DD
    note: string | null       // why this code, when the name was ambiguous
  }
  ```

**The 30 candidate names.** Measured 2026-09-06 across all 92 pre-Relevance heads, with D7 surveys already excluded. The count is **candidate papers, not mappings** — the studies rule will cut this substantially, as it cut SP3a's 11 candidates to 3. Do not treat these counts as a target.

| Name as the corpus writes it | Candidate papers |
| --- | --- |
| Cherokee | 1 |
| Seneca | 1 |
| Kanien'kéha *(record exists)* | 5 |
| Inuktitut | 4 |
| Inuinnaqtun | 2 |
| Inuktut | 2 |
| Innu-Aimun | 2 |
| SENĆOŦEN | 1 |
| Cree | 1 |
| Yupik | 2 |
| Aleut | 1 |
| Hawaiian | 3 |
| Nahuatl | 7 |
| Quechua | 4 |
| Aymara | 1 |
| Guarani | 6 |
| Bribri | 5 |
| Wixarika | 4 |
| Rarámuri | 2 |
| Shipibo-Konibo | 1 |
| Otomí | 1 |
| Chatino | 1 |
| Maya | 2 |
| Persian | 4 |
| Swahili | 1 |
| Yoruba | 2 |
| Wolof | 2 |
| Basque | 1 |
| Nepali | 2 |
| Manchu | 2 |
| Sundanese | 1 |

*Welsh was dropped: its only occurrence is in `mcgiff-and-nikolov-2025-low-resource`, a systematic review, which D7 excludes.*

- [ ] **Step 1: Fetch each candidate**

Resolve each name to a glottocode using Glottolog's search, then fetch the JSON:

```bash
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"
curl -sSL "https://glottolog.org/resource/languoid/id/<glottocode>.json"
```

The JSON carries `name`, `id`, `iso639-3`, `latitude`, `longitude`, `level`, `category` and `classification`. Verified working against `cher1273`, which returns `latitude: 35.4664, longitude: -83.163`.

**Two rules, both from D9:**
1. Record Glottolog's returned `name` beside the name the corpus used. If they differ (they will for `SENĆOŦEN` → Saanich, `Rarámuri` → Tarahumara), that is fine and is exactly what the row exists to show — but a `name` that looks unrelated to what was searched means the resolution is wrong.
2. Record `level` verbatim. **A `level: family` result means the name is a cover term and D8 applies.** Never substitute a family for a language.

Where a name is ambiguous and you pick a specific languoid, `note` must say why in one sentence. Where it cannot be resolved to a single languoid at all, record the family row with `level: family` and let D8 handle it — do not guess a member language.

Expected outcome, to be confirmed rather than assumed: roughly 11 resolve to `level: language` with coordinates, roughly 10 come back `level: family`, and the 8 adjacent names resolve to languages whose coordinates are recorded but **not used** (D6 forbids an adjacent centre).

- [ ] **Step 2: Write `data/glottolog-resolution.yml`**

One row per candidate. Header comment must state: what the file is, that it is the audit trail for D9's resolution step, that `latitude`/`longitude` are Glottolog's own published values quoted verbatim, and that a `level: family` row means D8 applies. Example rows:

```yaml
- searched: Cherokee
  glottocode: cher1273
  name: Cherokee
  level: language
  iso639_3: chr
  latitude: 35.4664
  longitude: -83.163
  classification: [Iroquoian]
  retrieved: "2026-09-06"
  note: null

- searched: Quechua
  glottocode: quec1387
  name: Quechuan
  level: family
  iso639_3: null
  latitude: null
  longitude: null
  classification: []
  retrieved: "2026-09-06"
  note: >-
    A cover term, not a language: Glottolog puts 43 languages under Quechuan and
    the corpus never narrows it to a variety. D8 applies — the record carries no
    centre and no glottocode.
```

- [ ] **Step 3: Write the schema and loader**

`src/schema/glottolog-resolution.ts` — a Zod object matching the interface above. `level` is `z.enum(['language', 'family', 'dialect'])`. `latitude`/`longitude` are `z.number().nullable()`; `iso639_3` is `z.string().length(3).nullable()`. `glottocode` uses the same `/^[a-z0-9]{4}\d{4}$/` pattern the language schema uses.

`scripts/lib/load-glottolog-resolution.ts` — mirror `load-paper-languages.ts` exactly: same `FileStatus` union (`'ok' | 'missing' | 'unreadable'`), same per-row `safeParse` with the row identified by `searched` in the error message, same "expected a YAML list" guard.

- [ ] **Step 4: Write the test**

`tests/glottolog-resolution.test.ts`:

```ts
describe('the Glottolog resolution record', () => {
  const rows = loadGlottologResolution(FILE)

  it('the file exists and is non-empty', () => {
    expect(glottologResolutionFileStatus(FILE)).toBe('ok')
    expect(rows.length).toBeGreaterThan(0)
  })

  it('resolves each searched name at most once', () => {
    const seen = new Set<string>()
    expect(rows.map((r) => r.searched).filter((s) => (seen.has(s) ? true : (seen.add(s), false)))).toEqual([])
  })

  it('gives every family-level row a note explaining the cover term (D8)', () => {
    expect(rows.filter((r) => r.level === 'family' && r.note === null).map((r) => r.searched)).toEqual([])
  })

  it('never records coordinates for a family-level row', () => {
    // Glottolog returns latitude: null for families — verified against
    // quec1387, azte1234, maya1287, chat1268, otom1299, tupi1275. A family row
    // carrying coordinates means they came from somewhere else.
    expect(rows.filter((r) => r.level === 'family' && (r.latitude !== null || r.longitude !== null))
      .map((r) => r.searched)).toEqual([])
  })
})
```

- [ ] **Step 5: Run it**

```bash
pnpm vitest run tests/glottolog-resolution.test.ts && pnpm typecheck
```
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(sp3b): record what Glottolog returned for every candidate name

D9 calls name-to-glottocode resolution the one step that can fail
silently: 'Maya' matches ~86 languoids, 'Quechua' ~185, and the wrong pick
produces a record that looks entirely correct. This file is the audit
trail, and Task 3 turns it into a guard over the records themselves.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Guard the records against the resolution, and make cover terms explain themselves

Two failure modes this closes. First, the language schema's `glottocode` pattern `/^[a-z0-9]{4}\d{4}$/` matches family codes as happily as language codes — `azte1234` passes — so a cover-term record could silently acquire a family code in a field that means "this language". Second, a coordinate transcribed by hand from a fetched response has nothing checking it against what was actually fetched.

**Files:**
- Create: `src/lib/record-guards.ts`
- Create: `tests/record-guards.test.ts`
- Modify: `scripts/validate.ts`
- Modify: `tests/validate.test.ts`

**Interfaces:**
- Consumes: `Language` from `src/schema/language.ts`, `GlottologResolution` from Task 2.
- Produces:
  ```ts
  export function coverTermProblems(languages: readonly Language[]): string[]
  export function resolutionProblems(
    languages: readonly Language[],
    resolution: readonly GlottologResolution[],
  ): string[]
  ```
  Both return one human-readable problem string per violation, empty when clean — the shape `validate.ts` already collects.

- [ ] **Step 1: Write the failing tests**

`tests/record-guards.test.ts`. This file has no helpers yet — define three local ones at the top, and
do not import the ones in `tests/paper-map.test.ts` (different shapes, and that file does not export them):

```ts
const src = (): Source => ({ kind: 'url', ref: 'https://glottolog.org/', retrieved: '2026-09-06', quote: 'q' })
const centre = (o: Partial<{ lat: number; lon: number }> = {}): Language['centre'] =>
  ({ lat: o.lat ?? 35.4664, lon: o.lon ?? -83.163, source: src(), confidence: 'sourced' })
/** Over LanguageSchema.parse so schema defaults fill in and the fixture cannot
 *  drift from the real record shape. */
const lang = (o: Partial<Language> & { id: string }): Language =>
  LanguageSchema.parse({ tier: 'indigenous', status: 'draft', ...o })
const res = (o: Partial<GlottologResolution> & { glottocode: string }): GlottologResolution => ({
  searched: o.glottocode, name: 'X', level: 'language', iso639_3: null,
  latitude: null, longitude: null, classification: [], retrieved: '2026-09-06', note: null, ...o,
})
```

```ts
describe('coverTermProblems', () => {
  it('accepts an indigenous record with a centre', () => {
    expect(coverTermProblems([lang({ id: 'a', tier: 'indigenous', centre: centre(), caveat: null })])).toEqual([])
  })

  it('refuses an indigenous record with no centre and no caveat', () => {
    // D8: a cover term has no centre. Without a caveat the reader cannot tell
    // a cover term from a language whose centre simply was not sourced, and
    // the panel prints "not mapped" for both.
    const problems = coverTermProblems([lang({ id: 'quechua', tier: 'indigenous', centre: null, caveat: null })])
    expect(problems).toHaveLength(1)
    expect(problems[0]).toContain('quechua')
  })

  it('accepts an indigenous record with no centre when it carries a caveat', () => {
    expect(coverTermProblems([
      lang({ id: 'quechua', tier: 'indigenous', centre: null, caveat: 'A cover term spanning 43 Glottolog languages.' }),
    ])).toEqual([])
  })

  it('does not require a caveat of an adjacent record', () => {
    // D6 gives every adjacent record centre: null by rule, so requiring a
    // caveat there would demand an explanation of the rule on every row.
    expect(coverTermProblems([lang({ id: 'persian', tier: 'adjacent', centre: null, caveat: null })])).toEqual([])
  })
})

describe('resolutionProblems', () => {
  const cherokee = res({ searched: 'Cherokee', glottocode: 'cher1273', level: 'language', latitude: 35.4664, longitude: -83.163 })

  it('accepts a record whose glottocode and centre match the resolution', () => {
    expect(resolutionProblems(
      [lang({ id: 'cherokee', glottocode: 'cher1273', centre: centre({ lat: 35.4664, lon: -83.163 }) })],
      [cherokee],
    )).toEqual([])
  })

  it('refuses a glottocode that appears in no resolution row', () => {
    const problems = resolutionProblems([lang({ id: 'x', glottocode: 'zzzz9999' })], [cherokee])
    expect(problems.some((p) => p.includes('zzzz9999'))).toBe(true)
  })

  it('refuses a family-level glottocode on a language record', () => {
    // The schema's pattern cannot tell a family code from a language code.
    const family = res({ searched: 'Quechua', glottocode: 'quec1387', level: 'family', latitude: null, longitude: null })
    const problems = resolutionProblems([lang({ id: 'quechua', glottocode: 'quec1387' })], [family])
    expect(problems.some((p) => p.includes('quec1387') && p.includes('family'))).toBe(true)
  })

  it('refuses a centre that disagrees with the fetched coordinates', () => {
    const problems = resolutionProblems(
      [lang({ id: 'cherokee', glottocode: 'cher1273', centre: centre({ lat: 35.5, lon: -83.163 }) })],
      [cherokee],
    )
    expect(problems.some((p) => p.includes('cherokee'))).toBe(true)
  })

  it('ignores a record with no glottocode', () => {
    // D8 cover terms carry glottocode: null deliberately.
    expect(resolutionProblems([lang({ id: 'quechua', glottocode: null, centre: null })], [cherokee])).toEqual([])
  })
})
```

- [ ] **Step 2: Run them and watch every case fail**

```bash
pnpm vitest run tests/record-guards.test.ts
```
Expected: FAIL — `record-guards.ts` does not exist. This is the point at which each guard is watched failing; do not proceed until each named case has been seen red.

- [ ] **Step 3: Implement the guards**

`src/lib/record-guards.ts`. Keep it pure — no fs, no Payload, no React, consistent with the rest of `src/lib/`.

```ts
/** D8: a cover term gets a record with no centre, because Glottolog's
 *  family-level entries carry no coordinates and inventing one would place a
 *  43-language family at a single point. The record must then SAY it is a
 *  cover term: the language panel prints "not mapped" for a null centre, which
 *  is equally true of a language whose centre merely was not sourced, and the
 *  reader cannot tell those apart without the caveat.
 *
 *  Adjacent records are exempt: D6 gives them centre: null by rule, so the
 *  explanation belongs to the rule, not to each row. */
export function coverTermProblems(languages: readonly Language[]): string[] {
  return languages
    .filter((l) => l.tier === 'indigenous' && l.centre === null && l.caveat === null)
    .map((l) => `language ${l.id}: indigenous tier with no centre must carry a caveat saying why (spec D8)`)
}

/** Checks each record against `data/glottolog-resolution.yml` — the record of
 *  what Glottolog actually returned. Three things it catches that nothing else
 *  can: a glottocode nobody fetched, a FAMILY code sitting in a field that
 *  means "this language" (the schema's pattern matches both), and a centre
 *  that disagrees with the coordinates the fetch recorded. */
export function resolutionProblems(
  languages: readonly Language[],
  resolution: readonly GlottologResolution[],
): string[] {
  const byCode = new Map(resolution.map((r) => [r.glottocode, r]))
  const problems: string[] = []
  for (const l of languages) {
    if (l.glottocode === null) continue
    const r = byCode.get(l.glottocode)
    if (r === undefined) {
      problems.push(
        `language ${l.id}: glottocode "${l.glottocode}" appears in no row of ` +
          'data/glottolog-resolution.yml — every code must be one that was actually fetched (spec D9)',
      )
      continue
    }
    if (r.level !== 'language') {
      problems.push(
        `language ${l.id}: glottocode "${l.glottocode}" is Glottolog level "${r.level}", not a language — ` +
          'a cover term takes glottocode: null and a caveat instead (spec D8)',
      )
    }
    if (l.centre !== null && (l.centre.lat !== r.latitude || l.centre.lon !== r.longitude)) {
      problems.push(
        `language ${l.id}: centre ${l.centre.lat}, ${l.centre.lon} disagrees with the fetched ` +
          `Glottolog coordinates ${r.latitude}, ${r.longitude} for "${l.glottocode}"`,
      )
    }
  }
  return problems
}
```

- [ ] **Step 4: Run the tests and watch them pass**

```bash
pnpm vitest run tests/record-guards.test.ts
```
Expected: PASS, all cases.

- [ ] **Step 5: Wire both guards into `validate.ts`**

Add `glottologResolution: GlottologResolution[]` to `ValidateInput`, populate it in the real-run section alongside `paperLanguages`, and push both guards' output into `problems`. **Exclude `status: 'rejected'` records** from both, matching how the mapping checks already treat rejected entries — a withdrawn record is withdrawn from every gate.

```ts
  const live = input.languages.filter((l) => l.status !== 'rejected')
  problems.push(...coverTermProblems(live))
  problems.push(...resolutionProblems(live, input.glottologResolution))
```

- [ ] **Step 6: Add validate-level tests**

In `tests/validate.test.ts`, using this file's `input()` builder — and note `tests/gate.test.ts` builds `ValidateInput` too, so add the new field's default there as well or it will not compile:

```ts
it('reports a cover-term record with no caveat', () => {
  const problems = validate(input({ languages: [langRecord({ id: 'quechua', tier: 'indigenous', centre: null, caveat: null, status: 'draft' })] }))
  expect(problems.some((p) => p.includes('quechua') && p.includes('caveat'))).toBe(true)
})

it('excludes a rejected record from the cover-term check', () => {
  const problems = validate(input({ languages: [langRecord({ id: 'quechua', tier: 'indigenous', centre: null, caveat: null, status: 'rejected' })] }))
  expect(problems.some((p) => p.includes('quechua') && p.includes('caveat'))).toBe(false)
})
```

- [ ] **Step 7: Full suite, typecheck, and confirm the gate still refuses**

```bash
pnpm test && pnpm typecheck
(pnpm build:data >/dev/null 2>&1; echo "build:data $?")
```
Expected: tests and typecheck green; `build:data 1` (drafts exist — that refusal is the feature).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(sp3b): guard records against the Glottolog resolution

The language schema's glottocode pattern matches family codes as happily
as language codes, so a cover term could silently carry azte1234 in a
field that means 'this language'. And a hand-transcribed centre had
nothing checking it against what was actually fetched.

coverTermProblems makes a centre-less indigenous record explain itself:
the panel prints 'not mapped' for a cover term and for an unsourced
centre alike, and the reader cannot tell those apart without the caveat.
Adjacent records are exempt — D6 gives them centre: null by rule.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## The record templates

All three record tasks use these shapes. Every field not sourced is `null` or `[]` — never a plausible guess. Three fields are `null` on **every** record this plan creates, for the reasons SP0 recorded in `data/REVIEW-QUEUE.md` and which have not changed:

- `typology: []` — the schema has no `source` slot for typology, so an unsourced typological claim would enter the artifact uncited. A reviewer fills these from WALS/Grambank, both linked from every Glottolog entry.
- `endangerment: null` — the schema accepts only `scale: unesco-2010`. Glottolog publishes its own AES scale, which is **not** UNESCO 2010; mapping one onto the other would fabricate a citation.
- `speakers: null` — no figure is available from Glottolog, and no other source is being consulted in this sub-project.

**Shape A — resolvable Indigenous language, sourced centre:**

```yaml
# Sourced 2026-09-06 from Glottolog; see data/glottolog-resolution.yml for the
# fetched response this record was written from.
id: cherokee
name: Cherokee
also_known_as: [Tsalagi]
glottocode: cher1273
iso639_3: chr
tier: indigenous
family: Iroquoian
subfamily: null
typology: []
endangerment: null
speakers: null
region: north-america
countries: [US]
centre:
  lat: 35.4664
  lon: -83.163
  source:
    kind: url
    ref: https://glottolog.org/resource/languoid/id/cher1273
    retrieved: "2026-09-06"
    quote: "Cherokee cher1273 chr latitude 35.4664 longitude -83.163 (Glottolog, CC-BY-4.0)"
  confidence: sourced
caveat: null
status: draft
```

`quote` follows the existing `te-reo-maori` record's form exactly: name, glottocode, ISO code, and the two coordinates as Glottolog published them, with the attribution. `subfamily` is filled only when `classification` has more than one level; otherwise `null`.

**Shape B — cover term (D8), no centre, no glottocode:**

```yaml
# A COVER TERM, not a language. See data/glottolog-resolution.yml.
id: quechua
name: Quechua
also_known_as: [Quechuan, Runasimi]
glottocode: null
iso639_3: null
tier: indigenous
family: Quechuan
subfamily: null
typology: []
endangerment: null
speakers: null
region: south-america
countries: []
centre: null
caveat: >-
  A cover term, not a single language: Glottolog places 43 languages under
  Quechuan (quec1387), and every paper in this atlas that names Quechua names it
  at that level without narrowing to a variety. Glottolog publishes no
  coordinates for a family, so this record carries no centre and does not draw —
  placing 43 languages at one point would assert something no source supports.
status: draft
```

`glottocode: null` is deliberate and is what `resolutionProblems` enforces: the family code belongs in the caveat, not in a field that means "this language". `countries: []` unless the fetched row supports a specific list.

**Shape C — adjacent tier (D6), no centre by rule:**

```yaml
# tier: adjacent. Per spec D5/D6 an adjacent-tier language carries NO centre:
# soft fields are an Indigenous-tier feature and the schema enforces it.
id: persian
name: Persian
also_known_as: [Farsi, فارسی]
glottocode: west2369
iso639_3: pes
tier: adjacent
family: Indo-European
subfamily: Iranian
typology: []
endangerment: null
speakers: null
region: eurasia
countries: [IR]
centre: null
caveat: null
status: draft
```

The fetched coordinates for an adjacent language are still recorded in `data/glottolog-resolution.yml` — the record simply does not use them.

**`REGIONS` is a closed list and there is no `asia` member.** The permitted values are exactly:

`north-america`, `central-america`, `south-america`, `oceania`, `africa`, `eurasia`, `arctic`

So Persian, Manchu, Nepali and Basque are `eurasia`; Inuktitut and Inuinnaqtun are `arctic`. Where no
member fits, use `null` rather than the nearest-looking one — `region` is a facet the reader filters by,
and a wrong value is worse than an absent one. `TYPOLOGIES` is likewise closed (`polysynthetic`,
`agglutinative`, `fusional`, `isolating`, `synthetic`) but stays `[]` on every record here.

**`also_known_as` is sourced too.** Use only alternative names the corpus itself uses or that the fetched
Glottolog row lists — never a name supplied from memory. These aliases are load-bearing: a mapping quote
matches a language through `name` plus `also_known_as`, so an invented alias silently licenses a mapping.

---

### Task 4: The resolvable Indigenous records

Roughly 11 records in Shape A — the ones that produce new pins, and the point of the whole sub-project.

**Files:**
- Create: `data/languages/<id>.yml` for each language resolved to `level: language` and not adjacent
- Test: `tests/schema.test.ts` and `tests/load.test.ts` already run over the whole directory

Expected members, to be confirmed against Task 2's output rather than assumed: Cherokee, Seneca, Inuktitut, Inuinnaqtun, Innu-Aimun, SENĆOŦEN, Bribri, Wixarika, Shipibo-Konibo, Hawaiian, Aleut. `Inuktut` may resolve to the same languoid as `Inuktitut` — if it does, write **one** record and note the second name in `also_known_as`, rather than two records for one language.

- [ ] **Step 1: Write the records**

One file per language, Shape A, `id` in lowercase kebab-case matching the schema's `/^[a-z0-9-]+$/`. Take `name`, `glottocode`, `iso639_3`, `latitude`, `longitude` and `family` from the matching row of `data/glottolog-resolution.yml` — never from memory, and never from the Glottolog HTML page, whose markdown conversion drops coordinates.

- [ ] **Step 2: Validate**

```bash
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"
cd atlas && pnpm validate
```
Expected: exit 1, listing every new record as `draft` and reporting **no** other problem. A `resolutionProblems` or `coverTermProblems` message here means a record disagrees with what was fetched — fix the record, never the resolution file.

- [ ] **Step 3: Run the suite**

```bash
pnpm test && pnpm typecheck
```
Expected: green.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(sp3b): add the Indigenous language records that resolve to one languoid

Each carries Glottolog's own published coordinates, quoted verbatim, and
is checked against data/glottolog-resolution.yml by resolutionProblems.
typology, endangerment and speakers are null on every record for the
reasons REVIEW-QUEUE.md has recorded since SP0.

All at status: draft — promotion is the maintainer's signature.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: The cover-term records

Roughly 10 records in Shape B. These never draw; they exist so the Latin American literature is reachable and so the atlas says plainly what it does and does not know.

Expected members, again confirmed against Task 2 rather than assumed: Quechua, Nahuatl, Maya, Otomí, Chatino, Cree, Yupik, Aymara, Guarani, Rarámuri. **Some may resolve to a single languoid after all** — Bribri and Wixarika already do. Any that resolves to `level: language` belongs in Task 4's shape instead, with a sourced centre. Move it rather than forcing it into Shape B.

- [ ] **Step 1: Write the records**

Shape B. Each `caveat` must state three things: that the name is a cover term, how many languages Glottolog places under it (from the resolution row), and that the corpus never narrows it. Write the caveat for a reader of the published page, not for a maintainer — it is the only thing standing between them and the assumption that the atlas simply failed to locate the language.

- [ ] **Step 2: Confirm the guard is doing its job**

Temporarily blank one record's `caveat`, run `pnpm validate`, and confirm it reports that record by id. Restore the caveat. A guard nobody has watched fail is not yet a guard — and this one has never run against real data.

- [ ] **Step 3: Validate and test**

```bash
pnpm validate; pnpm test && pnpm typecheck
```
Expected: `validate` exits 1 listing drafts only; suite green.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(sp3b): add the cover-term language records (D8)

Quechua spans 43 Glottolog languages, Nahuatl 31, Maya 34, and the corpus
names all three at cover-term level — across 92 summaries there is exactly
one variety-level narrowing. Glottolog publishes no coordinates for a
family, so these carry no centre and no glottocode, and each caveat says
so in the record, where the reader sees it.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: The adjacent-tier records

Roughly 8 records in Shape C: Persian, Swahili, Yoruba, Wolof, Basque, Nepali, Manchu, Sundanese. The schema already refuses an adjacent record a centre, so the constraint enforces itself.

- [ ] **Step 1: Write the records**

Shape C. `caveat` stays `null` unless the record needs one for its own reason — D6's no-centre rule is a property of the tier and is explained in the spec and the file header, not repeated per row.

- [ ] **Step 2: Confirm the schema refuses an adjacent centre**

Temporarily add a `centre` block to one adjacent record and run `pnpm validate`. Expect the schema's own message: `an adjacent-tier language must not carry a centre (spec D5): the adjacent tier is pins only`. Remove it. This confirms the rule is live rather than assumed.

- [ ] **Step 3: Validate and test**

```bash
pnpm validate; pnpm test && pnpm typecheck
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(sp3b): add the adjacent-tier language records (D6)

Persian, Swahili, Yoruba, Wolof, Basque, Nepali, Manchu and Sundanese.
Each carries centre: null, which the schema enforces rather than trusts.
Their fetched coordinates are recorded in glottolog-resolution.yml and
deliberately unused.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## The mapping entry template

Tasks 7–9 all add entries of this shape to `data/paper-languages.yml`:

```yaml
- paper: zhang-et-al-2022-cherokee-nlp
  languages: [cherokee]
  source:
    kind: paper
    ref: /summaries/zhang-et-al-2022-cherokee-nlp/
    quote: >-
      How can NLP Help Revitalize Endangered Languages? A Case Study and Roadmap
      for the Cherokee Language
  note: null
  status: draft
```

**Four rules every entry obeys.** The first two are machine-checked; the last two are not, and are where a reviewer's attention belongs.

1. **The quote must appear verbatim** in `litterature_review/summaries/<paper>.md`, before `## Relevance to Indigenous AI`. `validate.ts` and `tests/paper-mappings.test.ts` both refuse otherwise. Copy it; do not retype it. Beware of crossing a `**bold**` or heading boundary — `quoteProvenance` splits the head into blocks on blank lines *and* heading lines, so a quote spanning two blocks matches nothing.
2. **The quote must name every language in `languages`** — by the record's `name` or one of its `also_known_as` forms. This is checked. It is also why `also_known_as` matters: a paper writing "Mohawk" maps to `kanienkeha` only because that record lists Mohawk as an alias.
3. **The STUDIES rule.** The quote must be evidence the paper *studies* the language, not that it mentions one. A typological example ("languages like Nahuatl and Wixarika"), a comparison, or a passing artifact reference is not enough even when it sits safely before the Relevance heading. **When in doubt, omit.**
4. **`note` is mandatory whenever the evidence is weaker than title-level** — e.g. the language is one of many a paper evaluates without being its subject. The note travels into the bundle and is rendered under the paper on the language panel; it is the reader's only signal that a mapping is hedged. SP3a shipped a mapping whose hedge did not reach the reader, and that was a defect.

**One entry per quote, not per paper.** Task 1 makes this possible. A shared task reporting Bribri/Guarani/Maya/Nahuatl in one sentence and Quechua/Rarámuri in another gets two entries, each with its own quote and its own `languages` list. Never stitch two sentences into one quote.

**Recording a refusal.** When a candidate pair fails the studies rule, add it at `status: rejected` with its verbatim quote and a `note` saying why, exactly as SP3a's eight rejected entries do. Rejected entries are excluded from every gate, including the quote check. This file is the only durable record of the reasoning — task reports are gitignored.

---

### Task 7: Map the North American and Pacific papers

**Candidate pairs.** Each row is a paper whose pre-Relevance head names the language. **These are candidates, not mappings** — SP3a's equivalent list cut 11 to 3. Expect to reject a substantial share, and record each rejection.

| Language | Candidate papers |
| --- | --- |
| cherokee | `zhang-et-al-2022-cherokee-nlp` |
| seneca | `liu-et-al-2021-morphological-segmentation` |
| kanienkeha | `arnett-and-bergen-2025-morphologically-complex`, `le-and-sadat-2021-canada`, `liu-et-al-2021-morphological-segmentation`, `pinhanez-et-al-2024-vitalize` *(`kuhn-et-al-2020-nrc-canada` is already mapped — do not duplicate the pair)* |
| inuktitut | `khandagale-et-al-2022-polysynthetic`, `le-and-sadat-2021-canada`, `ngoc-et-al-2021-inuinnaqtun`, `stenlund-et-al-2025-inuktitut` |
| inuinnaqtun | `le-and-sadat-2021-canada`, `ngoc-et-al-2021-inuinnaqtun` |
| innu-aimun | `cadotte-et-al-2022-innu-aimmun`, `le-et-al-2022-innu-aimun` |
| sencoten | `kuhn-et-al-2020-nrc-canada` |
| cree | `le-et-al-2022-innu-aimun` |
| yupik | `khandagale-et-al-2022-polysynthetic`, `ngoc-et-al-2021-inuinnaqtun` |
| aleut | `le-and-sadat-2021-canada` |
| hawaiian | `godwin-jones-2025-ai-pedagogical-tools`, `meighan-2021-decolonizing`, `zhao-et-al-2026-ai-auditing-tools` |

Two to watch. `arnett-and-bergen-2025-morphologically-complex` names Mohawk in a paper about morphological complexity across many languages — likely a typological example, likely a rejection. `zhao-et-al-2026-ai-auditing-tools` is about Hawai'i the place and educators there; whether it studies the Hawaiian *language* is exactly the judgment the studies rule asks for.

- [ ] **Step 1: Read each candidate's head and decide**

```bash
sed '/^## Relevance to Indigenous AI/,$d' litterature_review/summaries/<paper>.md
```

- [ ] **Step 2: Write the entries**, accepted and rejected alike, into `data/paper-languages.yml`.

- [ ] **Step 3: Validate and test**

```bash
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"
cd atlas && pnpm validate; pnpm test && pnpm typecheck
```
Expected: `validate` exits 1 on drafts only. A "quote appears in the summary only at or after" message means the quote came from the relevance section — remove the mapping, do not hunt for a replacement quote to justify a conclusion already drawn.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(sp3b): map the North American and Pacific papers

Each accepted mapping carries a verbatim quote from the paper's own
subject matter; each rejected candidate carries its quote and the reason
it failed the studies rule, since this file is the only durable record of
that reasoning.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: Map the Latin American papers

The largest group, and the one D7 was written for. `gibert-et-al-2025-americas-nlp` and `ebrahimi-et-al-2023-americas-nlp` each need **several entries** — one per quote.

| Language | Candidate papers |
| --- | --- |
| nahuatl | `ebrahimi-et-al-2023-americas-nlp`, `gibert-et-al-2025-americas-nlp`, `kann-et-al-2018-polysynthetic`, `krasner-et-al-2025-semantic-embeddings`, `liu-et-al-2021-morphological-segmentation`, `mager-et-al-2022-bpe-polysynthetic`, `yahan-and-islam-2025-fine-tuning` |
| quechua | `court-and-elsner-et-al-2024-llm-low-ressource`, `ebrahimi-et-al-2023-americas-nlp`, `gibert-et-al-2025-americas-nlp`, `song-et-al-2026-slm` |
| aymara | `ebrahimi-et-al-2023-americas-nlp` |
| guarani | `aycock-et-al-2025-grammar-book`, `gibert-et-al-2025-americas-nlp`, `krasner-et-al-2025-semantic-embeddings`, `pinhanez-et-al-2024-vitalize`, `song-et-al-2026-slm`, `yahan-and-islam-2025-fine-tuning` |
| bribri | `ebrahimi-et-al-2023-americas-nlp`, `gibert-et-al-2025-americas-nlp`, `krasner-et-al-2025-semantic-embeddings`, `yahan-and-islam-2025-fine-tuning`, `zhang-et-al-2024-hire-a-linguist` |
| wixarika | `ebrahimi-et-al-2023-americas-nlp`, `kann-et-al-2018-polysynthetic`, `liu-et-al-2021-morphological-segmentation`, `mager-et-al-2022-bpe-polysynthetic` |
| raramuri | `gibert-et-al-2025-americas-nlp`, `mager-et-al-2022-bpe-polysynthetic` |
| shipibo-konibo | `mager-et-al-2022-bpe-polysynthetic` |
| otomi | `ebrahimi-et-al-2023-americas-nlp` |
| chatino | `ebrahimi-et-al-2023-americas-nlp` |
| maya | `gibert-et-al-2025-americas-nlp`, `yahan-and-islam-2025-fine-tuning` |

**`tonja-et-al-2024-latin-american` and `mager-et-al-2023-americas` are excluded by D7** — both are surveys. They name most of these languages; that is not evidence they study any. Do not map them.

Watch `liu-et-al-2021-morphological-segmentation`, whose subject is Seneca and which names Nahuatl and Wixarika in what is likely a comparison, and `kann-et-al-2018-polysynthetic`, which genuinely experiments on Nahuatl and Wixarika. The two read similarly and resolve differently — that is the studies rule doing its work.

- [ ] **Step 1: Read each head and decide**, as Task 7.
- [ ] **Step 2: Write the entries.** For the two shared tasks, group languages by the sentence that names them; one entry per sentence.
- [ ] **Step 3: Validate and test.**

```bash
pnpm validate; pnpm test && pnpm typecheck
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(sp3b): map the Latin American papers

The AmericasNLP shared tasks carry several entries each: no single
sentence names all their languages and the location rule forbids
stitching one. The two surveys that name most of these languages are
excluded by D7 — naming is not studying.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: Map the adjacent-tier papers

| Language | Candidate papers |
| --- | --- |
| persian | `ansari-et-al-2026-persian-poetry`, `monazzah-et-al-2025-percurl`, `sadr-et-al-2025-taarof`, `sakhaeirad-et-al-2026-persian-llm` |
| swahili | `zebaze-et-al-2025-in-context-learning` |
| yoruba | `ajani-et-al-2024-revitalizing`, `song-et-al-2026-slm` |
| wolof | `zebaze-et-al-2025-in-context-learning`, `zhang-et-al-2024-hire-a-linguist` |
| basque | `sanchez-et-al-2025-linguini` |
| nepali | `aycock-et-al-2025-grammar-book`, `mager-et-al-2022-bpe-polysynthetic` |
| manchu | `pei-et-al-2025-in-context-learning`, `zhang-et-al-2024-hire-a-linguist` |
| sundanese | `feng-et-al-2025-culfit` — **see the note below; this is an edit, not a new entry** |

**Sundanese is a special case.** `feng-et-al-2025-culfit` already has an entry, and its existing quote —
"Low-resource language regions (Sundanese in West Java, Amharic in Ethiopia) show the largest gains" —
already names Sundanese. The correct action is to add `sundanese` to that entry's `languages` array, not
to add a second entry: one quote is one piece of evidence, and splitting it would make the same sentence
appear twice in the file. Its existing `note` hedges Amharic specifically; extend it to cover Sundanese on
the same grounds, since both are evaluation languages rather than the paper's subject.

All four Persian papers are title-level and should map cleanly. The benchmark papers (`sanchez-et-al-2025-linguini`, `zebaze-et-al-2025-in-context-learning`, `zhang-et-al-2024-hire-a-linguist`) name languages as evaluation set members — weaker than title-level, so each accepted mapping needs a `note` saying so, exactly as `feng-et-al-2025-culfit` already does for Amharic.

- [ ] **Step 1: Read each head and decide.**
- [ ] **Step 2: Write the entries**, with a `note` on every non-title-level mapping.
- [ ] **Step 3: Validate and test.**
- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(sp3b): map the adjacent-tier papers (D6)

These map and, by D6, never draw — their languages carry no centre, so
SP3a's 'language has no centre' card is what carries them. Every mapping
weaker than title-level carries a note, because the note is the reader's
only signal that the evidence is hedged.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 10: Update the review queue and verify the whole artifact

The records are worth nothing to the maintainer without the document that says what was and was not sourced. `data/REVIEW-QUEUE.md` is what they work from.

**Files:**
- Modify: `data/REVIEW-QUEUE.md`

- [ ] **Step 1: Extend `REVIEW-QUEUE.md`**

Add an SP3b section covering:
- **What was sourced:** glottocode, ISO 639-3, family and (for Shape A only) coordinates, all from Glottolog, all recorded in `data/glottolog-resolution.yml` with the date fetched.
- **The three systematic gaps**, restated because they now apply to ~30 more records: `typology: []`, `endangerment: null`, `speakers: null`, each with the reason already given above.
- **The cover terms**, listed by name, each with the number of languages Glottolog places under it — the maintainer is being asked to sign off on a record that deliberately does not draw, and should see that group as a group.
- **The resolution decisions**, listing every name whose Glottolog `name` differs from the corpus's name (SENĆOŦEN → Saanich, Rarámuri → Tarahumara, and any others), so the maintainer can check the matching rather than trust it.
- **The rejected mappings**, by count and with a pointer to `data/paper-languages.yml` where each carries its quote and reason.
- **What is NOT in this sub-project:** the transferability gap D6 records — the adjacent tier marks scope but carries no transposability judgement, because `transferability` lives only on the initiative schema and every initiative is rejected.

- [ ] **Step 2: Verify the whole artifact**

```bash
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"
cd atlas
pnpm test
pnpm typecheck
pnpm validate 2>&1 | tail -40
(pnpm build:data >/dev/null 2>&1; echo "build:data $?")
(pnpm build:app  >/dev/null 2>&1; echo "build:app  $?")
```

Expected, and **all five conditions must hold**:
- suite green, well above the 622 baseline
- `tsc` clean
- `validate` reports **only** `status is draft` lines — no unknown ids, no quote-provenance failures, no cover-term or resolution problems
- `build:data 1` and `build:app 1` — the gates still refuse while records are draft. **Both exiting 1 is the success condition, not a failure.**

- [ ] **Step 3: Count what shipped**

Report these numbers in the final commit body, measured rather than estimated:

```bash
ls data/languages/*.yml | wc -l
grep -c '^- paper:' data/paper-languages.yml
grep -c 'status: rejected' data/paper-languages.yml
grep -l 'centre:$' data/languages/*.yml | wc -l   # records that will draw
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "docs(sp3b): record what was and was not sourced

REVIEW-QUEUE.md is what the maintainer works from, and it now covers the
~30 new records: what Glottolog supplied, the three gaps that remain null
on every record, the cover terms as a group, every name whose Glottolog
name differs from the corpus's, and the transferability gap D6 inherited
deliberately.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## What done looks like

- ~30 new language records, all `status: draft`, roughly 11 of them drawing a pin.
- `data/paper-languages.yml` carrying every accepted mapping with a verbatim quote and every rejection with its reason.
- `data/glottolog-resolution.yml` recording exactly what was fetched, with a guard checking every record against it.
- Both gates still exiting 1, because nothing has been promoted — the maintainer's signature is the last step and it is not ours to give.
- The map showing roughly a dozen pins instead of two.
