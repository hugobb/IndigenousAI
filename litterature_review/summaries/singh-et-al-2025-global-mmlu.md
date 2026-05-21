# Global MMLU: Understanding and Addressing Cultural and Linguistic Biases in Multilingual Evaluation

**Authors:** Shivalika Singh, Angelika Romanou, Clémentine Fourrier, David I. Adelani, Jian Gang Ngui, Daniel Vila-Suero, Peerat Limkonchotiwat, Kelly Marchisio, Wei Qi Leong, Yosephine Susanto, Raymond Ng, Shayne Longpre, Sebastian Ruder, Wei-Yin Ko, Antoine Bosselut, Alice Oh, André F. T. Martins, Leshem Choshen, Daphne Ippolito, Enzo Ferrante, Marzieh Fadaee, Beyza Ermis, Sara Hooker
**Year:** 2025
**Venue:** Proceedings of the 63rd Annual Meeting of the Association for Computational Linguistics (ACL 2025), Long Papers
**Link:** https://huggingface.co/datasets/CohereForAI/Global-MMLU

---

## Core Argument

The MMLU benchmark — a de facto standard for LLM evaluation — is deeply Western-centric: 28% of sampled questions require culturally sensitive knowledge, and 86.5% of culture-tagged questions reflect Western culture. Machine-translating MMLU into other languages carries these biases forward without fixing them. Global-MMLU addresses this by releasing a 42-language MMLU extension with improved human translations, cultural sensitivity annotations (Culturally-Sensitive / Culturally-Agnostic splits), and evidence that model rankings shift significantly when CS and CA subsets are evaluated separately.

## Key Concepts

- **Culturally-Sensitive (CS) subset:** Questions that require cultural, geographic, or dialect knowledge to answer correctly — disproportionately drawn from Humanities and Social Sciences.
- **Culturally-Agnostic (CA) subset:** Questions answerable without culture-specific context — dominated by STEM, Medical, and Business content.
- **TransMMLU:** The common practice of machine-translating the original English MMLU for multilingual benchmarking, which inherits all Western-centric biases of the source dataset.
- **Translationese:** Unnatural artifacts introduced by machine translation (unusual phrasing, unnaturally literal structures) that degrade evaluation quality independent of cultural bias.
- **Model rank shift:** The empirical finding that model rankings change by an average of 7.3 positions when comparing CS vs. CA performance, revealing that "progress on MMLU" is largely progress on Western cultural knowledge.

## Main Findings

- 28% of MMLU requires CS knowledge; 86.5% of CS questions reflect Western culture and 64.5% require North American regional knowledge specifically.
- Model rankings on CS datasets show 7.3 average position shifts compared to a uniform MMLU sample, versus only 3.7 shifts on CA datasets — demonstrating that cultural sensitivity is a major but hidden source of evaluation variance.
- Human-translated data consistently yields more accurate performance estimates than machine-translated data, especially for high-resource languages; low-resource languages show the highest cross-language performance variance.
- Performance on CS tasks is higher on average (because CS questions come from humanities/social sciences where models excel in English) but more variable across languages, with instability increasing for low-resource settings.
- Larger models show higher consistency across CA/CS splits; small models show comparable CA/CS rank stability but lower absolute accuracy overall.

## Relevance to Indigenous AI

Global-MMLU makes the Western-centric default of standard LLM evaluation explicit and measurable. For an Indigenous AI project, the key contribution is the CS/CA annotation methodology: it provides a replicable framework for identifying which evaluation questions require community-specific knowledge, as opposed to universal technical knowledge. The paper also directly acknowledges the near-absence of Indigenous cultures in MMLU — Indigenous culture tags account for only 0.7% of CS samples, overwhelmingly US-linked — which quantifies the representational gap that motivates culturally grounded Indigenous language benchmarks. The participatory annotation methodology (200+ annotators, community translators, Argilla-based interface) offers a practical model for building evaluation sets with Six Nations community involvement.

## Limitations & Critiques

- Global-MMLU does not introduce new culturally grounded questions; it annotates and retranslates existing Western-centric MMLU content. True cultural inclusion would require creating original questions from underrepresented cultures.
- Community annotator participation was uneven across languages, potentially introducing skewed quality in some languages.
- The dataset covers 42 languages, still a small fraction of the world's linguistic diversity; endangered and Indigenous languages (including Mohawk) are entirely absent.
- Identifying cultural sensitivity does not guarantee cultural inclusion — annotating questions as CS does not address the fact that non-Western cultural knowledge is structurally absent from the benchmark.

## Questions & Follow-ups

- What would a culturally grounded evaluation benchmark look like if built from scratch within a Six Nations community, rather than by annotating a pre-existing Western dataset?
- The paper cites Adelani et al. (Mila/McGill) as a co-author — how does this institution's work on African language NLP inform approaches to Mohawk/Indigenous language evaluation?
- Related work to explore: INCLUDE (Romanou et al., 2024) — a 44-language benchmark using local exam content rather than translations of English MMLU.
