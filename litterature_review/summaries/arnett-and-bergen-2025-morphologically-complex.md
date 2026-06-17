# Why Do Language Models Perform Worse for Morphologically Complex Languages?

**Authors:** Catherine Arnett, Benjamin K. Bergen
**Year:** 2025
**Venue:** COLING 2025 — 31st International Conference on Computational Linguistics, pages 6607–6623

---

## Core Argument

Language models systematically perform worse on agglutinative (morphologically complex) languages than on fusional languages like English, but this gap is not intrinsic to language structure. After controlling for training data volume and adjusting for the "byte premium" — the extra bytes required to encode the same information in morphologically rich languages — the performance gap is largely eliminated, pointing to data disparity rather than structural disadvantage as the primary cause.

## Key Concepts

- **Morphological typology:** The classification of languages by how they form words. Fusional languages (English, Spanish) pack multiple morphosyntactic features into single morphemes. Agglutinative languages (Turkish, Finnish, Mohawk) stack distinct morphemes, producing many unique word forms.
- **MorphScore:** A new tokenizer evaluation metric introduced in this paper, measuring the proportion of token boundaries that align with morpheme boundaries across 22 languages; agglutinative languages score *higher* on MorphScore than fusional languages, disconfirming the morphological alignment hypothesis.
- **Byte premium:** The extra bytes required to encode the same content in a given language relative to English due to orthographic encoding and longer words. Morphologically rich languages with non-Latin scripts pay a larger byte premium, meaning they receive effectively less training signal from a nominally equal data budget.
- **H1 — Morphological alignment hypothesis:** Agglutinative languages underperform because their tokenizers fail to segment words along morpheme boundaries. *Not supported*: agglutinative languages have higher MorphScores than fusional ones.
- **H2 — Tokenization quality hypothesis:** Agglutinative languages have worse compression and Rényi entropy. *Partially supported*: some evidence that tokenization quality contributes, but not the dominant factor.
- **H3 — Data disparity hypothesis:** Morphologically rich languages receive less training data, amplified by the byte premium. *Best supported*: when monolingual models are trained on byte-premium-scaled equivalent data, the performance gap is substantially reduced.

## Main Findings

- A robust performance gap between agglutinative and fusional languages is confirmed across multilingual models (XGLM, BLOOM, mT0, MaLA, LLaMA2) and monolingual models trained on balanced data.
- MorphScore shows that agglutinative languages actually have *higher* morphological alignment than fusional languages — the opposite of the alignment hypothesis — because longer words with more tokens are statistically more likely to have a token boundary fall on a morpheme boundary by chance.
- There is no significant correlation between MorphScore and language model perplexity (F(1,13)=0.323, p=0.580), disconfirming morphological alignment as an explanation for the performance gap.
- When monolingual models are trained on byte-premium-scaled data (i.e., equivalent information content rather than equivalent byte count), the performance gap is substantially reduced, supporting the data disparity hypothesis.
- The finding implies that languages of particular morphological types are not intrinsically advantaged or disadvantaged — the gap is an artifact of unequal data representation.

## Relevance to Indigenous AI

This paper provides the most rigorous empirical answer to a foundational question for the IndigenousAI project: is Mohawk's polysynthetic structure itself a barrier to LLM performance, or is it the absence of training data? The answer — data is the dominant factor, structure is secondary — is broadly encouraging: it means that building a Mohawk-language AI system is not structurally futile, and that targeted data collection efforts should produce commensurate performance gains. The byte premium finding is also directly actionable: when estimating how much Mohawk data is "equivalent" to English data for training purposes, the byte overhead of Mohawk's longer word forms must be accounted for. The disconfirmation of the morphological alignment hypothesis also tempers enthusiasm for complex morpheme-aware tokenizers: the data, not the tokenizer design, appears to be the binding constraint.

## Limitations & Critiques

- No genuinely polysynthetic language (like Mohawk) is included in the 22-language MorphScore evaluation; the closest are agglutinative languages like Turkish and Finnish, which are less morphologically complex than Mohawk.
- The "byte premium" correction assumes that bytes are the right unit of data equivalence; for polysynthetic languages where a single word encodes a full clause, this metric may still understate the effective data sparsity.
- The study uses perplexity and benchmark scores as proxies for performance; cultural and pragmatic dimensions of language use are not captured.

## Questions & Follow-ups

- What is the byte premium for Mohawk relative to English, and how large a Mohawk training corpus would be required to achieve equivalent effective exposure to an English-scale dataset?
- Does the finding that morphological alignment does not predict performance hold for generative tasks (translation, summarization) as well as for perplexity and classification benchmarks?
- Related work: Arnett et al. (2025) (MorphScore expanded to 70 languages), Ma et al. (2025) (transliteration for non-Latin scripts), Goldman et al. (2024) (tokenizer compression), Schmidt et al. (2024) (tokenization is more than compression).
