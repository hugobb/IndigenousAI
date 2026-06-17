# MERLIN: Cross-Lingual Reasoning in Low-Resource Languages via Two-Stage Curriculum

**Authors:** Uemura et al. (Mila-McGill + University of Toronto + Saarland University)
**Year:** 2026
**Venue:** EACL 2026

---

## Core Argument

Cross-lingual reasoning in low-resource languages can be substantially improved through a two-stage curriculum framework (MERLIN) that progressively bridges the gap from general bitext to mathematical reasoning. A mapping layer aligns a multilingual encoder to a frozen LLM, trained in sequence on general bitext → math bitext → task QA; then DoRA fine-tuning adapts the LLM to the task while the mapping layer is frozen. MERLIN outperforms MindMerger by +12.9 pp on AfriMGSM and GPT-4o-mini by 15.2 pp, establishing a new SOTA for cross-lingual mathematical reasoning in low-resource African languages.

## Key Concepts

- **MERLIN two-stage curriculum:**
  - *Stage 1 (Model Stacking):* A mapping layer (lightweight adapter) is trained to align a multilingual encoder's representations to the input space of a frozen LLM. Training follows a three-step curriculum: (a) general bitext alignment (many language pairs), (b) math bitext alignment (mathematical text in multiple languages), (c) task-specific QA examples. This curriculum progressively specializes from general cross-lingual transfer to the target reasoning domain.
  - *Stage 2 (Task Specialization):* The mapping layer is frozen; DoRA fine-tuning is applied to the LLM itself, adapting it to the specific reasoning task while preserving the alignment learned in Stage 1.
- **Mapping layer:** A lightweight module (not the full LLM) that bridges the multilingual encoder and the frozen LLM — allows cross-lingual knowledge injection without modifying the base LLM during Stage 1. This separates cross-lingual alignment from task adaptation.
- **DoRA (Weight-Decomposed Low-Rank Adaptation):** A parameter-efficient fine-tuning method that decomposes weight updates into magnitude and direction components; allows efficient adaptation with fewer parameters than full fine-tuning while retaining strong task performance.
- **AfriMGSM:** A benchmark for mathematical reasoning in African low-resource languages, derived from the MGSM (Multilingual Grade School Math) dataset. Used as the primary evaluation for MERLIN.
- **MindMerger:** The prior SOTA system for cross-lingual reasoning that MERLIN is compared against; MERLIN outperforms it by +12.9 pp on AfriMGSM.

## Main Findings

- MERLIN achieves +12.9 pp over MindMerger on AfriMGSM and outperforms GPT-4o-mini by 15.2 pp on AfriMGSM, establishing a new SOTA for cross-lingual mathematical reasoning in low-resource African languages.
- The three-step curriculum in Stage 1 (general → math bitext → task QA) is important: ablations show that skipping steps degrades performance.
- Freezing the mapping layer during Stage 2 (DoRA fine-tuning) is important for stability; joint fine-tuning of both components degrades performance.
- The approach generalizes across MGSM (multilingual) and MSVAMP (another math reasoning benchmark), not just AfriMGSM.
- The Mila-McGill affiliation is notable: this is the same institution as the IndigenousAI project.

## Relevance to Indigenous AI

MERLIN's architectural contribution — a mapping layer that aligns a multilingual encoder to an LLM, trained via a staged curriculum — offers a potential path for Mohawk NLP that does not require a full Mohawk-specific LLM pretraining run. If a multilingual encoder has been exposed to Mohawk text (or Iroquoian languages more broadly), the MERLIN mapping layer could be trained to bridge that encoder to a capable English-dominant LLM, providing Mohawk reasoning/generation capabilities at much lower resource cost than full pretraining. The curriculum progression (general → specialized) also provides a principled framework for the data scarcity problem: start from English/French general data, then progressively introduce Mohawk-relevant data at each curriculum stage. The Mila-McGill affiliation creates potential direct collaboration opportunity.

## Limitations & Critiques

- MERLIN is evaluated on mathematical reasoning tasks (MGSM, AfriMGSM, MSVAMP); it is not evaluated on language generation, translation, or morphological tasks that would be directly relevant to Mohawk language tools.
- The African languages in the evaluation all have more digital resources than Mohawk; whether the mapping layer approach works when the multilingual encoder has seen very little of the target language is not tested.
- The paper focuses on reasoning capability, not cultural appropriateness, community control, or data sovereignty — the dimensions most important for the IndigenousAI project's context.
- DoRA fine-tuning, while parameter-efficient, still requires GPU resources; practical deployability for communities without institutional compute infrastructure is not addressed.

## Questions & Follow-ups

- Does any multilingual encoder (Glot500-m, mBERT, XLM-R, or successors) include enough Mohawk or Iroquoian language text for the MERLIN mapping layer to learn meaningful alignment?
- How does MERLIN's Stage 1 curriculum compare to AfriInstruct's continual pretraining approach for the same class of low-resource languages?
- Could MERLIN's mapping layer approach be adapted for Mohawk→English translation or morphological analysis rather than mathematical reasoning?
- Related work: Uemura et al. (2024) AfriInstruct (same team, prior work); McGiff and Nikolov (2025) on data augmentation for LRL; Pinhanez et al. (2024) on tiny-data fine-tuning for indigenous languages.
