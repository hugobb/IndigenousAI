
# FST Morphological Segmentation for Polysynthetic MT

**Category:** ML Technique
**Data Regime:** &lt;1K sentences / 1K–10K sentences
**Applicable Languages:** polysynthetic; especially Algonquian, Iroquoian, and other languages with extreme OOV rates

## Description

Finite-State Transducer (FST) morphological segmentation is a rule-based method that decomposes polysynthetic words into their constituent morphemes before feeding the segmented text into a statistical or neural machine translation (NMT) model. The resulting pipeline — FST segmenter → NMT model — addresses the core bottleneck of polysynthetic MT: extreme out-of-vocabulary (OOV) rates caused by the combinatorial explosion of morpheme combinations.

In polysynthetic languages like Innu-Aimun, Inuktitut, or Mohawk, a single word can encode what an entire clause expresses in English. Dictionary-sized vocabularies contain only a small fraction of the word forms that appear in real text; in Innu-Aimun, 82–87% of tokens in available parallel corpora are absent from the most complete dictionary. FST segmentation reduces effective vocabulary size by mapping surface forms to their underlying morpheme sequences, allowing downstream statistical models to learn from shared morphemic patterns rather than unique surface words.

An FST is a finite automaton with input and output tapes that encodes the morphophonological rules of a language as a directed graph of states and transitions. For each input word, the transducer traverses the graph and emits the morpheme segmentation. Modern FSTs for Algonquian languages are typically built using the `foma` or `HFST` toolkit and require significant linguistic expertise to construct and maintain.

## When to Use

- The target language is polysynthetic and has an OOV rate above ~50% in available parallel corpora.
- An FST for the target language (or a closely related language in the same family) already exists or can be adapted from an existing one.
- A downstream MT system (phrase-based SMT or NMT) is being built and vocabulary coverage is the primary bottleneck.
- Works well for: Algonquian languages (Plains Cree FST model by Snoek et al. (2014) is adaptable to Innu-Aimun; NRC Canada has developed FSTs for several Canadian Indigenous languages).
- Works poorly for: languages with no existing FST and insufficient linguistic documentation to build one from scratch; when OOV is not driven by morphology but by domain mismatch.
- An FST is a prerequisite building block before attempting any statistical or neural MT; without it, NMT models face data sparsity that cannot be resolved by adding more training data.

## How to Apply

1. **Audit the OOV rate.** Count the proportion of word types in your parallel corpus that are absent from the target language dictionary. If the rate exceeds ~50%, morphological segmentation is essential before NMT.

2. **Obtain or build an FST for the target language.**
   - Check whether an FST exists for the language or a closely related dialect (e.g., Plains Cree FST for Innu-Aimun; NRC Canada FSTs for several Canadian Indigenous languages).
   - If adapting from a related language, identify shared morphophonological rules and update phonological alternation rules for the target dialect.
   - If building from scratch: compile morpheme lists from dictionaries and conjugation tables; encode the morphological rules as states and transitions in `foma` or `HFST`; validate against known word forms.

3. **Segment the parallel corpus.**
   - Apply the FST to the target-language side of the parallel corpus: each word form is replaced by a space-separated sequence of morphemes.
   - Apply consistent segmentation to development and test sets.
   - For words that the FST cannot analyze (residual OOV), fall back to character-level BPE or leave unsegmented.

4. **Train the NMT model on segmented text.**
   - Use any standard sequence-to-sequence architecture (e.g., Transformer-based NMT).
   - The source side (e.g., French or English) is typically left unsegmented; only the target-language side (or both sides) is morpheme-segmented.
   - Segmented output from the model must be de-segmented (rejoined) at inference time.

5. **De-segment at inference time.**
   - Rejoin morpheme tokens using the inverse FST (if available) or simple concatenation rules.
   - Evaluate MT quality with BLEU and CHRF on de-segmented output.

6. **(Optional) Semi-supervised extension.** If large monolingual data exists but annotation is limited, combine the FST with an unsupervised segmentation method (e.g., Adaptor Grammars, BPE) in a semi-supervised hybrid. The FST defines morpheme boundaries for known patterns; the unsupervised component handles unknown forms.

## Pseudocode

```
# Step 1: Audit OOV rate
vocab = load_dictionary(language="innu-aimun")  # 28K+ words
oov_count = 0
total = 0
for sentence in parallel_corpus.target_side:
    for word in sentence.split():
        total += 1
        if word not in vocab:
            oov_count += 1
oov_rate = oov_count / total  # expect 0.82–0.87 for Innu-Aimun

# Step 2: Load or build FST
fst = load_fst("plains-cree.fst")       # or build with foma/HFST
fst.adapt_phonological_rules(target_dialect="innu-aimun")

# Step 3: Segment parallel corpus
def segment(sentence, fst, fallback="bpe"):
    tokens = []
    for word in sentence.split():
        morphemes = fst.transduce(word)
        if morphemes:
            tokens.append(" ".join(morphemes))
        elif fallback == "bpe":
            tokens.append(bpe.encode(word))
        else:
            tokens.append(word)  # leave unsegmented
    return " ".join(tokens)

segmented_corpus = [segment(s, fst) for s in parallel_corpus.target_side]

# Step 4: Train NMT
model = TransformerNMT(src_vocab=src_vocab, tgt_vocab=segmented_vocab)
model.train(
    src=parallel_corpus.source_side,
    tgt=segmented_corpus,
    epochs=20,
    lr=1e-4
)

# Step 5: Inference + de-segmentation
for src_sentence in test_set:
    segmented_output = model.translate(src_sentence)
    final_output = desegment(segmented_output, fst.inverse)
    evaluate(final_output, reference)
```

## Evidence

**Innu-Aimun OOV rates (Cadotte et al., 2022):**
- FNQLSDI books corpus (1,450 parallel sentences): 87% OOV rate in Innu-Aimun vocabulary.
- Mémoire d'encrier poetry (110 sentences): 82% OOV.
- Mémoire d'encrier novels & essays (1,670 sentences): 87% OOV.
- Vocabulary size across corpora: 4,170–4,453 Innu-Aimun unique word types.

Note: The Cadotte et al. (2022) paper proposes FST segmentation as the critical next step but does not report final BLEU/CHRF scores for a trained FST+NMT system; those results are in the downstream Le and Sadat (2020a, 2020b) papers on Inuktitut and the proposed Innu-Aimun system.

**Mager et al. (2022), ACL Findings — indirect evidence from comparison with unsupervised methods:**

In the ELR polysynthetic MT study by Mager et al. (2022), no FST was available for the four test languages (Wixarika, Nahuatl, Raramuri, Shipibo-Konibo). Instead, unsupervised morphological segmenters (Morfessor, FlatCat, LMVR) were used as the linguistically-informed alternative to BPE. These unsupervised methods outperform BPE on 5 of 8 translation directions, but do not reach FST quality (FlatCat achieves 83.75 F1 on morphological segmentation vs. best supervised systems at 90+ F1). This confirms the established hierarchy: FST (highest linguistic quality, requires expert grammar) > supervised neural (high F1, domain mismatch in MT) > unsupervised morphological (best MT in ELR, no annotation needed) > BPE (worst for ELR polysynthetic MT). For languages like Wixarika (hch), FlatCat achieves chrF 31.44 vs. BPE 30.50 on hch→spa and chrF 35.12 vs. BPE 31.18 on spa→hch — confirming that morphologically-grounded segmentation yields measurable MT improvements even without an FST.

**Inuktitut (related polysynthetic language) — Le and Sadat (2020a):**
- FST-based morphological segmentation substantially improves NMT quality on the Nunavut Hansard Inuktitut-English corpus (1.4M+ pairs).
- Inuktitut-specific segmentation model outperforms BPE-only baseline, confirming that language-specific segmentation outperforms generic subword methods for polysynthetic MT.

**Plains Cree FST (Snoek et al., 2014):**
- Demonstrates that FST segmentation is buildable for Algonquian languages and transferable across languages in the same family (Plains Cree → Innu-Aimun adaptation is proposed in Cadotte et al.).

## Variations & Configuration

- **FST toolkit:** `foma` (open-source, widely used for Algonquian) and `HFST` (Helsinki FST Tools) are the two main options. Both support morphological rules as weighted finite-state networks.
- **BPE fallback:** For words the FST cannot analyze, Byte Pair Encoding (Sennrich et al., 2016) provides an unsupervised subword fallback. BPE alone is insufficient for polysynthetic languages but works as a residual handler.
- **Semi-supervised hybrid (Adaptor Grammars):** Le and Sadat (2021) use a semi-supervised method combining grammar rules with an unsupervised Adaptor Grammars framework (Eskander et al., 2020) for Inuinnaqtun. This is viable when an FST cannot be fully built but morpheme lists and grammar patterns are available from dictionaries and conjugation tables.
- **Cross-family transfer:** If no FST exists for the target language, an FST from a related language (same family) is a stronger starting point than building from scratch. The morphophonological rules differ in systematic ways that can be encoded as adaptation rules.
- **Segmentation depth:** Segment at the morpheme level (finest-grained) or at the stem+affix level (coarser) depending on the sparsity-generalization trade-off. Finer segmentation reduces OOV more aggressively but may introduce noise.

## Code & Tools

- `foma`: https://github.com/mhulden/foma — FST compiler for morphological rules; the toolkit used for Kawennón:nis (Kanyen'kéha) and Michif verb conjugators
- `HFST` (Helsinki Finite-State Tools): https://github.com/hfst/hfst — alternative FST toolkit with Python bindings
- **Kawennón:nis (Kanyen'kéha/Mohawk verb conjugator):** [https://kawennonnis.ca](https://kawennonnis.ca) — live FST-backed conjugator for Western dialect; Eastern (Kahnawà:ke) version also available; open-source framework at [https://github.com/roedoejet/wordweaver](https://github.com/roedoejet/wordweaver)
- **Nunavut Hansard Inuktut–English corpus:** [https://doi.org/10.4224/40001819](https://doi.org/10.4224/40001819) — 1.3M sentence-aligned pairs under CC-BY-4.0; largest publicly available parallel corpus for any polysynthetic language; used in WMT 2020 shared task
- NRC Canada Algonquian FSTs: Referenced in Kuhn et al. (2020); available for several Canadian Indigenous languages through NRC Canada's Indigenous Languages Technology project
- Plains Cree FST: Snoek et al. (2014); Harrigan et al. (2017) — basis for Algonquian adaptation
- Adaptor Grammars (semi-supervised alternative): Eskander et al. (2020), MorphAGram — https://github.com/rnd2110/MorphAGram

## Strengths & Weaknesses

| Strengths | Weaknesses |
| --- | --- |
| Directly addresses the structural cause of high OOV rates in polysynthetic languages | Requires significant linguistic expertise and time to build a new FST from scratch |
| Substantially reduces vocabulary size, improving NMT data efficiency | FST coverage is imperfect; words with novel morpheme combinations or loanwords may not be analyzed |
| Transferable across related languages in the same family (Algonquian, Iroquoian) | Maintenance burden: as the language evolves or new dialects are documented, the FST rules must be updated |
| Deterministic and interpretable — segmentation decisions can be audited | De-segmentation at inference time introduces an additional error source |
| Proven in production-scale systems (Inuktitut Hansard) | BPE alone does not substitute for FST in polysynthetic MT; generic subword methods underperform language-specific segmenters |

## References

- Cadotte, A., Le, N. T., Boivin, M., & Sadat, F. (2022). Challenges and Perspectives for Innu-Aimun within Indigenous Language Technologies. *Proceedings of the Fifth Workshop on the Use of Computational Methods in the Study of Endangered Languages*, 99–108. ACL 2022.
- Le, T. N., & Sadat, F. (2020a). Low-resource NMT: an empirical study on the effect of rich morphological word segmentation on Inuktitut. *AMTA 2020*.
- Le, T. N., & Sadat, F. (2020b). Revitalization of indigenous languages through pre-processing and neural machine translation: the case of Inuktitut. *COLING 2020*.
- Le, T. N., & Sadat, F. (2021). Towards a first automatic unsupervised morphological segmentation for Inuinnaqtun. *NLP4IndigenousLanguages, NACL 2021*.
- Snoek, C., Thunder, D., Lôo, K., Arppe, A., Lachler, J., Moshagen, S., & Trosterud, T. (2014). Modeling the Noun Morphology of Plains Cree. *ComputEL Workshop, ACL 2014*.
- Harrigan, A., Schmirler, K., Arppe, A., Antonsen, L., Trosterud, T., & Wolvengrey, A. (2017). Learning from the computational modelling of Plains Cree verbs. *Morphology*, 27(4):565–598.
- Eskander, R., Callejas, F., Nichols, J., Klavans, J., & Muresan, S. (2020). MorphAGram, evaluation and framework for unsupervised morphological segmentation. *LREC 2020*.
- Sennrich, R., Haddow, B., & Birch, A. (2016). Neural machine translation of rare words with subword units. *ACL 2016*.
- Kuhn, R., et al. (2020). The Indigenous Languages Technology project at NRC Canada. *COLING 2020*.

??? note "📋 Self-Review Notes"
    **Reviewed:** 2026-06-11

    **Criterion 1 — Implementable from scratch:** PARTIAL — The pipeline steps (audit OOV → obtain FST → segment → train NMT → de-segment) are concrete enough to follow. However, the FST construction and dialect adaptation steps are underspecified: "encode morphological rules as states and transitions in foma/HFST" and "adapt phonological rules for the target dialect" lack any mechanical guidance. A practitioner unfamiliar with FST grammar formalisms would need to consult external documentation before proceeding.

    **Criterion 2 — Empirical results with numbers:** PARTIAL — OOV rates are reported with high specificity (82–87%, Cadotte et al. 2022; corpus sizes: 110–1,670 sentences). However, no BLEU or CHRF scores are provided for an FST+NMT system on any language. The Inuktitut result (Le & Sadat 2020a) is stated only qualitatively ("substantially improves NMT quality"). The gap between "FST addresses OOV" and "FST improves BLEU by X points" is unquantified.

    **Criterion 3 — Data regime clarity:** PASS — Corpus sizes, OOV rates, dictionary size (28K+ words), and the front-matter data regime label ("&lt;1K / 1K–10K sentences") are all present and consistent. The reader knows what data was available in the evidence cases.

    **Criterion 4 — Pseudocode completeness:** PARTIAL — The retrieval and segmentation logic is clear. Three gaps remain: (1) `fst.adapt_phonological_rules(target_dialect=...)` is a placeholder with no explanation of what adaptation entails; (2) `desegment(segmented_output, fst.inverse)` is a black box — inverse FST construction is non-trivial and unaddressed; (3) NMT hyperparameters (epochs=20, lr=1e-4) are illustrative but not grounded in the referenced experiments.

    **Criterion 5 — Failure modes:** PASS — The Strengths & Weaknesses table and the "When to Use / Works poorly for" section together cover the main failure modes: FST unavailability, loanword/OOV residue, maintenance burden, de-segmentation errors, and the inadequacy of BPE alone for polysynthetic MT.

    **Overall:** Solid technique doc with strong motivating evidence (OOV numbers) and a clear pipeline. Key gaps are (a) missing BLEU/CHRF numbers for the FST+NMT system to confirm the segmentation benefit quantitatively, and (b) the FST construction/adaptation section needs more concrete guidance or a pointer to a worked example so practitioners can proceed without the original papers.

