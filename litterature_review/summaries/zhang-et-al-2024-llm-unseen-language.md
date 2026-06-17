# Teaching Large Language Models an Unseen Language on the Fly

**Authors:** Chen Zhang, Xiao Liu, Jiuheng Lin, Yansong Feng
**Year:** 2024
**Venue:** Preprint (Peking University)

---

## Core Argument

LLMs can acquire functional translation ability for completely unseen languages through in-context learning alone — no parameter updates required. The DIPMTT++ framework, using a dictionary and only 5K parallel sentences as in-context resources, enables GPT-4 to go from 0 to 16 BLEU on Chinese-to-Zhuang translation and 32 BLEU on Zhuang-to-Chinese, while also demonstrating practical utility for assisting human translators working with languages they have never encountered.

## Key Concepts

- **Zhuang:** A Tai-Kadai language spoken in southern China; supported by no current LLMs at the time of study; used as the primary test case for a truly unseen language.
- **DIPMTT++ (Dictionary and In-context Parallel MT++):** A framework combining dictionary lookup, parallel sentence retrieval, synonym expansion, and fuzzy matching to construct maximally informative prompts for translating unseen languages.
- **Synonym expansion:** Augmenting the dictionary with synonyms and related terms to improve coverage for words not found directly in the dictionary — a practical workaround for sparse lexicons.
- **Fuzzy matching:** Retrieving parallel examples that approximately match source-side tokens, even without exact overlap; allows retrieval when the exact sentence form is not in the corpus.
- **Human-in-the-loop translation:** The paper demonstrates DIPMTT++ assisting a human translator who has never seen Zhuang, substantially improving their translation speed and quality.

## Main Findings

- DIPMTT++ enables GPT-4 to achieve 16 BLEU for Chinese→Zhuang and 32 BLEU for Zhuang→Chinese using only a dictionary and 5K parallel sentences — from a baseline of 0 BLEU with no in-context resources.
- The framework is validated on a second unseen language (Kalamang), confirming generalizability beyond Zhuang.
- Synonym expansion and fuzzy matching are both critical components; ablations show significant drops when either is removed.
- DIPMTT++ substantially improves human translator performance on Zhuang text, demonstrating practical utility as an assistive tool rather than a fully autonomous system.
- The study is one of the first to explicitly evaluate LLM-assisted translation as a tool for human translators on an unseen language, rather than measuring autonomous machine translation quality alone.

## Relevance to Indigenous AI

DIPMTT++ is the most directly applicable framework in the corpus for the Mohawk translation use case: it is designed for languages entirely unseen by LLMs, requires only a dictionary and a small parallel corpus (5K sentences), and has been validated on Kalamang — a language with a very similar resource profile to Mohawk. The human-in-the-loop translation finding is particularly important: framing the tool as an assistant to Mohawk community translators (rather than a replacement) is both more feasible technically and more aligned with the project's community-centered values. Synonym expansion and fuzzy matching are also practically important for Mohawk, where exact dictionary matches will be rare given polysynthetic morphology. The Zhuang→Chinese direction outperforming Chinese→Zhuang (32 vs. 16 BLEU) also replicates the pattern seen in Tanzer et al. (2024): translating from the low-resource language into the high-resource language is consistently easier.

## Limitations & Critiques

- 5K parallel sentences is significantly more data than currently available for Mohawk; the framework's performance with fewer sentences (e.g., 500 or 1K) is not reported.
- Dictionary construction for Zhuang presumably involved linguistic expertise; for Mohawk, the availability and quality of existing dictionaries is a key constraint.
- Does not address data sovereignty or community consent for the parallel corpus and dictionary resources used.

## Questions & Follow-ups

- How does DIPMTT++ performance degrade as the parallel corpus is reduced from 5K to 1K, 500, or 100 sentences? What is the practical minimum for useful Mohawk translation?
- Could DIPMTT++ be adapted to use morpheme-level dictionary entries rather than word-level entries, to better handle Mohawk's polysynthetic morphology?
- Related work: Tanzer et al. (2024) (grammar-book translation for Kalamang), Aycock et al. (2025) (parallel examples vs. grammar books), Pei et al. (2025) (Manchu ICL MT), Coleman et al. (2026) (LLM-RBMT for Owens Valley Paiute).
