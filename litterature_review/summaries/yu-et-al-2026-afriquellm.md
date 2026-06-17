# AfriqueLLM: How Data Mixing and Model Architecture Impact Continued Pre-training for African Languages

**Authors:** Hao Yu, Tianyi Xu, Michael A. Hedderich, Wassim Hamidouche, Syed Waqas Zamir, David Ifeoluwa Adelani
**Year:** 2026
**Venue:** arXiv 2026 (McGill University + Mila-Quebec AI Institute + LMU Munich + Microsoft AI for Good)

---

## Core Argument

Continued pre-training (CPT) on a carefully curated 26B-token corpus across 20 African languages — with systematic variation in data mixture (monolingual, code, math, synthetic translated data, parallel data) and base model architecture (Llama 3.1, Gemma 3, Qwen 3, in multiple sizes) — demonstrates that **data composition is the primary driver of CPT gains**, not model scale alone. Adding math, code, and synthetic translated data consistently improves performance including on reasoning tasks. Architectural choice dominates scale when comparing across model families; strong multilingual base models do not reliably predict better post-CPT outcomes.

## Key Concepts

- **AfriqueLLM suite:** A collection of open LLMs adapted to 20 African languages via CPT on 26B tokens. Five base models are evaluated: Llama 3.1 8B, Gemma 3 4B, Gemma 3 12B, Qwen 3 4B, Qwen 3 8B, Qwen 3 14B.
- **CPT data mixtures (systematically varied):**
  - **C** (Corpus): monolingual African language text from FineWeb2, WURA, MADLAD-400; high-resource languages (English, French, Portuguese, Arabic) capped at 1B tokens to prevent catastrophic forgetting.
  - **M** (Math): ~1B tokens of FineMath-4+ educational mathematics.
  - **S** (Synthetic): 324M tokens of GPT-4.1-translated domain-diverse text (10 domains including science, health, education, food) + math reasoning with thinking traces.
  - **P** (Parallel): 456M tokens of high-quality NLLB bilingual pairs filtered at 0.7 SSA-COMET score.
  - Mixtures: CM, CMP, CMS, CMSP evaluated systematically.
- **UniMax sampling:** Caps high-resource languages at 1B tokens and upsamples lower-resource languages up to 5 epochs, producing a more balanced training distribution across 20 unequal-resource languages.
- **AfroBench-Lite evaluation:** 7 tasks covering Math (AfriMGSM), Knowledge (AfriMMLU), NLI (AfriXNLI), Reading Comprehension (Belebele), Translation (Flores/SSA-COMET), Intent Classification (Injongo), Topic Classification (SIB-200).
- **Key training findings:** Learning rate 5e-5 optimal; 16k context length best for reasoning; cosine scheduler with warmup ratio 0.001.
- **Mila + McGill affiliation:** Same institutional home as the IndigenousAI project.

## Main Findings

1. **Data composition is the strongest driver of CPT gains.** Adding math + code + synthetic translated data (CMSP mixture) yields consistent improvements over monolingual-only CPT across architectures and tasks, including on reasoning-heavy tasks like AfriMGSM.
2. **Within a fixed architecture, larger models generally improve.** Qwen3-8B post-CPT is competitive with Gemma3-12B post-CPT — architectural choice dominates scale when comparing across families.
3. **Strong multilingual base models do not reliably predict better post-CPT outcomes.** A base model with strong multilingual coverage does not guarantee better adaptation; task-aligned data and architecture are more predictive.
4. **Best models (Qwen3 8B and 14B) better preserve high-resource language performance** after CPT and achieve strong long-context results (document-level translation).
5. **Catastrophic forgetting is mitigated** by including high-resource language (English/French/Portuguese/Arabic) replay data capped at 1B tokens.
6. All AfriqueLLM models are publicly released on HuggingFace.

## Relevance to Indigenous AI

AfriqueLLM is the most methodologically advanced and resource-relevant analogue to what the IndigenousAI project might attempt for Mohawk. Four direct implications:

1. **Data composition over scale:** The finding that data mixture matters more than model size means the IndigenousAI project should prioritize curating a high-quality, topically diverse Mohawk corpus (including any available structured/domain text) over selecting the largest possible base model.
2. **Math and code as cognitive anchors:** The hypothesis that math/code data "acts as a cognitive anchor during CPT" — helping the model maintain logical consistency when adapting to a new language — is important for Mohawk CPT. Including math and code in a Mohawk CPT corpus (even in English or French) may help preserve reasoning capability while adapting to Mohawk.
3. **Synthetic data via translation:** GPT-4.1-translated domain content was used to enrich African language corpora across 10 domains. An analogous strategy for Mohawk — machine-translating high-quality English content into Mohawk for CPT — could substantially expand the effective training corpus, though quality control (SSA-COMET equivalent for Mohawk) would be essential.
4. **Mila-McGill affiliation:** The AfriqueLLM team (David Adelani and collaborators at Mila-McGill) is working on the same class of problem in the same institution. This creates a direct potential collaboration channel for the IndigenousAI project.

## Limitations & Critiques

- The 20 African languages all have far more digital text than Mohawk — even the lowest-resource language in the AfriqueLLM corpus (Tswana, Tigrinya) has ~90–140M tokens, compared to an estimated few million tokens for all available Mohawk text.
- The CPT approach requires substantial GPU compute (up to 16 nodes × 64 H100 GPUs); the IndigenousAI project likely has much more limited compute.
- Community engagement, data sovereignty, and ethical co-development are not addressed; the paper treats African languages as a technical NLP challenge without community involvement.
- Evaluation benchmarks (AfriMGSM, AfriMMLU) are adapted from English tasks; no Mohawk-equivalent benchmarks exist, making direct methodological transfer of evaluation challenging.
- The synthetic data quality filtering relies on SSA-COMET, a model specifically trained for African language MT quality estimation; no equivalent exists for Mohawk.

## Questions & Follow-ups

- What is the minimum viable data volume for CPT to produce meaningful improvement for an extremely low-resource language like Mohawk? AfriqueLLM's lowest-resource languages (~90M tokens) are still much larger than what's available for Mohawk.
- Could a scaled-down version of the AfriqueLLM recipe (smaller model, smaller corpus, lighter compute) produce functional Mohawk language adaptation? What would the minimum-viable CPT setup look like?
- How would the IndigenousAI project approach the community ethics dimensions that AfriqueLLM leaves unaddressed — specifically, who controls a Mohawk-adapted model after it is trained?
- Related work: Uemura et al. (2024) AfriInstruct (same problem domain, earlier approach); Uemura et al. (2026) MERLIN (same team, cross-lingual reasoning); Pinhanez et al. (2024) on fine-tuning with tiny indigenous language data; McGiff and Nikolov (2025) on data augmentation for LRL; Mager et al. (2023) on NMT for indigenous languages.
