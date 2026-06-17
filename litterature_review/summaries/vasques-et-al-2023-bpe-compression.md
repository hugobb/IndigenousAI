# BPE Compression and Morphological Typology

**Authors:** Vasques et al. (University of Zürich + University of Tübingen)
**Year:** 2023
**Venue:** Computational Linguistics 2023

---

## Core Argument

BPE subword properties — specifically the distinction between *productive* subwords (which function like inflectional markers and affixes) and *idiosyncratic* subwords (which reflect irregular high-frequency patterns) — systematically reflect the morphological typology of the language being tokenized. Representing each language as a vector in a BPE subword productivity space produces language clusters that align well with established typological databases, demonstrating that BPE compression encodes morphological structure even though BPE was not designed with morphology in mind.

## Key Concepts

- **Productive vs. idiosyncratic subwords:** BPE produces two types of subwords in practice. *Productive subwords* resemble inflectional affixes or morpheme fragments — they appear consistently in specific morphological contexts and carry recurring meaning-form mappings. *Idiosyncratic subwords* are frequent but irregular — they appear in high-frequency word forms without systematic morphological function (e.g., common word-internal sequences in frequent vocabulary items). The ratio of productive to idiosyncratic subwords varies systematically across languages.
- **BPE subword productivity space:** Each language is represented as a vector based on the proportion and distribution of productive vs. idiosyncratic subwords learned by BPE on that language's corpus. Languages cluster in this space in ways that match morphological typology groupings.
- **47 languages, 3 parallel corpora:** The study evaluates across 47 languages using three parallel corpora (Bible, Universal Declaration of Human Rights, and a third source) to control for domain effects, giving robust cross-linguistic comparisons.
- **Typological databases:** Language vector clusters are validated against established typological databases (WALS, Grambank, or similar) that characterize languages by morphological properties (inflectional richness, agglutination, synthesis level).
- **Late Eastern Inuit example:** Used as the polysynthetic extreme in the analysis. The paper illustrates the polysynthetic case with a single Inuit word — "aaffakkumasut" (13 characters, 1 word) — that corresponds to 6 words in English, showing how extreme morphological synthesis concentrates meaning in BPE subwords differently than analytic languages.
- **Relation to Goldman et al. (2024):** Goldman et al. showed that BPE compression ratio predicts downstream LM performance; Vasques et al. provide a mechanistic partial explanation — the compression ratio difference reflects real morphological typology differences, which is why it correlates with downstream performance.

## Main Findings

- BPE subword productivity distributions align with morphological typology across 47 languages and 3 corpora — the alignment is not domain-specific.
- Languages with richer inflectional morphology produce higher proportions of productive subwords; languages with less inflectional morphology produce higher proportions of idiosyncratic subwords.
- Language vectors in the BPE subword productivity space cluster in ways that match typological groupings from external databases.
- The BPE compression–typology relationship holds across different corpus sizes within the study's range, suggesting it is a property of morphological structure, not data volume.
- Polysynthetic languages (represented by Late Eastern Inuit) occupy an extreme position in the subword productivity space — their highly synthetic morphology is captured by BPE in characteristic ways distinct from agglutinative or fusional languages.

## Relevance to Indigenous AI

This paper provides a theoretical grounding for why tokenization choices matter specifically for polysynthetic languages like Mohawk. Three implications for the IndigenousAI project: First, BPE applied to Mohawk will produce a high proportion of productive subwords (reflecting Mohawk's highly synthetic morphology) — this means BPE is doing real morphological work on Mohawk text, even without explicit morphological supervision. Second, the compression-as-typology-indicator finding means that the compression ratio of a BPE model trained on Mohawk text is informative about Mohawk's morphological complexity relative to other languages — this can be measured even from a small corpus. Third, the productive/idiosyncratic subword distinction suggests a way to evaluate whether a Mohawk tokenizer is learning morphologically meaningful units: a well-designed Mohawk tokenizer should produce predominantly productive subwords. The Late Eastern Inuit example (one word = 6 English words) is a direct parallel to Mohawk verbal morphology, where a single verb form can encode subject, object, tense, aspect, and modality simultaneously.

## Limitations & Critiques

- The paper characterizes the typology-BPE relationship but does not directly test whether more typologically aligned BPE vocabularies produce better downstream NLP performance for polysynthetic languages specifically.
- The three corpora used (Bible, UDHR, one other) are narrow in domain and register; whether the productive/idiosyncratic subword distribution generalizes to conversational or pedagogical text is not tested.
- Mohawk itself is not in the 47-language study; the polysynthetic end of the typological spectrum is represented only by Inuit languages.
- The paper's relationship to Schmidt et al. (2024) requires careful reading: Schmidt et al. show that minimizing compression further (via PathPiece) does not improve downstream performance, while Vasques et al. show that BPE's compression *level* reflects morphological typology. These findings are compatible but must not be conflated — compression as a typological indicator ≠ more compression = better performance.

## Questions & Follow-ups

- Can the productive/idiosyncratic subword analysis be run on a small Mohawk BPE vocabulary to characterize Mohawk's position in the typological space, even with limited training data?
- How does the productive subword proportion for Mohawk compare to Late Eastern Inuit (the existing polysynthetic reference point)?
- Related work: Goldman et al. (2024) on compression as downstream performance predictor; Schmidt et al. (2024) on PathPiece and the compression hypothesis; Poelman et al. (2025) on confounding factors in morphology-LM studies; Arnett and Bergen (2025) on morphological alignment; Mager et al. (2022) on BPE vs. morphological segmentation for polysynthetic languages.
