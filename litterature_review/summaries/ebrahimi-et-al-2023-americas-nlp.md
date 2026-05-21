# Findings of the AmericasNLP 2023 Shared Task on Machine Translation into Indigenous Languages

**Authors:** Abteen Ebrahimi, Manuel Mager, Shruti Rijhwani, Enora Rice, Arturo Oncevay, Claudia Garcia Baltazar, María Elena Méndez Cortés, Cynthia Montaño, John E. Ortega, Rolando Coto-Solano, Hilaria Cruz, Alexis Palmer, Katharina Kann
**Year:** 2023
**Venue:** Proceedings of the Workshop on Natural Language Processing for Indigenous Languages of the Americas (AmericasNLP), ACL 2023, pages 206–219

---

## Core Argument

Machine translation into Indigenous languages of the Americas has improved substantially since 2021, but systems still fall well short of producing translations of usable quality, particularly for morphologically complex or under-represented languages like Otomí. The paper presents the third edition of the AmericasNLP shared task, introducing a new evaluation language (Chatino) with a professionally produced legal-domain dataset, and demonstrates that fine-tuned multilingual pretrained models (especially NLLB) and multilingual training strategies remain the most effective approach.

## Key Concepts

- **ChrF (Character F-score):** The primary evaluation metric, preferred over BLEU for morphologically rich languages because it operates at the character level.
- **Low-resource MT (LRMT):** Machine translation under conditions of scarce parallel data, characteristic of nearly all Indigenous languages in the Americas.
- **Polysynthetic languages:** Languages like Nahuatl and Wixarika with rich morphophonemic inflection systems, posing particular challenges for token-level MT approaches.
- **NLLB-200:** Meta's "No Language Left Behind" multilingual translation model, which supports some task languages (Aymara, Quechua) natively and was fine-tuned by top-performing teams for others.
- **Chatino dataset:** A newly created Spanish–Chatino evaluation set built from Mexican Supreme Court press releases, translated by two native professional translators — a methodologically careful approach designed to reflect real community legal needs.

## Main Findings

- The overall winning system (Sheffield, NLLB-based) achieved an average ChrF improvement of 9.64 points over the 2021 winning baseline across 10 shared languages.
- Despite metric improvements, human evaluation of Bribri, Chatino, and Otomí outputs shows that near-perfect translations (rating 5/5) remain extremely rare across all systems and all years.
- Multilingual and multi-stage fine-tuning of large pretrained models (NLLB, mBART) consistently outperforms language-specific models trained from scratch.
- Otomí remains the worst-performing language across all teams and years, with the majority of outputs rated 1/5 on both fluency and meaning — suggesting a data and model coverage ceiling.
- Data cleaning and preprocessing are likely critical contributors to top performance, given noise and domain mismatch in available training corpora.

## Relevance to Indigenous AI

Mohawk is typologically similar to many of the languages in this shared task (polysynthetic, morphologically complex, endangered, extremely low-resource). The benchmark results establish a realistic performance ceiling for MT-based approaches and highlight that even state-of-the-art systems produce translations that community members find largely unusable. For the Mila project, this underscores the need to go beyond MT and to consider what tasks (beyond translation) AI tools might meaningfully support for language revitalisation, while also informing choices about evaluation metrics for Mohawk NLP.

## Limitations & Critiques

- Human evaluation is conducted by native speakers but the annotation guidelines (fluency and meaning on a 1–5 scale) are relatively coarse and may not capture community-relevant dimensions of quality.
- The evaluation domain (XNLI-derived sentences, legal press releases) may not reflect the texts most useful for language revitalisation (oral traditions, pedagogical materials).
- Bible-derived training data, used by several top systems, carries risks of domain bias and cultural imposition that the paper acknowledges but does not deeply address.

## Questions & Follow-ups

- Can ChrF be adapted or supplemented for polysynthetic languages like Mohawk where morpheme boundaries matter more than character n-grams?
- What would a community-defined evaluation framework for Mohawk MT look like — what does a "good enough" translation mean to a Six Nations language teacher?
- Related: Ebrahimi et al. (2022) AmericasNLI for zero-shot NLU evaluation; Mager et al. (2023) on ethical considerations for MT of Indigenous languages.
