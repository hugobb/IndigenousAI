# Deep Learning-Based Morphological Segmentation for Innu-Aimun

**Authors:** Ngoc Tan Le, Antoine Cadotte, Mathieu Boivin, Fatiha Sadat
**Year:** 2022
**Venue:** Third Workshop on Deep Learning for Low-Resource NLP (ACL 2022)

---

## Core Argument

Innu-Aimun (Algonquian, polysynthetic, ~11,360 speakers in Quebec and Labrador) has not previously been studied for computational morphological segmentation. A deep learning Transformer-based encoder-decoder model outperforms FST, Morfessor, and Adaptor Grammar baselines on Innu-Aimun morphological segmentation, demonstrating that deep learning is viable even for an extremely low-resource polysynthetic language — and establishing the first NLP benchmark for this language.

## Key Concepts

- **Innu-Aimun (Montagnais):** Language of the Innu people in Quebec and Labrador; Algonquian polysynthetic language related to Cree and Naskapi; orthography standardized in 1989; ~11,360 speakers (Statistics Canada 2016). Fundamentally oral; limited NLP work prior to this paper.
- **Surface segmentation:** Task of decomposing a word into its constituent morpheme substrings (e.g., uminushima → u-minush-im-a, meaning "her/his cats"). Focuses on morpheme boundaries, not full glossing or morpheme labeling.
- **Transformer encoder-decoder:** The model encodes the character sequence of a word and decodes the segmented morpheme sequence, using multi-head self-attention. Handles the monotonic alignment property of morphotactics (morphemes are ordered consistently in polysynthetic words).
- **Baseline methods compared:** Finite-State Transducer (rule-based), Morfessor (unsupervised statistical), Adaptor Grammars (semi-supervised with linguistic priors). The deep learning model outperforms all three.
- **Polysynthesis challenge:** Innu-Aimun words encode full clauses; each word can have multiple individual morphemes, several meanings per morpheme; OOV rates are extreme (cadotte et al. 2022 report 82–87%).

## Main Findings

- The Transformer-based model achieves better morphological segmentation quality than FST, Morfessor, and Adaptor Grammar baselines on Innu-Aimun.
- Even with extremely limited annotated training data (characteristic of Innu-Aimun), the deep learning approach generalizes better than rule-based and unsupervised alternatives.
- The monotonic property of polysynthetic morphotactics (morphemes appear in a consistent order) is explicitly exploited in the model architecture, improving segmentation quality.
- The paper establishes the first morphological segmentation benchmark for Innu-Aimun, with evaluation against multiple baselines.
- Error analysis reveals that morpheme boundary decisions are hardest where morpheme-to-surface-form mappings are irregular (allomorphic variation under morphophonological rules).

## Relevance to Indigenous AI

Innu-Aimun is structurally analogous to Mohawk in key ways: polysynthetic, low-resource, fundamentally oral, with a small but active digital resource ecosystem (web tools, verb conjugators maintained by Junker et al.). The finding that Transformer-based segmentation outperforms FST, Morfessor, and AG at small data scales is directly relevant to Mohawk — it suggests that given even a modest annotated segmentation corpus, a neural approach may outperform the rule-based FSTs that currently exist for Mohawk. The paper builds directly on Cadotte et al. (2022), which established the OOV challenge and the MT pipeline goal; together these papers form a complete view of the Innu-Aimun NLP state of the art, which is the closest analogue to the Mohawk NLP situation.

## Limitations & Critiques

- The absolute performance numbers are not reported in the summary above; it would be useful to know the actual F1 scores on morpheme boundary detection to calibrate expectations for Mohawk.
- The model requires some annotated training data; the paper does not specify exactly how much was available for Innu-Aimun or how performance varies with training set size.
- Surface segmentation is the first step; the paper does not address downstream tasks (MT, language modeling, ASR) that require not just morpheme boundaries but morpheme labels and meanings.

## Questions & Follow-ups

- How much annotated Innu-Aimun segmentation data was used? What is the performance curve as training data increases?
- Can the Transformer model trained on Innu-Aimun be fine-tuned for Mohawk with transfer learning, given the related Algonquian morphological structure?
- Related work: Cadotte et al. (2022) on Innu-Aimun corpus and MT; Le and Sadat (2021) on NMT for Inuktitut/Inuinnaqtun; Kann et al. (2018) on neural segmentation for Uto-Aztecan polysynthetic languages; Liu et al. (2021) for Seneca (Iroquoian).
