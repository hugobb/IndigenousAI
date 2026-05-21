# Survey of Cultural Awareness in Language Models: Text and Beyond

**Citation:** Pawar, S., Park, J., et al. (2025). Survey of Cultural Awareness in Language Models: Text and Beyond. *Computational Linguistics*, Vol. 51, No. 3.

---

## Core Argument

Cultural awareness in LLMs is systematically underdeveloped and geographically skewed. The survey argues that current research overwhelmingly covers WEIRD (Western, Educated, Industrialized, Rich, Democratic) cultures and high-resource languages, leaving most of the world's cultures — including Indigenous, African, and Central Asian communities — without meaningful representation. The paper calls for a shift toward participatory, community-co-constructed approaches to cultural dataset creation and evaluation, particularly for low-resource languages and underrepresented communities.

---

## Key Concepts

- **Cultural awareness:** The capacity of a language model to understand, represent, and respond appropriately to the norms, values, practices, and knowledge systems of a specific cultural community — not just surface linguistic patterns.
- **WEIRD bias:** The overwhelming dominance of Western, Educated, Industrialized, Rich, Democratic perspectives in AI training data, benchmarks, and evaluation frameworks.
- **Cultural alignment methods:** Grouped into training-based (pretraining on culturally specific corpora, fine-tuning, instruction-tuning) and training-free (prompting strategies, retrieval augmentation, cultural persona injection).
- **Eight benchmark domains:** Academic knowledge, commonsense reasoning, social values, social norms, bias and stereotypes, toxicity and safety, emotion and sentiment, and linguistics.
- **Multimodal cultural evaluation:** Extension of cultural evaluation beyond text to vision-language models (VQA, image captioning, text-to-image generation) and audio/video modalities.
- **Dataset creation methods:** Automatic (web scraping, translation pipelines), semi-automatic (LLM-assisted curation with human review), and manual (expert annotation, community contribution).
- **Sapir-Whorf hypothesis:** The idea that language shapes thought and worldview, underpinning why cross-cultural AI cannot simply translate between languages without cultural loss.
- **High-context vs. low-context communication (Hall 1976):** High-context cultures (many Asian, Middle Eastern, Indigenous) embed meaning in context, relationships, and non-verbal cues; low-context cultures (many Western) favor explicit verbal communication. Most LLM training data is low-context.

---

## Main Findings

- Over 300 papers reviewed; the majority focus on English, Chinese, and a small set of European languages.
- Africa, Central Asia, South/Southeast Asia, and Indigenous cultures worldwide are severely underrepresented in both training data and evaluation benchmarks.
- Training-based alignment methods (fine-tuning, instruction-tuning on culturally specific data) show stronger and more robust cultural adaptation than prompting-based approaches, but require substantial curated data.
- Prompting strategies (cultural persona, chain-of-thought with cultural context) yield modest improvements and are accessible without retraining, making them the primary tool for low-resource communities currently.
- Vision-language models exhibit compounded cultural biases: visual training data is even more geographically skewed than text, and cultural visual symbols are frequently misidentified or absent.
- The social norms and social values domains show the largest performance gaps between high-resource and low-resource language communities.
- Participatory and community-co-constructed datasets consistently produce higher-quality, more nuanced cultural benchmarks than automated or purely academic approaches.
- Current evaluation metrics (accuracy on MCQs, BLEU for translation) are insufficient for capturing the depth and dynamism of cultural knowledge.

---

## Relevance to Indigenous AI

This survey is directly foundational for the Indigenous AI project:

1. **Gap documentation:** Explicitly names Indigenous cultures as among the most underrepresented in AI research — providing citation support for the project's rationale.
2. **Participatory frameworks:** The survey's strongest recommendation aligns with Indigenous AI methodology — community co-construction of datasets and evaluation criteria, rather than top-down academic benchmark design.
3. **Training-based vs. prompting tradeoffs:** For Mohawk language revitalization, the finding that training-based alignment outperforms prompting is actionable but must be weighed against data scarcity; the survey's coverage of low-resource adaptation strategies is directly relevant.
4. **Multimodal considerations:** Indigenous cultural knowledge is often embedded in visual, auditory, and ceremonial practices — the survey's coverage of multimodal cultural evaluation opens pathways beyond text-only NLP.
5. **High-context communication:** Indigenous languages and cultures tend to be extremely high-context; the Sapir-Whorf and high/low-context frameworks validate why translation-centric approaches are inadequate for meaningful Indigenous AI.
6. **Benchmark domain mapping:** The eight benchmark domains can guide what evaluation dimensions matter most for Mohawk — social norms, social values, and linguistics are likely highest priority.

---

## Limitations & Critiques

- The survey is comprehensive in breadth but shallow in depth for any specific underrepresented culture; Indigenous cultures receive a few paragraphs rather than dedicated analysis.
- "Participatory" is used as a recommendation but is not operationalized — the survey does not describe specific methodologies, consent frameworks, or power-sharing structures for community co-construction.
- The paper's framing of "cultural awareness" risks treating culture as a fixed, extractable property rather than a living, dynamic, contested process (contrast with Qadri et al. 2025's thick evaluations critique).
- Coverage of African and Indigenous language NLP relies heavily on secondary sources and may undercount work published in non-English venues or as grey literature.
- The survey period and search strategy are not fully detailed, raising questions about reproducibility of the literature search.

---

## Questions & Follow-ups

- Which specific low-resource language adaptation techniques have been tested on polysynthetic or agglutinative languages comparable to Mohawk (e.g., Quechua, Inuktitut, Finnish)?
- How do the authors define the boundary between "cultural awareness" and linguistic competence? Is phonological or morphological accuracy cultural?
- What participatory AI frameworks exist specifically for Indigenous language communities — are there case studies beyond the Māori or First Nations examples sometimes cited?
- The survey notes that instruction-tuning on culturally specific data helps but requires data — what is the minimum viable dataset size based on reviewed literature?
- How does the survey's "cultural alignment" framing interact with Indigenous data sovereignty principles (CARE principles, OCAP framework)?
