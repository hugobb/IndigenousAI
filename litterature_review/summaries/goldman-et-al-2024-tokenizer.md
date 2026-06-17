# Tokenizer Compression as an Intrinsic Indicator of Downstream Performance

**Authors:** Goldman et al.
**Year:** 2024
**Venue:** ACL 2024 Findings

---

## Core Argument

Among the many proposed intrinsic metrics for evaluating tokenizer quality, compression ratio — how many bytes per token a tokenizer achieves for a given language — is the most reliable predictor of downstream task performance. The authors demonstrate a monotonic relationship: higher compression (fewer tokens per byte) consistently predicts better model performance for that language, particularly on generative tasks and for smaller models. This gives practitioners a cheap, model-free way to evaluate tokenizer suitability before committing to expensive pre-training or fine-tuning.

## Key Concepts

- **Compression ratio:** The number of bytes encoded per token. A tokenizer that achieves high compression for a language (many bytes per token, i.e., the tokenizer's vocabulary captures the language's morphology efficiently) correlates with better downstream performance for that language.
- **Intrinsic vs. extrinsic metrics:** Intrinsic metrics evaluate a tokenizer without running a full model training; extrinsic metrics require downstream task evaluation. Compression is the most useful intrinsic metric because it is model-free, cheap to compute, and predictive.
- **Monotonic relationship:** The relationship between compression support and downstream performance is monotonic — more compression consistently helps, without exceptions in the studied languages, making it a reliable ordering criterion.
- **Generative vs. classification tasks:** The compression-performance correlation is stronger for generation tasks (translation, summarization, text generation) than for classification. For classification, the benefit is smaller and less consistent.
- **Smaller models benefit more:** The compression advantage is amplified for smaller models, presumably because larger models can compensate for tokenization inefficiency through sheer capacity.
- **Byte-premium:** Under-represented languages pay a "byte-premium" — their text takes more tokens to represent, consuming proportionally more of the model's context window and effectively giving them less compute per character. Compression is a proxy for how much byte-premium a language pays.

## Main Findings

- Across multiple languages and tasks, compression ratio is the single most predictive intrinsic tokenizer metric for downstream performance.
- The monotonic relationship holds across typologically diverse languages; tested languages include Turkish, which has agglutinative morphology similar in some respects to polysynthetic languages.
- The correlation is strongest for: (1) generation tasks over classification, (2) smaller models, and (3) languages that are morphologically complex or underrepresented in standard tokenizer training data.
- Other commonly proposed intrinsic metrics (vocabulary overlap, fertility) are less predictive than compression; compression should be the primary criterion when comparing tokenizers for a new language.
- The result has a practical implication: for low-resource or morphologically complex languages, choosing or training a tokenizer that achieves better compression is the highest-leverage tokenization decision.

## Relevance to Indigenous AI

This paper provides the most direct practical guidance for tokenizer selection for Mohawk. If compression is the reliable predictor of downstream performance, then evaluating existing tokenizers (SentencePiece BPE, Unigram, character-level, morphology-aware) on their compression of Mohawk text is the correct first step before any downstream fine-tuning experiment. Mohawk's polysynthetic morphology means that standard BPE tokenizers (trained primarily on English) will achieve very poor compression — most Mohawk words will be split into many subword tokens, paying a high byte-premium. This directly predicts poor downstream performance for any model using such a tokenizer. The finding that smaller models benefit more from better compression is relevant if the project uses efficient small models rather than frontier LLMs. Related work: Arnett and Bergen (2025) tested the compression hypothesis as one of three explanations for the multilingual performance gap; Goldman et al. provide the strongest direct evidence that compression is causal, not merely correlational.

## Limitations & Critiques

- The study tests languages with available training data; Mohawk has almost no digital text, making it impossible to directly evaluate compression-performance correlation for Mohawk without first creating an evaluation benchmark.
- Compression ratio is a necessary but not sufficient condition: a tokenizer could achieve high compression through bad segmentation (e.g., always using character-level tokens for rare words) that actually hurts downstream performance through other mechanisms.
- The paper does not test polysynthetic languages specifically — Turkish is agglutinative but not polysynthetic; the relationship for truly polysynthetic languages (Mohawk, Inuktitut, Innu-Aimun) remains to be verified.

## Questions & Follow-ups

- Can we compute compression ratios for Mohawk across available tokenizers using the limited existing Mohawk text corpus? This would immediately rank tokenizer options.
- Does the monotonic relationship hold for polysynthetic languages, or does the word/morpheme boundary problem require a different analysis?
- Related work: Arnett and Bergen (2025) on morphological alignment vs. byte-premium; Schmidt et al. (2024) on tokenization survey; Arnett et al. (2025) on MorphScore; Vasques et al. (2023) on BPE compression.
