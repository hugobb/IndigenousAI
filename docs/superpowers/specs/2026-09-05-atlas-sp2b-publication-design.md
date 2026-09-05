# SP2b — publication: design

**Status:** approved in brainstorming, not yet planned.
**Parent:** `docs/superpowers/specs/2026-09-03-indigenous-nlp-atlas-design.md` §9.
**Predecessor:** SP2a, merged `6bc8c05`. Read
`docs/superpowers/decisions/2026-09-05-atlas-sp2a-rulings.md` first — its
"Owed to SP2b" section is an input to this spec, and three of its rulings are
reversed here on purpose.

## 1. What SP2b is for

The atlas exists to be cited by a review paper. Today it runs only on a
developer's machine: there is no deployment, no CI, no licence, no DOI, and the
92 paper summaries every citation points at are not published anywhere. SP2b
makes the work addressable — a stable URL, a citable identifier, and links that
resolve.

It does **not** promote any record. The ten records stay `status: draft`; that is
human review via `atlas/data/REVIEW-QUEUE.md` and remains the user's own work.
SP2b is built to fail loudly until it happens.

## 2. Starting state, verified

- **No `.github/` directory.** There is no CI of any kind.
- **No `vercel.json`,** no deployment configuration anywhere.
- **`docs/site/` — 90 files of built MkDocs output — is committed to git.**
- `docs/mkdocs.yml` has **no `site_url`**, so `Method.doc_url`'s root-relative
  routes cannot resolve from a deployed origin.
- `atlas/vite.config.ts` sets **no `base`**; the atlas assumes it is served at `/`.
- **No `LICENSE`**, no `CITATION.cff`, no `.zenodo.json`.
- `litterature_review/summaries/` holds **92 files**, in no nav and no built site.
- `summary_url` is *generated* at `atlas/scripts/extract-papers.ts:57` as
  `litterature_review/summaries/${id}.md` — a repo path, not a route.
- `docs/mkdocs.yml` has an explicit 65-line `nav:`.
- `docs/README.md` is Docusaurus boilerplate; `docs/.gitignore` ignores
  `.docusaurus`, `.cache-loader` and `/build`, none of which exist, and does not
  ignore `site/`. `AGENTS.md:20-21` calls the guide Docusaurus while
  `AGENTS.md:232` correctly documents MkDocs Material.
- Local `main` is **104 commits ahead of `origin` and unpushed**.
- `pnpm build:data` and `pnpm build:app` both **exit 1 by design**.

## 3. Decisions

### D1. One Vercel project, one build, one origin

The build runs `mkdocs build` into `docs/site/`, then `vite build` into
`atlas/dist/`, then copies that to `docs/site/atlas/`. Vercel's output directory
is `docs/site`. The atlas gets `base: '/atlas/'` in `vite.config.ts`.

**Not two projects with rewrites.** Both `Method.doc_url` and the newly-live
`summary_url` are root-relative links *from the atlas into the guide*. Under one
origin they resolve by construction. Under two projects they resolve only while a
rewrite rule is correct, and a broken rewrite fails as a 404 on a citation —
silently, and in the one dimension this artifact cannot afford to be wrong in.

**The known risk:** Vercel's build must run both Python and Node. Its build image
ships Python 3.12, so `pip install mkdocs-material && mkdocs build` is expected to
work, but this is unverified until a real deploy. **Sequence the first deploy
early**, before anything else is built on top of it.

### D2. The guide ships; the atlas waits. Deploy and CI take opposite postures

The same fact — `build:data` exits 1 — is handled two ways, deliberately:

- **The deploy tolerates it.** If the data build fails, the build emits a static
  holding page at `/atlas/` and the deploy **succeeds**, so the finished guide is
  not held hostage to unrelated record review.
- **CI does not tolerate it.** GitHub Actions runs `build:data` and **fails
  loudly on every run** until the records are promoted.

**The holding page MUST be hand-written static HTML.** Not the app built with
`ATLAS_ALLOW_NO_BUNDLE=1` — that flag is a compile-check escape and has never
been a deploy path — and never the fixture. This project has already shipped an
invented fixture into a deployable `dist/` once; the holding page is a new door
into the same room. See G2.

The holding page says plainly that the atlas is awaiting record review, and does
not imply breakage.

### D3. Publish the 92 summaries; `summary_url` becomes a route

**This reverses SP2a on purpose, and the reversal is not just an added link.**
SP2a made papers deliberately inert, and that decision is written into five
places, every one of which must move together:

1. the twelve-line comment at `atlas/src/components/InitiativePanel.tsx:103`
2. the `.repo-path` monospace-chip styling
3. the comment at `atlas/src/styles.css:600`
4. the `.paths-note` sentence now on screen — *"Summary paths below are files in
   the review repository, not pages published on this site."* — which becomes
   **false** on the day of publication
5. the SP2a decision record's statement of the rule

The rule itself does not change. It was always **never invent a destination**,
not "never link a summary". The destination will exist.

**Mechanism.** A build step copies `litterature_review/summaries/*.md` into
`docs/docs/summaries/` and generates an index page. The copies are gitignored.
`litterature_review/` stays the source of truth and is never edited — AGENTS.md
requires that independently.

**Nav: one entry, not 92.** `docs/mkdocs.yml`'s explicit nav would be swamped.
A single "Paper summaries" entry points at the generated index; individual pages
are reachable from that index and from the atlas's citations, not from the
sidebar. They are reference material, not a reading path.

**`summary_url` becomes `/summaries/<id>/`**, generated in the same script and in
the same shape as `Method.doc_url`'s `/ml-techniques/<id>/`, so the two cannot
drift.

**Flagged to the user, who chose to proceed:** publishing turns 92 private
reading notes into a public annotated bibliography of other people's work. Each
carries its source link and this is ordinary scholarly practice, but the prose
was written for an audience of one. **The plan must include reading a sample
before the first deploy, not after.**

### D4. Licensing: CC-BY-4.0 for content, MIT for code

Prose, data and summaries under CC-BY-4.0; the atlas source under MIT. Without a
licence the repository is all-rights-reserved by default, which would make a DOI
point at something nobody may reuse. Recorded as the user's decision.

### D5. Zenodo: prepare, do not deposit

SP2b adds `CITATION.cff`, `.zenodo.json`, a "how to cite this view" note, and
documents the release procedure. It does **not** cut the release.

Two dependencies the user owns, and the order matters: the repo must be **pushed**
(104 commits ahead), and the release must come **after** the records are promoted
— otherwise the permanent DOI names a dataset of ten drafts.

The "how to cite this view" note is atlas-side: the atlas already encodes its
whole state in the URL, so a reader can cite a specific filtered view. The note
explains that, alongside the concept DOI.

### D6. Untrack built output

`docs/site/` is removed from the index and gitignored; the deploy builds it from
source. `docs/.gitignore` is rewritten for MkDocs — the current contents are
Docusaurus-only, which is precisely why 90 artifacts were committed.

### D7. Docs hygiene

`AGENTS.md:20-21` corrected to MkDocs; `docs/README.md` rewritten or removed;
`site_url` added to `docs/mkdocs.yml`; the root `README.md` gains the atlas and
its live URL.

## 4. Guards

SP2b is mostly infrastructure, which is exactly where this project's testing
habits could lapse. Three things are testable and one is the most valuable test
in the sub-project.

### G1. Link integrity — the crown jewel

After the site is built, walk **every** `doc_url` and `summary_url` in the bundle
and assert each resolves to a real file under `docs/site/`.

This mechanises "never invent a destination". For three sub-projects that rule has
been enforced by comments and attentive reviewers. It is also the only check that
can catch a summary that failed to copy, a slug that does not match its file, or a
subtly wrong `site_url` — no existing test can see any of those.

**It runs against the fixture bundle until the records are promoted**, and becomes
a gate over real data on the day they are. Build it now, wired to fail loudly:
adding it later, once a deploy is green, is when the incentive to skip it is
highest.

### G2. Deploy-output guard

Assert that whatever lands at `/atlas/` either carries a real bundle or is the
holding page, and contains **no `fixture-` record either way**.

### G3. The copy-and-generate script

Ordinary pure-function tests: given a source directory it produces the expected
files and an index listing all of them, and the generated `summary_url` for an id
matches the route the file is published at. That last assertion is what keeps
`extract-papers.ts` and the copy step from drifting apart.

### Not testable

The Vercel build image. The first deploy proves it — which is why D1 sequences it
first.

## 5. Constraints inherited, non-negotiable

- **Never promote a record to `verified`.** `build:data` and `build:app` must both
  keep exiting non-zero.
- **Never fabricate a value; never invent a destination.**
- **Never edit `litterature_review/`, `docs/docs/`, `atlas/data/**` or
  `atlas/src/data/**`.**
- **Native Land Digital is used nowhere.**
- `src/lib/**` stays pure.
- **Never run `pnpm approve-builds`** — it overwrites `atlas/pnpm-workspace.yaml`.
- Node off PATH: `export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"`.
- **Every guard must be mutation-checked.** A mutation check that passes is a
  finding about the check.
- Assert strings that must agree **together, in one render** — SP2a's worst defect
  was a suite holding a contradiction in place, each half pinned by a correct
  guard at the same URL.
- **The seam review is its own task, and its output is reviewed too** — SP2a's
  ninth composition defect was inside the seam review's own fix.

## 6. Open inputs the user must supply

1. **The deployment hostname**, for `site_url` and `CITATION.cff`. A Vercel
   default (`*.vercel.app`) works; a custom domain changes both files.
2. **Pushing the repo.** Zenodo integration needs the commits on GitHub. Nothing
   in SP2b pushes anything.

## 7. Out of scope

- Promoting records. Human review, still owed.
- Cutting the release or the deposit (D5).
- Making a field's **derivation** visible in the data so a walker can demand
  toggle-or-attribution — carried from SP2a, still owed, still not small: it needs
  a per-field declaration at ~30 call sites plus a new prop on the two most-used
  components.
