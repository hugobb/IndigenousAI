# SP2b — publication: rulings and what is still owed

Sub-project: put the technique guide and the atlas on one origin, publish the 92
paper summaries, make the atlas's citations resolve, and give the repository its
first CI and its first licences.

Plan: `docs/superpowers/plans/2026-09-05-atlas-sp2b-publication.md`
Spec: `docs/superpowers/specs/2026-09-05-atlas-sp2b-publication-design.md`
Ledger, with every ruling as it was taken: `.superpowers/sdd/2026-09-05-atlas-sp2b-publication/progress.md`
Seam review: `.superpowers/sdd/2026-09-05-atlas-sp2b-publication/task-8-report.md`

---

## THREE THINGS THE USER STILL OWNS

These are not optional and their **order matters**.

### 1. Push the repository

The branch is **more than 150 commits ahead of `origin/main`** and nothing has
been pushed (`git rev-list --count origin/main..HEAD` for the exact figure).
Zenodo reads from GitHub: it archives what the repository contains at the moment
a release is created, so an unpushed commit is not in the DOI'd record. Push
before anything else.

### 2. Promote the ten records

Five languages and five initiatives sit at `status: draft`. Work from
`atlas/data/REVIEW-QUEUE.md`, which records what could and could not be sourced
for each one, and set each to `verified` or `rejected`.

Until then, by design: `pnpm build:data` exits 1, CI's `records-reviewed` job
stays red, and `/atlas/` serves the holding page. None of that is broken.

Three things to do while you are in there:

- **Look at the page in a browser the first time a record is promoted.** The
  seam review rendered the real records once, off an in-memory promotion, and the
  layout was correct with the demo-data banner gone — but that is one look at one
  viewport, and no unit test in this repository computes a layout.
- **Assign methods to initiatives.** All five initiative records carry
  `methods: []`, and `Method.doc_url` is rendered in exactly one place — the
  initiative panel's Methods field. As the data stands, the published atlas will
  show **not one method link**, while the build walks 39 method routes that
  nothing on screen cites.
- **CI's `site` job stays green through the promotion.** It would not have: two
  separate assertions each stated today's holding page as a fact and would have
  failed on the success. Both now compare the published branch against the record
  files themselves, so promoting flips the expectation with the data. See R12 and
  R18.

### 3. Cut the release — push, promote, *then* tag

In that order. A tag creates the Zenodo deposit, and the DOI it mints is
permanent. Tagging before the records are promoted names a dataset of ten drafts
and a holding page, forever.

**Where the DOI goes once minted:**

- `CITATION.cff` — add a top-level `doi: 10.5281/zenodo.XXXXXXX` field. The file
  deliberately carries no placeholder today, with a comment saying why.
- `README.md` — in the "Licence" section, beside the sentence pointing at
  `CITATION.cff`.
- `.zenodo.json` needs nothing: Zenodo mints the DOI from it rather than reading
  one out of it.

**And if the deployment hostname is not what we assumed:**
`https://indigenous-ai-atlas.vercel.app/` is an assumption — no deploy has
happened. It is stated in **three** published files — `docs/mkdocs.yml`'s
`site_url`, `CITATION.cff`'s `url`, and the site link in `README.md` — and
`atlas/tests/deploy-hostname.test.ts` fails if you change one and not the others.
Correct all three in one commit. That test also insists the guide sits at the
origin **root**: every citation in the atlas is a root-relative route, so a path
prefix would 404 all of them.

(This said "exactly two" until the whole-branch review counted. The guard was
built over the pair and the README, which Task 7 had correctly added, was left
out of it — see R17.)

**The one thing to watch on the first real deploy (spec D1, still unverified).**
Nothing has ever run `scripts/build-site.sh` on Vercel's build image. The Node
half is a well-founded expectation — the root `package.json` declares
`packageManager` and `engines.node` so Vercel provisions pnpm and Node 22. The
**Python half is open**: whether that image runs `python3 -m venv` +
`pip install`. If it fails, the build now says what to fix rather than emitting a
traceback. Do not "fix" it by switching to a bare `pip install`; read the comment
above that line first.

---

## Rulings taken during SP2b

R1–R11 were taken during Tasks 1–7 and are recorded in full, with their
cost-if-wrong, in the execution ledger. In brief:

| # | Ruling |
|---|---|
| R1 | The plan listed the root `.gitignore` as modified but no step touched it — removed from the Files list rather than inventing a change to justify it |
| R2 | **The plan's Python assumption was wrong, and wrong in the worse direction.** A bare `pip install` would have passed on Vercel and broken on this machine (`python3` is 3.9.6 from the Command Line Tools; mkdocs installed nowhere). `build-site.sh` builds `docs/.venv` instead, preferring python3.13/3.12, overridable with `PY_BIN` |
| R3 | Plain `pnpm`, not `corepack pnpm` — corepack is not enabled here |
| R4 | **The implementer does not deploy.** A deploy publishes this repository's content; that is the user's to authorize. Task 2 proved the script locally and stopped |
| R5 | The holding page moved out of `atlas/public/`. `public/` means "part of the app bundle", so the first successful build would have published a live page asserting in the present tense that nothing had been reviewed — at the moment that became false |
| R6 | A minimal root `package.json`. `vercel.json` sets `framework: null` and the only package is a directory down, so Vercel had nothing at the root from which to detect a package manager or a Node version |
| R7 | `engines.node: 22.x`, not the exact patch — Vercel rejects a patch it does not ship. `atlas/.nvmrc` stays authoritative and `tests/toolchain.test.ts` reconciles them |
| R8 | **The "never edit `atlas/data/**`" constraint narrowed to exclude `atlas/data/derived/**`.** That directory is generator output, and the tracked `papers.json` was being rejected 92/92 by the schema its own commit introduced. The constraint protects human editorial judgement, not machine output |
| R9 | **The paper title is not the link; the trailing word "summary" is.** A method name is our label for our page — one object. A paper title is a third party's name for a third party's object, and in every citation convention a reader has met a linked title resolves to THE PAPER. Ten citations followed would have been ten of our summaries and zero papers |
| R10 | `bundle.ts` parses both derived files rather than casting. The cast is what let a schema-invalid artifact reach a visitor's browser off a green build and a green deploy. Demanding the symmetric guard is what exposed that `MethodSchema.doc_url` had no route-shape constraint at all |
| R11 | **The plan's Task 6 contradicted itself** — it asked the link gate to walk the fixture, whose two invented records no build can produce and which `deploy-output.test.ts` forbids emitting. It walks `data/derived/*.json` instead: the same 131 real routes the bundle will carry |

### R12 (seam review) — a test must not fail on the day the project succeeds

`tests/deploy-output.test.ts` asserted, unconditionally, that `/atlas/index.html`
is the holding page. That is one of two branches `build-site.sh` can take, and
they swap over exactly once — on the promotion above. CI's `site` job would have
gone red at the moment `records-reviewed` finally went green: the one moment
somebody has to read those two results together.

**Decided:** read which branch the tree took and assert that branch's invariants,
and assert in *both* that no holding page shipped beside the app. The app branch
is unreachable from a real build until promotion, so both branches are covered on
synthesised HTML in `tests/atlas-index.test.ts`. An assertion whose first real run
is on the day it matters is how this defect happens twice.

*Cost if wrong:* a helper module and nine fast tests.

### R13 (seam review) — one origin means links in both directions

The atlas cited summaries and technique pages; the guide never mentioned the
atlas. A reader who followed a citation landed with no way back, and a reader
arriving at `/` never learned there was an atlas at all — while the README told
the world about `/atlas/`. Putting the two halves on one origin was half-built.

**Decided:** `- Atlas: /atlas/` in the MkDocs nav. MkDocs 1.6 renders an absolute
path as a plain link and logs it at INFO. It 404s under `mkdocs serve`, which is
the honest cost of not duplicating the hostname a third time, and `docs/README.md`
says so.

*Cost if wrong:* one nav line; a developer running `mkdocs serve` alone sees one
dead tab.

### R14 (seam review) — a route the walk cannot check is refused, not skipped

`checkLinks` filtered on `startsWith('/')` while the CLI counted every record —
equal only for as long as both schemas asserted the same thing. Two guards on one
fact in two files is the pair that drifts, and the failure was silent in the worst
direction: "every one of the 131 routes resolves", about a route nobody walked.

**Decided:** `routesOf` is the single derivation, and it throws rather than
dropping. *Cost if wrong:* a build fails loudly on a record that was already wrong.

### R15 (seam review) — the hostname stays assumed, but the pair is guarded

An env-var override would make the canonical URL self-correcting on Vercel and add
a *third* place the value can come from. Two files that must agree, plus a test
that says so, is the smaller surface. `atlas/tests/deploy-hostname.test.ts`.

### R16 (seam review) — comments that will expire name their trigger; they do not become schema rules

`SourcedField`'s "a doc ref is a repo path" is still true (all 13 real
`Source.kind` values are `url`) and becomes false the day a `doc` ref names a
published summary — `/summaries/<id>/` has been a real route since this
sub-project. A schema rule forbidding `/`-leading `doc` refs would block a
legitimate future citation to buy a case with zero instances. The comment names
the trigger instead, and says the fix belongs there rather than at the call site.

### R17 (whole-branch review) — the guarded set is three files, and a comment is not a count

`git grep -l indigenous-ai-atlas.vercel.app` returns three published files.
Task 7 added the README link, correctly; the seam review guarded the other two
and concluded "exactly two files" in three places. Two correct decisions, one
wrong conclusion — the eleventh composition defect on this project, and its
signature shape. The concrete consequence: the promoter edits the two named
files, the guard goes green, and the README — what GitHub renders and what the
Zenodo record shows — still names a host that does not exist.

**Decided:** the guard reads every markdown autolink in README.md, not the first,
so a second stale link fails too; and the comments in `mkdocs.yml` and
`CITATION.cff` say not to trust a count written in a comment, including their own.

### R18 (whole-branch review) — a canary that states today's fact has the same failure timing as the bug

The R12 fix added `expect(atlasIndexBranch(html)).toBe('holding')` beside itself.
That is the same unconditional assertion in a smaller box: red on promotion day,
in the same run, for the same reason.

**Decided:** compare the published branch against the RECORDS, read through
`loadLanguages`/`loadInitiatives` so there is no second reader of record state.
Read the other way round it is stronger than what it replaced — an app published
at `/atlas/` while any record is still `draft` is the review gate breached on the
tree that actually deploys, and nothing else looks at that.

*Lesson worth keeping:* a fix and its own regression can ship in one commit. The
seam review found SP2a's ninth defect inside SP2a's seam-review fix, then put one
inside its own.

### R19 (whole-branch review) — generated prose is content, and content gets guarded

The `/summaries/` index — the page every paper citation routes a reader through —
published "Each is cited from the atlas, and each links to its own source". Both
false: 2 of 92 papers are named by any initiative, and 77 of 92 summaries contain
no URL. No test read it, and `check-links` cannot: it walks routes, not sentences.

**Decided:** state only what is measurable from the directory being described, and
guard both halves — the claim that IS made, checked against the 92 real files, and
the class of claim that must not come back (an assertion about how these files
relate to something outside their own directory).

### R20 (whole-branch review) — `mkdocs build --strict`

Without it, anything MkDocs can only warn about ships green: with
`summaries/index.md` missing the build exits 0 and the front page carries a raw
`.md` href that 404s. Guide-internal links are outside `check-links` by
construction. The tree is warning-clean today, so it was free.

### R21 (coordinator ruling) — one line inside `docs/docs/`

The standing prohibition on editing `docs/docs/` protects authored guide content.
`docs/docs/index.md` shipped an anchor whose text promised
`tasks/2026-06-11-technique-inventory/` and whose href was `https://github.com`.
A link that lands somewhere it does not claim is not the author's content, it is
a defect, and "never invent a destination" is the rule this sub-project built a
CI gate to enforce. The coordinator ruled a narrow exception for that one line.

**Decided:** remove the anchor, keep the path in the text. `git remote` gives
`github.com/hugobb/IndigenousAI`, from which a URL could be composed — but the
repository is unpushed and its visibility unknown, so that would replace one
unverified destination with another.

### R22 (scoped re-review, 2026-09-05) — two definitions of "publishable" disagreed

The re-review that R17-R21 were never checked by. Every new guard held under
mutation, and it found one hole that the fixes themselves had widened.

`expectedBranch` asked *is any record a draft?*; `bundle.ts` filtered on
`status === 'verified'`. Those disagree on `rejected`. With every record
rejected, `validate.ts` passes (rejected is an outcome of review, not an error),
`bundle.ts` writes two empty arrays, and an atlas with no pins publishes as the
real app with the suite green. `recordDirStatus` does not see it — every file is
present and readable.

It was already noted as a residual, too kindly. The assertion R18 replaced,
`expect(branch).toBe('holding')`, would have caught this; removing its bad
timing removed the only thing standing in front of the path. A fix and its own
regression in one commit, one layer down — the same shape R18 records.

**Decided:** close it on both sides, because a guard on one side alone
recreates the disagreement. `scripts/lib/empty-record-set.ts` refuses to write a
bundle with no verified records, reading the object about to be written rather
than the record files a second time; `expectedBranch` gains the matching arm, so
the branch it predicts is the branch `build-site.sh` actually takes.

Deliberately narrow: it refuses the EMPTY set, not a lopsided one. Verified
languages with every initiative rejected is a thin atlas, not a broken one, and
a curator working the review queue can legitimately be there.

The guard's first message named `rejected` as the cause. That would have been
false the day it shipped — all ten records are `draft` — so it now states only
what the bundle shows and points at `pnpm validate` for which.

*Verified by consumption, not existence:* with the production filter mutated so
nothing matches, the real `pnpm bundle` exits non-zero with that message and
writes no `atlas.json`.

*Cost if wrong:* one pure module and four tests; the refusal is reachable only
from a state no curator has asked for.

---

## Still published, and still the user's call

- **`docs/docs/guide/index.md` is a stub** — "_Content coming soon._" — behind a
  top-level nav tab and a home-page card reading "Read the Guide". The holding
  page no longer calls the guide "complete"; the stub is still published. It
  blocks announcing rather than deploying, and removing a tab from the author's
  own guide is an editorial call, not ours.
- **`docs/docs/index.md` still says "two inventories"** and never mentions the
  paper summaries or the atlas, both of which are now top-level nav tabs. Same
  reason: authored content, and beyond the one-line exception ruled above.
