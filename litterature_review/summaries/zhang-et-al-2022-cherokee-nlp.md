# How can NLP Help Revitalize Endangered Languages? A Case Study and Roadmap for the Cherokee Language

**Authors:** Shiyue Zhang, Benjamin E. Frey, Mohit Bansal
**Year:** 2022
**Venue:** Proceedings of the 60th Annual Meeting of the Association for Computational Linguistics (ACL 2022), Long Papers

---

## Core Argument

NLP can support endangered language revitalization, but only if practitioners first adopt community-centered principles — understanding and respecting the community, decolonizing research, and building a collaborative community — before pursuing technical work. The paper maps a three-stage roadmap (pre-NLP principles → NLP-assisted education → language-specific NLP research) using Cherokee as a case study, proposing concrete resource-enrichment methods and specific NLP tools that Cherokee community members themselves have expressed interest in.

## Key Concepts

- **Decolonizing research:** Placing Indigenous voices and community needs at the center of the research process rather than imposing external methodological frameworks; prioritizing what the community considers worth preserving over what NLP researchers find technically tractable.
- **Machine-in-the-loop processing:** Using NLP automation to assist (not replace) human speakers in resource collection and annotation — reducing the burden on the small speaker community while maintaining quality.
- **Community-based resource collection:** A collaborative online platform where native speakers contribute materials, NLP researchers share models, and language learners practice — integrating GWAP (Games with a Purpose) mechanics to make annotation engaging.
- **Human computation:** The principle (from Von Ahn / Duolingo) that combining human expertise and computational tools enables solving problems neither could tackle alone — applied here to the bootstrapping problem of building NLP tools for data-scarce languages.
- **Polysynthetic morphology:** Cherokee's linguistic structure where a single word can encode information equivalent to an English sentence (subject, object, tense, aspect, shape-of-object classifier), making standard subword tokenization harmful for MT.

## Main Findings

- Three community-grounded principles for NLP practitioners working with endangered-language communities: (1) understand and respect first — address power imbalances before asking technical questions; (2) decolonize research — question whether standard NLP formulations fit the language; (3) build community — create shared, sustainable infrastructure.
- Existing OCR tools (Tesseract, Google Vision) support Cherokee syllabary but accuracy degrades sharply on noisy images; preprocessing clean text extracts is essential before mining digitized Cherokee materials.
- A fine-tuned XLSR-53 ASR model achieves WER=0.21 on audio-to-syllabic-text transcription — a strong result for a severely endangered language — demonstrating that cross-lingual pretraining can be leveraged for Cherokee with modest labeled data.
- Standard subword tokenization (BPE, Unigram LM) poorly aligns with Cherokee morpheme boundaries; character-level generation in transliterated Latin script may be more appropriate given the language's polysynthetic structure.
- Cherokee community members specifically requested machine translation (for drafting/editing workflows), OCR (to digitize manuscript text), ASR (for audio transcription), and basic NLP tools (POS tagger, dependency parser) as prerequisites for more advanced applications.

## Relevance to Indigenous AI

This is the most directly relevant paper in the set to the IndigenousAI project. It provides an explicit, community-validated roadmap for NLP work with a severely endangered North American Indigenous language (Cherokee), closely analogous to Mohawk. The three principles (respect, decolonize, build community) directly map to the Six Nations collaboration framework. Key transferable lessons: (1) community co-authorship is non-negotiable — the paper includes a Cherokee citizen (Frey) as co-author and cites Cherokee speakers by name; (2) the technology priority list (MT, ASR, OCR) was set by community members, not researchers; (3) the warning against "number games" (optimizing data quantity rather than community benefit) is directly applicable to any Mohawk language model development. Cherokee's polysynthetic morphology, evidentiality system, and verb-centric structure also parallel aspects of Mohawk linguistics, making Cherokee NLP challenges a useful reference point.

## Limitations & Critiques

- The Cherokee speaker community (co-author Frey and a small group) does not represent all three federally recognized Cherokee nations; the paper acknowledges this is not a community-wide view.
- Proposed community platform remains conceptual rather than deployed; the paper does not evaluate whether such infrastructure would actually be adopted or sustained.
- Focusing primarily on electronic technology may disadvantage communities where oral and in-person transmission is preferred or where Internet access is limited.
- MT evaluation data remains limited to Bible-domain parallel text; the system cannot yet produce practically useful translations across domains.

## Questions & Follow-ups

- How does the Mohawk language community's relationship to digital infrastructure and language documentation differ from Cherokee? (The Six Nations communities near Brantford/Tyendinaga may have different resources and preferences than the Cherokee Nation of Oklahoma or the Eastern Band.)
- What specific NLP tools have Mohawk community members identified as priorities? The Cherokee community's list (MT, ASR, OCR, POS tagger) is a starting point for comparison.
- Related work: Cadotte, André, and Sadat (2024) on low-resource Indigenous MT using literary texts (Innu-Aimun); Bird (2020, 2021) on decolonizing NLP and non-extractive language technology.
