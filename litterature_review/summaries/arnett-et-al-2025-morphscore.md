# Evaluating Morphological Alignment of Tokenizers in 70 Languages

**Authors:** Catherine Arnett, Marisa Hudspeth, Brendan O'Connor
**Year:** 2025
**Venue:** ICML 2025 Tokenization Workshop (TokShop), Vancouver, Canada

---

## Core Argument

MorphScore — a metric measuring how often token boundaries align with morpheme boundaries — is expanded from 22 to 70 languages, with added flexibility for frequency weighting and parameter tuning. Testing the expanded metric against downstream performance across five pretrained models and seven tasks confirms the earlier finding: morphological alignment alone does not explain much variance in model performance.

## Key Concepts

- **MorphScore:** A tokenizer evaluation metric that measures the proportion of morpheme boundaries (from Universal Dependencies or UniMorph annotations) that coincide with token boundaries for a given tokenizer. A score of 1.0 means every morpheme boundary is a token boundary; 0.0 means none are.
- **Expansion to 70 languages:** The original Arnett & Bergen (2025) version covered 22 languages (11 agglutinative, 11 fusional); this version scales to 70, broadening language family and morphological type coverage.
- **Parameter flexibility:** The updated MorphScore allows users to configure frequency weighting (whether high- or low-frequency words are prioritized in the calculation) and the treatment of single-token words, enabling sensitivity analysis.
- **Universal Dependencies / UniMorph:** The annotation sources used to establish gold morpheme boundaries for evaluation; coverage varies by language and affects dataset size.

## Main Findings

- Across five pretrained models (including encoder and decoder models) evaluated on seven downstream tasks spanning all 70 languages, morphological alignment (MorphScore) does not explain much variance in model performance.
- Different parameter settings for MorphScore (e.g., frequency weighting, single-token word inclusion) affect the alignment scores but do not change the overall conclusion: morphological alignment is not a reliable predictor of downstream task quality.
- The paper provides datasets with sentential context, POS information, and full UD morphological annotations beyond what is needed for MorphScore alone, enabling a broader range of future tokenizer research.
- The result replicates and strengthens the conclusion of Arnett & Bergen (2025): the intuition that "morphologically aligned tokenization → better performance" is not empirically supported at scale.

## Relevance to Indigenous AI

This paper closes a potential gap left by the 22-language Arnett & Bergen (2025) study: the non-result generalizes. For the IndigenousAI project, this means that investing in a morpheme-boundary-aware tokenizer for Mohawk is unlikely to yield the performance gains sometimes promised in the literature. The data collected for this paper (UD-grounded morpheme annotations in 70 languages) also models a methodology for creating morphological evaluation benchmarks — which could be adapted for Mohawk if morphological annotations from existing linguistic resources (e.g., Kanien'kéha grammars) were formalized into a dataset. The broader implication for the project is that tokenizer evaluation metrics should focus on compression efficiency and downstream task performance rather than morphological alignment per se.

## Limitations & Critiques

- No polysynthetic languages (Mohawk, Inuktitut, Yup'ik) are in the 70-language sample; the expansion covers more morphological variety but still does not include truly polysynthetic languages for which word-level morpheme annotation is most complex.
- Evaluation is limited to existing pretrained models and their tokenizers; a Mohawk-specific tokenizer cannot be evaluated with this framework without new training data and UD annotations.
- The "does not explain much variance" finding may understate the importance of tokenization for low-resource polysynthetic settings, where the results may not generalize.

## Questions & Follow-ups

- If morphological alignment is not predictive of performance, what tokenizer property *is* most predictive in low-resource settings — and does this answer change for a language as morphologically extreme as Mohawk?
- Could the MorphScore methodology be extended to evaluate tokenizers on Mohawk using existing Kanien'kéha grammar resources as a morpheme annotation source, even without full UD coverage?
- Related work: Arnett & Bergen (2025) (original MorphScore, 22 languages), Alqahtani et al. (2026) (tokenization as core design decision), Schmidt et al. (2024) (tokenization is more than compression), Poelman et al. (2025) (morphology and tokenization for low-resource languages).
