# Towards the First Automatic Unsupervised Morphological Segmentation for Inuinnaqtun

**Authors:** Tan Le Ngoc, Fatiha Sadat
**Year:** 2021
**Venue:** First Workshop on NLP for Indigenous Languages of the Americas (AmericasNLP 2021), ACL

---

## Core Argument

Inuinnaqtun — a critically endangered Inuit language of Northern Canada projected to become extinct within two generations — has no existing automatic morphological segmentation tools. This paper adapts the Adaptor Grammars (AG) unsupervised morphological segmentation approach, augmented with linguist-seeded morphological knowledge, to Inuinnaqtun, achieving promising first results and contributing the first gold-standard evaluation set for this language.

## Key Concepts

- **Inuinnaqtun:** Western Canadian Inuktun, spoken in the Canadian Arctic; Inuit-Yupik-Unangan family; ~675 mother-tongue speakers (2016 census); projected to disappear within two generations. Even more critically under-resourced than Inuktitut, with only Bible parallel data publicly available.
- **Eskimo word structure:** Word base + lexical suffixes + grammatical ending suffixes. Words can encode full English sentences (e.g., umingmakhiuriaqtuqatigitqilimaiqtara = "I will no more again have him as a partner to go hunting muskox" — 9 morphemes in one word).
- **Adaptor Grammars (AG):** Probabilistic context-free grammar approach for unsupervised morphological segmentation; can incorporate linguistic priors (morpheme lists, grammar rules) without requiring labeled training data.
- **Scholar-seeded grammar:** The key intervention — adapting the standard AG grammar patterns to Inuinnaqtun's specific WordBase+LexicalSuffix+GrammaticalSuffix structure, using a list of 190 word bases and 571 affixes collected from dictionaries and grammar books.
- **Gold standard:** 1,055 manually segmented Inuinnaqtun words, the first such evaluation set for this language. Training input: 50K+ unsegmented words.

## Main Findings

- The AG-based approach with linguist-seeded grammar patterns produces promising morphological segmentation results for Inuinnaqtun, the first automatic system for this language.
- The scholar-seeded setting (incorporating linguistic knowledge of Inuinnaqtun word structure) outperforms the standard unsupervised AG configuration.
- The approach benefits from Inuinnaqtun's transparent morpheme-boundary structure: word base, then ordered lexical suffixes, then grammatical ending suffixes — a cleaner structure than some other polysynthetic languages with more fusion.
- The contribution of the gold-standard evaluation set enables reproducible future work on Inuinnaqtun NLP.
- The work is part of the larger Le and Sadat (2021) research program building NLP infrastructure for Inuit languages in Canada.

## Relevance to Indigenous AI

Inuinnaqtun is even more critically endangered than Inuktitut, making it a useful extreme case for what is achievable with near-zero resources. The AG approach with linguistic priors is the same method that would be most appropriate for Mohawk at its current resource level — where annotated training data is minimal but grammatical knowledge (from NRC's FST work, Onkwawenna Kentyohkwa's materials, Kuhn et al.'s Word-Weaver) is available. The WordBase+LexicalSuffix+GrammaticalSuffix structure parallels Mohawk's pronominal prefix + verb root + aspectual suffix structure; adapting the AG grammar patterns to Mohawk's morphological template is a concrete next step. The contribution of a gold-standard evaluation set is a model for how to bootstrap Mohawk morphological NLP resources from existing dictionaries and grammars.

## Limitations & Critiques

- This is a 4-page short paper from a workshop; detailed results and error analysis are not provided, making it difficult to assess actual performance levels.
- The 190 word bases and 571 affixes collected may represent only a fraction of Inuinnaqtun's morphological inventory; coverage gaps would limit the segmenter's practical utility.
- The approach is evaluated on the 1,055-word gold standard but not tested in any downstream application (MT, ASR); segmentation quality does not automatically translate to downstream improvements.

## Questions & Follow-ups

- What are the actual F1 scores for Inuinnaqtun segmentation? How does the scholar-seeded AG compare to the FST approach used for Inuktitut?
- How could the Inuinnaqtun AG grammar template be adapted for Mohawk? What morphological experts at Six Nations or NRC Canada could seed the Mohawk grammar?
- Related work: Le and Sadat (2021) on Inuktitut/Inuinnaqtun NMT (broader pipeline this fits into); Khandagale et al. (2022) on MorphAGram for Inuktitut; Kuhn et al. (2020) on NRC Canada's Mohawk FST.
