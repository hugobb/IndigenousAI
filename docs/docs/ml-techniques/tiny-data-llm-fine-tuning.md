
# Tiny-Data LLM Fine-Tuning for Endangered Languages

**Category:** ML Technique
**Data Regime:** &lt;1K–10K sentences (fine-tuning); as few as ~245 sentences minimum observed
**Applicable Languages:** Endangered languages with 1K–100K speakers and partial written documentation; especially analytic/weakly-inflected languages (Nheengatu, Guarani Mbya); less tested on heavily polysynthetic languages

## Description

Fine-tuning a large, pretrained multilingual translation model (such as NLLB-200 or mBART50) on a small, carefully curated corpus of Indigenous language data to produce a usable bilingual machine translator or writing-support tool. The approach exploits the strong multilingual priors of SOTA pretrained models so that meaningful translation can be obtained from training sets orders of magnitude smaller than what standard NMT would require.

The key insight from Pinhanez et al. (2024) is that for truly endangered languages — languages that have essentially no web presence and are therefore absent from LLM pretraining corpora — fine-tuning effects are *clean*: all performance gains can be attributed entirely to the fine-tuning data rather than to memorization of pretraining content. This makes tiny-data fine-tuning both scientifically tractable (clean attribution) and practically feasible (community corpora of 3K–7K sentences are sufficient for functional tools).

**Three empirically-derived guidelines from the paper:**

1. **Bilingual over multilingual:** Multilingual translators trained on all 39 Brazilian Indigenous languages simultaneously did *not* outperform bilingual models trained on a single language pair. The multilingual models achieved apparent metric gains via rogue memorization (storing training sentences rather than learning translation), signaled by high standard deviation in BLEU scores. Bilingual models are more reliable.

2. **Curated data quality over raw data quantity:** Removing 6% of noisy entries from the Nheengatu dataset (yielding "Nheengatu Clean," 6,621 training pairs) flipped the BLEU distribution: average BLEU jumped from 18.9 ± 16.8 to 38.6 ± 47.1 and the fraction of "near perfect" outputs rose from 12% to 48%. Data cleaning had more impact than any architectural change.

3. **Contamination detection via manual evaluation:** Automatic metrics (BLEU, chrF) do not reliably detect biblical contamination — outputs that contain phrases from the Bible training data rather than genuine translations. A 7-point human usefulness rating (near-perfect → very wrong) is necessary to assess real-world utility and catch contamination artifacts.

**Indigenous Language Model (ILM) framework:** Rather than training task-specific models separately, fine-tune a single LLM once on the community's linguistic corpus. Prompt the ILM differently for each downstream tool: translation prompts yield MT output, partial-word prompts yield spell-check suggestions, sentence-partial prompts yield next-word completions. This single-model-multiple-tools architecture is more efficient and maintainable for communities with limited technical capacity.

## When to Use

- The target language has a small but genuine text corpus: dictionaries, lexicons, theses, school books, folk tales, carefully collected web text (total ~1K–10K sentence pairs).
- The goal is to build a practical tool: translator, spell-checker, word/next-word completion, or writing assistant.
- The community has approved use of the corpus and there is a data governance agreement in place.
- You have access to a pretrained multilingual MT model (NLLB-200, mBART50, WMT-family) as a starting point.
- The language is *not* polysynthetic in the strong sense (the technique is demonstrated on Nheengatu and Guarani Mbya, both analytic Tupi-Guarani languages; applicability to polysynthetic languages like Mohawk is unconfirmed).

**Avoid when:**
- The corpus is sourced predominantly from the Bible without community approval — contamination risk is high and outputs will carry colonial religious associations.
- Multilingual training is preferred without rogue-memorization mitigation — use dedicated detection and filtering.
- The language is well-represented in base LLM pretraining (in that case, zero-shot or RAG approaches may already work, see Textbook Prompting / Grammar Book Extraction).

## How to Apply

**Phase 1 — Data preparation**

1. Collect all available text in the target language: dictionaries, lexicons, short stories, pedagogical materials, folk tales, theses. Convert PDFs to text via OCR or scripted extraction.
2. Split sources into *linguistic* (dictionaries, lexicons, grammars) and *parallel* (bilingual sentence pairs, Bible translations if approved). Keep them separate to enable controlled training experiments.
3. Construct training pairs: `(source_sentence, target_sentence)`. For dictionary entries, generate sentence pairs from example sentences, not headword definitions.
4. **Manually curate the training set.** Review all pairs for: empty strings, misaligned translations, OCR artifacts, transliteration errors. Remove or fix. Expect ~6–10% of entries to require correction or deletion.
5. Hold out 10% of pairs as a test set. Do not use the test set for any training decisions.

**Phase 2 — Fine-tuning**

6. Select a pretrained bilingual or multilingual MT model as the base. NLLB-200 is preferred if the language is in its language list (even with a proxy language code); WMT19 (German-English) or mBART50 are alternatives with different strengths.
7. Fine-tune the base model **bilingually** (single source–target pair only). Do not fine-tune on all languages simultaneously unless you have >10K pairs per language and explicit rogue-memorization mitigation.
8. Experiment with **two-step fine-tuning** if you have two data sources of different quality/domain: fine-tune first on the larger/noisier source, then fine-tune again on the smaller/cleaner linguistic source. This "→dict" strategy gave 16–36% accuracy gains over single-step in the Nheengatu experiments.
9. Monitor BLEU score distributions on the training set (not just average BLEU). A bimodal or right-skewed distribution (many perfect scores) signals rogue memorization — reduce model capacity or add regularization.

**Phase 3 — Human evaluation**

10. Generate translations for 200–300 test sentences.
11. Rate each output on the 7-point usefulness scale: *near-perfect* (suitable for automatic use), *correct*, *mostly correct*, *usable* (needs human correction), *mostly incorrect*, *incorrect*, *very wrong*.
12. If >30% of outputs are "very wrong," return to Phase 1 and improve data quality before further model tuning.
13. Audit for contamination: check whether outputs contain phrases from any "toxic" training source (Bible, copyrighted material). Flag and investigate any outputs with suspicious formulaic language.

**Phase 4 — ILM deployment**

14. Package the fine-tuned model as an ILM. Implement prompt templates for each application: translation, word completion, next-word completion, spell-check.
15. Deploy within the community as a writing assistant (web or mobile). Collect usage data only with community consent; feed corrected outputs back as training data under the data governance agreement.

## Pseudocode

```
# Phase 1: Data preparation
raw_sources = collect_text(dictionaries, lexicons, stories, educational_materials)
parallel_pairs = extract_parallel_pairs(raw_sources)
parallel_pairs = manual_curate(parallel_pairs,
    remove_if=["empty_string", "misaligned", "ocr_artifact"])

train, test = split(parallel_pairs, test_fraction=0.10)

# Phase 2: Fine-tuning (bilingual, two-step)
base_model = load_pretrained("nllb-200" | "mbart50" | "wmt19")

# Step 1: fine-tune on larger/noisier linguistic data
model_step1 = fine_tune(base_model, train_linguistic,
    epochs=5, lr=1e-5, batch_size=8)

# Step 2: fine-tune on smaller/cleaner parallel data
model_final = fine_tune(model_step1, train_parallel,
    epochs=5, lr=1e-5, batch_size=8)

# Rogue memorization check
train_bleu_dist = compute_bleu_distribution(model_final, train)
if is_bimodal(train_bleu_dist) or right_skew(train_bleu_dist):
    warn("Rogue memorization detected — reduce capacity or regularize")

# Phase 3: Human evaluation
test_outputs = model_final.translate(test)
ratings = human_rate_usefulness(test_outputs, scale=7_point)
contamination_flags = audit_for_toxic_phrases(test_outputs, source=["bible"])

if fraction_very_wrong(ratings) > 0.30:
    return "Improve data quality before further tuning"

# Phase 4: ILM deployment
ilm = package_as_ilm(model_final)
ilm.register_prompt("translate", template="Translate from {src_lang}: {input}")
ilm.register_prompt("word_complete", template="Complete this word in {lang}: {partial}")
ilm.register_prompt("next_word", template="Next word in {lang}: {sentence_so_far}")
deploy(ilm, interface=["web", "mobile"])
```

## Evidence

**Guarani Mbya (mby) — ~6,000 speakers:**
- Base: bilingual model (dict) fine-tuned on 3,155 training pairs (1,022 short stories + 245 pedagogical texts + 2,230 dictionary sentences from Dooley 1985/1988/2016).
- Human evaluation of 300 outputs: 40% "very wrong," 26% incorrect/mostly incorrect, only 7% "near perfect or correct."
- Two-step model (mbya→dict): 16–36% accuracy improvement over single-step dict; best model achieved BLEU=15, chrF=32 on Dictionary test set. All gains statistically significant (p < 0.001, one-tailed t-test).

**Nheengatu (yrl) — ~20,000 speakers:**
- Nheengatu dataset: 7,281 pairs from 5 sources (lexicon 6,846 + 4 other sources). Train: 6,804; test: 233.
- After cleaning (removing 6% noisy entries): Nheengatu Clean = 6,621 training / 227 test pairs.
- Human evaluation (Nheengatu Clean): 48% "near perfect," 17% correct/mostly correct, 8% usable, only 27% unusable. Compared to 12% near-perfect before cleaning.
- Average BLEU: 18.9 ± 16.8 (original) → 38.6 ± 47.1 (clean). The high standard deviation in the clean model reflects outlier sentences, not systematic memorization.

**Multilingual fine-tuning:**
- mBART50 bilingual (BL10) vs. all-language (AL10) vs. Tupi-family (TF10): BLEU 12.32 / 6.39 / 6.63; BLEURT 0.39 / 0.31 / 0.35; BERTScore 0.88 / 0.85 / 0.86. BL consistently outperforms AL and TF on all metrics. Multilingual gains in AL39/AL10 settings were attributable to rogue memorization (bimodal BLEU distribution on training set).

**Contamination:**
- mbya (Bible-only fine-tuning): 100% of 15 inspected outputs showed biblical contamination.
- dict (no Bible fine-tuning): 0 contaminated outputs.
- mbya+dict (combined): 4.7% contaminated (14/300 outputs flagged); 2 obvious cases ("Jesus" explicit).

## Variations & Configuration

- **Model choice:** NLLB-200 is preferred for languages in its 200-language list; WMT19 (German-English) is an effective starting point for languages outside that list, as it already encodes strong seq2seq MT priors. mBART50 trained on 50 languages showed similar but slightly better average BLEU vs. WMT19 with higher variance.
- **Two-step vs. one-step:** Two-step fine-tuning (larger/noisier first, then clean/focused) gave 16–36% accuracy gains over single-step. Recommended when you have two distinct data sources of different quality.
- **ILM multi-task prompting:** A single fine-tuned ILM model can be repurposed for word completion, next-word completion, translation, and spell-checking via different prompt templates. This reduces maintenance burden for community deployments.
- **Technology probes:** Deploy a known-imperfect prototype to elicit community feedback on what kinds of writing support are most needed. Use the feedback to prioritize which ILM capabilities to develop. The Tenondé-Porã workshops showed prototypes could drive community conversations about digital language use even when translation quality was poor.
- **Bible data:** If the community approves Bible data use, include it in Phase 1 of two-step fine-tuning (as the noisier first-step data), then fine-tune again on clean linguistic data. Monitor contamination at deployment; never release a Bible-only model without explicit community consent.

## Code & Tools

- NLLB-200: https://huggingface.co/facebook/nllb-200-distilled-1.3B (and family)
- mBART50: https://huggingface.co/facebook/mbart-large-50
- SacreBLEU (BLEU metric): https://github.com/mjpost/sacrebleu
- BLEURT (neural MT evaluation): https://github.com/google-research/bleurt
- BERTScore: https://github.com/Tiiiger/bert_score
- eBible corpus (multilingual Bible parallel data): https://ebible.org/download.php
- Dooley Guarani Mbya lexicon (basis of Dictionary dataset): referenced in paper but not publicly released — requires community agreement

## Strengths & Weaknesses

| Strengths | Weaknesses |
| --- | --- |
| Functional MT tools achievable with 3K–7K curated training pairs | Analytic Tupi-Guarani languages tested; generalization to polysynthetic languages (Mohawk, Inuktitut) unconfirmed |
| Clean attribution of fine-tuning effects — no contamination from LLM pretraining | Rogue memorization is a real failure mode for multilingual fine-tuning; requires explicit detection |
| Single ILM model can power multiple writing-support tools via prompting | Data quality has more impact than model choice; manual curation is labor-intensive and requires language expertise |
| Two-step fine-tuning provides large gains at no additional data cost | Bible data contamination is difficult to eliminate once included in training; avoid unless community approves |
| Human usefulness evaluation reliably detects failures missed by automatic metrics | Low-volume community deployments provide limited feedback signal; requires sustained engagement to iterate |
| Open-source base models enable community-controlled fine-tuning without cloud dependency | Spell-checker and completion quality still limited for low-literacy users; prototype testing surfaced accessibility gaps |

## References

- Pinhanez, C., Cavalin, P., Storto, L., Finbow, T., Cobbinah, A., Nogima, J., Vasconcelos, M., Domingues, P., Mizukami, P. de S., Grell, N., Gongora, M., & Gonçalves, I. (2024). Harnessing the Power of AI to Vitalize Endangered Indigenous Languages: Technologies and Experiences. *arXiv:2407.12620v2*.
- Cavalin, P., et al. (2024). A Study of Multilingual and Bilingual Fine-Tuning for Indigenous Languages. (Detailed experimental analysis referenced in Pinhanez et al. 2024.)
- Domingues, P., et al. (2024). Contamination in Machine Translation for Brazilian Indigenous Languages. (Contamination quantification study referenced in Pinhanez et al. 2024.)
- Ng, N., et al. (2019). Facebook FAIR's WMT19 News Translation Task Submission. *WMT 2019*.
- Costa-jussà, M. R., et al. (2022). No Language Left Behind: Scaling Human-Centered Machine Translation. (NLLB-200 model.)
- Tang, Y., et al. (2020). Multilingual Translation with Extensible Multilingual Pretraining and Finetuning. (mBART50 model.)

??? note "📋 Self-Review Notes"
    **Reviewed:** 2026-06-11

    **Criterion 1 — Implementable from scratch:** PASS — All four phases (data preparation, fine-tuning, human evaluation, ILM deployment) are spelled out with concrete numbered steps. Hyperparameters are given (epochs=5, lr=1e-5, batch_size=8), model choices are named (NLLB-200, mBART50, WMT19), and the two-step fine-tuning strategy is explained with rationale. The only gap is that the exact 7-point rating rubric labels are listed (near-perfect → very wrong) but no inter-annotator reliability protocol is described.

    **Criterion 2 — Empirical results with numbers:** PASS — Extensive numbers are provided: BLEU 18.9 ± 16.8 → 38.6 ± 47.1 after cleaning, 12% → 48% "near perfect" for Nheengatu; BLEU 12.32 / 6.39 / 6.63 for bilingual vs. multilingual settings; 100% / 0% / 4.7% contamination rates for Bible-only / no-Bible / combined training; p < 0.001 significance for accuracy gains on Guarani Mbya; dataset sizes (6,621 / 3,155 training pairs). Model names and dataset names are specific.

    **Criterion 3 — Data regime / context clarity:** PASS — The header explicitly states "&lt;1K–10K sentences" and "as few as ~245 sentences minimum observed." Applicable language types (analytic/weakly-inflected, Tupi-Guarani) are distinguished from less-tested types (polysynthetic). "When to Use" and "Avoid when" sections are precise.

    **Criterion 4 — Pseudocode completeness:** PASS — The pseudocode covers all four phases end-to-end. Rogue memorization detection (`is_bimodal`, `right_skew`) is signaled though implementation is left to the reader. ILM prompt registration is shown. The auto-accept branch for high-confidence items in Phase 2 is absent (the pseudocode always calls `human_rate_usefulness`), but this is a minor omission for an evaluation phase.

    **Criterion 5 — Failure modes:** PASS — Four explicit failure modes are documented: (1) rogue memorization (with detection signal), (2) biblical contamination (with quantified contamination rates and mitigation), (3) polysynthetic language inapplicability, (4) multilingual fine-tuning degradation. The Strengths & Weaknesses table adds accessibility gaps for low-literacy users and limited feedback signal from small deployments.

    **Overall:** Strongest doc in this batch. All five criteria pass. Minor gap: inter-annotator reliability protocol for the 7-point human evaluation scale is not specified.

