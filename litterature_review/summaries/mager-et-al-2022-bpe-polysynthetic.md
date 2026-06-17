# BPE vs. Morphological Segmentation for Machine Translation of Polysynthetic Languages

**Authors:** Manuel Mager, Arturo Oncevay, Elisabeth Mager, Katharina Kann, Ngoc Thang Vu
**Year:** 2022
**Venue:** Findings of ACL 2022

---

## Core Argument

For polysynthetic languages in extremely low-resource (ELR) settings, unsupervised morphological segmentation outperforms Byte-Pair Encoding (BPE) in machine translation — contradicting the conventional wisdom that BPE is the default best option for subword segmentation. Supervised morphological segmentation achieves better segmentation scores but underperforms in MT, suggesting overfitting to clean out-of-domain data. The study tests four polysynthetic languages (Nahuatl, Raramuri, Shipibo-Konibo, Wixarika) against Spanish.

## Key Concepts

- **BPE (Byte-Pair Encoding):** The dominant subword segmentation method in modern NLP; data-driven, language-agnostic, unsupervised. Learns to merge frequent character pairs into subwords. Default choice for NMT preprocessing.
- **Unsupervised morphological segmentation:** Methods like Morfessor that segment words into morpheme-like units without labeled training data, using statistical patterns. For ELR polysynthetic languages, these can capture morphological structure better than BPE.
- **Supervised morphological segmentation:** Methods trained on gold-standard morpheme-segmented data (annotation by linguists or community speakers). Achieves higher segmentation F1 scores but does not improve MT — likely because the clean, in-domain segmentation training data does not match the noisy, out-of-domain MT test data.
- **Extremely low-resource (ELR):** Fewer than a few thousand parallel sentences for training MT; typical for most endangered polysynthetic languages.
- **High morpheme-per-word rate:** In polysynthetic languages, word forms encode what would be full clauses in English; vocabulary sparsity is extreme. BPE's data-driven merges create subword units that don't align with morpheme boundaries, wasting model capacity.
- **OOV-M (morpheme OOV):** OOV rate measured at the morpheme level after segmentation — a more meaningful measure than word-level OOV for polysynthetic languages.

## Main Findings

- For all four ELR polysynthetic languages except Nahuatl, unsupervised morphological segmentation consistently outperforms BPE as MT input — reversing the usual finding for moderate-resource languages.
- Supervised morphological segmentation achieves better segmentation quality scores (F1) than unsupervised, but performs worse in MT — likely due to overfitting to clean, out-of-domain data.
- BPE's advantage in moderate-resource settings (Nepali, Kazakh) disappears or reverses in ELR polysynthetic settings because BPE cannot learn morpheme-aligned subword units from such small corpora.
- Nahuatl is the exception: BPE is competitive for Nahuatl, possibly because it is less under-resourced than the other three languages.
- The paper contributes two new morphological segmentation datasets (Raramuri and Shipibo-Konibo) and a new parallel corpus (Raramuri–Spanish).

## Relevance to Indigenous AI

The practical implication for Mohawk is clear: do not use standard BPE as the tokenization strategy. For an ELR polysynthetic language, unsupervised morphological segmentation (or a hybrid rule-based / unsupervised approach) will outperform BPE as a preprocessing step for any neural model. The finding that supervised segmentation underperforms in MT despite better segmentation scores is a counterintuitive but important result: investing heavily in annotating a clean segmentation corpus for supervised learning may not yield MT gains — the bottleneck is the mismatch between the annotation domain and the real-world usage domain. This directly informs how to prioritize annotation effort for Mohawk. The result that unsupervised morphological tools work better than BPE for ELR polysynthetic languages aligns with Goldman et al.'s (2024) finding that compression quality matters — unsupervised morphological segmentation achieves higher compression for polysynthetic languages than BPE.

## Limitations & Critiques

- All four languages are Mesoamerican Uto-Aztecan; the results may not transfer to other polysynthetic families (Iroquoian, Algonquian, Eskimo-Aleut) with different morphological properties.
- The MT evaluation is translation to/from Spanish, which is typologically distant from all four polysynthetic languages; translation to/from English might produce different results.
- The supervised segmentation underperformance in MT is attributed to overfitting but not rigorously verified; alternative explanations (annotation inconsistency, domain mismatch) are not ruled out.

## Questions & Follow-ups

- Does the unsupervised-better-than-BPE result hold for Iroquoian languages? Is there any experiment on Mohawk, Seneca, or Oneida to confirm?
- What unsupervised morphological segmentation tool performs best for polysynthetic languages overall — Morfessor, Adaptor Grammars, or something else?
- Related work: Le and Sadat (2021) for NMT for Inuktitut (which also tests BPE vs. morphological segmentation); Kann et al. (2018) for neural segmentation on Yuto-Aztecan (provides data used here); Goldman et al. (2024) on compression as predictor of tokenization quality; Schmidt et al. (2024) on tokenization survey.
