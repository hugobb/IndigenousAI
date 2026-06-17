
# LLM-RBMT Hybrid Translation

**Category:** ML Technique
**Data Regime:** Zero-resource (no parallel corpus required)
**Applicable Languages:** Any language with existing grammar documentation and a dictionary; especially suited to critically endangered languages with no parallel corpora

## Description

LLM-Assisted Rule-Based Machine Translation (LLM-RBMT) is a hybrid pipeline that combines the grammatical determinism of rule-based MT with the flexibility of large language model inference. Rather than training a neural model on parallel data (unavailable for most endangered languages), the system encodes grammatical knowledge as structured tools and uses an LLM to orchestrate them.

The architecture has three modular stages:

1. **Sentence Simplification** — An LLM decomposes a complex source-language sentence into one or more simple Subject-Verb (SV) or Subject-Verb-Object (SVO) clauses, expressed as structured JSON objects with grammatical features (tense, aspect, proximity, plurality).

2. **Structured Translation** — Each simplified clause is passed through deterministic sentence-building functions that implement the target language's grammar: pronoun resolution, tense/aspect suffix application, object-pronoun prefixing, and word-order rules. Vocabulary lookup is grounded in a community-authored dictionary; unknown words are left as English bracketed placeholders (e.g., `[crown]`).

3. **Back-Translation Validation** — The produced target-language sentence is translated back into the source language by a separate LLM call. The source–backward-translation semantic similarity score flags whether the translation preserved meaning.

The Pipeline Translator implementation uses OpenAI's structured output mode (with `pydantic` schemas) to enforce grammatical feature capture at step 1, ensuring the LLM's output is always a parseable structured object rather than free text. This validation-first design makes grammatical correctness a structural guarantee, not a probabilistic outcome.

A variant called the **Builder Translator** gives the LLM access only to a vocabulary lookup tool and has it construct the sentence word-by-word, selecting from available vocabulary at each step. Builder is more flexible when target vocabulary is available but exact grammatical constructions are unknown; it trades some structural precision for vocabulary coverage.

The key advantage over prompt-only and RAG approaches: grammaticality is guaranteed by the rule-based layer, not inferred by the LLM. In endangered-language contexts where few fluent speakers exist to catch errors, this guarantee is critical — mistranslations can propagate into educational materials and erode community trust.

## When to Use

- The target language has no publicly available parallel corpus (zero-resource setting).
- A grammar description (grammar book, grammatical sketch, or community grammar documentation) exists and can be encoded as sentence-building rules.
- A dictionary or lexicon exists (even a small one).
- Grammatical correctness is a hard requirement (e.g., materials for language learners or children).
- Prompt-only LLM translation has been attempted and produces grammatically inconsistent output.

**Less suitable when:**
- No grammar documentation exists and cannot be elicited from community members.
- The target language has sufficient parallel data for fine-tuning (>10K sentence pairs) — standard NMT or fine-tuned models will outperform at that scale.
- Rapid prototyping is needed without expert grammar encoding — use Instructions or RAG translators first to assess feasibility.

## How to Apply

1. **Compile linguistic resources.** Gather all available grammar documentation (grammar book, IGT examples, grammatical sketches) and a lexicon. Document which grammatical features are covered (tense, aspect, person, number, proximity, evidentiality, etc.).

2. **Define the structured sentence schema.** Design a `pydantic` (or equivalent) schema for the simplified sentence representation. Fields should include: `subject` (with person, number, proximity), `verb` (with tense, aspect), optional `object` (with plurality), and any language-specific features (e.g., inclusivity, reflexivity for OVP). Example:
   ```json
   {
     "subject": "first_person_singular",
     "verb": "climb",
     "verb_tense": "present_continuous",
     "object": null
   }
   ```

3. **Implement sentence-building functions.** For each grammatical rule in the grammar documentation, write a deterministic function: pronoun lookup tables, verb suffix combinators (tense × aspect), object-pronoun prefix tables, word-order constraints. These are the grammar-aware tools.

4. **Implement vocabulary lookup.** Build a dictionary lookup function: given an English lemma, return the target-language root. Handle missing vocabulary with bracket placeholders.

5. **Write the simplification prompt.** System prompt instructing the LLM to split input into SV/SVO clauses, strip modifiers, and output structured JSON. Include 3–5 few-shot examples covering coordinated sentences, relative clauses, and nominalizations.

6. **Wire the pipeline.** Connect: source sentence → simplification LLM call → list of structured clause objects → sentence-building functions → target-language sentences → concatenate.

7. **Add back-translation validation.** Translate each produced target-language sentence back into the source language (separate LLM call). Compute MiniLM cosine similarity between the original source and the back-translation. Scores below µ + 3σ of baseline (computed over unrelated sentence pairs) flag likely translation failures.

8. **Evaluate and iterate.** Test on a curated sentence set covering the grammatical constructions present in your language. Check that all constructions in the schema map to correct grammar-tool outputs. Expand schema and tools iteratively as coverage gaps are found.

## Pseudocode

```
procedure LLM_RBMT_Pipeline(source_sentence, grammar_tools, lexicon, llm):

    // Step 1: Sentence Simplification
    simplification_prompt = build_simplification_prompt(source_sentence)
    structured_clauses = llm.structured_output(simplification_prompt, schema=ClauseSchema)
    // structured_clauses: list of {subject, verb, tense, aspect, object, ...}

    target_sentences = []

    for clause in structured_clauses:

        // Step 2: Structured Translation
        subject_form = grammar_tools.resolve_pronoun(clause.subject)
        verb_root = lexicon.lookup(clause.verb, fallback=f"[{clause.verb}]")
        verb_form = grammar_tools.apply_tense_aspect(verb_root, clause.tense, clause.aspect)

        if clause.object:
            obj_root = lexicon.lookup(clause.object, fallback=f"[{clause.object}]")
            obj_form = grammar_tools.apply_object_prefix(verb_form, clause.subject)
        else:
            obj_form = verb_form

        target_sentence = grammar_tools.apply_word_order(subject_form, obj_form, clause)
        target_sentences.append(target_sentence)

    full_translation = concatenate(target_sentences)

    // Step 3: Back-Translation Validation
    back_translation = llm.translate_to_source(full_translation)
    similarity = miniLM_cosine_similarity(source_sentence, back_translation)
    baseline_threshold = µ_baseline + 3 * σ_baseline

    return {
        translation: full_translation,
        back_translation: back_translation,
        similarity: similarity,
        flagged: similarity < baseline_threshold
    }
```

## Evidence

Coleman et al. (2026) benchmark five translation approaches on 150 English sentences (6 types: subject-verb, subject-verb-object, two-verb, two-clause, complex, nominalization) for Owens Valley Paiute (OVP) — a critically endangered language with no public parallel corpora. Models tested: `gpt-4o` and `gpt-4o-mini`.

**Key results (median Semantic Similarity, MiniLM-L6-v2, backwards evaluation):**

| Translator | gpt-4o | gpt-4o-mini |
|---|---|---|
| Pipeline (LLM-RBMT) | **best overall, most consistent** | **best overall** |
| Builder (LLM-RBMT variant) | competitive on comparator metric | competitive |
| Instructions (prompt-only) | good for gpt-4o, high variance | acceptable |
| Fine-tuned | worst (insufficient training data) | worst |
| RAG | near-zero (ungrammatical outputs) | near-zero |

Baseline for unrelated sentences: Semantic Similarity µ = 0.569, σ = 0.059. The threshold for "likely correct translation" is µ + 3σ = 0.746.

- Pipeline translator achieves median backwards scores above 0.746 threshold for most sentence types with gpt-4o; gpt-4o-mini is somewhat lower but still well above baseline.
- RAG consistently produces near-zero scores: outputs are "nearly correct" but grammatically invalid, resulting in back-translation failure.
- Fine-tuned LLM trained on only 393 sentence pairs (generated by LLM-RBMT itself) consistently underperforms — confirms that data-driven fine-tuning is ineffective at this data volume.
- Pipeline costs ~$0.015/sentence with gpt-4o ($0.001 with gpt-4o-mini); Builder is 10–40x more expensive due to multiple tool calls per sentence.

**BLEU and chrF++ scores** are reported but the authors note they are poorly suited to this setting (no reference translations; lexically divergent but semantically faithful translations are penalized). Semantic similarity via MiniLM is the recommended primary metric.

The evaluation framework itself is a contribution: baseline contextualization (computing metrics over 11,175 unrelated sentence pairs) provides a meaningful null distribution absent reference translations.

## Variations & Configuration

- **Builder variant:** Give the LLM access only to a vocabulary lookup tool and have it build sentences word-by-word. More flexible for vocabulary coverage gaps; slower and ~10–40x more expensive per sentence. Recommended when available vocabulary is broad but grammar tooling coverage is incomplete.
- **Instructions variant (prompt-only baseline):** Provide grammar instructions directly in the prompt with no tools. Easiest to implement, zero tooling cost, but grammaticality is not guaranteed. Use as a feasibility check before investing in grammar-tool implementation.
- **Hybrid Pipeline + RAG:** Add a dictionary retrieval step to expand vocabulary coverage before the grammar tools. Not tested by Coleman et al. but identified as a promising direction.
- **Smaller LLMs:** The architecture does not require frontier models; structured output and few-shot in-context learning are available in smaller open models (Llama 3, Mistral). Substituting smaller models reduces cost and data-sovereignty risk (can run locally).
- **Schema depth:** Start with minimal schema (subject, verb, tense only). Add grammatical features incrementally as grammar-tool coverage expands.

## Code & Tools

- OpenAI Structured Outputs with `pydantic` schema: https://platform.openai.com/docs/guides/structured-outputs
- `all-MiniLM-L6-v2` sentence embeddings (via `sentence-transformers`): https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2
- COMET MT evaluation: https://github.com/Unbabel/COMET
- BERTScore: https://github.com/Tiiiger/bert_score
- Apertium (open-source RBMT platform for low-resource languages): https://www.apertium.org/
- Reference implementation appendices: Coleman et al. (2026), Appendices 6–10

## Strengths & Weaknesses

| Strengths | Weaknesses |
| --- | --- |
| Guarantees grammatical correctness by construction — critical for endangered-language educational materials | Requires upfront grammar encoding by a linguist or fluent speaker; not zero-effort |
| Zero parallel-corpus requirement — applicable in true no-resource settings | Vocabulary gaps produce placeholder output (e.g., `[crown]`), not a graceful degradation |
| Modular architecture — grammar tools can be expanded incrementally | Pipeline is brittle if LLM simplification fails to produce parseable structured output |
| Back-translation validation provides automatic quality signal without reference translations | Back-translation similarity is an indirect measure; high similarity does not guarantee correct meaning |
| Outperforms prompt-only, RAG, and fine-tuned approaches in this data regime | Does not scale to complex constructions (e.g., evidentiality, switch-reference) without significant grammar-tool investment |
| Transparent — each translation step is inspectable and debuggable | Dependent on API-hosted LLMs (data sovereignty concern); mitigated by using local open-weight models |

## References

- Coleman, J., Rosales, R., Toal, K., Cuadros, D., Leeds, N., Krishnamachari, B., & Iskarous, K. (2026). Comparing LLM-Based Translation Approaches for Extremely Low-Resource Languages. *Proceedings of the 9th Workshop on Technologies for Machine Translation of Low Resource Languages (LoResMT 2026)*, pages 49–68.
- Coleman, J., Krishnamachari, B., Rosales, R., & Iskarous, K. (2024). LLM-Assisted Rule-Based Machine Translation for Low/No-Resource Languages. *Proceedings of the 4th Workshop on NLP for Indigenous Languages of the Americas (AmericasNLP 2024)*, pages 67–87.
- Tanzer, G., Suzgun, M., Visser, E., Jurafsky, D., & Melas-Kyriazi, L. (2024). A benchmark for learning to translate a new language from one grammar book. *ICLR 2024*.
- Pirinen, T. A. (2019). Workflows for Kickstarting RBMT in Virtually No-Resource Situations. *Proceedings of the 2nd Workshop on Technologies for MT of Low Resource Languages*, pages 11–16.

??? note "📋 Self-Review Notes"
    **Reviewed:** 2026-06-11

    **Criterion 1 — Implementable from scratch:** PARTIAL — The eight-step How-to-Apply section is detailed and actionable for the orchestration layer (schema design, prompt writing, pipeline wiring, back-translation). However, step 3 ("implement sentence-building functions") is necessarily language-specific and the doc correctly notes this requires a linguist, but it does not provide even a minimal worked example of a grammar-tool function (e.g., a sample pronoun-resolution table or suffix-combinator). A reader targeting a new language has clear structural guidance but no starter code for the grammar layer itself.

    **Criterion 2 — Empirical results with numbers:** PASS — Specific dataset (150 English sentences, 6 construction types, Owens Valley Paiute), models (gpt-4o, gpt-4o-mini), metric (MiniLM-L6-v2 semantic similarity), null-distribution baseline (µ = 0.569, σ = 0.059, threshold = 0.746), cost figures ($0.015/sentence gpt-4o; 10–40× Builder premium), and training-data size for the fine-tuned baseline (393 sentence pairs) are all present.

    **Criterion 3 — Data regime / context clarity:** PASS — Zero-resource setting is stated in the header and reinforced throughout. Thresholds for switching to NMT (>10K pairs) and for using Instructions/RAG as pre-implementation probes are explicit. Less-suitable conditions are clearly enumerated.

    **Criterion 4 — Pseudocode completeness:** PARTIAL — The pseudocode covers the full pipeline flow and is unambiguous at the orchestration level. The grammar-tool calls (`resolve_pronoun`, `apply_tense_aspect`, `apply_object_prefix`, `apply_word_order`) are named but their signatures and return types are not shown. The back-translation validation logic (µ/σ threshold) is correctly represented. For a reader implementing the grammar tools themselves, the pseudocode is a useful scaffold but not a complete specification.

    **Criterion 5 — Failure modes:** PASS — The Strengths & Weaknesses table documents: structured-output parse failures (brittle if LLM simplification fails), vocabulary gaps producing bracket placeholders (not graceful degradation), indirect back-translation quality signal (high similarity ≠ correct meaning), scalability limits for complex constructions, and data-sovereignty risk from API-hosted LLMs. Each failure mode is paired with a mitigation or acknowledgment.

    **Overall:** Strong doc. The main gap is the absence of even a toy grammar-tool implementation example — a single pronoun table or suffix-combinator stub would make Criterion 1 a full PASS. Everything else is well-evidenced and actionable.

