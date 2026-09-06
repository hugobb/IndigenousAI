# SP3a — Papers on the Map (machinery) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the 92 papers reachable in the atlas by mapping them to languages through a new curated, gated record type — with the evidence rule that keeps the corpus off a single false pin.

**Architecture:** A hand-curated `atlas/data/paper-languages.yml` links paper ids to language ids, each entry carrying a verbatim quote from the paper's own subject matter. `validate.ts` gates it like every other record and additionally refuses any quote that occurs in its summary only at or after `## Relevance to Indigenous AI`. `bundle.ts` joins it into the bundle; a pure module derives per-language paper lists and the two unmapped groups; `LanguagePanel` and `UnmappedList` render them.

**Tech Stack:** TypeScript (strict), Zod 3, js-yaml, Vitest 2, React 19, Vite 6, pnpm 11, Node 22.22.2.

**Spec:** `docs/superpowers/specs/2026-09-05-atlas-sp3-papers-on-the-map-design.md`

## Global Constraints

- **Never promote a record to `status: verified`.** Every entry this plan writes ships at `status: draft`. Promotion is the maintainer's signature.
- **Never edit `litterature_review/`, `docs/docs/` (except the generated, gitignored `summaries/`), `atlas/data/derived/**` by hand, or `atlas/src/data/**`.** SP3a reads `litterature_review/summaries/` and writes only `atlas/data/paper-languages.yml`.
- **Never fabricate a value.** A mapping exists only where a quote supports it. Ambiguity resolves to *unmapped*, never to a guess.
- **`pnpm build:data` and `pnpm build:app` must both keep exiting non-zero** while any record is `status: draft`. At the end of SP3a they exit non-zero because the new mappings are drafts — that is success, not failure.
- **The evidence rule (spec D2):** a language may be mapped to a paper only when named in the paper's title, header block, or a section **before** `## Relevance to Indigenous AI`. Measured: 86 of 92 summaries name Mohawk only in that section.
- **`SourceSchema.kind` is `'url' | 'paper' | 'doc'`** — there is no `summary`. Mappings use `kind: paper`, `ref: /summaries/<id>/`, `retrieved: null`. (Spec D1's example says `url | summary`; the schema is the authority.)
- Node off PATH: `export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"`.
- Run all commands from `atlas/`. Commit trailer: `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>`.

---

## File Structure

**Create:**
- `atlas/src/schema/paper-language.ts` — `PaperLanguageSchema`, the record type.
- `atlas/src/lib/quote-provenance.ts` — pure: where a quote sits in a summary. The D2 rule, isolated so it can be unit-tested and mutation-checked without touching the filesystem.
- `atlas/scripts/lib/load-paper-languages.ts` — reads and parses the YAML file; reports absent/unreadable distinctly from empty.
- `atlas/data/paper-languages.yml` — the curated data, 11 entries at `status: draft`.
- `atlas/src/lib/paper-map.ts` — pure join: papers per language, and the two unmapped groups with their reasons.
- Tests: `atlas/tests/quote-provenance.test.ts`, `atlas/tests/load-paper-languages.test.ts`, `atlas/tests/paper-mappings.test.ts`, `atlas/tests/paper-map.test.ts`, `atlas/tests/language-panel-papers.test.tsx`, `atlas/tests/unmapped-papers.test.tsx`.

**Modify:**
- `atlas/src/schema/index.ts` — re-export the new schema and type.
- `atlas/scripts/validate.ts` — `ValidateInput` gains mappings; new checks.
- `atlas/scripts/bundle.ts` — join mappings into the bundle.
- `atlas/src/lib/load.ts` — `AtlasBundle` and `BundleSchema` gain `paperLanguages`.
- `atlas/src/fixtures/atlas.fixture.json` — gains a `paperLanguages` array.
- `atlas/src/components/LanguagePanel.tsx` — a Papers section.
- `atlas/src/components/UnmappedList.tsx` — two paper cards.
- `atlas/src/components/App.tsx` — wiring.

---

### Task 1: The record type and its loader

**Files:**
- Create: `atlas/src/schema/paper-language.ts`
- Create: `atlas/scripts/lib/load-paper-languages.ts`
- Modify: `atlas/src/schema/index.ts`
- Test: `atlas/tests/load-paper-languages.test.ts`

**Interfaces:**
- Consumes: `SourceSchema` from `../schema/source.js`; `RECORD_STATUS` from `../schema/vocab.js`.
- Produces: `PaperLanguageSchema`, `type PaperLanguage = { paper: string; languages: string[]; source: Source; note: string | null; status: RecordStatus }`; `loadPaperLanguages(file: string): PaperLanguage[]`; `paperLanguagesFileStatus(file: string): 'ok' | 'missing' | 'unreadable'`.

- [ ] **Step 1: Write the failing test**

`atlas/tests/load-paper-languages.test.ts`:

```ts
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { loadPaperLanguages, paperLanguagesFileStatus } from '../scripts/lib/load-paper-languages.js'

let dir: string
const file = (): string => join(dir, 'paper-languages.yml')
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'plang-')) })
afterEach(() => rmSync(dir, { recursive: true, force: true }))

const ENTRY = `- paper: kuhn-et-al-2020-nrc-canada
  languages: [kanienkeha]
  source:
    kind: paper
    ref: /summaries/kuhn-et-al-2020-nrc-canada/
    quote: "instantiated for Kanyen'kéha (Mohawk)"
  status: draft
`

describe('loadPaperLanguages', () => {
  it('parses an entry', () => {
    writeFileSync(file(), ENTRY)
    const rows = loadPaperLanguages(file())
    expect(rows).toHaveLength(1)
    expect(rows[0]?.paper).toBe('kuhn-et-al-2020-nrc-canada')
    expect(rows[0]?.languages).toEqual(['kanienkeha'])
    expect(rows[0]?.status).toBe('draft')
    // `retrieved` and `note` default rather than being required of every entry.
    expect(rows[0]?.source.retrieved).toBeNull()
    expect(rows[0]?.note).toBeNull()
  })

  it('refuses an entry naming no language, which would map a paper nowhere', () => {
    writeFileSync(file(), '- paper: p\n  languages: []\n  source:\n    kind: paper\n    ref: r\n    quote: q\n  status: draft\n')
    expect(() => loadPaperLanguages(file())).toThrow(/at least one language/i)
  })

  it('refuses an entry with no quote: the quote IS the evidence', () => {
    writeFileSync(file(), '- paper: p\n  languages: [l]\n  source:\n    kind: paper\n    ref: r\n  status: draft\n')
    expect(() => loadPaperLanguages(file())).toThrow(/quote/i)
  })

  it('reads an empty list as empty, not as missing', () => {
    writeFileSync(file(), '[]\n')
    expect(loadPaperLanguages(file())).toEqual([])
    expect(paperLanguagesFileStatus(file())).toBe('ok')
  })

  /** The same distinction `recordDirStatus` draws one level up: zero mappings
   *  loaded from an absent file reads exactly like a file nobody has written
   *  yet, and only this tells them apart. */
  it('tells an absent file from an empty one', () => {
    expect(paperLanguagesFileStatus(file())).toBe('missing')
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH" && cd atlas && pnpm vitest run tests/load-paper-languages.test.ts`
Expected: FAIL — `Failed to load url ../scripts/lib/load-paper-languages.js`.

- [ ] **Step 3: Write the schema**

`atlas/src/schema/paper-language.ts`:

```ts
import { z } from 'zod'
import { SourceSchema } from './source.js'
import { RECORD_STATUS } from './vocab.js'

/** Links one paper to the language(s) it STUDIES.
 *
 *  Separate from `data/derived/papers.json` because that file is generator
 *  output, rewritten by `pnpm extract:papers`, and from
 *  `litterature_review/OVERVIEW.md` because that tree is never edited. This is
 *  the only hand-curated place the link can live.
 *
 *  `source.quote` is mandatory and is the entire evidence for the mapping:
 *  spec D2 requires it to come from the paper's own subject matter, and
 *  `validate.ts` refuses a quote that appears in the summary only at or after
 *  `## Relevance to Indigenous AI`. A quote-less mapping could not be checked
 *  against that rule at all, so the schema does not permit one. */
export const PaperLanguageSchema = z.object({
  /** A paper id from `data/derived/papers.json`. Checked by `validate.ts`. */
  paper: z.string().min(1),
  /** Language ids from `data/languages/`. A paper may study more than one. */
  languages: z.array(z.string()).min(1, 'an entry must name at least one language'),
  source: SourceSchema.refine((s) => s.quote !== null && s.quote.trim() !== '', {
    message: 'a mapping needs a `quote`: the quote is the evidence for the mapping',
    path: ['quote'],
  }),
  /** The curator's hedge, carried into the bundle. YAML comments are dropped
   *  by `js-yaml.load`, so a hedge written as a comment never reaches a reader. */
  note: z.string().min(1).nullable().default(null),
  status: z.enum(RECORD_STATUS),
})

export type PaperLanguage = z.infer<typeof PaperLanguageSchema>
```

Append to `atlas/src/schema/index.ts`:

```ts
export { PaperLanguageSchema, type PaperLanguage } from './paper-language.js'
```

- [ ] **Step 4: Write the loader**

`atlas/scripts/lib/load-paper-languages.ts`:

```ts
import { readFileSync } from 'node:fs'
import yaml from 'js-yaml'
import { PaperLanguageSchema, type PaperLanguage } from '../../src/schema/index.js'

/** Whether the mapping file could be read at all. `ok` includes an empty list —
 *  a legitimate state before any paper has been mapped. `missing` and
 *  `unreadable` are not: both yield zero mappings, which is indistinguishable
 *  from an empty list unless we say so out loud. Same distinction
 *  `recordDirStatus` draws for the record directories. */
export type PaperLanguagesFileStatus = 'ok' | 'missing' | 'unreadable'

export function paperLanguagesFileStatus(file: string): PaperLanguagesFileStatus {
  try {
    readFileSync(file, 'utf8')
    return 'ok'
  } catch (e) {
    return (e as NodeJS.ErrnoException).code === 'ENOENT' ? 'missing' : 'unreadable'
  }
}

export function loadPaperLanguages(file: string): PaperLanguage[] {
  const raw = yaml.load(readFileSync(file, 'utf8')) ?? []
  if (!Array.isArray(raw)) {
    throw new Error(`${file}: expected a YAML list of mappings, got ${typeof raw}`)
  }
  return raw.map((row, i) => {
    const parsed = PaperLanguageSchema.safeParse(row)
    if (!parsed.success) {
      const where = (row as { paper?: string })?.paper ?? `entry ${i + 1}`
      throw new Error(`${file}: ${where}: ${parsed.error.issues.map((x) => `${x.path.join('.')}: ${x.message}`).join('; ')}`)
    }
    return parsed.data
  })
}
```

- [ ] **Step 5: Run the tests and the typecheck**

Run: `pnpm vitest run tests/load-paper-languages.test.ts && pnpm typecheck`
Expected: 5 passed, `tsc --noEmit` clean.

- [ ] **Step 6: Commit**

```bash
git add atlas/src/schema/paper-language.ts atlas/src/schema/index.ts \
        atlas/scripts/lib/load-paper-languages.ts atlas/tests/load-paper-languages.test.ts
git commit -m "feat(sp3a): the paper-language record type and its loader"
```

---

### Task 2: The evidence rule as a pure function

**Files:**
- Create: `atlas/src/lib/quote-provenance.ts`
- Test: `atlas/tests/quote-provenance.test.ts`

**Interfaces:**
- Produces: `quoteProvenance(summary: string, quote: string): QuoteProvenance`; `type QuoteProvenance = 'subject-matter' | 'relevance-only' | 'absent'`; `RELEVANCE_HEADING: RegExp`. Task 4 imports the type.

This is spec D2 and the single largest correctness risk in SP3. It lives in `src/lib/` (pure, no Node imports) so it can be exercised without a filesystem.

- [ ] **Step 1: Write the failing test**

`atlas/tests/quote-provenance.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { quoteProvenance } from '../src/lib/quote-provenance.js'

/** Measured on the real corpus 2026-09-05: 86 of 92 summaries name Mohawk ONLY
 *  inside `## Relevance to Indigenous AI`, the section where the reviewer wrote
 *  about applicability to THIS project. A mapping built from such a sentence is
 *  indistinguishable by eye from a correct one, and would pin the whole corpus
 *  to Six Nations. This function is the only thing standing in front of that. */
const SUMMARY = `# A Paper About Nahuatl

**Authors:** Someone
**Year:** 2024

## Core Argument

We evaluate machine translation for Nahuatl.

## Relevance to Indigenous AI

The approach would transfer to Mohawk at Six Nations.
`

describe('quoteProvenance', () => {
  it('accepts a quote from the paper’s own subject matter', () => {
    expect(quoteProvenance(SUMMARY, 'machine translation for Nahuatl')).toBe('subject-matter')
  })

  it('accepts a quote from the title', () => {
    expect(quoteProvenance(SUMMARY, 'A Paper About Nahuatl')).toBe('subject-matter')
  })

  it('REFUSES a quote that appears only in the relevance section', () => {
    expect(quoteProvenance(SUMMARY, 'transfer to Mohawk at Six Nations')).toBe('relevance-only')
  })

  it('reports a quote that is in the summary nowhere', () => {
    expect(quoteProvenance(SUMMARY, 'a sentence nobody wrote')).toBe('absent')
  })

  /** A quote appearing in BOTH halves is subject-matter: the paper does say it.
   *  Reading it as relevance-only would reject correct mappings for the
   *  accident of the reviewer repeating a phrase. */
  it('is subject-matter when the phrase occurs in both halves', () => {
    expect(quoteProvenance(SUMMARY, 'Nahuatl')).toBe('subject-matter')
  })

  /** Whitespace in YAML block scalars is not the whitespace in the source file:
   *  a folded quote arrives with newlines collapsed to spaces. Comparing raw
   *  would reject correct quotes for a reason no curator could see. */
  it('normalises whitespace on both sides before comparing', () => {
    expect(quoteProvenance('## Core\n\nwe  evaluate\nmachine translation', 'we evaluate machine translation')).toBe('subject-matter')
  })

  /** A summary with no relevance heading is all subject matter. */
  it('treats a summary with no relevance section as entirely subject matter', () => {
    expect(quoteProvenance('# T\n\nwe study Cree', 'we study Cree')).toBe('subject-matter')
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm vitest run tests/quote-provenance.test.ts`
Expected: FAIL — cannot resolve `../src/lib/quote-provenance.js`.

- [ ] **Step 3: Implement**

`atlas/src/lib/quote-provenance.ts`:

```ts
/** Where a mapping's quote sits inside its summary — spec D2's rule, isolated.
 *
 *  Every summary in `litterature_review/` ends with a
 *  `## Relevance to Indigenous AI` section in which the REVIEWER wrote about
 *  applicability to this project's Six Nations context. Measured 2026-09-05:
 *  86 of the 92 summaries name Mohawk/Kanien'kéha there and only 6 name it in
 *  their own subject matter. So "the language appears in the summary" is not
 *  evidence the paper studies it, and a rule built on that would produce a map
 *  with all 92 papers on one pin — looking entirely plausible.
 *
 *  Everything before the heading is the paper speaking. Everything from the
 *  heading on is the reviewer speaking about us. Only the first is evidence. */
export const RELEVANCE_HEADING = /^##\s*Relevance\b/m

export type QuoteProvenance = 'subject-matter' | 'relevance-only' | 'absent'

/** Collapse runs of whitespace so a YAML folded scalar compares equal to the
 *  source it was copied from. Without this, a correct quote whose line breaks
 *  fell differently is rejected for a reason invisible to the curator. */
const flat = (s: string): string => s.replace(/\s+/g, ' ').trim()

export function quoteProvenance(summary: string, quote: string): QuoteProvenance {
  const needle = flat(quote)
  if (needle === '') return 'absent'
  const m = RELEVANCE_HEADING.exec(summary)
  const head = flat(m === null ? summary : summary.slice(0, m.index))
  if (head.includes(needle)) return 'subject-matter'
  return flat(summary).includes(needle) ? 'relevance-only' : 'absent'
}
```

- [ ] **Step 4: Run the tests**

Run: `pnpm vitest run tests/quote-provenance.test.ts && pnpm typecheck`
Expected: 7 passed, tsc clean.

- [ ] **Step 5: Mutation-check the guard before trusting it**

A guard that has never been seen to fail is not yet a guard. Temporarily change the last line of `quoteProvenance` to `return 'subject-matter'` and re-run. Expected: the "REFUSES a quote that appears only in the relevance section" test FAILS. Revert the mutation and re-run; expected: 7 passed. Record both outcomes in the task report.

- [ ] **Step 6: Commit**

```bash
git add atlas/src/lib/quote-provenance.ts atlas/tests/quote-provenance.test.ts
git commit -m "feat(sp3a): spec D2 as a pure function, mutation-checked"
```

---

### Task 3: The curated mappings

**Files:**
- Create: `atlas/data/paper-languages.yml`
- Test: `atlas/tests/paper-mappings.test.ts`

**Interfaces:**
- Consumes: `loadPaperLanguages`, `paperLanguagesFileStatus` (Task 1); `quoteProvenance` (Task 2).
- Produces: the data file every later task reads.

**The work:** for each of the 11 candidate papers below, open
`litterature_review/summaries/<id>.md`, find a sentence **before**
`## Relevance to Indigenous AI` that names the language, and copy it verbatim
into `quote`. If no such sentence exists, **omit the paper** — a shorter file is
the correct outcome, never a quote taken from the relevance section.

Candidates measured 2026-09-05 (`kanienkeha` 6, `te-reo-maori` 3, `amharic` 2;
`choctaw` and `myaamia` 0). Find them with:

```bash
cd /Users/hberard/IndigenousAI/litterature_review/summaries
for f in *.md; do
  head="$(sed '/^## Relevance/,$d' "$f")"
  printf '%s' "$head" | grep -qiE "Mohawk|Kanien|Kanyen|Māori|Amharic" && echo "$f"
done
```

Every entry ships at `status: draft`. Do not write `verified`.

- [ ] **Step 1: Write the failing test**

`atlas/tests/paper-mappings.test.ts`:

```ts
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { loadPaperLanguages, paperLanguagesFileStatus } from '../scripts/lib/load-paper-languages.js'
import { quoteProvenance } from '../src/lib/quote-provenance.js'
import { loadLanguages } from '../scripts/lib/load-records.js'

const url = (p: string): string => fileURLToPath(new URL(p, import.meta.url))
const FILE = url('../data/paper-languages.yml')
const SUMMARIES = url('../../litterature_review/summaries')
const paperIds = new Set(
  (JSON.parse(readFileSync(url('../data/derived/papers.json'), 'utf8')) as { id: string }[]).map((p) => p.id),
)

describe('the curated paper-language mappings', () => {
  const rows = loadPaperLanguages(FILE)

  it('the file exists and is non-empty', () => {
    expect(paperLanguagesFileStatus(FILE)).toBe('ok')
    expect(rows.length).toBeGreaterThan(0)
  })

  it('every paper id resolves against data/derived/papers.json', () => {
    expect(rows.filter((r) => !paperIds.has(r.paper)).map((r) => r.paper)).toEqual([])
  })

  it('every language id resolves against data/languages/', () => {
    const known = new Set(loadLanguages(url('../data/languages')).map((l) => l.id))
    const bad = rows.flatMap((r) => r.languages.filter((l) => !known.has(l)).map((l) => `${r.paper} -> ${l}`))
    expect(bad).toEqual([])
  })

  it('names each paper at most once', () => {
    const seen = new Set<string>()
    const dupes = rows.filter((r) => (seen.has(r.paper) ? true : (seen.add(r.paper), false)))
    expect(dupes.map((r) => r.paper)).toEqual([])
  })

  /** Spec D2, applied to the real corpus. This is the test that stops the atlas
   *  pinning 92 papers to Six Nations on the strength of the reviewer's own
   *  relevance notes. */
  it('sources every quote from the paper’s own subject matter, never the relevance section', () => {
    const bad = rows
      .map((r) => ({
        paper: r.paper,
        where: quoteProvenance(readFileSync(`${SUMMARIES}/${r.paper}.md`, 'utf8'), r.source.quote ?? ''),
      }))
      .filter((x) => x.where !== 'subject-matter')
    expect(bad).toEqual([])
  })

  it('ships nothing as verified: promotion is the maintainer’s signature', () => {
    expect(rows.filter((r) => r.status === 'verified')).toEqual([])
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm vitest run tests/paper-mappings.test.ts`
Expected: FAIL — `ENOENT ... data/paper-languages.yml`.

- [ ] **Step 3: Write the data file**

Create `atlas/data/paper-languages.yml` with this header, then one entry per
paper you can evidence. Shape (this entry is real — verify the quote against the
file before keeping it):

```yaml
# Which language each paper STUDIES. Hand-curated; the one place this link can
# live, since data/derived/papers.json is generator output and
# litterature_review/OVERVIEW.md is never edited.
#
# THE RULE (spec D2): the quote must come from the paper's own subject matter —
# its title, header block, or a section BEFORE `## Relevance to Indigenous AI`.
# That section is the REVIEWER writing about applicability to this project: 86
# of 92 summaries name Mohawk there and only 6 in their own subject matter.
# A quote taken from it is refused by validate.ts and by
# tests/paper-mappings.test.ts. Ambiguity means OMIT the paper, never guess.
#
# Every entry is `status: draft` until the maintainer reviews it.

- paper: kuhn-et-al-2020-nrc-canada
  languages: [kanienkeha]
  source:
    kind: paper
    ref: /summaries/kuhn-et-al-2020-nrc-canada/
    quote: >-
      WordWeaver / Kawennón:nis: A software framework for building verb conjugators for
      polysynthetic languages, instantiated for Kanyen'kéha (Mohawk).
  status: draft
```

- [ ] **Step 4: Run the tests**

Run: `pnpm vitest run tests/paper-mappings.test.ts && pnpm typecheck`
Expected: all pass. A failure on the provenance test names the paper — remove that entry rather than reword the quote to slip past.

- [ ] **Step 5: Report the count**

Print `node -e "..."` or simply state in the task report: how many papers were mapped, how many candidates were rejected for having no subject-matter sentence, and which. The plan predicts about 11 mapped; a materially different number is information, not an error.

- [ ] **Step 6: Commit**

```bash
git add atlas/data/paper-languages.yml atlas/tests/paper-mappings.test.ts
git commit -m "data(sp3a): map papers to the languages they study, at status draft"
```

---

### Task 4: Gate the mappings in validate.ts

**Files:**
- Modify: `atlas/scripts/validate.ts`
- Test: `atlas/tests/validate.test.ts` (extend)

**Interfaces:**
- Consumes: `PaperLanguage` (Task 1), `quoteProvenance` (Task 2).
- Produces: `ValidateInput` gains `paperLanguages: PaperLanguage[]`, `paperLanguageQuotes: { paper: string; where: QuoteProvenance }[]`, `missingMappingFile: boolean`.

Reading summaries from `validate.ts` is deliberate: the provenance rule must be a **build gate**, not only a test, so a bad mapping cannot reach a bundle.

- [ ] **Step 1: Write the failing test**

Append to `atlas/tests/validate.test.ts`:

First extend the shared `base` at the top of the file so every existing call
keeps compiling. The three fields are **required, not optional**: an optional
field lets the CLI forget to pass one and the gate then silently checks nothing.

```ts
const base = {
  methodIds: new Set(['fst-morphological-segmentation']),
  paperIds: new Set(['x-2025']),
  missingDirs: [],
  strayFiles: [],
  paperLanguages: [],
  paperLanguageQuotes: [],
  missingMappingFile: false,
}
```

Then append the new describe block, reusing this file's existing `lang()` and
`init()` helpers — `lang()` has id `kanienkeha`, `base.paperIds` holds `x-2025`:

```ts
/** A mapping is a record like any other: draft blocks the build, unknown ids
 *  are refused, and a quote from the relevance section is refused loudest —
 *  it is the one error that looks correct in review. */
describe('paper-language mappings', () => {
  const mapping = (over: Partial<PaperLanguage> = {}): PaperLanguage => ({
    paper: 'x-2025', languages: ['kanienkeha'],
    source: { kind: 'paper', ref: 'r', retrieved: null, quote: 'q' },
    note: null, status: 'verified', ...over,
  })
  const run = (over: Record<string, unknown>) =>
    validate({ languages: [lang()], initiatives: [init()], ...base, ...over })

  it('blocks the build while a mapping is draft', () => {
    expect(run({ paperLanguages: [mapping({ status: 'draft' })] }).join('\n'))
      .toMatch(/mapping x-2025: status is draft/)
  })

  it('refuses a mapping naming an unknown paper', () => {
    expect(run({ paperLanguages: [mapping({ paper: 'nope' })] }).join('\n'))
      .toMatch(/unknown paper "nope"/)
  })

  it('refuses a mapping naming an unknown language', () => {
    expect(run({ paperLanguages: [mapping({ languages: ['nope'] })] }).join('\n'))
      .toMatch(/unknown language "nope"/)
  })

  it('refuses a quote taken from the relevance section', () => {
    expect(run({ paperLanguageQuotes: [{ paper: 'x-2025', where: 'relevance-only' }] }).join('\n'))
      .toMatch(/relevance/i)
  })

  it('refuses a quote that is not in the summary at all', () => {
    expect(run({ paperLanguageQuotes: [{ paper: 'x-2025', where: 'absent' }] }).join('\n'))
      .toMatch(/does not appear/i)
  })

  it('says so when the mapping file is absent, which is not the same as empty', () => {
    expect(run({ missingMappingFile: true }).join('\n')).toMatch(/paper-languages\.yml/)
  })

  it('passes a clean mapping', () => {
    expect(run({
      paperLanguages: [mapping()],
      paperLanguageQuotes: [{ paper: 'x-2025', where: 'subject-matter' }],
    })).toEqual([])
  })
})
```

Import `PaperLanguage` from `../src/schema/index.js` alongside the existing
`Initiative`/`Language` type import.

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm vitest run tests/validate.test.ts`
Expected: FAIL — `paperLanguages` is not a property of `ValidateInput`.

- [ ] **Step 3: Extend `ValidateInput` and `validate`**

In `atlas/scripts/validate.ts`, add to the interface:

```ts
  /** Hand-curated paper→language links. Gated exactly like the record
   *  directories: a draft blocks the build and an unresolvable id is refused. */
  paperLanguages: PaperLanguage[]
  /** Where each mapping's quote sits in its summary, computed by the CLI below
   *  because `validate` stays pure and filesystem-free. Spec D2. */
  paperLanguageQuotes: { paper: string; where: QuoteProvenance }[]
  /** The mapping file is absent or unreadable — the same failure class as a
   *  missing record directory: zero mappings loaded reads exactly like a file
   *  nobody has written. */
  missingMappingFile: boolean
```

Add inside `validate`, after the initiative loop:

```ts
  if (input.missingMappingFile) {
    problems.push('data/paper-languages.yml is missing or unreadable — no paper maps to any language, which is not the same as an empty list')
  }

  const mappings = input.paperLanguages.filter((m) => m.status !== 'rejected')
  problems.push(...findDuplicates(mappings.map((m) => m.paper), 'paper mapping'))

  for (const m of mappings) {
    if (m.status === 'draft') {
      problems.push(`mapping ${m.paper}: status is draft — review it and set status: verified, or status: rejected`)
    }
    if (!input.paperIds.has(m.paper)) {
      problems.push(`mapping ${m.paper}: unknown paper "${m.paper}" (not in data/derived/papers.json)`)
    }
    for (const ref of m.languages) {
      if (!languageIds.has(ref)) problems.push(`mapping ${m.paper}: unknown language "${ref}"`)
    }
  }

  // Spec D2. Kept separate from the loop above because it is the rule most
  // likely to be quietly relaxed by someone who does not know why it exists.
  for (const q of input.paperLanguageQuotes) {
    if (q.where === 'relevance-only') {
      problems.push(
        `mapping ${q.paper}: the quote appears in the summary only at or after ` +
          '"## Relevance to Indigenous AI". ' +
          'That section is the reviewer writing about applicability to this project, not the paper ' +
          'describing itself — 86 of 92 summaries name Mohawk there. Quote the paper, or drop the mapping.',
      )
    }
    if (q.where === 'absent') {
      problems.push(`mapping ${q.paper}: the quote does not appear in its summary at all`)
    }
  }
```

Add to the CLI block at the bottom:

```ts
const MAPPINGS = url('../data/paper-languages.yml')
const SUMMARY_DIR = url('../../litterature_review/summaries')
const mappingStatus = paperLanguagesFileStatus(MAPPINGS)
const paperLanguages = mappingStatus === 'ok' ? loadPaperLanguages(MAPPINGS) : []
```

and inside the `validate({...})` call:

```ts
    paperLanguages,
    paperLanguageQuotes: paperLanguages.map((m) => ({
      paper: m.paper,
      where: quoteProvenance(readFileSync(join(SUMMARY_DIR, `${m.paper}.md`), 'utf8'), m.source.quote ?? ''),
    })),
    missingMappingFile: mappingStatus !== 'ok',
```

Import `join` from `node:path`, and `loadPaperLanguages`/`paperLanguagesFileStatus`/`quoteProvenance`/`PaperLanguage`/`QuoteProvenance`.

- [ ] **Step 4: Run the tests and the gate**

Run: `pnpm vitest run tests/validate.test.ts && pnpm typecheck && pnpm validate; echo "validate exit $?"`
Expected: tests pass; `pnpm validate` exits **1** listing every mapping as draft. That is correct — the maintainer has not promoted them.

- [ ] **Step 5: Mutation-check the D2 gate**

Edit one quote in `atlas/data/paper-languages.yml` to a sentence taken from that summary's `## Relevance to Indigenous AI` section. Run `pnpm validate`. Expected: the relevance-section message, naming that paper. Revert. Record both outcomes in the report.

- [ ] **Step 6: Commit**

```bash
git add atlas/scripts/validate.ts atlas/tests/validate.test.ts
git commit -m "feat(sp3a): gate the mappings, and refuse relevance-section quotes"
```

---

### Task 5: Join the mappings into the bundle

**Files:**
- Modify: `atlas/scripts/bundle.ts`, `atlas/src/lib/load.ts`, `atlas/src/fixtures/atlas.fixture.json`
- Test: `atlas/tests/load.test.ts` (extend)

**Interfaces:**
- Produces: `AtlasBundle.paperLanguages: PaperLanguage[]`, carried through `BundleSchema`.

- [ ] **Step 1: Write the failing test**

Append to `atlas/tests/load.test.ts`:

```ts
it('carries paper-language mappings through the bundle', () => {
  const real = {
    generated: 'now', languages: [], initiatives: [], methods: [], papers: [],
    paperLanguages: [{
      paper: 'p1', languages: ['l1'],
      source: { kind: 'paper', ref: 'r', retrieved: null, quote: 'q' },
      note: null, status: 'verified',
    }],
  }
  const out = chooseBundle({ real, fixture: null, isProduction: false })
  expect(out.paperLanguages).toHaveLength(1)
  expect(out.paperLanguages[0]?.paper).toBe('p1')
})

/** An older bundle predates this field. Defaulting rather than failing keeps a
 *  stale `src/data/atlas.json` from white-screening a developer who has not
 *  re-run `pnpm build:data`. */
it('defaults paperLanguages to empty when a bundle predates the field', () => {
  const real = { generated: 'now', languages: [], initiatives: [], methods: [], papers: [] }
  expect(chooseBundle({ real, fixture: null, isProduction: false }).paperLanguages).toEqual([])
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm vitest run tests/load.test.ts`
Expected: FAIL — `paperLanguages` does not exist on the returned bundle.

- [ ] **Step 3: Implement**

In `atlas/src/lib/load.ts`: add `paperLanguages: PaperLanguage[]` to `AtlasBundle`, import `PaperLanguageSchema`/`PaperLanguage`, and add to `BundleSchema`:

```ts
  paperLanguages: z.array(PaperLanguageSchema).default([]),
```

In `atlas/scripts/bundle.ts`, after the `initiatives` line:

```ts
  // Only mappings that survived review, mirroring the language and initiative
  // filters directly above: `rejected` and `draft` are both excluded, so the
  // bundle carries exactly what a reader may see.
  paperLanguages: loadPaperLanguages(url('../data/paper-languages.yml')).filter((m) => m.status === 'verified'),
```

and extend the closing `console.log` with `${bundle.paperLanguages.length} mappings`.

In `atlas/src/fixtures/atlas.fixture.json`, add a `"paperLanguages": []` key — or one invented entry consistent with the fixture's existing invented ids. **Do not use real paper ids in the fixture**; `tests/build-artifact.test.ts` greps the built output for fixture identifiers.

- [ ] **Step 4: Run the tests and rebuild**

Run: `pnpm vitest run && pnpm typecheck && pnpm bundle`
Expected: all green; `pnpm bundle` prints `… 0 mappings` (every mapping is draft, so none is verified — correct).

- [ ] **Step 5: Commit**

```bash
git add atlas/scripts/bundle.ts atlas/src/lib/load.ts atlas/src/fixtures/atlas.fixture.json atlas/tests/load.test.ts
git commit -m "feat(sp3a): carry verified mappings into the bundle"
```

---

### Task 6: The pure join

**Files:**
- Create: `atlas/src/lib/paper-map.ts`
- Test: `atlas/tests/paper-map.test.ts`

**Interfaces:**
- Produces:
  - `papersForLanguage(bundle: PaperMapInput, languageId: string): Paper[]`
  - `unmappedPapers(bundle: PaperMapInput): { noLanguage: Paper[]; languageNotMapped: { paper: Paper; languages: Language[] }[] }`
  - `type PaperMapInput = { papers: Paper[]; languages: Language[]; paperLanguages: PaperLanguage[] }`

Spec D3 and D4 live here. The two unmapped groups are two different facts and are never merged — `UnmappedList`'s own comment records what happened the last time two kinds of gap shared a card.

- [ ] **Step 1: Write the failing test**

`atlas/tests/paper-map.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { papersForLanguage, unmappedPapers } from '../src/lib/paper-map.js'
import type { Language, Paper, PaperLanguage } from '../src/schema/index.js'

const paper = (id: string): Paper => ({
  id, title: id, authors: 'A', year: 2024, venue: null, themes: [], summary_url: `/summaries/${id}/`,
})
const lang = (id: string, mapped: boolean): Language => ({
  id, name: id, also_known_as: [], glottocode: 'x', iso639_3: 'x', tier: 'indigenous',
  family: 'f', subfamily: null, typology: [], endangerment: null, speakers: null,
  region: 'north-america', countries: ['US'], caveat: null, status: 'verified',
  centre: mapped ? { lat: 1, lon: 2, source: { kind: 'url', ref: 'r', retrieved: '2026-01-01', quote: null }, confidence: 'sourced' } : null,
} as Language)
const map = (p: string, langs: string[]): PaperLanguage => ({
  paper: p, languages: langs,
  source: { kind: 'paper', ref: 'r', retrieved: null, quote: 'q' }, note: null, status: 'verified',
})

const BUNDLE = {
  papers: [paper('drawn'), paper('undrawn'), paper('placeless')],
  languages: [lang('has-centre', true), lang('no-centre', false)],
  paperLanguages: [map('drawn', ['has-centre']), map('undrawn', ['no-centre'])],
}

describe('papersForLanguage', () => {
  it('returns the papers that study that language', () => {
    expect(papersForLanguage(BUNDLE, 'has-centre').map((p) => p.id)).toEqual(['drawn'])
  })
  it('returns nothing for a language nothing studies', () => {
    expect(papersForLanguage(BUNDLE, 'unstudied')).toEqual([])
  })
})

describe('unmappedPapers', () => {
  /** Spec D4: two REASONS, never merged. A paper nobody mapped and a paper
   *  mapped to a language the map cannot draw are different facts, and a reader
   *  who cannot tell them apart learns the wrong thing about coverage. */
  it('separates "no language named" from "language has no centre"', () => {
    const { noLanguage, languageNotMapped } = unmappedPapers(BUNDLE)
    expect(noLanguage.map((p) => p.id)).toEqual(['placeless'])
    expect(languageNotMapped.map((x) => x.paper.id)).toEqual(['undrawn'])
    expect(languageNotMapped[0]?.languages.map((l) => l.id)).toEqual(['no-centre'])
  })

  /** Spec D3's consequence, asserted rather than assumed: a mapped paper is not
   *  necessarily a drawn paper. In SP3a this is the MAJORITY case — 8 of 11
   *  mappable papers map to kanienkeha or amharic, neither of which has a
   *  centre. */
  it('does not count a drawn paper as unmapped', () => {
    const { noLanguage, languageNotMapped } = unmappedPapers(BUNDLE)
    const ids = [...noLanguage, ...languageNotMapped.map((x) => x.paper)].map((p) => p.id)
    expect(ids).not.toContain('drawn')
  })

  /** A paper mapped to two languages, one drawable, is DRAWN — it appears on
   *  the map, so listing it as unmapped would contradict the map beside it. */
  it('treats a paper as drawn when any of its languages has a centre', () => {
    const b = { ...BUNDLE, paperLanguages: [map('undrawn', ['no-centre', 'has-centre'])] }
    expect(unmappedPapers(b).languageNotMapped).toEqual([])
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm vitest run tests/paper-map.test.ts`
Expected: FAIL — cannot resolve `../src/lib/paper-map.js`.

- [ ] **Step 3: Implement**

`atlas/src/lib/paper-map.ts`:

```ts
import type { Language, Paper, PaperLanguage } from '../schema/index.js'

export interface PaperMapInput {
  papers: Paper[]
  languages: Language[]
  paperLanguages: PaperLanguage[]
}

/** The papers that STUDY this language, per the curated mappings. */
export function papersForLanguage(input: PaperMapInput, languageId: string): Paper[] {
  const ids = new Set(
    input.paperLanguages.filter((m) => m.languages.includes(languageId)).map((m) => m.paper),
  )
  return input.papers.filter((p) => ids.has(p.id))
}

/** The two reasons a paper is not on the map, kept apart (spec D4).
 *
 *  `noLanguage` — no mapping names it. 59 of 92 papers in this corpus study no
 *  specific language at all: surveys, tokenizer methods, process papers. That
 *  is a property of the literature, not a sourcing gap.
 *
 *  `languageNotMapped` — mapped, but no language it maps to has a `centre`, so
 *  the map draws nothing for it (spec D3). Not an error and not a gap in the
 *  mapping: `choctaw`, `kanienkeha` and `amharic` all deliberately have no
 *  centre. Merging this with the group above would tell a reader the atlas
 *  knows nothing about a paper it has in fact placed. */
export function unmappedPapers(input: PaperMapInput): {
  noLanguage: Paper[]
  languageNotMapped: { paper: Paper; languages: Language[] }[]
} {
  const byPaper = new Map(input.paperLanguages.map((m) => [m.paper, m.languages]))
  const byId = new Map(input.languages.map((l) => [l.id, l]))
  const noLanguage: Paper[] = []
  const languageNotMapped: { paper: Paper; languages: Language[] }[] = []

  for (const p of input.papers) {
    const ids = byPaper.get(p.id)
    if (ids === undefined || ids.length === 0) {
      noLanguage.push(p)
      continue
    }
    const langs = ids.map((id) => byId.get(id)).filter((l): l is Language => l !== undefined)
    // Drawn if ANY of its languages can be drawn — the paper is visible on the
    // map, so reporting it as unmapped would contradict the map beside it.
    if (!langs.some((l) => l.centre !== null)) languageNotMapped.push({ paper: p, languages: langs })
  }
  return { noLanguage, languageNotMapped }
}
```

- [ ] **Step 4: Run the tests**

Run: `pnpm vitest run tests/paper-map.test.ts && pnpm typecheck`
Expected: 5 passed, tsc clean.

- [ ] **Step 5: Commit**

```bash
git add atlas/src/lib/paper-map.ts atlas/tests/paper-map.test.ts
git commit -m "feat(sp3a): the paper/language join and its two unmapped reasons"
```

---

### Task 7: A Papers section on the language panel

**Files:**
- Modify: `atlas/src/components/LanguagePanel.tsx`, `atlas/src/components/App.tsx`
- Test: `atlas/tests/language-panel-papers.test.tsx`

**Interfaces:**
- Consumes: `papersForLanguage` (Task 6).
- Produces: `LanguagePanel` gains a required prop `papers: Paper[]`.

- [ ] **Step 1: Write the failing test**

`atlas/tests/language-panel-papers.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup } from '@testing-library/react'
import LanguagePanel from '../src/components/LanguagePanel.js'
import type { Language, Paper } from '../src/schema/index.js'

afterEach(cleanup)

const LANG = {
  id: 'l', name: 'Testish', also_known_as: [], glottocode: 'g', iso639_3: 'i',
  tier: 'indigenous', family: 'f', subfamily: null, typology: [], endangerment: null,
  speakers: null, region: 'north-america', countries: ['US'], centre: null,
  caveat: null, status: 'verified',
} as unknown as Language
const PAPER: Paper = {
  id: 'a-paper', title: 'A Paper About Testish', authors: 'X', year: 2024,
  venue: null, themes: [], summary_url: '/summaries/a-paper/',
}

describe('the language panel’s Papers section', () => {
  it('links each paper to its published summary', () => {
    render(<LanguagePanel language={LANG} initiatives={[]} filtered={false} papers={[PAPER]} />)
    const link = screen.getByRole('link', { name: /A Paper About Testish/ })
    expect(link).toHaveAttribute('href', '/summaries/a-paper/')
  })

  /** "not recorded" claims we do not know. We do know: no paper in this atlas
   *  studies this language. The same distinction the Work section already
   *  draws, and the reason that section carries a hint instead of a null. */
  it('says no paper studies it, rather than "not recorded"', () => {
    render(<LanguagePanel language={LANG} initiatives={[]} filtered={false} papers={[]} />)
    expect(screen.getByTestId('field-papers')).toHaveTextContent(/no paper in this atlas/i)
    expect(screen.getByTestId('field-papers')).not.toHaveTextContent(/not recorded/i)
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm vitest run tests/language-panel-papers.test.tsx`
Expected: FAIL — `papers` is not a prop of `LanguagePanel`.

- [ ] **Step 3: Implement**

In `LanguagePanel.tsx`, import `Paper`, add to the props type:

```ts
  /** Papers that STUDY this language, per data/paper-languages.yml. Scoped to
   *  the record, not to the current filters: unlike `initiatives` above, no
   *  facet narrows papers today, so an empty list here is a fact about the
   *  atlas rather than a filter result — and the copy says exactly that. */
  papers: Paper[]
```

and add a section after the `Work` section:

```tsx
      <PanelSection title="Literature">
        <Field label="Papers studying this language" testId="field-papers">
          {papers.length === 0 ? (
            <span className="hint">
              No paper in this atlas studies this language — not a result of the current filters.
            </span>
          ) : (
            <ul>
              {papers.map((p) => (
                <li key={p.id}>
                  <a href={p.summary_url}>{p.title}</a>{' '}
                  <span>({p.year})</span>
                </li>
              ))}
            </ul>
          )}
        </Field>
      </PanelSection>
```

In `App.tsx`, at the `<LanguagePanel …>` call site (around line 147), add:

```tsx
            papers={papersForLanguage(
              { papers: bundle.papers, languages: bundle.languages, paperLanguages: bundle.paperLanguages },
              language.id,
            )}
```

importing `papersForLanguage` from `../lib/paper-map.js`. Use whatever identifier `App.tsx` already uses for the bundle.

- [ ] **Step 4: Run the tests**

Run: `pnpm vitest run && pnpm typecheck`
Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add atlas/src/components/LanguagePanel.tsx atlas/src/components/App.tsx atlas/tests/language-panel-papers.test.tsx
git commit -m "feat(sp3a): show the papers that study a language, linked to their summaries"
```

---

### Task 8: The two unmapped-paper cards

**Files:**
- Modify: `atlas/src/components/UnmappedList.tsx`, `atlas/src/components/App.tsx`
- Test: `atlas/tests/unmapped-papers.test.tsx`

**Interfaces:**
- Consumes: `unmappedPapers` (Task 6).
- Produces: `UnmappedList` gains `noLanguagePapers: Paper[]` and `languageNotMappedPapers: { paper: Paper; languages: Language[] }[]`.

This is the surface that makes 81 of 92 papers reachable. Follow the component's
existing rules: an empty group renders **nothing** (a headed card with nothing
under it reads as a rendering bug), and the two groups never merge.

- [ ] **Step 1: Write the failing test**

`atlas/tests/unmapped-papers.test.tsx`:

```tsx
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import UnmappedList from '../src/components/UnmappedList.js'
import type { Language, Paper } from '../src/schema/index.js'

afterEach(cleanup)

const paper = (id: string): Paper => ({
  id, title: id, authors: 'A', year: 2024, venue: null, themes: [], summary_url: `/summaries/${id}/`,
})
const LANG = { id: 'l', name: 'Testish', centre: null, tier: 'indigenous', caveat: null } as unknown as Language
const base = {
  languages: [], noMatchingWork: [], workFiltered: false, languageFiltered: false,
  onSelect: () => {}, noLanguagePapers: [], languageNotMappedPapers: [],
}

describe('unmapped papers', () => {
  it('lists papers that study no specific language', () => {
    render(<UnmappedList {...base} noLanguagePapers={[paper('a-survey')]} />)
    expect(screen.getByTestId('group-papers-no-language')).toHaveTextContent('a-survey')
  })

  it('lists papers whose language the map cannot draw, and names the language', () => {
    render(<UnmappedList {...base} languageNotMappedPapers={[{ paper: paper('p'), languages: [LANG] }]} />)
    const group = screen.getByTestId('group-papers-language-not-mapped')
    expect(group).toHaveTextContent('p')
    expect(group).toHaveTextContent('Testish')
  })

  /** Two REASONS, never one card. A paper nobody placed and a paper placed on a
   *  language the map cannot draw are different facts about coverage. */
  it('keeps the two reasons in separate groups', () => {
    render(<UnmappedList {...base} noLanguagePapers={[paper('a-survey')]} languageNotMappedPapers={[{ paper: paper('p'), languages: [LANG] }]} />)
    expect(screen.getByTestId('group-papers-no-language')).not.toHaveTextContent('Testish')
    expect(screen.getByTestId('group-papers-language-not-mapped')).not.toHaveTextContent('a-survey')
  })

  /** A headed card with nothing under it reads as a rendering bug — the lesson
   *  this component already records for its language groups. */
  it('renders neither group when both are empty', () => {
    render(<UnmappedList {...base} />)
    expect(screen.queryByTestId('group-papers-no-language')).toBeNull()
    expect(screen.queryByTestId('group-papers-language-not-mapped')).toBeNull()
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm vitest run tests/unmapped-papers.test.tsx`
Expected: FAIL — the test ids do not exist.

- [ ] **Step 3: Implement**

Add the two props to `UnmappedList`, then render a second card after the existing one:

```tsx
      {(noLanguagePapers.length > 0 || languageNotMappedPapers.length > 0) && (
        <section className="card rail-list" aria-label="Papers the map cannot show">
          <p className="section-label">Papers the map cannot show</p>
          {noLanguagePapers.length > 0 && (
            <div data-testid="group-papers-no-language">
              <h3>Study no specific language ({noLanguagePapers.length})</h3>
              {/* A property of the literature, not a sourcing gap: surveys,
                  tokenizer methods and process papers study no one language.
                  Measured on this corpus: 59 of 92. */}
              <p className="hint">
                These study the field rather than a language — surveys, methods, process work. They are
                not missing a mapping.
              </p>
              <ul>
                {noLanguagePapers.map((p) => (
                  <li key={p.id}><a href={p.summary_url}>{p.title}</a> <span>({p.year})</span></li>
                ))}
              </ul>
            </div>
          )}
          {languageNotMappedPapers.length > 0 && (
            <div data-testid="group-papers-language-not-mapped">
              <h3>Placed, but their language is not mapped ({languageNotMappedPapers.length})</h3>
              {/* Spec D3: a paper inherits its language's centre, so a language
                  with `centre: null` leaves its papers undrawn. The atlas DOES
                  know what these papers study — saying only "not mapped" would
                  claim less than we know. */}
              <p className="hint">
                We know which language each of these studies. That language has no cited centre, so the
                map cannot draw it.
              </p>
              <ul>
                {languageNotMappedPapers.map(({ paper, languages }) => (
                  <li key={paper.id}>
                    <a href={paper.summary_url}>{paper.title}</a>{' '}
                    <span>{languages.map((l) => l.name).join(', ')}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
```

In `App.tsx`, compute once and pass both:

```tsx
  const unmapped = unmappedPapers({
    papers: bundle.papers, languages: bundle.languages, paperLanguages: bundle.paperLanguages,
  })
```

then `noLanguagePapers={unmapped.noLanguage}` and `languageNotMappedPapers={unmapped.languageNotMapped}`.

- [ ] **Step 4: Run everything**

Run: `pnpm vitest run && pnpm typecheck && pnpm build:app`
Expected: all tests green, tsc clean, the app builds.

- [ ] **Step 5: Verify the gates still hold**

Run: `pnpm build:data; echo "build:data $?"` — expected **1** (mappings are draft).
Run: `pnpm test:site 2>&1 | tail -5` — expected pass; the deploy still serves the holding page because `build:data` fails, which `expectedBranch` predicts.

- [ ] **Step 6: Commit**

```bash
git add atlas/src/components/UnmappedList.tsx atlas/src/components/App.tsx atlas/tests/unmapped-papers.test.tsx
git commit -m "feat(sp3a): make the 81 unmapped papers reachable, with the reason given"
```

---

## Done when

- `pnpm test` green, `pnpm typecheck` clean, `pnpm build:app` succeeds.
- `pnpm build:data` exits **1**, listing the new mappings as draft — the gate doing its job.
- `pnpm validate` refuses a quote taken from a `## Relevance to Indigenous AI` section, demonstrated by mutation in Tasks 2 and 4.
- `atlas/data/paper-languages.yml` exists, every entry `status: draft`, every quote from the paper's own subject matter.
- Selecting a language shows the papers that study it, each linking to `/summaries/<id>/`; the rail lists the rest under the two reasons they are not on the map.

## Not in scope

- The ~23 new language records — that is SP3b, and the adjacent-tier question in the spec must be settled first.
- Mapping the 39 methods, which have the same problem and the same shape.
- Any change to `litterature_review/`, `data/derived/`, or the deploy pipeline.
