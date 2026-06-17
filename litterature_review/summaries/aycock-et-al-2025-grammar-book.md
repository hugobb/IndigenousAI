# Can LLMs Really Learn to Translate A Low-Resource Language from One Grammar Book?

**Authors:** Seth Aycock, David Stap, Di Wu, Christof Monz, Khalil Sima'an
**Year:** 2025
**Venue:** ICLR 2025

---

## Core Argument

Prompting long-context LLMs with a grammar book enables some translation ability for extremely low-resource (XLR) languages, but the improvement stems almost entirely from parallel sentence examples embedded in the book — not from grammatical explanations. A fine-tuned encoder-decoder model trained on those same parallel examples can match or exceed grammar-book LLM performance, suggesting the value lies in the data, not the in-context grammar learning.

## Key Concepts

- **Extremely low-resource (XLR) languages:** Languages with essentially no available parallel corpora; the paper focuses on Kalamang, Nepali, and Guarani.
- **Machine Translation from One Book (MToB):** The paradigm of using a single grammar book as the sole in-context resource for an LLM translator.
- **Typological feature prompt:** A structured prompt encoding cross-linguistic typological properties of a language, shown to improve linguistic task performance on XLR languages.
- **Parallel examples vs. grammatical descriptions:** The paper distinguishes between sentence-level parallel pairs (W+S condition) and explicit grammatical explanations (Gs, Gm, Gl conditions), finding the former drives nearly all translation gains.

## Main Findings

- Almost all translation improvement from grammar-book prompting comes from parallel sentence examples, not grammatical explanations.
- A fine-tuned encoder-decoder model trained on the same parallel data achieves performance comparable to an LLM prompted with the full grammar book.
- Grammar books and typological feature prompts do improve performance on linguistically relevant tasks (grammaticality judgment, gloss prediction) — suggesting a task-appropriate data split.
- Results hold across Kalamang (XLR, unseen by LLMs), Nepali, and Guarani (seen low-resource languages).

## Relevance to Indigenous AI

For Mohawk, this paper implies that parallel data collection — even at small scale — is far more valuable than providing LLMs with grammatical descriptions or a grammar book. It reframes the value of linguistic resources: grammar books are useful for linguistic tasks (morphological analysis, grammaticality) but not for translation. The finding that fine-tuned encoder-decoder models match grammar-book LLMs also suggests that compute-efficient, community-deployable models are viable once parallel data exists. The typological feature prompt approach may be worth exploring for Mohawk's polysynthetic properties.

## Limitations & Critiques

- The XLR language studied (Kalamang) is not polysynthetic in the same way as Mohawk, limiting transferability for complex morphological cases.
- The study does not address tokenization challenges specific to morphologically complex or non-Latin-script languages.
- Does not engage with data sovereignty or community consent — parallel data collection is treated as a purely technical data-gathering problem.

## Questions & Follow-ups

- What is the minimum amount of parallel data needed for fine-tuned encoder-decoder models to outperform grammar-book LLM prompting for Mohawk?
- Can typological feature prompts encoding Mohawk's polysynthetic, verb-centric, and evidentiality properties improve grammaticality judgment or morphological analysis tasks?
- Related work: Tanzer et al. (2024) (original grammar-book paper), Pei et al. (2025) (Manchu in-context MT case study).
