# Neural Machine Translation for Indigenous Languages of the Americas: An Introduction

**Authors:** Manuel Mager, Rajat Bhatnagar, Katharina Kann, Graham Neubig, Ngoc Thang Vu
**Year:** 2023
**Venue:** AmericasNLP Workshop, ACL 2023

---

## Core Argument

Building MT systems for the ~900 Indigenous languages of the Americas requires confronting a distinct set of challenges — polysynthetic morphology, extreme low-resource conditions, orthographic inconsistency, dialectal variation, and noisy data — that standard NMT research has not addressed. This introductory survey maps the problem space, reviews available data and techniques, and identifies open questions, positioning NMT for Indigenous languages as an important and tractable research area for the NLP community.

## Key Concepts

- **Indigenous languages of the Americas (ILA):** Approximately 900 languages native to the Americas, most endangered to varying degrees. MT is the most-studied NLP task for these languages, yet progress is severely constrained by data scarcity and typological complexity.
- **Polysynthesis in NMT:** Polysynthetic languages encode full sentence meanings in single words, making word-level vocabularies impractically large and OOV rates extreme. The central challenge is choosing the right input representation (character, BPE, morphological segmentation) before training.
- **Extremely low-resource (ELR) vs. low-resource:** Most ILA are not just low-resource (thousands of parallel sentences) but ELR (hundreds or fewer). Techniques that work for low-resource (e.g., Nepali, Kazakh) often fail for ELR polysynthetic languages.
- **Data augmentation for NMT:** Key strategies in ELR settings include back-translation (translate target→source to create synthetic parallel data), data selection, multilingual training (leverage multiple related languages jointly), and transfer learning from high-resource related languages or multilingual pretrained models.
- **Pretrained multilingual models:** mBERT, XLM-R, and mT5 can provide cross-lingual transfer even for languages unseen during pretraining, if the writing system is shared or phonological similarity is high. Results for ILA are mixed.
- **AmericasNLP shared task:** A recurring community challenge (2021, 2022, 2023) on MT for 10+ ILA to Spanish; has generated new datasets and systematic comparisons.

## Main Findings

- No single NMT approach dominates for ELR ILA; results depend heavily on available data size, language typology, and evaluation conditions.
- Unsupervised morphological segmentation outperforms BPE for ELR polysynthetic languages (referencing Mager et al. 2022), but supervised segmentation often underperforms in MT despite better segmentation scores.
- Multilingual training (sharing data across related languages) and cross-lingual transfer from higher-resource languages provide consistent gains in ELR settings.
- Pretrained multilingual models (mBART, mT5) provide gains when some ILA data has been included; their benefit for truly unseen ILA is limited and depends on script and phonological overlap.
- Evaluation metrics (BLEU, chrF) are poorly calibrated for polysynthetic languages; human evaluation is necessary but expensive, and the field lacks standardized benchmarks.
- Data scarcity is not the only obstacle: dialectal variation, lack of orthographic standardization, and noisy parallel data (Bible translations, parallel administrative texts) limit the quality as much as the quantity of training data.

## Relevance to Indigenous AI

This survey is the most comprehensive introduction to the technical NMT literature for ILA. For Mohawk, the key takeaways are: (1) ELR polysynthetic conditions apply fully; (2) morphological segmentation is a prerequisite, not an option; (3) multilingual training with related Iroquoian languages (Seneca, Oneida) or Algonquian languages (Cree, Innu-Aimun) could help; (4) pretrained models like mBART will have near-zero Mohawk pretraining signal and should be approached cautiously. The AmericasNLP shared task infrastructure (data, evaluation, leaderboards) could be extended to Mohawk if sufficient parallel data becomes available. The dialectal variation issue is directly relevant: multiple Mohawk dialects (Western/Six Nations Grand River, Eastern/Kahnawà:ke, St. Regis/Akwesasne) exist and must be handled explicitly.

## Limitations & Critiques

- The paper is a survey/introduction, not a new system or evaluation — it does not present original empirical results.
- Coverage of Iroquoian languages is limited; most examples are Mesoamerican (Nahuatl, Wixarika, etc.) and Canadian Arctic (Inuktitut).
- The discussion of morphological segmentation is somewhat contradictory — earlier sections suggest no clear advantage over BPE, but the reference to Mager et al. (2022) shows the reverse for ELR. This inconsistency reflects the actual state of the literature, but readers may find it confusing.

## Questions & Follow-ups

- Is there any Mohawk-Spanish or Mohawk-English parallel corpus beyond the Bible? What is its size?
- Could a shared AmericasNLP-style task for Iroquoian or Canadian Indigenous languages be organized?
- Related work: Mager et al. (2022) on BPE vs. morphological segmentation; Le and Sadat (2021) on Inuktitut NMT; Liu et al. (2021) on Seneca morphological segmentation; Kann et al. (2018) on neural segmentation for polysynthetic languages.
