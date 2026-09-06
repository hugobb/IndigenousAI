/** What must be true of the file published at `/atlas/index.html`, in EITHER
 *  state the deploy can be in.
 *
 *  `scripts/build-site.sh` has two branches there and they swap over exactly
 *  once, on the day the ten curated records are promoted out of `status: draft`:
 *  the holding page while `pnpm build:data` exits non-zero, the built app after.
 *  A test that asserts one branch unconditionally is correct until that day and
 *  then fails ON THE SUCCESS — turning CI's `site` job red at the moment
 *  `records-reviewed` finally goes green, which is the one moment somebody needs
 *  to read those two results together.
 *
 *  So this says which branch the tree took and checks THAT branch's invariants.
 *  Pure, and unit-tested on both branches in tests/atlas-index.test.ts, because
 *  the app branch cannot be exercised by a real build until the records are
 *  promoted — and an unexercised assertion written on promotion day is how this
 *  defect happens twice. */

export type AtlasIndexBranch = 'holding' | 'app'

/** Derived from the page's own words, not from an env var or a build exit code:
 *  whatever is actually published at that URL is what a reader gets. */
export function atlasIndexBranch(html: string): AtlasIndexBranch {
  return /awaiting record review/i.test(html) ? 'holding' : 'app'
}

/** Which branch the RECORDS call for. `scripts/validate.ts` fails on any record
 *  still `status: draft`, and `pnpm build:data` is what `build-site.sh` branches
 *  on — so this is the same question asked of the source of truth rather than of
 *  the output.
 *
 *  Stating today's branch as a bare constant is what the whole-branch review
 *  caught: `expect(branch).toBe('holding')` is correct until the ten records are
 *  promoted and then fails ON THE PROMOTION, which is the exact failure timing
 *  the rest of this module was written to remove. Comparing against the record
 *  state instead keeps the assertion and loses the timing — and it is stronger
 *  in the direction that matters most: an app published while a record is still
 *  a draft is the review gate breached, and this is the only place that would
 *  say so about the tree that actually deploys. */
export function expectedBranch(statuses: readonly string[]): AtlasIndexBranch {
  if (statuses.some((s) => s === 'draft')) return 'holding'
  // And the other end of the same question. `bundle.ts` refuses a set with no
  // verified records (see `scripts/lib/empty-record-set.ts`), so `build:data`
  // fails and build-site.sh serves the holding page. Asking only about drafts
  // said 'app' for a fully-rejected set — the two definitions of "publishable"
  // disagreeing, which is the shape this module was written to remove.
  return statuses.some((s) => s === 'verified') ? 'app' : 'holding'
}

/** Problems with the published `/atlas/` tree, as readable sentences. Empty is
 *  the pass. `files` are the paths inside `<out>/atlas`, relative to it, and
 *  `routeExists` answers whether a root-relative route has a page in the WHOLE
 *  deployed tree (the guide included). */
export function atlasIndexProblems(
  html: string,
  files: readonly string[],
  routeExists: (route: string) => boolean = () => true,
): string[] {
  const problems: string[] = []

  if (atlasIndexBranch(html) === 'holding') {
    // The hand-written static substitute. A holding page carrying the app's
    // script bundle would mean the app shell shipped while the records that
    // feed it did not — a page that renders nothing and says nothing.
    if (/<script[^>]+src=/.test(html)) {
      problems.push('the holding page carries a script bundle; it must be the hand-written static page')
    }
    // It is prose with links out into the guide, hand-written and therefore
    // outside `scripts/check-links.ts`, which walks only what the BUNDLE cites.
    // It is also the page every visitor to /atlas/ reads while the records are
    // under review, so a dead link here is the first thing they meet.
    const dead = [...html.matchAll(/href="(\/[^"#?]*)"/g)]
      .map((m) => m[1] as string)
      .filter((r) => !routeExists(r))
    if (dead.length > 0) {
      problems.push(`the holding page links to route(s) with no page: ${dead.join(', ')}`)
    }
  } else {
    // The real app. `base: '/atlas/'` is what makes one origin work, and this
    // is the only place it is checked on the tree that actually deploys.
    const urls = [...html.matchAll(/(?:src|href)="(\/[^"]*)"/g)].map((m) => m[1] as string)
    if (urls.length === 0) {
      problems.push('the app shell emitted no root-relative asset URLs, so nothing here was checked')
    }
    const outside = urls.filter((u) => !u.startsWith('/atlas/'))
    if (outside.length > 0) {
      problems.push(`the app shell points outside /atlas/: ${outside.join(', ')}`)
    }
  }

  // Both branches. The holding page says IN THE PRESENT TENSE that nothing has
  // been signed off. Published beside the app it is a live page contradicting
  // the atlas next to it, at the URL a collaborator bookmarked during the wait.
  const strays = files.filter((f) => f !== 'index.html' && /pending|holding/i.test(f))
  if (strays.length > 0) {
    problems.push(`a holding page shipped beside the app: ${strays.join(', ')}`)
  }

  return problems
}
