
# Data Volume as Primary Lever

**Category:** Process & Methodology Technique
**Data Regime:** any (guides investment decisions across all regimes)
**Applicable Languages:** all low-resource; most directly applicable to morphologically rich / agglutinative / polysynthetic languages

## Description

"Data volume as primary lever" is a resource-allocation principle for low-resource language AI projects. It states that, when choosing between investing in more training data versus investing in architectural improvements (better tokenizers, morphology-aware models, etc.), more data is the dominant lever — especially for morphologically complex languages where the performance gap is often attributed to linguistic structure rather than data scarcity.

The principle is grounded in a key empirical finding from Arnett & Bergen (2025): the performance gap between agglutinative (morphologically complex) and fusional (simpler) languages in language models is largely explained by data quantity disparities — specifically, the amount of *effective* data after correcting for byte premiums. When this data disparity is controlled for, the gap reduces to statistical non-significance. Morphological complexity itself is not an intrinsic barrier.

This has strategic implications for indigenous language AI projects:
1. **Architectural sophistication is a premature optimization** when the binding constraint is data volume. Complex morpheme-aware tokenizers, polysynthetic language models, and specialized architectures all require data to show benefit.
2. **Data collection has direct, predictable returns.** More data reliably improves performance; architectural changes have more uncertain returns in low-resource settings.
3. **Misconceptions about "hard languages" can misdirect effort.** If a Mohawk LM underperforms, the right response is likely to collect more Mohawk text — not to redesign the architecture.

This is a *process* and *investment* principle, not a technical method. Its value is in correcting a prevalent misconception and redirecting development effort toward data collection, curation, and community partnership.

## When to Use

- When deciding how to allocate limited development time and resources between data collection and model architecture work
- When evaluating whether a performance gap between your target language and English/French baselines is evidence of an "unsolvable" structural problem
- When writing a project proposal or justifying resource allocation to funders or community partners
- When a team is tempted to delay data collection until "the model architecture is figured out"
- When interpreting published results that attribute low performance to language complexity without controlling for data quantity

## How to Apply

**Step 1 — Diagnose the true data quantity**
Measure how much effective training data you have in the target language, accounting for byte premiums:

```
effective_data_en_equivalent = raw_bytes_target_language / byte_premium(target_language)
```

Compare this to data quantities reported for languages where models perform well.

**Step 2 — Establish the performance gap baseline**
Measure current model performance on your target language (perplexity, downstream task accuracy). Document the baseline before any intervention.

**Step 3 — Estimate data returns before architectural investment**
Before committing to architectural work (new tokenizer, morpheme-aware model, etc.):
1. Identify the nearest higher-data condition for your language (or a typologically similar language) in published benchmarks
2. Estimate what performance gain is expected from doubling or 10x-ing data volume
3. Compare estimated data gains to expected architectural gains from the literature

Rule of thumb from scaling laws: doubling data typically yields perplexity improvements in the 5–15% range for low-resource settings; architectural changes without commensurate data rarely match this.

**Step 4 — Prioritize data collection activities**
If data is the binding constraint, invest in:
- Community-driven text collection (oral tradition transcription, language nests, documentation projects)
- Web scraping and corpus assembly for languages with online presence
- Parallel text creation for transfer learning
- Data augmentation (morphological paradigm generation, back-translation)
- Archive digitization and OCR for existing written materials

**Step 5 — Re-evaluate architectural decisions with more data**
Once a meaningful corpus exists (>100K tokens for a first viable baseline; >1M tokens to reliably assess architectural choices), architectural experiments become interpretable. Before that threshold, architectural results are dominated by noise from data scarcity.

**Step 6 — Communicate the data bottleneck clearly**
When reporting results:
- Always report raw data volume AND byte-premium-scaled effective volume
- Explicitly state whether the performance gap is attributable to data disparity or to other factors
- Avoid framing low performance as evidence that the language is "hard for AI" without ruling out data scarcity

## Pseudocode

```
function investment_decision(available_resources, current_data_bytes, byte_premium,
                              current_perplexity, target_perplexity):
    """
    Returns recommended investment priority: DATA or ARCHITECTURE
    """
    effective_data = current_data_bytes / byte_premium
    en_equivalent_at_target_perf = estimate_data_needed_for_target(target_perplexity)

    data_gap = en_equivalent_at_target_perf - effective_data

    if data_gap > 0:
        # Data shortfall — fill it first
        return "DATA: collect {} more English-equivalent bytes".format(
            data_gap * byte_premium
        )
    else:
        # Data parity achieved — architectural work is now interpretable
        return "ARCHITECTURE: data parity reached, architectural experiments are valid"


function interpret_performance_gap(lang_perplexity, en_perplexity,
                                    lang_data_bytes, en_data_bytes, byte_premium):
    """
    Determine whether a performance gap is likely data-driven or structural.
    """
    effective_lang_data = lang_data_bytes / byte_premium
    data_ratio = effective_lang_data / en_data_bytes

    if data_ratio < 0.1:
        return "GAP IS ALMOST CERTAINLY DATA-DRIVEN: target language has < 10% of EN data equivalent"
    elif data_ratio < 0.5:
        return "GAP LIKELY DATA-DRIVEN: target language has < 50% of EN data equivalent"
    else:
        return "GAP MAY REFLECT OTHER FACTORS: data parity is closer; investigate architecture and tokenizer"
```

## Evidence

Arnett & Bergen (COLING 2025) tested three hypotheses for why agglutinative languages underperform in LMs:
- **H1 (Morphological alignment):** Not supported — MorphScore (tokenizer–morpheme alignment) shows no correlation with perplexity (F(1,13) = 0.323, p = 0.580)
- **H2 (Tokenization quality):** Partially supported — Rényi entropy explains some variance but morphological type still explains additional variance beyond it (χ²(3) = 29.464, p < 0.001)
- **H3 (Data disparity):** **Best supported** — after byte-premium-scaling data, the performance gap is statistically non-significant (p = 0.077)

The evidence base comes from:
- 5 multilingual models: XGLM, BLOOM, mT0, MaLA, LLaMA2 (§3.2)
- 1,989 monolingual Goldfish models across 252 languages (§3.3), trained at 4 data sizes × 3 model sizes
- Byte premium data from Arnett et al. (2024a) covering 154+ languages

Additional supporting evidence from the broader literature:
- Hoffmann et al. (2024): in some cases, increasing data improves performance more than increasing model size — Chinchilla scaling laws
- Blasi et al. (2022): despite having more speakers than many European languages, morphologically complex languages like Bengali, Swahili, and Korean have only a fraction of the NLP research attention, consistent with data scarcity as the main driver of inequitable performance

## Variations & Configuration

- **Strong version:** Halt all architectural work until a minimum viable corpus (1M+ tokens) is in place
- **Parallel-track version:** Run lightweight architectural baseline experiments with available data while community data collection proceeds; revisit architectural choices once corpus grows
- **Transfer learning adjustment:** When using cross-lingual transfer (e.g., from a related language), the "effective data" calculation can include transferred knowledge — though the exchange rate is task- and language-dependent
- **Data quality weighting:** In low-resource settings, quality matters alongside quantity. 100K tokens of verified, fluent text may be worth more than 1M tokens of noisy web text. Consider a quality-adjusted effective data estimate.
- **Augmentation as a data lever:** Morphological paradigm generation, back-translation, and data augmentation can multiply the effective corpus size without requiring new human-produced text — treat these as data collection strategies, not architectural ones

## Code & Tools

- **Goldfish models** (Chang et al. 2023): Monolingual baselines for 252 languages at multiple data sizes; useful for reading off expected perplexity at a given data volume — https://github.com/tylerachang/goldfish
- **Byte premium estimation** (Arnett et al. 2024a): LREC-COLING 2024 — measurement tool for data size disparities
- **FLORES-200** (NLLB Team 2022): Parallel evaluation data for 200 languages; useful for byte premium computation and cross-lingual performance benchmarking — https://huggingface.co/datasets/facebook/flores
- **MorphScore** (Arnett et al. 2025): For ruling out tokenizer alignment as a competing explanation — https://github.com/catherinearnett/morphscore

## Strengths & Weaknesses

| Strengths | Weaknesses |
| --- | --- |
| Grounded in the strongest empirical finding of Arnett & Bergen (2025): data parity eliminates most of the performance gap | The byte premium is an imperfect proxy for information content; polysynthetic languages (Mohawk) where a single word encodes a clause may still be understated |
| Redirects effort to the most actionable lever for indigenous language teams | Data collection for endangered languages is slow, difficult, and community-dependent — the principle is easier to state than to execute |
| Prevents premature optimization on architecture before the data constraint is resolved | Scaling laws were developed for high-resource settings; their precise application to very low-resource regimes is less certain |
| Helps communicate to funders and communities why data collection is the primary need | May underweight cases where architectural choices (e.g., morpheme-aware tokenization) matter even with limited data |
| Provides a clear interpretation framework for cross-lingual performance gaps | Does not account for domain mismatch — more data in the wrong domain may not close a task-specific performance gap |

## References

- Arnett, C. & Bergen, B. K. (2025). Why do language models perform worse for morphologically complex languages? COLING 2025, pages 6607–6623.
- Arnett, C., Chang, T. A., & Bergen, B. K. (2024a). A bit of a problem: Measurement disparities in dataset sizes across languages. LREC-COLING 2024, pages 1–9.
- Chang, T. A., et al. (2023). Goldfish: Monolingual language models for 350 languages. ACL 2024.
- Blasi, D. E., et al. (2022). Systematic inequalities in language technology performance across the world's languages. PNAS, 119(4).
- Hoffmann, J., et al. (2022). Training compute-optimal large language models. NeurIPS 2022. (Chinchilla)

??? note "📋 Self-Review Notes"
    **Reviewed:** 2026-06-11

    **Criterion 1 — Implementable from scratch:** PASS — The six-step How to Apply section provides a concrete workflow with formulas, explicit token-count thresholds (100K and 1M), and links to four named tools (Goldfish, byte-premium estimation, FLORES-200, MorphScore). A practitioner with no prior context could follow these steps and make a real investment decision.

    **Criterion 2 — Empirical results with numbers:** PASS — Specific statistics are cited throughout: F(1,13) = 0.323 p = 0.580 for H1, χ²(3) = 29.464 p < 0.001 for H2, p = 0.077 for H3; 5 named multilingual models; 1,989 Goldfish models across 252 languages; 154+ languages for byte-premium data. The "5–15% perplexity improvement from doubling data" rule of thumb in Step 3 is stated without a direct citation, which is a minor gap, but the overall evidence base is strong.

    **Criterion 3 — Applicable context clarity:** PASS — The "When to Use" section lists five distinct, concretely worded scenarios covering resource allocation decisions, proposal writing, result interpretation, and team-internal debates. The metadata fields (Data Regime: any; Applicable Languages: all low-resource, most directly applicable to morphologically rich / agglutinative / polysynthetic) further bound the scope.

    **Criterion 4 — Pseudocode/flowchart completeness:** PARTIAL — The two pseudocode functions cover the key decision logic, but `estimate_data_needed_for_target(target_perplexity)` is called without definition or a pointer to how to obtain this estimate (e.g., from Goldfish scaling curves). A reader cannot implement `investment_decision` end-to-end without knowing how to compute this value. Adding even a brief note (e.g., "read off from Goldfish perplexity-vs-data curves for a typologically similar language") would resolve the gap.

    **Criterion 5 — Failure modes:** PARTIAL — The Weaknesses column of the Strengths & Weaknesses table covers five genuine failure conditions (byte-premium imprecision for polysynthetic languages, slow community data collection, scaling-law uncertainty in very low-resource regimes, cases where morpheme-aware tokenization matters even with limited data, domain mismatch). However, these are framed as abstract weaknesses rather than explicit "conditions where following this guidance produces the wrong decision." A dedicated Failure Modes section — or at minimum a note like "Do not apply this principle when domain mismatch is the primary gap" — would make the failure conditions more actionable.

    **Overall:** The document is well-grounded and practically useful. Two targeted improvements would strengthen it: (1) define or reference `estimate_data_needed_for_target()` in the pseudocode so the investment decision function is fully self-contained, and (2) reframe the weaknesses as explicit failure conditions with decision rules (e.g., "If you have domain mismatch and not just data scarcity, this principle alone is insufficient — see [domain adaptation technique]").

