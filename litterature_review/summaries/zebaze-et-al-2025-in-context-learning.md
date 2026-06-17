# In-Context Example Selection via Similarity Search Improves Low-Resource Machine Translation

**Authors:** Armel Zebaze, Benoît Sagot, Rachel Bawden
**Year:** 2025
**Venue:** Proceedings of the 63rd Annual Meeting of the Association for Computational Linguistics (ACL 2025) (Inria, Paris)

---

## Core Argument

Retrieval of in-context examples via sentence embedding similarity improves LLM machine translation quality, especially for low-resource language directions — contradicting prior results on high-resource pairs where similarity-based retrieval showed no consistent benefit over random selection. The size and quality of the selection pool also significantly influences results, requiring a balance between diversity and quality.

## Key Concepts

- **In-context example selection:** Choosing which parallel sentence pairs to include in an LLM prompt for few-shot MT; this paper studies selection via embedding similarity vs. random sampling.
- **Sentence embedding retrieval:** Using multilingual sentence embeddings (SONAR, LaBSE, E5, LASER2, Embed v3) to find source sentences in a pool that are semantically similar to the sentence to be translated.
- **Low-resource directions:** The paper specifically includes Wolof (a West African low-resource language) alongside high-resource pairs (French, German) and medium-resource (Swahili) to study the LRL benefit.
- **Selection pool diversity vs. quality trade-off:** Larger, more diverse pools provide more relevant examples for retrieval but may include lower-quality translations; the paper analyzes this tension.
- **Wrong-target-language errors:** A failure mode where the LLM outputs in the wrong language; more frequent for low-resource directions and with random selection.

## Main Findings

- Similarity-based retrieval consistently improves MT quality for low-resource language directions (Wolof, Swahili); the benefit is absent or weaker for high-resource pairs, resolving conflicting prior results.
- SONAR and other multilingual embedding models perform comparably; no single embedding method strongly dominates.
- Random selection frequently results in wrong-target-language outputs for Wolof; similarity-based retrieval substantially reduces this error type.
- Larger models benefit more from retrieval; smaller models (BLOOM 7B, Mistral 7B) show reduced or inconsistent gains.
- Pool diversity matters: including low-quality examples in the pool harms retrieval-based selection more than random selection, since the retrieval method is more likely to select confusing examples.

## Relevance to Indigenous AI

For Mohawk, this paper has direct implications for how to structure any in-context MT system: when even small amounts of parallel data are available, similarity-based retrieval of the most relevant examples will outperform random selection, particularly for a language as low-resource as Mohawk. The Wolof findings are the most transferable: like Mohawk, Wolof is an under-resourced language with limited representation in LLM pretraining, and the improvement from similarity retrieval is clearest in exactly this regime. The wrong-target-language failure mode is also a risk for Mohawk outputs that community speakers would need to catch. The pool quality analysis suggests that curating a high-quality, community-validated parallel corpus (even small) is more valuable than a larger but noisy one.

## Limitations & Critiques

- Wolof, while low-resource, is not as extremely low-resource as Mohawk; results may not transfer to the zero/near-zero parallel data regime.
- The paper does not address community involvement or data sovereignty; parallel data is treated as a technical resource.
- Evaluation uses automated metrics (spBLEU, chrF); no human evaluation of low-resource output quality is included.

## Questions & Follow-ups

- At what threshold of available parallel Mohawk sentences does similarity-based retrieval begin to outperform random selection?
- Could community-validated sentence pairs serve as a high-quality retrieval pool even if small, with the quality advantage offsetting the size disadvantage?
- Related work: Pei et al. (2025) (in-context MT for Manchu, dictionary vs. grammar vs. examples), Tanzer et al. (2024), Aycock et al. (2025).
