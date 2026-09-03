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
