# Shortcomings of LLMs for Low-Resource Translation: Retrieval and Understanding are Both the Problem

**Authors:** Sara Court, Micha Elsner
**Year:** 2024
**Venue:** Proceedings of the Ninth Conference on Machine Translation (WMT 2024)

---

## Core Argument

LLMs can utilize in-context prompt information for zero-resource translation of endangered languages, but improvements with model size primarily reflect prior language exposure during pretraining rather than improved in-context learning. Both retrieval quality and the model's ability to use retrieved information are bottlenecks — and using grammatical descriptions in the prompt consistently fails to improve, and often harms, translation quality.

## Key Concepts

- **Southern Quechua:** A Peruvian endangered Indigenous language used as the source language; translated into Spanish (high-resource target).
- **NLP Gap:** The disparity between academic and commercial NLP priorities and the needs of community-led language revitalization efforts (term from Gessler, 2022).
- **MQM error typology:** Modified Multidimensional Quality Metrics framework used for fine-grained human annotation of translation errors by type (substitution, omission, TAM errors, etc.).
- **Morpheme-level translations:** Word/morpheme dictionary entries; consistently the most helpful context type for LLM translation.
- **Automated retrieval:** BM25 or embedding-based retrieval of relevant dictionary/corpus entries; shown to have variable effects, most evident for morpheme prompts and weaker models.

## Main Findings

- Morpheme and word-level translations reliably improve LLM translation outputs; grammar descriptions have null or negative effects, replicating earlier findings on other language pairs.
- Translation quality improvements with model size (GPT-3.5 → GPT-4o) primarily reflect prior Quechua exposure during pretraining, not better in-context learning ability.
- Automated retrieval quality significantly affects results, particularly for morpheme prompts and lower-baseline models; manual vs. automated retrieval differences expose retrieval as a separate bottleneck.
- Human error annotation (MQM) aligns with automatic metrics (BLEURT), and reveals substitution, TAM (tense/aspect/mood), and omission errors as the most common failure modes.
- The paper raises ethical concerns: LLM-based methods may overstate feasibility for communities, and community materials used as training context may raise consent and sovereignty issues.

## Relevance to Indigenous AI

Southern Quechua is an endangered Indigenous language with community-driven pedagogical materials, making this paper directly analogous to the Mohawk situation. The finding that grammatical descriptions are ineffective for in-context translation (while morpheme glosses help) has direct implications for how to structure Mohawk translation prompts. The ethical discussion — particularly around the risks of overstating feasibility and the ownership of community-produced linguistic materials — is essential reading for the project's methodology. The MQM error annotation methodology could be adapted for evaluating Mohawk translation outputs with community linguist involvement.

## Limitations & Critiques

- The study uses a Peruvian variety of Southern Quechua that, while endangered, has more existing resources (dictionaries, grammar lessons, parallel corpus) than Mohawk; resource abundance may influence conclusions.
- The ethical discussion, while present, is not fully developed into a methodology — concerns are raised but not resolved.
- Does not involve community members in evaluation or system design.

## Questions & Follow-ups

- If grammatical descriptions are consistently unhelpful for in-context translation across Quechua, Kalamang, and Manchu, does this also hold for polysynthetic languages where morphological decomposition is especially important?
- How can the MQM error typology be adapted to capture culturally or linguistically specific error types relevant to Mohawk (e.g., incorrect evidentiality, wrong animacy class)?
- Related work: Tanzer et al. (2024), Aycock et al. (2025), Pei et al. (2025), Zhang et al. (2022).
