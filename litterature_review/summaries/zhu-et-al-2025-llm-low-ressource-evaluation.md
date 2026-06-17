# Evaluating Large Language Models for In-Context Learning of Linguistic Patterns In Unseen Low Resource Languages

**Authors:** Hongpu Zhu, Yuqi Liang, Wenjing Xu, Hongzhi Xu
**Year:** 2025
**Venue:** Proceedings of the First Workshop on Language Models for Low-Resource Languages (LoResLM 2025), co-located with COLING 2025
**Link:** https://github.com/Zhurp2020/LR_LLM_Eval

---

## Core Argument

LLMs possess genuine meta-linguistic reasoning abilities that can be activated for unseen low-resource languages — but standard IOL-style translation puzzles are too complex to reveal this because they bundle multiple linguistic rules at once. A step-by-step approach that scaffolds learning one rule at a time (lexical semantics → phonology → morpho-syntax → syntax) significantly improves LLM translation performance, with the best model (Claude 3.5 Sonnet) matching or exceeding human performance when translating unknown languages into English.

## Key Concepts

- **Meta-linguistic competence:** The abstract knowledge of how languages work (word order, agreement, morphology patterns) that LLMs acquire from training on high-resource languages and can potentially transfer to unseen languages.
- **Rosetta Stone puzzle format:** Evaluation paradigm drawn from the International Linguistics Olympiad (IOL): 10-15 parallel sentences in an unknown language and English are provided; the task is to deduce rules and translate new sentences.
- **Step-by-step approach:** Each original IOL puzzle is decomposed into 4-5 sub-puzzles, each targeting one linguistic rule category, presented sequentially in a multi-turn conversation so the LLM builds knowledge incrementally.
- **Direct inference:** Baseline condition where the full original puzzle (all rules mixed) is presented at once without decomposition.
- **Typological bias:** The observation that LLMs systematically underperform on languages with Object-Subject (O-S) word order and Noun-Adjective (N-A) order, likely reflecting imbalances in training data typology.

## Main Findings

- The step-by-step approach substantially outperforms direct inference across all 5 tested LLMs and both translation directions; exact match scores improve from near 0% (direct) to 10-41% (step-by-step) depending on model and direction.
- Claude 3.5 Sonnet surpasses average human performance when translating LR languages to English (BLEU 76.4 vs. human 68.4; EM 41.5% vs. human 35.2%) in the step-by-step setting.
- All models lag behind humans on translation into LR languages, with the gap widening on phonological and syntactic tasks; phonology is the hardest category for LLMs.
- LLMs show a systematic deficit on O-S order languages (compared to S-O) and N-A order languages (compared to A-N), a bias not observed in human participants and likely attributable to training data imbalance.
- Larger, proprietary models consistently outperform smaller open-source models; Llama 3.1 (405B) outperforms Llama 3.2 (90B), and GPT-4o outperforms both Llama variants.
- Performance on step-by-step decomposed puzzles (Table 3) is consistently higher than on the original IOL test set (Table 2), confirming that decomposition reduces the cognitive load for LLMs without simplifying the underlying linguistic content.

## Relevance to Indigenous AI

This paper provides the most direct evaluation of LLMs' intrinsic capacity to acquire and apply linguistic rules from minimal data — the core challenge when building NLP tools for languages like Kanien'kéha (Mohawk) where parallel corpora are scarce. The step-by-step scaffolding framework maps naturally onto language pedagogy and could inform the design of Mohawk language learning tools: rather than asking LLMs to handle the full complexity of a polysynthetic language at once, a structured curriculum introducing vocabulary, then morpho-syntax, then complex clause structures could yield much better performance. The typological bias findings are also directly relevant: Mohawk is a polysynthetic, verb-heavy language with morphological complexity that differs substantially from the S-O/A-N pattern dominant in LLM training data, suggesting models will need targeted prompting strategies or fine-tuning to handle Mohawk morpho-syntax reliably.

## Limitations & Critiques

- The step-by-step puzzles are hand-crafted by researchers with linguistic training — this process is labor-intensive and does not yet scale to new languages without significant expert effort.
- The 40 languages in the dataset, while diverse, do not include any Indigenous languages of the Americas or polysynthetic languages; it is unclear how well the framework handles extreme morphological complexity.
- Evaluation relies entirely on automatic metrics (BLEU-2, ChrF, exact match); no native speaker evaluation is included, which is especially important for morphologically rich or tonal languages where surface-level metrics may be misleading.
- The typological bias findings (O-S, N-A order) are preliminary and lack a systematic causal analysis — the authors acknowledge further investigation is needed.
- Human baseline consists of only 16 participants with linguistic training, which may not represent community members or non-specialist speakers.

## Questions & Follow-ups

- How would this step-by-step framework apply to Mohawk, a polysynthetic language where a single verb can encode what English expresses in an entire sentence? Would the step ordering need to be restructured (e.g., noun incorporation before basic word order)?
- Could the puzzle decomposition process itself be partially automated using an LLM given a reference grammar, reducing the human annotation bottleneck?
- The paper omits the language name from prompts to prevent data leakage — for genuinely endangered or Indigenous languages this concern may be less pressing, but the protocol raises the question of how to audit what LLMs already "know" about a given language before testing.
- Related work to explore: LINGOLY benchmark (Bean et al. 2024); Linguini benchmark (Sánchez et al. 2024); PuzzLing Machines (Sahin et al. 2020); Zhang et al. (2024) LINGOLLM for complementary approach using explicit linguistic resources.
