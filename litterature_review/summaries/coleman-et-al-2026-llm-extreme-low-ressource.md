# Comparing LLM-Based Translation Approaches for Extremely Low-Resource Languages

**Authors:** Jared Coleman, Ruben Rosales, Kira Toal, Diego Cuadros, Nicholas Leeds, Bhaskar Krishnamachari, Khalil Iskarous
**Year:** 2026
**Venue:** Preprint / Conference proceedings (2026)

---

## Core Argument

For critically endangered Indigenous languages with no publicly available parallel corpora, a hybrid LLM–Rule-Based Machine Translation (LLM-RBMT) pipeline is a viable translation approach that guarantees grammatical correctness while maintaining flexibility. The paper presents the first systematic comparison of five LLM-based translation approaches on Owens Valley Paiute (OVP), achieving the first English-to-OVP translator.

## Key Concepts

- **Owens Valley Paiute (OVP):** A critically endangered Indigenous language with no public parallel corpora and only a handful of fluent speakers; used as the test case throughout the paper.
- **LLM-RBMT (Pipeline Translator):** A hybrid approach where an LLM decomposes complex English sentences into simpler translatable units, which are then translated via rule-based grammar tools; results are validated through back-translation.
- **Builder:** A more autonomous LLM-RBMT variant that generates its own sentence-building tools rather than using pre-authored ones.
- **RAG (Retrieval-Augmented Generation):** Retrieves relevant linguistic examples to augment the LLM translation prompt.
- **Back-translation evaluation:** Translating a produced output back into English to assess semantic fidelity in the absence of reference translations.

## Main Findings

- The Pipeline Translator (LLM-RBMT) guarantees grammatical correctness for OVP through grammar-aware tooling, outperforming prompt-only and RAG approaches on grammatical validity.
- Five approaches were compared: Pipeline, Builder, Instructions (prompt-only), RAG, and Fine-tuned LLM; each has distinct trade-offs in grammatical fidelity, semantic coverage, and resource requirements.
- The modular, redesigned Pipeline architecture supports more complex sentence structures than the original system and improves transparency through structured validation steps.
- BERTScore and COMET metrics are used alongside back-translation to evaluate outputs; no human reference translations are available for OVP, highlighting the evaluation challenge for no-resource languages.

## Relevance to Indigenous AI

This paper is among the most directly applicable in the corpus: it addresses an Indigenous language in the same resource situation as Mohawk (no parallel corpora, few fluent speakers), and demonstrates that LLM-RBMT pipelines can produce a working translator. The back-translation evaluation method provides a practical workaround for the absence of reference translations. The modular pipeline architecture is a candidate design for a Mohawk translation tool, especially given the availability of grammar documentation for Mohawk. The paper also surfaces the ethical stakes of building technologies for critically endangered languages.

## Limitations & Critiques

- Evaluation relies heavily on back-translation and automated metrics; no community evaluation of translation quality is reported.
- The paper does not address community consent, data sovereignty, or Indigenous language speaker involvement in the system design.
- OVP grammatical tools were authored externally; the paper does not discuss how such tools would be constructed for a new language like Mohawk.

## Questions & Follow-ups

- How would the LLM-RBMT pipeline perform on Mohawk, given its polysynthetic morphology and evidentiality marking — properties that require richer grammar-aware tooling than OVP?
- What role could Mohawk community linguists play in authoring or validating the rule-based grammar components of such a pipeline?
- Related work: Tanzer et al. (2024), Aycock et al. (2025), Zhang et al. (2022) (Cherokee NLP roadmap).
