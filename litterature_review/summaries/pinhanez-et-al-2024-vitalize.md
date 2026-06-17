# Harnessing the Power of AI to Vitalize Endangered Indigenous Languages: Technologies and Experiences

**Authors:** Claudio Pinhanez, Paulo Cavalin, Luciana Storto, Thomas Finbow, Alexander Cobbinah, et al.
**Year:** 2024
**Venue:** arXiv preprint (IBM Research Brazil + University of São Paulo, July 2024)

---

## Core Argument

Fine-tuning state-of-the-art LLMs with tiny amounts of community-provided text — rather than large-scale pretraining — is a practical and promising path for creating useful language tools for endangered Indigenous languages. Drawing on 2022–2024 field work with Brazilian Indigenous communities (primarily Nheengatu and Guarani Mbya), the paper proposes a community engagement-driven AI development cycle, reports encouraging results on MT fine-tuning, and introduces Indigenous Language Models (ILMs) as a replicable framework for spell-checkers, predictive text, and similar tools.

## Key Concepts

- **Fine-tuning with tiny data:** Modern LLMs can be fine-tuned for translation, spell-checking, and text prediction with surprisingly small amounts of data in a target language — partially because the base model provides strong multilingual priors, and contamination errors are absent for truly endangered languages (which guarantees clean attribution of fine-tuning effects).
- **Community engagement development cycle:** An alternative to standard academic/industrial software development cycles: begin with community needs assessment, iterate on prototypes with community users, measure success by actual adoption and community benefit, not publication metrics.
- **Indigenous Language Models (ILMs):** Domain-specific, small language models fine-tuned on Indigenous language text to power spell-checkers, next-word predictors, and writing assistants. Scalable because the same approach can be applied across different endangered languages with modest compute.
- **Writing tools for young people:** The paper targets teenagers and young adults — the generation most at risk of language attrition — with tools (spell-checkers, writing assistants) that make using the language in digital contexts easier and more appealing.
- **Orality vs. text:** Most endangered Indigenous languages are primarily oral; creating writing tools is important precisely because it strengthens literacy, which in turn supports oral language maintenance. Learning to read/write supports speaking.
- **Mohawk mentioned directly:** The paper situates Mohawk (~3,900 speakers) in the 1,000–10,000 speaker range — a group with enough written data for digital text tools to be feasible but with clear signs of endangerment.

## Main Findings

- Fine-tuning SOTA MT systems (e.g., NLLB-200) with small amounts of Nheengatu-Portuguese parallel data produces high-quality translations — substantially better than zero-shot performance of the base model.
- ILMs built on small Indigenous language corpora can power functional spell-checkers and next-word predictors; these have been deployed and are being used by community members in Brazil.
- The community engagement cycle (needs → prototype → community testing → iteration) consistently surfaces requirements that would not be captured by standard user research or linguistic analysis alone.
- Prompt engineering and RAG do not help much for truly endangered languages, because base LLMs have essentially no prior knowledge of these languages; fine-tuning is necessary.
- Many endangered languages (particularly in Brazil) have so few speakers that even documentation efforts are at risk: many languages are disappearing without any digital traces.

## Relevance to Indigenous AI

This paper is the closest existing published work to what the IndigenousAI project is attempting. Key parallels:
- The community engagement development cycle mirrors the project's approach (though the IndigenousAI project's Six Nations context involves more complex sovereignty considerations than the IBM/USP relationship with Brazilian communities).
- The fine-tuning-with-tiny-data finding is directly relevant: even with small Mohawk text collections (pedagogical materials, Kuhn et al.'s WordWeaver data, available texts), fine-tuning may produce functional writing and translation tools.
- The ILM framework (fine-tuned small model for spell-check, predictive text) is a practical near-term deliverable for Mohawk that does not require frontier-scale compute.
- Mohawk at ~3,900 speakers is explicitly placed in the "target range" for this approach.
- The orality-literacy connection is directly applicable to Mohawk, where strengthening writing supports the overall goal of language vitalization.

## Limitations & Critiques

- The Brazilian Indigenous context (FUNAI government oversight, different legal framework, Brazilian Portuguese as the dominant language rather than English/French) differs from the Six Nations/Mohawk context in important governance and political dimensions.
- The paper focuses on text tools; speech technology (ASR, TTS) is acknowledged as important but largely deferred.
- Fine-tuning results are reported for Nheengatu and Guarani Mbya; how the approach generalizes to polysynthetic languages (like Mohawk, vs. the relatively analytic Nheengatu) is not addressed.
- Community "adoption" is mentioned as a success criterion but is not rigorously measured or defined.

## Questions & Follow-ups

- How much Mohawk text is currently available (digitized pedagogical materials, online resources, NRC Canada data) to support fine-tuning an ILM? Is it sufficient to start?
- What Mohawk community members or institutions (Onkwawenna Kentyohkwa, Kahnawà:ke language program, etc.) would be appropriate partners for a community engagement development cycle?
- Related work: Kuhn et al. (2020) on NRC Canada ILT project (existing Mohawk NLP infrastructure); Pinhanez and Wornyo (2025) on co-development ethics; Brinklow (2021) on anti-colonial principles; McGiff and Nikolov (2025) on data scarcity strategies for LRL generative modelling.
