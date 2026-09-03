import { z } from 'zod'
import { DATA_REGIMES } from './vocab.js'

export const MethodSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.enum(['ml', 'process']),
  /** A set, not one value: several technique docs span a range. */
  data_regime: z.array(z.enum(DATA_REGIMES)).min(1),
  /** The original prose, kept so the bucketing stays auditable. */
  data_regime_note: z.string().nullable(),
  applicable_languages: z.string().nullable(),
  /** Link into the mkdocs guide — this is what makes the map an index. */
  doc_url: z.string().min(1),
})

export type Method = z.infer<typeof MethodSchema>
