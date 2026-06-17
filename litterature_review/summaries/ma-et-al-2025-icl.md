# Exploring the Role of Transliteration in In-Context Learning for Low-Resource Languages Written in Non-Latin Scripts

**Authors:** Chunlan Ma, Yihong Liu, Haotian Ye, Hinrich Schütze
**Year:** 2025
**Venue:** Preprint (Center for Information and Language Processing, LMU Munich; Munich Center for Machine Learning)

---

## Core Argument

For low-resource languages written in non-Latin scripts, transliterating text into Latin script before presenting it to LLMs improves ICL performance — particularly for sequential labeling tasks like NER. The improvement occurs because Latin script is far better represented in LLM pretraining data, reducing tokenization fragmentation and improving the model's ability to process the text. Effectiveness varies by task type and model size.

## Key Concepts

- **Transliteration:** Converting text from its native script into Latin script while preserving pronunciation; distinct from translation — the meaning is unchanged, only the script representation shifts.
- **SCRIPT{Orig}:** The baseline prompt where text is presented in its original (non-Latin) script.
- **SCRIPT{Latn}:** The proposed variant where text is transliterated to Latin script before being placed in the prompt.
- **SCRIPT{Combined}:** Both original and transliterated text are provided, allowing the model to leverage both representations.
- **Tokenization fragmentation:** The problem where non-Latin scripts are broken into many byte-level tokens by LLM tokenizers, reducing the model's effective context and degrading performance.

## Main Findings

- All tested models benefit from Latin transliteration for sequential labeling (NER), with improvements of up to 25% F1 across LLaMA-7B, Mistral-7B, BLOOM-7B, and BLOOM-3B.
- SCRIPT{Latn} and SCRIPT{Combined} consistently outperform SCRIPT{Orig} for NER; results for text classification are more mixed.
- Effectiveness varies by model size: larger models tend to benefit more from transliteration, possibly because they have greater capacity to leverage the improved tokenization.
- The combined script (SCRIPT{Combined}) is most robust, particularly when the model already has some script-specific knowledge.

## Relevance to Indigenous AI

While Mohawk uses the Latin script (making direct transliteration not applicable), this paper is relevant for two reasons. First, it demonstrates that tokenization quality is a primary driver of LLM performance on low-resource languages — a finding that directly motivates training a Mohawk-specific tokenizer rather than relying on existing multilingual tokenizers that may segment Mohawk morphemes poorly. Second, if the project later engages with other Indigenous communities whose languages use non-Latin scripts (e.g., Cherokee syllabary), transliteration is a practical and immediately implementable improvement that requires no additional training data.

## Limitations & Critiques

- Transliteration is a workaround for a tokenization problem, not a solution to it; training a proper tokenizer for the target language would be more principled.
- Transliteration may introduce information loss for tonal languages or languages with phonemic distinctions that Latin script cannot capture.
- Not tested on North American Indigenous languages; polysynthetic morphology effects on transliteration are not studied.

## Questions & Follow-ups

- What is the tokenization fragmentation rate for Mohawk in current LLMs (e.g., Llama, Mistral), and how does it compare to the baseline rates seen in this paper for non-Latin script languages?
- Would training a Mohawk-specific tokenizer (as suggested by Zhang et al. 2022 for Cherokee) achieve better results than transliteration workarounds?
- Related work: Li et al. (2025) (ICL for unseen-script XLR languages), Zhang et al. (2022) (Cherokee NLP, tokenization challenges), Haddow et al. (2022) (survey noting subword tokenization failures for morphologically complex languages).
