# CulFiT: A Fine-grained Cultural-aware LLM Training Paradigm via Multilingual Critique Data Synthesis

**Authors:** Ruixiang Feng, Shen Gao, Xiuying Chen, Lisi Chen, Shuo Shang
**Year:** 2025
**Venue:** Proceedings of the 63rd Annual Meeting of the Association for Computational Linguistics (ACL 2025), Volume 1: Long Papers, pages 22413–22430

---

## Core Argument

Large language models exhibit systematic Western-centric cultural bias and perform inconsistently across languages when answering culturally specific questions. CulFiT addresses this by proposing a training paradigm that synthesises multilingual critique data targeting a model's specific cultural knowledge gaps, then applies fine-grained reward modelling (cultural precision and recall over atomic knowledge units) to guide DPO alignment — achieving state-of-the-art open-source performance on cultural benchmarks while reducing cross-language inconsistency.

## Key Concepts

- **Target-aware critique generation:** Rather than using generic golden answers, CulFiT generates answers from the specific model being fine-tuned, decomposes both the golden and target answers into atomic knowledge units, and produces critiques only for the gaps — focusing training where the model actually fails.
- **Multilingual data synthesis:** Training data is translated into culturally relevant languages (e.g., Malay for Singaporean culture) with back-translation verification, addressing the "language inconsistency" phenomenon where models answer correctly in the local language but fail in English.
- **Cultural precision / recall / F1:** Fine-grained reward metrics computed at the knowledge-unit level (atomic statements) rather than text overlap, enabling interpretable DPO pair selection.
- **GlobalCultureQA:** A new open-ended multilingual benchmark covering 1,104 questions, 400 topics, and 23 languages across all continents, introduced by the authors.
- **Hofstede cultural dimensions:** Used to validate cultural value alignment of the trained models against human survey data across 9 cultures.

## Main Findings

- CulFiT (on Llama 3.1-8B) achieves a cultural F1 of 72.94 on GlobalCultureQA, surpassing GPT-4o (72.81) and all other open-source baselines.
- Multilingual data augmentation reduces cross-language inconsistency rates across all 14 evaluated languages compared to mono-English training.
- Ablation confirms that both the critique data (target-aware SFT) and multilingual synthesis contribute independently; removing either degrades performance, with SFT degradation larger.
- Hofstede distance analysis shows CulFiT reduces cultural value misalignment relative to base models and even GPT-4o, suggesting that cultural alignment and general reasoning ability do not trade off.
- Low-resource language regions (Sundanese in West Java, Amharic in Ethiopia) show the largest gains, validating the approach for truly under-represented cultures.

## Relevance to Indigenous AI

CulFiT's framework is relevant to the Mila project in two ways. First, it demonstrates a principled method for injecting cultural knowledge into LLMs via critique-driven fine-tuning — a technique that could be adapted for Mohawk cultural knowledge if sufficient textual resources exist. Second, the paper surfaces the "language inconsistency" problem (models losing cultural accuracy when switching languages) which will be directly relevant when building or evaluating Mohawk-language AI tools. The fine-grained reward approach (knowledge-unit precision/recall) is more meaningful for low-resource cultural evaluation than BLEU or text overlap.

## Limitations & Critiques

- The paper focuses on global majority cultures and colonial languages (English, Chinese, Malay, etc.); the approach is not tested on truly endangered or oral-tradition languages like Mohawk where even generating "golden answers" may be infeasible.
- Cultural knowledge is sourced from existing datasets (CANDLE, CultureAtlas, CultureBank) that themselves reflect the perspectives of whoever created those sources — potentially replicating representational gaps.
- The paper does not engage with questions of community consent or data sovereignty over cultural knowledge — a significant omission from an Indigenous AI perspective.

## Questions & Follow-ups

- How would the CulFiT critique pipeline function when the "golden answer" must come from community knowledge-holders rather than existing datasets?
- Can the cultural precision/recall metrics be adapted for evaluating Mohawk language model outputs against community-validated reference texts?
- Related: Naous et al. (2024) on cultural bias measurement; Myung et al. (2024) BLEnD benchmark for everyday cultural knowledge.
