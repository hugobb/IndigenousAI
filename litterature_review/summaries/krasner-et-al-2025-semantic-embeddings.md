# Machine Translation Metrics for Indigenous Languages Using Fine-tuned Semantic Embeddings

**Authors:** Nathaniel Krasner, Justin Vasselli, Belu Ticona, Antonios Anastasopoulos, Chi-kiu Lo
**Year:** 2025
**Venue:** AmericasNLP 2025 Shared Task on Machine Translation Metrics for Indigenous Languages (George Mason University, NAIST, National Research Council Canada)

---

## Core Argument

Standard MT evaluation metrics (BLEU, ChrF++) fail for Indigenous languages because their polysynthetic morphology, extensive morphological variation, and non-standardized spelling break lexical and character-level matching assumptions. Fine-tuning multilingual semantic embeddings (LaBSE) specifically for Guarani, Bribri, and Nahuatl substantially improves the quality of semantic similarity metrics for these languages, with layer-averaged YiSi-1 achieving the best correlation with human judgment.

## Key Concepts

- **LaBSE (Language-agnostic BERT Sentence Encoder):** A multilingual sentence embedding model; the paper fine-tunes it specifically for three Indigenous languages to improve semantic representation quality.
- **YiSi-1:** A semantic similarity MT metric that uses sentence embeddings to compare translations; integrated here with fine-tuned LaBSE and layer averaging.
- **COMET-DA:** A regression-based MT metric trained on human direct assessment scores; the paper trains it using fine-tuned LaBSE embeddings as the semantic backbone.
- **Layer averaging:** Taking the average of multiple internal layers of the LaBSE encoder, rather than the final layer alone; found to improve correlation with human judgment for Indigenous languages.
- **AmericasNLP 2025 Metrics Shared Task:** A community benchmark explicitly targeting MT evaluation for Indigenous languages of the Americas — Guarani, Bribri, Nahuatl.

## Main Findings

- Fine-tuning LaBSE on Guarani, Bribri, and Nahuatl significantly improves semantic representation quality for these languages over the off-the-shelf multilingual model.
- Layer-averaged YiSi-1 using fine-tuned LaBSE achieves the highest average correlation with human judgment across the three Indigenous languages among submitted systems.
- COMET-DA with fine-tuned LaBSE embeddings achieves competitive performance for Guarani, demonstrating that regression-based learned metrics can be adapted for Indigenous languages with sufficient fine-tuning data.
- MSE loss outperforms MAE loss for COMET-DA training in this setting.
- Traditional metrics (BLEU, ChrF++) are confirmed to be poor proxies for translation quality in polysynthetic Indigenous languages.

## Relevance to Indigenous AI

This paper directly addresses the evaluation gap for Indigenous language MT — one of the most pressing problems for the project. The finding that fine-tuned semantic embeddings substantially improve metric quality over lexical metrics is critical: any Mohawk MT system developed by the project will need an evaluation metric that goes beyond BLEU/ChrF++. The LaBSE fine-tuning approach could be adapted for Mohawk with even modest amounts of aligned sentence pairs. The layer-averaging technique for YiSi-1 is a low-cost improvement applicable to any existing multilingual embedding model. The AmericasNLP shared task also represents a direct community of practice — researchers working on Indigenous language NLP in the Americas — that the project could engage with.

## Limitations & Critiques

- Mohawk and other Haudenosaunee languages are not among the three languages studied (Guarani, Bribri, Nahuatl); direct transferability is unvalidated.
- Fine-tuning LaBSE requires language-specific data; for Mohawk, the availability of such data to support fine-tuning is a constraint.
- Human judgment data used to train and evaluate COMET-DA is expensive to collect for Indigenous languages; the paper does not discuss how community speakers were involved in producing the human assessments.

## Questions & Follow-ups

- What is the minimum amount of Mohawk parallel data needed to fine-tune LaBSE to the point where YiSi-1 or COMET-DA becomes a reliable evaluation metric?
- Could community speakers participate in the human assessment data collection needed to train COMET-DA for Mohawk, converting evaluation into a community engagement activity?
- Related work: Ebrahimi et al. (2023), de Gibert et al. (2025) (AmericasNLP MT shared tasks), Haddow et al. (2022) (LRL MT survey).
