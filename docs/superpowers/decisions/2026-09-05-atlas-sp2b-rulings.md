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

The branch is **152 commits ahead of `origin/main`** and nothing has been pushed.
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
- **Expect CI's `site` job to stay green through the promotion.** It used not to;
  see ruling R12.

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
happened. It is stated in exactly two files, `docs/mkdocs.yml`'s `site_url` and
`CITATION.cff`'s `url`, and `atlas/tests/deploy-hostname.test.ts` fails if you
change one and not the other. That test also insists the guide sits at the origin
**root**: every citation in the atlas is a root-relative route, so a path prefix
would 404 all of them.

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

---

## Two claims still published that this task could not touch

Both are under `docs/docs/`, which SP2b was forbidden to edit outside the
generated `summaries/`:

- **`docs/docs/index.md` links to `https://github.com`.** The "Source" section
  offers ``[`tasks/2026-06-11-technique-inventory/`](https://github.com)`` — a
  live link on the site's front page that lands on GitHub's home page. It is an
  invented destination, and it is outside `check-links` because that gate walks
  what the *bundle* cites. The same page still says "two inventories" and never
  mentions the paper summaries or the atlas.
- **`docs/docs/guide/index.md` is a stub** — "_Content coming soon._" — behind a
  top-level nav tab and a home-page card reading "Read the Guide". The holding
  page no longer calls the guide "complete"; the stub is still published.
