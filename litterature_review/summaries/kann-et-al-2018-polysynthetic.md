# Neural Morphological Segmentation for Polysynthetic Minimal-Resource Languages

**Authors:** Katharina Kann, Manuel Mager, Ivan Meza-Ruiz, Hinrich Schütze
**Year:** 2018
**Venue:** NAACL-HLT 2018

---

## Core Argument

Neural sequence-to-sequence (seq2seq) models, despite their reputation as data-hungry, achieve competitive performance for morphological segmentation of polysynthetic languages even in minimal-resource settings (fewer than 1,000 training examples). Multi-task learning, data augmentation, and cross-lingual transfer further improve neural baselines for four Mexican polysynthetic languages, enabling a single multilingual model to approach or match language-specific models — with 75% fewer parameters.

## Key Concepts

- **Morphological surface segmentation:** Splitting a word into the surface forms of its morphemes (e.g., unconditionally → un + condition + al + ly). For polysynthetic languages, this is the critical preprocessing step for any downstream NLP task.
- **Minimal-resource setting:** Fewer than 1,000 labeled training examples — the realistic scenario for most polysynthetic Indigenous languages.
- **Seq2seq models:** Neural encoder-decoder architectures that treat segmentation as a sequence transduction task (character sequence in → morpheme-segmented sequence out). State of the art for high-resource morphological segmentation.
- **Multi-task training:** Training a shared model on multiple related tasks simultaneously (e.g., segmentation + morpheme identification) to improve generalization in low-resource settings.
- **Data augmentation:** Creating additional training examples from existing ones (e.g., by recombining morphemes) to expand the effective training set without collecting new data.
- **Cross-lingual transfer:** Training a single multilingual model across related languages (Mexicanero, Nahuatl, Wixarika, Yorem Nokki — all Uto-Aztecan polysynthetic) to share morphological knowledge, reducing total parameters by ~75%.

## Main Findings

- Neural seq2seq models achieve competitive performance for polysynthetic morphological segmentation at fewer than 1,000 training examples — partially closing the gap with rule-based FST approaches in minimal-resource settings.
- Multi-task training improves over the neural baseline for all four languages; data augmentation provides additional gains.
- Cross-lingual transfer enables a single multilingual model to match or improve on language-specific models for related languages, with ~75% fewer parameters — a significant efficiency gain for low-resource deployments.
- The four languages studied (Mexicanero, Nahuatl, Wixarika, Yorem Nokki) are morphologically complex with high morpheme-per-word ratios; the results establish these as benchmarks for future work.
- The paper contributes public morphological segmentation datasets for all four languages, enabling reproducible research.

## Relevance to Indigenous AI

This is a foundational technical paper for the IndigenousAI project. It establishes that neural morphological segmentation is tractable for polysynthetic languages with small datasets — directly relevant to Mohawk, which would have a similarly small annotated segmentation corpus. The multi-task and cross-lingual transfer results suggest that training across related polysynthetic languages (could Seneca or Oneida data help a Mohawk segmenter?) might be more effective than training on Mohawk alone. The data augmentation techniques could be applied to expand a small Mohawk segmentation corpus. The neural approaches complement rather than replace FST-based morphological analyzers: FSTs provide rule coverage; neural models generalize to unseen morpheme combinations.

## Limitations & Critiques

- All four languages are Uto-Aztecan (Mexican); the generalizability to Iroquoian polysynthetic languages (like Mohawk) or Algonquian languages (like Innu-Aimun) is not demonstrated.
- The "minimal-resource" threshold of <1,000 examples is higher than what exists for many Indigenous languages, including Mohawk; practical annotation of even 500 segmented words requires significant community linguist time.
- The paper focuses on surface segmentation (morpheme boundaries) rather than full morphological analysis (glossing, POS labeling), which is what most downstream NLP tasks require.

## Questions & Follow-ups

- How much annotated morphological segmentation data exists for Mohawk? Is it sufficient for the multi-task neural approach proposed here?
- Can cross-lingual transfer work across language families (e.g., Iroquoian + Algonquian)? Or only within the same family (Iroquoian + Iroquoian)?
- Related work: Liu et al. (2021) for Seneca (Iroquoian) morphological segmentation; Le et al. (2022) for Innu-Aimun deep learning segmentation; Mager et al. (2022) for segmentation vs. BPE in MT; Khandagale et al. (2022) for unsupervised approaches to Adyghe and Inuktitut.
