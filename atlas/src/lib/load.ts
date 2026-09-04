import { z } from 'zod'
import {
  InitiativeSchema, LanguageSchema, MethodSchema, PaperSchema,
  type Initiative, type Language, type Method, type Paper,
} from '../schema/index.js'
import fixtureModule from '../fixtures/atlas.fixture.json'

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

/** Vite resolves this at build time; the glob is empty when the gitignored
 *  bundle has not been generated, which is the normal state of a fresh clone. */
const realModules = import.meta.glob('../data/*.json', { eager: true, import: 'default' })

export function loadBundle(): AtlasBundle {
  const entry = Object.entries(realModules).find(([path]) => path.endsWith('/atlas.json'))
  const real = entry?.[1] ?? null
  return chooseBundle({
    real,
    fixture: fixtureModule,
    isProduction: import.meta.env.PROD,
  })
}
