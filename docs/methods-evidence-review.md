# `methods:` — what the sources actually support

Working document for the promotion in `atlas/data/REVIEW-QUEUE.md`. Researched
2026-09-05 against the 92-summary corpus, the 39 technique docs, and each
initiative's own public pages. **Nothing here has been written into
`atlas/data/`** — every change below is yours to make or reject.

`methods:` takes IDs from `atlas/data/derived/methods.json` (39 of them), and
`scripts/validate.ts` refuses an ID that does not resolve. So the question for
each initiative is not "which of these could describe them" but "which of these
do we have a source saying they *use*".

## Result

| Initiative | Proposed | Confidence |
| --- | --- | --- |
| Onkwawenna Kentyohkwa | `wordweaver-fst-conjugator` | Strong — two independent sources |
| Te Hiku Media | `community-data-sovereignty` (your call) | Weak — arguable, and already recorded under `governance` |
| Myaamia Center | none | No source found |
| Masakhane | none | No source found |
| AmericasNLP | none | Empty is the correct value |

## The finding that matters more than the table

**`methods: []` is not a defect on four of these five records.** The premise
that all five need filling does not survive contact with the sources.

The 39 methods are not a general taxonomy of language technology. They were
extracted from a literature review oriented at the Mohawk / Six Nations context,
so they cover what that review covered. An initiative can be well documented,
active, and completely outside them — the Myaamia Center's dictionary and
archive work is real and has no entry here, because no reviewed paper described
it as a technique.

Filling these fields would mean inferring from what an initiative plausibly does
to what the corpus happens to name. That is the failure the whole gate exists to
prevent, so four of five should stay `[]` and the honesty of that should be
stated in `caveat` rather than repaired.

## The one change I would make

`atlas/data/initiatives/onkwawenna-kentyohkwa.yml`:

```yaml
methods: [wordweaver-fst-conjugator]
papers:
  - kuhn-et-al-2020-nrc-canada
```

Both IDs resolve (`kuhn-et-al-2020-nrc-canada` is in `data/derived/papers.json`;
`wordweaver-fst-conjugator` is in `methods.json`), so `pnpm validate` will accept
them.

**Source 1** — Kuhn et al. (2020), *The Indigenous Languages Technology Project
at NRC Canada*, COLING 2020. Brian Maracle is a listed co-author under the
affiliation "Onkwawenna Kentyohkwa":

> WordWeaver / Kawennón:nis: A software framework for building verb conjugators
> for polysynthetic languages, instantiated for Kanyen'kéha (Mohawk). Initiated
> at the request of Brian Maracle (Onkwawenna Kentyohkwa, Six Nations Grand
> River).

**Source 2** — `docs/docs/ml-techniques/wordweaver-fst-conjugator.md`, which
records the school as a participant in the method's application, not merely its
requester:

> Quality control: in-person multi-day sessions with teachers at Onkwawenna
> Kentyohkwa; teachers added hundreds of new verbs via the spreadsheet workflow.

Adding the paper is worth doing on its own account: only 2 of the 92 summaries
are currently cited by any initiative record, and the atlas exists partly to
route readers from an initiative to the literature about it.

## The judgement call: Te Hiku Media

`community-data-sovereignty` describes what Te Hiku is known for, and the record
already carries `governance.posture: community-controlled` with the Kaitiakitanga
License, sourced from their own site. But two things argue against my writing it
in for you:

1. **No source states it as a method they apply.** No technique doc mentions Te
   Hiku or the Kaitiakitanga License; the corpus mention of Kaitiakitanga
   (`pinhanez-and-wornyo-2025-co-development`) discusses the licence as a case
   study in decolonial licensing and never names Te Hiku. Their own pages
   describe the licence's existence, not a practice matching the technique doc's
   definition. The strongest sentence I found on their data-sovereignty page is
   "we will prioritise requests from Indigenous communities" — a governance
   detail, not a method.
2. **It would be recorded twice.** The fact is already in `governance`, where it
   is sourced. Repeating it in `methods` makes the atlas look like it has method
   coverage it does not have.

If you want it in, the citation to use is the record's existing
`governance.source`. I would leave it out.

## What I checked and rejected

Listed so nobody re-derives these and reaches a different answer.

- **AmericasNLP → any method.** The three technique docs mentioning AmericasNLP
  do so only in reference lists, as the *venue* a paper was published at. Neither
  of the workshop's two cited papers is the source of any technique doc. A
  workshop is a venue; `methods: []` is the accurate value, not a gap.
- **Onkwawenna → the other 15 Mohawk-mentioning technique docs.** Kanien'kéha
  appears in 16 of the 39 because the guide is written toward that context. Only
  WordWeaver names the school as a participant. The mentions in
  `khandagale-et-al-2022`, `ngoc-et-al-2021` and `pinhanez-et-al-2024` are the
  summary authors reasoning about what *could* be built using the school's
  materials — future work, not practice.
- **Onkwawenna → `fst-morphological-segmentation`.** WordWeaver does use Foma
  FSTs, but that technique doc is about segmentation for machine translation, a
  different task. Sharing a formalism is not using the method.
- **Te Hiku → `read-along-audio-alignment`.** Te Hiku does ASR and TTS, but
  ReadAlong Studio is NRC's tool and nothing connects them.
- **Masakhane → participatory-research methods.** Their founding paper's abstract
  describes an "open-source, continent-wide, distributed, online research effort"
  and a "methodology for building the community", which is close to
  `community-driven-goal-identification` and `cyclical-engagement-process` — but
  those techniques have specific definitions the abstract does not match, and the
  full paper is not in the corpus. The one corpus mention of Masakhane
  (`uemura-et-al-2024-afriinstruct`) shows *others* consuming MasakhaNEWS and
  MasakhaPOS, which is evidence about that paper, not about Masakhane.
- **Myaamia Center → anything.** No mention in any technique doc or summary, and
  their digital-resources page describes what ILDA, MIDA, Šaapohkaayoni and
  mahkihkiwa do without stating any computational method.

## What would change the answer

- **Masakhane:** the full text of arXiv:2003.11529, read against the definitions
  in `cyclical-engagement-process` and `community-driven-goal-identification`.
- **Te Hiku:** the Kaitiakitanga License text in their GitHub repository, if it
  states a data-governance practice rather than licence terms.
- **Myaamia Center:** a publication describing how ILDA or MIDA is built. Their
  own site does not.
- **AmericasNLP:** nothing. The field is correctly empty.
