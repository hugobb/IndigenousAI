# AfriInstruct: Instruction Tuning of Large Language Models for African Languages

**Authors:** Uemura et al. (University of Toronto + MIT)
**Year:** 2024
**Venue:** EMNLP Findings 2024

---

## Core Argument

Continual pretraining followed by instruction fine-tuning on a curated multilingual African language dataset enables a single LLaMA-2-7B model (AfriInstruct) to outperform GPT-3.5-Turbo and similarly-sized models on NLP tasks across 19 African languages. This demonstrates that targeted multilingual fine-tuning — not just scale — can bridge the performance gap for linguistically diverse, low-resource language groups.

## Key Concepts

- **Continual pretraining + instruction fine-tuning (two-stage):** Stage 1 exposes the base LLM (LLaMA-2-7B) to African language text through continued pretraining (~870M tokens), building vocabulary coverage and language representations. Stage 2 uses instruction-formatted task data to teach the model to follow task prompts in those languages. The two stages are distinct and sequential — pretraining first, then instruction tuning.
- **AfriInstruct dataset:** A curated collection of instruction-formatted data across 19 African languages, assembled from: MasakhaNEWS (news classification), MasakhaPOS (POS tagging), AfriSenti (sentiment analysis), xP3 (cross-lingual), FLORES (MT evaluation), MAFAND (African news MT), and other sources.
- **Tasks covered:** News classification, part-of-speech tagging, sentiment analysis, machine translation, named entity recognition, and summarization — a broad multi-task evaluation rather than single-task fine-tuning.
- **Parameter-efficient fine-tuning:** LoRA/PEFT methods are used for instruction tuning, keeping the approach computationally feasible without full fine-tuning of the 7B-parameter base model.
- **Comparison baselines:** GPT-3.5-Turbo (much larger, closed source, English-dominant), similarly-sized open models, and task-specific fine-tuned models.

## Main Findings

- AfriInstruct outperforms GPT-3.5-Turbo and similarly-sized models across the 19 African languages on the evaluated tasks despite being 7B parameters vs. GPT-3.5-Turbo's much larger scale.
- Continual pretraining is necessary — instruction fine-tuning alone on a base LLaMA-2 model without additional African language pretraining is substantially less effective.
- The two-stage approach generalizes across typologically diverse African languages (tonal, Bantu, Afroasiatic, etc.), suggesting the pipeline is not language-family-specific.
- Multi-task instruction tuning enables a single model to perform across diverse NLP tasks without per-task specialization, improving practical deployability.

## Relevance to Indigenous AI

AfriInstruct is the most direct methodological analogue for what the IndigenousAI project might build for Mohawk. Three implications stand out. First, the two-stage pipeline (continual pretraining → instruction fine-tuning) has now been demonstrated to work for low-resource, typologically diverse languages at 7B-parameter scale — suggesting this approach is viable for Mohawk if sufficient pretraining data exists (even a few hundred million tokens in a multilingual model would help). Second, the finding that continual pretraining is *necessary* (not just instruction fine-tuning) reinforces the importance of building a Mohawk-specific pretraining corpus, however small — fine-tuning on an English-dominant base without first exposing the model to Mohawk will underperform. Third, the multi-task framing (single model, multiple tasks) is attractive for Mohawk where the community needs multiple tools (translation, spell-check, writing assistance) but there are insufficient resources to train separate specialized models for each task.

## Limitations & Critiques

- The 19 African languages all have substantially more digital text than Mohawk; the ~870M token training corpus is orders of magnitude larger than any realistic Mohawk corpus. Whether the approach scales down to Mohawk data volumes is not addressed.
- The paper evaluates on standard NLP benchmarks (classification, POS, MT, NER, summarization) — these are researcher-defined tasks. Whether these align with community-defined needs for African language users is not discussed.
- The ethical dimension of building AI tools for communities (data sovereignty, community consent) is not addressed; AfriInstruct treats African languages as a technical NLP challenge, not a community co-development challenge.
- LLaMA-2-7B requires significant compute for both pretraining and inference; the practical deployability for communities with limited compute infrastructure is not evaluated.

## Questions & Follow-ups

- At what minimum data volume does the continual pretraining stage provide meaningful benefit? What is the floor for Mohawk specifically, given the available text?
- How does AfriInstruct compare to Pinhanez et al.'s (2024) ILM approach (fine-tuning much smaller models with tiny data) for the use cases most relevant to language communities?
- Related work: Uemura et al. (2026) MERLIN (cross-lingual reasoning, same team); Pinhanez et al. (2024) on fine-tuning with tiny Indigenous language data; McGiff and Nikolov (2025) on data augmentation for LRL; Mager et al. (2023) on NMT for indigenous languages.
