
# ICL-MT Bootstrapping: Dictionary + Examples → Synthetic Parallel Data → NMT

**Category:** ML Technique
**Data Regime:** zero-resource to &lt;1K parallel sentences (requires a dictionary and monolingual corpus; no parallel corpus needed to start)
**Applicable Languages:** Any extremely low-resource language effectively unseen by LLMs; demonstrated on Manchu (Tungusic, critically endangered); most applicable to agglutinative and polysynthetic languages with available dictionaries

## Description

ICL-MT Bootstrapping is a two-stage pipeline that converts zero or near-zero parallel data into a trained conventional MT model, using in-context learning (ICL) with an LLM as an intermediate translation step:

**Stage 1 — ICL-MT:** Use an LLM in-context with a structured prompt (morphological analysis + dictionary entries + parallel examples) to translate a large monolingual corpus, producing synthetic parallel data. No fine-tuning of the LLM is required.

**Stage 2 — NMT fine-tuning:** Use the synthetic parallel data to fine-tune a small encoder-decoder multilingual model (e.g., mT5-small, ~300M parameters), producing a dedicated low-resource MT model that is cheaper at inference time than the LLM and, when enough synthetic data is added, achieves comparable or better translation quality.

The method exploits a key asymmetry: monolingual data in low-resource languages is often far more abundant than parallel data (e.g., 42,240 monolingual Manchu sentences vs. 3,520 parallel sentence pairs), but LLMs are too expensive to run at scale for production MT. ICL-MT bridges this gap by using the LLM once to generate training data.

**Component ranking (from ablation study):** The quality of Stage 1 ICL output depends critically on the prompt components. In order of measured impact (Pei et al. 2025):
1. **High-quality dictionary** (lexical entries + suffix explanations + collocations): the single most impactful component
2. **BM25-retrieved parallel examples** (semantically similar sentences to the input): second-most impactful
3. **Grammar excerpts:** marginal benefit; sometimes neutral; never strongly positive
4. **Chain-of-Thought prompting:** harmful — introduces errors at each reasoning step; do not use

**Encipherment control methodology:** To verify that LLM performance is genuinely due to in-context learning rather than pretraining knowledge of the target language, Pei et al. encipher all Manchu tokens by a character-level substitution cipher (vowels: a→e, e→i, i→o, o→u, u→a; consonants shifted similarly) and test whether the model can still translate using enciphered prompts. The enciphered performance is slightly lower but close to original performance, confirming that LLMs rely primarily on ICL ability rather than prior language knowledge. This methodology is useful for any language suspected of being partially in LLM pretraining data.

## When to Use

- The language has a dictionary (even partial) but very few or no parallel sentence pairs.
- A monolingual corpus in the language exists (oral transcriptions, digitized texts, web content) that can be used for Stage 2 fine-tuning.
- The production deployment scenario requires fast, low-cost inference — the ICL-MT step is expensive; the fine-tuned NMT model is much cheaper.
- You want to maximize the value of dictionary investment: the finding that dictionaries matter more than grammar books means that a high-quality dictionary is the highest-priority data resource.
- You need to verify whether an LLM's apparent capability with a language reflects genuine ICL or pretraining contamination — use the encipherment control.

**Less applicable when:**
- No dictionary exists; grammar books alone are insufficient for quality ICL-MT.
- The language is polysynthetic with extreme morphological complexity (Manchu is agglutinative; the approach is untested on fully polysynthetic languages like Mohawk where verb morphology would complicate sentence alignment).
- The goal is community-facing translation — synthetic data from an LLM may introduce errors or culturally inappropriate usages; community validation is needed before deployment.

## How to Apply

### Stage 1: ICL-MT with LLM

1. **Build the structured dictionary.** Compile dictionary entries in three layers:
   - **Lexical entries:** word stems with their meaning(s) in the target language.
   - **Suffix explanations:** for each suffix/morpheme appearing in the input sentence, include a brief description of its function (e.g., "-ha: perfect participle").
   - **Collocations:** common multi-word expressions involving dictionary entries.
   This three-layer structure (D^l+s+c) provides the best translation quality; lexical entries alone (D^l) are substantially weaker.

2. **Build a morphological analyzer.** Implement a rule-based analyzer that splits input words into stems and suffixes by recursively stripping known suffixes (obtainable from the dictionary). This serves two purposes: it enables dictionary look-up of stems for inflected words, and it allows BM25 retrieval to operate over morphemes rather than surface forms.

3. **Retrieve parallel examples.** For each source sentence, retrieve the top-10 most similar parallel sentences from any available parallel corpus using BM25 (Rank-BM25 implementation). Retrieve on morpheme-segmented queries (output of the morphological analyzer). BM25-retrieved examples (P^bm) outperform random examples (P^r) and dictionary-sourced examples (P^d). Use the morpheme-segmented sentence as the BM25 query.

4. **Construct the prompt.** Combine components in this order:
   ```
   [Morphological analysis of input sentence]
   [Dictionary entries: lexical + suffixes + collocations for morphemes in sentence]
   [Top-10 BM25-retrieved parallel examples]
   [Translation instruction]
   ```
   Do **not** include grammar excerpts (marginal benefit) or Chain-of-Thought instructions (harmful).

5. **Translate the monolingual corpus.** Call the LLM (GPT-4o, DeepSeek-V3, or Llama3-70B) to translate each sentence from the monolingual corpus. Use the best-performing model available; DeepSeek-V3 achieves BLEU 12.35 / chrF 37.93 / SBERT 65.64 on Manchu-English (Table 5).

### Stage 2: NMT Fine-tuning

6. **Combine real and synthetic parallel data.** Mix the real parallel corpus (3,520 sentence pairs for Manchu) with the synthetic pairs generated in Stage 1 (up to 42,240 sentences translated × desired synthetic-to-real ratio).

7. **Fine-tune mT5-small.** Use the mT5-small encoder-decoder multilingual model (~300M parameters). Train on the combined real + synthetic corpus using standard seq2seq fine-tuning.

8. **Select the optimal synthetic data ratio.** The optimal mixing ratio is approximately 12× synthetic to 1× real (i.e., train on all 42,240 synthetic sentences plus 3,520 real sentences). At this ratio, the fine-tuned mT5-small achieves results comparable to or better than Llama3-70B ICL-MT (Figure 3 in Pei et al. 2025). Below 10× synthetic, the model underperforms ICL baselines.

9. **Evaluate.** Use BLEU, chrF, and SBERT on the held-out evaluation set (337 sentence pairs for Manchu). SBERT is more reliable than BLEU/chrF for evaluating low-resource translation quality because BLEU and chrF underestimate semantic equivalence when phrasing differs (Table 6, Pei et al. 2025).

## Pseudocode

```
# ===== STAGE 1: ICL-MT with LLM =====

# Build morphological analyzer (rule-based, recursive suffix stripping)
def morphological_analysis(word, suffix_list, stem_dict):
    for suffix in suffix_list:
        if word.endswith(suffix) and word[:-len(suffix)] in stem_dict:
            return word[:-len(suffix)], [suffix]  # stem, [suffix]
    return word, []  # unsegmented

def analyze_sentence(sentence, suffix_list, stem_dict):
    return [morphological_analysis(w, suffix_list, stem_dict)
            for w in sentence.split()]

# Build dictionary prompt component
def build_dictionary_prompt(morpheme_analysis, dictionary, suffix_explanations, collocations):
    entries = []
    for stem, suffixes in morpheme_analysis:
        if stem in dictionary:
            entry = f"{stem}: {dictionary[stem]['lexical_entry']}"
            if 'collocations' in dictionary[stem]:
                entry += f"; collocations: {dictionary[stem]['collocations']}"
            entries.append(entry)
        for suffix in suffixes:
            if suffix in suffix_explanations:
                entries.append(f"-{suffix}: {suffix_explanations[suffix]}")
    return "\n".join(entries)

# BM25 retrieval of parallel examples
from rank_bm25 import BM25Okapi

def retrieve_examples(query_morphemes, parallel_corpus_morphemized, parallel_corpus, k=10):
    bm25 = BM25Okapi([sent.split() for sent in parallel_corpus_morphemized])
    scores = bm25.get_scores(query_morphemes.split())
    top_k = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:k]
    return [parallel_corpus[i] for i in top_k]

# Construct full ICL prompt
def build_icl_prompt(source_sentence, morpheme_analysis, dict_prompt, examples):
    morph_str = " ".join(f"{stem}+{''.join(sfx)}" for stem, sfx in morpheme_analysis)
    examples_str = "\n".join(f"SRC: {ex['src']}\nTGT: {ex['tgt']}" for ex in examples)
    return f"""Morphological analysis: {morph_str}

Dictionary entries:
{dict_prompt}

Parallel examples:
{examples_str}

Translate the following sentence:
{source_sentence}
Translation:"""

# Translate monolingual corpus
synthetic_pairs = []
for sentence in monolingual_corpus:
    analysis = analyze_sentence(sentence, suffix_list, stem_dict)
    dict_prompt = build_dictionary_prompt(analysis, dictionary, suffix_explanations, collocations)
    morphemized_query = " ".join(stem for stem, _ in analysis)
    examples = retrieve_examples(morphemized_query, parallel_morphemized, parallel_corpus, k=10)
    prompt = build_icl_prompt(sentence, analysis, dict_prompt, examples)
    translation = llm.generate(prompt)  # GPT-4o, DeepSeek-V3, or Llama3-70B
    synthetic_pairs.append({"src": sentence, "tgt": translation})

# ===== STAGE 2: NMT Fine-tuning =====

# Mix real and synthetic data (12:1 synthetic:real ratio)
training_data = real_parallel_corpus + synthetic_pairs  # ~42K + 3.5K

# Fine-tune mT5-small
from transformers import MT5ForConditionalGeneration, AutoTokenizer

tokenizer = AutoTokenizer.from_pretrained("google/mt5-small")
model = MT5ForConditionalGeneration.from_pretrained("google/mt5-small")

# Standard seq2seq fine-tuning
train_dataset = encode_pairs(training_data, tokenizer)
trainer = Seq2SeqTrainer(model=model, train_dataset=train_dataset, ...)
trainer.train()

# Evaluate with BLEU, chrF, SBERT
from sacrebleu import corpus_bleu, corpus_chrf
from sentence_transformers import SentenceTransformer, util

sbert = SentenceTransformer("all-MiniLM-L6-v2")
hypotheses = [model.translate(s) for s in test_sources]
bleu = corpus_bleu(hypotheses, [test_references])
chrf = corpus_chrf(hypotheses, test_references)
sbert_scores = [util.cos_sim(sbert.encode(h), sbert.encode(r)).item() * 100
                for h, r in zip(hypotheses, test_references)]
```

## Evidence

**Pei et al. (2025), ACL 2025 — Manchu-English translation, evaluation set of 337 parallel sentences:**

**Encipherment control results (Table 7 — Direct Assessment by 3 human Manchu experts, Pearson r = 0.864 inter-rater agreement):**
| Variant | DA score (0–100) | z-score |
|---|---|---|
| Direct prompt π(x) | 29.04 | -0.63 |
| Enciphered π(μ(x)_e, D^l+s+c, P^bm) | 56.12 | 0.19 |
| Full pipeline π(μ(x), D^l+s+c, P^bm) | **64.47** | **0.44** |

Human evaluation confirms that the full pipeline (real Manchu) outperforms enciphered (fake Manchu) but the gap is not statistically significant (p = 0.27), confirming that LLMs rely primarily on ICL ability rather than prior Manchu knowledge.

**Dictionary ablation (Table 1, GPT-4o, automatic metrics):**
| Variant | BLEU | chrF | SBERT |
|---|---|---|---|
| Direct prompt π(x) | 3.44 | 21.86 | 34.21 |
| + morphological analysis π(μ(x)) | 3.10 | 21.68 | 33.49 |
| + lexical dictionary D^l | 7.40 | 31.84 | 58.91 |
| + suffixes D^l+s | 7.47 | **32.93** | 59.78 |
| + collocations D^l+s+c | **7.55** | 32.71 | **61.07** |

Dictionary D^l+s+c is the new baseline; morphological analysis alone does not help without dictionary.

**Parallel example retrieval ablation (Table 2, GPT-4o):**
| Variant | BLEU | chrF | SBERT |
|---|---|---|---|
| Baseline π(μ(x), D^l+s+c) | 7.55 | 32.71 | 61.07 |
| + random examples P^r | 7.66 | 32.94 | 60.85 |
| + dictionary-sourced examples P^d | 8.10 | 32.95 | 61.04 |
| + BM25 examples P^bm | **8.84** | **33.72** | **61.35** |

BM25-retrieved examples provide the most consistent gains across all three metrics.

**Grammar book ablation (Table 3, GPT-4o):**
| Variant | BLEU | chrF | SBERT |
|---|---|---|---|
| Best baseline π(μ(x), D*, P*) | 8.84 | 33.72 | 61.35 |
| + short grammar G^s | 8.26 | 33.12 | 60.70 |
| + long grammar G^l | 8.46 | 33.79 | 61.17 |
| + grammar + parallel G^l+p | **8.90** | 33.77 | 60.40 |

Grammar book provides marginal benefit at best and is inconsistent across metrics. Grammar excerpts are excluded from the final recommended pipeline.

**Chain-of-Thought ablation (Table 4, GPT-4o):**
| Variant | BLEU | chrF | SBERT |
|---|---|---|---|
| Best baseline (no CoT) | 8.90 | 33.77 | 60.40 |
| + annotation CoT C^a | 8.01 | 33.13 | 59.81 |
| + annotation+syntax CoT C^a+s | 8.49 | 33.43 | 59.01 |

CoT hurts performance on all variants. Do not use CoT for translation.

**Model comparison (Table 5, best prompt setting):**
| Model | BLEU | chrF | SBERT |
|---|---|---|---|
| Llama3-1B | 0.27 | 9.95 | 16.37 |
| Llama3-3B | 1.81 | 21.95 | 38.46 |
| Llama3-8B | 3.05 | 26.59 | 49.10 |
| Llama3-70B | 6.31 | 31.01 | 56.82 |
| GPT-4o | 8.84 | 33.72 | 61.35 |
| DeepSeek-V3 | **12.35** | **37.93** | **65.64** |

Model size strongly correlates with translation quality; minimum viable model is approximately Llama3-8B.

**NMT bootstrapping results (Figure 3 — mT5-small fine-tuned on varying synthetic:real ratios):**
- Real data only (3,520 pairs): BLEU ≈ 4.0, chrF ≈ 22.5, SBERT ≈ 50.5 — insufficient for a useful model.
- syn(2):real(1): BLEU ≈ 4.8, chrF ≈ 24.6
- syn(4):real(1): BLEU ≈ 5.6, chrF ≈ 27.2
- syn(6):real(1): BLEU ≈ 6.9, chrF ≈ 28.8
- syn(8):real(1): BLEU ≈ 6.9, chrF ≈ 29.3
- syn(10):real(1): BLEU ≈ 7.5, chrF ≈ 32.8
- syn(12):real(1): BLEU ≈ 7.9, chrF ≈ 30.6, SBERT ≈ 55.9 — matches/exceeds Llama3-70B

The fine-tuned mT5-small (~300M parameters) at 12× synthetic data matches or exceeds Llama3-70B (70B parameters) at approximately 1/233 the model size, making it ~233× more efficient at inference.

**Relation to CoD (Lu et al. 2024):** Both papers show dictionaries are the most impactful prompt component for low-resource LLM MT. Pei et al. add that (1) suffix/collocation information in the dictionary is important beyond just lexical entries, and (2) the bootstrapping pathway from ICL output to a conventional NMT model is viable and efficient.

## Variations & Configuration

- **Dictionary depth:** Lexical entries alone provide a large baseline gain; adding suffix explanations (+suffix) and collocations (+colloc) incrementally improve both BLEU and SBERT. Invest in all three layers if resources allow.
- **Parallel example retrieval:** BM25 over morpheme-segmented sentences is the best retrieval method. The retrieval library rank_bm25 is a drop-in implementation. Do not use random examples if any parallel data is available.
- **Model selection:** Use the largest model affordable at ICL-MT time; the NMT stage reduces inference cost. DeepSeek-V3 outperforms GPT-4o in this experiment.
- **Synthetic:real ratio:** 12:1 is the empirically optimal mixing ratio for Manchu; this will vary by language and parallel data size. Use the development set to tune the ratio.
- **Encipherment validation:** Before deploying any ICL-MT system, run the encipherment control (character substitution cipher) to verify that apparent translation ability is genuinely from ICL rather than pretraining contamination. This takes ~1 hour of additional experiment and prevents false confidence.
- **mT5 model size:** mT5-small works for this task. mT5-base or mT5-large may provide further gains but at higher training cost.

## Code & Tools

- **Official code (Pei et al. 2025):** https://github.com/cisnlp/manchu-in-context-mt
- **Manchu-English parallel corpus and evaluation set:** https://github.com/ulingga/Manchu-English_babyMT (70 sentences); https://gerel.net/ (additional Manchu resources)
- **Manchu dictionary (buleku.org):** https://buleku.org/home — the comprehensive Norman (2020) Manchu-English dictionary used in the experiments
- **Rank-BM25 (retrieval):** https://github.com/dorianbrown/rank_bm25 — BM25 implementation used for parallel example retrieval
- **mT5-small:** https://huggingface.co/google/mt5-small — multilingual T5 encoder-decoder; ~300M parameters; fine-tuning target for Stage 2
- **sacreBLEU:** https://github.com/mjpost/sacrebleu — BLEU + chrF evaluation
- **Sentence-BERT (SBERT):** https://github.com/UKPLab/sentence-transformers — semantic similarity metric; more reliable than BLEU for low-resource MT evaluation

## Strengths & Weaknesses

| Strengths | Weaknesses |
| --- | --- |
| Converts zero parallel data into a trainable NMT model using only a dictionary and monolingual corpus | Stage 1 LLM calls are expensive; cost scales linearly with monolingual corpus size |
| Resulting mT5-small model is ~233× smaller than Llama3-70B with comparable performance | Demonstrated only on Manchu (agglutinative, not polysynthetic); applicability to Mohawk/Iroquoian untested |
| Component ranking is empirically verified: invest in dictionaries > parallel examples > grammar > CoT (don't use) | Dictionary must include suffix explanations and collocations — a plain word list is insufficient |
| Encipherment methodology provides a rigorous test of whether ICL contributions are genuine | Synthetic data quality depends on LLM quality; cultural fidelity and community appropriateness are not evaluated |
| BM25 example retrieval is computationally cheap and outperforms random and dictionary-sourced examples | Grammar book preparation (manually curating 26 feature–excerpt tuples) is labor-intensive even though it adds minimal MT benefit |
| SBERT is a better metric than BLEU/chrF for low-resource translation evaluation | No community involvement in evaluation; human raters were academic language experts, not community members |

## References

- Pei, R., Liu, Y., Lin, P., Yvon, F., & Schütze, H. (2025). Understanding In-Context Machine Translation for Low-Resource Languages: A Case Study on Manchu. *Proceedings of ACL 2025 (Volume 1: Long Papers)*, pages 8767–8788.
- Xue, L., et al. (2021). mT5: A Massively Multilingual Pre-Trained Text-to-Text Transformer. *NAACL 2021*.
- Lu, H., et al. (2024). Chain-of-Dictionary Prompting Elicits Translation in Large Language Models. *EMNLP 2024*. — Convergent finding: dictionaries are the most impactful ICL-MT resource.
- Elsner, M., & Needle, J. (2023). Translating a Low-Resource Language Using GPT-3 and a Human-Readable Dictionary. *SIGMORPHON 2023*.
- Robertson, S. E., et al. (1995). Okapi at TREC-3. — BM25 algorithm used for parallel example retrieval.
- Reimers, N., & Gurevych, I. (2019). Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks. *EMNLP 2019*. — SBERT metric for translation quality evaluation.

??? note "📋 Self-Review Notes"
    **Reviewed:** 2026-06-11

    **Criterion 1 — Implementable from scratch:** PASS — Both stages are concretely described. Stage 1: morphological analyzer (recursive suffix stripping), three-layer dictionary construction (lexical + suffix + collocations), BM25 retrieval over morpheme-segmented queries, prompt assembly order, and explicit warnings against CoT and grammar excerpts. Stage 2: mT5-small fine-tuning with the 12:1 synthetic:real ratio, evaluation with BLEU/chrF/SBERT. The encipherment control methodology is also fully specified. A practitioner could implement this without reading the original paper.

    **Criterion 2 — Empirical results with numbers:** PASS — Five ablation tables (dictionary layers, retrieval methods, grammar book, CoT, model comparison) plus Figure 3 bootstrapping curve data points at each synthetic:real ratio (2×–12×). Human evaluation DA scores with inter-rater agreement (Pearson r = 0.864) and p-values are included. Evaluation set size (337 pairs), training corpus sizes (3,520 real + 42,240 synthetic), and model names are all explicit.

    **Criterion 3 — Data regime clarity:** PASS — Zero-resource to &lt;1K parallel sentences. Manchu-specific corpus sizes stated precisely. The 12:1 ratio recommendation and its dev-set tuning caveat are present. Distinction between LLM cost (scales with monolingual corpus) and NMT inference cost (~233× smaller model) is quantified. "Less applicable" section explicitly flags missing-dictionary and polysynthetic-complexity cases.

    **Criterion 4 — Pseudocode completeness:** PARTIAL — Stage 1 pseudocode is detailed and runnable (BM25 retrieval, prompt construction, morphological analysis). Stage 2 uses a placeholder `encode_pairs(training_data, tokenizer)` and `Seq2SeqTrainer(model=model, train_dataset=train_dataset, ...)` with ellipsis — standard HuggingFace patterns, but training hyperparameters (learning rate, batch size, epochs) are not specified anywhere in the doc. The SBERT evaluation uses `"all-MiniLM-L6-v2"` but the paper likely used a different model; this could produce non-comparable scores if a reader reproduces the experiment.

    **Criterion 5 — Failure modes:** PASS — Well documented: CoT harmfulness (empirically quantified), grammar book marginal/inconsistent benefit, cost scaling of Stage 1, plain word-list dictionary insufficiency, polysynthetic language applicability limits (agglutinative vs. polysynthetic distinction), LLM quality floor (~Llama3-8B minimum), and community fidelity gaps. The Strengths & Weaknesses table is thorough and honest.

    **Overall:** Very strong doc. Two minor gaps: (1) Stage 2 training hyperparameters are missing — adding a note that Pei et al. use standard HuggingFace seq2seq defaults with a specific lr/batch would close this; (2) the SBERT model identifier in pseudocode (`all-MiniLM-L6-v2`) should be flagged as a placeholder rather than the exact model used in the paper, to prevent reproducibility confusion.

