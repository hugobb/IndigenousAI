import { describe, expect, it } from 'vitest'
import { atlasIndexBranch, atlasIndexProblems } from './lib/atlas-index.js'

/** Both branches of what `scripts/build-site.sh` can publish at `/atlas/`.
 *
 *  The app branch is unreachable from a real build until the ten curated
 *  records are promoted, so tests/deploy-output.test.ts can only ever exercise
 *  the holding branch. That is exactly why the app branch is checked here, on
 *  synthesised HTML: the alternative is an assertion whose first real run is on
 *  the day it matters, which is the failure this whole file exists to prevent. */

const HOLDING = `<!doctype html><title>Atlas — awaiting record review</title>
<main><h1>The atlas is awaiting record review</h1>
<p><a href="/">Read the guide</a> · <a href="/summaries/">Browse the paper summaries</a></p></main>`

/** Stands in for the built tree. The real one is passed by
 *  tests/deploy-output.test.ts and answers off the emitted files. */
const published = (...routes: string[]) => (r: string): boolean => routes.includes(r)

const APP = `<!doctype html><html><head><title>Atlas of Indigenous Language NLP</title>
<script type="module" crossorigin src="/atlas/assets/index-abc.js"></script>
<link rel="stylesheet" crossorigin href="/atlas/assets/index-abc.css"></head>
<body><div id="root"></div></body></html>`

describe('atlasIndexBranch', () => {
  it('reads the holding page from its own words', () => {
    expect(atlasIndexBranch(HOLDING)).toBe('holding')
  })

  it('reads a built app shell as the app', () => {
    expect(atlasIndexBranch(APP)).toBe('app')
  })
})

describe('the holding branch', () => {
  it('passes the real holding page', () => {
    expect(atlasIndexProblems(HOLDING, ['index.html'], published('/', '/summaries/'))).toEqual([])
  })

  it('rejects a holding page carrying the app bundle', () => {
    const problems = atlasIndexProblems(
      `${HOLDING}<script type="module" src="/atlas/assets/index-abc.js"></script>`,
      ['index.html'],
      published('/', '/summaries/'),
    )
    expect(problems).toHaveLength(1)
    expect(problems[0]).toMatch(/script bundle/)
  })

  // Hand-written prose links, so `scripts/check-links.ts` never sees them — it
  // walks what the BUNDLE cites. This page is what every visitor to /atlas/
  // reads while the records are under review.
  it('rejects a holding page linking somewhere the build did not produce', () => {
    const problems = atlasIndexProblems(HOLDING, ['index.html'], published('/'))
    expect(problems).toHaveLength(1)
    expect(problems[0]).toMatch(/no page: \/summaries\//)
  })
})

describe('the app branch — the state this tree reaches on promotion day', () => {
  it('passes a shell whose every root-relative URL is under /atlas/', () => {
    expect(atlasIndexProblems(APP, ['index.html', 'assets/index-abc.js'])).toEqual([])
  })

  // `base: '/atlas/'` dropped or overridden. The guide is at the origin root,
  // so `/assets/…` would collide with it and 404.
  it('rejects a shell pointing outside /atlas/', () => {
    const problems = atlasIndexProblems(APP.replace('/atlas/assets/index-abc.js', '/assets/index-abc.js'), ['index.html'])
    expect(problems).toHaveLength(1)
    expect(problems[0]).toMatch(/points outside \/atlas\//)
  })

  it('refuses to pass vacuously on a shell with no asset URLs at all', () => {
    const problems = atlasIndexProblems('<!doctype html><div id="root"></div>', ['index.html'])
    expect(problems[0]).toMatch(/no root-relative asset URLs/)
  })
})

/** The R5 hazard, checked on the DEPLOYED tree rather than only on `dist/`:
 *  `atlas-pending.html` asserts in the present tense that nothing has been
 *  reviewed. The build that ships the app is exactly the build on which that
 *  became false. */
describe('either branch', () => {
  it('rejects a holding page shipped beside the app', () => {
    const problems = atlasIndexProblems(APP, ['index.html', 'atlas-pending.html'])
    expect(problems).toHaveLength(1)
    expect(problems[0]).toMatch(/holding page shipped beside the app/)
  })

  it('does not mistake the holding page served AS index.html for a stray', () => {
    expect(atlasIndexProblems(HOLDING, ['index.html'], published('/', '/summaries/'))).toEqual([])
  })
})
