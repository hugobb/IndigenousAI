# SP3 — Papers on the map

**Status:** design approved 2026-09-05, not yet planned
**Supersedes:** nothing. Extends the atlas built in SP0–SP2b.

## Why

After the record review of 2026-09-05 the atlas publishes **five languages and
zero initiatives** — all five initiative records were rejected, on the
maintainer's decision that the atlas maps *papers*, not organisations. That
decision leaves the artifact in a state that must not ship:

- Three of the five languages carry no `centre` (`amharic` by the parent spec's
  D5, `choctaw` and `kanienkeha` by review), so the map draws **two pins**.
- All 92 papers and 39 methods are in the bundle and reachable from **nowhere**:
  the only UI surface that renders either is `InitiativePanel`, which needs an
  initiative to open.

Publishing that replaces the holding page with something emptier than the
holding page. SP3 is what makes the atlas say something again, with papers as
the entity of interest.

## What the corpus can support

Measured 2026-09-05 against `litterature_review/summaries/` (92 files), not
estimated:

| Fact | Value |
| --- | --- |
| Papers naming a specific language in their own subject matter | **33 of 92** |
| Papers naming none — surveys, tokenizer methods, process papers | **59 of 92** |
| Distinct languages actually studied | **28** |
| Language records that exist today | **5** |
| Summaries mentioning Mohawk/Kanien'kéha **only** in `## Relevance to Indigenous AI` | **86 of 92** |

Two of those rows are the spec.

**59 of 92 papers have no place.** Not "not yet sourced" — no place in
principle. A survey of culture in LLMs studies no language. Any design that
treats the map as the primary surface hides two-thirds of the literature.

**86 of 92 name Mohawk in the reviewer's relevance annotation.** Every summary
carries a `## Relevance to Indigenous AI` section written toward the Six Nations
context of this project. A naive "language named in the summary" rule pins the
entire corpus to one point and looks plausible while doing it. This is the
single largest correctness risk in SP3 and D2 exists to answer it.

## Decisions

### D1 — The paper→language link is a new curated record type

`litterature_review/OVERVIEW.md` is the source `extract:papers` reads, and
`litterature_review/` is never edited. `data/derived/papers.json` is generator
output and is rewritten by `pnpm extract:papers`. Neither can hold the link.

**Decided:** a new hand-curated file `atlas/data/paper-languages.yml`, one entry
per *mapped* paper:

```yaml
- paper: gibert-et-al-2025-americas-nlp
  languages: [choctaw]
  source:
    kind: url | summary
    ref: <where the claim is read from>
    retrieved: "YYYY-MM-DD"
    quote: "<verbatim, from the paper's own subject matter>"
  status: draft | verified | rejected
```

It carries `status` and passes through the same gate as every other record:
`validate.ts` refuses a draft, and refuses a `paper` or `languages` id that does
not resolve. Papers absent from this file are unmapped, which is the default and
not an error.

### D2 — The evidence rule, and the section it excludes

A paper may be mapped to a language **only** when that language is named in the
paper's own subject matter: its title, its header block (`**Authors:**`,
`**Venue:**`, `**Link:**`), or any section **before** `## Relevance to
Indigenous AI`.

The relevance section is excluded **by rule**, because it is the reviewer
writing about applicability to this project rather than the paper's content.
86 of 92 summaries name Mohawk there and 6 name it in their own subject matter.

- Ambiguity resolves to **unmapped**. Never to a guess.
- A paper may map to more than one language when its subject matter names more
  than one.
- **Guard:** a test asserting that no entry's `quote` occurs in its summary only
  at or after the `## Relevance` heading. This is the guard that must be
  mutation-checked hardest; a mapping built from a relevance sentence is
  indistinguishable from a correct one by eye.

### D3 — Papers inherit geometry; they never carry their own

A paper has no coordinates and will not be given any. Its position is the
`centre` of the language it maps to. The map therefore remains a **language**
map whose pins now carry papers.

Consequence, stated because it is large and easy to miss: a paper mapped to a
language with `centre: null` is **still unmapped**. Today that is `choctaw`,
`kanienkeha` and `amharic` — so a mapped paper is not necessarily a drawn paper,
and the UI must say which it is (D4).

### D4 — Two reasons for unmapped, never merged

`UnmappedList` already splits "we cannot place it" from "no work covers it", and
already carries the lesson that merging kinds of gap produces a card
contradicting the map beside it (SP2a's ninth composition defect). Papers add
their own kinds, kept separate:

1. **No language named** — the paper studies no specific language (59 papers).
2. **Language has no centre** — mapped, but its language is not drawn.

`LanguagePanel` gains a Papers section listing the papers that study that
language, each linking to its published `/summaries/<id>/` route. `TableView`
and the facet panel already filter by year and theme and need no new concepts.

`InitiativePanel` is retained, not deleted: initiative records still exist in
the repository at `status: rejected` and the maintainer may reverse any of them
with a one-word edit.

### D5 — Build the machinery before sourcing the languages

*(SP3's own D5. The adjacent-tier rule referenced below is the PARENT spec's D5;
the numbering collision is unfortunate and both are qualified wherever used.)*

The ~23 new language records are the bulk of the work and the least reversible;
the join, the evidence rule and the UI are the parts most likely to be wrong.

**Decided:** two sub-projects, in this order.

- **SP3a — machinery.** `paper-languages.yml`, schema, validation, bundle join,
  `LanguagePanel` papers section, `UnmappedList` cards, guards. Sourced against
  the **5 existing languages only**.
- **SP3b — the language records.** Source and review the remaining ~23
  languages, then widen `paper-languages.yml`.

Measured, so the plan plans against real numbers:

| SP3a against the 5 existing languages | |
| --- | --- |
| Papers mappable | **11** |
| …to `kanienkeha` | 6 |
| …to `te-reo-maori` | 3 |
| …to `amharic` | 2 |
| …to `choctaw`, `myaamia` | 0 |
| Papers remaining unmapped | **81** |
| Mapped papers that would actually DRAW | **3** |

That last row is why D5 is the right order. Of the 11 mappable papers, 8 map to
`kanienkeha` or `amharic`, which have no centre — so D3's "mapped but not drawn"
case is not an edge case in SP3a, it is the **majority** case, and D4's second
unmapped card is exercised harder than the first. The riskiest part of the
design gets tested by the cheapest sub-project, which is the whole argument for
doing the machinery first.

SP3a ships something publishable on its own: a map with two pins, a populated
language panel, and 81 papers honestly listed as unmapped with the reason
given, is a truthful artifact. Today's two-pin, nothing-reachable atlas is not.

## Open question — the adjacent tier

The 28 studied languages include Nahuatl, Guarani, Quechua, Bribri and Wixarika,
but also Nepali, Basque, Yoruba and Swahili. The second group is not Indigenous
in this atlas's sense and would presumably be `tier: adjacent` — which per the
PARENT spec's D5 means **no centre at all**, so those papers would map and still
never draw.

This needs a tier rule before SP3b sourcing begins. It does not block SP3a,
which touches only the five existing records. Left open deliberately rather than
decided here: it is an editorial judgement about what the atlas is for.

## Non-goals

- **No new coordinates for papers.** D3 is not a starting position to be
  refined later; it is the design.
- **No inferred mappings.** No LLM-assigned languages, no keyword frequency, no
  "most likely" language. D2's rule or nothing.
- **No edits to `litterature_review/` or `data/derived/`.** The corpus and the
  generator output stay as they are; SP3 adds a file beside them.
- **Methods stay unreachable for now.** The same 39-method problem exists and
  has the same shape, but mapping methods is not in this scope.

## Global constraints

- Never promote a record to `status: verified`; that is the maintainer's
  signature. SP3 delivers records at `status: draft`.
- Never fabricate a value. Unknown is `null` and reads "not recorded"; a known
  absence reads as what we know.
- `pnpm build:data` and `pnpm build:app` must keep exiting non-zero while any
  record is draft.
- `atlas/data/**` outside `derived/` is curated data: SP3 adds
  `paper-languages.yml` and touches nothing else there.
- Node off PATH: `export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"`.
