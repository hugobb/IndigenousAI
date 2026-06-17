# Harnessing NLP for Indigenous Language Education: Fine-Tuning Large Language Models for Sentence Transformation

**Authors:** Mahshar Yahan, Dr. Mohammad Amanul Islam
**Year:** 2025
**Venue:** AmericasNLP 2025 Shared Task 2 (Uttara University, Bangladesh)

---

## Core Argument

Fine-tuned LLMs can generate grammatical sentence transformations for Indigenous languages (Bribri, Guarani, Maya) for use in language education tools. Using LoRA and quantization-based fine-tuning, a small Llama 3.2 (3B) model achieves strong performance on sentence transformation tasks including tense, aspect, voice, and person changes — with few-shot prompting outperforming zero-shot across all tested languages.

## Key Concepts

- **Sentence transformation tasks:** Modifying a source sentence according to a specified grammatical instruction (e.g., change tense, aspect, voice, person); designed to generate language learning exercises for Indigenous language education.
- **AmericasNLP 2025 Shared Task 2:** A shared task focused on creating educational tools for Indigenous languages (Bribri, Guarani, Maya, Nahuatl Omitlan) by generating grammatically transformed sentences.
- **LoRA (Low-Rank Adaptation):** A parameter-efficient fine-tuning technique that updates a small number of adapter parameters rather than the full model; used here with Bits-and-Bytes quantization to reduce computational cost.
- **Bits-and-Bytes quantization:** Reduces model precision (e.g., 4-bit or 8-bit) to decrease memory and compute requirements during fine-tuning; enables running large models on limited hardware.
- **Llama 3.2 (3B-Instruct):** The best-performing model in the evaluation; achieved highest BLEU and ChrF++ across all three Indigenous languages in both zero-shot and few-shot settings.

## Main Findings

- Llama 3.2 (3B-Instruct) achieves competitive results on sentence transformation for three Indigenous languages: BLEU of 19.51 (Bribri), 13.67 (Guarani), 55.86 (Maya); ChrF++ of 50.29 (Bribri), 58.55 (Guarani), 80.12 (Maya).
- Few-shot prompting consistently outperforms zero-shot for all three languages, confirming the value of in-context examples even for fine-tuned models.
- LoRA fine-tuning with quantization enables effective adaptation on limited hardware, making the approach accessible without high-performance GPU infrastructure.
- Maya achieves substantially higher scores than Bribri and Guarani, reflecting its greater morphological regularity and higher resource availability relative to the other languages tested.

## Relevance to Indigenous AI

This paper is one of the few in the corpus to directly address Indigenous language *education* tools — the primary application identified for the IndigenousAI project. The sentence transformation task (changing tense, aspect, voice, person) is directly applicable to Mohawk language pedagogy: such transformations mirror the kinds of exercises used in language classes and could generate materials for Mohawk instruction. The LoRA + quantization approach demonstrates that fine-tuning for Indigenous language tasks does not require high-performance infrastructure, making it feasible for resource-constrained academic research settings. The finding that even a 3B model achieves meaningful performance points toward small, potentially community-deployable models.

## Limitations & Critiques

- Mohawk is not among the languages evaluated; Mohawk's verb-centric polysynthetic morphology makes transformation tasks more complex than for the languages tested (especially compared to Maya).
- The paper does not address how the grammatical transformation tags were defined — an important concern for Indigenous languages where community linguistic knowledge should drive the task specification.
- Community speakers are not involved in evaluation; quality is assessed only via BLEU and ChrF++, which are known to be poor proxies for Indigenous language translation quality (Krasner et al., 2025).

## Questions & Follow-ups

- Could the sentence transformation framework be adapted for Mohawk verb morphology — generating exercises around pronominal prefix substitution, tense/aspect changes, and evidentiality marking?
- How would community members (Mohawk teachers, language learners) evaluate the educational usefulness of LLM-generated transformation exercises, beyond BLEU/ChrF++ scores?
- Related work: de Gibert et al. (2025) (AmericasNLP 2025 shared tasks), Krasner et al. (2025) (Indigenous language MT metrics), Zhang et al. (2022) (Cherokee NLP with educational applications).
