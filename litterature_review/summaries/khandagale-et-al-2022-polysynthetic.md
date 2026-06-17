# Unsupervised Morphological Analysis of Polysynthetic Languages

**Authors:** Sujay Khandagale, Yoann Léveillé, Samuel Miller, Derek Pham, Ramy Eskander, Cass Lowry, Richard Compton, Judith Klavans, Maria Polinsky, Smaranda Muresan
**Year:** 2022
**Venue:** AACL-IJCNLP 2022 (Short Papers)

---

## Core Argument

For polysynthetic languages where annotated data is scarce, unsupervised morphological approaches augmented with linguistic priors outperform purely data-driven methods. Testing on two typologically distinct polysynthetic languages — Adyghe (Northwest Caucasian) and Eastern Canadian Inuktitut — the authors show that incorporating linguist-provided morphological knowledge into the MorphAGram framework improves segmentation quality, and that using stems (rather than words) as the unit of abstraction improves POS tagging through cross-lingual projection.

## Key Concepts

- **MorphAGram:** An unsupervised morphological segmentation system based on Adaptor Grammars (AG) — a non-parametric Bayesian extension of probabilistic context-free grammars. Key advantage: it accepts linguist-provided priors (affixes, grammar rules) without requiring fully annotated training data.
- **Linguistic priors:** Grammar patterns, morpheme lists, and morphological rules provided by trained linguists to guide unsupervised learning. Reduces the data requirement while incorporating domain knowledge.
- **Stem-level POS tagging:** For cross-lingual projection of POS tags (using Bible parallel data), using stems rather than full word forms as the alignment unit substantially improves performance — because stems map more reliably across polysynthetic word variants.
- **Adyghe (West Circassian):** Northwest Caucasian, ~118K speakers; complex verbal agreement encoding clausal arguments; inflection/derivation boundary difficult to define.
- **Eastern Canadian Inuktitut:** Inuit-Yupik-Unangan family; ~40K speakers in Canadian Arctic; high morpheme-per-word ratio; closed classes of verbs triggering noun or verb incorporation; extensive category-changing morphology; high homophony due to short morphemes and small phoneme inventory.
- **Contributed datasets:** Gold-standard annotated datasets for morphological segmentation and POS tagging for both Adyghe and Inuktitut, made available for future research.

## Main Findings

- For morphological segmentation, incorporating linguistic priors into MorphAGram consistently improves performance over pure unsupervised methods for both Adyghe and Inuktitut.
- For POS tagging via cross-lingual projection, using stems (not words) as the alignment unit between source and target language is the key factor in improving accuracy; this effect is consistent across both languages.
- The approach is specifically designed for truly low-resource scenarios — unlike neural approaches that need hundreds or thousands of examples, MorphAGram with linguistic priors can work with very limited annotated data.
- Inuktitut's high degree of polysynthesis (noun and verb incorporation, category-changing morphology, short morphemes with homophony) creates specific parsing challenges that are partially addressed by the stem-level approach.
- The paper contributes the first publicly available evaluation datasets for morphological segmentation and POS tagging for Adyghe and Eastern Canadian Inuktitut.

## Relevance to Indigenous AI

Two aspects of this paper are directly relevant to Mohawk. First, Inuktitut is an Inuit-family polysynthetic language with many structural parallels to Mohawk (both have complex verbal morphology incorporating pronominal affixes, incorporation structures, and high morpheme-per-word ratios). The Inuktitut results provide a concrete reference point. Second, the linguistic priors approach — using linguist-provided rules to bootstrap unsupervised learning — is probably the right model for Mohawk NLP work, where annotated training data is minimal but grammatical knowledge is documented (NRC Canada's FST work, Onkwawenna Kentyohkwa's pedagogical materials). The stem-level POS finding is relevant if the project attempts cross-lingual transfer from related Iroquoian languages (Seneca, Oneida) to Mohawk. The contributed Inuktitut dataset could serve as a technical benchmark against which Mohawk work is compared.

## Limitations & Critiques

- Both Adyghe and Inuktitut are typologically different from Mohawk (Iroquoian); the specific morphological challenges of Mohawk (pronominal prefixes, aspect suffixes, bound morpheme roots) are not directly addressed.
- The unsupervised approach with linguistic priors still requires a trained linguist to supply the priors; this labor is not quantified and may be a bottleneck in practice.
- The POS tagging experiments rely on Bible parallel data (English-Adyghe, English-Inuktitut); for Mohawk, Bible data exists but is limited and may not reflect contemporary language use.

## Questions & Follow-ups

- Is there Mohawk-English parallel data beyond the Bible? What are the currently available Mohawk linguistic resources suitable as MorphAGram priors?
- Would stem-level cross-lingual projection work across Iroquoian languages (Seneca ↔ Mohawk ↔ Oneida)?
- Related work: Kann et al. (2018) for neural segmentation of polysynthetic languages; Le et al. (2022) for deep learning approach to Innu-Aimun; Liu et al. (2021) for Seneca; Kuhn et al. (2020) for FST approaches to Mohawk and Inuktut.
