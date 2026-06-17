
# Task-Appropriate Data Selection for XLR Languages

**Category:** Process & Methodology Technique
**Applicable Context:** Any XLR or low-resource language project deciding how to allocate scarce data collection effort; particularly when grammar books or linguistic resources exist alongside a small parallel corpus

## Description

When working with extremely low-resource (XLR) languages, the type of data you collect should be determined by the task you are solving — not by what is easiest to obtain or most academically prestigious. Aycock et al. (2025) demonstrate that the relationship between linguistic resource types and task performance is strongly task-specific:

- **Machine translation** benefits almost exclusively from **parallel sentence examples**; grammatical explanations add no statistically significant advantage above the vocabulary coverage provided by parallel sentences.
- **Linguistic tasks** (grammaticality judgment, morphological analysis, interlinear gloss prediction) benefit from **grammatical and typological knowledge**, with parallel data providing additional signal but typological prompts achieving the strongest standalone gains.

This means that investing in grammar book production or grammatical description is misallocated effort if the downstream task is translation — and conversely, collecting parallel corpora without any linguistic structure is suboptimal for morphological and grammaticality tasks. The principle extends beyond grammar books: any linguistic resource (dictionary, morphological lexicon, annotated corpus, typological profile) should be evaluated for its task relevance before collection effort is invested.

## When to Use

- Before any data collection campaign for an XLR language project.
- When deciding whether to prioritize parallel corpus collection, grammar documentation, or typological annotation.
- When evaluating whether an existing grammar book or descriptive resource is likely to help your target NLP task.
- When scoping a budget or community engagement plan for data work.
- When a collaborator or stakeholder advocates for one resource type ("we should build a grammar first") — use this principle to interrogate whether that resource type matches the task.

## How to Apply

1. **Identify the primary downstream task(s).** Be specific:
   - Translation (any direction)? → Parallel sentences are the primary lever.
   - Morphological analysis / segmentation? → Annotated morphological data (IGT, morpheme-segmented corpora) + typological features.
   - Grammaticality judgment / acceptability? → Grammatical knowledge (typological features, small annotated examples) + parallel sentences.
   - Language modeling / text generation? → Monolingual text, then consider parallel data for alignment.
   - Spell-checking / normalization? → Annotated word forms, morphological lexicon.

2. **Map resource types to task utility:**

   | Resource Type | MT | Morphological Analysis | Grammaticality | IGT Prediction |
   | --- | --- | --- | --- | --- |
   | Parallel sentences (bilingual) | ★★★ | ★★ | ★★ | ★★ |
   | IGT (interlinear glossed text) | ★★★ | ★★★ | ★★ | ★★★ |
   | Bilingual wordlist/dictionary | ★★ | ★★ | ★ | ★★ |
   | Typological features (Grambank) | ★ | ★★ | ★★★ | ★★ |
   | Grammatical explanations (prose) | ✗ | ★ | ★ | ★ |
   | Monolingual text | ★ | ★ | ★ | ★ |

   (Based on Aycock et al. 2025 ablation results; ★★★ = primary driver, ✗ = no significant effect)

3. **For translation tasks: prioritize parallel data over linguistic description.** Even 400–1200 parallel sentences, when used to fine-tune a small MT model (e.g., NLLB-1.3B), can match or exceed the performance of prompting a 1M-token-context LLM with an entire grammar book. Document and collect parallel sentences first.

4. **For linguistic tasks: prioritize IGT and typological annotation.** Interlinear glossed text provides both parallel signal and morpheme-level annotation. Typological feature profiles (Grambank) are freely available for most documented languages and require no additional community data collection.

5. **When a grammar book already exists:** Extract the parallel examples (see Grammar Book Parallel Data Extraction technique) rather than treating the book as a monolithic linguistic description. The parallel examples embedded in grammar books are the valuable component for MT.

6. **Communicate this to communities and funders.** Community-driven language documentation often prioritizes grammar writing as a form of linguistic prestige. If the practical goal is building an MT system or a spell-checker, explain clearly that parallel text collection serves that goal better, and structure data collection activities accordingly — without dismissing the cultural value of grammar documentation for other purposes.

7. **Track resource type alongside performance metrics.** When reporting results, always specify which resource types were used (parallel sentences only, grammar book, typological features, etc.) so comparisons across studies are meaningful.

## Evidence

Aycock et al. (2025) — ICLR 2025 — demonstrate this with rigorous ablation across three languages:

**For MT (Kalamang kgv, Nepali npi, Guarani gug):**
- `BOOK_non-para` (grammatical explanations only, no parallel examples): 22.6 CHRF++ eng→kgv — 8 points worse than the parallel-only subset.
- `BOOK_para` (parallel examples only): 30.8 CHRF++ eng→kgv — matches or outperforms the full grammar book for Gemini.
- Adding grammatical explanations to parallel examples: no statistically significant CHRF++ gain (regression p=0.997).
- Fine-tuned NLLB on the same parallel data: 34.2 CHRF++ eng→kgv — comparable to Gemini with the full grammar book, at a fraction of the compute cost.

**For linguistic tasks (Kalamang):**
- Grammaticality judgment: `TYP + BOOK_para` (typological prompt + parallel examples) achieves up to 83% accuracy — 8% above the full grammar book.
- IGT prediction: `TYP + BOOK_para` achieves 46.1 morpheme accuracy — 5 points above `BOOK_all` (full grammar book) and 25 points above `BOOK_non-para`.
- Grammatical explanations alone (`BOOK_non-para`) score only 21.0 morpheme accuracy — worse than 10*-shot (43.9).

**Statistical confirmation:** Linear regression of CHRF++ on test-set vocabulary (type) coverage shows that all translation performance gains can be statistically explained by vocabulary coverage from parallel examples (p&lt;0.005), and grammar explanations provide no additional predictive power beyond coverage.

## Variations & Configuration

- **Hybrid tasks:** For tasks that bridge translation and linguistic analysis (e.g., glossed MT, morpheme-aware translation), both parallel sentences and linguistic annotation are needed — IGT data serves both simultaneously.
- **Resource scarcity trade-offs:** When community bandwidth is extremely limited, 400 parallel sentences collected in structured elicitation sessions may outperform an entire grammar book for MT purposes. Estimate collection cost per resource type before committing.
- **Grammar books as parallel data sources:** When a grammar book already exists, the cost-efficient path is to extract its parallel examples (see Grammar Book Parallel Data Extraction) rather than creating new resources from scratch.
- **Domain alignment:** Parallel sentences should be drawn from domains relevant to the intended use case. Grammar book examples tend to be short, citation-form sentences; real-world MT may require domain-specific parallel text.

## Strengths & Weaknesses

| Strengths | Weaknesses |
| --- | --- |
| Grounded in direct empirical ablation across multiple languages (kgv, npi, gug) | Evidence base comes primarily from MT and two linguistic tasks; other tasks (ASR, parsing) may have different resource-type relationships |
| Provides clear decision guidance for data collection prioritization | Does not address community preferences or cultural priorities around language documentation forms |
| Helps avoid misallocating scarce community and funding resources on data that won't help the target task | Grammar documentation has value beyond NLP; this principle risks being misread as "grammar books are useless" |
| Transferable insight: any resource type should be evaluated for task relevance before investment | The finding is LLM-specific: fine-tuned models may use grammatical structure differently than in-context LLM prompting |

## References

- Aycock, S., Stap, D., Wu, D., Monz, C., & Sima'an, K. (2025). Can LLMs Really Learn to Translate A Low-Resource Language from One Grammar Book? ICLR 2025.
- Tanzer, M., et al. (2024). A Benchmark for Learning to Translate a New Language from One Grammar Book. ICLR 2024.
- Ginn, M., et al. (2023). Findings of the SIGMORPHON 2023 Shared Task on Interlinear Glossing. ACL 2023.
- Costa-jussà, M. R., et al. (2024). No Language Left Behind: Scaling Human-Centered Machine Translation. (NLLB)

??? note "📋 Self-Review Notes"
    **Reviewed:** 2026-06-11

    **Criterion 1 — Implementable from scratch:** PASS — The 7-step "How to Apply" section is concrete: it names specific tasks, resource types, model sizes (NLLB-1.3B), and sentence-count thresholds (400–1200). A practitioner can act on it without reading the paper. The one gap is that there is no protocol for how to actually conduct parallel sentence elicitation sessions, but that is scoped to a separate technique doc (Grammar Book Parallel Data Extraction).

    **Criterion 2 — Empirical results with numbers:** PASS — Specific CHRF++ scores (22.6, 30.8, 34.2), morpheme accuracy figures (46.1, 43.9, 21.0), grammaticality accuracy (83%), regression p-values (p&lt;0.005, p=0.997), named languages (kgv, npi, gug), named models (Gemini, NLLB-1.3B), and conference venue (ICLR 2025) are all present.

    **Criterion 3 — Applicable context clarity:** PASS — The "When to Use" section lists five distinct decision points with explicit triggers. The "Applicable Context" front-matter and the opening paragraph clearly scope the technique to XLR/low-resource projects with scarce data budgets.

    **Criterion 4 — Pseudocode/flowchart completeness:** PARTIAL — The utility matrix and 7-step list convey the decision logic clearly for a practitioner, but there is no formal pseudocode or flowchart. A reader must mentally construct the if/else branching (task → resource type → action) from prose. Adding a decision-tree diagram or pseudocode block would make the logic immediately scannable.

    **Criterion 5 — Failure modes:** PARTIAL — The Strengths & Weaknesses table documents important caveats (LLM-specificity, community preference tensions, ASR/parsing not covered, grammar-book misreading risk). However, it does not quantify what happens when the wrong data type is chosen (e.g., "collecting only grammatical explanations for MT yields ~8 CHRF++ below the parallel-only baseline" is inferable from the Evidence section but not stated explicitly as a failure consequence). Explicitly linking the evidence numbers to failure outcomes would strengthen this criterion.

    **Overall:** The technique doc is well-grounded and immediately actionable. The two gaps are (1) absence of a visual decision flowchart to make branching logic scannable at a glance, and (2) failure modes are implied by the evidence numbers rather than stated as explicit "if you do X instead of Y, expect Z degradation" consequences.

