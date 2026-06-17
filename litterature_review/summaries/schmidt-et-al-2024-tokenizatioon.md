# Tokenization Is More Than Compression

**Authors:** Craig W. Schmidt, Varshini Reddy, Haoran Zhang, Alec Alameddine, Omri Uzan, Yuval Pinter, Chris Tanner
**Year:** 2024
**Venue:** EMNLP 2024 (Kensho Technologies, Harvard, Ben-Gurion University, MIT)

---

## Core Argument

The common assumption that BPE is effective because it compresses text into fewer tokens is wrong. A novel tokenizer (PathPiece) specifically designed to minimize token count consistently underperforms BPE, despite achieving higher compression. Effective tokenization depends on pre-tokenization rules and vocabulary construction choices, not token count alone. This challenges the Goldman et al. (2024) finding that compression predicts downstream performance and reveals that tokenization is a multi-dimensional design space.

## Key Concepts

- **PathPiece:** A new tokenizer that finds the minimum-token-count segmentation for a given vocabulary via dynamic programming. Designed specifically to test the hypothesis that fewer tokens = better performance. The hypothesis is refuted.
- **Three-stage tokenization framework:** (1) Pre-tokenization: rules for splitting text before vocabulary construction (whitespace, digit, etc.); (2) Vocabulary construction: the core algorithm (BPE, WordPiece, Unigram, SaGe); (3) Segmentation: given a vocabulary, how to split a new document. Each stage has independent design choices.
- **Pre-tokenization importance:** Whether digits are always individual tokens, how whitespace is handled, and where word boundaries are enforced have substantial effects on downstream performance — effects comparable to or larger than the choice of vocabulary construction algorithm.
- **BPE initialization advantage:** Even when non-BPE vocabulary construction algorithms are used, initializing from a BPE vocabulary outperforms random initialization — BPE's merge order provides a useful inductive bias.
- **CTC (corpus token count):** The total number of tokens used to encode a corpus; lower CTC = higher compression. PathPiece minimizes CTC; BPE does not, yet BPE generally outperforms PathPiece.
- **Contradiction with Goldman et al. (2024):** Goldman et al. found that compression correlates with downstream performance across models; Schmidt et al. show that within a vocabulary, minimizing token count further (via PathPiece) does not improve performance. These findings are compatible but suggest the compression-performance relationship is more nuanced than a simple monotonic rule.

## Main Findings

- Minimizing token count (via PathPiece) does NOT improve downstream performance; the compression hypothesis is refuted as the primary explanation for BPE's effectiveness.
- Pre-tokenization choices (especially digit tokenization and whitespace handling) substantially affect downstream performance, often more than vocabulary construction algorithm choice.
- BPE vocabulary initialization is beneficial even when other segmentation algorithms are used — the inductive bias from BPE's frequency-based merges improves outcomes.
- 64 language models trained (350M to 2.4B parameters) support these conclusions with sufficient statistical power.
- The results suggest that what makes tokenization effective is a combination of vocabulary coherence, pre-tokenization alignment with linguistic structure, and inductive biases from training — not compression ratio per se.

## Relevance to Indigenous AI

This paper partially complicates the Goldman et al. (2024) finding that compression predicts downstream performance. The resolution is that compression is a useful predictor *across* tokenizers (different vocabularies), but within a vocabulary, minimizing tokens further does not help. For Mohawk, the implication is: (1) choose a tokenizer that achieves good compression for Mohawk (i.e., one whose vocabulary is aligned with Mohawk morpheme structure), but (2) don't chase minimum-token-count as an objective within that tokenizer. The pre-tokenization finding is particularly relevant: standard pre-tokenization rules (whitespace splitting, digit separation) were designed for English and may be inappropriate for Mohawk, where word boundaries and morpheme boundaries have different relationships. The project should carefully evaluate pre-tokenization choices for Mohawk before training any models.

## Limitations & Critiques

- All experiments are on English (or English-dominated multilingual) models; the three-stage framework's behavior for polysynthetic languages with different word structure is not evaluated.
- The contradiction with Goldman et al. is presented as a nuance rather than a direct replication failure; the two papers are difficult to fully reconcile because they vary different dimensions.
- PathPiece is a research tool, not a production tokenizer; its behavior for non-English scripts or morphologically rich languages is not tested.

## Questions & Follow-ups

- What pre-tokenization rules are appropriate for Mohawk? Should morpheme boundaries be encoded in the pre-tokenization stage?
- Is SaGe (context-sensitive tokenizer) worth evaluating for Mohawk, given that it incorporates contextual information into vocabulary construction?
- Related work: Goldman et al. (2024) on compression as performance predictor (the paper this most directly challenges); Arnett and Bergen (2025) on morphological alignment; Vasques et al. (2023) on BPE compression and typology; Poelman et al. (2025) on confounding factors; Arnett et al. (2025) on MorphScore.
