
# Cross-Lingual In-Context Learning with Query Alignment

**Category:** ML Technique
**Data Regime:** zero-resource / &lt;1K sentences
**Applicable Languages:** all low-resource; especially languages absent from LLM pretraining data

## Description

Cross-lingual in-context learning (X-ICL) is a prompting strategy that provides a large language model (LLM) with input-output examples drawn from a high-resource language while the actual task is posed in a low-resource language. Unlike standard in-context learning (ICL) — where examples and queries are in the same language — X-ICL bypasses the need for any labeled in-language data by leveraging the LLM's cross-lingual transfer capability.

The technique addresses a critical failure mode in low-resource ICL: **label alignment**, a common strategy that translates target-language labels into the demonstration language. Cahyawijaya and Lovenia (2025) show that label alignment is frequently ineffective or harmful for low-resource settings. The superior alternative is **query alignment**: semantically aligning the query to the demonstration language rather than aligning labels. Query alignment transforms the low-resource input into a semantic representation compatible with the high-resource demonstration set, allowing the LLM to apply the pattern from the demonstrations to the transformed query.

A second key finding is that **semantic retrieval** of ICL examples — using SBERT embedding similarity to select demonstrations that are semantically close to the test query — substantially outperforms random selection. This effect is most pronounced for languages with minimal LLM pretraining exposure.

Together, X-ICL + query alignment + semantic retrieval form a practical three-part strategy for enabling LLM task performance on languages with zero labeled data.

## When to Use

- The target language has little or no labeled data for the task of interest.
- An LLM with reasonable cross-lingual transfer capability is available (GPT-4, mT5-XXL, BLOOM, etc.).
- High-resource language examples exist for the same task.
- Label alignment has been tried and failed; query alignment is the recommended diagnostic fallback.
- **X-ICL works best for:** classification, sentiment analysis, NLI, and other tasks where the cross-lingual semantic bridge is achievable.
- **X-ICL works poorly for:** tasks requiring deep structural knowledge of the target language (morphological analysis, surface-form generation); see FST Morphological Segmentation for those.
- **Not evaluated on polysynthetic languages** (the 25 low-resource languages in Cahyawijaya & Lovenia are African and Asian); transfer effectiveness to highly morphologically complex languages like Mohawk is untested and likely reduced.

## How to Apply

1. **Select a high-resource pivot language.** Choose a language that the LLM has strong pretraining coverage for and that has labeled examples for the task. English is the typical default; for Indigenous North American languages, a related Indigenous language with more resources (e.g., another Iroquoian language for Mohawk tasks) may provide stronger transfer.

2. **Retrieve semantically relevant demonstrations.**
   - Encode all candidate demonstrations (high-resource language examples) using a multilingual sentence encoder (SBERT / `paraphrase-multilingual-mpnet-base-v2`).
   - Encode the test query in the target language using the same encoder.
   - Retrieve the top-k demonstrations by cosine similarity to the query embedding.
   - Use k=4–8 as a starting point; tune on a small held-out dev set if available.

3. **Apply query alignment (not label alignment).**
   - Do NOT translate labels from the target language into the demonstration language.
   - Instead, align the test query semantically to the demonstration language. In practice, this means translating or paraphrasing the query into the pivot language before inserting it into the prompt, while keeping the demonstrations in their original high-resource form.
   - Alternatively, use a language-agnostic representation: embed the query and demonstrations in a shared semantic space without explicit translation.

4. **Construct the prompt.**
   ```
   [Demonstration 1: high-resource input → label]
   [Demonstration 2: high-resource input → label]
   ...
   [Demonstration k: high-resource input → label]
   [Test query: aligned/translated target-language input → ?]
   ```

5. **Run inference and evaluate.**
   - For classification: accuracy, F1.
   - For generation: BLEU, CHRF (see also Grammar Book Parallel Data Extraction for MT-specific metrics).

6. **Diagnostic: if X-ICL still underperforms, check alignment quality.** Poor cross-lingual transfer often signals a mismatch between the semantic space of the demonstration language and the query language. Try: (a) a different pivot language closer to the target, (b) increasing k, (c) using a larger multilingual encoder.

## Pseudocode

```
# Setup
encoder = load_sbert("paraphrase-multilingual-mpnet-base-v2")
demo_pool = load_demonstrations(language="english")  # high-resource pivot
demo_embeddings = encoder.encode([d.input for d in demo_pool])

# Step 2: Semantic retrieval for a test query
def retrieve_demos(query_text, demo_pool, demo_embeddings, k=5):
    query_emb = encoder.encode(query_text)
    similarities = cosine_similarity(query_emb, demo_embeddings)
    top_k_idx = argsort(similarities)[-k:][::-1]
    return [demo_pool[i] for i in top_k_idx]

# Step 3: Query alignment (translate query into pivot language, NOT labels)
def align_query(query_text, target_lang, pivot_lang="english"):
    # Option A: explicit translation
    return translator.translate(query_text, src=target_lang, tgt=pivot_lang)
    # Option B: use multilingual encoder as implicit alignment (no translation)
    # return query_text  # encoder handles cross-lingual similarity directly

# Step 4: Build and run prompt
results = []
for test_item in test_set:
    aligned_query = align_query(test_item.input, target_lang="low-resource")
    demos = retrieve_demos(aligned_query, demo_pool, demo_embeddings, k=5)
    
    prompt = ""
    for demo in demos:
        prompt += f"Input: {demo.input}\nLabel: {demo.label}\n\n"
    prompt += f"Input: {aligned_query}\nLabel:"
    
    prediction = llm.generate(prompt)
    results.append(evaluate(prediction, test_item.label))
```

## Evidence

**Cahyawijaya & Lovenia (2025) — 25 low-resource + 7 higher-resource languages:**

- **X-ICL vs. zero-shot baseline:** X-ICL with semantically retrieved demonstrations substantially improves performance over zero-shot across low-resource languages; gains are most pronounced for languages with lowest LLM pretraining exposure.
- **Query alignment vs. label alignment:** Query alignment consistently outperforms label alignment for low-resource ICL. Label alignment is frequently ineffective or harmful — a systematic failure mode in prior work.
- **Semantic retrieval vs. random selection:** SBERT-based retrieval of semantically similar examples outperforms random selection, consistent with Zebaze et al. (2025) who find the same effect for MT. The gain is larger for low-resource languages.
- **Performance gap closure:** ICL with semantic retrieval + query alignment closes a significant portion of the performance gap between high- and low-resource language performance on classification benchmarks.

*Note: No specific BLEU/accuracy numbers are reported in the summary; the paper is a preprint (2025) and detailed numerical results are in the full paper. The findings are directional and replicated across 25 languages.*

## Variations & Configuration

- **Pivot language choice:** English is the default pivot but is not always optimal. For Indigenous North American languages, a related Indigenous language with more resources could provide stronger transfer (e.g., Cherokee or Mohawk for other Iroquoian tasks). For Algonquian languages, Cree or Ojibwe data might serve as better pivots than English.
- **Encoder choice:** `paraphrase-multilingual-mpnet-base-v2` (SBERT) is recommended for multilingual semantic similarity. For languages not covered by SBERT, `LaBSE` (Feng et al., 2022) provides broader language coverage.
- **k (number of demonstrations):** Typical range is 4–8. More demonstrations improve performance up to the LLM's context limit; beyond that, gains plateau or reverse.
- **Label alignment as diagnostic:** If query alignment fails, try label alignment as a comparison point to understand whether the failure is in semantic transfer or label space alignment.
- **Zero-label X-ICL:** When no pivot-language labeled data exists for the exact task, use X-ICL with automatically generated or distantly supervised demonstrations (e.g., translated silver labels).
- **Language-agnostic embedding space:** Instead of explicit query translation, embed both demonstrations and query into a shared multilingual semantic space and rely on the encoder's cross-lingual alignment. This avoids translation quality issues for very low-resource target languages.

## Code & Tools

- SBERT (`sentence-transformers`): https://www.sbert.net/ — `pip install sentence-transformers`
- `paraphrase-multilingual-mpnet-base-v2`: https://huggingface.co/sentence-transformers/paraphrase-multilingual-mpnet-base-v2
- LaBSE: https://huggingface.co/sentence-transformers/LaBSE — broader language coverage than standard SBERT
- Cahyawijaya & Lovenia (2025) paper: HKUST / AI Singapore preprint — code likely available on paper GitHub

## Strengths & Weaknesses

| Strengths | Weaknesses |
| --- | --- |
| Requires zero labeled data in the target language | Transfer quality degrades for languages structurally distant from the pivot (polysynthetic, morphologically complex) |
| Semantic retrieval improves over random selection with no additional annotation effort | Not evaluated on polysynthetic languages; effectiveness for Mohawk, Inuktitut, etc. is unknown |
| Query alignment directly fixes a known systematic failure mode (label alignment) | Requires a multilingual sentence encoder with coverage of both pivot and target language |
| Works across diverse low-resource language families | Best for classification/NLI tasks; limited evidence for generation and MT |
| Practical first step before any community data collection effort | Performance depends on LLM's cross-lingual pretraining; languages absent from LLM training data see limited gains |

## References

- Cahyawijaya, S., & Lovenia, H. (2025). LLMs Are Few-Shot In-Context Low-Resource Language Learners. *Preprint*, HKUST / AI Singapore.
- Zebaze, A., et al. (2025). Similarity Search for ICL Example Selection for MT. (Replicates semantic retrieval finding for MT.)
- Li, Y., et al. (2025). In-Context Learning for XLR Languages.
- Nguyen, T., et al. (2024). Linguistically-Diverse Prompting for Low-Resource Languages.
- Feng, F., et al. (2022). Language-agnostic BERT Sentence Embedding. *ACL 2022*. (LaBSE)

??? note "📋 Self-Review Notes"
    **Reviewed:** 2026-06-11

    **Criterion 1 — Implementable from scratch:** PASS — All steps are actionable without reading the original paper. Tool names (`sentence-transformers`, `paraphrase-multilingual-mpnet-base-v2`), hyperparameter ranges (k=4–8), and both alignment options (explicit translation vs. encoder-based implicit alignment) are specified. The "How to Apply" section maps directly onto the pseudocode.

    **Criterion 2 — Empirical results with numbers:** FAIL — The Evidence section explicitly acknowledges that no specific BLEU or accuracy numbers are reported. All results are directional ("substantially improves", "consistently outperforms", "closes a significant portion of the gap"). No dataset names, no model names used in the experiments, and no numeric deltas are given. A reader cannot benchmark their own implementation against the reported results.

    **Criterion 3 — Data regime clarity:** PASS — The zero-resource framing is unambiguous. The technique requires zero labeled target-language data; the data requirement is a pool of high-resource pivot-language labeled examples for the same task. The k-range, encoder choice logic, and pivot selection guidance are all present.

    **Criterion 4 — Pseudocode completeness:** PASS — The pseudocode covers setup, semantic retrieval, query alignment (both options shown), prompt construction, and inference in a single coherent block. It is executable as written given standard Python libraries (`sentence-transformers`, any LLM inference wrapper).

    **Criterion 5 — Failure modes:** PASS — The Strengths & Weaknesses table and the "When to Use / Works poorly for" section together cover: structural distance degradation for polysynthetic languages, absence from LLM pretraining data, SBERT coverage gaps, classification-vs-generation limitations, and the untested status for highly morphologically complex languages like Mohawk or Inuktitut.

    **Overall:** The technique is well-structured and immediately actionable. The critical gap is empirical grounding: without any numeric results, practitioners cannot set a performance baseline or know what accuracy gain to expect. The Evidence section should be updated once the Cahyawijaya & Lovenia (2025) paper is published and specific scores are available.

