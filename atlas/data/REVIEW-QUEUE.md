# Review queue — what a human must check before promoting these records

> Generated during SP0, 2026-09-03. Ten records sit in `data/languages/` and
> `data/initiatives/` at `status: draft`. `pnpm build:data` **exits 1 and lists them**
> until each is reviewed and set to `verified` or `rejected`. That refusal is the
> point: see decision D9 in the design spec.

This file records what could and could **not** be sourced for each record. It is as
important as the records themselves — it is what a reviewer works from. Field-level
hedges also live in each record's `caveat` field, which survives into the published
bundle; YAML comments do not.

## Rules I held to

1. **Nothing was invented to make a record look finished.** Unsupported fields are `null` or `[]`.
2. **Every claim carries a `source`**; every `kind: url` source carries `retrieved: 2026-09-03`.
3. Where a source could not be found I left the hole and named it below, rather than filling it plausibly.

## Three systematic gaps, affecting all five languages

- **`typology: []` on all five.** The schema has no `source` slot for `typology`, and I gathered no citation for it. I would not assert an unsourced typological claim in an artifact accompanying a paper — even one as uncontroversial as "Kanien'kéha is polysynthetic". A reviewer should fill these from WALS/Grambank (both are linked from each Glottolog entry) and record where the claim came from.
- **`endangerment: null` on all five.** The schema accepts only `scale: unesco-2010`. Glottolog reports its own AES scale (it calls Mohawk "Shifting"), which is *not* UNESCO 2010, so mapping one onto the other would fabricate a citation. A reviewer with access to the UNESCO Atlas can fill these.
- **`speakers: null` on four of five** (all but Choctaw). No figure was found in a source I could cite with confidence.

## A note on coordinates

Every `site` lat/lon is a **geocode of a street address or place the initiative publishes about itself**, rounded to ~2 decimal places to signal approximation. The `source` and `quote` on each cite the page carrying the address — not the coordinate. That is the honest description: the *place* is sourced, the *number* is derived from it. Language `centre` points are different — those are Glottolog's own published coordinates, quoted verbatim.

---

## Languages

### `te-reo-maori` — Te Reo Māori
- **Sourced:** `glottocode` maor1246, `iso639_3` mri, `family` Austronesian, `subfamily` Polynesian, and `centre` (-38.2881, 176.541) — all from Glottolog (CC-BY-4.0), quoted.
- **Not sourced:** `speakers` (Stats NZ census figures exist and should be used — I did not read them), `endangerment`, `typology`.
- **For review:** `region: oceania` and `countries: [NZ]` are my classification, not a quoted claim.

### `kanienkeha` — Kanien'kéha
- **Sourced:** glottocode moha1258, ISO moh, Iroquoian / Northern Iroquoian, `centre` (43.72, -74.66836), and `countries: [CA, US]` — Glottolog states "Countries: Canada and United States".
- **Not sourced:** `speakers`, `endangerment`, `typology`.
- **For review:** Glottolog's point sits in New York State. Whether that honestly represents a language spoken across Kahnawà:ke, Akwesasne, Tyendinaga, Six Nations and Kanehsatà:ke is a judgement call, not a data question. `centre: null` is a legitimate answer.

### `myaamia` — Myaamia
- **Sourced:** glottocode miam1252, ISO mia, Algic / Algonquian, `centre` (40.0, -90.0) from Glottolog.
- **Not sourced:** `speakers`, `endangerment`, `typology`.
- **⚠ Flagged in the record:** Glottolog's coordinate for miam1252 is the round pair **(40.0, -90.0)**. That reads like a placeholder rather than a researched location. I kept it because it is what the cited source says, but a reviewer should decide knowingly whether to keep it, replace it, or null it.
- **For review:** Myaamia is commonly described as a sleeping/awakening language with no first-language speakers. I did not assert that (including as `speakers: 0`) because I found no citation I trusted for it.

### `choctaw` — Choctaw
- **Sourced:** glottocode choc1276, ISO cho, Muskogean / Western Muskogean.
- **`centre: null` — deliberate.** Glottolog gives (32.25, -88.5), which sits in Mississippi and would misplace the Choctaw Nation of Oklahoma. This is the atlas's "not mapped" case, and the record says why.
- **Speaker conflict, kept as a conflict, not resolved:**
  - `speakers.value: 9600`, `as_of: 2015` — "Native speakers: 9,600 (2015 census)".
  - `conflicts[0].value: 300` — Anjanette Williston, the **Choctaw Nation's own language program director**, on COVID-19 losses: "leaving about 300 fluent language speakers" (KGOU, 2025-12-18).
  - The two are not counting the same thing: census self-report of native speakers versus the Nation's count of *fluent* speakers after the pandemic. The atlas shows this as disagreement (spec §10).
- **⚠ Weakest source in the record set:** the 9,600 figure is cited to the **Wikipedia** Choctaw-language infobox, a tertiary source. It should be replaced with the primary census citation before this record is promoted.
- **Not sourced:** `endangerment`, `typology`.
- **For review:** the brief anticipated 9,600 vs ~1,000. I could not source a 1,000 figure to anything citable, so I did not write one. The 300 figure is better attested *and* it is the community's own statement.

### `amharic` — Amharic (**adjacent tier**)
- **Sourced:** glottocode amha1245, ISO amh, Afro-Asiatic / Semitic (Glottolog).
- **`centre: null` — mandatory, not a gap.** Per D5 an adjacent-tier language must not carry one; the schema rejects the record otherwise.
- **Not sourced:** `speakers` (Amharic has tens of millions of speakers and a figure is easy to find — I did not read one, so it is null), `endangerment`, `typology`.

---

## Initiatives

### `te-hiku-media` — Te Hiku Media (indigenous, organisation)
- **Sourced:** address "1 Melba Street, Level 2, Kaitaia 0410" (their About page); governance posture from their own words — "a charitable media organisation, collectively belonging to the Far North iwi of Ngāti Kuri, Te Aupouri, Ngai Takoto, Te Rārawa and Ngāti Kahu"; licence **Kaitiakitanga License** ("All content hosted on tehiku.nz is protected under the Kaitiakitanga License"); `applications: [asr, tts]` and `models: [PiperTTS]` from their Te Hiku Tech page ("te reo Māori synthetic voice built using PiperTTS which runs efficiently on edge devices").
- **⚠ WEAKEST CLAIM IN THE WHOLE SET — `started: 1991`.** This is read off the **copyright range** on their About page ("Copyright © 1991 - 2026 Te Reo Irirangi o Te Hiku o Te Ika"), and it dates the *media organisation*, not the speech-technology work. None of the Te Hiku or Papa Reo pages I could read dated the ASR/TTS work, and `started` is **not nullable** in the schema, so I could not leave it empty. A reviewer should replace it with the year Kōrero Māori / Papa Reo began (the design spec's own example says 2016; the funding trail points at the Ka Hao fund around 2018–2019) or confirm 1991 as the intended meaning. The record carries this warning inline.
- **Not sourced:** `methods`, `papers`, `data_regime`.
- **Could not read:** `papareo.io` is a JavaScript app and returned no text; `tehiku.nz/te-hiku-tech/kaitiakitanga-license/` 404s.

### `onkwawenna-kentyohkwa` — Onkwawenna Kentyohkwa (indigenous, organisation)
- **Sourced:** `started: 1999` — their own site: "began teaching a full-time adult immersion program in 1999"; address "Suite 402 – 16 Sunrise Court ... Ohsweken, Ontario N0A 1M0", "on the Six Nations Grand River Territory near Brantford, Ontario".
- **`governance: null` — deliberate.** Their site describes *funding* ("All of our programs are community-funded for basic operations only") but states no governance posture and no data licence. Funding is not governance, so I did not infer `community-controlled` from it, though a reviewer with more context may well conclude that is right.
- **Not sourced:** `methods`, `models`, `papers`, `data_regime`.
- **For review:** `applications: [education]` is the closest fit in the controlled vocabulary for adult immersion teaching. Whether a language-teaching organisation with no stated NLP output belongs in an NLP atlas at all is a scoping question for the maintainer.

### `myaamia-center` — Myaamia Center (indigenous, organisation)
- **Sourced:** `started: 2001` — "Back in 2001, leaders from the Miami Tribe of Oklahoma and Miami University created the Myaamia Project"; address "351 E. Spring St. Bonham House, Miami University Oxford, OH 45056"; governance from "a Miami Tribe of Oklahoma initiative located within an academic setting"; `applications: [dictionary, corpus, education]` from their own Digital Resources page (ILDA Online Dictionary and app; the Miami-Illinois Digital Archive, which "assembles all known primary language sources into one location"; the Šaapohkaayoni education portal).
- **⚠ Departure from the brief: I did NOT record `tts`.** The task table pairs this record with TTS. Nothing in the Myaamia Center's own materials that I could read describes speech synthesis or text-to-speech work, and three searches found none. Rather than write an application I could not source, I left it out. If the reviewer knows of Myaamia TTS work, add it with a citation.
- **Not sourced:** the Project → Center transition year (their 25th-anniversary article does not give it), `methods`, `models`, `papers`, `data_regime`, `governance.licence`.

### `americasnlp` — AmericasNLP workshop (indigenous, workshop)
- **Sourced:** `started: 2021` (americasnlp.org, "The First Workshop on NLP for Indigenous Languages of the Americas"); shared-task areas → `applications: [mt, evaluation, education]`; two `papers` ids that both resolve against `data/derived/papers.json`: `ebrahimi-et-al-2023-americas-nlp` and `gibert-et-al-2025-americas-nlp`.
- **⚠ The `languages: [choctaw]` link needs a decision.** AmericasNLP's *shared tasks* centre on Quechua, Aymara, Bribri, Guarani, Nahuatl and others, none of which have a Language record here yet. The Choctaw link rests on the workshop's **proceedings**: "IndigiEval: Evaluating LLMs in North American Indigenous Languages" (AmericasNLP 2026) covers "five North American Indigenous languages (Mvskoke, Choctaw, Cherokee, Cheyenne, and Hawaiian)". `languages` requires at least one entry and there is no per-language source slot, so the justification lives in the record's comment and in the links. A reviewer should either add Language records for the shared-task languages or narrow this claim.
- **⚠ `site` is a compromise.** A workshop has no fixed venue — it moves with its host conference (ACL 2026 San Diego, NAACL 2025 Albuquerque, NAACL 2024 Mexico City, ACL 2023 Toronto). `site` is not nullable, so the pin is the only standing location in its own materials: an organiser's stated affiliation (University of Colorado Boulder). The `place` string says exactly that, so the map cannot silently mislead.
- **`governance: null`** — ACL workshops publish open-access, but AmericasNLP's own site states no governance posture, so nothing was inferred.
- **Not sourced:** `methods`, `models`, `data_regime`.

### `masakhane` — Masakhane (**adjacent tier**, organisation)
- **Sourced:** `started: 2019` from Masakhane's own paper — "Founded at the Deep Learning Indaba 2019, Masakhane constitutes an open-source, continent-wide, distributed, online research effort"; licences from their own repositories (MIT for `masakhane-mt`; "The license of the NER dataset is in CC-BY-4.0-NC"); the Amharic link from MasakhaNER, which covers "Amharic, Hausa, Igbo, Kinyarwanda, Luganda, Luo, Nigerian-Pidgin, Swahili, Wolof and Yorùbá" (note: MasakhaNER **2.0 drops Amharic** — worth capturing if the atlas ever records dataset-level detail).
- **⚠ `site` is the sharpest compromise in the set.** Masakhane states it is distributed, online and continent-wide, with **no base**. `site` is not nullable. The pin therefore marks the *founding venue* — Deep Learning Indaba 2019, Kenyatta University, Nairobi — and the `place` string opens with "No stated base:" so the caveat travels with the record into any UI that renders it. **If SP1 makes `site` nullable, this record should be the first to change.**
- **`transferability` (required by D2, and the point of the adjacent tier):** what transfers is the *organising model* — distributed participatory research, open weekly meetings, benchmark-first work across many languages at once. What does not transfer is the *licensing posture*: open release is reasonable for a widely-spoken national language and unreasonable where a community asserts kaitiakitanga over recordings of its last first-language speakers (contrast Te Hiku Media in this same queue). Also flagged: Amharic's data scale, and that "for Africans, by Africans" names a continental research community, not consent from a specific language community. This is a judgement, written to be argued with — it is exactly the field a reviewer should push back on.
- **Not sourced:** `methods`, `papers` (no Masakhane paper is in the 92-paper corpus; `rai-and-pal-2025-amharic` is about Amharic MT but is not Masakhane's, so it was left out), `data_regime`.
- **Could not read:** `masakhane.io/about-us` 404s; the community page states neither a founding year nor a member total.

---

## What SP0 still owes

The maintainer reviews these ten records and sets each to `verified` or `rejected`. `pnpm build:data` then exits 0 and writes `src/data/atlas.json`. Until that happens the gate holds the line, which is the whole point.

---

## SP3b — 30 new language records, 56 mapping entries

> Added 2026-09-06/07. SP3b took the atlas from 5 languages to 35 and gave the
> literature 56 paper→language mapping entries (up from none). All 30 new
> language records are `status: draft`; none of SP0's rules above were
> relaxed for them — nothing was invented, every claim carries a `source`,
> every hole is named rather than filled plausibly. This section extends the
> queue; it does not replace anything above it.
>
> Every number below was measured against this checkout, not estimated:
> `data/languages/*.yml` (35 files, 30 `status: draft` / 5 `status: verified`,
> 26 `tier: indigenous` / 9 `tier: adjacent`), `data/paper-languages.yml` (56
> entries, 31 `status: draft` / 25 `status: rejected`), and
> `data/glottolog-resolution.yml` (35 rows: 23 `level: language`, 10
> `level: family`, 2 `level: dialect`).

### What was sourced, and from where

For every new record: `glottocode`, `iso639_3`, `family`/`subfamily`, and —
for the 10 of the 30 new records whose tier and Glottolog data allow it —
`centre` coordinates. All of it came from Glottolog's JSON endpoint,
`https://glottolog.org/resource/languoid/id/<code>.json`, fetched under
CC-BY-4.0. Every fetch is a row in `data/glottolog-resolution.yml`, dated
`retrieved: "2026-09-06"`, quoting `latitude`/`longitude` and
`classification` verbatim — never computed, never approximated. A guard,
`resolutionProblems` (`src/lib/record-guards.ts`, wired into
`pnpm validate`), checks every record's `glottocode` against that file on
every build: a code that appears in no row, or a family code sitting where a
language code belongs, fails the build. It found nothing wrong in this
checkout — `pnpm validate`'s only complaints below are `status is draft`.

Of the 35 languages, 12 draw a pin on the map (up from 2 before this
sub-project: `te-reo-maori` and `myaamia`, plus 10 of the new records —
`aleut`, `bribri`, `cherokee`, `guarani`, `hawaiian`, `innu-aimun`,
`inuktitut`, `seneca`, `shipibo-konibo`, `wixarika`). The other 23 carry
`centre: null`: 9 are adjacent-tier, where D5 forbids a centre outright
(8 new plus the pre-existing `amharic`); 14 are indigenous-tier with no
usable point from Glottolog — 12 of those are new (the ten cover terms below
and the two dialects below), and 2 are pre-existing records already
documented in the Languages section above (`choctaw` and `kanienkeha`, each
a deliberate "Glottolog's point would misplace the community" judgement, not
a new gap).

### The three systematic gaps, again

The same three gaps SP0 named for the first five records apply, unchanged,
to all ~30 new ones:

- **`typology: []` on every new record.** The schema has no `source` slot
  for `typology`. Asserting an unsourced typological claim in an artifact
  that accompanies a paper is not something I would do even for an
  uncontroversial one.
- **`endangerment: null` on every new record.** The schema accepts only
  `scale: unesco-2010`. Glottolog publishes its own AES scale, not UNESCO
  2010 — mapping one onto the other would fabricate a citation.
- **`speakers: null` on every new record.** No figure was found in a source
  I could cite with the same confidence as the `glottocode`/`family` fields.

A reviewer with access to WALS, Grambank or the UNESCO Atlas can fill these
in and cite them properly; nothing here should be read as "these languages
have no typology, no endangerment status and no speakers" — only that this
sub-project sourced none of it.

### The ten cover terms — sign these as a group

Ten records carry `glottocode: null` and `centre: null` because the name the
corpus and the literature use names an entire family, not one language, and
Glottolog publishes no coordinate for a family. Each record's own `caveat`
field states the child-language count as fetched from Glottolog on
2026-09-06 (`child_language_count`), quoted here rather than recomputed:

| record      | Glottolog family name | children | note |
| ----------- | ---------------------- | -------: | ---- |
| `inuktut`   | Inuit (inui1246)       | 6        | not even Glottolog's own name for the term — see resolution decisions below |
| `cree`      | Cree (cree1272)        | 7        | family node unusually carries ISO `cre` (the macrolanguage code) despite no coordinate |
| `yupik`     | Yupik (yupi1267)       | 4        | |
| `nahuatl`   | Aztec (azte1234)       | 31       | two summaries name a specific variety (Western Sierra Puebla/Omitlán); record does not follow them down |
| `quechua`   | Quechuan (quec1387)    | 43       | one summary names Southern Quechua specifically; record does not follow it down |
| `aymara`    | Aymaran (ayma1253)     | 4        | |
| `raramuri`  | Tarahumaran (tara1321) | 5        | resolved via the Spanish exonym "Tarahumara" — see below |
| `otomi`     | Otomi (otom1300)       | 7        | resolved via the unaccented spelling — see below |
| `chatino`   | Chatino (chat1268)     | 7        | |
| `maya`      | Mayan (maya1287)       | 34       | Glottolog has no languoid named plainly "Maya" at all |

These ten are the records a reviewer is being asked to sign off on that
**deliberately never draw** — not a gap to be filled later, a property of
what the name means. Treat them as one decision, not ten.

### The two dialects — not cover terms, do not conflate with the above

`inuinnaqtun` (glottocode `copp1244`) and `sencoten` (glottocode `saan1246`)
also carry `centre: null`, but for the opposite reason from the cover terms.
Each names one specific lect — Glottolog files both one level below
`language`, as dialects (of Western Canadian Inuktitut and of Northern
Straits Salish respectively) — and Glottolog publishes no coordinate for any
dialect-level languoid, confirmed by fetching each code directly (both
return `latitude`/`longitude: null`). Because the code identifies the lect
precisely rather than standing in for languages it doesn't specifically
mean, **both records keep their glottocode** (unlike the ten cover terms
above, which carry `glottocode: null`). This is the distinction most likely
to get collapsed on a skim: no centre does not mean no glottocode, and here
it doesn't.

### Resolution decisions to check, not trust

Every case where Glottolog's own `name` differs from the name the corpus
uses is a candidate for a wrong match, even where I believe it's right.
Every one below is recorded, with its reasoning, in
`data/glottolog-resolution.yml`:

Kanien'kéha → Mohawk, Inuktitut → Eastern Canadian Inuktitut, Inuktut →
Inuit, Innu-Aimun → Montagnais, SENĆOŦEN → Saanich, Nahuatl → Aztec, Quechua
→ Quechuan, Aymara → Aymaran, Guarani → Paraguayan Guaraní, Wixarika →
Huichol, Rarámuri → Tarahumaran, Shipibo-Konibo → Shipibo-Conibo, Otomí →
Otomi, Maya → Mayan, Persian → Western Farsi, Myaamia → Miami, Te Reo Māori
→ Maori.

Two of these are **judgement, not fact**, and each is one field-edit to
overrule:

- **Inuktitut → Eastern Canadian Inuktitut (`east2534`).** Glottolog has no
  node named plainly "Inuktitut" — it splits into Eastern Canadian Inuktitut
  (`east2534`, iso `ike`) and Western Canadian Inuktitut (`west2618`, iso
  `ikt`) as siblings. Eastern was picked because it is the written standard
  in Nunavut government publishing and in the corpora (e.g. the Nunavut
  Hansard) that use the unqualified name. A reviewer who can check a
  specific paper's actual dialect should confirm or override this.
- **Guarani → Paraguayan Guaraní (`para1311`).** Glottolog has no family
  node named plainly "Guarani" — only "Tupi-Guarani", far broader, covering
  many languages nobody would call Guarani. Paraguayan Guaraní was picked as
  the variety NLP resources catalogue simply as "Guarani" (iso `gug`) and the
  official language of Paraguay. Eastern Bolivian Guaraní, Western Bolivian
  Guaraní and Mbyá Guaraní are separate Glottolog languages this does not
  cover; a reviewer should confirm which variety each of the candidate
  papers actually means.

Three further resolutions are worth a reviewer's eye even though I'm
confident in them, because each involved catching a plausible wrong answer
rather than taking Glottolog's search at face value: **Shipibo-Konibo**
resolves to the language `ship1254` ("Shipibo-Conibo", spelled with a C),
not to the family node `ship1253` that a substring search surfaces first;
**Otomí** resolves to the family `otom1300` ("Otomi", no accent), not to the
single unrelated dialect that searching the corpus's own accented spelling
turns up (`sanf1263`, "San Felipe Santiago Otomí" — a coincidental string
match); and **Wixarika** and **Innu-Aimun** both required Glottolog's
alternate-names table rather than its primary search, which returns zero
results for the community's own spelling in each case.

### The 25 rejected mappings

`data/paper-languages.yml` carries 56 entries: 31 `status: draft` and 25
`status: rejected`. Each rejected entry keeps its verbatim quote and the
reason it failed. None of the 25 failed because its quote sat in the paper's
own `## Relevance to Indigenous AI` section: the location rule (spec D2) is
machine-enforced by `validate.ts` and `tests/paper-mappings.test.ts`, so a
quote from that section is refused before a curator ever gets to judge it —
zero of the 25 rejected quotes come from there. Every one of the 25 instead
passed the location rule and failed the STUDIES rule: the quote sits in the
paper's own subject-matter text, but names the language as something other
than a language the paper builds for, runs experiments on, or takes as its
subject. The recurring shapes, each with an example:

- **A family-classification label**, naming what family the paper's actual
  subject belongs to, not a language the paper studies: "Aleut" appears only
  inside "Eskimo-Aleut" in `le-and-sadat-2021-canada → aleut`; "Yupik"
  appears only inside "Inuit-Yupik-Unangan family" in
  `khandagale-et-al-2022-polysynthetic → yupik`.
- **A comparative aside**, benchmarking the paper's actual subject against
  another language: `le-and-sadat-2021-canada → kanienkeha` contrasts
  Inuktitut's NLP-resource level with Mohawk's ("a level Mohawk has not
  reached") without Mohawk being anything the paper works with.
- **An illustrative or typological example**, one of several languages
  named to illustrate a general category rather than studied individually:
  Mohawk is one of three languages illustrating "agglutinative" in
  `arnett-and-bergen-2025-morphologically-complex → kanienkeha`; Nahuatl and
  Wixarika are named the same way, in a Key Concepts bullet defining
  "polysynthetic", in `ebrahimi-et-al-2023-americas-nlp → nahuatl,wixarika`.
- **An institutional affiliation, in one case**, not a studied language at
  all: the only occurrence of "Basque" in `sanchez-et-al-2025-linguini`'s
  summary is inside a venue credit, "University of the Basque Country" — a
  coincidental substring match, not evidence the paper's 75-language
  benchmark includes Basque (`sanchez-et-al-2025-linguini → basque`).

Two rejections fail on different grounds worth naming separately, since
neither is quite the shape above: `song-et-al-2026-slm →
quechua,guarani,yoruba` is withheld under the ambiguity rule — its quote is
an open, illustrative list ("Languages like Quechua, Yoruba, Dzongkha, and
Guarani") with no per-language figure tied to any of them, and the summary
alone cannot settle whether the paper's own 200-language evaluation reports
individual results for these three. And `pinhanez-et-al-2024-vitalize →
guarani` is withheld because the paper's actual fieldwork is Guarani Mbya, a
distinct Glottolog language (`mbya1239`) from the Paraguayan Guaraní
(`para1311`) the atlas's `guarani` record covers — mapping it would
misattribute the paper to the wrong specific language, which is a resolution
problem, not a STUDIES-rule failure.

These are shipped in `data/paper-languages.yml` itself, not in a task
report, because task reports are gitignored and will not ship with the
repository — this file is the only durable record of why a plausible-looking
candidate mapping was refused. Without it, the next person to run the same
search re-derives the same 25 candidates and has nothing to read about why
they didn't make it in.

The 31 live (non-rejected) entries resolve to 51 distinct (paper, language)
pairs and reach 26 of the atlas's 35 languages from the literature.

### Open questions for the maintainer

- **The `subfamily` convention is stated two ways.** All 30 new records take
  the first classification branch that actually discriminates. For 28 of
  them that is Glottolog's `classification[1]`. For `persian` and `nepali`
  it is not: Glottolog's second entry for both is "Classical Indo-European",
  a clade so broad it also covers Balto-Slavic, Germanic, Italic, Celtic,
  Hellenic, Armenian and Albanian — it says almost nothing beyond
  "Indo-European" and reads, to a page visitor, as though the language were
  archaic. `persian` instead names `classification[4]` ("Iranian") and
  `nepali` names `classification[3]` ("Indo-Aryan") — the first branch in
  each one's own array that actually discriminates, per each record's own
  comment. The five pre-existing records follow the same instinct but were
  hand-curated before the convention existed as a rule: `te-reo-maori` uses
  "Polynesian" (`classification[6]`) and `myaamia` uses "Algonquian"
  (`classification[2]`). The rule itself has never been written down
  anywhere but individual record comments. Should it be?
- **Region assignments that are curator judgement, not fact.** `aleut`,
  `yupik` and `inuktut` are classed `region: arctic` on circumpolar grounds
  rather than strict latitude. `nahuatl` and `maya` are given `region: null`
  because those families span two of the atlas's REGIONS members and no
  single value would be truthful. `sundanese` is given `region: null`
  because REGIONS has no member covering insular Southeast Asia at all.
- **The transferability gap.** The adjacent tier exists to answer "does
  this transfer?", but the `transferability` field lives only on the
  *initiative* schema (spec D2 requires it there for every adjacent-tier
  initiative), and every one of the atlas's 5 initiative records is
  currently `status: rejected`. So the 8 new adjacent-tier *language*
  records added in this sub-project (9 adjacent-tier in total, counting the
  pre-existing `amharic`) mark scope only — they carry no transposability
  judgement at all, because there is nowhere on a language record to put
  one. Closing this means adding the field to adjacent-tier language records
  or to mappings; both were out of scope here.

### What SP3b did NOT cover

No speaker counts, no endangerment statuses, and no typology were sourced
for any of the 30 new records — that is the three systematic gaps above,
restated as a boundary. A maintainer who wants those must consult UNESCO's
Atlas of the World's Languages in Danger, WALS or Grambank directly; nothing
in this sub-project's sources supports filling them in.

### What SP3b still owes

The maintainer reviews all 30 new language records and 31 draft mapping
entries and sets each to `verified` or `rejected`. Until that happens
`pnpm build:data` and `pnpm build:app` both exit 1 by design — the gate from
D9 holds the line across 86 unreviewed records now, not just SP0's original
ten.
