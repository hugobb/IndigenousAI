import { z } from 'zod'
import { ISO_DATE } from './source.js'

/** What Glottolog returned for one candidate language name the corpus uses.
 *  This is the audit trail for spec D9's resolution step — D9 calls
 *  name-to-glottocode resolution "the one step in this whole sub-project that
 *  can fail silently": "Maya" matches ~86 languoids on Glottolog's search,
 *  "Nahuatl" ~144, "Quechua" ~185, and picking the wrong one produces a
 *  record that looks entirely correct. `data/glottolog-resolution.yml` is
 *  hand-curated from `https://glottolog.org/resource/languoid/id/<code>.json`
 *  responses, fetched and quoted verbatim — never filled from memory. Task 3
 *  turns this file into a guard checked against the language records
 *  themselves; Tasks 4-6 write those records from these rows.
 *
 *  `level: family` means the searched name is a COVER TERM (spec D8): a
 *  family-level Glottolog response carries no coordinates and no ISO 639-3
 *  code (verified against quec1387, azte1234, maya1287, chat1268, otom1299
 *  and tupi1275, which all return `latitude: null`). `level: dialect` covers
 *  the same absence one step further down the tree (e.g. Saanich,
 *  Inuinnaqtun) — also no coordinates or ISO code, and also not a fetch
 *  failure: it is what Glottolog's own data says. */
export const GlottologResolutionSchema = z.object({
  /** The name exactly as the corpus/paper writes it — NOT Glottolog's name.
   *  Recording a name that differs from Glottolog's own (SENĆOŦEN vs
   *  Saanich, Rarámuri vs Tarahumaran) is the entire point of this field: it
   *  is what lets a reviewer see what was matched to what. */
  searched: z.string().min(1),
  /** Glottolog's `id`. Same shape `Language.glottocode` uses. */
  glottocode: z.string().regex(/^[a-z0-9]{4}\d{4}$/),
  /** Glottolog's own `name`, verbatim, for comparison against `searched`. */
  name: z.string().min(1),
  level: z.enum(['language', 'family', 'dialect']),
  /** Glottolog's `iso639-3`, renamed to match this codebase's underscore
   *  convention (see `Language.iso639_3`) — the JSON's hyphenated key is
   *  deliberately NOT carried over verbatim. */
  iso639_3: z.string().length(3).nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  /** Glottolog's `classification` array, `name` values only, outermost
   *  family first. Empty for a top-level family with no parent of its own
   *  (e.g. Quechuan, Aymaran, Mayan, Basque). */
  classification: z.array(z.string()),
  /** YYYY-MM-DD this row was fetched. */
  retrieved: z.string().regex(ISO_DATE, 'retrieved must be YYYY-MM-DD'),
  /** The curator's judgment call, travelling in the record. Required (by
   *  tests/glottolog-resolution.test.ts) on every `level: family` row — that
   *  is what tells the next reader D8 applies rather than that the row is
   *  incomplete. Also used to explain a non-obvious pick among ambiguous
   *  candidates, or to flag something a later curator should double-check
   *  before a language record is built from this row. */
  note: z.string().min(1).nullable(),
})

export type GlottologResolution = z.infer<typeof GlottologResolutionSchema>
