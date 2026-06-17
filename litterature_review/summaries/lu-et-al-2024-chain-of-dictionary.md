# Chain-of-Dictionary Prompting Elicits Translation in Large Language Models

**Authors:** Hongyuan Lu, Haoran Yang, Haoyang Huang, Dongdong Zhang, Wai Lam, Furu Wei
**Year:** 2024
**Venue:** Preprint (The Chinese University of Hong Kong, Microsoft Corporation)
**Link:** [github.com/HongyuanLuke/Chain-of-Dictionary](https://github.com/HongyuanLuke/Chain-of-Dictionary)

---

## Core Argument

A bilingual dictionary between source and target language helps LLMs translate low-resource languages, but a chained multilingual dictionary — providing word meanings in multiple intermediate high-resource languages — provides substantially more information and larger gains. The CoD (Chain-of-Dictionary) framework operationalizes this insight, achieving up to 13× chrF++ improvements and outperforming both zero-shot and few-shot ICL baselines for low-resource language translation.

## Key Concepts

- **Chain-of-Dictionary (CoD):** A prompting framework that augments the LLM with a chain of multilingual dictionary entries for a subset of input words — expressing each word's meaning across multiple languages rather than just the source-target pair.
- **Chained multilingual dictionary:** For each word in the input sentence, the prompt provides translations in a chain of languages (e.g., English → French → Spanish → Serbian), giving the model multiple alignment signals rather than a single bilingual mapping.
- **Low-resource translation baseline:** The paper demonstrates that ChatGPT and InstructGPT have meaningful room for improvement on many low-resource pairs, even those assumed to be "supported."
- **FLORES-200 full devtest:** The evaluation benchmark; CoD is tested across many language directions, with the largest gains on truly low-resource pairs (e.g., English to Serbian in Cyrillic script: 3.08 → 42.63 chrF++).

## Main Findings

- CoD achieves gains of up to 13× chrF++ over zero-shot baselines for low-resource translation; it surpasses NLLB 3.3B (a dedicated translation system) for ChatGPT on many low-resource pairs.
- Chaining through multiple languages is essential — a single bilingual dictionary provides smaller gains than a multilingual chain, confirming the value of multiple alignment signals.
- CoD outperforms few-shot ICL for low-resource languages, providing a practical alternative when parallel sentence examples are unavailable or scarce.
- The method is most effective for languages where the model has some lexical knowledge but struggles to activate it for translation — the dictionary chain helps retrieve and align that knowledge.
- For non-Latin script languages (e.g., Cyrillic Serbian), CoD provides particularly dramatic gains by bridging the script gap through intermediate languages.

## Relevance to Indigenous AI

CoD is directly applicable to Mohawk translation: a multilingual dictionary chain could be constructed from Mohawk to English via intermediate languages (French, or related Indigenous languages if dictionaries exist), providing the model with multiple alignment anchors for each Mohawk word. This approach requires no parallel corpora — only a lexicon or dictionary, which is more feasible to develop with community linguist involvement than full parallel data. The finding that CoD outperforms few-shot ICL for low-resource languages is particularly valuable for the early stages of the project before parallel Mohawk data is available. The large gains on Cyrillic Serbian (non-Latin script) suggest CoD would also be valuable for any community that later works with a non-Latin script.

## Limitations & Critiques

- Dictionary coverage is critical — if a Mohawk word has no entry in the dictionary, the CoD benefit disappears; polysynthetic languages with rich morphology have sparse dictionary coverage for inflected forms.
- The chain relies on having bilingual dictionaries for intermediate languages; for Mohawk, high-quality bilingual dictionaries are limited.
- Does not address community consent or data sovereignty over the dictionary resources used.

## Questions & Follow-ups

- For Mohawk, which intermediate languages in the dictionary chain would be most informative — French (colonial contact language), English, or other Iroquoian languages (Cayuga, Seneca)?
- Can CoD be combined with morphological decomposition to address the sparse dictionary coverage problem for polysynthetic Mohawk words (decompose → look up morphemes → chain)?
- Related work: Pei et al. (2025) (dictionaries vs. grammar books for Manchu ICL MT), Tanzer et al. (2024) (grammar book prompting), Guo et al. (2024) (TALENT textbook prompting).
