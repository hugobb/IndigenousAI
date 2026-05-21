# TALES: A Taxonomy and Analysis of Cultural Representations in LLM-generated Stories

**Authors:** Kirti Bhagat, Shaily Bhatt, Athul Velagapudi, Aditya Vashistha, Shachi Dave, Danish Pruthi
**Year:** 2026
**Venue:** Proceedings of the 2026 CHI Conference on Human Factors in Computing Systems (CHI '26), Barcelona, Spain
**Link:** https://doi.org/10.1145/3772318.3790519

---

## Core Argument

Evaluating cultural competence in LLMs using static knowledge benchmarks is insufficient: a model can answer factual questions about a culture correctly while still producing stories riddled with misrepresentations of that culture. TALES develops a community-grounded taxonomy (TALES-Tax) of seven types of cultural misrepresentation in LLM-generated stories — validated through focus groups and surveys with Indian participants — and demonstrates through large-scale annotation (108 experts, 71 regions, 14 languages) that 88% of LLM-generated stories contain at least one misrepresentation, with errors worsening significantly for lower-resourced languages and lesser-known regions.

## Key Concepts

- **TALES-Tax:** The seven-category taxonomy of cultural misrepresentations: (1) Cultural Inaccuracy, (2) Unlikely Scenarios, (3) Clichés, (4) Oversimplification, (5) Factual Errors, (6) Linguistic Inaccuracy, (7) Logical Errors.
- **Culturally Specific Items (CSIs):** Lexical markers of cultural elements (food, clothing, geography, arts, kinship, social practices, etc.) used to measure both cultural richness of generated text and the proportion of those elements that are misrepresented.
- **No-representation vs. misrepresentation:** Two distinct failure modes — LLMs either generate culturally impoverished text (few CSIs, like LLaMA 3.3) or culturally dense but inaccurate text (many CSIs but high misrepresentation rate, like Aya 32B and Qwen 3).
- **Knowledge-generation gap:** Models answer 77% of cultural knowledge questions correctly in English but still misrepresent culture in 88% of generated stories — demonstrating that possessing cultural knowledge does not guarantee its faithful application in open-ended generation.
- **TALES-QA:** A 1,683-question bank derived from misrepresentation annotations, covering 13 Indic languages and English, released for future cultural knowledge evaluation.
- **Hofstede's cultural onion model:** Framework used to generate story prompts across four layers of culture: Symbols, Heroes, Rituals, and Values.

## Main Findings

- 88% of 540 LLM-generated stories contained misrepresentations, averaging 5.42 per story (one misrepresentation per 5 sentences).
- Misrepresentations increased 56% for mid-resource languages and quadrupled for low-resource languages compared to English; the gap was statistically significant.
- Stories set in peri-urban (tier-2/tier-3) regions had significantly more misrepresentations than those set in major cities, particularly for cultural inaccuracies and factual errors — likely because less training data is available about smaller localities.
- Gemini 2.5 Pro outperformed all models on relatability and had the lowest misrepresentation rate; open-source models (especially Aya 32B) performed worst.
- Social practices, food, and social norms were the most frequently misrepresented CSI categories across all error types.
- The knowledge-generation gap: accuracy on TALES-QA cultural questions was ~77% in English and ~60% in Indic languages, while story misrepresentation rates remained high — pointing to a failure of application, not just knowledge acquisition.

## Relevance to Indigenous AI

TALES provides a methodological template directly applicable to Indigenous AI work: community-centered taxonomy development (paralleling participatory methods needed for Mohawk and Six Nations communities), multilingual expert annotation rooted in lived experience, and the critical distinction between cultural knowledge retrieval and cultural representation in generative contexts. The finding that misrepresentations worsen for lower-resourced languages and less-known localities maps directly onto the situation of Indigenous languages and communities. The "no-representation vs. misrepresentation" framing is especially pertinent: an LLM generating Mohawk cultural content may either produce generic text devoid of specific cultural elements, or produce culturally marked but inaccurate text — both are harmful for language revitalization purposes.

## Limitations & Critiques

- Focus groups and individual surveys were conducted only in English on GPT-4-generated stories; categories may not fully capture misrepresentations in Indic-language generations or those produced by other models.
- The study is geographically bounded to India; while the taxonomy claims broader applicability, its categories reflect Indian cultural contexts and may need adaptation for other communities.
- Community recruitment came through a single academic institution; annotators' perspectives may not fully represent all 71 regions despite geographic diversity.
- The paper does not address how to mitigate the identified misrepresentations — it is diagnostic, not prescriptive.

## Questions & Follow-ups

- How would the TALES-Tax categories need to be adapted for a polysynthetic language like Mohawk, where linguistic inaccuracies (wrong morphology, wrong kinship terms) might be the dominant failure mode?
- What would a participatory process for developing a "Mohawk TALES-Tax" look like, involving Six Nations knowledge holders from the outset rather than as annotators of pre-generated stories?
- Related work to explore: Qadri et al. (2025) "The Case for 'Thick Evaluations' of Cultural Representation in AI"; Seth et al. (2024) "DOSA: A Dataset of Social Artifacts from Different Indian Geographical Subcultures" (participatory data curation approach).
