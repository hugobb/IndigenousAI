# Overcoming Data Scarcity in Generative Language Modelling for Low-Resource Languages: A Systematic Review

**Authors:** Josh McGiff, Nikola S. Nikolov
**Year:** 2025
**Venue:** arXiv preprint (University of Limerick, Ireland)

---

## Core Argument

Generative language modelling for low-resource languages (LRLs) is systematically underserved: the dominant methods (ChatGPT, Gemini) overwhelmingly target English and a handful of high-resource languages. This systematic review of 54 studies synthesizes the technical strategies used to overcome data scarcity for generative LRL modelling — data augmentation, back-translation, multilingual training, and prompt engineering — and finds that research is concentrated on a small set of LRLs, architectures are dominated by transformers, and evaluation is inconsistent, hampering progress.

## Key Concepts

- **Data scarcity strategies:** Four main categories of intervention: (1) monolingual data augmentation (creating synthetic training data from existing monolingual text); (2) back-translation (using a target→source model to generate synthetic parallel data); (3) multilingual training (jointly training on multiple languages to share representations); (4) prompt engineering (using existing LLMs to generate or augment LRL data with little or no fine-tuning).
- **Transformer dominance:** Virtually all reviewed studies use transformer-based architectures; the diversity of approaches is in the data pipeline, not the model architecture.
- **LRL concentration:** Despite the stated goal of LRL inclusion, the 54 studies concentrate on the same small subset of LRLs (typically those with at least some digital presence: Welsh, Basque, Swahili, etc.). Truly endangered or Indigenous languages are rare in the sample.
- **Evaluation inconsistency:** The reviewed studies use heterogeneous evaluation metrics (BLEU, chrF, COMET, human evaluation) across different tasks, making systematic comparison difficult and preventing reliable conclusions about which methods work best.
- **Generative vs. understanding tasks:** Generative tasks (translation, summarization, text generation) show different data scarcity dynamics than understanding tasks (classification, NER); the review focuses on generative tasks specifically.

## Main Findings

- Data augmentation, back-translation, and multilingual training all show positive effects for LRL generative modelling, but effect sizes vary widely and are not reliably predicted by language or method type.
- Prompt engineering provides some gains for LRLs but is limited by what the base model already "knows" — for truly endangered languages with no pretraining signal, prompt-based methods provide minimal benefit.
- The field overrepresents a small set of LRLs with at least some digital infrastructure; genuinely endangered languages (fewer than a few thousand speakers, minimal digital text) remain largely unstudied.
- There is no consistent evaluation framework across studies, making it impossible to determine which methods are most effective for different types of LRL scenarios.
- The review identifies gaps: Indigenous languages (especially polysynthetic ones), languages without digital presence, and languages with non-Latin scripts are systematically underrepresented.

## Relevance to Indigenous AI

This review provides a useful inventory of data augmentation and training strategies for LRL generative modelling, most of which are relevant to Mohawk. The key finding — that prompt engineering and standard LLM access provide minimal benefit for truly endangered languages — directly confirms that the IndigenousAI project cannot simply use GPT-4 or Claude to "speak Mohawk"; dedicated data collection and fine-tuning pipelines are necessary. The data augmentation strategies (especially back-translation and multilingual training) are applicable and should be evaluated for Mohawk. The evaluation inconsistency finding is a methodological warning: the project should agree on standard metrics (chrF, COMET, human evaluation) before running experiments, to ensure comparability with the broader literature. The concentration-on-a-small-subset finding confirms that Mohawk is genuinely at the frontier of LRL NLP research, not a solved problem.

## Limitations & Critiques

- The review was conducted using PRISMA methodology but relies entirely on published studies; unpublished community-based language technology work (which is common in Indigenous contexts) is systematically excluded.
- The categorization of approaches (augmentation, back-translation, multilingual, prompt engineering) is not always clean; many studies combine multiple strategies, making category-level conclusions imprecise.
- The review does not distinguish between polysynthetic and other LRL types; the specific challenges of polysynthesis for generative modelling are not addressed.

## Questions & Follow-ups

- Which data augmentation methods have been tested on polysynthetic languages specifically? Are any of the 54 studies relevant to Algonquian, Iroquoian, or Eskimo-Aleut languages?
- How does back-translation perform when the target language (Mohawk) has very few or no reliable MT systems to generate the reverse direction?
- Related work: Mager et al. (2023) survey on NMT for ILA; Arnett and Bergen (2025) on byte-premium and data disparity; Schmidt et al. (2024) on tokenization for LRLs; Uemura et al. (2024, 2026) on AfriInstruct and MERLIN LRL training approaches.
