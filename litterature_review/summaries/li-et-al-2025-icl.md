# It's All About In-Context Learning! Teaching Extremely Low-Resource Languages to LLMs

**Authors:** Yue Li, Zhixue Zhao, Carolina Scarton
**Year:** 2025
**Venue:** Preprint (University of Sheffield)

---

## Core Argument

For extremely low-resource languages — especially those written in rare scripts — in-context learning (ICL) is more effective than parameter-efficient fine-tuning (PEFT), and zero-shot ICL with language alignment is impressively effective even without any labeled examples in the target language. Fine-tuning multilingual models on languages with unseen scripts can actively harm performance and should be avoided.

## Key Concepts

- **Extremely low-resource (XLR) languages:** Languages with minimal training data and often rare or unseen scripts; 20 such languages studied, including 5 with rare scripts entirely absent from most LLM vocabularies.
- **Language alignment in zero-shot ICL:** Providing the model with a signal about the target language identity (e.g., naming the language, providing its linguistic features) in the zero-shot prompt, enabling the model to leverage cross-lingual transfer without any examples.
- **PEFT (Parameter-Efficient Fine-Tuning):** Methods like LoRA that update a small subset of model parameters; shown to degrade performance for languages with unseen scripts because fine-tuning does not add new vocabulary or script knowledge.
- **Unseen scripts:** Scripts not represented in the model's tokenizer vocabulary; lead to highly fragmented tokenization and poor performance regardless of training strategy.
- **Few-shot ICL vs. zero-shot with alignment:** For relatively better-represented languages, few-shot ICL or PEFT is more beneficial; for truly XLR languages with rare scripts, zero-shot ICL with alignment is preferred.

## Main Findings

- Zero-shot ICL with language alignment outperforms few-shot ICL and PEFT for languages with unseen or rare scripts — a counterintuitive finding that challenges the assumption that more examples always help.
- PEFT on multilingual models for languages with unseen scripts degrades performance, because fine-tuning shifts model weights without providing the script coverage needed to process the language.
- For languages better represented by the LLM (more pretraining data, known script), few-shot ICL and PEFT both provide gains over zero-shot.
- The paper provides practitioner guidelines: avoid fine-tuning for unseen-script languages; use zero-shot alignment; add few-shot examples only for relatively known languages.
- Results are consistent across three state-of-the-art multilingual LLMs.

## Relevance to Indigenous AI

Mohawk uses the Latin script, so the unseen-script failure mode does not directly apply. However, the broader finding — that zero-shot ICL with language alignment can outperform fine-tuning for XLR languages — is highly relevant for early-stage project work before labeled Mohawk data is available. The practitioner guidelines also provide a concrete decision tree: for Mohawk, start with zero-shot ICL + language alignment; add few-shot examples as data becomes available; consider PEFT only once sufficient labeled data exists. The paper also cautions against over-investing in fine-tuning approaches before establishing that the base model can process the language at all.

## Limitations & Critiques

- Evaluated on classification tasks (SIB-200 topic classification); translation and generation tasks for polysynthetic languages are not studied.
- None of the 20 languages studied are Indigenous North American languages; transferability to Mohawk's specific structural features is untested.
- "Language alignment" in zero-shot ICL is underspecified — it is unclear how much linguistic metadata is needed and whether it requires linguist input.

## Questions & Follow-ups

- What linguistic metadata about Mohawk (script, language family, typological features) is most useful to include in a zero-shot ICL alignment prompt?
- At what point in the project's data collection should the team shift from zero-shot ICL with alignment to few-shot ICL with community-validated examples?
- Related work: Cahyawijaya et al. (2025) (query alignment for low-resource ICL), Ma et al. (2025) (transliteration for non-Latin script ICL), Zhang et al. (2024) (unseen language ICL).
