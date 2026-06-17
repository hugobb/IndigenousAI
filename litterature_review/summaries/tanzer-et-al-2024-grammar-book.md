# A Grammar Book as the Prompt: Machine Translation from One Book

**Authors:** Tanzer et al.
**Year:** 2024
**Venue:** ICLR 2024

---

## Core Argument

For extremely low-resource languages with no parallel corpora, a single grammar book can serve as an in-context resource for a long-context LLM to perform meaningful machine translation. The paper demonstrates this on Kalamang (a Papuan language with fewer than 200 speakers), showing that combining grammar words, parallel sentence examples, and grammar snippets enables translation quality that exceeds zero-shot baselines significantly.

## Key Concepts

- **Kalamang (kgv):** An extremely low-resource Papuan language with fewer than 200 speakers; used as the primary test language because it has effectively zero representation in LLM pretraining data.
- **Grammar book prompting conditions:** The paper tests combinations of Words (W), parallel Sentences (S), and Grammar snippets (Gs — sentence-level, Gm — morphological, Gl — longer passages) as in-context resources.
- **Long-context LLM:** Claude 2 is used as the primary model; its extended context window enables inclusion of large amounts of in-context grammatical material.
- **W+S condition:** The combination of retrieved vocabulary entries and parallel sentence examples; shown to produce the best translation quality across most conditions.

## Main Findings

- Grammar-book prompting (W+S+Gs conditions) achieves substantially better translation than zero-shot prompting for Kalamang.
- The W+S (words + sentences) condition produces the best overall translation quality; adding grammatical snippets (Gm, Gl) sometimes helps for specific constructions but introduces distractions.
- Qualitative analysis shows that retrieved word lists are often sufficient to guess translation meaning, while extra grammatical information sometimes improves faithfulness but also produces awkward outputs.
- English-to-Kalamang translation is harder than Kalamang-to-English; the model struggles with correct morphological production in the target language.
- The approach is the first to demonstrate meaningful MT for a language not seen in LLM pretraining, using only a single grammar book.

## Relevance to Indigenous AI

This paper is foundational for the project: it establishes the proof-of-concept that grammar-book-based translation is possible for languages unseen by LLMs, and Kalamang's resource profile (one grammar book, small parallel corpus, very few speakers) is analogous to Mohawk's. The finding that W+S conditions outperform pure grammar-based approaches aligns with subsequent findings from Aycock et al. (2025) and Pei et al. (2025). For Mohawk, existing grammar resources (e.g., Marianne Mithun's documentation) and any available parallel text could be combined as in-context resources. The failure mode on English-to-Kalamang (difficulty producing correct morphology) is especially relevant given Mohawk's complex verbal morphology.

## Limitations & Critiques

- Translation quality remains far below usable levels for practical community deployment; the paper establishes feasibility, not fluency.
- The approach requires very long context windows, which limits access to smaller or locally-deployable models.
- No community evaluation is conducted; translation quality is assessed by external researchers, not Kalamang speakers.
- Does not address data sovereignty or consent for the grammar materials used.

## Questions & Follow-ups

- What Mohawk grammar and dictionary resources exist that could be compiled into a grammar-book-style prompt? (Mithun 1984; Kanien'kéha language documentation?)
- Given Mohawk's more complex verb morphology than Kalamang, would the W+S condition still be sufficient or would grammar snippets covering pronominal prefixes and tense/aspect suffixes be necessary?
- Related work: Aycock et al. (2025) (investigates why grammar-book prompting works), Pei et al. (2025) (Manchu ICL MT case study).
