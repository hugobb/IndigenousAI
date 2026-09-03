# Atlas of Indigenous Language NLP — Design

**Date:** 2026-09-03
**Status:** Approved (design); SP0 not yet planned
**Scope of this document:** SP0 only (schema, pipeline, seed dataset). SP1 and SP2 are sketched for sequencing and will get their own specs.

---

## 1. Purpose

An interactive companion page for the review paper in `papers/review-paper/`. The paper reviews existing
initiatives in NLP for Indigenous languages and serves as a guide for people starting to build NLP tools,
methods, or applications for an Indigenous language.

The page answers three reader questions that prose answers badly:

1. **Who is doing this work, where, and since when?** — a map with a time window.
2. **What has been tried for a language like mine, with data like mine?** — faceted filters.
3. **Does a method from the wider low-resource world transfer to an Indigenous context?** — an explicitly
   marked adjacent tier carrying a per-record transferability judgement.

The page is an index into the existing technique guide (`docs/`), not a replacement for it. Every method shown
links to its technique doc.

## 2. Context — what already exists

| Asset | Count | State | Use |
| --- | --- | --- | --- |
| `litterature_review/summaries/*.md` | 92 | Consistent template | Seeds `Paper` records |
| `litterature_review/OVERVIEW.md` | 1 | Indexed table with themes | Seeds `Paper` records |
| `docs/docs/{ml,process}-techniques/*.md` | 39 | `Category` on 39/39; `Data Regime` and `Applicable Languages` on 38/39 | Generates `Method` vocabulary |
| `papers/review-paper/Draft.md` | 1 | Embryonic language profiles (Choctaw, Myaamia, Lakota) | Seeds `Language` records; source of the profile schema |
| `reports/projects.md` | 1 | Two URLs | Effectively empty |

**The gap this project fills:** there is no structured inventory of initiatives. The corpus is a *paper* corpus.
A summary of Pei et al. on Manchu ICL-MT is a paper, not an initiative; Te Hiku Media, First Voices, Masakhane,
the Myaamia Center and huniki.ai are not papers in `litterature_review/` at all. The corpus seeds languages,
methods and papers nearly for free; **the initiative layer must be researched by hand from each project's own
public materials.**

The documentation site is **mkdocs-material** (`docs/mkdocs.yml`). `AGENTS.md` and `docs/README.md` both still
describe it as Docusaurus, left over from Step 1 of `tasks/2026-06-11-technique-inventory/PLAN.md`. Corrected in SP2.

## 3. Decisions

Each was chosen deliberately; the rejected alternative is recorded because the reasoning matters more than the outcome.

| # | Decision | Rejected alternative and why |
| --- | --- | --- |
| D1 | **Two linked entities: `Language` and `Initiative`.** | Initiative-only loses per-language profiles; language-only duplicates AmericasNLP across 13 languages; paper-only makes a bibliography-on-a-map. |
| D2 | **Two tiers on one map**: Indigenous (primary) and adjacent/transferable (Masakhane, Manchu, Amharic). | Indigenous-only cannot answer the transposability question. A flat all-low-resource tier averages away the sovereignty distinction the paper turns on — see `docs/docs/process-techniques/endangered-vs-low-resource-distinction.md`. |
| D3 | **Language presence is a soft, edgeless field**, never a line. | A hard boundary is a claim this project should not make casually. |
| D4 | **Each language carries ONE self-sourced centre point**, rendered as a single soft edgeless blob. Coordinates from Glottolog (CC-BY-4.0). **REVISED 2026-09-03 — see §3a.** | Native Land Digital's Languages layer was chosen first, then withdrawn: their Data Sovereignty Treaty forbids it (§3a). NLD *Territories* is also the wrong unit (one Haudenosaunee polygon covers 6+ languages). Hand-drawn polygons make us the boundary authority. WLMS/Ethnologue is paid and non-redistributable. |
| D5 | **Soft fields are an Indigenous-tier feature; the adjacent tier is initiative pins only.** | Encodes the tier distinction visually rather than in a legend. (It originally also sidestepped NLD's thin coverage outside North America and Australia; that rationale lapsed with D4's revision, but the decision stands on its own.) |
| D6 | **Facets mirror the entities**: "about the language" (family, typology, endangerment, region) and "about the work" (application, method, data regime, governance). | Application × method × model dates badly and pushes readers to copy model choices instead of matching methods to their data situation. Model is a displayed, searchable field, not a facet. |
| D7 | **Timeline is a two-handle range window**, defaulting to the full range. | Cumulative was offered; range was chosen. Default-full-range removes the "forces a window choice" cost. |
| D8 | **Standalone Vite + MapLibre app** at `atlas/`, deployed to a stable URL; guide links to it. | mkdocs is not a bundler; embedding means committing built bundles. Observable Framework adds a platform permanence risk for a cited artifact. |
| D9 | **Hybrid curation with provenance and verification first-class.** | Fully manual discards 39 technique docs and 92 summaries already structured. Corpus-only yields a map with no Te Hiku Media, First Voices, Masakhane or huniki.ai. |

Deliberately deferred: an open contribution/submission path (right posture, but commits us to moderation and
governance for the artifact's lifetime — revisit after publication, with named maintainers).

## 3a. Why Native Land Digital was withdrawn (2026-09-03)

D4 originally sourced feathered polygons from Native Land Digital's Languages layer. Reading their
[Data Sovereignty Treaty](https://api-docs.native-land.ca/data-sovereignty-treaty.md) before implementing
it surfaced three direct conflicts:

1. Users must not engage in **"Storage or distribute API data without explicit permission."** The design
   committed `language-areas.geojson` to a public repository and shipped it inside a published page —
   storage *and* distribution.
2. Users must not **"Modify or alter Indigenous land boundaries without direct consultation and approval."**
   The pipeline simplified the polygons, and the feathering in §6 exists precisely to change how the
   boundary reads.
3. An API key is being introduced (*"soon you'll need to sign up for an account"*), adding a permanence
   risk to an artifact a paper must cite.

Point 2 is the substantive one. Blurring a boundary to hide its edge **is** altering it, and doing that to
Indigenous land boundaries without consultation is the specific act the treaty prohibits. A project arguing
for data sovereignty cannot quietly make that exception for its own figure.

**Resolution:** drop Native Land entirely. Each language carries one centre point we source and cite
ourselves, rendered as a single soft edgeless blob. A point is not a boundary, so nothing is altered; the
data is ours, so nothing is redistributed.

Two paths were left open and not taken *for this version*: writing to Native Land to request explicit
permission for a non-commercial academic use, and generating fields from several cited evidence anchors
rather than one centre. Either could return in SP2 or later; neither blocks shipping.

## 4. Data model

Five types. `Language` and `Initiative` are hand-curated YAML, one file per record. `Method`, `Paper` and
`Area` are generated into `data/derived/` and never hand-edited.

`Source` is a value type embedded wherever a claim is made: `{kind: url|paper|doc, ref, retrieved, quote?}`.

### 4.1 `Language`

```yaml
id: kanienkeha                 # slug, stable, used in URLs
name: Kanien'kéha
also_known_as: [Mohawk]
glottocode: moha1258           # join key to Native Land and Glottolog
iso639_3: moh
tier: indigenous               # indigenous | adjacent
family: Iroquoian
subfamily: Northern Iroquoian
typology: [polysynthetic]      # controlled vocabulary
endangerment:
  status: definitely-endangered
  scale: unesco-2010
  source: {...}
speakers:
  value: 3500
  as_of: 2016
  source: {...}
  conflicts:                   # kept as disagreement, never resolved away
    - {value: 1000, source: {...}}
region: north-america          # macro-area, drives the region facet
countries: [CA, US]
centre:                        # ONE point. Never a boundary. See D4 and §3a.
  lat: 43.0
  lon: -74.5
  source: {kind: doc, ref: "Glottolog 5.x moha1258"}
                               # null => "not mapped", still in table and facets
status: verified               # draft | verified | rejected
                               #   draft    — seeded, not yet reviewed; blocks the build
                               #   verified — reviewed; the only shippable state
                               #   rejected — reviewed and excluded; retained so it is not re-seeded
```

### 4.2 `Initiative`

```yaml
id: te-hiku-media
name: Te Hiku Media
kind: organisation             # organisation | project | shared-task | workshop | tool
tier: indigenous
languages: [te-reo-maori]      # must resolve to Language ids
started: 2016
ended: null                    # null = ongoing
site:
  lat: -35.11
  lon: 173.26
  place: "Kaitaia, Aotearoa New Zealand"
  source: {...}                # self-stated location, from the initiative's own materials
applications: [asr, tts]       # controlled vocabulary
methods: [...]                 # must resolve to Method ids (the 39 technique docs)
models: [wav2vec2]             # displayed and searchable; NOT a facet
data_regime: 1k-10k            # controlled vocabulary; see below
governance:
  posture: community-controlled  # community-controlled | restricted | open | unstated
  licence: "Kaitiakitanga License"
  source: {...}
papers: [...]                  # Paper ids, or external refs
links: [{label, url, retrieved}]
transferability:               # REQUIRED when tier == adjacent, forbidden otherwise
  transfers: [...]
  does_not_transfer: [...]
  note: "..."
status: verified
```

### 4.3 Generated types

- **`Method`** — parsed from `docs/docs/{ml,process}-techniques/*.md`:
  `{id, name, category, data_regime, applicable_languages, doc_url}`. Controlled vocabulary for `Initiative.methods`.
  The docs' `Data Regime` field is prose, not a vocabulary (e.g. *"zero-resource to <1K parallel sentences
  (requires a dictionary and monolingual corpus)"*). `extract-methods.ts` therefore maps each doc onto a small
  controlled ladder, retaining the original prose as `data_regime_note`.

  An audit of the 39 docs (2026-09-03) found **25 distinct prose values**, which forces three corrections to
  the naive ladder:

  - The ladder is `any · zero · <1k · 1k-10k · 10k+`. `any` is needed: 13 of the 25 values read
    *"any (applies before any technical decision is made)"* and similar — most process techniques genuinely
    have no data regime, and coercing them into `zero` would be false.
  - `Method.data_regime` is a **set** of buckets, not one value. Several docs span a range
    (*"&lt;1K sentences / 1K–10K sentences"* → `["<1k", "1k-10k"]`). `Initiative.data_regime` stays single-valued.
  - The docs contain literal HTML entities (`&lt;`) left over from the Docusaurus scaffold, so the parser must
    decode entities before matching.

  The mapping table is committed and reviewable. **Unmappable prose fails the build**; a *missing* `Data Regime`
  line resolves to `["any"]` with a build warning — `task-appropriate-data-selection.md` is the one such doc,
  and it should not redden the build on day one.
- **`Paper`** — `{id, title, authors, year, venue, themes, summary_url}`. **`OVERVIEW.md`'s index table is the
  authoritative source**: it carries all 92 rows with title, authors, year, themes and summary link. Summary
  headers only supply `venue`, and are secondary because they are not uniform — 87 use
  `**Authors:** / **Year:** / **Venue:**`, while 5 use a single APA `**Citation:**` line
  (`monazzah-2025-percurl`, `pawar-2025-cultural-awareness-llm`, `qadri-2025-cultural-representation-ai`,
  `rai-and-pal-2025-amharic`, `sadr-et-al-2025-taarof`). The parser handles both forms and leaves `venue`
  null rather than guessing.
`Language` records exist for both tiers, because adjacent initiatives reference languages such as Manchu and
Amharic. Per D5, a `tier: adjacent` language never carries a `centre` — the schema enforces this, so an
adjacent language cannot acquire a soft field by accident.

- **`Area`** — **removed.** Superseded by `Language.centre` (§3a). This project holds no geometry: no
  polygons, no GeoJSON, no simplification, and no third-party map-data dependency of any kind.

### 4.4 Why YAML per record

One file per language and per initiative, in git. Every addition is a reviewable diff; provenance sits next to
the claim it supports; a collaborator can correct one entry without touching a database. Generated data is
regenerable from the markdown at any time and is never edited by hand.

## 5. Pipeline

`atlas/scripts/`. Steps 1, 2, 4, 5 and 6 run on every build. Step 3 is run deliberately, not per build:

1. **`extract-methods.ts`** — parse the 39 technique docs into `derived/methods.json`.
2. **`extract-papers.ts`** — parse `OVERVIEW.md` and the 92 summaries into `derived/papers.json`.
3. **`fetch-areas.ts`** — **removed** with Native Land (§3a). `centre` is a hand-curated field on the
   Language record, sourced and cited like every other claim, so there is no fetch step at all.
4. **`sample-fields.ts`** — sample each polygon into a weighted point grid clipped to its shape, for the
   heatmap render (see §6). Grid spacing scales with polygon area, with a hard point cap.
   **SP1, not SP0** — its output shape depends on the outcome of the feathering spike, so building it now
   would be guessing. SP0 delivers the polygons; SP1 decides what to do with them.
5. **`validate.ts`** — the gate (§5.1).
6. **`bundle.ts`** — emit `src/data/atlas.json` for the app.

A separate one-off **`seed.ts`** writes `status: draft` records into `data/languages/` and `data/initiatives/`
from the corpus. Drafts are promoted to `verified` by human review.

### 5.1 The gate

`validate.ts` runs before every build and is the entire defensibility story. Zod schemas plus:

- every `Initiative.methods[]` entry resolves to a known `Method` id
- every `Initiative.languages[]` entry resolves to a known `Language` id
- every coordinate carries a `source`
- every `tier: adjacent` initiative carries a `transferability` note — D2 demands the transposability question
  be answered per record, so the schema refuses to let it be skipped
- **every shipped hand-curated record has `status: verified`** — the build exits non-zero and lists the
  drafts. Generated types (`Method`, `Paper`, `Area`) carry no status; they are regenerable from source and
  their correctness is the extractors' responsibility, covered by the extractor tests
- no `tier: adjacent` language carries a `centre` (D5)

Because the gate refuses drafts, the review queue enforces itself rather than depending on anyone remembering,
and an unverified extraction cannot silently become a pin in a figure carrying the author's name.

## 6. The page — SUPERSEDED

This section described the page in terms of the Native Land polygon design withdrawn in §3a: polygon
sampling, a `sample-fields.ts` grid, a CSS-blur fallback, and a "no NLD polygon" refusal. All of it is
obsolete. With one cited centre point per language, a large blurred `circle` layer produces the soft
edgeless field directly — no heatmap, no generated geometry, no second render surface.

**The page is now specified in:**

- `2026-09-03-atlas-sp1a-map-design.md` — the map: soft language fields, initiative pins, the visual
  encoding of location uncertainty, and the detail panels.
- SP1b (spec to be written against a working map) — facets, the range timeline, the table view, URL state.

## 7. Testing

- Filtering is a **pure module** (records + filter state → filtered set), fully unit-tested without a browser.
- Extractor tests against fixture markdown.
- URL-state round-trip test.
- **Gate test that mutates a real record to `draft` and asserts the build fails.** A gate tested only against a
  fixture proves nothing about the gate.
- One smoke test that the app mounts and renders N pins for a fixture dataset. MapLibre's rendering is not
  unit-tested.

## 8. Layout on disk

```text
IndigenousAI/
├─ atlas/
│  ├─ data/
│  │  ├─ languages/*.yml            hand-curated
│  │  ├─ initiatives/*.yml          hand-curated
│  │  ├─ derived/                   generated from docs/ + litterature_review/
│  ├─ scripts/                      extract-methods · extract-papers
│  │                                sample-fields · validate · bundle · seed
│  ├─ src/                          map · filters · timeline · panels · table
│  └─ tests/
├─ docs/                            mkdocs guide → links to the atlas
└─ papers/review-paper/             the paper → cites the atlas
```

## 9. Sub-projects

- **SP0 — schema, pipeline, seed data.** Schemas, extractors, the gate, and the seeding pass that produces the
  review queue. **This is where the risk is.** Specified above.

  SP0's deliverable is *the pipeline plus a populated draft queue*, not a verified dataset. Promoting records
  from `draft` to `verified` is human review — roughly 60 initiatives and 40 languages — and is deliberately
  outside the implementation plan; it cannot be automated without defeating the point of D9. SP0 is done when
  the pipeline is green against a small hand-verified seed set (target: 5 languages and 5 initiatives spanning
  both tiers, so every code path including `transferability` and "not mapped" is exercised) and every remaining
  record sits in the queue as a draft.
- **SP1 — the page.** Feathering spike first, then map, filters, timeline, panels, table view, URL state.
- **SP2 — paper integration.** Deploy to a stable URL, Zenodo snapshot for a citable DOI, a "how to cite this
  view" note, Native Land attribution and disclaimer block, and correcting the stale Docusaurus references in
  `AGENTS.md` and `docs/README.md`.

SP1 gets its spec written against real data rather than imagined data, once SP0 lands.

## 9a. Toolchain note

The repo is Python/mkdocs today and has no Node tooling. `node`, `npm` and `pnpm` are **not on PATH** on this
machine; they live under nvm (`~/.nvm/versions/node/`, with v22.18.0, v22.22.2 and v25.1.0 installed).
`atlas/` pins **Node 22.22.2** via `.nvmrc`, and its README states the PATH caveat so a fresh session does not
conclude Node is missing.

## 10. Obligations carried by this design

- **Native Land Digital attribution and disclaimer** must appear on the page: territory data is not
  authoritative and does not represent legal boundaries. Educational use with attribution.
- **NLD coverage is thin outside North America and Australia.** D5 confines fields to the Indigenous tier,
  which removes most of the exposure; residual gaps surface through the "not mapped" affordance.
- **Speaker counts disagree across sources** (Draft.md already records Choctaw at 9,600 and 1,000). The schema
  keeps conflicts rather than picking; the page shows them as disagreement.
- **Initiative coordinates are self-stated**, taken from each project's own public materials, and carry a
  source. We site the people doing the work, not the languages.
