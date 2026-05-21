# Unmasking the Factual-Conceptual Gap in Persian Language Models

**Authors:** Alireza Sakhaeirad, Ali Ma'manpoosh, Arshia Hemmat
**Year:** 2026
**Venue:** Proceedings of the First Workshop on NLP and LLMs for the Iranian Language Family (SilkRoadNLP), ACL

---

## Core Argument

Persian-capable LLMs can retrieve isolated cultural facts but systematically fail to reason about implicit cultural schemas — the context-dependent social logic (e.g., knowing when taarof applies, not just what it is). The paper introduces DIVANBENCH, a 315-question diagnostic benchmark spanning superstitions, customs, and social etiquette, and reveals three critical failures: near-universal acquiescence bias (models accept culturally appropriate behaviors but fail to reject violations), a 21-point factual-to-conceptual performance gap, and a counterintuitive "pretraining paradox" where continued Persian-language pretraining amplifies surface pattern-matching while degrading logical discernment.

## Key Concepts

- **Cultural schema:** Implicit social logic (learned through lived experience and social correction) that maps context to appropriate action — distinct from retrievable cultural facts.
- **Acquiescence bias:** The tendency of LLMs to accept any plausible-sounding culturally-themed statement regardless of correctness, because cultural keywords co-occur with positive contexts in training data.
- **Factual-Conceptual Gap:** The average 21-percentage-point drop in accuracy when transitioning from factual retrieval ("What is taarof?") to scenario-based reasoning ("Would taarof be appropriate here?").
- **Persian Pretraining Paradox:** Continuous Persian pretraining (Llama 3.1 → Dorna2) raised acceptance accuracy (+28 pp) while collapsing rejection accuracy (−43 pp), suggesting that monolingual data scaling reinforces surface fluency but degrades cultural discernment.
- **Binary Belief Verification:** Paired positive/negative scenario design that directly measures acquiescence bias by contrasting correct cultural behavior against plausible violations of the same concept.

## Main Findings

- Six of seven evaluated models (7–12B parameter range) exhibit severe acquiescence bias: acceptance of culturally appropriate behavior runs 84–92%, while rejection of clear violations ranges only 19–48%.
- The factual-conceptual gap averaged 21 percentage points across all models, confirming that cultural facts and cultural schemas behave as independent learning objectives.
- Continuous Persian pretraining on Dorna2 (derived from Llama 3.1-8B) produced a 43-point collapse in rejection accuracy — the opposite of the intended improvement — demonstrating that monolingual data scaling is insufficient for cultural competence.
- Larger model size (Gemma3-12B, the only >10B model) improved factual recall but did not reduce acquiescence bias, indicating that scale amplifies pattern-matching without adding genuine discernment.

## Relevance to Indigenous AI

The paper provides a precise conceptual vocabulary — cultural schemas vs. cultural facts, acquiescence bias, factual-conceptual gap — that transfers directly to Indigenous language AI evaluation. For Mohawk and Six Nations contexts, the distinction matters critically: a model could correctly produce the Mohawk word for a condolence ritual while failing to understand the social obligations that ritual entails. The paired positive/negative benchmark design is a replicable methodology for constructing diagnostic evaluations of Indigenous-language models that go beyond factual retrieval. The finding that monolingual pretraining can degrade reasoning is a direct warning for projects considering scaling Mohawk-language training data without investing in schema-level evaluation.

## Limitations & Critiques

- The benchmark covers 7–12B parameter models only; it is unknown whether the acquiescence trap persists or diminishes at 30–70B+ scales with stronger instruction tuning.
- All questions are manually authored by researchers with lived knowledge of Iranian society; the benchmark may reflect particular socioeconomic or regional sub-cultures within Iran rather than the full diversity of Persian-speaking communities.
- No large-scale inter-annotator agreement or crowdsourced validation was performed; residual ambiguity in scenario framing cannot be ruled out.
- The study is limited to Persian; whether the same failure modes appear in structurally different minority or Indigenous languages remains an open question.

## Questions & Follow-ups

- How would one construct a paired binary verification benchmark for Mohawk cultural protocols (e.g., longhouse ceremony etiquette, clan-specific obligations) where insider/outsider knowledge asymmetry is even more pronounced?
- What training interventions — beyond monolingual data scaling — could actually close the factual-conceptual gap? (The paper calls for future work but does not propose solutions.)
- Related work to explore: Kim and Lee (2025) on NUNCHI-BENCH for Korean superstitions, which inspired this paper's methodological approach.
