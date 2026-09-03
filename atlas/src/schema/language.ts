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
