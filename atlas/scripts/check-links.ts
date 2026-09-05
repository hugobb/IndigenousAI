import { existsSync, readFileSync, statSync } from 'node:fs'
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

/** Every route the bundle asks a reader to follow. The ONE derivation of that
 *  list: `checkLinks` walks it and the CLI counts it, so the number in "every
 *  one of the N routes resolves" cannot describe a different set from the one
 *  that was checked. */
export function routesOf(bundle: RoutedBundle): string[] {
  const claimed = [
    ...bundle.papers.map((p) => p.summary_url),
    ...bundle.methods.map((m) => m.doc_url),
  ]
  const routes = claimed.filter((r): r is string => typeof r === 'string' && r.startsWith('/'))

  // A route this walk cannot check is not a route that is fine — it is a
  // destination nobody verified. `PaperSchema.summary_url` and
  // `MethodSchema.doc_url` both assert `.startsWith('/')`, so nothing reaches
  // here today; relax either one and the old `.filter()` would have DROPPED the
  // offender and then reported "every one of the N routes resolves", where N
  // still counted it. Two guards on the same fact in two files is exactly the
  // pair that drifts, so this one refuses rather than trusting the other.
  if (routes.length !== claimed.length) {
    const dropped = claimed.filter((r) => !(typeof r === 'string' && r.startsWith('/')))
    throw new Error(
      'check-links: the bundle carries route(s) that are not root-relative, so this ' +
        `walk cannot check them: ${dropped.map((r) => JSON.stringify(r)).join(', ')}. ` +
        'Fix the record or the generator — silently skipping them would report a ' +
        'clean walk over destinations nobody verified.',
    )
  }

  if (routes.length === 0) {
    throw new Error(
      'check-links: the bundle carries no routes to check. An empty walk reads ' +
        'exactly like a clean one, which is how this guard would stop guarding ' +
        'without anybody noticing.',
    )
  }

  return routes
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
  // MkDocs writes `<route>/index.html` for every page.
  return routesOf(bundle).filter((r) => !existsSync(join(siteDir, r, 'index.html')))
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
/** True when a derived file has been regenerated since the bundle was written.
 *
 *  `pnpm bundle` runs only after `validate` passes, so ANY validation failure —
 *  one record reverted to draft is enough — leaves an `atlas.json` from an
 *  earlier successful run sitting beside freshly regenerated `data/derived/*.json`.
 *  Preferring the bundle in that window would walk routes older than the ones
 *  just extracted: a newly added paper whose summary failed to copy would pass
 *  unseen, and the log would say every route resolves. "The gate silently checked
 *  something older than what you just changed" is a bad hour at a bad moment.
 *
 *  Local-only in practice — `src/data/atlas.json` is gitignored, so CI and Vercel
 *  see either a bundle written moments earlier in the same script run or none at
 *  all — which is why the answer is to fall back loudly rather than to refuse.
 *  Refusing would fail a build that has nothing wrong with it, over an artifact
 *  the person did not know was there, and the fix they would reach for is
 *  deleting the check. */
export function bundleIsStale(bundleMtimeMs: number, derivedMtimesMs: readonly number[]): boolean {
  return derivedMtimesMs.some((m) => m > bundleMtimeMs)
}

export function routedBundle(root: string): { bundle: RoutedBundle; source: string } {
  const derivedPaths = {
    papers: join(root, 'atlas/data/derived/papers.json'),
    methods: join(root, 'atlas/data/derived/methods.json'),
  }
  const real = join(root, 'atlas/src/data/atlas.json')

  const stale =
    existsSync(real) &&
    bundleIsStale(
      statSync(real).mtimeMs,
      Object.values(derivedPaths).filter(existsSync).map((p) => statSync(p).mtimeMs),
    )
  if (stale) {
    console.warn(
      'check-links: src/data/atlas.json is OLDER than data/derived/*.json, so it is ' +
        'NOT being walked — the derived files are. `pnpm bundle` runs only after ' +
        '`validate` passes, so this bundle is left over from an earlier run and does ' +
        'not describe the records that were just extracted. Run `pnpm build:data` to ' +
        'rebuild it. Saying so rather than trusting it: a gate that quietly checks ' +
        'something older than what you just changed is worse than no gate.',
    )
  }

  if (existsSync(real) && !stale) {
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
        path: derivedPaths.papers,
        label: 'data/derived/papers.json',
        regenerate: 'pnpm extract:papers',
        schema: z.array(PaperSchema),
      }),
      methods: readDerived({
        path: derivedPaths.methods,
        label: 'data/derived/methods.json',
        regenerate: 'pnpm extract:methods',
        schema: z.array(MethodSchema),
      }),
    },
    source: stale
      ? 'data/derived/*.json (the bundle beside them is STALE — see above)'
      : 'data/derived/*.json (no bundle yet — records still under review)',
  }
}

if (import.meta.filename === process.argv[1]) {
  const root = resolve(import.meta.dirname, '../..')
  const site = process.env['SITE_OUT'] ?? join(root, 'docs/site')
  const { bundle, source } = routedBundle(root)
  // The number of routes actually WALKED, from the same function `checkLinks`
  // walks — not `papers.length + methods.length`, which was equal to it only
  // for as long as both schemas asserted `.startsWith('/')`. A count derived
  // separately from the walk is a count that can outgrow it, and "every one of
  // the N routes resolves" would then be an over-claim about routes that were
  // dropped rather than checked.
  const total = routesOf(bundle).length

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
