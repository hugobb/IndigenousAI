# Confounding Factors in Relating Model Performance to Morphology

**Authors:** Wessel Poelman, Thomas Bauwens, Miryam de Lhoneux
**Year:** 2025
**Venue:** EMNLP 2025 (KU Leuven)

---

## Core Argument

The conflicting evidence in the literature about whether morphological complexity affects language model performance is largely due to confounding factors in experimental design — inconsistent language sets, coarse typological groupings, differing tokenization algorithms, and uncontrolled dataset sizes. Re-assessing Arnett and Bergen's (2025) three hypotheses about the agglutinative-fusional perplexity gap, the authors show each conclusion contains confounds, and introduce token bigram metrics as a new, annotation-free gradient proxy for morphological complexity that better predicts language modeling difficulty.

## Key Concepts

- **Confounding factors in morphology-LM studies:** At least three recur: (1) language set selection — comparing agglutinative vs. fusional languages without controlling for which languages; (2) coarse typological grouping — treating "agglutinative" as a binary category hides continuous variation; (3) tokenization algorithm — different vocab sizes, algorithms, and hyperparameters make morphology-LM comparisons invalid.
- **Re-assessment of Arnett and Bergen (2025):** Their three hypotheses (H1: morphological misalignment, H2: tokenization inefficiency, H3: data size/byte-premium) each have confounds. H3 (data size) is the most defensible but itself depends on what "equal data" means.
- **Token bigram metrics:** New intrinsic tokenizer metrics computed from neighboring token relationships rather than individual tokens — accessor variety (AV), total accessors (TA), uniqueness (AU), entropic efficiency (η). These are computed in sliding windows over the vocabulary and better capture morphological complexity than unigram metrics (type-token ratio, mean word length) without requiring annotated data.
- **Gradient vs. binary morphology:** Languages should not be classified as simply "agglutinative" or "fusional" — morphological complexity is a gradient property, and analyses that use binary groupings suppress the continuous variation that drives the observed effects.
- **Causal language modeling (CLM) difficulty:** The paper specifically targets CLM (next-token prediction), arguing that token bigram metrics better predict CLM perplexity differences across languages than existing metrics.

## Main Findings

- Each of Arnett and Bergen's three hypotheses contains identifiable confounding factors that prevent their conclusions from being fully reliable — this does not mean the hypotheses are wrong, but that the evidence is weaker than claimed.
- Token bigram metrics (especially entropic efficiency η) predict CLM difficulty across languages better than existing unigram metrics, without requiring morphological annotation.
- Coarse agglutinative/fusional groupings consistently produce misleading results; within-group variation is large and should be modeled, not collapsed.
- The tokenization algorithm (BPE, Unigram, SentencePiece) confounds morphology-LM comparisons because different algorithms segment the same text differently, producing different effective morphological alignment without any change in the language itself.
- Rigorous causal claims about morphology and LM performance require: fixed language sets, gradient morphology metrics, controlled tokenization, controlled dataset size.

## Relevance to Indigenous AI

This paper provides critical methodological guidance for any experiments on Mohawk NLP. The key warning: do not draw conclusions about "how well LLMs handle polysynthetic languages" from experiments that confound language type, tokenizer choice, and dataset size. For Mohawk specifically, all three confounds are live risks — there is likely no appropriate control language, tokenizer comparison is confounded by script and training data, and dataset size is tiny. The token bigram metrics proposed here could be applied to Mohawk text (even a small corpus) to characterize its morphological complexity in a principled way, without requiring annotated morphological data. This would give the project a quantitative characterization of Mohawk's complexity relative to other languages studied.

## Limitations & Critiques

- The paper identifies confounds and proposes better metrics, but does not itself conduct a fully controlled experiment demonstrating clear answers to whether/how morphology affects LM performance.
- Token bigram metrics are novel and have not been validated across the full typological range; their behavior for extreme polysynthetic languages (like Mohawk) is not reported.
- The paper does not address low-resource settings directly; all discussed languages appear to have at least moderate digital presence.

## Questions & Follow-ups

- Can token bigram metrics be computed from small corpora (a few thousand Mohawk words)? What do they reveal about Mohawk's morphological complexity relative to, e.g., Turkish or Finnish?
- How should a rigorous experiment comparing tokenizers for Mohawk be designed, given the confounding factors this paper identifies?
- Related work: Arnett and Bergen (2025) on morphologically complex languages (directly rebutted here); Arnett et al. (2025) on MorphScore; Goldman et al. (2024) on compression; Schmidt et al. (2024) on tokenization; Vasques et al. (2023) on BPE compression and typology.
