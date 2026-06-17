
# Compression Ratio as Tokenizer Selection Criterion

**Category:** ML Technique
**Data Regime:** Any — the metric is computed on a text sample of the target language; even small samples (hundreds of sentences) are sufficient for ranking
**Applicable Languages:** All languages; especially important for morphologically complex and polysynthetic languages that are underrepresented in standard tokenizer training corpora

## Description

Compression ratio is the most reliable intrinsic (model-free) metric for predicting downstream task performance of a tokenizer for a given language. It measures how efficiently a tokenizer encodes text: specifically, how many bytes of source text are encoded per output token. A tokenizer that achieves high compression (encodes many bytes per token — i.e., produces fewer tokens for the same text) consistently predicts better downstream model performance for that language.

The key properties of this metric:

- **Model-free:** Compression can be computed without training any language model. It requires only the tokenizer and a text sample in the target language.
- **Monotonic relationship:** Downstream performance increases monotonically as compression improves. There are no exceptions in the studied range — more compression is always better.
- **Cheap to compute:** Running a tokenizer over a text corpus takes seconds; training a model takes days or weeks. Compression provides a reliable early signal.
- **Stronger for generation tasks:** The compression-performance correlation is substantially stronger for generative tasks (translation, summarization, question generation) than for classification. This is because generation tasks use the tokenizer more extensively — every output token is a tokenization decision.
- **Stronger for smaller models:** Smaller models benefit more from better compression, presumably because larger models can partly compensate for tokenization inefficiency through sheer capacity.

**Theoretical basis:** Compression-driven tokenization is equivalent to 0-gram language modeling — minimizing sequence length is a crude approximation of minimizing sequence perplexity. A tokenizer that compresses well is already performing a coarse form of language modeling. As Shannon's source coding theorem links compression limits to entropy, and language models aim to reduce entropy, better-compressing tokenizers are better aligned with the language model objective.

**Why this matters for low-resource and polysynthetic languages:** Standard BPE tokenizers (e.g., those trained on large English-dominant corpora like C4) achieve very poor compression on morphologically rich and polysynthetic languages because most words in those languages are rare or unseen in the tokenizer's training corpus. These tokenizers split rare words into many subword tokens or individual characters, producing sequences that are 60–300% longer than the best-supported tokenizer. This directly predicts poor downstream performance — not as a consequence of model architecture, but as a consequence of tokenization inefficiency.

Goldman et al. demonstrate this by training six BPE tokenizers with different amounts of supporting data (1M documents down to 0 documents = character-level) and showing that downstream performance tracks compression monotonically. For Turkish (agglutinative, morphologically complex), the same trends hold as for English, ruling out the English-specific interpretation.

## When to Use

- Before selecting or training a tokenizer for a new low-resource or morphologically complex language
- When comparing multiple candidate tokenizers for the same language (e.g., BPE, Unigram, morphology-aware, character-level)
- When auditing an existing tokenizer to diagnose performance issues
- As the primary intrinsic criterion when fine-tuning a pretrained multilingual model on a new language
- When limited compute budget prevents full downstream evaluation of all tokenizer candidates

## How to Apply

**Step 1 — Collect a text sample in the target language.**

Even a small corpus suffices for ranking tokenizers: 1,000–10,000 sentences is typically enough to compute stable compression ratios. Use the most representative text available for the intended domain (spoken transcriptions, written documents, grammatical example sentences). For zero-resource languages, use whatever exists: grammar book examples, word lists, community-collected sentences.

**Step 2 — Compute token sequence length for each candidate tokenizer.**

For each tokenizer under consideration:
```
total_bytes = sum(len(s.encode('utf-8')) for s in corpus)
total_tokens = sum(len(tokenizer.encode(s)) for s in corpus)
compression_ratio = total_bytes / total_tokens  # bytes per token; higher = better compression
```

Alternatively, measure **relative token length** compared to the best-performing reference tokenizer:
```
relative_length = total_tokens_candidate / total_tokens_reference
# Values > 1.0 mean the candidate produces more tokens = worse compression
```

Goldman et al.'s Table 1 shows that going from a 1M-document tokenizer to a character-level tokenizer inflates text length by +323% for English (9.3M → 39.5M tokens across their development set).

**Step 3 — Rank tokenizers by compression ratio.**

Rank from highest compression (bytes per token) to lowest. The monotonic relationship means this ranking is a reliable proxy for downstream performance ranking. Select the highest-compressing tokenizer that is also computationally feasible.

**Step 4 — Validate on rare and domain-specific words.**

The compression gap between tokenizers is concentrated in rare words (Zipf tail), not frequent words. All tokenizers behave similarly on very frequent words. Explicitly compute compression on domain-specific vocabulary (e.g., for Mohawk: pronominal prefixes, verb stems, aspectual suffixes) to check whether the tokenizer handles the morphologically dense parts of the language.

**Step 5 — Prefer generation task evaluation for final validation.**

If compute budget allows any downstream evaluation, use generation tasks (translation, summarization) rather than classification. The compression-performance correlation is most reliable for generation; classification results can be misleading.

## Pseudocode

```python
from collections import defaultdict

def compute_compression_ratio(tokenizer, corpus):
    """
    corpus: list of strings in the target language
    Returns: bytes per token (higher = better compression)
    """
    total_bytes = sum(len(s.encode('utf-8')) for s in corpus)
    total_tokens = sum(len(tokenizer.encode(s)) for s in corpus)
    return total_bytes / total_tokens


def rank_tokenizers_by_compression(tokenizer_dict, corpus):
    """
    tokenizer_dict: {name: tokenizer_object}
    Returns: list of (name, compression_ratio) sorted descending
    """
    scores = {}
    for name, tok in tokenizer_dict.items():
        scores[name] = compute_compression_ratio(tok, corpus)
    return sorted(scores.items(), key=lambda x: x[1], reverse=True)


def compression_audit_by_frequency(tokenizer, corpus, n_bins=10):
    """
    Diagnose where compression fails: break down tokens-per-word
    by word frequency bucket. Poor compression on rare words predicts
    downstream failure on domain-specific vocabulary.
    """
    word_freq = defaultdict(int)
    word_token_lengths = defaultdict(list)
    
    for sentence in corpus:
        words = sentence.split()
        for word in words:
            word_freq[word] += 1
            token_len = len(tokenizer.encode(word))
            word_token_lengths[word].append(token_len)
    
    # Group by frequency bucket
    freq_bins = bin_words_by_frequency(word_freq, n_bins)
    for bin_label, words in freq_bins.items():
        avg_tokens = mean(mean(word_token_lengths[w]) for w in words)
        print(f"Frequency bin {bin_label}: avg tokens/word = {avg_tokens:.2f}")
    
    # High avg tokens/word in rare-word bins = poor compression for rare vocabulary
    # This directly predicts poor performance on domain-specific content


# Example usage for Mohawk tokenizer selection
mohawk_corpus = load_mohawk_text()  # grammar examples, community text, etc.
candidates = {
    "xlm-roberta-spm": load_tokenizer("xlm-roberta-base"),
    "morpheme-aware-bpe": load_tokenizer("custom_mohawk_morpheme_bpe"),
    "char-level": CharacterTokenizer(),
    "unigram-mohawk": train_unigram_tokenizer(mohawk_corpus, vocab_size=8000)
}

ranking = rank_tokenizers_by_compression(candidates, mohawk_corpus)
print("Tokenizer ranking (best compression first):")
for name, score in ranking:
    print(f"  {name}: {score:.2f} bytes/token")
```

## Evidence

**English experiments (Goldman et al. 2024):**
- 6 BPE tokenizers with support from 1M documents (best) down to 0 documents (character-level = worst)
- 3 model sizes: 1B, 128M, 10M parameters
- 4 downstream tasks: QQP (classification), MultiNLI (classification), XSum (generation), QG-QA (generation)
- Intrinsic result: Going from 1M-doc to 1-doc tokenizer inflates text length by +121%; character-level = +323%
- Spearman correlation between tokenizer support and downstream performance: ρ = 0.943** (128m, XSum), ρ = 1.000** (10m/128m, QG-QA) — statistically significant at p < 0.01 for generation tasks
- Pearson correlation between compression and performance: up to -0.996** (inverse: longer texts → worse performance), -0.988** — near-perfect monotonic relationship
- Classification tasks: correlation weaker but still significant (QQP: ρ = 0.714 for 1B, 0.943** for smaller models)

**Turkish experiments (Goldman et al. 2024):**
- Turkish is agglutinative (morphologically rich, thicker Zipf tail than English)
- 71 words appear ≥10^6 times in Turkish vs. 162 in English — rare words dominate more heavily
- Same trends hold: compression-performance correlation confirmed, ruling out English-specific interpretation
- 10-doc Turkish model: +62% token inflation vs. 1M-doc model; downstream generation performance drops proportionally

**Quantitative thresholds:**
- 1-doc tokenizer (≈ language with almost no tokenizer training data): +121% token inflation for English
- Character-level (= zero tokenizer support): +323% token inflation for English
- Rare words are the locus of divergence: all tokenizers agree on the most frequent ~162 English words; diverge sharply for the remaining 99%+ of vocabulary types

**Implications for polysynthetic languages:** Mohawk and similar languages have even thicker Zipf tails than Turkish (more distinct word forms per lemma due to polysynthetic morphology). A standard BPE tokenizer trained on English-dominant data would perform similarly to or worse than the 1-doc condition in Goldman et al.'s experiments, predicting severe downstream performance degradation.

**Conflict/convergence with related work:**
- Arnett and Bergen (2025) decompose the multilingual performance gap into morphological alignment vs. byte-premium components; Goldman et al. isolate the byte-premium/compression component and provide the strongest direct causal evidence for it.
- Schmidt et al. (2024) argue tokenization involves more than compression; Goldman et al. acknowledge this but demonstrate compression is the most predictive single intrinsic metric.
- Gutierrez-Vasques et al. (2023) previously identified compression as a key intrinsic metric; Goldman et al. provide the most rigorous empirical validation.

## Variations & Configuration

**Vocabulary size interaction:** Goldman et al. fix vocabulary size at 32k tokens. For very low-resource languages where the full 32k vocabulary cannot be filled (e.g., 1-doc tokenizer reaches only 1k–3.7k distinct tokens), compression is further degraded. When training a tokenizer for a new language, choose vocabulary size based on the available corpus — overly large vocabularies are not beneficial when the language corpus is small.

**Unigram vs. BPE:** Goldman et al. study only BPE tokenizers. The theoretical argument applies to any subword tokenization algorithm — Unigram and WordPiece should show similar compression-performance correlations, but this has not been verified for polysynthetic languages.

**Multi-lingual tokenizer reuse:** When reusing a multilingual tokenizer (e.g., mBERT, XLM-R, mT5) for a new language, compute compression ratio on the target language to predict how much performance degradation to expect. A ratio much lower than the tokenizer achieves on its best-supported languages predicts significant downstream penalties.

## Code & Tools

- Goldman et al. do not release code, but the metric is trivial to compute with any HuggingFace tokenizer:
  ```python
  from transformers import AutoTokenizer
  tok = AutoTokenizer.from_pretrained("xlm-roberta-base")
  compression = sum(len(s.encode('utf-8')) for s in corpus) / sum(len(tok(s)['input_ids']) for s in corpus)
  ```
- For training custom BPE tokenizers with controlled support: HuggingFace `tokenizers` library (`BpeTrainer` with `files` parameter to set support corpus)
- For Unigram tokenizer: `sentencepiece` Python package; train with `--model_type=unigram`
- The `byte-premium-data-scaling` technique in this documentation provides the complementary approach for correcting data budgets once a tokenizer is selected

## Strengths & Weaknesses

| Strengths | Weaknesses |
|---|---|
| Model-free and cheap to compute — rank tokenizers before any training | Only tested on English and Turkish; not validated for polysynthetic languages (Mohawk, Inuktitut, Innu-Aimun) |
| Monotonic relationship is robust — no exceptions in studied range | Compression is necessary but not sufficient: very short tokens (e.g., character-level) could theoretically achieve low token counts through over-segmentation, though in practice character-level tokenizers compress less |
| Stronger signal for generation tasks — exactly the tasks most relevant for translation and MT | Classification task correlation is weaker, especially for large models |
| Works across typologically distinct languages (English + Turkish) — not English-specific | Polysynthetic languages have thicker Zipf tails than agglutinative; Goldman et al.'s conclusions may understate the problem for polysynthetic languages |
| Directly actionable: produces a ranked list of tokenizer candidates | Does not account for morphological alignment as a separate dimension (see MorphScore technique) — compression and morphological alignment can diverge |

## References

- Goldman, O., Caciularu, A., Eyal, M., Cao, K., Szpektor, I., & Tsarfaty, R. (2024). Unpacking Tokenization: Evaluating Text Compression and its Correlation with Model Performance. *Findings of ACL 2024*, 2274–2286.
- Gutierrez-Vasques, C., Bentz, C., & Samardzic, T. (2023). Languages through the looking glass of BPE compression. *Computational Linguistics*, 49(4):943–1001.
- Schmidt, C.W. et al. (2024). Tokenization is more than compression. arXiv preprint.
- Arnett, C. & Bergen, B. (2025). Why do LMs underperform morphologically complex languages? — provides complementary evidence distinguishing byte-premium from morphological alignment effects
- Related techniques in this documentation: `byte-premium-data-scaling`, `tokenizer-multidimensional-evaluation`, `tokenizer-model-co-design`, `tokenizer-reuse-audit`

??? note "📋 Self-Review Notes"
    **Reviewed:** 2026-06-11

    **Criterion 1 — Implementable from scratch:** PASS — The five steps are fully concrete: collect a text sample, compute bytes-per-token with the provided one-liner, rank by ratio, validate on rare/domain words, prefer generation tasks for downstream evaluation. The Code & Tools section gives the exact HuggingFace one-liner needed. No paper access is required to run this.

    **Criterion 2 — Empirical results with numbers:** PASS — Goldman et al. results are thoroughly cited: 6 tokenizer variants, 3 model sizes (1B/128M/10M), 4 tasks (QQP, MultiNLI, XSum, QG-QA), Spearman ρ up to 1.000\*\* for generation tasks, Pearson up to -0.996\*\*, token inflation figures (+121% for 1-doc, +323% for character-level). Turkish agglutinative results also included. Quantitative thresholds table is present. Related work (Arnett & Bergen, Schmidt et al., Gutierrez-Vasques) is positioned with brief characterizations.

    **Criterion 3 — Data regime / context clarity:** PASS — "Any — even small samples (hundreds of sentences) are sufficient for ranking" is explicit and justified. The vocabulary size interaction section notes the edge case where very small corpora cannot fill a 32k vocabulary. The Weaknesses table explicitly flags that the method is only validated on English and Turkish, not polysynthetic languages, and that the polysynthetic Zipf tail problem may be understated.

    **Criterion 4 — Pseudocode completeness:** PASS — Three functions are provided with full implementations: `compute_compression_ratio`, `rank_tokenizers_by_compression`, and `compression_audit_by_frequency`. The frequency-audit function calls `bin_words_by_frequency` without defining it, but this is a minor gap given the rest is complete. The example usage block for Mohawk is illustrative and concrete.

    **Criterion 5 — Failure modes:** PARTIAL — The Weaknesses table identifies key limitations: English/Turkish-only validation, unverified for polysynthetic languages, weaker correlation for classification tasks and large models, and the compression-vs-morphological-alignment divergence. However, the doc does not address a practical failure mode: what happens when the highest-compressing tokenizer is not computationally feasible (vocabulary collision, memory cost) or when two tokenizers have very similar compression ratios. A brief note on tie-breaking or feasibility constraints would strengthen this criterion.

    **Overall:** Very strong doc. The one gap is failure modes around practical tie-breaking and feasibility limits when compression ratios are close. The `bin_words_by_frequency` placeholder in the pseudocode is a minor incompleteness. Both are easily remedied with short additions.

