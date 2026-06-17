
# Machine-in-the-Loop Annotation

**Category:** Process & Methodology Technique
**Data Regime:** any (applies to any data collection effort; most valuable when human annotator time is the binding constraint)
**Applicable Languages:** Endangered or low-resource languages where the speaker/annotator community is small and human effort is scarce; especially polysynthetic languages requiring expert morphological annotation

## Description

Machine-in-the-loop annotation is a human-AI collaboration paradigm for building NLP resources in data-scarce, endangered language settings. It inverts the traditional "annotation then model" sequence: a partial or imperfect NLP model is used to *assist* human annotators — pre-labeling, suggesting candidates, flagging uncertainty — rather than replacing them. Human speakers or linguists review, correct, and approve the machine's suggestions, reducing the burden on the small annotator community while maintaining quality and community ownership.

The concept is adapted by Zhang et al. (2022) from Von Ahn's *human computation* principle (Duolingo, reCAPTCHA): combining human expertise and computational assistance enables solving problems that neither could tackle alone. Applied to endangered languages, this addresses the *bootstrapping problem*: you need annotated data to build an NLP model, but you need an NLP model to efficiently produce annotated data.

**Key modes of machine-in-the-loop assistance:**

- **Pre-annotation:** The model produces an initial label (POS tag, dependency parse, morpheme segmentation, translation draft) for a new sentence. The human annotator reviews and corrects rather than annotating from scratch. Correction is typically 3–5x faster than annotation from scratch for morphological tasks.
- **Uncertainty sampling:** The model flags inputs where its confidence is low (e.g., low-probability outputs, high entropy predictions). Human annotators prioritize these uncertain cases — maximally informative examples — rather than annotating randomly.
- **Candidate suggestion:** For tasks like OCR or ASR transcription, the model provides top-k candidates; the human selects the correct one or edits the best match. This is especially effective when the model is partially trained on the target script (e.g., Cherokee syllabary in Tesseract).
- **GWAP integration (Games with a Purpose):** Annotation tasks are embedded in game-like interfaces where language learners or community members contribute annotations as part of language practice. GWAP mechanics (scoring, leaderboards, social play) make annotation engaging for non-expert community participants.

**Community resource platform (Zhang et al. 2022 proposal):**
A collaborative platform where three stakeholders interact: native speakers contribute speech recordings and text corrections; NLP researchers contribute models and evaluation tools; language learners practice the language while generating useful annotation signals. The platform is designed around the Cherokee community's stated priorities: MT, OCR, ASR, POS tagging, dependency parsing.

## When to Use

- The speaker community is small (critically endangered or severely endangered language) and volunteer annotation time is extremely scarce.
- The target task requires expert knowledge (morphological annotation, dependency parsing) that is costly to perform from scratch for every sentence.
- Language learners exist who are not yet fluent but can perform binary or selection-type annotation tasks with gamified support.
- You have access to a partially-trained or cross-lingually transferred model good enough to produce useful pre-annotations (even 50–60% accuracy is sufficient to accelerate human correction).
- Data collection is ongoing and iterative — machine-in-the-loop annotation enables a progressive improvement loop rather than a single annotation pass.

**Less suitable when:**
- The language has no existing model or closely related language model to transfer from — initial cold-start annotation still requires fully manual effort.
- Community members are unwilling to interact with digital interfaces; oral/in-person methods must be prioritized instead.
- The annotation task requires deep cultural knowledge that cannot be verified by non-fluent annotators (e.g., connotation or pragmatic appropriateness evaluation — use Thick Evaluation for those tasks).

## How to Apply

**Step 1 — Cold start: build a seed model**

1. Identify the minimum annotation set needed to train an initial seed model. For morphological segmentation, 100–300 annotated words are often sufficient to train a character-level model with above-random performance. For ASR, 10–30 minutes of transcribed speech enables cross-lingual fine-tuning.
2. Work with fluent speakers or trained linguists to annotate the seed set manually. Prioritize high-frequency vocabulary to maximize coverage of the seed model's pre-annotation quality.
3. Train the seed model. For morphological tasks: character-level encoder-decoder (see Neural Seq2Seq Morphological Segmentation). For ASR: XLSR-53 fine-tuned on seed transcriptions (Zhang et al. achieved WER=0.21 on Cherokee with modest labeled data). For MT: see Tiny-Data LLM Fine-Tuning.

**Step 2 — Pre-annotation loop**

4. Apply the seed model to the next batch of unannotated data, producing preliminary labels with confidence scores.
5. Sort the batch by model confidence: lowest-confidence items first.
6. Present pre-labeled items to human annotators for review and correction, showing the model's output as a suggestion (not ground truth). The annotator: (a) accepts if correct, (b) edits the suggestion, or (c) rejects and annotates from scratch for low-quality suggestions.
7. Add corrected annotations to the training pool. Periodically retrain the model on the expanded pool.

**Step 3 — GWAP integration (for learner participation)**

8. Design game mechanics appropriate to the annotation task:
   - *Binary tasks* (is this transcription correct? is this translation faithful?): suitable for learners at any stage; embed in a social scoring game.
   - *Selection tasks* (which of these 3 OCR outputs is correct?): suitable for literate learners who can recognize correct script; embed in a multiple-choice quiz format.
   - *Production tasks* (complete this sentence, provide the next word): suitable for intermediate learners; generates text prediction training data.
9. Validate learner annotations against fluent speaker ground truth for a sample of inputs. Establish a reliability threshold (e.g., ≥80% agreement with expert annotations) before including learner annotations in training data.
10. Use learner engagement data (time-on-task, correction rates) to identify the annotation tasks most motivating for the community — prioritize the platform's development around those.

**Step 4 — OCR for digitizing archival materials**

11. Apply available OCR tools (Tesseract, Google Vision) to digitize manuscript text in the target language. Both support Cherokee syllabary; preprocessing quality significantly affects accuracy.
12. Preprocessing pipeline: binarize images, deskew, remove noise, segment into line-level regions before feeding to OCR. Subword tokenization in the output may need syllabary-specific rules.
13. Use pre-annotation mode: OCR output becomes a candidate; human reviewers correct the most frequent error types. Track error frequency to identify which syllabary characters or character sequences the OCR model handles poorly.

## Pseudocode

```
# Step 1: Cold-start seed annotation
seed_data = manually_annotate(
    inputs=high_frequency_vocabulary[:300],
    annotators=fluent_speakers_or_linguists)
seed_model = train(task_model, seed_data)

# Step 2: Pre-annotation loop
unlabeled_pool = get_unannotated_data()
annotated_pool = seed_data

while len(unlabeled_pool) > 0:
    # Apply model to next batch
    batch = sample(unlabeled_pool, batch_size=100)
    suggestions = seed_model.predict(batch, return_confidence=True)
    
    # Sort by confidence: uncertain examples first
    batch_sorted = sort_by_confidence(batch, suggestions, ascending=True)
    
    # Human review and correction
    corrected = []
    for item, suggestion, confidence in batch_sorted:
        if confidence >= HIGH_THRESHOLD:
            corrected.append(suggestion)          # auto-accept high confidence
        else:
            human_label = annotator.review(item, suggestion)  # human corrects
            corrected.append(human_label)
    
    # Update training pool and retrain
    annotated_pool.extend(corrected)
    unlabeled_pool.remove(batch)
    
    if len(annotated_pool) % RETRAIN_INTERVAL == 0:
        seed_model = retrain(task_model, annotated_pool)

# Step 3: GWAP validation (for learner annotations)
for learner_annotation in learner_contributions:
    if agreement_with_expert(learner_annotation) >= 0.80:
        annotated_pool.append(learner_annotation)
    else:
        flag_for_expert_review(learner_annotation)
```

## Evidence

**Cherokee ASR (Zhang et al. 2022):**
- Fine-tuned XLSR-53 (cross-lingual pretraining on 53 languages) on Cherokee audio-to-syllabic-text transcription.
- Achieved **WER = 0.21** on syllabic text transcription — a strong result for a severely endangered language with &lt;2,200 speakers.
- Demonstrates that cross-lingual pretraining provides a viable seed model for ASR even for languages not in the pretraining set, enabling the machine-in-the-loop workflow from a small transcription seed.

**Cherokee OCR (Zhang et al. 2022):**
- Both Tesseract and Google Vision support Cherokee syllabary natively.
- Accuracy degrades significantly on noisy images; preprocessing (binarization, deskewing) is essential before mining digitized Cherokee manuscripts.
- Pre-annotation mode (OCR as candidate, human reviewer corrects) identified as the practical workflow for digitizing archival Cherokee text.

**Human computation principle (Von Ahn):**
- reCAPTCHA and Duolingo demonstrate that millions of annotation micro-tasks can be completed by non-expert users through game-like interfaces.
- Applied to language learning: Duolingo's translation-as-practice model produces useful annotation signals at scale. Zhang et al. propose adapting this for Cherokee, though the platform remains conceptual at paper publication time.

**Note on convergence:** The machine-in-the-loop model is consistent with the community-based resource collection approach described in several related papers. Kuhn et al. (2020) apply a version of this for Kanyen'kéha (Mohawk) predictive text: a community-maintained word list spreadsheet feeds directly into a word-completion model without any server-side data collection (see Decentralized Predictive Text).

## Variations & Configuration

- **Active learning variant:** Use uncertainty sampling (model-flagged low-confidence items) rather than random batch sampling to maximize the information value of each annotation session. Most beneficial when annotation budget is severely constrained (&lt;50 hours total expert time).
- **Cross-lingual transfer seed:** For related languages, train the seed model on a higher-resource related language (e.g., train morphological segmenter on a related Iroquoian language if labeled data is available) and transfer to the target language. May require fewer than 50 seed annotations in the target language before the pre-annotation loop becomes useful.
- **Synchronous community annotation events:** Host in-person "annotation sprints" where community members annotate together, with NLP researchers providing real-time feedback on model outputs. Social and in-person format is more compatible with some Indigenous community engagement norms than asynchronous digital platforms.
- **Tiered annotator model:** Distinguish three annotator tiers: (1) fluent speakers / trained linguists — gold standard, used for seed data and validation; (2) intermediate learners — suitable for selection and binary tasks after reliability validation; (3) beginners — suitable only for GWAP engagement and text production tasks. Route annotation tasks to appropriate tier.

## Code & Tools

- XLSR-53 (cross-lingual ASR pretraining): https://huggingface.co/facebook/wav2vec2-large-xlsr-53
- Tesseract OCR (supports Cherokee syllabary): https://github.com/tesseract-ocr/tesseract
- ELAN (audio-text alignment annotation tool): https://archive.mpi.nl/tla/elan
- Praat (phonetic annotation): https://www.fon.hum.uva.nl/praat/
- Cherokee syllabary Unicode support: Cherokee Supplement block U+AB70–U+ABBF (unified with U+13A0–U+13FF)
- Label Studio (open-source annotation platform with pre-annotation support): https://labelstud.io/
- Prodigy (annotation tool with active learning / model-in-the-loop): https://prodi.gy/

## Strengths & Weaknesses

| Strengths | Weaknesses |
| --- | --- |
| Reduces annotation burden on small speaker communities by 3–5x compared to manual annotation from scratch | Requires a seed model or cross-lingual transfer — cold-start annotation for the first ~100–300 examples is still fully manual |
| Progressive quality improvement loop: each annotation batch improves the seed model, which improves pre-annotation quality | Platform development (GWAP interface, collaborative tool) requires significant software engineering investment that community projects may lack |
| GWAP mechanics can engage language learners as annotators, expanding the annotator pool beyond fluent speakers | Learner annotation quality must be validated against expert annotations; unreliable learner contributions can corrupt training data |
| Applicable across tasks: morphological annotation, OCR correction, ASR transcription, translation review | Community members may distrust or disengage from gamified interfaces that feel extractive — design must be community-led |
| Compatible with community data sovereignty: pre-annotations are reviewed and approved by community members before entering training | Cross-lingual transfer seeds may introduce biases from the donor language's morphological patterns |

## References

- Zhang, S., Frey, B. E., & Bansal, M. (2022). How can NLP Help Revitalize Endangered Languages? A Case Study and Roadmap for the Cherokee Language. *Proceedings of ACL 2022*, Long Papers.
- Von Ahn, L., & Dabbish, L. (2004). Labeling Images with a Computer Game. *CHI 2004*. (Human computation principle.)
- Von Ahn, L., et al. (2008). reCAPTCHA: Human-Based Character Recognition via Web Security Measures. *Science*.
- Conneau, A., et al. (2021). Unsupervised Cross-Lingual Representation Learning at Scale. *ACL 2020*. (XLSR-53 model.)
- Kuhn, R., et al. (2020). Two decades of building language technology for Indigenous peoples of Canada. *Proceedings of 1st Workshop on NLP for Indigenous Languages of the Americas*.

??? note "📋 Self-Review Notes"
    **Reviewed:** 2026-06-11

    **Criterion 1 — Implementable from scratch:** PARTIAL — Steps 1–4 are concrete and ordered. The cold-start seed size (100–300 annotated words, 10–30 minutes of speech), the pre-annotation loop logic (sort by confidence, accept/edit/reject), and GWAP validation threshold (≥80% agreement with expert) are all specified. However, the GWAP interface design is described only at the level of task types (binary, selection, production) — no wireframe, game mechanic template, or existing open-source GWAP framework is referenced. A practitioner would need to design the game interface from scratch. Additionally, `HIGH_THRESHOLD` in the pseudocode is unnamed — no concrete value or calibration procedure is provided.

    **Criterion 2 — Empirical results with numbers:** PARTIAL — The Cherokee ASR result (WER = 0.21 with XLSR-53) is specific and attributed. The "3–5x faster correction than annotation from scratch" claim for morphological tasks is stated as a known figure but no citation or study is given to back it. The Duolingo/reCAPTCHA human computation principle is cited but those results are not directly applicable to the endangered language annotation setting. The OCR section notes accuracy degrades on noisy images but gives no quantitative accuracy figures for Cherokee OCR.

    **Criterion 3 — Data regime / context clarity:** PASS — "Any data regime; most valuable when human annotator time is the binding constraint" is accurate. Applicable context (small speaker community, expert morphological annotation, partially-trained seed model available) is well specified. "Less suitable when" cases (no seed model, community unwilling to use digital interfaces, tasks requiring deep cultural knowledge) are clear and correctly cross-reference Thick Evaluation.

    **Criterion 4 — Pseudocode completeness:** PARTIAL — The pre-annotation loop is well-structured. The `HIGH_THRESHOLD` constant is used but never defined or calibrated. The GWAP validation block is present but does not show how learner annotations are routed back into the training pool after passing the reliability check — the `annotated_pool.append` call is there but the retraining trigger after learner data is added is absent. The OCR pipeline (Step 4) has no pseudocode representation.

    **Criterion 5 — Failure modes:** PARTIAL — The Strengths & Weaknesses table covers: cold-start manual burden, software engineering investment, learner annotation reliability, community distrust of gamified interfaces, and cross-lingual transfer bias. However, no explicit anti-pattern or failure mode is described in the procedural steps. The risk of learner annotations silently corrupting training data (if the reliability validation is skipped or threshold is too low) is mentioned in the table but not surfaced in the step-by-step instructions.

    **Overall:** Good workflow doc with a real evidence anchor (WER=0.21). Key gaps: (1) `HIGH_THRESHOLD` is undefined in pseudocode; (2) GWAP interface design guidance is too thin to implement; (3) the 3–5x speedup claim lacks a citation; (4) failure modes are not embedded in procedural steps.

