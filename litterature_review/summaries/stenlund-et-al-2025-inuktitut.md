# LLM-Based Morphological Segmentation for Inuktitut Syllabics

**Authors:** Þórunn Arnardóttir, Steinþór Steingrímsson, and others (Stenlund et al.)
**Year:** 2025
**Venue:** NoDaLiDa 2025 (University of Iceland)

---

## Core Argument

LLMs can perform morphological segmentation for Inuktitut syllabics by framing it as a binary classification task (is this character a morpheme boundary?), using automatic annotation from the UQAILAUT FST to generate training data. The LLMSegm approach, built on Glot500-m (a multilingual LLM covering 500+ languages including Inuktitut), outperforms or matches prior neural segmentation approaches without requiring expensive hand-annotated training data at scale.

## Key Concepts

- **LLMSegm:** Frames morphological segmentation as a token-level binary classification task — for each character or token position, the model predicts whether a morpheme boundary occurs there. This converts a structured prediction problem into a classification problem that LLMs can handle through fine-tuning.
- **UQAILAUT:** An FST-based Inuktitut morphological analyzer developed by NRC Canada. Used here to automatically annotate large amounts of Inuktitut text with morpheme boundaries — the resulting unambiguous segmentations become training data for LLMSegm, eliminating the need for manual annotation at scale.
- **Inuktitut syllabics:** Inuktitut is primarily written in Canadian Aboriginal Syllabics (a featural abugida), not the Roman alphabet. Most prior NLP work on Inuktitut has focused on romanized text; this paper specifically addresses syllabic script, which is how most Inuktitut speakers actually write.
- **Glot500-m:** A multilingual language model covering 500+ languages, trained to include low-resource languages such as Inuktitut. Using a model that has seen Inuktitut text provides better cross-lingual transfer than using an English-only LLM.
- **Training data construction:** 54,138 unambiguous training words from UQAILAUT auto-annotation; gold evaluation set of approximately 1,000 hand-annotated words for reliable evaluation.
- **Automatic annotation pipeline:** Only segmentations on which UQAILAUT is unambiguous (FST produces exactly one output) are used as training examples, ensuring training label quality.

## Main Findings

- LLMSegm using Glot500-m outperforms or matches prior neural morphological segmentation approaches for Inuktitut syllabics across standard segmentation metrics.
- Automatic annotation via UQAILAUT provides sufficient training data quality: training on unambiguous FST outputs is an effective substitute for manual annotation at training scale.
- The syllabic script does not prevent LLM-based approaches from functioning; Glot500-m's multilingual pretraining includes enough Inuktitut syllabic text for transfer.
- The trained model and code are shared publicly, lowering the barrier for future Inuktitut NLP work.

## Relevance to Indigenous AI

Inuktitut is typologically and morphologically related to the polysynthetic language family and provides the closest existing analogue to Mohawk for neural morphological segmentation. Three findings matter directly for Mohawk work. First, the automatic annotation pipeline (train on unambiguous FST outputs) is exactly the strategy available for Mohawk: Kawennón:nis / WordWeaver (NRC Canada's Mohawk verb conjugator) could be used similarly to generate training data for a Mohawk morphological segmenter without full manual annotation of training data. Second, LLM-based segmentation (via a multilingual model that has seen Mohawk text, if any exists in Glot500-m or similar) may be competitive with purpose-built neural segmenters. Third, the binary classification framing is simpler to implement than full sequence-to-sequence morphological analysis and could be a practical starting point for a Mohawk segmentation tool.

## Limitations & Critiques

- UQAILAUT is a mature, well-validated FST; a comparable resource for Mohawk (Kawennón:nis) covers verbs, not the full morphological paradigm — the coverage of the auto-annotation pipeline would be narrower for Mohawk.
- Evaluation is on Inuktitut only; generalization to other polysynthetic languages with different morphological structure (e.g., Mohawk's obligatory agreement prefixes vs. Inuktitut's suffixal structure) is not validated.
- The syllabics focus is specific to Inuktitut writing conventions; Mohawk NLP uses a Roman-based orthography with no direct parallel.
- The gold evaluation set (~1K words) is small; statistical significance is limited.

## Questions & Follow-ups

- Could Kawennón:nis / WordWeaver be used analogously to UQAILAUT to auto-annotate Mohawk verb segmentation for training data? What would coverage look like across available Mohawk text?
- Is Mohawk represented in Glot500-m (or a successor model), and if so, how much training data was included?
- Related work: Kuhn et al. (2020) on NRC Canada ILT and Kawennón:nis; Kann et al. (2018) on polysynthetic neural segmentation; Liu et al. (2021) on Seneca (Iroquoian) neural segmentation; Le et al. (2022) on Innu-Aimun deep learning segmentation; Ngoc et al. (2021) on unsupervised Inuinnaqtun segmentation.
