# Hire a Linguist!: Learning Endangered Languages in LLMs with In-Context Linguistic Descriptions

**Authors:** Kexun Zhang, Yee Man Choi, Zhenqiao Song, Taiqi He, William Yang Wang, Lei Li
**Year:** 2024
**Venue:** Findings of the Association for Computational Linguistics: ACL 2024
**Link:** https://github.com/LeiLiLab/LingoLLM

---

## Core Argument

LLMs fail at processing endangered languages because they lack training data, but most endangered languages do have grammar books and dictionaries — resources that human linguists use to learn unfamiliar languages. The paper proposes LINGOLLM, a training-free approach that injects linguistic knowledge (morphological analyzers, dictionaries, grammar books) directly into LLM prompts, enabling near-zero-to-meaningful translation performance on languages that are essentially absent from pre-training data.

## Key Concepts

- **LINGOLLM:** A four-step pipeline — morphological analysis → dictionary mapping → grammar-augmented prompting → downstream task inference — that requires no fine-tuning and adapts to available linguistic resources per language.
- **Morphological analyzer:** A finite-state transducer that splits words into stems and grammatical features (e.g. tense, number, voice), enabling precise dictionary lookup and annotation.
- **Gloss:** Word-by-word translation annotation produced by the dictionary mapping step, which the LLM uses as an intermediate representation before generating full translations.
- **In-context linguistic descriptions:** Grammar books and dictionaries provided in the LLM's prompt as instructional knowledge, replacing large training corpora.
- **Long-context understanding as LLM evaluation:** Because grammar books can exceed 50,000 tokens, LINGOLLM performance doubles as a benchmark for long-context reasoning capability across LLMs.

## Main Findings

- LINGOLLM raises GPT-4's average translation BLEU from 0.5 to 10.5 across 10 translation directions covering 8 endangered/low-resource languages (Manchu, Gitksan, Arapaho, Natugu, Tsez, Wolof, Uspanteko, Bribri).
- Mathematical reasoning accuracy improves from 18% (zero-shot) to 75% (LINGOLLM) on Manchu, and response selection accuracy from 43% to 63%.
- Morphological analysis adds approximately 19% BLEURT improvement over dictionary-only lookup, and grammar books add coherence and correct word order beyond what stems alone provide.
- Humans using the same dictionary + grammar book strategy still outperform LINGOLLM (BLEU 20.32 vs. 9.12 on Manchu), indicating the approach is valuable but not yet human-level.
- Performance degrades sharply when dictionary coverage drops or when linguistic descriptions across sources (morphological analyzer vs. dictionary) are mismatched.

## Relevance to Indigenous AI

LINGOLLM directly addresses the scarcity-of-data problem that affects virtually every Indigenous language including Kanien'kéha (Mohawk): it leverages the linguistic documentation that already exists (grammars, dictionaries) rather than requiring large parallel corpora. The approach validates that NLP tools need not wait for data accumulation — existing scholarly work by linguists and communities can immediately power LLM capabilities. For the Mila project, this suggests that digitized Mohawk dictionaries and grammar references could anchor a training-free translation or language-learning assistant, while the paper's emphasis on linguist collaboration models the kind of community-expert partnership central to Indigenous AI ethics.

## Limitations & Critiques

- Only tested on languages with Romanized scripts; non-Latin orthographies (including some forms used by Indigenous languages) are excluded and flagged as future work.
- Evaluation on math reasoning, word reordering, and keyword-to-text tasks is limited to Manchu only, making it hard to generalize those findings.
- Grammar book summarization by GPT-4 introduces a dependency on a proprietary model; information loss during summarization is unquantified.
- Digitization barriers (scanned books with handwriting, complex layouts, non-Latin alphabets) caused several languages to be dropped entirely, highlighting a practical bottleneck for many Indigenous language materials.
- BLEU scores in the 10-15 range remain far below usable translation quality; the system produces semantically plausible but often structurally imperfect output.
- No community involvement or consent framework is discussed; the approach treats endangered language documentation as a technical resource without addressing data sovereignty.

## Questions & Follow-ups

- How would LINGOLLM perform on Kanien'kéha (Mohawk), which has existing grammar references (e.g., Postal 1962, Bonvillain 1973) and community-produced dictionaries? What digitization work would be needed?
- Could a community-controlled version of this pipeline be built where the grammar book and dictionary remain on-premises and are never sent to a third-party LLM API, preserving data sovereignty?
- How does performance scale with grammar book quality and community validation — i.e., would a community-reviewed grammar outperform a purely academic one?
- Related work to explore: Tanzer et al. (2024) "A benchmark for learning to translate a new language from one grammar book" (MTOB/Kalamang); GlossLM (Ginn et al. 2024).
