# Read it in Two Steps: Translating Extremely Low-Resource Languages with Code-Augmented Grammar Books

**Authors:** Chen Zhang, Jiuheng Lin, Xiao Liu, Zekai Zhang, Yansong Feng
**Year:** 2025
**Venue:** Proceedings of the 63rd Annual Meeting of the Association for Computational Linguistics (ACL 2025, Volume 1: Long Papers)
**Link:** https://github.com/Infinite-set/ZhuangRules

---

## Core Argument

Using grammar books for LLM-based translation of extremely low-resource (XLR) languages fails not because LLMs cannot apply grammar rules, but because they cannot reliably find the right rules within a long grammar book — rule retrieval is the primary bottleneck. By decomposing grammar-based translation into two explicit steps (retrieval then application) and representing grammar rules as pseudo-code functions rather than natural language prose, both steps improve substantially, yielding a 13.1% BLEU gain over end-to-end grammar-book prompting.

## Key Concepts

- **ZHUANGRULES:** A new modular dataset of 109 atomic grammar rules for Zhuang (a low-resource language in southern China), each paired with an average of 5.6 Zhuang-Chinese parallel sentence examples and a bilingual lexicon — designed to disentangle grammar comprehension from lexical knowledge.
- **Rule retrieval vs. rule application:** The two-step decomposition of grammar-based MT; retrieval is finding which rules are needed for a given sentence, application is correctly using a known rule to translate.
- **RULE-BY-RULE retrieval:** A strategy that presents each grammar rule individually (binary classification: relevant or not?) rather than asking the LLM to scan an entire grammar book at once — dramatically improves recall over FULL-BOOK prompting.
- **Code rules:** Grammar rules converted into pseudo-code Python functions by GPT-4o, encoding both a step-by-step comment and a procedural function body that mirrors the translation logic; structurally analogous to code's control flow (if-else for conditionality, arithmetic for affixation).
- **Interlinear glossed text (IGT):** Morpheme-by-morpheme annotations used as an intermediate representation during translation; found helpful alongside parallel examples but slightly noisy when synthetically generated.

## Main Findings

- Grammar rule retrieval is the dominant bottleneck: providing only the required rule yields ~15+ BLEU points more than providing the full grammar book without retrieval, because irrelevant rules actively confuse LLMs.
- RULE-BY-RULE retrieval achieves up to ~90% recall with fewer than 5 retrieved rules on average, far outperforming BM25 (which achieves only ~27-42% recall@1) and FULL-BOOK LLM prompting (~50% recall).
- Code rules outperform textual rules in both retrieval (up to 8.8% recall improvement) and application (average 8.5% chrF++ improvement on ZHUANGRULES), with the advantage most pronounced on hard rules involving multiple transformation steps.
- The best complete pipeline — code rules + RULE-BY-RULE retrieval — achieves a 13.1% BLEU improvement over end-to-end textual grammar book prompting for Qwen-2.5-72B.
- Parallel sentence examples provide additive gains on top of grammar rules (~14.7% chrF++); synthetic IGTs add noise when rules are already provided.
- Grammar rules induced from parallel examples by LLMs (without gold rules) still substantially outperform no-rule baselines, suggesting LLMs can partially recover grammar structure from data alone.

## Relevance to Indigenous AI

The paper directly advances the practical toolkit for low-resource language NLP: grammar books — the kind of resource that exists for many Indigenous languages including Kanien'kéha — can now be leveraged more reliably through the code-rule + rule-by-rule pipeline. The finding that rule retrieval (not rule comprehension) is the bottleneck reframes where human linguistic expertise adds most value: not in writing better prose rules, but in modularizing them so machines can navigate them. For the Mila Indigenous AI project, this suggests that Mohawk grammatical documentation could be converted into structured, code-formatted rule sets to power more accurate translation or pedagogical tools, with minimal parallel data. The dataset construction methodology (modular rules + lexicons + IGTs) also provides a replicable template for creating controlled evaluation resources for Mohawk.

## Limitations & Critiques

- Only two XLR languages studied (Zhuang and Kalamang); generalization to other language families and typologies remains to be established.
- Code rules are substantially longer than textual rules (32K vs. 4.4K tokens for the full rule set), increasing inference costs — partially offset by the retrieval step.
- Most experiments test single-rule translation scenarios; the multi-rule experiments are limited to a small set of 96 instances requiring exactly two rules, leaving real-world multi-rule complexity underexplored.
- Grammar rule conversion to code requires a capable LLM (GPT-4o used here) and light human quality checking — not zero-cost, though minimal.
- No community engagement or ethical framework is discussed; Zhuang is a minority language in China but the paper does not address speaker community involvement in the research.

## Questions & Follow-ups

- Could Mohawk grammar rules (e.g., from Bonvillain's reference grammar or community-produced materials) be converted to code-format rules using this pipeline? What would be the first 10-20 rules to encode?
- The paper notes that Zhuang grammar books are in Chinese — does the language of the grammar book matter? (Their own ablation in Table 9 shows minimal effect, which is encouraging for using English-language Mohawk grammars.)
- How does this pipeline interact with community review processes — can speakers validate code rules without being programmers, or does the code format exclude non-technical stakeholders?
- Related work to explore: Tanzer et al. (2024) MTOB benchmark; Hus & Anastasopoulos (2024) "Back to school: Translation using grammar books"; Aycock et al. (2024) "Can LLMs really learn to translate a low-resource language from one grammar book?"
