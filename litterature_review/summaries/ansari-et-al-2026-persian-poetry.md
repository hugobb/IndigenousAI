# Multi-modal Neural Machine Translation for Low-Resource Classical Persian Poetry: A Culture-Aware Evaluation

**Authors:** Soheila Ansari, Mounir Boukadoum, Fatiha Sadat
**Year:** 2026
**Venue:** Proceedings of the First Workshop on NLP and LLMs for the Iranian Language Family (SilkRoadNLP), ACL

---

## Core Argument

Standard neural machine translation systems fail to preserve the cultural depth of classical Persian poetry (specifically Rumi's Masnavi-ye-Ma'navi) because they rely on text alone and lack metrics that track culturally significant concepts. The paper introduces a multimodal NMT system that fuses audio recitation features with text, and proposes a Culture-Specific Item (CSI) evaluation framework using an 18-category Persian-English CSI lexicon to measure how well translations preserve cultural fidelity.

## Key Concepts

- **Culture-Specific Items (CSIs):** Explicit cultural entities — Sufi concepts, Quranic references, symbolic animals, divine attributes — that carry meaning beyond their literal translation and are routinely lost or distorted by generic NMT systems.
- **CSI-Recall metric:** A targeted recall score measuring what proportion of lexicon-covered cultural spans in the source are correctly rendered in the translation output, complementing standard MT metrics (BLEU, ChrF++, BERTScore, COMET).
- **Multi-modal NMT (MMNMT):** A system combining a domain-adapted mBART-50 text encoder (pre-trained on 1M lines of Persian poetry, then fine-tuned on the 26,571-verse parallel Masnavi corpus) with a Wav2Vec 2.0 XLS-R audio encoder fused via multi-head cross-attention.
- **Second-degree deformation:** The phenomenon where human and machine translators apply ideological filters (secularization, Islamization) that flatten a poem's intentional ambiguity.
- **Domain-adaptive fine-tuning (PPFT):** Pre-training mBART-50 on a large monolingual Persian poetry corpus before fine-tuning on the parallel Masnavi data, yielding a strong text-only baseline.

## Main Findings

- Adding audio recitations increased BLEU from 9.85 to 17.95 and ChrF++ from 32.77 to 42.95, with consistent gains across semantic metrics (BERTScore: 0.876 → 0.894; COMET: 0.579 → 0.635).
- CSI-Recall under the strict gold-standard lexicon rose from 61.60% to 82.04% with multimodal input, demonstrating that audio clarifies cultural meaning that written text alone cannot convey.
- Standard metrics alone are insufficient for evaluating culturally grounded translations: quantitative scores may remain moderate even when the translation correctly handles culture-specific terms.
- The three-tier CSI lexicon (strict, soft, broad) robustly confirmed multimodal gains across different confidence thresholds for cultural vocabulary coverage.

## Relevance to Indigenous AI

The paper's related-work section explicitly cites Cadotte et al. (2024), who showed that literary and poetic texts (including Indigenous-language texts like Innu-Aimun) can substitute for missing bilingual data in low-resource MT. The CSI evaluation methodology is directly transferable to Indigenous language projects: Mohawk, like Persian, encodes culturally specific concepts (ceremonies, clan relationships, spiritual practices) that standard MT metrics will not capture, and the CSI-lexicon-building pipeline offers a practical template for community-driven construction of culture-aware evaluation resources. The multimodal angle is also relevant given the importance of oral tradition and audio in many Indigenous language contexts.

## Limitations & Critiques

- CSI lexicon coverage is only 24% of all CSI spans in the test set, meaning the metric currently evaluates a limited slice of cultural content; large portions of culturally important terms remain unscored.
- The CSI metric is recall-only (no precision), so it does not penalize hallucinated cultural terms or incorrect contextual usage — a significant gap for production use.
- The parallel corpus (26,571 verse pairs) is comparatively large for poetry but still narrow in domain (one work, one author), limiting generalizability to other classical Persian texts or other low-resource languages.
- Human evaluation protocols are absent from the current study; the authors acknowledge this as future work.

## Questions & Follow-ups

- How can a CSI lexicon be built collaboratively with a speech community (e.g., Six Nations elders) for a language like Mohawk, where there is no large digitized parallel corpus to align cultural spans from?
- Cadotte et al. (2024) on machine translation for Innu-Aimun using literary texts is a direct follow-up; also worth exploring: the connection between audio-modal NMT and existing Indigenous speech documentation archives.
