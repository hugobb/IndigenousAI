# SP3 — Papers on the map

**Status:** SP3a shipped 2026-09-05. SP3b decisions D6-D9 resolved 2026-09-06; planning next.
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

## SP3b decisions — resolved 2026-09-06

The adjacent-tier question this spec left open is answered below, together with
two further questions that only became visible once the corpus was measured
against the studies rule rather than by counting mentions.

### Correction to the measurement above

The "What the corpus can support" table overstates the corpus. Its rows were
produced by counting *mentions* of a language name; SP3a then established that a
mention is not evidence a paper **studies** a language, and the studies rule cut
SP3a's 11 candidates to 3. Read "33 of 92" and "28 distinct languages" as an
upper bound on candidates, never as a count of mappable papers. The rows below
are the corrected picture, measured 2026-09-06 against the same 92 pre-Relevance
heads.

### D6 — The adjacent tier keeps its no-centre rule

A language the atlas does not count as Indigenous gets a `tier: adjacent`
record with `centre: null`, exactly as the schema already enforces and as the
existing `amharic` record already does. Its papers map, are listed on the
language panel, and are carried by SP3a's "language has no centre" card with the
reason stated. They never draw.

Adjacent candidates found in the corpus: **Persian (4 papers), Swahili, Yoruba,
Wolof, Basque, Nepali, Manchu, Sundanese, Welsh.**

Rejected alternatives: giving the adjacent tier a centre would erase D5's entire
stated rationale — the tier distinction is encoded visually rather than in a
legend — and would turn the artifact into a low-resource-NLP map. Dropping the
tier entirely would contradict the parent spec's D2, which names Manchu and
Amharic as the intended adjacent examples, and would mean withdrawing a language
record the maintainer has already reviewed.

**Recorded gap, deliberately not closed here.** The parent spec's D2 created the
adjacent tier to answer "does this transfer?", and `transferability` is the field
that answers it — but that field exists only on the *initiative* schema, where it
is required, and every initiative is now `status: rejected`. In a papers-only
atlas the adjacent tier therefore still marks scope but carries no transposability
judgement at all. Closing that gap means either adding a `transferability` note to
adjacent-tier language records or moving it onto the paper mapping. Both are out
of scope for SP3b, which is already the largest sub-project; this is written down
so the gap is inherited deliberately rather than discovered later.

### D7 — Shared tasks map to every language they evaluate; surveys map to none

A shared task runs real experiments on each of its languages and therefore
satisfies the studies rule for all of them. A survey reviews other people's work
*about* languages without studying any, and its "evidence" is a bibliography —
precisely the reviewer-shaped reasoning the studies rule exists to exclude.

- Maps to all: `gibert-et-al-2025-americas-nlp`, `ebrahimi-et-al-2023-americas-nlp`,
  and any paper that reports its own measured results per language.
- Maps to none: `tonja-et-al-2024-latin-american`, `mager-et-al-2023-americas`,
  and the other surveys, however many languages they name.

Each individual mapping still carries its own verbatim quote and still passes the
location rule independently. D7 licenses a paper to produce many mappings; it
never licenses a mapping without its own evidence.

### D8 — A cover term gets a record with no centre

Measured against Glottolog: "Quechua" spans 43 languages, "Nahuatl" 31, "Maya"
34, "Otomanguean" 181. Glottolog's family-level entries carry **no coordinates
and no ISO 639-3 code** — verified by fetching `quec1387`, `azte1234`,
`maya1287`, `chat1268`, `otom1299` and `tupi1275`, all of which return
`latitude: null`. The corpus names these at cover-term level nearly everywhere;
across all 92 heads there is exactly one variety-level narrowing ("Nahuatl,
Western Sierra Puebla variety").

**Decided:** each cover term gets an `indigenous`-tier record with `centre: null`
and a `caveat` naming how many varieties it spans and stating that the corpus
never narrows it. The papers attach and are listed; the language is visibly in
the atlas; the "language has no centre" card explains why it does not draw.

This keeps the Latin American literature reachable while asserting nothing false.
The alternative of an approximate centroid was rejected: placing a 43-language
family at a single invented point is exactly the plausible-looking fabrication
the project's rules exist to prevent, and it is not comparable to the `myaamia`
record's approximate centre, which approximates one language's location rather
than standing in for dozens.

Cover terms identified: **Quechua, Nahuatl, Maya, Otomí, Chatino, Cree, Yupik,
Aymara, Guarani, Rarámuri** — each to be confirmed against Glottolog during
sourcing, since some may resolve to a single languoid after all.

### D9 — Glottolog's JSON endpoint is the sourcing method

`https://glottolog.org/resource/languoid/id/<glottocode>.json` returns `name`,
`id`, `iso639-3`, `latitude`, `longitude`, `level` and `classification` as
structured data. The HTML page drops coordinates in conversion; the JSON does
not. Verified against `cher1273`, which returns latitude 35.4664, longitude
-83.163.

This is the same source the existing `te-reo-maori` record already quotes, so
SP3b introduces no new authority — only a more reliable way to read it. Every
sourced field traces to a fetched value, and the `quote` records that value
verbatim.

**The resolution hazard.** Going from a name in a paper to a glottocode is the
one step that can fail silently: "Maya" matches ~86 languoids on Glottolog's
search, "Nahuatl" ~144, "Quechua" ~185, and picking the wrong one produces a
record that looks entirely correct. Resolution therefore has two rules:

1. The fetched `name` and `level` must be echoed into the review queue beside the
   name the paper used, so a reviewer can see what was matched to what.
2. `level` must be `language`. A `level: family` result means the name is a cover
   term and D8 applies — never silently substitute the family for a language.

Ambiguity that neither rule resolves means **omit**, per D2.

### What SP3b delivers

| | |
| --- | --- |
| New language records | ~31, all at `status: draft` |
| …Indigenous tier, resolvable, with a sourced centre | ~11 |
| …Indigenous tier, cover terms, `centre: null` (D8) | ~10 |
| …adjacent tier, `centre: null` (D6) | ~9 |
| New pins on the map | **~11, up from 2** |
| Paper→language mappings | ~50-70, each with its own quote |

The map going from two pins to roughly a dozen is the point of the sub-project.

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
