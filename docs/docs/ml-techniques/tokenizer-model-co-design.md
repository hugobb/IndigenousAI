
# Tokenizer–Model Co-Design

**Category:** ML Technique
**Data Regime:** any
**Applicable Languages:** all low-resource / polysynthetic / morphologically rich

## Description

Tokenizer–model co-design is the practice of designing and evaluating the tokenizer in conjunction with the model architecture and training objectives, rather than inheriting a pre-existing tokenizer by default. The core insight is that tokenization is not a neutral preprocessing step: every tokenizer encodes assumptions about what counts as a meaningful linguistic unit, and those assumptions compound throughout training. When the tokenizer is misaligned with the target language's morphology, script, or domain, the model must compensate — paying an efficiency penalty in the form of inflated sequence lengths and receiving degraded signal about linguistic structure.

For low-resource and polysynthetic languages, this penalty is especially severe. A single Mohawk verb form that encodes tense, aspect, pronominal agreement, and valency within one surface word may be shattered into many arbitrary character fragments by an English-trained BPE tokenizer. The model sees noise rather than structure, and the extended sequence length wastes context window capacity.

Co-design replaces the "pick a tokenizer and move on" mindset with a structured, iterative process: define linguistic and operational constraints first, then use those constraints to drive tokenizer construction, evaluation, and refinement alongside model development.

## When to Use

- **Required data:** A representative sample of the target language (even a few hundred sentences is sufficient to diagnose fragmentation problems; a few thousand suffices for training a new tokenizer)
- **Compute:** Tokenizer training is CPU-bound and fast (minutes to hours on a commodity machine); the main cost is engineering time for evaluation and iteration
- **Language typology:** Most critical for polysynthetic, agglutinative, or morphologically rich languages; also important for any language that is absent or underrepresented in the base tokenizer's training corpus
- **Task:** Language modeling, machine translation, morphological analysis, any generation or understanding task
- **Works well when:** You have some control over model training or fine-tuning; you have at least minimal linguistic knowledge of the target language or access to a morphological resource
- **Works poorly when:** You are locked to a deployed model with a fixed tokenizer (though evaluation and adaptation are still possible); linguistic resources for the language are entirely absent

## How to Apply

**Step 1 — Initial Assessment**
1. Define the intended purpose of the model (general language modeling, MT, chatbot, etc.).
2. Identify the target language(s), dialects, and cultural contexts.
3. Specify required capabilities and operational constraints (latency, memory, embedding size).
4. Document what is known about the language's morphological type (polysynthetic, agglutinative, isolating, etc.).

**Step 2 — Reuse Decision**
1. Identify candidate existing tokenizers (those already used for the base model, or multilingual tokenizers like SentencePiece with large vocabulary).
2. Evaluate each candidate against the target language using diagnostic metrics: tokens-per-character ratio, over-fragmentation rate on a sample text, morpheme-boundary alignment (if a morphological analyzer is available), and undertrained-token count.
3. Produce an evidence-based decision: reuse as-is, adapt (vocabulary expansion), or train from scratch.

**Step 3 — Corpus Curation**
1. Build a corpus aligned with the intended use case (domain, register, dialectal range).
2. Establish diagnostic criteria: coverage of rare constructions, dialectal variants, code-switching patterns if relevant.
3. Apply quality filters: remove duplicates, encoding errors, HTML artifacts, and non-linguistic noise.

**Step 4 — Pre-tokenization and Normalization**
1. Apply Unicode normalization appropriate for the language's script (NFC vs. NFD matters for languages with diacritics or composed characters).
2. Define boundary rules (whitespace handling, punctuation, numbers).
3. Handle code-switching, mixed-script input, and loan words explicitly.
4. Document every pre-tokenization decision — these choices affect morpheme boundaries silently and are hard to reverse.

**Step 5 — Tokenizer Training**
1. Select a segmentation algorithm: Unigram (SentencePiece) is generally preferred for morphologically rich languages because it respects probabilistic morpheme boundaries and supports multiple valid segmentations; BPE is simpler but greedy.
2. Set vocabulary size as a deliberate choice: start from the compute-optimal range for your model (typically 16K–64K for monolingual low-resource; 32K–100K for multilingual), not from convention.
3. Train on the curated corpus. For polysynthetic languages, consider using a morpheme-aware variant (e.g., MorphBPE/Morphhpe) if a morphological analyzer is available.

**Step 6 — Intrinsic and Extrinsic Evaluation** (see also: tokenizer-multidimensional-evaluation)
1. Compute tokens-per-1K-characters by language (parity metric).
2. Measure compression rate, token length distribution, fragmentation on held-out text.
3. Audit vocabulary for undertrained tokens (low-frequency tokens likely to receive few gradient updates).
4. Run model-level probes: does the tokenizer produce shorter, more coherent sequences on the target language than the baseline?

**Step 7 — Iteration and Model-Guided Refinement**
1. Feed model training diagnostics back into tokenizer evaluation: if certain morpheme types are systematically mispredicted, examine whether the tokenizer is fragmenting them.
2. Merge or add tokens where fragmentation is identified.
3. Re-run evaluation until performance stabilizes.

**Step 8 — Final Integration and Documentation**
1. Confirm stability and finalize configuration.
2. Document known limitations, design rationale, and preprocessing decisions.
3. Archive and publish tokenizer for reproducibility.

## Pseudocode

```
function co_design_tokenizer(language, task, model_architecture):

  # Step 1: Assess constraints
  constraints = {
    linguistic_type: identify_morphological_type(language),   # e.g., polysynthetic
    domain: task.domain,
    latency_budget: model_architecture.deployment_constraints,
    vocabulary_budget: model_architecture.embedding_dim_limit
  }

  # Step 2: Reuse decision
  candidate_tokenizers = find_existing_tokenizers(language, task)
  for tok in candidate_tokenizers:
    score = evaluate_tokenizer(tok, sample_text, constraints)
    # score includes: fertility, morpheme_alignment, undertrained_token_count
  decision = choose(reuse | adapt | train_from_scratch) based on scores

  if decision == train_from_scratch or adapt:
    # Step 3: Corpus
    corpus = curate_corpus(language, domain=task.domain)

    # Step 4: Pre-tokenization
    corpus = apply_unicode_normalization(corpus, language.script)
    corpus = apply_boundary_rules(corpus, language.word_formation)

    # Step 5: Train
    algorithm = select_algorithm(language)  # Unigram for morph-rich
    vocab_size = optimize_vocab_size(model_architecture, compute_budget)
    tokenizer = train(algorithm, corpus, vocab_size)

  # Step 6: Evaluate
  metrics = multidimensional_evaluate(tokenizer, test_corpus, language)
  audit_undertrained_tokens(tokenizer, frequency_threshold=50)

  # Step 7: Iterate with model feedback
  while not converged(metrics, model_training_diagnostics):
    tokenizer = refine(tokenizer, model_training_diagnostics)
    metrics = multidimensional_evaluate(tokenizer, test_corpus, language)

  # Step 8: Document
  publish(tokenizer, design_rationale, known_limitations)

  return tokenizer
```

## Evidence

This is a position and framework paper; it does not report new empirical results. It synthesizes evidence from multiple empirical studies:

- Dewangan et al. (2025): Optimizing the segmentation strategy alone (with fixed vocabulary size) can yield substantial gains for low-resource languages.
- Ali et al. (2024): Tokenizer choice materially affects both quality and training cost; naïve reuse can increase training steps across languages.
- Schmidt et al. (2024): Tokenization is more than compression — morphological and semantic alignment predict downstream utility beyond fertility scores.
- Goldman et al. (2024): Compression quality correlates strongly with model utility, especially for rare or domain-specific terms.
- Bari et al. (2025): Targeted Arabic tokenizer augmentation (5–10K tokens added) yields better returns than aggressive vocabulary scaling.
- Rust et al. (2021): Monolingual tokenizers improve efficiency and accuracy for target languages; retokenizing and re-embedding have low overhead compared to full pretraining.

Results consistently show that co-designed or language-adapted tokenizers outperform inherited English-centric tokenizers for non-English, morphologically complex, and low-resource languages, particularly on sequence length, downstream task performance, and fairness (parity across language groups).

## Variations & Configuration

- **Train from scratch:** Maximum control; recommended when target language is absent or severely underrepresented in any existing tokenizer's training data.
- **Vocabulary expansion:** Add 5–10K language-specific tokens to an existing tokenizer; preferred when compatibility with existing model checkpoints is required; less effective than full retraining but low cost.
- **Morpheme-aware variants:** MorphBPE (Libovický & Helcl 2024), Morphhpe (Asgari et al. 2025) — constrain merge operations to respect morpheme boundaries identified by an external analyzer; beneficial for agglutinative and polysynthetic languages.
- **Unigram (SentencePiece):** Generally better morphological alignment than greedy BPE for morphologically rich languages; supports stochastic segmentation during training for regularization.
- **Vocabulary size:** Treat as a tunable hyperparameter. Too small inflates sequence length; too large increases memory and embedding parameter count. The compute-optimal range varies by model size and language complexity (Gowda & May 2020).
- **Pre-tokenization normalization:** Unicode normalization form (NFC vs. NFD) can markedly alter segmentation for languages with composed diacritics — must be chosen deliberately.

## Code & Tools

- **SentencePiece** (Kudo & Richardson 2018): https://github.com/google/sentencepiece — supports BPE and Unigram; fast; language-agnostic; no pre-tokenization required
- **HuggingFace Tokenizers**: https://github.com/huggingface/tokenizers — Python/Rust implementations of BPE, WordPiece, Unigram
- **Morphhpe** (Asgari et al. 2025): arXiv:2502.00894 — morpheme-aware tokenizer variant
- **MorphBPE** (Libovický & Helcl 2024): EMNLP 2024 — lexically grounded subword segmentation

## Strengths & Weaknesses

| Strengths | Weaknesses |
| --- | --- |
| Addresses the root cause of over-fragmentation in polysynthetic and morphologically rich languages | Requires upfront engineering investment; not a drop-in replacement for existing pipelines |
| Reduces sequence length, saving context window and compute | Requires at least minimal linguistic knowledge to specify context-aware constraints |
| Improves fairness: reduces token-length parity gaps between majority and minority languages | Full training-from-scratch requires a corpus (even small), which may not exist for the most under-documented languages |
| Produces reproducible, auditable tokenization decisions | Vocabulary expansion can introduce compatibility and convergence issues |
| Framework applies even without retraining the full model (tokenizer can be evaluated and adapted independently) | Standardized evaluation benchmarks for low-resource tokenizer quality do not yet exist |
| Persistent inference-time gains — a better tokenizer pays dividends for the model's entire deployed lifetime | Joint tokenizer–model optimization (true co-adaptation) remains technically challenging and can introduce instability |

## References

- Alqahtani, S., Nayeem, M. T., Laskar, M. T. R., Mohiuddin, T., & Bari, M. S. (2026). Stop Taking Tokenizers for Granted: They Are Core Design Decisions in Large Language Models. EACL 2026, pages 8410–8432.
- Dewangan et al. (2025). When every token counts: Optimal segmentation for low-resource language models. Workshop on Language Models for Low-Resource Languages.
- Goldman et al. (2024). Unpacking tokenization: Evaluating token compression and its correlation with model performance. ACL 2024.
- Schmidt et al. (2024). Tokenization is more than compression. EMNLP 2024.
- Rust et al. (2021). How good is your tokenizer? On the monolingual performance of multilingual language models. ACL-IJCNLP 2021.
- Kudo, T. (2018). Subword regularization: Improving neural network translation models with multiple subword candidates. ACL 2018.
- Kudo, T. & Richardson, J. (2018). SentencePiece: A simple and language independent subword tokenizer and detokenizer for neural text processing. EMNLP 2018.
- Libovický, J. & Helcl, J. (2024). Lexically grounded subword segmentation. EMNLP 2024.
- Asgari et al. (2025). Morphhpe: A morpho-aware tokenizer bridging linguistic complexity for efficient LLM training. arXiv:2502.00894.

??? note "📋 Self-Review Notes"
    **Reviewed:** 2026-06-11

    **Criterion 1 — Implementable from scratch:** PASS — The 8-step process provides concrete, actionable sub-steps (algorithm selection rationale, Unicode normalization guidance, vocabulary size ranges, iteration loop with model feedback). A practitioner could follow it without reading the source papers.

    **Criterion 2 — Empirical results with numbers:** FAIL — The Evidence section cites 6 papers with qualitative summaries only. No specific metric scores (BLEU, chrF, fertility reduction percentages, compression ratios) are reported, and no dataset names or model identifiers are given. The claim that co-designed tokenizers "outperform" is unsupported by any quoted numbers.

    **Criterion 3 — Data regime clarity:** PASS — Data quantity is stated explicitly ("a few hundred sentences to diagnose fragmentation; a few thousand to train a new tokenizer"). Vocabulary size ranges are given for monolingual (16K–64K) and multilingual (32K–100K) settings. Compute cost is characterised as "minutes to hours on a commodity machine."

    **Criterion 4 — Pseudocode completeness:** PASS — The pseudocode covers all 8 steps, including the reuse-decision branch, corpus curation, training, multi-dimensional evaluation, the model-feedback iteration loop, and publication. Function signatures are clear and consistent with the prose.

    **Criterion 5 — Failure modes:** PARTIAL — The "When to Use / Works poorly when" section names two failure conditions (locked tokenizer, absent linguistic resources) and the Strengths & Weaknesses table lists further risks (compatibility issues with vocabulary expansion, instability from joint optimization, lack of standardised benchmarks). However, no failure is illustrated with a concrete example or quantified threshold (e.g., below what corpus size does training from scratch degrade vs. adapt?).

    **Overall:** The main gap is empirical grounding — the Evidence section should be expanded with at least one or two quoted numeric results (e.g., fertility or BLEU deltas from the cited papers) and the associated dataset/model names. Failure modes coverage would benefit from one concrete example showing what degraded output looks like when the tokenizer is misaligned.

