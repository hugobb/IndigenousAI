
# Byte-Premium Data Scaling

**Category:** ML Technique
**Data Regime:** any (especially relevant when comparing data budgets across languages)
**Applicable Languages:** all; most impactful for languages with non-Latin scripts or morphologically long words

## Description

Byte-premium data scaling is a technique for estimating and correcting for encoding size disparities between languages when setting training data budgets. The core idea is that a "nominally equal" data budget (same number of tokens or bytes) represents different amounts of linguistic information across languages, so training data should be scaled according to each language's byte premium relative to a reference language (usually English).

The **byte premium** of language L relative to English is the ratio of bytes required to encode the same content in L versus in English. It arises from two sources:
1. **Script encoding:** Non-Latin characters typically require more bytes per character in UTF-8. Latin characters use 1 byte; characters for scripts like Khmer or Arabic use 2–4 bytes.
2. **Word length:** Morphologically rich languages (agglutinative, polysynthetic) produce longer words, requiring more characters and thus more bytes to convey the same propositional content.

Byte premiums can range from ~1 (language uses Latin script with short words) to ~5 (language uses a multi-byte script with long words) relative to English.

The practical consequence is that if you train a model on Language A and Language B with equal byte counts, Language B with a byte premium of 3 is receiving only ~1/3 the effective information exposure. This mismatch contributes to systematically worse model performance for morphologically rich, non-Latin-script languages — not because the language is harder to model, but because the model has seen less of it.

**Key finding from Arnett & Bergen (2025):** When monolingual language models are trained on byte-premium-scaled data (equal information content, not equal byte count), the performance gap between agglutinative and fusional languages is substantially reduced to the point of statistical non-significance (p = 0.077), despite a numerical difference remaining (M=143.62 vs. M=132.63 perplexity).

## When to Use

- When allocating training data budgets for multilingual or cross-lingual models
- When estimating how much data in a target language is "equivalent" to a known quantity in English
- When comparing LM performance across languages and controlling for data quantity effects
- When building a language-specific model for a non-Latin-script or morphologically rich language and benchmarking against English baselines
- When interpreting claims that a language is "harder for LMs" — always check whether byte-premium-scaled data parity was established

## How to Apply

**Step 1 — Measure or estimate the byte premium**
Collect a parallel text set where Language L and English express the same content (e.g., a Bible corpus, FLORES-200, or any aligned translation corpus).

```
byte_premium(L) = mean(
    bytes_in_L_sentence / bytes_in_EN_sentence
    for each aligned sentence pair
)
```

If no parallel text is available, estimate from:
- Script (lookup UTF-8 byte cost per character for the script family)
- Mean word length relative to English (morphologically long words increase byte cost per word)

**Step 2 — Compute the scaled data budget**
If your English training budget is B_en bytes (or tokens), the byte-premium-scaled budget for Language L is:

```
B_L_scaled = B_en × byte_premium(L)
```

Equivalently: to achieve equivalent information exposure to B_en English bytes, Language L needs B_L_scaled bytes of training text.

**Step 3 — Apply scaling in training setup**
- **Monolingual model:** Train Language L's model on at least B_L_scaled bytes of data.
- **Multilingual model with upsampling:** Scale each language's sampling weight by its byte premium, so languages with higher byte costs receive proportionally more data.
- **Tokenizer training:** Scale tokenizer training data by byte premium to ensure equal information exposure during vocabulary learning.

**Step 4 — Report byte premium alongside data statistics**
When reporting model performance, always state:
- Raw data volume (tokens and bytes) for each language
- Byte premium for each language relative to English
- Byte-premium-scaled equivalent (effective English-equivalent bytes)

This allows others to assess whether data parity was achieved and interpret performance differences correctly.

## Pseudocode

```
function compute_byte_premium(parallel_corpus):
    """
    parallel_corpus: list of (source_sentence, english_sentence) pairs
    Returns: float — byte premium of source language relative to English
    """
    ratios = []
    for src, eng in parallel_corpus:
        if len(eng.encode('utf-8')) > 0:
            ratio = len(src.encode('utf-8')) / len(eng.encode('utf-8'))
            ratios.append(ratio)
    return mean(ratios)


function scale_data_budget(target_bytes_english_equiv, byte_premium):
    """
    Returns the raw byte budget needed in target language to match
    the given English-equivalent information content.
    """
    return target_bytes_english_equiv * byte_premium


function multilingual_sampling_weights(languages, byte_premiums, base_weight=1.0):
    """
    Returns per-language sampling weights scaled by byte premium.
    Languages with higher byte premiums are sampled more.
    """
    weights = {}
    for lang in languages:
        weights[lang] = base_weight * byte_premiums[lang]
    # Normalize to sum to 1
    total = sum(weights.values())
    return {lang: w / total for lang, w in weights.items()}


function estimate_effective_data(raw_bytes, byte_premium):
    """
    Convert raw bytes of target-language data to
    English-equivalent effective bytes.
    """
    return raw_bytes / byte_premium
```

## Evidence

**Arnett & Bergen (COLING 2025):** Used the "Goldfish" suite of monolingual models from Chang et al. (2023): 1,989 models covering 252 languages, trained on matched token counts (1M, 10M, 100M, 1B tokens) at three model sizes (tiny 4.6M, mini 11.6M, small 29.5M parameters). Byte premiums were computed from Arnett et al. (2024a).

Key results when testing byte-premium-scaled Goldfish models across 154 languages:
- Agglutinative mean perplexity: **143.62**
- Fusional mean perplexity: **132.63**
- Difference: **not statistically significant** (t(137.36) = 1.180, p = 0.077)

Compare to the unscaled condition (§3 of the same paper): a robust, statistically significant performance gap (χ²(3) = 28.809, p < 0.001) exists between agglutinative and fusional languages before byte-premium correction.

Additionally, byte premiums are marginally significantly higher for agglutinative than fusional languages (t-test; t(157.9) = 1.960, p = 0.0518), confirming that byte premiums are not uniformly distributed across morphological types — agglutinative languages tend to pay a larger byte penalty, compounding the data scarcity problem.

Chang et al. (2023) designed the Goldfish models specifically to train on byte-premium-scaled quantities, operationalizing this technique at scale across 252 languages.

**Goldman et al. (ACL 2024):** Provides independent and mechanistically complementary evidence for the byte-premium effect from the tokenizer side. By training BPE tokenizers with varying amounts of supporting data (from 1M documents down to character-level = 0 documents), Goldman et al. demonstrate that token sequence inflation directly predicts downstream performance degradation:

- Going from a 1M-document tokenizer to a character-level tokenizer inflates token sequence length by **+323%** for English (9.3M → 39.5M tokens)
- A 1-document tokenizer (approximating a language with almost no tokenizer training data) inflates length by **+121%**
- Pearson correlation between token sequence length (inverse of compression) and downstream performance: up to **-0.996** (p < 0.01) for generation tasks — near-perfect monotonic relationship

This connects byte premium to tokenization: a language paying a high byte premium is precisely a language whose tokens are expensive, meaning a standard BPE tokenizer trained on English-dominant data will produce inflated token sequences for it — directly predicting performance degradation through the compression mechanism. The byte-premium data scaling approach corrects for the data side of this problem; selecting a better-compressing tokenizer (see `compression-ratio-tokenizer-selection`) addresses the tokenizer side.

## Variations & Configuration

- **Token-count vs. byte-count scaling:** The paper uses bytes as the unit of data measurement. Token counts are problematic because they depend on the tokenizer, which varies per language; bytes are more language-neutral. Prefer bytes when possible.
- **Sentence-level vs. corpus-level byte premium:** Sentence-level estimation (ratio per aligned pair, then mean) is more robust than corpus-level (total bytes across corpus divided by total English bytes), as it controls for differing numbers of sentences.
- **Parallel corpora for measurement:** FLORES-200 (NLLB Team et al., 2022) provides ~1,000 sentence pairs for 200 languages — sufficient for reliable byte premium estimation.
- **Script-only approximation:** If no parallel corpus is available, estimate byte premium from the script alone:
  - Latin, Cyrillic (with diacritics): ~1.0–1.2
  - Arabic, Hebrew, Devanagari: ~1.5–2.5
  - Chinese, Japanese, Korean: ~2.0–3.0
  - Khmer, Tibetan, other complex scripts: ~3.0–5.0
  Add ~10–30% for morphologically long words (agglutinative/polysynthetic languages).
- **Goldfish models:** Pre-trained byte-premium-scaled monolingual baselines for 252 languages from Chang et al. (2023); useful as reference models.

## Code & Tools

- **Goldfish models** (Chang et al. 2023): Byte-premium-scaled monolingual models for 252 languages — https://github.com/tylerachang/goldfish
- **FLORES-200** (NLLB Team 2022): Parallel evaluation dataset for 200 languages — https://huggingface.co/datasets/facebook/flores
- **Byte premium estimation** (Arnett et al. 2024a): "A bit of a problem: Measurement disparities in dataset sizes across languages" — LREC-COLING 2024 (code available at the MorphScore repository)
- **tokenization-scorer** (Zouhar et al. 2023): Rényi entropy and compression metrics — https://github.com/zouharvi/tokenization-scorer

## Strengths & Weaknesses

| Strengths | Weaknesses |
| --- | --- |
| Addresses a concrete, measurable confound in cross-lingual model comparison | Byte premium estimation requires a parallel corpus; not all languages have one |
| Explains most of the performance gap between morphological language types without changing model architecture | After byte-premium correction, a numerical (though non-significant) gap remains, suggesting byte premium is not the only factor |
| Straightforward to compute and apply; no special tooling required | Assumes bytes are the correct unit of "information content" — may understate sparsity for polysynthetic languages where a single word encodes a full clause |
| Directly actionable for training data budget allocation | Does not account for data quality differences (noisy web text vs. curated text) across languages |
| Helps prevent systematic disadvantage of non-Latin-script and morphologically rich languages even when raw data volume appears equal | For very low-resource languages, even byte-premium-scaled equivalent of English training data may not exist |
| Improves transparency and reproducibility by standardizing how data quantities are reported | Byte premium varies by domain and register; a single corpus-level value may not generalize across all text types |

## References

- Arnett, C. & Bergen, B. K. (2025). Why do language models perform worse for morphologically complex languages? COLING 2025, pages 6607–6623.
- Arnett, C., Chang, T. A., & Bergen, B. K. (2024a). A bit of a problem: Measurement disparities in dataset sizes across languages. LREC-COLING 2024, pages 1–9.
- Chang, T. A., et al. (2023). Goldfish: Monolingual language models for 350 languages. ACL 2024. https://github.com/tylerachang/goldfish
- Goldman, O., Caciularu, A., Eyal, M., Cao, K., Szpektor, I., & Tsarfaty, R. (2024). Unpacking Tokenization: Evaluating Text Compression and its Correlation with Model Performance. *Findings of ACL 2024*, 2274–2286. — mechanistic compression-side evidence complementing this technique
- NLLB Team et al. (2022). No language left behind: Scaling human-centered machine translation. arXiv:2207.04672. https://huggingface.co/datasets/facebook/flores

??? note "📋 Self-Review Notes"
    **Reviewed:** 2026-06-11

    **Criterion 1 — Implementable from scratch:** PASS — The doc provides a complete 4-step process with formulas, pseudocode for all key functions, and a script-family lookup table for estimating byte premiums when no parallel corpus is available. A practitioner can apply the technique end-to-end from this document alone.

    **Criterion 2 — Empirical results with numbers:** PASS — Specific perplexity values (agglutinative M=143.62, fusional M=132.63), t-test statistics (t(137.36)=1.180, p=0.077), chi-squared results from the unscaled condition (χ²(3)=28.809, p&lt;0.001), model sizes (4.6M/11.6M/29.5M parameters), training token counts (1M/10M/100M/1B), and dataset names (Goldfish suite, FLORES-200, 252/154 languages) are all cited.

    **Criterion 3 — Data regime clarity:** PARTIAL — The doc explains that FLORES-200 (~1,000 sentence pairs) is sufficient for byte-premium estimation, and any aligned parallel corpus works. However, it does not give an absolute minimum training data size recommendation for the target language itself — it only provides scaling relative to an English baseline. A practitioner starting with no English reference point may be uncertain about where to anchor the budget.

    **Criterion 4 — Pseudocode completeness:** PASS — Four functions are fully specified: `compute_byte_premium` (parallel corpus → ratio), `scale_data_budget` (target bytes from English equivalent), `multilingual_sampling_weights` (normalized per-language weights), and `estimate_effective_data` (raw bytes → English-equivalent). All are unambiguous and cover the full algorithm.

    **Criterion 5 — Failure modes:** PARTIAL — The Strengths & Weaknesses table documents several failure conditions: absence of a parallel corpus for estimation, residual gap for polysynthetic languages (byte premium may understate sparsity), data quality disparities, domain/register variability, and cases where even the scaled budget does not exist for very low-resource languages. However, there is no dedicated "Failure Modes" section, and the doc does not specify what to do when the byte-premium estimate is unreliable (e.g., high variance across sentence pairs or small parallel corpus), nor does it flag that domain mismatch between the estimation corpus and training corpus can bias results.

    **Overall:** The doc is well-grounded and nearly complete. Two gaps worth addressing: (1) add an absolute data-budget anchor or worked example so practitioners without an English reference baseline know where to start; (2) add brief guidance on detecting and handling unreliable byte-premium estimates (e.g., report variance/confidence interval, use script-only fallback when variance is high).

