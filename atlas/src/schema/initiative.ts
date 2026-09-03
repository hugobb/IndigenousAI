import { z } from 'zod'
import { ISO_DATE, SourceSchema } from './source.js'
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
    /** Nullable: an initiative whose start year we could not source says so.
     *  The non-nullable version is what forced Te Hiku Media's `started: 1991`,
     *  a year inferred from a copyright range. Record the inference in
     *  `caveat` instead of promoting it to a cited claim. */
    started: z.number().int().min(1900).max(2100).nullable().default(null),
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
      .array(
        z.object({
          label: z.string().min(1),
          url: z.string().url(),
          // Same rule as SourceSchema.retrieved: a link with no honest
          // retrieval date is not a citation.
          retrieved: z.string().regex(ISO_DATE, 'retrieved must be YYYY-MM-DD'),
        }),
      )
      .default([]),
    transferability: TransferabilitySchema.nullable().default(null),
    /** The curator's own hedge about this record, in the record. YAML comments
     *  are dropped by `js-yaml.load`, so a caveat written as a comment never
     *  reaches the bundle and the reviewer promoting the record never sees it. */
    caveat: z.string().min(1).nullable().default(null),
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
    // `started` is nullable, so there is nothing to compare against when it is
    // absent: the check is skipped rather than firing or throwing.
    if (v.started !== null && v.ended !== null && v.ended < v.started) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['ended'],
        message: `ended (${v.ended}) is before started (${v.started})`,
      })
    }
  })

export type Initiative = z.infer<typeof InitiativeSchema>
