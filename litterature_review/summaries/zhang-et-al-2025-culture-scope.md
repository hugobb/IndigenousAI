# CultureScope: A Dimensional Lens for Probing Cultural Understanding in LLMs

**Authors:** Jinghao Zhang, Sihang Jiang, Shiwei Guo, Shisong Chen, Yanghua Xiao, Hongwei Feng, Jiaqing Liang, Minggui HE, Shimin Tao, Hongxia Ma
**Year:** 2025
**Venue:** arXiv preprint (arXiv:2509.16188v1); submitted September 2025

---

## Core Argument

Existing cultural evaluation benchmarks for LLMs lack both theoretical grounding and scalability: they rely on ad-hoc dimension lists and expensive manual annotation, making them hard to adapt across cultures. CultureScope proposes a hierarchical 140-dimension schema for cultural knowledge — grounded in the cultural iceberg theory, Hofstede's dimensions, and social memory theory — and uses it to automatically extract culture-specific knowledge instances and generate evaluation questions at scale. Applied to Chinese and Spanish cultures, it reveals that multilingual data training does not equate to multicultural understanding, and that deeper reasoning does not reliably compensate for missing cultural knowledge.

## Key Concepts

- **Cultural iceberg theory:** The model (from Hall 1976) dividing cultural knowledge into visible institutional norms (geography, laws, dates), behavioral patterns (habits, etiquette), and invisible core values and social structures (family dynamics, gender roles, beliefs) — used to structure CultureScope's three-layer hierarchy.
- **140-dimension schema:** A four-level classification (Layer → Category → Topic Aspect → Fine-grained Dimension) covering 3 cultural layers, 5 categories, 18 topic aspects, and 140 dimensions; dimensions are converted into Google search keywords for automated knowledge retrieval.
- **Four question types:** Factual (recall of cultural facts), Conceptual (understanding underlying meaning), Misleading (identifying stereotypes/biases), and Multi-hop (synthesizing multiple cultural elements) — probing different depths of cultural competence.
- **Language ≠ Culture (Observation 4):** PolyLM, a model with additional multilingual pretraining, performs significantly worse than same-sized Qwen models on both Spanish and Chinese cultural tasks, demonstrating that more tokens in a language does not yield more cultural knowledge.
- **RAG-based question generation:** Using fine-grained dimension keywords to retrieve culturally relevant web content, then generating questions via Retrieval-Augmented Generation with GPT-4o, validated by human experts (97–100% quality).

## Main Findings

- Cultural understanding is language-dependent: models perform better on Chinese culture when queried in Chinese, but show accuracy decline for Spanish culture when queried in Spanish — reflecting differential representation in training corpora.
- All models show performance gaps across cultural dimensions; models are generally weakest on "Misleading" questions (identifying cultural bias/stereotypes), especially for Spanish culture.
- Deep reasoning (DeepSeek-R1, Qwen3) yields improvements for Chinese culture but not for Spanish culture, suggesting reasoning helps only when sufficient cultural knowledge already exists in the model's training data.
- Injecting external cultural knowledge via prompt raises accuracy — but only when multiple relevant pieces are provided; a single injected fragment can actually degrade performance below the model's baseline.
- Larger models (within the same series) consistently outperform smaller ones, but size alone does not guarantee cultural discernment.

## Relevance to Indigenous AI

CultureScope's dimensional schema and automated knowledge extraction pipeline offer a scalable methodology for building Indigenous language cultural evaluation datasets — provided community partners help define dimensions and validate retrieved content. The three-layer iceberg structure (institutional norms → behavioral patterns → core values) maps well onto what matters most for Indigenous revitalization: the deepest layer (values, kinship structures, spiritual beliefs) is exactly what generative AI most consistently fails to represent. The "Language ≠ Culture" finding is a direct warning for projects that might equate increased Mohawk text in training with better cultural alignment. The quality-control approach — automated LLM verification plus human expert spot-checks — provides a practical template for community-validated evaluation at scale.

## Limitations & Critiques

- The benchmark covers only Chinese and Spanish cultures; both are high-resource contexts with abundant web content. The automated retrieval-and-generation pipeline may not scale to languages/cultures with sparse internet presence (e.g., Mohawk).
- Cultural knowledge is retrieved primarily from public web sources (Google Search, Wikipedia, official government sites), which may themselves carry external or colonial framings of the culture in question.
- The schema was designed by academic experts in cultural studies, not in co-creation with members of the evaluated communities; this risks encoding outsider views of what constitutes important cultural knowledge.
- Evaluation is automated (LLM-as-judge for subjective questions), introducing potential self-reference bias when models evaluate their own cultural outputs.

## Questions & Follow-ups

- Can the 140-dimension schema be adapted for an Indigenous knowledge context, where categories like "core values" might need to include concepts such as the Haudenosaunee Great Law, clan responsibilities, or the Mohawk relationship to the land — concepts largely absent from existing web sources?
- How would the "misleading question" type (detecting cultural bias) work for a community that has been systematically misrepresented in colonial archives? Who validates what counts as a stereotype versus a legitimate external perspective?
- Related work: DIVANBENCH (Sakhaeirad et al., 2026 — in this reading list) explores the same factual-vs-schema gap for Persian; WorldValuesBench (Zhao et al., 2024) covers moral/values reasoning across cultures.
