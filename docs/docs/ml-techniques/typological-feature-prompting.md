
# Typological Feature Prompting

**Category:** ML Technique
**Data Regime:** zero-resource / &lt;1K sentences
**Applicable Languages:** all low-resource; especially useful for languages with typological profiles in Grambank or WALS

## Description

Typological Feature Prompting (TYP) is a structured in-context prompting method that encodes a language's high-level grammatical properties — word order, morphological type, verb tenses, noun cases, evidentiality, etc. — into the LLM prompt using a rule-based text template. Rather than providing raw grammatical explanations from a grammar book, TYP distills cross-linguistically standardized, categorical typological features (from databases like Grambank or WALS) into a compact, language-invariant description of a language's structural properties.

The method is designed to give LLMs a structured representation of what a language is like, replacing the noisy, non-standard prose of grammar book explanations. TYP outperforms full grammar book prompting for linguistic tasks (grammaticality judgment, interlinear gloss prediction) and is more effective than explanations for translation in some settings.

## When to Use

- The target language has typological feature specifications in Grambank (Skirgård et al. 2023b) or a similar typological database.
- The task is a **linguistic task**: grammaticality judgment, morphological analysis, or interlinear gloss (IGT) prediction. TYP consistently improves these tasks.
- For **machine translation**: TYP is inconsistent — it helps in some language pairs but not others, and does not replace parallel data. Use TYP as a supplement to parallel examples for MT, not as a replacement.
- Particularly valuable when you have no parallel data but need to do grammatical analysis (zero-resource linguistic tasks).
- Applicable to polysynthetic languages: Mohawk's typological profile (verb-centric, polysynthetic, evidentiality, head-marking) can be directly encoded with Grambank features.

## How to Apply

1. **Look up the language's typological features** in Grambank (Skirgård et al. 2023b) or WALS (Dryer & Haspelmath 2013). These databases provide categorical, cross-linguistically consistent feature values (e.g., GB020 = "Verb-final word order: yes/no").

2. **Select relevant features.** Focus on features that constrain surface form:
   - Word order (SVO/SOV/VSO/VOS/etc.)
   - Morphological type (agglutinative / fusional / isolating / polysynthetic)
   - Head/dependent marking
   - Tense distinctions
   - Noun case system
   - Evidentiality markers
   - Negation strategies
   - For polysynthetic languages: noun incorporation, verb agreement classes

3. **Build a text prompt from a rule-based template.** The template converts feature codes to natural-language sentences. Example format (from Aycock et al.):
   ```
   [Language name] has the following grammatical properties:
   - Word order: [feature value + short explanation]
   - Morphological type: [feature value + short explanation]
   - [... remaining features ...]
   This language is typologically [similar to / different from] English in the following ways: [...]
   ```
   The template is language-invariant: the same template applies to any language once feature values are substituted.

4. **Combine with parallel examples for best results:**
   - For linguistic tasks: `TYP + BOOK_para` (typological prompt + grammar book parallel examples).
   - For translation: `TYP + W + PARA_train` (typological prompt + word list + training parallel data) gives best overall results but parallel data dominates.

5. **Evaluate on the target task:**
   - Grammaticality judgment: accuracy on swapped/shuffled sentence discrimination.
   - IGT prediction: morpheme accuracy (primary metric), word accuracy, Stem F1, Gram F1, CHRF++.
   - MT: CHRF++ with word-order awareness.

## Pseudocode

```
# Step 1: Fetch typological features from Grambank
features = grambank.lookup(language_code)  # e.g., "kgv", "moh"

# Step 2: Select and filter relevant features
relevant = [f for f in features if f.category in RELEVANT_CATEGORIES]
# RELEVANT_CATEGORIES = ['word_order', 'morphological_type', 'tense',
#                         'case', 'evidentiality', 'head_marking', 'negation']

# Step 3: Build typological prompt via template
typ_prompt = ""
for feature in relevant:
    description = FEATURE_TEMPLATES[feature.code].format(value=feature.value)
    typ_prompt += f"- {description}\n"

# Step 4a: Linguistic task — combine TYP with parallel examples
for test_example in test_set:
    parallel_context = select_by_lcs(test_example.source, para_examples, k=10)
    full_prompt = typ_prompt + "\n" + format_examples(parallel_context) + "\n" + test_example.source
    prediction = llm.generate(full_prompt)
    evaluate(prediction, test_example.reference)

# Step 4b: MT (TYP as supplement only)
for test_src in test_set:
    parallel_context = select_by_lcs(test_src, para_examples, k=5)
    full_prompt = typ_prompt + "\n" + wordlist + "\n" + format_examples(parallel_context) + "\n" + test_src
    translation = llm.generate(full_prompt)
```

## Evidence

**Grammaticality judgment (Kalamang, kgv) with Gemini:**
- 0-shot: ~54–63% accuracy across SWAP_adj / SWAP_ran / SHUFFLE tests.
- `BOOK_para`: ~63–76%.
- `TYP + BOOK_para`: **65–83%** — best overall, up to +3% over `BOOK_para` and +8% over full grammar book (`BOOK_all`).

**IGT prediction (Kalamang) with Gemini:**
- `TYP + BOOK_para`: **46.1 morpheme accuracy** — best result among all Gemini settings, beating `BOOK_para` by 1 point, `BOOK_all` by 5 points, and `BOOK_non-para` by 25 points.
- Beats all supervised baselines (TOP-CLASS, SMP-BASE, TUCL-MORPH) on morpheme accuracy by 1–5%.
- Competitive with fine-tuned BYT5-FT (48.6) and GLOSSLM-FT (43.8) which use supervised training data.

**Machine translation (kgv, npi, gug) with Gemini:**
- Results are inconsistent: TYP helps eng→kgv modestly when combined with `BOOK_para` (+4.4 CHRF++ vs. TYP alone), but `BOOK_para` alone matches or beats `TYP + BOOK_para` for npi and gug.
- TYP alone (0-shot): 10.8 eng→kgv, lower than `BOOK_para` (30.8).
- **Conclusion:** TYP does not substitute for parallel data in MT; it is most useful for linguistic tasks.

## Variations & Configuration

- **Feature database:** Grambank (Skirgård et al. 2023b) is recommended; it has ~250 features for ~2500 languages. WALS (Dryer & Haspelmath 2013) is a complementary source with different feature coverage.
- **Feature selection:** Including too many features may dilute the signal. Focus on features that constrain surface form and are relevant to the task (e.g., word order for MT, morphological features for IGT).
- **Prompt format:** The rule-based template used by Aycock et al. converts binary/categorical Grambank values into natural-language sentences. The exact template is language-invariant and released with the paper's code.
- **Combination with parallel data:** TYP is strictly additive with parallel data for linguistic tasks; the gains compound. For MT, the gain from TYP is absorbed by parallel data improvements.
- **Target language coverage:** Grambank covers most documented languages including many indigenous ones. For Mohawk (Haudenosaunee), Grambank has typological data that can be used directly.

## Code & Tools

- Paper code (includes TYP prompt templates): linked in Aycock et al. (2025) paper footnote
- Grambank database: [https://grambank.clld.org/](https://grambank.clld.org/) — downloadable CSV of features per language
- WALS: [https://wals.info/](https://wals.info/)
- Skirgård et al. (2023b): Grambank v1.0, Zenodo — [https://doi.org/10.5281/zenodo.7740140](https://doi.org/10.5281/zenodo.7740140)
- IGT evaluation: `mcmillan-major` (morpheme accuracy metric) from Ginn et al. (2023)

## Strengths & Weaknesses

| Strengths | Weaknesses |
| --- | --- |
| Requires no parallel data — typological features are available from Grambank for most documented languages | Does not improve MT performance reliably; parallel data dominates for translation |
| Compact: ~68k tokens for a full TYP prompt vs. ~100k for a full grammar book | Grambank feature coverage is incomplete for some endangered/underdocumented languages |
| Language-invariant template — same structure works across all languages | Feature-to-text template must be manually constructed; the mapping from Grambank codes to natural-language descriptions is non-trivial |
| Achieves leading morpheme accuracy on IGT prediction, beating supervised baselines | Best results still require combining TYP with parallel examples; TYP alone is insufficient |
| Directly encodes polysynthetic and evidential properties useful for Mohawk-type languages | Performance gains are task-specific; effects on other tasks (parsing, glossing beyond kgv) are untested |

## References

- Aycock, S., Stap, D., Wu, D., Monz, C., & Sima'an, K. (2025). Can LLMs Really Learn to Translate A Low-Resource Language from One Grammar Book? ICLR 2025.
- Skirgård, H., et al. (2023b). Grambank v1.0. Zenodo. https://doi.org/10.5281/zenodo.7740140
- Dryer, M. S., & Haspelmath, M. (Eds.) (2013). WALS Online. Max Planck Institute for Evolutionary Anthropology.
- Ginn, M., et al. (2023). Findings of the SIGMORPHON 2023 Shared Task on Interlinear Glossing. ACL.
- Tanzer, M., et al. (2024). A Benchmark for Learning to Translate a New Language from One Grammar Book. ICLR 2024.

??? note "📋 Self-Review Notes"
    **Reviewed:** 2026-06-11

    **Criterion 1 — Implementable from scratch:** PARTIAL — Steps 1–5 are concrete and databases are identified. However, the critical `FEATURE_TEMPLATES` dictionary (the mapping from Grambank feature codes to natural-language sentences) is described as "non-trivial" and deferred to the paper's released code rather than shown here. Without at least a few representative entries, a practitioner cannot reproduce the template construction without finding the paper code. The `select_by_lcs` function used in the pseudocode is also undefined.

    **Criterion 2 — Empirical results with numbers:** PASS — Concrete metric scores are provided: grammaticality judgment accuracy (54–83%), IGT morpheme accuracy (46.1 for TYP+BOOK_para vs. 48.6 for BYT5-FT), MT CHRF++ values (10.8 TYP alone vs. 30.8 BOOK_para for eng→kgv). Dataset (Kalamang/kgv), model (Gemini), and supervised baselines (TOP-CLASS, SMP-BASE, TUCL-MORPH, BYT5-FT, GLOSSLM-FT) are all named.

    **Criterion 3 — Data regime clarity:** PASS — The zero-resource / &lt;1K regime is stated in the header and reinforced throughout. The "When to Use" section explains that typological features alone (no parallel data) are the minimum requirement. The pseudocode quantifies the parallel example budget (k=10 for linguistic tasks, k=5 for MT). The additive vs. substitutive relationship with parallel data is clearly articulated.

    **Criterion 4 — Pseudocode completeness:** PARTIAL — The overall flow is clear, but three constructs are used without definition: (1) `FEATURE_TEMPLATES[feature.code]` — the core template dictionary is never shown, not even one example entry; (2) `select_by_lcs` — the LCS-based example selection function is used but not explained; (3) `format_examples` — the formatting helper is called without a signature or example output. These gaps block a from-scratch implementation.

    **Criterion 5 — Failure modes:** PARTIAL — The Weaknesses table covers the main failure modes (MT inconsistency, incomplete Grambank coverage, template construction difficulty, TYP-alone insufficiency). Missing are: (a) what to do when a language has no Grambank entry or sparse coverage (no fallback strategy is given); (b) whether the LLM can be observed to ignore or misinterpret typological prompts and how to detect this; (c) no guidance on prompt-length limits when combining TYP (~68k tokens noted) with parallel examples for models with smaller context windows.

    **Overall:** The doc is strong on evidence and data-regime clarity. The two gaps that would most block a practitioner are (1) the absence of even a minimal `FEATURE_TEMPLATES` example and (2) no fallback path when Grambank coverage is missing. Adding 3–5 example template entries and a "missing coverage" fallback note would bring this to full PASS across all criteria.

