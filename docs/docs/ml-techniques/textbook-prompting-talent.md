
# Textbook Prompting (TALENT) for Low-Resource MT

**Category:** ML Technique
**Data Regime:** Zero-resource / &lt;1K sentences — no parallel corpus required; requires only monolingual text in the target language and a dictionary or word-level translation resource
**Applicable Languages:** Any low-resource language for which: (a) a monolingual text corpus exists (even small), (b) a bilingual dictionary or BabelNet coverage exists for key vocabulary, and (c) an LLM with some multilingual capability is used

## Description

TALENT (Translate After LEarNing Textbook) is a three-stage prompting framework that improves LLM translation quality for low-resource languages by mimicking the structured way humans learn foreign languages from textbooks. Rather than presenting an LLM with a translation task directly (zero-shot) or with a few parallel examples (few-shot), TALENT first constructs a structured "textbook" for the target language and then guides the LLM through an explicit absorption step to extract syntax patterns before translating.

The framework addresses a core problem: LLMs have little or no exposure to low-resource languages during pre-training, so they lack the language-specific knowledge needed for accurate translation. Structured pre-exposure to textbook content — vocabulary and usage examples — compensates for this gap without requiring parallel training data.

**Three stages:**

**Stage 1 — Textbook Construction.** For a given source sentence x in language l_x and target low-resource language l_y, construct a textbook T(l_x → l_y, x) containing two components:

- **Vocabulary List V(l_x → l_y, x):** Select the top-N highest-TF-IDF keywords from the source sentence. Translate these keywords into the target language using an external dictionary (BabelNet is used in the original paper). The vocabulary list provides lexical alignment cues between the languages, improving the model's comprehension of the source sentence and its ability to generate correct lexical items in the target.

  Formal selection: For each word w in sentence x, compute TF-IDF score f(w) against a monolingual reference corpus D_x. Take the top-N% words as keywords. Translate using dictionary D(l_x → l_y).

- **Language Examples E(l_y, x):** Retrieve K sentences from a monolingual corpus D_y in the target language that are semantically similar to the source sentence x. Similarity is computed using LaBSE (Language-agnostic BERT Sentence Embeddings) as a cross-lingual retrieval function. These examples expose the LLM to target-language syntax and usage patterns in context similar to the translation task.

  Formal retrieval: Select K sentences s_y from D_y with highest p(s_y | x) ∝ exp(Embed(x)^T Embed(s_y)), using LaBSE for Embed.

**Stage 2 — Absorption (Syntax Pattern Extraction).** Instead of using the textbook directly as a translation prompt (naive retrieval augmentation), TALENT first asks the LLM to analyze the language examples and articulate their grammatical structure. The LLM is prompted to parse each language example into explicit syntax patterns (Subject, Verb, Object, Adverbial Phrase, Clause components). This absorption step:
- Forces the model to actively process and internalize the target language's grammatical structure
- Produces explicit syntax patterns G(l_y, s_y) that can be reused in the translation prompt
- Yields an average +3.3 COMET score improvement over using the textbook alone (i.e., the explicit parsing step contributes independently of the language examples)

The absorption prompt takes the form: "Given an English-[Target Language] Textbook, parse the K Language Examples into Syntax Patterns." The output is a structured parse of each example showing grammatical roles.

**Stage 3 — Translation with Textbook and Patterns.** The final translation prompt integrates all gathered knowledge:
```
y = LLM(TEXTBOOK[T(l_x → l_y, x), G(l_y, s_y)], TRANSLATE[x])
```
The LLM receives the vocabulary list, the language examples with their extracted syntax patterns, and the source sentence to translate. This combined context provides lexical alignment (from vocabulary list) and structural guidance (from syntax patterns) simultaneously.

**Why Vocabulary List and Language Examples contribute differently:**
- Vocabulary List improves **comprehension** of the source sentence (Low-Eng direction): provides lexical alignment between English and the target language, enabling the model to disambiguate source sentence meaning. +1.8 COMET improvement in Low-Eng direction; outperforms Language Examples by 46.6% in comprehension tasks.
- Language Examples improve **generation** of the target language (Eng-Low direction): help the model recognize language tags and generate tokens in the correct target language. +3.5 COMET improvement in Eng-Low direction; outperforms Vocabulary List by 42.3% in generation tasks.

## When to Use

- When no parallel corpus exists for the target language but a monolingual corpus and dictionary exist
- When using an LLM (GPT-family, BLOOMZ, or similar) for translation rather than training a dedicated NMT model
- When grammar-book prompting (Tanzer et al. 2024) is available but the language has complex morphosyntax that benefits from explicit pattern extraction
- When the translation direction requires generating output in the low-resource language (Eng → Low) and the model produces off-target outputs
- When few-shot prompting with parallel examples is not possible due to data scarcity, but some monolingual target-language text is available

## How to Apply

**Step 1 — Prepare resources for the target language.**

Minimum requirements:
- A monolingual text corpus D_y in the target language (even a few hundred sentences; Tatoeba is used in the original paper)
- A bilingual dictionary or word-level translation resource (BabelNet covers many languages; for languages not in BabelNet, use grammar book word lists or community-compiled glossaries)
- A source-language monolingual corpus D_x (used for TF-IDF computation; large English corpora are readily available)

**Step 2 — Construct the textbook for a given source sentence.**

For each source sentence x to translate:

```python
# Vocabulary List construction
keywords = select_tfidf_keywords(x, D_x, top_n_percent=N)  # N=0.1 for BLOOMZ, 0.1 for ChatGPT
vocab_list = [(kw, dictionary.translate(kw, source_lang, target_lang)) for kw in keywords]

# Language Examples retrieval
source_embedding = LaBSE.encode(x)
candidate_embeddings = LaBSE.encode(D_y)
similarities = cosine_similarity(source_embedding, candidate_embeddings)
language_examples = [D_y[i] for i in top_k_indices(similarities, k=K)]  # K=2 for BLOOMZ, K=3 for ChatGPT
```

**Step 3 — Run the absorption step.**

Prompt the LLM to parse the language examples:
```
Given an English-[Target Language] Textbook, parse the [K] Language Examples into Syntax Patterns.

Vocabulary List:
[vocab_list formatted as: "Possible translations for [word]: [translation1] or [translation2]"]

Language Examples:
[Example 1]: [target_language_sentence_1]
[Example 2]: [target_language_sentence_2]
...

Parse each example into syntax patterns (Subject, Verb, Object, Adverbial Phrase, Clause Subject, Clause Verb, etc.)
```

Collect the LLM's output as extracted syntax patterns G(l_y).

**Step 4 — Construct the final translation prompt.**

```
Vocabulary List:
[vocab_list]

Language Examples & Syntax Patterns:
[Example 1]: [sentence]
[Syntax Pattern 1]: [parsed structure]
[Example 2]: [sentence]
[Syntax Pattern 2]: [parsed structure]
...

Translate Instructions:
Translate the following [source language] text into [target language]:
[source sentence x]
[target language]:
```

**Step 5 — Tune hyper-parameters.**

Two hyper-parameters control the textbook size and context length:
- K = number of language examples (K=2 for BLOOMZ-7.1B, K=3 for ChatGPT)
- N = percentage of keywords for vocabulary list (N=0.1 for both models)

Larger K and smaller N improve performance up to the model's context window limit. ChatGPT tolerates larger K than BLOOMZ. Tune with a small development set if possible.

## Pseudocode

```python
def TALENT_translate(source_sentence, source_lang, target_lang,
                     source_corpus, target_corpus, dictionary, llm,
                     K=2, N=0.1):
    
    # Stage 1: Textbook construction
    keywords = compute_tfidf_keywords(source_sentence, source_corpus, top_n_pct=N)
    vocab_list = []
    for kw in keywords:
        translations = dictionary.lookup(kw, source_lang, target_lang)
        if translations:
            vocab_list.append((kw, translations))
    
    source_emb = LaBSE.encode(source_sentence)
    target_embs = LaBSE.encode(target_corpus)
    sims = cosine_similarity(source_emb, target_embs)
    language_examples = [target_corpus[i] for i in argsort(sims)[-K:]]
    
    # Stage 2: Absorption — extract syntax patterns
    absorption_prompt = build_absorption_prompt(
        source_lang, target_lang, vocab_list, language_examples
    )
    syntax_patterns = llm.generate(absorption_prompt)
    
    # Stage 3: Translation with textbook and patterns
    translation_prompt = build_translation_prompt(
        source_sentence, source_lang, target_lang,
        vocab_list, language_examples, syntax_patterns
    )
    translation = llm.generate(translation_prompt)
    
    return translation


def build_absorption_prompt(src_lang, tgt_lang, vocab_list, examples):
    prompt = f"Given an {src_lang}-{tgt_lang} Textbook, "
    prompt += f"parse the {len(examples)} Language Examples into Syntax Patterns.\n\n"
    prompt += "Vocabulary List:\n"
    for word, translations in vocab_list:
        prompt += f"Possible translations for {word}: {' or '.join(translations)}\n"
    prompt += "\nLanguage Examples:\n"
    for i, ex in enumerate(examples, 1):
        prompt += f"[Example {i}]: {ex}\n"
    prompt += "\nParse each example into Syntax Patterns (Subject, Verb, Object, etc.):"
    return prompt


def build_translation_prompt(sentence, src_lang, tgt_lang,
                              vocab_list, examples, syntax_patterns):
    prompt = "Vocabulary List:\n"
    for word, translations in vocab_list:
        prompt += f"Possible translations for {word}: {' or '.join(translations)}\n"
    prompt += "\nLanguage Examples & Syntax Patterns:\n"
    for i, (ex, sp) in enumerate(zip(examples, syntax_patterns), 1):
        prompt += f"[Example {i}]: {ex}\n[Syntax Pattern {i}]: {sp}\n"
    prompt += f"\nTranslate the following {src_lang} text into {tgt_lang}:\n"
    prompt += f"{sentence}\n{tgt_lang}:"
    return prompt
```

## Evidence

**FLORES-200 evaluation (Guo et al. 2024, LREC-COLING 2024):**
- 112 low-resource language directions from FLORES-200 benchmark (dev-test partition, 1012 sentences/language)
- 2 LLMs: BLOOMZ-7.1B and ChatGPT (GPT-3.5-TURBO)
- 3 metrics: COMET (neural), BLEURT (neural), ChrF++
- 2 translation directions: English→Low-resource (Eng-Low) and Low-resource→English (Low-Eng)
- 9 language families covered: Afro-Asiatic, Indo-European, Turkic, Sino-Tibetan, Atlantic-Congo, Dravidian, Austroasiatic, Austronesian, Others

**Main results:**
- Zero-shot baseline → TALENT: +14.8% improvement (BLOOMZ), +9.2% improvement (ChatGPT) averaged across all 112 languages and metrics
- Few-shot baseline → TALENT: +5.2% improvement — TALENT provides language-specific insights beyond what parallel demonstrations alone provide
- TALENT outperforms the "pipeline" translation method (translate to English first, then to target) by +3.1% ChrF++ on non-English-centric directions
- Standard deviation of performance across language families decreases from 10.6 to 9.4 — TALENT reduces performance disparity across language families

**Ablation results (contribution of each component):**
- Vocabulary List alone: +1.8 COMET (Low-Eng), helps comprehension
- Language Examples alone: +3.5 COMET (Eng-Low), helps generation
- Absorption Stage alone: +3.3 COMET average — explicit syntax extraction is independently valuable
- Full TALENT (all components): best performance across all metrics and language families

**Script-level breakdown (Eng-Low direction, COMET improvement over zero-shot):**
- Cyrillic: +6.9 COMET (largest gain — 7 languages)
- Ge'ez: +4.4 COMET (2 languages)
- Latin: +3.5 COMET (64 languages)
- Arabic: +2.2 COMET (15 languages)
- Devanagari: +1.8 COMET (6 languages)

**Retrieval quality:** Syntax Pattern retrieval quality score RQ = 0.74 (vs. 0.98 for English reference) — even imperfect syntax patterns contribute to translation improvement, suggesting the approach is robust to partial linguistic knowledge.

**Off-target rate:** TALENT reduces off-target translation (generating output in wrong language) by providing direct target-language information in context. Vocabulary List alone reduces off-target rates; Language Examples reinforce correct language tag recognition.

**Convergence/conflict with related work:**
- Tanzer et al. (2024) use full grammar books as prompts (unstructured); TALENT's structured textbook + explicit absorption step adds +3.3 COMET over naive retrieval — the absorption/extraction step is the key differentiator
- Aycock et al. (2025) test grammar-book prompting on different language pairs; TALENT's structured approach should be comparable or superior on those pairs (direct comparison not available)
- TALENT does not compare against few-shot with parallel examples on the same language pairs — the relative advantage of TALENT over few-shot parallel data is not fully characterized

## Variations & Configuration

**Grammar book as textbook:** For languages with published grammar books (including many Indigenous languages), the grammar book can substitute for or supplement the constructed textbook. The absorption stage can be applied to grammar book examples rather than retrieved monolingual sentences — the structured syntax extraction step applies equally well.

**Community-constructed textbooks:** For languages without digital corpora or BabelNet coverage, the vocabulary list and language examples can be constructed with community linguist involvement. The absorption step then serves as a validation checkpoint — examining the syntax patterns the model extracts allows linguists to verify whether the model has internalized the intended grammatical structure.

**Non-English-centric directions:** TALENT can be applied to Low→Low translation by using the textbook for the target side only (as demonstrated in Table 2 of the paper). TALENT surpasses the pipeline (source→English→target) method.

**Hyper-parameter guidance by model:**
- BLOOMZ-7.1B: K=2 (language examples), N=0.1 (vocabulary keywords) — limited context window
- ChatGPT / GPT-3.5-TURBO: K=3 (language examples), N=0.1 — larger context window
- For models with very large context windows (GPT-4, Claude): K can likely be increased further; grid search recommended

## Code & Tools

- **LaBSE** for cross-lingual sentence retrieval: `sentence-transformers` library, model `sentence-transformers/LaBSE`
- **BabelNet** for vocabulary translation: https://babelnet.org (API access required; free for research)
- **Tatoeba** as monolingual/multilingual corpus source: https://tatoeba.org (used in original paper; covers many languages)
- **FLORES-200 benchmark**: https://github.com/facebookresearch/flores (for evaluation)
- **COMET evaluation**: `unbabel-comet` package; model `Unbabel/wmt22-comet-da`
- Original paper code is not publicly released; the method is fully specified in the paper and reproducible from the pseudocode above

## Strengths & Weaknesses

| Strengths | Weaknesses |
|---|---|
| No parallel corpus required — only monolingual target text and a dictionary | Evaluated on FLORES-200 which does not include Mohawk or other Haudenosaunee languages; direct applicability untested |
| Architecture-agnostic: consistent improvements on both BLOOMZ-7.1B and ChatGPT | Textbook construction process depends on BabelNet for vocabulary translation — languages without BabelNet coverage require alternative dictionary sources |
| Explicit absorption step forces structured language learning, not just retrieval | Vocabulary List quality (RQ = 0.74 for low-resource languages) is imperfect; dictionary errors propagate |
| Reduces performance disparity across language families | Does not compare against few-shot with parallel examples on the same language pairs — relative advantage over data-based approaches unclear |
| Reduces off-target generation (generating in wrong language) | Requires two LLM calls (absorption + translation) — doubles API cost and latency vs. zero-shot |
| Modular: each component (vocab list, language examples, absorption) can be used independently or combined | Hyper-parameters K and N must be tuned per model; grid search adds evaluation overhead |

## References

- Guo, P., Ren, Y., Hu, Y., Li, Y., Zhang, J., Zhang, X., & Huang, H. (2024). Teaching Large Language Models to Translate on Low-resource Languages with Textbook Prompting. *LREC-COLING 2024*, 15685–15697.
- Tanzer, M., Dutta, S., Borthakur, M., & Chakraborty, T. (2023). A benchmark for learning to translate a new foreign language from one grammar book. *ICLR 2024*.
- Feng, F. et al. (2022). Language-Agnostic BERT Sentence Embedding (LaBSE). *ACL 2022*.
- Navigli, R. & Ponzetto, S.P. (2010). BabelNet. *ACL 2010*.
- Related techniques in this documentation: `grammar-book-parallel-extraction`, `typological-feature-prompting`, `cross-lingual-icl-query-alignment`

??? note "📋 Self-Review Notes"
    **Reviewed:** 2026-06-11

    **Criterion 1 — Implementable from scratch:** PASS — All three stages are fully specified with concrete instructions. Stage 1 gives the TF-IDF keyword selection formula and LaBSE retrieval formula. Stage 2 provides the exact absorption prompt template. Stage 3 provides the final translation prompt template. The pseudocode implements all three stages with named functions. The two key hyper-parameters (K, N) are given per-model. A practitioner could implement this without the paper, using only the doc plus the listed tools (LaBSE via sentence-transformers, BabelNet API, Tatoeba corpus).

    **Criterion 2 — Empirical results with numbers:** PASS — Results are well-documented: 112 language directions from FLORES-200, 2 LLMs (BLOOMZ-7.1B, ChatGPT GPT-3.5-TURBO), 3 metrics (COMET, BLEURT, ChrF++), 9 language families, 2 translation directions. Aggregate improvements are cited (+14.8% BLOOMZ, +9.2% ChatGPT over zero-shot; +5.2% over few-shot; +3.1% ChrF++ over pipeline). Ablation numbers are given per component. Script-level COMET gains are tabulated. Retrieval quality score (RQ = 0.74) and off-target rate reduction are mentioned.

    **Criterion 3 — Data regime / context clarity:** PASS — Zero-resource / &lt;1K sentences is explicitly stated, with minimum requirements spelled out (monolingual corpus, bilingual dictionary, multilingual-capable LLM). The Weaknesses table honestly flags that FLORES-200 does not include Mohawk or Haudenosaunee languages, and that BabelNet coverage gaps require alternative dictionary sources for many Indigenous languages.

    **Criterion 4 — Pseudocode completeness:** PASS — `TALENT_translate` covers all three stages. `build_absorption_prompt` and `build_translation_prompt` are fully implemented as separate functions. The only abstract calls are `compute_tfidf_keywords` (well-understood standard function) and `dictionary.lookup` (interface obvious from context). The pseudocode handles the case where a keyword has no dictionary translation (the `if translations:` guard).

    **Criterion 5 — Failure modes:** PARTIAL — The Weaknesses table covers BabelNet coverage gaps, dictionary error propagation (RQ = 0.74), double API cost, hyper-parameter tuning overhead, and unclear advantage over few-shot parallel data. However, two failure modes are not explicitly documented: (1) what to do when LaBSE retrieval returns semantically irrelevant examples (e.g., for very small target corpora where all sentences are poor matches), and (2) model behaviour when the absorption step produces garbled or incorrect syntax patterns (the doc notes RQ = 0.74 but does not give guidance for when pattern quality is even lower). The "community-constructed textbooks" variation partially addresses case 2, but not directly as a failure mode.

    **Overall:** Solid doc across all criteria. The main gap is failure mode documentation for retrieval quality degradation at very small corpus sizes and for low-quality absorption outputs. Both are edge cases in the zero-resource regime that is this doc's primary target use case, so brief additions to the Variations or Failure Modes sections would round it out.

