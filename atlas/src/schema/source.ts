import { z } from 'zod'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/** Where a claim came from. Embedded wherever the data asserts something.
 *  A `url` source must record when it was read: web pages change, and a
 *  citation to a page with no retrieval date is not a citation. */
export const SourceSchema = z
  .object({
    kind: z.enum(['url', 'paper', 'doc']),
    ref: z.string().min(1, 'ref must not be empty'),
    retrieved: z.string().regex(ISO_DATE, 'retrieved must be YYYY-MM-DD').nullable().default(null),
    quote: z.string().nullable().default(null),
  })
  .superRefine((v, ctx) => {
    if (v.kind === 'url' && v.retrieved === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['retrieved'],
        message: 'a url source must record `retrieved` (YYYY-MM-DD)',
      })
    }
  })

export type Source = z.infer<typeof SourceSchema>
