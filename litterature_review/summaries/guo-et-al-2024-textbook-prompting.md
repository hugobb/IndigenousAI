# Teaching Large Language Models to Translate on Low-Resource Languages with Textbook Prompting

**Authors:** Ping Guo, Yubing Ren, Yue Hu, Yunpeng Li, Jiarui Zhang, Xingsheng Zhang, Heyan Huang
**Year:** 2024
**Venue:** Preprint (Institute of Information Engineering, Chinese Academy of Sciences; Beijing Institute of Technology)

---

## Core Argument

Drawing on the analogy of human language learning from structured textbooks, the TALENT (Translate After LEarNing Textbook) framework improves LLM translation for low-resource languages by constructing a structured textbook of syntax patterns, having the model absorb those patterns, and then using both the textbook and extracted patterns to guide translation. Evaluated on 112 low-resource languages from FLORES-200, TALENT achieves a consistent 14.8% improvement over zero-shot baselines.

## Key Concepts

- **TALENT (Translate After LEarNing Textbook):** A three-step prompting framework: (1) create a structured textbook for the target LRL; (2) have the LLM extract and internalize syntax patterns from the textbook; (3) use the textbook and patterns to guide translation.
- **Textbook construction:** A structured document containing grammar rules, vocabulary, and syntax patterns, analogous to a human language learning textbook; created for each target low-resource language.
- **Syntax pattern extraction:** The LLM is explicitly prompted to identify and articulate grammatical patterns from the textbook before attempting translation — a form of guided in-context grammar learning.
- **FLORES-200:** A benchmark covering 200 languages used for evaluation; TALENT is tested on the 112 low-resource language directions within it.

## Main Findings

- TALENT improves translation performance by 14.8% on average over zero-shot baselines across 112 low-resource language pairs, using both ChatGPT and BLOOMZ.
- The structured textbook and explicit syntax pattern extraction step contribute independently to performance; the combination outperforms either alone.
- TALENT improves LLM comprehension of low-resource languages and equips the model with knowledge needed to generate accurate and fluent sentences — not just translation outputs.
- Gains are consistent across both a large proprietary model (ChatGPT) and a smaller multilingual model (BLOOMZ), suggesting the approach is architecture-agnostic.

## Relevance to Indigenous AI

TALENT offers a structured alternative to unstructured grammar-book prompting (Tanzer et al., 2024): rather than dumping a full grammar book into the context, it guides the LLM through an explicit learning step before translation. For Mohawk, this structured approach could be applied using existing grammar documentation — particularly given Mohawk's complex morphological system, where explicit syntax pattern extraction (e.g., pronominal prefix rules, tense/aspect suffixes) might help the model internalize structure before attempting translation. The approach is also practical because it does not require parallel corpora, only structured grammar materials that community linguists could help create or validate.

## Limitations & Critiques

- Evaluated on FLORES-200, which includes many low-resource languages but not Mohawk or other Haudenosaunee languages; direct applicability is untested.
- The textbook construction process is not clearly specified — it is unclear how much expert linguistic knowledge is required to create an effective textbook for an unstudied language.
- Like other grammar-based prompting approaches (Aycock et al., 2025; Pei et al., 2025), gains over parallel-data approaches may be modest; the paper does not compare against few-shot with parallel examples.

## Questions & Follow-ups

- How does TALENT compare to Tanzer et al. (2024) and Aycock et al. (2025) on the same language pairs? Does the structured textbook + syntax extraction outperform unstructured grammar-book prompting?
- Could a TALENT-style textbook for Mohawk be co-constructed with community linguists, with the syntax pattern extraction step serving as a validation checkpoint for cultural and linguistic accuracy?
- Related work: Tanzer et al. (2024), Aycock et al. (2025), Zhang et al. (2024 DIPMTT++), Pei et al. (2025).
