# LLMs Are Few-Shot In-Context Low-Resource Language Learners

**Authors:** Samuel Cahyawijaya, Holy Lovenia
**Year:** 2025
**Venue:** Preprint / Conference (HKUST, AI Singapore)

---

## Core Argument

In-context learning (ICL) is a viable and effective mechanism for extending LLM capabilities to low-resource languages, but success depends critically on alignment strategy. The paper identifies a key failure mode — label alignment — and proposes query alignment as a more effective alternative. Cross-lingual ICL (X-ICL), using examples from a different but high-resource language, further narrows the performance gap when in-language examples are unavailable.

## Key Concepts

- **In-context learning (ICL):** Providing a model with a few input-output examples in the prompt without updating parameters; studied here across 25 low-resource and 7 higher-resource languages.
- **Cross-lingual ICL (X-ICL):** Using in-context examples from a high-resource language while the task is in a low-resource language; useful when no low-resource examples are available.
- **Label alignment:** A common ICL strategy that maps target-language labels to source-language labels; shown to be frequently ineffective or harmful for low-resource settings.
- **Query alignment:** The proposed alternative — aligning the query semantically to the demonstration language rather than aligning labels — consistently outperforms label alignment for low-resource languages.
- **Semantically relevant examples:** Selecting ICL examples by semantic similarity (SBERT retrieval) to the query significantly improves performance over random selection.

## Main Findings

- ICL with semantically relevant examples substantially improves LLM performance on low-resource languages compared to zero-shot baselines.
- Query alignment consistently outperforms label alignment for low-resource ICL, resolving a systematic failure mode in prior work.
- X-ICL (cross-lingual exemplars from a high-resource language) is effective even when no in-language examples exist, providing a practical pathway for zero-resource settings.
- Performance gains from ICL are most pronounced for languages with very limited LLM pretraining exposure; the method closes the gap between high- and low-resource language performance.
- SBERT-based retrieval of semantically similar examples outperforms random selection, consistent with findings from Zebaze et al. (2025).

## Relevance to Indigenous AI

For Mohawk, query alignment and X-ICL provide actionable strategies for enabling LLM task performance without any Mohawk-specific labeled data. If a task needs to be performed in Mohawk (e.g., classification, generation), cross-lingual exemplars from a structurally related or typologically similar language could bootstrap performance before any community-labeled data is available. The finding that semantic retrieval of examples outperforms random selection applies directly to structuring any in-context Mohawk system. The paper also provides a practical diagnostic: if label alignment is the strategy being used and it fails, query alignment should be tried first before concluding ICL is ineffective.

## Limitations & Critiques

- Evaluated primarily on classification and NLP benchmark tasks; translation and generation for truly unseen polysynthetic languages are not addressed.
- Community involvement, data sovereignty, and cultural fidelity are not discussed; the paper treats low-resource languages as a technical benchmark challenge.
- The 25 low-resource languages studied are mostly African and Asian languages; no Indigenous North American languages are included.

## Questions & Follow-ups

- Does query alignment improve ICL performance for polysynthetic languages like Mohawk where the structural distance from high-resource exemplar languages is particularly large?
- Can X-ICL with examples from other Iroquoian languages (Cayuga, Seneca, Cherokee) improve Mohawk task performance compared to English-only exemplars?
- Related work: Zebaze et al. (2025) (similarity-based retrieval for MT), Li et al. (2025) (ICL for XLR languages), Nguyen et al. (2024) (linguistically diverse prompts).
