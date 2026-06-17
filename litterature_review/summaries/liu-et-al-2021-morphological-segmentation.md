# Morphological Segmentation for Seneca

**Authors:** Zoey Liu, Robbie Jimerson, Emily Prud'hommeaux
**Year:** 2021
**Venue:** First Workshop on NLP for Indigenous Languages of the Americas (AmericasNLP 2021), ACL

---

## Core Argument

Seneca — a critically endangered Iroquoian language with fewer than 50 first-language speakers, the same language family as Mohawk — can benefit from neural encoder-decoder morphological segmentation, including when augmented with multi-task learning. The paper also demonstrates that cross-linguistic transfer from related polysynthetic languages (Yuto-Aztecan) provides gains even across language families, expanding the feasibility frontier for low-resource Iroquoian NLP.

## Key Concepts

- **Seneca:** Member of the Hodinöhšöni (Iroquois Confederacy) language family; spoken mainly in Western New York (Allegany, Cattaraugus, Tonawanda reservations) and Ontario; critically endangered (<50 first-language speakers, all Elders); a few hundred second-language learners active in revitalization.
- **Iroquoian polysynthesis:** A single Seneca word can contain multiple stems and express a full phrase or sentence. Seneca has both agglutinative features (morphemes combine without phonological change) and fusional features (combining morphemes undergo phonological changes). This is structurally parallel to Mohawk.
- **Two data domains:** Grammar book data (morphological segmentation of verbs only, defined by grammarians) and informal community transcriptions (mix of verbs and nouns, labeled by community speakers). Treated as distinct domains to test cross-domain generalization.
- **Neural encoder-decoder + multi-task learning:** Encoder-decoder architecture for character-level segmentation, enhanced with multi-task learning objectives — combining in-domain and cross-domain training signals.
- **Cross-linguistic transfer:** Training on related (Yuto-Aztecan) polysynthetic languages (Mexicanero, Nahuatl, Wixarika, Yorem Nokki from Kann et al. 2018) provides gains for Seneca, even across language families.
- **Community collaboration:** The research was conducted with the same ethical considerations as earlier community NLP work; community data is handled carefully; research output is oriented toward supporting the community's language reclamation program.

## Main Findings

- Neural encoder-decoder models with multi-task learning achieve better Seneca morphological segmentation than non-neural baselines, even with very small training sets.
- Cross-domain evaluation (training on grammar book data, evaluating on informal community transcriptions) is harder than in-domain evaluation — reflecting the real-world mismatch between formal linguistic resources and actual community language use.
- Out-of-domain development set evaluation (instead of standard in-domain) is a more realistic model selection criterion for deployment, better capturing generalization to community use.
- Cross-linguistic training on related polysynthetic languages (even from different families) provides measurable gains, suggesting morphological knowledge transfers across typologically similar languages.
- Seneca has <50 first-language speakers; this makes it one of the most extreme low-resource cases in the NLP literature.

## Relevance to Indigenous AI

Seneca is in the same language family (Iroquoian/Hodinöhšöni) as Mohawk — they are linguistic relatives, descended from the same proto-language, with parallel morphological structures. This is the closest NLP analog to Mohawk in the literature: same language family, same polysynthetic typology, same critically endangered status, same community-based revitalization context. The cross-linguistic transfer finding is directly actionable: Seneca NLP work (segmentation datasets, models, morphological analyses) could be used as training data or prior knowledge for Mohawk NLP, and vice versa. The multi-task learning results suggest that joint Iroquoian training (Seneca + Mohawk + possibly Oneida or Cayuga) could outperform monolingual Mohawk-only models. The community ethical framework mirrors what the IndigenousAI project needs.

## Limitations & Critiques

- Seneca and Mohawk, while in the same language family, are not mutually intelligible and have distinct morphological systems; transfer learning gains may be smaller than within-family intuition suggests.
- The paper reports on morphological segmentation only, not on downstream tasks; how segmentation quality translates to language learning applications or other NLP tasks is not demonstrated.
- The grammar book data was segmented by grammarians, not community speakers; the mismatch between grammarian and speaker segmentation preferences (which the paper observes) is a fundamental challenge for any Indigenous NLP training data.

## Questions & Follow-ups

- Can the Seneca morphological segmentation datasets be used as cross-linguistic training data for a Mohawk segmenter?
- Is there ongoing NLP collaboration between the Seneca language revitalization community and the Mohawk/Six Nations community? Could these be bridged through a joint Iroquoian NLP initiative?
- Related work: Kann et al. (2018) on neural segmentation for polysynthetic languages (provides the Yuto-Aztecan data used here); Kuhn et al. (2020) on Mohawk verb conjugator (closest existing Mohawk NLP system); Le et al. (2022) for Innu-Aimun deep learning segmentation.
