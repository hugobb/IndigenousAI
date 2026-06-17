# Survey of Low-Resource Machine Translation

**Authors:** Barry Haddow, Rachel Bawden, Antonio Valerio Miceli Barone, Jindřich Helcl, Alexandra Birch
**Year:** 2022
**Venue:** Computational Linguistics, Volume 48, Number 3

---

## Core Argument

Low-resource machine translation remains one of the central challenges in NLP, and no single method dominates across all data regimes and language pairs. The survey systematically maps the landscape of approaches — transfer learning, multilingual models, data augmentation, back-translation, domain adaptation, and more — providing a structured reference for practitioners working on any low-resource translation scenario, including endangered and Indigenous languages.

## Key Concepts

- **Low-resource MT:** Translation settings where parallel corpora are scarce or absent; the paper taxonomizes approaches by data regime (zero-resource, extremely low, low, medium).
- **Transfer learning:** Using a pretrained model (typically on high-resource pairs) and adapting it to a low-resource language; includes cross-lingual transfer and parent-child fine-tuning.
- **Back-translation:** Generating synthetic parallel data by translating monolingual target-side text back into the source language; a dominant data augmentation strategy.
- **Multilingual NMT:** Training a single model on many language pairs simultaneously to enable zero-shot and few-shot transfer to unseen pairs.
- **Domain adaptation:** Adapting general-purpose translation models to specialized domains (medical, legal, etc.); relevant when community documents cover specific domains.

## Main Findings

- No single approach is universally best; the optimal strategy depends on data availability, language family relatedness, and available compute.
- Transfer from related languages is most effective when source and target languages are typologically similar; this limits transfer to Mohawk, which has few close linguistic relatives with NLP resources.
- Back-translation consistently provides gains but requires at least some initial translation quality; for zero-resource settings, multilingual pivot-based approaches or grammar-book methods may be necessary first steps.
- Tokenization and vocabulary design matter significantly for morphologically complex languages; subword methods (BPE, sentencepiece) can fail for agglutinative or polysynthetic languages.
- Human evaluation remains essential for low-resource settings where automatic metrics are unreliable.

## Relevance to Indigenous AI

This survey provides the essential technical foundation for understanding what tools exist and where their limits lie when approaching Mohawk language technology. The tokenization section is particularly relevant given Mohawk's polysynthetic morphology. The survey's taxonomy of data regimes maps directly onto the project's situation: the TRD archive offers monolingual data (useful for back-translation and language modeling) but parallel corpora are absent (limiting supervised MT). The survey also highlights the importance of human evaluation in low-resource settings — consistent with the project's commitment to community-centered validation.

## Limitations & Critiques

- Published in 2022; the landscape has shifted significantly with the emergence of GPT-4-class models and grammar-book translation approaches (Tanzer et al., 2024; Aycock et al., 2025), which are not covered.
- Does not address Indigenous data sovereignty, community consent, or ethical dimensions of building MT for endangered languages.
- Coverage of oral-tradition and non-written languages is limited; most surveyed work assumes text-based input/output.

## Questions & Follow-ups

- Which of the surveyed data augmentation strategies (back-translation, cross-lingual transfer, pivoting) are most viable for Mohawk given the profile of the TRD archive (large monolingual, no parallel)?
- How does the survey's treatment of morphological segmentation compare to dedicated tokenizer training on Mohawk data?
- Related work: Zhang et al. (2022) (Cherokee NLP), Ebrahimi et al. (2023) and de Gibert et al. (2025) (AmericasNLP shared tasks on Indigenous MT).
