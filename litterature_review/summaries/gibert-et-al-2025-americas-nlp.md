# Findings of the AmericasNLP 2025 Shared Tasks on Machine Translation, Creation of Educational Material, and Translation Metrics for Indigenous Languages of the Americas

**Authors:** Ona de Gibert, Robert Pugh, Ali Marashian, Raúl Vázquez, Abteen Ebrahimi, Pavel Denisov, Enora Rice, Edward Gow-Smith, Juan C. Prieto, Melissa Robles, Rubén Manrique, Oscar Moreno Veliz, Ángel Lino Campos, Rolando Coto-Solano, Aldo Alvarez, Marvin Agüero-Torales, John E. Ortega, Luis Chiruzzo, Arturo Oncevay, Shruti Rijhwani, Katharina von der Wense, Manuel Mager
**Year:** 2025
**Venue:** Proceedings of the Fifth Workshop on NLP for Indigenous Languages of the Americas (AmericasNLP), ACL 2025, pages 134–152

---

## Core Argument

Machine translation into Indigenous languages of the Americas appears to have reached a performance plateau under current data constraints, while the new tasks of generating educational morphological exercises (ST2) and developing evaluation metrics suited to Indigenous languages (ST3) reveal that rule-based and neural hybrid approaches outperform pure LLM prompting for morphologically complex languages, and that neural metrics substantially improve over string-based baselines for translation evaluation.

## Key Concepts

- **ST1 (Machine Translation):** Bidirectional Spanish ↔ 13 Indigenous languages; two new languages (Awajun, Wayuunaiki); open-source-only ranking; NLLB-1.3B fine-tuned multilingually remains the hardest baseline to beat.
- **ST2 (Morphological adaptation for educational materials):** Automatic sentence transformation by modifying tense, person, aspect, mood, etc. to generate grammar exercises; four languages (Bribri, Guarani, Maya, Nahuatl); metric is exact-match accuracy.
- **ST3 (MT metrics for Indigenous languages):** First-of-its-kind task to build metrics correlating with human fluency/adequacy ratings for Guarani, Bribri, and Nahuatl; winner uses Ridge regression combining lexical, phonetic, and semantic (LaBSE) similarity.
- **ChrF++:** Character-level F-score metric, preferred over BLEU for morphologically rich languages; used as main metric for ST1.
- **Performance plateau:** The observation that year-over-year MT gains are diminishing, suggesting current data volumes and model architectures may be approaching a ceiling for these languages.

## Main Findings

- The NLLB-1.3B multilingual fine-tuned baseline is extremely hard to beat in ST1; GMU (the only team to surpass it) does so only for Quechua (+0.82 ChrF++) going into Indigenous languages, and Rarámuri (+0.97) going into Spanish.
- For translation into Spanish (a high-resource target), GPT-4o-mini with grammar-book grounding provides competitive post-correction, suggesting LLMs can help when the target is well-represented in pretraining.
- In ST2, Nahuatl (Western Sierra Puebla variety) proved by far the hardest language: 5 of 11 systems scored 0% accuracy; the best system (NAIST, rule-based for Nahuatl) reached only 17.5%. This is attributed to the combination of complex morphology, many simultaneous grammatical transformations, and near-absence of this variety in LLM training data.
- In ST3, the winning metric (RaaVa_5) combines lexical, phonetic, and semantic similarity features via Ridge/Random Forest regression and increases Pearson correlation by 0.149 on average over ChrF++.
- Neural metrics (LaBSE-based) far outperform string-based baselines for Bribri, which has fusional morphology making character overlap unreliable.

## Relevance to Indigenous AI

The 2025 shared tasks are directly relevant to Mohawk in multiple dimensions. The ST2 educational-material generation task mirrors one of the most practical applications for Indigenous language AI: producing grammatical exercises for learners. The finding that rule-based and knowledge-grounded approaches outperform LLM prompting for morphologically complex, low-resource varieties like Nahuatl applies directly to Mohawk, which is similarly polysynthetic. The ST3 metric development work highlights the need for community-grounded human evaluation rather than reliance on automatic overlap metrics — a methodological lesson for Mohawk NLP evaluation. The ethical statement explicitly follows Bird (2020) and Mager et al. (2023) principles of community consultation and fair compensation of annotators.

## Limitations & Critiques

- ST2 Nahuatl data comes from a single community (Omitlán, Tepetzintla) verified by one native-speaking expert — the small scale and single-community focus limits generalisability even within Nahuatl varieties.
- The performance plateau observation in ST1 may reflect a data ceiling specific to the XNLI-derived evaluation set rather than a fundamental limit; domain-matched evaluation data could paint a different picture.
- The ethical statement is brief; community involvement in data creation and evaluation design is described at a high level without procedural detail.

## Questions & Follow-ups

- Could the ST2 morphological adaptation framework be applied to Mohawk to generate language-learning exercises from existing pedagogical materials, using a morphological analyser as a grounding resource?
- What would fair compensation and community authorship look like for Mohawk annotators in a Mila-led shared task or evaluation effort?
- Related: Chiruzzo et al. (2024) AmericasNLP 2024 on educational material creation (ST2 predecessor); Pugh & Tyers (2021) on morphological analysis for Nahuatl.
