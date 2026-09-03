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
