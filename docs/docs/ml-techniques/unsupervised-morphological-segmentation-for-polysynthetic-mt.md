
# Unsupervised Morphological Segmentation for Polysynthetic MT

**Category:** ML Technique
**Data Regime:** &lt;1K sentences / 1K–10K sentences (ELR: fewer than a few thousand parallel sentences)
**Applicable Languages:** Polysynthetic languages in extremely low-resource (ELR) settings; demonstrated on Nahuatl, Raramuri (Tarahumara), Shipibo-Konibo, and Wixarika vs. Spanish; applicable to other polysynthetic language families with caveats

## Description

In extremely low-resource (ELR) settings, **unsupervised morphological segmentation consistently outperforms Byte-Pair Encoding (BPE)** as the preprocessing step before neural machine translation (NMT) for polysynthetic languages. This reverses the conventional wisdom that BPE is the default best subword method.

The core problem BPE faces in ELR polysynthetic settings is that its data-driven merge algorithm requires a sufficient corpus to learn morpheme-aligned subword units. Polysynthetic languages encode full clausal meaning in single word forms through extensive morpheme stacking, producing extreme type sparsity — most word forms are unique or near-unique even in a multi-thousand sentence corpus. BPE merges on such sparse data create arbitrary subword boundaries that do not align with morphemes, wasting model capacity on non-compositional units.

Unsupervised morphological segmenters (Morfessor family: Morfessor 2.0, FlatCat, LMVR) use minimum description length (MDL) or HMM-based statistical models to discover morpheme-like units from a word list alone — no parallel corpus is needed for the segmentation step. Because they are tuned on the entire language vocabulary (not just the limited parallel corpus), they capture morphological structure more reliably than BPE when parallel data is scarce.

**Key finding — supervised segmentation paradox:** Supervised morphological segmentation achieves *better* segmentation F1 scores than unsupervised methods (83–90 F1 vs. 53–68 F1) but *underperforms* in downstream MT. The likely cause is domain mismatch: supervised segmentation models are trained on clean, in-domain annotated data, but the MT parallel corpora are noisy and out-of-domain relative to that training data. This means investing in large annotated segmentation corpora does not translate to MT gains.

**Four language profiles tested (against Spanish):**
- **Wixarika (hch):** Uto-Aztecan, ~30,000 speakers, fairy tales domain; FlatCat (FC) outperforms BPE on hch→spa and spa→hch.
- **Nahuatl (nah):** Uto-Aztecan, largest corpus; BPE *competitive* for Nahuatl — the only exception; likely because Nahuatl is the best-resourced of the four.
- **Raramuri (tar):** Uto-Aztecan, ~89,500 speakers; LMVR outperforms BPE significantly on spa→tar; FlatCat best on tar→spa.
- **Shipibo-Konibo (shp):** Panoan, ~26,000 speakers, Amazonian Peru; FlatCat best overall (BLEU 12.29 / chrF 33.38 vs. BPE 11.85 / 32.59 on shp→spa).

## When to Use

- The target language is polysynthetic with high morpheme-per-word rates (> 1.5 morphemes/word average).
- The parallel corpus is extremely small (< ~5,000 sentence pairs).
- BPE vocabulary size tuning (2k–8k) still leaves substantial UNK tokens in the trained model.
- No FST exists for the language, and building a supervised segmentation dataset is infeasible or undesirable.
- Unsupervised tools (Morfessor 2.0, FlatCat, LMVR) can be run on a word list extracted from any available monolingual or dictionary data — no parallel corpus needed for the segmenter itself.

**Do not use supervised segmentation for MT:** Even if annotated morpheme segmentation data exists and a supervised model achieves high F1, the supervised model's MT performance is likely to be worse than unsupervised methods due to domain mismatch. Reserve supervised segmentation resources for other tasks (morphological analysis, glossing) rather than expecting them to improve MT.

**Nahuatl exception:** BPE remains competitive for Nahuatl. If the language is better-resourced than "extreme" (> ~10,000 parallel sentences), BPE may not be at a disadvantage.

## How to Apply

1. **Assess morphological richness.** Calculate the morpheme-per-word rate (Morphs/W) for the target language. Use available dictionary data or grammar descriptions. A rate > 1.5 signals polysynthetic behavior where BPE will underperform.

2. **Extract the word list.** Collect all unique word forms from available monolingual data (dictionaries, grammar books, transcriptions). The unsupervised segmenter is trained on this word list, not on parallel data — so a larger, more diverse word list improves segmentation quality.

3. **Train the unsupervised segmenter.** Three tools to evaluate:
   - **Morfessor 2.0** (MDL-based): simplest; a solid baseline.
   - **FlatCat** (HMM, category-based): consistently best or tied for best in the Mager et al. experiments; recommended starting point.
   - **LMVR** (lexicon-size restricted FlatCat): adds a lexicon size constraint; best for spa→tar (target = polysynthetic) direction.
   Run all three; select based on dev-set MT performance.

4. **Segment both sides of the parallel corpus.** Apply the trained segmenter to:
   - All polysynthetic language sentences (source and/or target side depending on translation direction).
   - Keep the Spanish/English side segmented with BPE — unsupervised morphological segmentation is only applied to the polysynthetic language.

5. **Tune BPE vocabulary size for the fusional language.** For the high-resource side (Spanish), use standard BPE with vocabulary sizes of 2k, 4k, 5k, 6k, 8k; select the best on the development set. The paper uses a 5k vocabulary for all experiments.

6. **Train the NMT model.** Use a Transformer encoder-decoder (e.g., fairseq implementation). Use hyperparameters recommended for low-resource settings (Guzmán et al., 2019). The polysynthetic language is always segmented; the fusional language always uses BPE. Evaluate with BLEU and chrF on de-segmented output.

7. **Evaluate both translation directions.** Segmentation choice matters differently depending on whether the polysynthetic language is source or target:
   - Polysynthetic → fusional (e.g., hch→spa): FC provides the highest chrF improvement.
   - Fusional → polysynthetic (e.g., spa→hch): LMVR provides the most significant improvement.

## Pseudocode

```
# Step 1: Assess morphological richness
word_list = extract_words(monolingual_corpus + dictionary)
morpheme_annotations = sample_morpheme_analysis(word_list, n=100)  # grammar-based or tool-based
morphs_per_word = mean([len(morphemes) for morphemes in morpheme_annotations])
# if morphs_per_word > 1.5 → proceed with unsupervised segmentation

# Step 2: Train unsupervised segmenters
from morfessor import MorfessorIO, BaselineModel

# Morfessor 2.0
io = MorfessorIO()
words = io.read_corpus_file(word_list_path)
model_morfessor = BaselineModel()
model_morfessor.train_online(words)

# FlatCat (recommended)
# Use morfessor-flatcat CLI:
# morfessor-flatcat -d word_list.txt -s flatcat_model.bin

# LMVR
# Modify FlatCat with lexicon size restriction parameter (see LMVR paper)

# Step 3: Segment parallel corpus
def segment_corpus(sentences, segmenter):
    return [" ".join(segmenter.viterbi_segment(word)[0]
                     for word in sent.split())
            for sent in sentences]

polysynthetic_train = segment_corpus(train_polysynthetic, segmenter=flatcat_model)
polysynthetic_dev   = segment_corpus(dev_polysynthetic, segmenter=flatcat_model)
polysynthetic_test  = segment_corpus(test_polysynthetic, segmenter=flatcat_model)

# Step 4: BPE for fusional side
from subword_nmt import learn_bpe, apply_bpe
# Learn BPE on Spanish side
learn_bpe(open(spanish_train), open("bpe_codes.txt", "w"), num_symbols=5000)
spanish_train_bpe = apply_bpe(spanish_train, "bpe_codes.txt")

# Step 5: Train NMT
# Using fairseq:
# fairseq-train data-bin/ \
#   --arch transformer \
#   --optimizer adam --lr 5e-4 \
#   --max-tokens 4096 \
#   --save-dir checkpoints/

# Step 6: Evaluate (de-segment before BLEU/chrF)
def desegment(segmented_sentence):
    return segmented_sentence.replace(" ", "").replace(MORPHEME_BOUNDARY, "")
    # or use language-specific de-segmentation rules

bleu = sacrebleu.corpus_bleu(hypotheses, [references])
chrf = sacrebleu.corpus_chrf(hypotheses, references)
```

## Evidence

**Mager et al. (2022), Findings of ACL 2022 — 4 polysynthetic languages, 8 translation directions (each language ↔ Spanish):**

Metric: chrF score differences vs. BPE baseline (paired approximation test, 10,000 trials; p ≤ 0.05 indicates statistical significance). Full MT scores from Table 6 (Appendix):

**hch (Wixarika) ↔ spa:**
| System | hch→spa BLEU | hch→spa chrF | spa→hch BLEU | spa→hch chrF |
|---|---|---|---|---|
| BPE | 15.04 | 30.50 | 16.98 | 31.18 |
| Morfessor | 15.12 | 29.23* | 12.26* | 29.60* |
| FlatCat | 15.89* | **31.44*** | **18.70*** | **35.12*** |
| LMVR | **16.61*** | 30.96 | 17.44 | 33.79* |

**nah (Nahuatl) ↔ spa:**
| System | nah→spa BLEU | nah→spa chrF | spa→nah BLEU | spa→nah chrF |
|---|---|---|---|---|
| BPE | **15.37** | **37.63** | **13.29** | **40.25** |
| FlatCat | 14.89 | 36.99* | 12.42 | 39.59* |
| LMVR | 14.78* | 36.76* | 12.26* | 40.11 |

*Nahuatl exception: BPE is the best or tied-best system — unsupervised methods do not improve over BPE.*

**tar (Raramuri) ↔ spa:**
| System | tar→spa BLEU | tar→spa chrF | spa→tar BLEU | spa→tar chrF |
|---|---|---|---|---|
| BPE | 11.44 | 32.64 | 10.70 | 29.60 |
| FlatCat | **15.55*** | **35.09*** | 8.66 | 29.52 |
| LMVR | 12.97* | 33.93* | **12.84*** | **33.76*** |

**shp (Shipibo-Konibo) ↔ spa:**
| System | shp→spa BLEU | shp→spa chrF | spa→shp BLEU | spa→shp chrF |
|---|---|---|---|---|
| BPE | 11.85 | 32.59 | 10.84 | 36.54 |
| FlatCat | **12.29*** | **33.38*** | 11.68 | 37.58 |
| LMVR | 11.14 | 32.60 | **12.84*** | **38.99*** |

**Summary:** Unsupervised morphological segmentation (FlatCat or LMVR) outperforms BPE on 5 out of 8 translation directions with statistical significance (p ≤ 0.05). Nahuatl is the sole exception where BPE remains best.

**Supervised segmentation underperformance:** Supervised models (s2s, s2s+multi, CRF, PtrSeg) achieve the highest morphological segmentation F1 scores (CRFs: 87.8 F1 for nah; s2s+multi: 83.75 F1 for hch; PtrSeg: 90.13 F1 for tar — Table 3). Despite this, supervised segmentation produces the worst MT results across all settings. The supervised models introduce the most UNK tokens at MT inference time due to their generative power creating novel subword strings.

**Alignment with other work:** Goldman et al. (2024) independently show that tokenizer compression quality predicts downstream task performance for polysynthetic languages — unsupervised morphological segmenter output is more compressible for polysynthetic languages than BPE output, explaining why it outperforms BPE on MT.

**Caveat on generalizability:** All four languages are Uto-Aztecan (Nahuatl, Raramuri, Wixarika) or Panoan (Shipibo-Konibo) and all are tested against Spanish. Results may not directly transfer to Iroquoian (Mohawk) or Algonquian languages, which have different morphological properties and would be paired with English or French.

## Variations & Configuration

- **FlatCat:** Best default for hch→spa, tar→spa, shp→spa. Available in the Morfessor toolkit.
- **LMVR:** Best for spa→tar, spa→shp (fusional → polysynthetic direction). Adds lexicon size restriction to FlatCat; increases tendency to segment common words into morphemes.
- **Morfessor 2.0:** Simplest unsupervised option; generally weaker than FlatCat/LMVR in this study but still competitive with BPE for some directions.
- **BPE vocabulary tuning:** Use 2k, 4k, 5k, 6k, 8k vocabulary sizes and select on dev set when BPE must be used as a fallback or for comparison.
- **Joint segmentation:** Segment both source and target using unsupervised morphology; or segment only the polysynthetic side and use BPE on the fusional side. Mager et al. always use BPE on the Spanish side.
- **Combination with FST:** For languages where an FST exists (Algonquian, some Iroquoian), use FST for known forms and Morfessor/FlatCat as a fallback for unknown forms (hybrid approach). The FST provides deterministic, linguistically grounded segmentation; unsupervised fills gaps.

## Code & Tools

- **Morfessor 2.0 + FlatCat:** https://github.com/aalto-speech/morfessor — Python toolkit; includes Morfessor 2.0, FlatCat, and LMVR variants
- **MexSeg datasets (Nahuatl, Wixarika, Raramuri segmentation data):** http://turing.iimas.unam.mx/wix/MexSeg — also https://github.com/HigorCC/mexseg
- **Raramuri–Spanish parallel corpus + segmentation data (new, this paper):** https://github.com/HigorCC/mexseg (contributed by Mager et al. 2022)
- **fairseq:** https://github.com/facebookresearch/fairseq — NMT training toolkit used in Mager et al. experiments
- **subword-nmt (BPE baseline):** https://github.com/rsennrich/subword-nmt
- **sacreBLEU:** https://github.com/mjpost/sacrebleu — BLEU + chrF evaluation

## Strengths & Weaknesses

| Strengths | Weaknesses |
| --- | --- |
| Outperforms BPE on 5 of 8 polysynthetic language directions with statistical significance | Nahuatl exception: BPE remains best when the language is better-resourced; no universal winner |
| Requires no annotated segmentation data — trains on a word list alone | All evidence comes from Uto-Aztecan and Panoan languages; Iroquoian/Algonquian applicability is untested |
| FlatCat and LMVR are open-source and straightforward to apply | Morfessor family tools require some tuning (reconstruction weight, lexicon size) for optimal results |
| Supervised segmentation paradox is a critical insight: high F1 ≠ MT gains | Supervised segmentation data cannot easily be repurposed to improve MT, which may frustrate practitioners who invest in annotation |
| Better vocabulary coverage than BPE for ELR settings: fewer UNK tokens per sentence | For moderate-resource languages (> ~10K parallel sentences), BPE regains its advantage |
| Complementary to FST-based segmentation: can be used as fallback for unseen forms | Performance gap between unsupervised segmenter tools varies by language and direction; requires empirical comparison |

## References

- Mager, M., Oncevay, A., Mager, E., Kann, K., & Vu, N. T. (2022). BPE vs. Morphological Segmentation: A Case Study on Machine Translation of Four Polysynthetic Languages. *Findings of ACL 2022*, pages 961–971.
- Smit, P., Virpioja, S., Grönroos, S.-A., & Kurimo, M. (2014). Morfessor 2.0: Toolkit for statistical morphological segmentation. *EACL 2014 Demonstrations*.
- Grönroos, S.-A., Virpioja, S., Smit, P., & Kurimo, M. (2014). Morfessor FlatCat: An HMM-based method for unsupervised and semi-supervised learning of morphology. *COLING 2014*.
- Sennrich, R., Haddow, B., & Birch, A. (2016). Neural machine translation of rare words with subword units. *ACL 2016*.
- Saleva, J., & Lignos, C. (2021). The effectiveness of morphology-aware segmentation in low-resource neural machine translation. *EACL 2021 Student Research Workshop*.
- Goldman, O., et al. (2024). Tokenizer Compression as a Performance Predictor. — provides independent evidence that compression quality explains why unsupervised morphological segmentation outperforms BPE for polysynthetic languages.
- Guzmán, F., et al. (2019). The FLORES evaluation datasets for low-resource MT. *EMNLP-IJCNLP 2019*.

??? note "📋 Self-Review Notes"
    **Reviewed:** 2026-06-11

    **Criterion 1 — Implementable from scratch:** PASS — The pipeline is fully described: morphological richness assessment, word list extraction, training all three segmenters (Morfessor 2.0, FlatCat, LMVR) with tool names and CLI flags, corpus segmentation, BPE vocabulary tuning for the fusional side, fairseq NMT training, and de-segmentation before evaluation. Enough specificity to reproduce without the original paper.

    **Criterion 2 — Empirical results with numbers:** PASS — Full BLEU and chrF tables for all four languages × two directions from Mager et al. (2022), with statistical significance markers (p ≤ 0.05, paired approximation test, 10,000 trials). The Nahuatl exception is clearly quantified. Supervised segmentation F1 scores (CRF 87.8, s2s+multi 83.75, PtrSeg 90.13) are provided alongside their paradoxically worse MT results.

    **Criterion 3 — Data regime clarity:** PASS — Explicitly stated as &lt;1K to ~5K parallel sentences (ELR). Corpus size threshold for BPE to regain advantage (~10K pairs) is stated. Unsupervised segmenter trains on a word list only (not parallel data), which is clearly distinguished. Language-specific speaker counts and domains are provided.

    **Criterion 4 — Pseudocode completeness:** PARTIAL — The morphological assessment block is informative but uses `sample_morpheme_analysis` as an undefined stub. The FlatCat and LMVR pseudocode entries are CLI comments rather than code (FlatCat is a CLI call; LMVR is a prose note to modify FlatCat). The `desegment` function references a `MORPHEME_BOUNDARY` constant that is never defined. These gaps are minor but would require consulting the Morfessor documentation to fill.

    **Criterion 5 — Failure modes:** PASS — Well-documented: Nahuatl exception (BPE wins when better-resourced), supervised segmentation paradox (high F1 does not transfer to MT), generalizability caveat (only Uto-Aztecan/Panoan tested, Iroquoian/Algonquian untested), UNK token problem for moderate-resource settings, and tool-specific tuning requirements. The Strengths & Weaknesses table is thorough.

    **Overall:** Strong doc. The main gap is the pseudocode: `MORPHEME_BOUNDARY` should be defined (e.g., `MORPHEME_BOUNDARY = "@@"`), and the LMVR section should at minimum reference the paper or parameter name rather than just saying "modify FlatCat." Everything else is implementation-ready.

