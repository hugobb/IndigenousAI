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

/** Problems with the published `/atlas/` tree, as readable sentences. Empty is
 *  the pass. `files` are the paths inside `<out>/atlas`, relative to it. */
export function atlasIndexProblems(html: string, files: readonly string[]): string[] {
  const problems: string[] = []

  if (atlasIndexBranch(html) === 'holding') {
    // The hand-written static substitute. A holding page carrying the app's
    // script bundle would mean the app shell shipped while the records that
    // feed it did not — a page that renders nothing and says nothing.
    if (/<script[^>]+src=/.test(html)) {
      problems.push('the holding page carries a script bundle; it must be the hand-written static page')
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
