# Atlas SP2b — Publication: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put the atlas and its guide on one stable public origin, publish the 92 paper summaries so every citation resolves, and make the repository citable — without promoting a single record.

**Architecture:** One Vercel project builds MkDocs into `docs/site/`, builds the atlas into `docs/site/atlas/`, and serves the merged tree from one origin, so root-relative links from the atlas into the guide resolve by construction. The draft-record gate is held two ways on purpose: the deploy substitutes a static holding page and succeeds; CI fails loudly.

**Tech Stack:** Vercel, GitHub Actions, MkDocs Material (Python 3.12), Vite 6 + React 19, TypeScript strict, Vitest 2, Playwright, pnpm, Node 22.22.2.

**Spec:** `docs/superpowers/specs/2026-09-05-atlas-sp2b-publication-design.md` — read it before Task 1, along with `docs/superpowers/decisions/2026-09-05-atlas-sp2a-rulings.md`, whose "Owed to SP2b" section is an input and three of whose rulings this plan reverses deliberately.

## Global Constraints

- **Node is not on PATH.** Once per shell: `export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"`. The atlas pins Node **22.22.2** in `atlas/.nvmrc`.
- **Never run `pnpm approve-builds`.** It overwrites `atlas/pnpm-workspace.yaml` and breaks `pnpm test`.
- **Never promote a record to `status: verified`, and never edit `atlas/data/**` — except `atlas/data/derived/**`.** `pnpm build:data` and `pnpm build:app` must both keep exiting non-zero at the end of every task. This is a guarded property, not an inconvenience.
  - **The `derived/` carve-out (ruling R8, Task 5).** The prohibition protects human editorial judgment recorded by hand — a `draft` record silently promoted, a curated fact altered. `atlas/data/derived/` is generator output, and it **must be regenerated whenever its generator changes**, because the invariant it would otherwise break is the more important one: *a commit must not ship a tracked artifact that its own validator rejects.* Task 5 created exactly that condition and it was caught by review, not by any test.
- **Never fabricate a value.** Unknown is `null` and reads as "not recorded".
- **Never invent a destination.** After Task 5 a summary link is legitimate *because the file is published*; before Task 5 it is not. Do not link ahead of the publication.
- **Never edit `litterature_review/`, `docs/docs/`, or `atlas/src/data/**`** — with one carve-out: `docs/docs/summaries/` is written by the build and gitignored (spec D3). No other path under `docs/docs/` may be written.
- **`ATLAS_ALLOW_NO_BUNDLE=1` is a compile-check escape and never a deploy path.** The holding page is hand-written static HTML. Never the fixture.
- `atlas/src/lib/**` is pure: no React, no JSX, no DOM.
- Only these CSS custom properties exist: `--ink`, `--accent`, `--muted`, `--accent-ink`, `--paper`, `--panel`, `--rule`, `--text`, `--text-soft`, `--notice-bg`, `--rail-width`, `--gutter`.
- **Every guard must be mutation-checked**: apply the change it forbids, run it, watch it fail, restore with a targeted edit, verify `git diff` is empty before the next. **If a mutation does not fail, say so and construct the one that does** — four SP2a implementers did exactly that and all four were right.
- **Strings that must agree are asserted together, in one render.** SP2a's worst defect was a suite holding a contradiction in place, each half pinned by a correct guard at the same URL.
- **Never loosen an assertion to make it pass.**
- Commit trailer: `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>`

## Assumed value, stated once

The deployment hostname is not known until the Vercel project exists. This plan assumes **`indigenous-ai-atlas.vercel.app`** and confines it to exactly two files — `docs/mkdocs.yml` (`site_url`) and `CITATION.cff` (`url`). Task 2 reports the real hostname; if it differs, change it in those two places and nowhere else. Do not spread it.

## File Structure

**Create**
- `vercel.json` — build and output configuration, repo root.
- `docs/requirements.txt` — pinned MkDocs dependencies. None exist today.
- `scripts/build-site.sh` — the one build command Vercel runs.
- `atlas/public/atlas-pending.html` — the hand-written holding page.
- `atlas/scripts/copy-summaries.ts` — copies the 92 summaries and generates their index.
- `atlas/scripts/check-links.ts` — the link-integrity gate (G1).
- `atlas/tests/copy-summaries.test.ts`, `atlas/tests/check-links.test.ts`, `atlas/tests/deploy-output.test.ts`
- `.github/workflows/ci.yml`
- `LICENSE` (MIT, code), `LICENSE-CONTENT` (CC-BY-4.0), `CITATION.cff`, `.zenodo.json`

**Modify**
- `.gitignore`, `docs/.gitignore`, `docs/mkdocs.yml`, `AGENTS.md`, `README.md`, `docs/README.md`
- `atlas/vite.config.ts` — `base: '/atlas/'`
- `atlas/scripts/extract-papers.ts` — `summary_url` becomes a route
- `atlas/src/components/InitiativePanel.tsx`, `atlas/src/styles.css` — the five places SP2a wrote the inert rendering into
- `atlas/package.json` — new scripts
- `atlas/tests/*` whose expected values change

---

### Task 1: Stop committing the built site

**Files:**
- Modify: `docs/.gitignore`, `docs/mkdocs.yml`
- Delete from the index: `docs/site/**` (90 files)

The repo-root `.gitignore` needs no change: it already carries `.worktrees/` and
`.superpowers/`, and everything this sub-project generates lives under `docs/`.

**Interfaces:**
- Produces: a repo where `docs/site/` is build output, and `site_url` exists so root-relative routes resolve.

**Why first.** Every later task builds into `docs/site/`. While those 90 files are tracked, each build produces a large spurious diff, and a reviewer cannot tell a real change from rebuild noise.

- [ ] **Step 1: Confirm the starting state**

```bash
cd /Users/hberard/IndigenousAI
git ls-files docs/site | wc -l    # expect 90
grep -c site_url docs/mkdocs.yml || echo "no site_url"
```

- [ ] **Step 2: Untrack the built site**

```bash
git rm -r --cached docs/site
```

This removes them from the index and leaves the files on disk. Do not delete them from disk — a later task rebuilds over them.

- [ ] **Step 3: Rewrite `docs/.gitignore`**

Replace the entire file. Its current contents (`.docusaurus`, `.cache-loader`, `/build`) are Docusaurus leftovers for a generator this project does not use, and its failure to ignore `site/` is exactly why 90 artifacts were committed.

```gitignore
# MkDocs build output. Rebuilt by scripts/build-site.sh on every deploy; never
# committed. This file previously carried Docusaurus ignores for a generator
# this project does not use, and did not ignore site/ — which is how 90 build
# artifacts reached the repository.
site/

# Summaries copied from litterature_review/ at build time (spec D3). The source
# of truth is litterature_review/summaries/; these are reproducible and a manual
# edit here is destroyed by the next build.
docs/summaries/

# The build's Python virtualenv. mkdocs is installed here rather than into the
# system interpreter.
.venv/

.DS_Store
```

- [ ] **Step 4: Add `site_url` to `docs/mkdocs.yml`**

Insert immediately after the `site_author:` line:

```yaml
# Required for root-relative routes to resolve from the deployed origin:
# Method.doc_url is `/ml-techniques/<id>/` and (after SP2b Task 5) summary_url is
# `/summaries/<id>/`. Without site_url MkDocs cannot compute them and the atlas
# ships dead links. If the deployment hostname changes, this and CITATION.cff's
# `url` are the ONLY two places to change.
site_url: https://indigenous-ai-atlas.vercel.app/
```

- [ ] **Step 5: Verify nothing else moved**

```bash
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"
cd atlas && pnpm test && pnpm typecheck
git status --porcelain | grep -v '^D  docs/site/' | head
```

Expected: the suite is untouched at its current count, and the only staged deletions are under `docs/site/`.

- [ ] **Step 6: Commit**

```bash
git add -A docs/.gitignore docs/mkdocs.yml docs/site
git commit -m "chore: stop committing the built site, and give MkDocs a site_url

90 files of MkDocs output were tracked because docs/.gitignore carried Docusaurus
ignores for a generator this project does not use and never ignored site/. The
build produces them; the repository should not carry them.

site_url is what makes Method.doc_url's root-relative routes resolve from a
deployed origin. Without it the atlas ships dead links.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: The first deploy — one origin, guide live, atlas holding

**Files:**
- Create: `vercel.json`, `docs/requirements.txt`, `scripts/build-site.sh`, `atlas/public/atlas-pending.html`, `atlas/tests/deploy-output.test.ts`
- Modify: `atlas/vite.config.ts`, `atlas/package.json`

**Interfaces:**
- Produces: `scripts/build-site.sh`, the single command Vercel runs. Task 3's CI calls it too. The atlas is served under `/atlas/`.

**Why this task is second and not later.** Spec D1 names one unverified assumption in the whole design: that Vercel's build image can run both Python and Node. Everything else is built on top of it. **Prove it before building on it.**

- [ ] **Step 1: Pin the MkDocs dependencies**

There is no `docs/requirements.txt` today, so a build would install whatever `mkdocs-material` resolves to on the day. Create it:

```
mkdocs-material==9.5.39
mkdocs==1.6.1
```

- [ ] **Step 2: Write the failing guard**

```ts
// atlas/tests/deploy-output.test.ts
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'

const REPO = resolve(import.meta.dirname, '../..')
const out = mkdtempSync(join(tmpdir(), 'atlas-deploy-'))
afterAll(() => rmSync(out, { recursive: true, force: true }))

/** Every file the build emitted, as one string. Small enough to scan whole. */
function emitted(dir: string): string {
  let text = ''
  for (const entry of readdirSync(dir, { withFileTypes: true, recursive: true })) {
    if (!entry.isFile()) continue
    const p = join(entry.parentPath, entry.name)
    if (/\.(html|js|json|css)$/.test(entry.name)) text += readFileSync(p, 'utf8')
  }
  return text
}

describe('the deployed tree', () => {
  it('builds, and puts something at /atlas/', () => {
    execFileSync('bash', [join(REPO, 'scripts/build-site.sh')], {
      cwd: REPO, env: { ...process.env, SITE_OUT: out }, stdio: 'pipe',
    })
    expect(existsSync(join(out, 'index.html'))).toBe(true)
    expect(existsSync(join(out, 'atlas/index.html'))).toBe(true)
  })

  // The whole point. While `build:data` exits non-zero the atlas cannot ship
  // data, and the ONLY acceptable substitute is the hand-written holding page.
  // The fixture is invented; `ATLAS_ALLOW_NO_BUNDLE=1` compiles an app with no
  // data. Either reaching a deployable tree is the failure this guards.
  it('never emits a fixture record, whichever path /atlas/ took', () => {
    expect(emitted(out)).not.toMatch(/fixture-/)
  })

  it('serves the holding page while the data build fails', () => {
    const html = readFileSync(join(out, 'atlas/index.html'), 'utf8')
    expect(html).toMatch(/awaiting record review/i)
    // A holding page that shipped the app shell would carry its script bundle.
    expect(html).not.toMatch(/<script[^>]+src=/)
  })
})
```

- [ ] **Step 3: Run it and watch it fail**

```bash
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"
cd atlas && pnpm exec vitest run --exclude '' tests/deploy-output.test.ts
```

Expected: FAIL — `scripts/build-site.sh` does not exist.

**This test must NOT run inside `pnpm test`.** It shells out to `build-site.sh`,
which runs `pip install` and `pnpm install` — and a global constraint of this
project is that `pnpm test` stays offline and fast. Exclude it from the default
run in `atlas/vitest.config.ts`:

```ts
    exclude: [...configDefaults.exclude, 'tests/deploy-output.test.ts'],
```

and add the script that does run it:

```json
    "test:site": "vitest run tests/deploy-output.test.ts",
```

CI's `site` job calls `pnpm test:site`; `pnpm test` never does. Verify both:
`pnpm test` must not mention `deploy-output`, and `pnpm test:site` must run it.

- [ ] **Step 4: Write the holding page**

`atlas/public/atlas-pending.html` — hand-written, no build step, no script tag:

```html
<!doctype html>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Atlas — awaiting record review</title>
<style>
  :root { color-scheme: light }
  body { margin:0; min-height:100vh; display:grid; place-items:center;
         background:#faf9f7; color:#22282b;
         font:16px/1.6 ui-sans-serif,system-ui,-apple-system,sans-serif }
  main { max-width:34rem; padding:2rem }
  h1 { font-size:1.4rem; margin:0 0 .75rem }
  p { margin:0 0 .75rem; color:#5c666c }
  a { color:#1d6a70 }
</style>
<main>
  <h1>The atlas is awaiting record review</h1>
  <p>
    Every record in this atlas is checked by a person before it is published.
    None has been signed off yet, so there is nothing here to show — this page is
    not an error, and nothing is broken.
  </p>
  <p>
    The technique guide this atlas accompanies is complete and available now.
  </p>
  <p><a href="/">Read the guide</a></p>
</main>
```

- [ ] **Step 5: Give the atlas its base path**

In `atlas/vite.config.ts`, inside the returned object, beside `build`:

```ts
    // Served from /atlas/ on the deployed origin (spec D1): one project, one
    // build, one origin, so the atlas's root-relative links INTO the guide
    // (`/ml-techniques/<id>/`, and after Task 5 `/summaries/<id>/`) resolve by
    // construction rather than by a rewrite rule that fails as a silent 404.
    base: '/atlas/',
```

- [ ] **Step 6: Write the build script**

`scripts/build-site.sh`:

```bash
#!/usr/bin/env bash
# The single command Vercel runs, and the same one CI runs. Builds the MkDocs
# guide, then the atlas, and merges them into one output tree.
#
# The draft-record gate is held DIFFERENTLY here than in CI, on purpose
# (spec D2): a failing `build:data` must NOT fail the deploy, because the guide
# is finished and should not wait on unrelated record review. CI fails loudly on
# the same fact. Both postures are correct for their own job.
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="${SITE_OUT:-$REPO/docs/site}"

# A virtualenv, not the system interpreter. On this developer's machine `python3`
# is 3.9.6 from the Command Line Tools, where `pip install` either fails under
# PEP 668 or quietly pollutes a system Python — and mkdocs is not installed at
# all. Vercel's image has 3.12 and would have tolerated a bare pip install, so
# this would have worked in CI and broken locally, which is the worse way round.
PY_BIN="${PY_BIN:-$(command -v python3.13 || command -v python3.12 || command -v python3)}"
VENV="$REPO/docs/.venv"
[ -d "$VENV" ] || "$PY_BIN" -m venv "$VENV"
"$VENV/bin/pip" install --quiet --disable-pip-version-check -r "$REPO/docs/requirements.txt"
"$VENV/bin/mkdocs" build --site-dir "$OUT" --config-file "$REPO/docs/mkdocs.yml"

cd "$REPO/atlas"
pnpm install --frozen-lockfile

mkdir -p "$OUT/atlas"
# `build:data` exits non-zero while any record is still `status: draft`. That is
# the design, so it is tolerated here and NEVER worked around: no fixture, and
# no ATLAS_ALLOW_NO_BUNDLE, which compiles an app carrying no data at all.
if pnpm build:data && pnpm build:app; then
  cp -R dist/. "$OUT/atlas/"
  echo "atlas: shipped with reviewed records"
else
  cp public/atlas-pending.html "$OUT/atlas/index.html"
  echo "atlas: records still under review — holding page served"
fi
```

Then `chmod +x scripts/build-site.sh`.

- [ ] **Step 7: Configure Vercel**

`vercel.json` at the repo root:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "bash scripts/build-site.sh",
  "outputDirectory": "docs/site",
  "framework": null
}
```

- [ ] **Step 8: Run everything**

```bash
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"
cd atlas && pnpm test:site && pnpm test && pnpm typecheck
```

Expected: PASS. **`base: '/atlas/'` changes every asset URL the app emits** — if `pnpm test:browser` is set up, run it; if any test asserts an asset path, fix the test to the new correct path, never by relaxing it.

- [ ] **Step 9: Mutation-check**

1. Make `build-site.sh` fall back to `ATLAS_ALLOW_NO_BUNDLE=1 pnpm build:app` instead of the holding page → "never emits a fixture record" or "serves the holding page" must fail. **If neither fails, that is a finding** — the guard is not reading what it claims.
2. Copy `src/fixtures/atlas.fixture.json` into the output tree → "never emits a fixture record" fails.
3. Add a `<script src>` to the holding page → the holding-page test fails.
4. Remove `base: '/atlas/'` → assets resolve at `/assets/...`; assert this in the deploy test if nothing else catches it.

- [ ] **Step 10: Commit, then deploy and report the hostname**

```bash
git add vercel.json docs/requirements.txt scripts/build-site.sh atlas/
git commit -m "feat: one origin, guide live, atlas behind a holding page

Vercel builds MkDocs and the atlas into one tree so the atlas's root-relative
links into the guide resolve by construction rather than by a rewrite rule whose
failure mode is a silent 404 on a citation.

The draft-record gate is held two ways on purpose: the deploy substitutes a
hand-written static holding page and succeeds, so the finished guide is not held
hostage to record review; CI fails loudly on the same fact. The holding page is
never the fixture and never ATLAS_ALLOW_NO_BUNDLE — both are guarded.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

**Then report to the controller:** whether Vercel's build image ran both Python and Node, and the real deployment hostname. If it differs from `indigenous-ai-atlas.vercel.app`, say so — it must be changed in `docs/mkdocs.yml` and later in `CITATION.cff`, and nowhere else.

---

### Task 3: CI that fails loudly, and independently

**Files:**
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: `scripts/build-site.sh` (Task 2).
- Produces: a CI gate whose data-build job is expected to be red until the records are promoted.

**The failure mode to design against.** `build:data` will be red for weeks. If it runs in the same job as the tests, its red masks every other regression and the suite stops being read. **Each concern is its own job.**

- [ ] **Step 1: Write the workflow**

```yaml
# .github/workflows/ci.yml
name: CI
on:
  push: { branches: [main] }
  pull_request:

jobs:
  # The tests, types and browser suite must report INDEPENDENTLY of the
  # data-build gate below. That gate is expected to be red until every record is
  # human-reviewed, and a standing red that also swallowed a real regression
  # would make the whole workflow unreadable.
  test:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: atlas } }
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version-file: atlas/.nvmrc, cache: pnpm, cache-dependency-path: atlas/pnpm-lock.yaml }
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm test

  browser:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: atlas } }
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version-file: atlas/.nvmrc, cache: pnpm, cache-dependency-path: atlas/pnpm-lock.yaml }
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm test:browser

  # EXPECTED RED until every record is promoted out of `status: draft` via
  # atlas/data/REVIEW-QUEUE.md. It is not a broken build: it is the review gate
  # doing its job, in the open, where it cannot be forgotten. Do not add
  # continue-on-error — a gate nobody sees fail is not a gate.
  records-reviewed:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: atlas } }
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version-file: atlas/.nvmrc, cache: pnpm, cache-dependency-path: atlas/pnpm-lock.yaml }
      - run: pnpm install --frozen-lockfile
      - run: pnpm build:data

  site:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version-file: atlas/.nvmrc, cache: pnpm, cache-dependency-path: atlas/pnpm-lock.yaml }
      - uses: actions/setup-python@v5
        with: { python-version: '3.12' }
      - run: bash scripts/build-site.sh
      - run: cd atlas && pnpm install --frozen-lockfile && pnpm test:site
```

- [ ] **Step 2: Verify the workflow parses**

```bash
python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/ci.yml')); print('valid yaml')"
```

- [ ] **Step 3: Confirm the four jobs are genuinely independent**

Read the workflow back and confirm no job carries `needs:` on `records-reviewed`. A dependency there would make the standing red cascade and hide everything else — the exact failure this task is designed against.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: four independent jobs, one of them expected red

records-reviewed runs build:data, which exits non-zero while any record is still
status: draft. That job is SUPPOSED to be red until every record is human-reviewed
— it is the review gate, in the open, where it cannot be quietly forgotten.

It is a separate job from the tests precisely because it will stay red for a
while: a standing failure sharing a job with the suite would mask a real
regression and the whole workflow would stop being read.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Copy the summaries and generate their index

**Files:**
- Create: `atlas/scripts/copy-summaries.ts`, `atlas/tests/copy-summaries.test.ts`
- Modify: `atlas/package.json`, `docs/mkdocs.yml`, `scripts/build-site.sh`

**Interfaces:**
- Produces: `summaryRoute(id: string): string` returning `/summaries/${id}/`, and `copySummaries(from: string, to: string): string[]` returning the ids copied, sorted. **Task 5 imports `summaryRoute`** — it must not re-derive the route.

**The drift this task exists to prevent.** Two places will compute where a summary lives: this copier, and `extract-papers.ts` in Task 5. If they disagree by one character, every citation 404s and nothing else notices. One exported function, imported by both.

- [ ] **Step 1: Write the failing test**

```ts
// atlas/tests/copy-summaries.test.ts
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { copySummaries, summaryRoute } from '../scripts/copy-summaries.js'

let work: string
const src = (): string => join(work, 'src')
const dst = (): string => join(work, 'dst')

function give(id: string, body = `# ${id}\n`): void {
  mkdirSync(src(), { recursive: true })
  writeFileSync(join(src(), `${id}.md`), body)
}

afterEach(() => rmSync(work, { recursive: true, force: true }))
beforeEach(() => { work = mkdtempSync(join(tmpdir(), 'summaries-')) })

describe('summaryRoute', () => {
  // The single source of truth for where a summary lives. extract-papers.ts
  // imports THIS — two independent derivations that drift by one character turn
  // every citation into a 404 and nothing else in the system notices.
  it('is the published route, not a repo path', () => {
    expect(summaryRoute('ajani-et-al-2024-revitalizing')).toBe('/summaries/ajani-et-al-2024-revitalizing/')
  })

  it('matches the shape Method.doc_url already uses', () => {
    expect(summaryRoute('x')).toMatch(/^\/[a-z-]+\/x\/$/)
  })
})

describe('copySummaries', () => {
  it('copies every summary and reports them sorted', () => {
    give('b-paper'); give('a-paper')
    expect(copySummaries(src(), dst())).toEqual(['a-paper', 'b-paper'])
    expect(readFileSync(join(dst(), 'a-paper.md'), 'utf8')).toBe('# a-paper\n')
  })

  // An index that silently lists fewer than it copied is how a summary goes
  // missing from the site while every file is present on disk.
  it('writes an index naming every copied summary', () => {
    give('a-paper'); give('b-paper')
    copySummaries(src(), dst())
    const index = readFileSync(join(dst(), 'index.md'), 'utf8')
    expect(index).toMatch(/\(a-paper\.md\)/)
    expect(index).toMatch(/\(b-paper\.md\)/)
  })

  it('takes the title from the summary rather than the filename', () => {
    give('a-paper', '# Towards Measuring "Culture" in LLMs\n\nbody\n')
    copySummaries(src(), dst())
    expect(readFileSync(join(dst(), 'index.md'), 'utf8'))
      .toMatch(/Towards Measuring "Culture" in LLMs/)
  })

  // Stale output is worse than none: a summary deleted upstream would keep
  // being served, and the index would stop matching the directory.
  it('clears output left by a previous run', () => {
    give('a-paper')
    mkdirSync(dst(), { recursive: true })
    writeFileSync(join(dst(), 'gone.md'), '# gone\n')
    copySummaries(src(), dst())
    expect(() => readFileSync(join(dst(), 'gone.md'), 'utf8')).toThrow()
  })

  // Refuses to succeed at nothing. An empty copy would sail through the build
  // and produce a site where every citation 404s.
  it('throws rather than copy nothing', () => {
    mkdirSync(src(), { recursive: true })
    expect(() => copySummaries(src(), dst())).toThrow(/no summaries/i)
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

```bash
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"
cd atlas && pnpm exec vitest run tests/copy-summaries.test.ts
```

Expected: FAIL — the module does not exist.

- [ ] **Step 3: Write the script**

```ts
// atlas/scripts/copy-summaries.ts
import { copyFileSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

/** Where a published summary lives on the deployed site. The SINGLE source of
 *  truth: `extract-papers.ts` imports this rather than building the string
 *  again, because two derivations that drift by one character turn every paper
 *  citation into a 404 that no other test can see. Shaped like
 *  `Method.doc_url`'s `/ml-techniques/<id>/` for the same reason. */
export function summaryRoute(id: string): string {
  return `/summaries/${id}/`
}

/** First markdown H1, which is the paper's real title — the filename is a slug
 *  and reads badly in an index of 92. */
function titleOf(markdown: string, fallback: string): string {
  const m = /^#\s+(.+)$/m.exec(markdown)
  return m?.[1]?.trim() ?? fallback
}

/** Copies `litterature_review/summaries/*.md` into the MkDocs tree and writes
 *  their index. Returns the ids copied, sorted.
 *
 *  The destination is emptied first: a summary deleted upstream would otherwise
 *  keep being served, and the index would stop describing the directory beside
 *  it. */
export function copySummaries(from: string, to: string): string[] {
  const ids = readdirSync(from)
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.slice(0, -3))
    .sort()

  if (ids.length === 0) {
    throw new Error(
      `copy-summaries: no summaries found in ${resolve(from)}. Copying nothing ` +
        'would build a site where every paper citation 404s, so this fails loudly ' +
        'rather than quietly succeeding.',
    )
  }

  rmSync(to, { recursive: true, force: true })
  mkdirSync(to, { recursive: true })

  const rows: string[] = []
  for (const id of ids) {
    const body = readFileSync(join(from, `${id}.md`), 'utf8')
    copyFileSync(join(from, `${id}.md`), join(to, `${id}.md`))
    rows.push(`- [${titleOf(body, id)}](${id}.md)`)
  }

  writeFileSync(
    join(to, 'index.md'),
    '# Paper summaries\n\n' +
      `Structured summaries of the ${ids.length} papers behind this guide and the ` +
      'atlas. Each is cited from the atlas, and each links to its own source.\n\n' +
      'These are reference material rather than a reading path, which is why they ' +
      'appear here as one list instead of in the sidebar.\n\n' +
      rows.join('\n') + '\n',
  )

  return ids
}

if (import.meta.filename === process.argv[1]) {
  const root = resolve(import.meta.dirname, '../..')
  const ids = copySummaries(
    join(root, 'litterature_review/summaries'),
    join(root, 'docs/docs/summaries'),
  )
  console.log(`copy-summaries: ${ids.length} summaries`)
}
```

- [ ] **Step 4: Wire it into the build and the nav**

Add to `atlas/package.json` scripts:

```json
    "copy:summaries": "tsx scripts/copy-summaries.ts",
```

In `scripts/build-site.sh`, **before** the `mkdocs build` line:

```bash
( cd "$REPO/atlas" && pnpm install --frozen-lockfile && pnpm copy:summaries )
```

In `docs/mkdocs.yml`, add one nav entry — **one, not 92**. The explicit nav is 65 lines already and would be swamped. Place it last:

```yaml
  - Paper summaries: summaries/index.md
```

- [ ] **Step 5: Run everything**

```bash
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"
cd atlas && pnpm copy:summaries && pnpm test && pnpm typecheck
ls ../docs/docs/summaries | wc -l    # expect 93 — 92 summaries plus index.md
git status --porcelain docs/docs/summaries | head   # expect EMPTY: gitignored
```

- [ ] **Step 6: Mutation-check**

1. Change `summaryRoute` to return `/summary/${id}/` → "is the published route" fails.
2. Drop the `rmSync` → "clears output left by a previous run" fails.
3. Make the empty case return `[]` instead of throwing → "throws rather than copy nothing" fails.
4. Write the index from `ids.slice(1)` → "writes an index naming every copied summary" fails.
5. Use the filename as the title → "takes the title from the summary" fails.

- [ ] **Step 7: Commit**

```bash
git add atlas/scripts/copy-summaries.ts atlas/tests/copy-summaries.test.ts atlas/package.json docs/mkdocs.yml scripts/build-site.sh
git commit -m "feat: publish the 92 paper summaries

They are what every atlas citation points at and they were in no nav and no built
site. Copied from litterature_review/ at build time — that stays the source of
truth and is never edited — into a gitignored directory MkDocs can resolve.

summaryRoute() is exported because Task 5's extract-papers.ts must import it
rather than build the same string again: two derivations that drift by one
character turn every citation into a 404 nothing else would catch.

One nav entry, not 92: reference material, not a reading path.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: `summary_url` becomes a route, and the atlas stops saying it isn't

**Files:**
- Modify: `atlas/scripts/extract-papers.ts`, `atlas/src/schema/paper.ts`, `atlas/src/components/InitiativePanel.tsx`, `atlas/src/styles.css`, `atlas/src/fixtures/atlas.fixture.json`, `atlas/tests/panels.test.tsx`

**Interfaces:**
- Consumes: `summaryRoute` from `../scripts/copy-summaries.js` (Task 4).
- Produces: `Paper.summary_url` holding `/summaries/<id>/`.

**This reverses SP2a deliberately, in five places that must move together.** SP2a made papers inert *because the file was unpublished*. Task 4 published it. The rule never changed — it was always "never invent a destination", not "never link a summary" — but the reversal is not one line. Miss any of the five and the atlas explains at length why it is not linking something it is linking.

The five: (1) the twelve-line comment at `InitiativePanel.tsx:103`; (2) the `.paths-note` sentence *"Summary paths below are files in the review repository, not pages published on this site."*; (3) the `.repo-path` chip styling; (4) the comment at `styles.css:600`; (5) the fixture's `summary_url`.

- [ ] **Step 1: Write the failing test**

Append to `atlas/tests/panels.test.tsx`:

```tsx
  it('links a paper summary, now that the summaries are published', () => {
    const { container } = render(
      <InitiativePanel initiative={ongoing} methods={bundle.methods} bundle={bundle} />,
    )
    const a = container.querySelector('[data-testid="field-papers"] a[href^="/summaries/"]')
    expect(a).not.toBeNull()
    expect(a?.getAttribute('href')).toBe('/summaries/fixture-paper/')
  })

  // The sentence that was true until Task 4 and is false afterwards. Asserted
  // as an ABSENCE because the defect it guards is prose left behind by a
  // change, which no type and no route can catch.
  it('no longer says the summaries are unpublished', () => {
    const { container } = render(
      <InitiativePanel initiative={ongoing} methods={bundle.methods} bundle={bundle} />,
    )
    expect(container.textContent ?? '').not.toMatch(/not pages published on this site/i)
    expect(container.textContent ?? '').not.toMatch(/review repository/i)
  })

  // An unresolvable id still renders as the id with a marker — Task 6 of SP2a's
  // rule, unchanged. A published destination for the resolvable case must not
  // quietly become an invented one for the dangling case.
  it('still never links an unresolved reference', () => {
    const dangling = { ...ongoing, papers: ['no-such-paper'] }
    const { container } = render(
      <InitiativePanel initiative={dangling} methods={bundle.methods} bundle={bundle} />,
    )
    expect(container.querySelector('[data-testid="field-papers"] a')).toBeNull()
    expect(container.textContent ?? '').toMatch(/unresolved reference/i)
  })
```

`ongoing` is the fixture initiative already used by the surrounding tests; reuse the existing local rather than rebuilding it.

- [ ] **Step 2: Run it and watch it fail**

```bash
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"
cd atlas && pnpm exec vitest run tests/panels.test.tsx
```

Expected: FAIL on all three — there is no anchor, and the sentence is present.

- [ ] **Step 3: Generate the route**

In `atlas/scripts/extract-papers.ts`, import the helper and use it:

```ts
import { summaryRoute } from './copy-summaries.js'
```
```ts
        summary_url: summaryRoute(id),
```

Update `atlas/src/schema/paper.ts`'s field comment to say `summary_url` is a site route, and tighten the validator so a repo path can never come back:

```ts
  /** The published route for this paper's summary, e.g. `/summaries/<id>/`.
   *  A site route rather than a repo path since SP2b published the summaries;
   *  `startsWith('/')` is asserted so a reverted generator fails validation
   *  rather than silently shipping an anchor to a file nobody can fetch. */
  summary_url: z.string().min(1).startsWith('/'),
```

- [ ] **Step 4: Make the panel link it, and delete what is no longer true**

In `atlas/src/components/InitiativePanel.tsx`, replace the twelve-line "Citations, NOT navigation" comment with:

```tsx
        {/* Published since SP2b: `summary_url` is a route (`/summaries/<id>/`)
            served from this same origin, so an anchor points at a page that
            exists. The rule did not change — it was always "never invent a
            destination", and the destination now exists. An UNRESOLVED id is
            still never a link: nothing published corresponds to it. */}
```

Remove the whole `.paths-note` block — both the `papers.some(...)` guard and the sentence. Replace the `.repo-path` line with an anchor:

```tsx
                        <cite><a href={paper.summary_url}>{paper.title}</a></cite>
                        {' · '}{paper.authors} · {paper.year}
                        {paper.venue !== null && <> · {paper.venue}</>}
```

The title carries the link, so the separate path line goes entirely.

In `atlas/src/styles.css`, delete the `.repo-path` and `.paths-note` rules and update the comment at line ~600 to say papers are now destinations like methods.

- [ ] **Step 5: Update the fixture**

In `atlas/src/fixtures/atlas.fixture.json`, change the one `summary_url` to `"/summaries/fixture-paper/"`. This is the fixture, not `atlas/data/**` — permitted.

- [ ] **Step 6: Run everything**

```bash
cd atlas && pnpm test && pnpm typecheck
```

Tests asserting the old chip or sentence must be **updated to the new correct expectation, never relaxed**. If a test's premise is gone, rewrite it to assert the new behaviour explicitly rather than deleting it.

- [ ] **Step 7: Mutation-check**

1. Restore the `.paths-note` sentence → "no longer says the summaries are unpublished" fails.
2. Link the unresolved branch too → "still never links an unresolved reference" fails.
3. Hardcode `summary_url` back to `litterature_review/summaries/${id}.md` in the generator → the schema's `startsWith('/')` fails. **If it does not, that is a finding.**
4. Point the anchor at `paper.id` instead of `paper.summary_url` → the href assertion fails.

- [ ] **Step 8: Commit**

```bash
git add atlas/
git commit -m "feat: link paper summaries, now that they are published

SP2a rendered papers inert because summary_url named an unpublished repo file and
an anchor would have invented a destination. Task 4 published them, so the anchor
is now honest — the rule never changed.

The reversal is five places, not one: the twelve-line rationale, the .paths-note
sentence that is now false, the .repo-path chip styling, the styles.css comment,
and the fixture. Missing any one leaves the atlas explaining why it is not linking
something it is linking. The schema now asserts the route starts with '/', so a
reverted generator fails validation instead of shipping a dead anchor.

An unresolved id is still never a link.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Link integrity — enforce what three sub-projects have only documented

**Files:**
- Create: `atlas/scripts/check-links.ts`, `atlas/tests/check-links.test.ts`
- Modify: `atlas/package.json`, `scripts/build-site.sh`, `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: a built site tree, and a bundle (fixture until the records are promoted).
- Produces: `checkLinks(bundle, siteDir): string[]` returning unresolved routes, empty when all resolve.

**Why this is the most valuable test in the sub-project.** "Never invent a destination" has been enforced for three sub-projects by comments and attentive reviewers. This makes it a thing CI proves. It is also the only check that can catch a summary that failed to copy, a slug that does not match its file, or a subtly wrong `site_url` — no existing test sees any of those.

**It runs against the fixture bundle until the records are promoted**, and becomes a gate over real data the day they are. Build it now, wired to fail loudly: adding it after a deploy is green is when the incentive to skip it is highest.

- [ ] **Step 1: Write the failing test**

```ts
// atlas/tests/check-links.test.ts
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { checkLinks } from '../scripts/check-links.js'
import type { AtlasBundle } from '../src/lib/load.js'

let site: string
beforeEach(() => { site = mkdtempSync(join(tmpdir(), 'site-')) })
afterEach(() => rmSync(site, { recursive: true, force: true }))

/** MkDocs writes `<route>/index.html` for every page. */
function publish(route: string): void {
  const dir = join(site, route)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'index.html'), '<h1>ok</h1>')
}

const bundleWith = (
  papers: { id: string; summary_url: string }[],
  methods: { id: string; doc_url: string }[],
): AtlasBundle =>
  ({ generated: '2026-01-01', languages: [], initiatives: [], methods, papers } as unknown as AtlasBundle)

describe('checkLinks', () => {
  it('passes when every route resolves', () => {
    publish('summaries/a'); publish('ml-techniques/m')
    expect(checkLinks(
      bundleWith([{ id: 'a', summary_url: '/summaries/a/' }], [{ id: 'm', doc_url: '/ml-techniques/m/' }]),
      site,
    )).toEqual([])
  })

  // The failure this exists for: a summary that did not copy, or a slug that
  // does not match its file. Both produce a 404 on a citation and nothing else
  // in the system can see either.
  it('reports a summary route with no page behind it', () => {
    publish('ml-techniques/m')
    expect(checkLinks(
      bundleWith([{ id: 'a', summary_url: '/summaries/a/' }], [{ id: 'm', doc_url: '/ml-techniques/m/' }]),
      site,
    )).toEqual(['/summaries/a/'])
  })

  it('reports a technique route with no page behind it', () => {
    publish('summaries/a')
    expect(checkLinks(
      bundleWith([{ id: 'a', summary_url: '/summaries/a/' }], [{ id: 'm', doc_url: '/ml-techniques/m/' }]),
      site,
    )).toEqual(['/ml-techniques/m/'])
  })

  // A bundle with nothing to check must not read as a pass. An empty walk is
  // indistinguishable from a clean one, which is how this guard would quietly
  // stop guarding.
  it('throws rather than pass a bundle with no routes at all', () => {
    expect(() => checkLinks(bundleWith([], []), site)).toThrow(/no routes/i)
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

```bash
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"
cd atlas && pnpm exec vitest run tests/check-links.test.ts
```

Expected: FAIL — the module does not exist.

- [ ] **Step 3: Write the checker**

```ts
// atlas/scripts/check-links.ts
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import type { AtlasBundle } from '../src/lib/load.js'

/** Every route the bundle asks a reader to follow, and whether the built site
 *  actually has a page there.
 *
 *  "Never invent a destination" has been this project's rule for three
 *  sub-projects, enforced by comments and careful review. This is the version a
 *  machine can check — and the only thing that catches a summary that failed to
 *  copy, a slug that does not match its file, or a site_url that is subtly
 *  wrong. None of those is visible to any other test. */
export function checkLinks(bundle: AtlasBundle, siteDir: string): string[] {
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

if (import.meta.filename === process.argv[1]) {
  const root = resolve(import.meta.dirname, '../..')
  const site = process.env['SITE_OUT'] ?? join(root, 'docs/site')
  const real = join(root, 'atlas/src/data/atlas.json')
  const src = existsSync(real) ? real : join(root, 'atlas/src/fixtures/atlas.fixture.json')

  const bundle = JSON.parse(readFileSync(src, 'utf8')) as AtlasBundle
  const dead = checkLinks(bundle, site)

  console.log(
    `check-links: ${src.endsWith('atlas.json') ? 'reviewed records' : 'FIXTURE (records still under review)'}`,
  )
  if (dead.length > 0) {
    console.error(`check-links: ${dead.length} route(s) with no page:\n  ${dead.join('\n  ')}`)
    process.exit(1)
  }
  console.log('check-links: every route resolves')
}
```

- [ ] **Step 4: Wire it into the build and CI**

Add to `atlas/package.json` scripts:

```json
    "check:links": "tsx scripts/check-links.ts",
```

At the **end** of `scripts/build-site.sh`, after the atlas branch:

```bash
# Runs against the fixture bundle until the records are promoted, and becomes a
# gate over real data the day they are. Fails the build either way: a citation
# that 404s is the one defect this artifact cannot ship.
( cd "$REPO/atlas" && SITE_OUT="$OUT" pnpm check:links )
```

The `site` job in `.github/workflows/ci.yml` already runs `build-site.sh`, so this reaches CI with no workflow change. Confirm that by reading the job rather than assuming it.

- [ ] **Step 5: Run everything end to end**

```bash
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"
bash scripts/build-site.sh
cd atlas && pnpm test && pnpm typecheck
```

Expected: the build succeeds, prints the FIXTURE notice, and reports every route resolving. If a route does not resolve, **that is a real finding about Task 4 or Task 5, not a reason to weaken this check.**

- [ ] **Step 6: Mutation-check**

1. Delete one copied summary from `docs/docs/summaries/` and rebuild → `check:links` exits non-zero naming that route.
2. Change `summaryRoute` to `/summary/${id}/` → every summary route is reported.
3. Make `checkLinks` return `[]` unconditionally → all three positive tests fail.
4. Empty the `routes.length === 0` throw → "throws rather than pass a bundle with no routes" fails.
5. Drop `doc_url` from the walk → "reports a technique route with no page behind it" fails.

- [ ] **Step 7: Commit**

```bash
git add atlas/scripts/check-links.ts atlas/tests/check-links.test.ts atlas/package.json scripts/build-site.sh
git commit -m "feat: prove every citation resolves, instead of trusting that it does

'Never invent a destination' has been enforced for three sub-projects by comments
and attentive reviewers. This is the version CI can check.

It is also the only thing that catches a summary that failed to copy, a slug that
does not match its file, or a site_url that is subtly wrong — no existing test
sees any of those. It walks the fixture bundle until the records are promoted and
the real one afterwards, and fails the build either way.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Licence, citation metadata, and the stale Docusaurus references

**Files:**
- Create: `LICENSE`, `LICENSE-CONTENT`, `CITATION.cff`, `.zenodo.json`
- Modify: `README.md`, `AGENTS.md`, `docs/README.md`

**Interfaces:** none consumed; nothing later depends on this task.

**Why the licence matters here.** Without one the repository is all-rights-reserved by default, so a DOI would name something nobody may reuse — which defeats the point of making the atlas citable. Zenodo asks for a licence at deposit regardless. **CC-BY-4.0 for content, MIT for code, recorded as the user's decision** (spec D4).

- [ ] **Step 1: Add the licences**

`LICENSE` — the standard MIT text, copyright `2026 Mila — Indigenous AI`, with this line above it:

```
Applies to the source code in atlas/ and scripts/. Prose, data and paper
summaries are licensed separately under CC-BY-4.0; see LICENSE-CONTENT.
```

`LICENSE-CONTENT` — the standard CC-BY-4.0 text, with this line above it:

```
Applies to prose, data and paper summaries: README.md, Draft.md, docs/,
reports/, litterature_review/ and atlas/data/. Source code is licensed
separately under MIT; see LICENSE.
```

- [ ] **Step 2: Add `CITATION.cff`**

```yaml
cff-version: 1.2.0
title: "Indigenous AI: an atlas of NLP initiatives for Indigenous languages"
message: "If you use this atlas or its technique guide, please cite it."
type: dataset
authors:
  - name: "Mila — Indigenous AI"
# The deployment hostname. This and docs/mkdocs.yml's site_url are the ONLY two
# places it appears — see the plan's "Assumed value, stated once".
url: "https://indigenous-ai-atlas.vercel.app/"
license: CC-BY-4.0
```

No `doi:` field yet — the DOI does not exist until the release is cut, and
inventing one would be exactly the failure this project guards against. Task 8
records where it goes.

- [ ] **Step 3: Add `.zenodo.json`**

```json
{
  "title": "Indigenous AI: an atlas of NLP initiatives for Indigenous languages",
  "upload_type": "dataset",
  "license": "cc-by-4.0",
  "creators": [{ "name": "Mila — Indigenous AI" }],
  "description": "An interactive map of NLP initiatives for Indigenous languages worldwide, published as a companion to a review paper, alongside a technique guide extracted from the literature."
}
```

- [ ] **Step 4: Fix the stale Docusaurus references**

In `AGENTS.md`, replace lines 20-21 — which describe the guide as Docusaurus with `docusaurus.config.ts` and `sidebars.ts` — so the repository tree matches what line 232 already documents correctly:

```
├── docs/                       # MkDocs Material technique guide (cd docs && mkdocs serve)
│   ├── mkdocs.yml
│   └── docs/
```

Rewrite `docs/README.md` entirely. It is currently Docusaurus boilerplate telling a reader to run `yarn start`. Its content, verbatim (outer fence is four backticks because the file itself contains a fenced block):

````markdown
# Technique guide

The MkDocs Material site that accompanies the atlas. Built from the literature
review; deployed at the site root, with the atlas served under `/atlas/`.

## Run it locally

```bash
pip install -r requirements.txt
mkdocs serve
```

## Build it

Do not run `mkdocs build` by hand for a deploy. `scripts/build-site.sh` at the
repository root is the one build command: it copies the paper summaries in,
builds this site, builds the atlas into `atlas/`, and checks that every route the
atlas cites actually resolves.

`site/` is build output and is gitignored. It was tracked until SP2b, which is
why 90 build artifacts were once committed here.
````

- [ ] **Step 5: Add the atlas to the root README**

After the "Research Goal" section, add:

```markdown
## The atlas

An interactive map of NLP initiatives for Indigenous languages, published as a
companion to the review paper: <https://indigenous-ai-atlas.vercel.app/atlas/>

The whole state of a view — filters, timeline window, selected record — is
encoded in the URL, so a specific view can be cited directly. See
[how to cite this view](docs/docs/index.md).

Records are published only after human review. While any record is still under
review the atlas serves a holding page rather than provisional data.
```

- [ ] **Step 6: Verify**

```bash
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"
grep -rn "docusaurus\|yarn start" AGENTS.md docs/README.md README.md || echo "no stale references remain"
python3 -c "import yaml; yaml.safe_load(open('CITATION.cff')); print('CITATION.cff valid')"
python3 -c "import json; json.load(open('.zenodo.json')); print('.zenodo.json valid')"
cd atlas && pnpm test
```

- [ ] **Step 7: Commit**

```bash
git add LICENSE LICENSE-CONTENT CITATION.cff .zenodo.json README.md AGENTS.md docs/README.md
git commit -m "docs: licence, citation metadata, and the last of the Docusaurus references

There was no LICENSE at all, which meant all rights reserved by default — a DOI
would have named something nobody may reuse. CC-BY-4.0 for prose, data and
summaries; MIT for the source.

No doi: field yet. It does not exist until the release is cut, and inventing one
is precisely the failure this project guards against everywhere else.

AGENTS.md described the guide as Docusaurus on line 20 and MkDocs on line 232;
docs/README.md told readers to run yarn start.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: The seam review

**Files:** none created. Findings are fixed where they belong.

**Why this is a task and not a step.** Composition defects on this project are **nine for nine**: two individually-correct decisions in different tasks whose combination is wrong. Per-task review cannot catch them by construction. SP2a's dedicated seam review found eight — and then the whole-branch review found a ninth **inside the seam review's own fix**, on surfaces its author had edited in that same commit. **Review your own diff by the rule this task is named for.**

- [ ] **Step 1: Build the seam table**

One row per pair of tasks sharing a surface. At minimum:

| seam | one side produces | the other consumes | check |
|---|---|---|---|
| T2 ↔ T4 | `build-site.sh` ordering | summaries must be copied *before* `mkdocs build` | does a clean clone build correctly on the first run? |
| T4 ↔ T5 | `summaryRoute()` | `extract-papers.ts` | is there exactly ONE derivation of the route in the tree? |
| T4 ↔ T6 | copied files | route existence | does deleting one summary fail the build? |
| T5 ↔ T6 | the schema's `startsWith('/')` | `checkLinks`' `startsWith('/')` filter | can a route pass one and be skipped by the other? |
| T1 ↔ T2 | `site_url` | the atlas's `base` | do a guide link and an atlas asset both resolve from the deployed origin? |
| T2 ↔ T3 | the deploy tolerates a red data build | CI fails on it | are both still true, and does the CI red mask nothing? |
| T5 ↔ T7 | the atlas links summaries | the README describes the site | do they describe the same thing? |

- [ ] **Step 2: Walk the built site as a reader**

```bash
bash scripts/build-site.sh
cd docs/site && python3 -m http.server 8099
```

Visit `/`, `/atlas/`, `/summaries/`, a specific summary, and a technique doc. Then, from a rendered initiative panel, **click a paper citation and a method link** and confirm both land on a real page. That click is the thing this whole sub-project exists to make work; no test substitutes for doing it once.

Read the pages *together* rather than field by field. Every composition defect this project has produced was visible to a reader and invisible to a test.

- [ ] **Step 3: Check the copy for claims that stopped being true**

Grep the tree for sentences about publication state — `not published`, `repo`, `review repository`, `awaiting`, `not yet` — and check each against what is now true. SP2a shipped a sentence that was correct when written and false two tasks later, and the whole-branch review found another the seam review had itself introduced.

- [ ] **Step 4: Verify the gate still holds**

```bash
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"
cd atlas && (pnpm build:data; echo "build:data exit $?") && (pnpm build:app; echo "build:app exit $?")
git status --porcelain    # nothing from docs/site or docs/docs/summaries
```

Both must still exit non-zero, and no build output may be tracked. If either has changed, SP2b has broken the review gate — the one thing it was built never to do.

- [ ] **Step 5: Fix what the seams surfaced, then re-run everything**

```bash
bash scripts/build-site.sh
cd atlas && pnpm test && pnpm typecheck && pnpm test:browser
```

- [ ] **Step 6: Commit, and record what is owed**

Commit fixes where they belong — several small commits, not one large one.

Then write `docs/superpowers/decisions/2026-09-05-atlas-sp2b-rulings.md` recording: every seam defect found and where it was fixed; the real deployment hostname if it differed from the assumed one; and the three things the user still owns —

1. **Push the repository.** It is ~104 commits ahead of `origin`, and Zenodo reads from GitHub.
2. **Promote the ten records** via `atlas/data/REVIEW-QUEUE.md`. Until then the `records-reviewed` CI job stays red by design and `/atlas/` serves the holding page.
3. **Cut the release, in that order** — push, promote, *then* tag — so the permanent DOI does not name a dataset of ten drafts. Add the resulting DOI to `CITATION.cff` as `doi:` and to the README.
