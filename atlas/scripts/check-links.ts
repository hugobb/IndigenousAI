import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { z } from 'zod'
import { MethodSchema, PaperSchema, type Method, type Paper } from '../src/schema/index.js'
import { readDerived } from './lib/read-derived.js'

/** The part of a bundle that asks a reader to go somewhere. Narrower than
 *  `AtlasBundle` on purpose: `AtlasBundle` is assignable to it, so the tests and
 *  the real bundle both pass one straight in, and the derived-file path below
 *  can hand over exactly the two arrays it has without inventing the rest of a
 *  bundle or casting through `unknown`. */
export interface RoutedBundle {
  methods: readonly { doc_url: string }[]
  papers: readonly { summary_url: string }[]
}

/** Every route the bundle asks a reader to follow, and whether the built site
 *  actually has a page there.
 *
 *  "Never invent a destination" has been this project's rule for three
 *  sub-projects, enforced by comments and careful review. This is the version a
 *  machine can check — and the only thing that catches a summary that failed to
 *  copy, a slug that does not match its file, or a site_url that is subtly
 *  wrong. None of those is visible to any other test. */
export function checkLinks(bundle: RoutedBundle, siteDir: string): string[] {
  const routes = [
    ...bundle.papers.map((p) => p.summary_url),
    ...bundle.methods.map((m) => m.doc_url),
  ].filter((r): r is string => typeof r === 'string' && r.startsWith('/'))

  if (routes.length === 0) {
    throw new Error(
      'check-links: the bundle carries no routes to check. An empty walk reads ' +
        'exactly like a clean one, which is how this guard would stop guarding ' +
        'without anybody noticing.',
    )
  }

  // MkDocs writes `<route>/index.html` for every page.
  return routes.filter((r) => !existsSync(join(siteDir, r, 'index.html')))
}

/** The records to walk, and how to name them in the build log.
 *
 *  DELIBERATELY NOT THE FIXTURE. The plan called for the fixture as the
 *  pre-promotion source, but `src/fixtures/atlas.fixture.json` carries exactly
 *  one invented paper (`fixture-paper`) and one invented method
 *  (`fixture-method`) whose routes no build can ever resolve — the check would
 *  have failed every build on two records that are supposed to be fake, and the
 *  only way to make it green would have been to weaken it or to invent the two
 *  pages. `data/derived/*.json` is the right source: `bundle.ts` copies both
 *  files into the bundle VERBATIM (papers and methods, unlike languages and
 *  initiatives, are not filtered by `status`), so these are the same 131 routes
 *  the real bundle will carry the day the records are promoted. The check is
 *  therefore already a gate over real data, not a rehearsal on two fakes. */
function routedBundle(root: string): { bundle: RoutedBundle; source: string } {
  const real = join(root, 'atlas/src/data/atlas.json')
  if (existsSync(real)) {
    const raw = JSON.parse(readFileSync(real, 'utf8')) as { papers: unknown; methods: unknown }
    return {
      // Parsed, never cast — `readDerived`'s reason applies here too: a route
      // that is not root-relative would otherwise be silently skipped by the
      // filter above and reported as resolving.
      bundle: {
        papers: z.array(PaperSchema).parse(raw.papers) satisfies Paper[],
        methods: z.array(MethodSchema).parse(raw.methods) satisfies Method[],
      },
      source: 'the reviewed bundle (src/data/atlas.json)',
    }
  }
  return {
    bundle: {
      papers: readDerived({
        path: join(root, 'atlas/data/derived/papers.json'),
        label: 'data/derived/papers.json',
        regenerate: 'pnpm extract:papers',
        schema: z.array(PaperSchema),
      }),
      methods: readDerived({
        path: join(root, 'atlas/data/derived/methods.json'),
        label: 'data/derived/methods.json',
        regenerate: 'pnpm extract:methods',
        schema: z.array(MethodSchema),
      }),
    },
    source: 'data/derived/*.json (no bundle yet — records still under review)',
  }
}

if (import.meta.filename === process.argv[1]) {
  const root = resolve(import.meta.dirname, '../..')
  const site = process.env['SITE_OUT'] ?? join(root, 'docs/site')
  const { bundle, source } = routedBundle(root)
  const total = bundle.papers.length + bundle.methods.length

  console.log(`check-links: walking ${total} route(s) from ${source} against ${site}`)

  const dead = checkLinks(bundle, site)
  if (dead.length > 0) {
    console.error(
      `check-links: ${dead.length} of ${total} route(s) have no page in the built site:\n  ` +
        `${dead.join('\n  ')}\n\n` +
        'Every one of these is a citation that 404s for a reader. A route comes from ' +
        '`summaryRoute(id)` (papers) or `/<dir>/<id>/` (methods), so the page is missing ' +
        'because the summary did not copy, the slug does not match its file, or the page ' +
        'was never written. Fix the page or the record — never this check.',
    )
    process.exit(1)
  }
  console.log(`check-links: every one of the ${total} routes resolves`)
}
