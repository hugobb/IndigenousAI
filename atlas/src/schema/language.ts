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

/** ONE point, never a boundary. Rendered as a soft edgeless blob.
 *  Native Land Digital's territory polygons were withdrawn (spec §3a): their
 *  Data Sovereignty Treaty forbids redistributing their data and forbids
 *  altering Indigenous land boundaries, which feathering a polygon does.
 *  A cited centre point makes neither claim. */
const CentreSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  source: SourceSchema,
})

export const LanguageSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/, 'id must be lowercase kebab-case'),
    name: z.string().min(1),
    also_known_as: z.array(z.string()).default([]),
    glottocode: z.string().regex(/^[a-z0-9]{4}\d{4}$/).nullable().default(null),
    iso639_3: z.string().length(3).nullable().default(null),
    tier: z.enum(TIERS),
    /** Nullable: a language whose family we have not sourced says so. The
     *  non-nullable version left the seeder no way to express that, so it
     *  wrote an all-caps sentinel string that read like a researched value. */
    family: z.string().min(1).nullable().default(null),
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
    /** Nullable, and never guessed. The seeder used to hardcode
     *  `north-america` for every record it wrote, which silently asserts a
     *  continent for any non-North-American profile in the source draft. */
    region: z.enum(REGIONS).nullable().default(null),
    countries: z.array(z.string().length(2)).default([]),
    centre: CentreSchema.nullable().default(null),
    /** The curator's own hedge about this record, in the record. YAML comments
     *  are dropped by `js-yaml.load`, so a caveat written as a comment never
     *  reaches the bundle and the reviewer promoting the record never sees it. */
    caveat: z.string().min(1).nullable().default(null),
    status: z.enum(RECORD_STATUS),
  })
  .superRefine((v, ctx) => {
    // Spec D5: soft fields are an indigenous-tier feature. An adjacent language
    // must not be able to acquire one by accident.
    if (v.tier === 'adjacent' && v.centre !== null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['centre'],
        message: 'an adjacent-tier language must not carry a centre (spec D5): the adjacent tier is pins only',
      })
    }
  })

export type Language = z.infer<typeof LanguageSchema>
