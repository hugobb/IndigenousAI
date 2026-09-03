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
| D4 | **Fields derive from feathered territory polygons**, sourced from Native Land Digital's **Languages** layer. | NLD *Territories* is the wrong unit (one Haudenosaunee polygon covers 6+ languages). Hand-drawn polygons make us the boundary authority. WLMS/Ethnologue is paid and non-redistributable. Evidence-anchor heatmaps were offered and not chosen. |
| D5 | **Fields are an Indigenous-tier feature; the adjacent tier is pins only.** | Encodes the tier distinction visually rather than in a legend, and sidesteps NLD's thin coverage outside North America and Australia. |
| D6 | **Facets mirror the entities**: "about the language" (family, typology, endangerment, region) and "about the work" (application, method, data regime, governance). | Application × method × model dates badly and pushes readers to copy model choices instead of matching methods to their data situation. Model is a displayed, searchable field, not a facet. |
| D7 | **Timeline is a two-handle range window**, defaulting to the full range. | Cumulative was offered; range was chosen. Default-full-range removes the "forces a window choice" cost. |
| D8 | **Standalone Vite + MapLibre app** at `atlas/`, deployed to a stable URL; guide links to it. | mkdocs is not a bundler; embedding means committing built bundles. Observable Framework adds a platform permanence risk for a cited artifact. |
| D9 | **Hybrid curation with provenance and verification first-class.** | Fully manual discards 39 technique docs and 92 summaries already structured. Corpus-only yields a map with no Te Hiku Media, First Voices, Masakhane or huniki.ai. |

Deliberately deferred: an open contribution/submission path (right posture, but commits us to moderation and
governance for the artifact's lifetime — revisit after publication, with named maintainers).

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
area:
  source: native-land-digital
  nld_id: "..."
  present: true                # false => "not mapped", still in table and facets
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
  controlled ladder — `zero` · `<1k` · `1k-10k` · `10k+` — retaining the original prose as `data_regime_note`.
  The mapping table is committed and reviewable; a doc that cannot be mapped fails the build rather than
  defaulting to a bucket.
- **`Paper`** — parsed from the `OVERVIEW.md` index table plus summary headers:
  `{id, title, authors, year, venue, themes, summary_url}`.
`Language` records exist for both tiers, because adjacent initiatives reference languages such as Manchu and
Amharic. Per D5, a `tier: adjacent` language never carries an `area` — the gate enforces this, so an adjacent
language cannot acquire a field by accident.

- **`Area`** — Native Land Languages GeoJSON, filtered to in-scope languages, simplified, committed as
  `data/language-areas.geojson`. Fetched at build time so the published page makes **no runtime API call**.

### 4.4 Why YAML per record

One file per language and per initiative, in git. Every addition is a reviewable diff; provenance sits next to
the claim it supports; a collaborator can correct one entry without touching a database. Generated data is
regenerable from the markdown at any time and is never edited by hand.

## 5. Pipeline

`atlas/scripts/`. Steps 1, 2, 4, 5 and 6 run on every build. Step 3 is run deliberately, not per build:

1. **`extract-methods.ts`** — parse the 39 technique docs into `derived/methods.json`.
2. **`extract-papers.ts`** — parse `OVERVIEW.md` and the 92 summaries into `derived/papers.json`.
3. **`fetch-areas.ts`** — fetch Native Land's Languages layer, filter to scope, simplify, write
   `data/language-areas.geojson`. Committed; re-run deliberately, not per build.
4. **`sample-fields.ts`** — sample each polygon into a weighted point grid clipped to its shape, for the
   heatmap render (see §6). Grid spacing scales with polygon area, with a hard point cap.
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
- no `tier: adjacent` language carries an `area` (D5)

Because the gate refuses drafts, the review queue enforces itself rather than depending on anyone remembering,
and an unverified extraction cannot silently become a pin in a figure carrying the author's name.

## 6. The page (SP1 sketch)

Full-bleed MapLibre map; filter rail left, detail panel right, timeline along the bottom, `map | table` toggle
in the header.

**Feathering — the one uncertain piece.** MapLibre has no blur on fill layers. Preferred approach: build-time
point-grid sampling inside each polygon (`sample-fields.ts`), rendered at runtime through MapLibre's native
`heatmap` layer. The polygon remains the source of truth for *where*; the heatmap makes it edgeless on the GPU,
softness tuned via `heatmap-radius`. A uniform grid under a heatmap yields a plateau with no boundary.
Fallback: render polygons to a stacked transparent canvas and CSS-`blur()` that element beneath the pins.
**Spike this before committing to it** — it is the only place the design could be wrong in a way that matters.

Basemap: CARTO Positron raster, no API key, attribution in-corner. Swappable for a self-hosted Protomaps
`.pmtiles` extract if permanence later outweighs convenience.

**Highlight:** all in-scope fields paint in one neutral low-alpha ink by default; selecting or filtering a
language gives its field the accent and drops the rest away. This is what stops twelve Great Lakes languages
becoming a single wash.

**Pins:** Indigenous tier filled, adjacent tier hollow and dimmed, clustered at low zoom.

**Interaction:** click a pin for the initiative, click a field for the language profile with conflicts shown as
conflicts. Methods in the detail panel link into the mkdocs technique docs — this link is what makes the map an
index into the guide rather than a standalone figure. All filter, slider and selection state serialises to the
query string, so any view is a citable URL.

**Three refusals:**

- **Unknown is never silently "no."** Facets offer `unknown` as a selectable value.
- **Languages with no NLD polygon do not vanish.** They surface in a "not mapped (N)" affordance; the coverage
  gap is stated, not hidden.
- **The map is not the only route to the data.** The table view renders the same filtered set — sortable,
  keyboard-navigable, working in a screen reader, on a phone, and in print for the static paper figure.

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
│  │  └─ language-areas.geojson     fetched once, committed
│  ├─ scripts/                      extract-methods · extract-papers · fetch-areas
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

## 10. Obligations carried by this design

- **Native Land Digital attribution and disclaimer** must appear on the page: territory data is not
  authoritative and does not represent legal boundaries. Educational use with attribution.
- **NLD coverage is thin outside North America and Australia.** D5 confines fields to the Indigenous tier,
  which removes most of the exposure; residual gaps surface through the "not mapped" affordance.
- **Speaker counts disagree across sources** (Draft.md already records Choctaw at 9,600 and 1,000). The schema
  keeps conflicts rather than picking; the page shows them as disagreement.
- **Initiative coordinates are self-stated**, taken from each project's own public materials, and carry a
  source. We site the people doing the work, not the languages.
