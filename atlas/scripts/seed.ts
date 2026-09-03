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
        // Seeded records never get a coordinate: a centre is a researched,
        // cited claim, not something a parser guesses.
        centre: null,
        status: 'draft',
      }),
    )
  }
  return out
}

const url = (p: string): string => fileURLToPath(new URL(p, import.meta.url))

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const draftPath = url('../../papers/review-paper/Draft.md')
  if (!existsSync(draftPath)) {
    console.log(`seed: no draft found at ${draftPath} — nothing to seed`)
    process.exit(0)
  }

  const dir = url('../data/languages')
  mkdirSync(dir, { recursive: true })
  const seeded = seedLanguagesFromDraft(readFileSync(draftPath, 'utf8'))
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
