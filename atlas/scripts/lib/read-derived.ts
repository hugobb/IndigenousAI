import { readFileSync } from 'node:fs'
import type { z } from 'zod'

/** Reads one `data/derived/*.json` and PARSES it against the schema its
 *  generator writes it with. Never a cast.
 *
 *  A cast does not avoid this failure, it RELOCATES it. `chooseBundle` parses
 *  the bundle in the VISITOR'S BROWSER, and `vite.config.ts`'s gate only checks
 *  that `src/data/atlas.json` exists — so a schema-invalid derived file
 *  bundles green, builds green, deploys green, and white-screens on first
 *  render. That was measured, not assumed: with a stale `papers.json` staged,
 *  `pnpm bundle` and `pnpm build:app` both exited 0 and wrote a shippable
 *  `dist/`. Parsing here puts the failure in front of the person running the
 *  build, which is the same principle `vite.config.ts` states as "a build that
 *  must not ship leaves nothing behind that could be shipped".
 *
 *  The message names the STALE FILE and the command that rebuilds it. A Zod
 *  path alone reads as `[0].summary_url` — a schema complaint about a file the
 *  reader never edited and has no reason to suspect. `data/derived/` is
 *  generator output: when it fails this parse the file is almost always fine as
 *  written and simply older than its generator. */
export function readDerived<T>(opts: {
  /** Absolute path to the JSON file. */
  path: string
  /** How to name the file to a human, e.g. `data/derived/papers.json`. */
  label: string
  /** The command that regenerates it, e.g. `pnpm extract:papers`. */
  regenerate: string
  schema: z.ZodType<T[]>
}): T[] {
  const { path, label, regenerate, schema } = opts
  const result = schema.safeParse(JSON.parse(readFileSync(path, 'utf8')))
  if (result.success) return result.data

  const issues = result.error.issues
  const shown = issues
    .slice(0, 5)
    .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
    .join('\n')
  const more = issues.length > 5 ? `\n  … and ${issues.length - 5} more` : ''

  throw new Error(
    `${label} does not match the schema it is generated against — ` +
      `${issues.length} problem(s):\n${shown}${more}\n\n` +
      `${label} is GENERATOR OUTPUT and is almost certainly STALE: its generator ` +
      `changed and the file was not rebuilt. Run \`${regenerate}\` (or \`pnpm build:data\`) ` +
      'and commit the result.\n\n' +
      'Refusing to bundle it. A bundle that fails this parse still builds and deploys ' +
      "green, then throws in the visitor's browser — so the failure belongs here, now, " +
      'where someone is watching.',
  )
}
