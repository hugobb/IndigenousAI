import { z } from 'zod'

export const PaperSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  authors: z.string().min(1),
  year: z.number().int().min(1900).max(2100),
  /** Null when the summary uses the APA `**Citation:**` form. We do not
   *  regex a venue out of a citation string — a wrong venue is worse
   *  than an absent one in a cited artifact. */
  venue: z.string().nullable(),
  themes: z.array(z.string()).default([]),
  /** The published route for this paper's summary, e.g. `/summaries/<id>/`.
   *  A site route rather than a repo path since SP2b published the summaries;
   *  `startsWith('/')` is asserted so a reverted generator fails validation
   *  rather than silently shipping an anchor to a file nobody can fetch. */
  summary_url: z.string().min(1).startsWith('/'),
})

export type Paper = z.infer<typeof PaperSchema>
