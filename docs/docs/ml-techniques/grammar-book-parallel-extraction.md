
# Grammar Book Parallel Data Extraction

**Category:** ML Technique
**Data Regime:** zero-resource / &lt;1K sentences
**Applicable Languages:** all low-resource; especially XLR (extremely low-resource) languages with existing grammar books

## Description

Grammar books for documented but low-resource languages frequently embed parallel sentence examples alongside grammatical explanations. These parallel examples — bilingual sentence pairs, interlinear glossed text (IGT), and word/phrase lists — can be systematically extracted from the book to create a small but task-aligned parallel corpus. This corpus is then used either as in-context examples for prompting LLMs or as fine-tuning data for a specialist MT model.

The key insight from Aycock et al. (2025) is that virtually all translation benefit from a grammar book comes from these parallel examples, not from the grammatical explanations themselves. A grammar book is therefore best treated as a parallel data source rather than a linguistic instruction document.

## When to Use

- The target language has a grammar book (or similar descriptive linguistic resource) but little or no pre-existing parallel corpus.
- The task is machine translation (source↔target).
- You have access to a long-context LLM (≥128k tokens) for in-context use, or a small encoder-decoder MT model for fine-tuning.
- Works best for: XLR languages with a single descriptive grammar source (e.g., Kalamang), or seen low-resource languages (e.g., Nepali, Guarani) where grammar books are available.
- Works poorly for: tasks requiring deep grammatical understanding (e.g., morphological analysis, grammaticality judgment) — for those tasks, see Typological Feature Prompting.

## How to Apply

1. **Obtain the grammar book** in a machine-readable format (PDF → LaTeX conversion or OCR). The Kalamang grammar book (Visser 2022) was converted from LaTeX, which preserved structural markup.

2. **Separate parallel from non-parallel content.** Use text formatting cues (numbered examples, indented glosses, bilingual tables) to distinguish:
   - `BOOK_para`: lines containing parallel sentence examples or word/phrase pairs.
   - `BOOK_non-para`: lines containing grammatical explanations only.
   This can be done via rule-based parsing of LaTeX/HTML markup or by following Nordhoff & Krämer (2022) scraping conventions.

3. **Extract three data types from `BOOK_para`:**
   - Parallel sentence pairs (source sentence + translation).
   - Interlinear glossed text (IGT) triples: transcription + morpheme gloss + translation.
   - Bilingual word/phrase lists (WORDLIST).

4. **Format for the target use case:**
   - *In-context prompting:* Concatenate selected parallel examples into the prompt context. Use 5-shot selection based on longest common subsequences with the test sentence (Tanzer et al. 2024 strategy).
   - *Fine-tuning:* Use `PARA_book` as training data for a small encoder-decoder model (e.g., NLLB-1.3B-Distilled). Split 90:10 for train/dev by sentences. For IGT prediction, use IGT-annotated examples as training pairs.

5. **Evaluate with CHRF++** (not CHRF), which accounts for word order in addition to character n-gram overlap — important for low-resource languages where word order matters.

6. **(Optional) Back-translation:** Fine-tune the initial model, generate back-translations of monolingual target-language text, then add these synthetic pairs to training. Aycock et al. found a single BT iteration was slightly negative for kgv→eng but gave +3 CHRF++ for eng→kgv.

## Pseudocode

```
# Step 1: Parse grammar book
lines = parse_grammar_book(book_pdf_or_latex)

# Step 2: Classify lines
para_lines = []
non_para_lines = []
for line in lines:
    if has_parallel_structure(line):  # bilingual example, IGT, word pair
        para_lines.append(line)
    else:
        non_para_lines.append(line)

# Step 3: Extract parallel pairs
parallel_pairs = extract_parallel_pairs(para_lines)   # list of (src, tgt)
igt_triples = extract_igt(para_lines)                 # list of (transcription, gloss, translation)
wordlist = extract_wordlist(para_lines)               # list of (word, translation)

# Step 4a: In-context use — select 5 examples per test sentence
for test_src in test_set:
    examples = select_by_lcs(test_src, parallel_pairs, k=5)
    prompt = build_prompt(examples, test_src)
    translation = llm.generate(prompt)

# Step 4b: Fine-tuning use
model = load_pretrained("nllb-1.3b-distilled")
train_data = parallel_pairs[:int(0.9 * len(parallel_pairs))]
dev_data   = parallel_pairs[int(0.9 * len(parallel_pairs)):]
model.finetune(train_data, dev_data, epochs=5, lr=1e-4, batch_size=4)
```

## Evidence

**Kalamang (kgv) — XLR benchmark (MTOB, Tanzer et al. 2024):**
MTOB (Machine Translation from One Book) is the benchmark establishing this task framing. It uses a grammar book of 573 pages / 217,388 plaintext tokens, a bilingual word list of 2,531 entries, and ~2,000 parallel sentence pairs (500 used for train/test split).
- Best in-context baseline: Claude 2 in the W+S+G^l setting (words + paired sentences + long grammar context ~100K tokens): **44.7 chrF kgv→eng**, **45.8 chrF eng→kgv**.
- Human baseline (first author after 10 hours studying the grammar): **51.6 chrF kgv→eng**, **57.0 chrF eng→kgv**.
- W alone (word list only): ~15–25 chrF depending on direction and model size.
- S alone (parallel sentences): slightly better than W alone; the single most beneficial context type individually.
- W+S (word list + sentences, no grammar): competitive with W+S+G^s for most models; best setting without long context.
- Fine-tuning on grammar book text: FLAN-T5 XL fine-tuned on the book text reached 35.2 chrF kgv→eng and 30.8 chrF eng→kgv — substantially below Claude 2 in-context, and below the W+S in-context baseline, suggesting fine-tuning on grammar explanations breaks instruction-following.
- No-context baseline: models completely unable to translate (near-zero chrF, generating other languages or gibberish).
- Long grammar context (G^l ~100K tokens) is only testable with Claude 2; it gives a qualitative leap in eng→kgv: model starts producing grammatically correct Kalamang of moderate complexity.
- LCS retrieval consistently outperforms embedding retrieval for example selection.

**Kalamang (kgv) — XLR, unseen by LLMs (Aycock et al. 2025 follow-up):**
- `BOOK_para` (parallel subset) with Gemini: 30.8 CHRF++ eng→kgv, 34.4 kgv→eng.
- `BOOK_all` (full grammar book) with Gemini: 34.4 CHRF++ eng→kgv, 34.4 kgv→eng.
- `BOOK_non-para` (explanations only): 22.6 / 27.5 — dramatically worse, confirming parallel examples drive gains.
- Fine-tuned NLLB on same `PARA_book` data: 34.2 eng→kgv, 28.6 kgv→eng — comparable to Gemini with full grammar book.
- Adding 400 extra `PARA_train` examples: NLLB reaches 38.7 / 36.9; Gemini with full book + train: 43.7 / 46.1.

**Nepali (npi) and Guarani (gug) — seen low-resource languages (Aycock et al. 2025):**
- `BOOK_para` matches or outperforms `BOOK_all` for both Gemini and Llama-I.
- `BOOK_non-para` reduces performance up to 7 points below 0-shot, confirming grammatical explanations hurt translation.
- 5*-SHOT (5 retrieved parallel examples) is generally competitive with full book prompting across all languages.

**Token efficiency:** `BOOK_para` uses ~5x fewer tokens than `BOOK_all` for kgv, achieving equivalent or better performance. Translation performance scales with test-set vocabulary coverage (r significant at p&lt;0.005), not with prompt length.

## Variations & Configuration

- **Example selection:** Longest-common-subsequence (LCS) retrieval (Tanzer et al. 2024) works better than random for 5-shot selection. BM25 or embedding-based retrieval are untested alternatives.
- **IGT inclusion:** `PARA_book^IGT` (parallel examples with morpheme glosses included) outperforms plain `PARA_book` for Llama-I by 10+ points, and modestly for Gemini. Include glosses when available.
- **WORDLIST augmentation:** Adding the bilingual word/phrase list gives consistent +3–8 CHRF++ gains over parallel sentences alone.
- **Model choice:** NLLB-1.3B-Distilled fine-tuned on ~1.2k parallel pairs trains in ~1 hour on a single GPU. For larger parallel sets, NLLB-3.3B or M2M-100 may be considered.
- **LoRA for base LLMs:** Llama-base fine-tuned with LoRA (r=16, α=16, 5 epochs, lr=1e-4) on `PARA_book` outperforms Llama-Instruct prompted with `BOOK_all` for all settings except `PARA_book^IGT`.
- **Back-translation:** A single BT iteration is risky at very low data sizes (&lt;500 pairs); gains are more reliable when the base model has reasonable quality (e.g., into English).

## Code & Tools

- Grammar book data, splits, and code: [https://github.com/saaycock/grammar-book-translation](https://github.com/saaycock/grammar-book-translation) (linked in paper footnote)
- NLLB-1.3B-Distilled: [https://huggingface.co/facebook/nllb-200-distilled-1.3B](https://huggingface.co/facebook/nllb-200-distilled-1.3B)
- Kalamang grammar book scraping: follows Nordhoff & Krämer (2022) conventions
- CHRF++ evaluation: `sacrebleu` library — `sacrebleu ref.txt < hyp.txt -m chrf --chrf-word-order 2`

## Strengths & Weaknesses

| Strengths | Weaknesses |
| --- | --- |
| Leverages existing linguistic resources without requiring new data collection | Grammar book size and parallel sentence density vary widely; some books have &lt;100 parallel examples |
| Fine-tuned small models match costly long-context LLMs on the same data | Extraction quality depends on markup structure; LaTeX-formatted books are easier than scanned PDFs |
| Token-efficient: 5x fewer tokens than full grammar book, same or better CHRF++ | Does not help grammatical tasks (morphological analysis, IGT prediction) — parallel data alone is insufficient |
| Training a small MT model is achievable in ~1 hour on consumer GPU | Back-translation at very small data sizes can hurt rather than help |
| Generalizes across XLR (Kalamang) and seen low-resource (Nepali, Guarani) | Parallel examples in grammar books are typically short, simple sentences — may not cover full domain |

## References

- Aycock, S., Stap, D., Wu, D., Monz, C., & Sima'an, K. (2025). Can LLMs Really Learn to Translate A Low-Resource Language from One Grammar Book? ICLR 2025.
- Tanzer, M., et al. (2024). A Benchmark for Learning to Translate a New Language from One Grammar Book. ICLR 2024.
- Nordhoff, S., & Krämer, M. (2022). Extracting parallel texts from grammar books. (Referenced in Aycock et al.)
- Costa-jussà, M. R., et al. (2024). No Language Left Behind: Scaling Human-Centered Machine Translation. (NLLB model)
- Popović, M. (2017). CHRF++: words helping character n-grams. WMT 2017.

??? note "📋 Self-Review Notes"
    **Reviewed:** 2026-06-11

    **Criterion 1 — Implementable from scratch:** PARTIAL — The high-level pipeline (obtain book → classify lines → extract pairs → use for prompting or fine-tuning) is clear and actionable. However, the three core extraction functions (`has_parallel_structure`, `extract_parallel_pairs`, `extract_igt`) are black-box stubs. There is no guidance on heuristics for detecting parallel structure in PDFs vs. LaTeX (e.g., what regex or markup patterns to look for), and `select_by_lcs` has no implementation hint. A practitioner would need to consult the reference GitHub repo or read the paper to implement these steps.

    **Criterion 2 — Empirical results with numbers:** PASS — CHRF++ scores are provided across multiple conditions (BOOK_para, BOOK_all, BOOK_non-para, PARA_train augmentation) for three named languages (Kalamang/kgv, Nepali/npi, Guarani/gug) and multiple named models (Gemini, Llama-I, NLLB-1.3B-Distilled). Token-efficiency figures and statistical significance (p&lt;0.005) are also cited. Coverage is thorough.

    **Criterion 3 — Data regime clarity:** PASS — The data regime header states "zero-resource / &lt;1K sentences". The body specifies ~1.2k parallel pairs for NLLB fine-tuning, a 90:10 train/dev split, flags &lt;100 parallel examples as a practical lower bound, and notes Kalamang's 400 extra PARA_train pairs. Sufficient to scope a project.

    **Criterion 4 — Pseudocode completeness:** PARTIAL — The top-level flow is unambiguous. However, three key functions are underdefined stubs with no implementation hint (`has_parallel_structure`, `extract_parallel_pairs`, `extract_igt`). The LoRA hyperparameters (r=16, α=16) documented in Variations are absent from the fine-tuning pseudocode block, and the `select_by_lcs` function lacks even a sketch of the LCS comparison logic.

    **Criterion 5 — Failure modes:** PARTIAL — Several failure conditions are documented in the Weaknesses table (scanned PDFs, &lt;100 parallel examples, back-translation at very small data sizes, domain mismatch from short/simple grammar-book sentences). However, they are listed as static weaknesses rather than actionable failure modes with symptoms and mitigations. Back-translation risk is mentioned but there is no guidance on how to detect when BT is hurting (e.g., track dev CHRF++ before adding synthetic data) or what the recovery action is.

    **Overall:** The document is strong on empirical grounding and data regime clarity. The main gaps are (1) the extraction pseudocode functions are opaque stubs — adding at least a note on what markup patterns or heuristics to use for LaTeX vs. PDF would unblock a practitioner, and (2) the failure modes section would benefit from a structured format (condition → symptom → mitigation) rather than a weaknesses table, particularly for the back-translation and scanned-PDF cases.

