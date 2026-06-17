# LLMs and Knowledge Graphs: A Systematic Review of Bidirectional Integration

**Authors:** Dehal et al.
**Year:** 2025
**Venue:** Systematic review (Cape Breton University)

---

## Core Argument

Large language models and knowledge graphs (KGs) are not competing paradigms but deeply complementary ones. LLMs can automate KG construction from text, while KGs can ground and constrain LLM outputs — reducing hallucination, improving factual consistency, and enabling structured reasoning. A systematic review of 77 papers in this space reveals three integration directions and three dominant methodology types, with the bidirectional relationship being the most powerful and underexplored configuration.

## Key Concepts

- **KG-enhanced LLMs:** Knowledge graphs provide structured, verifiable facts that LLMs can retrieve and reason over, reducing hallucination and improving factual accuracy. This is the grounding direction.
- **LLM-enhanced KGs:** LLMs can automatically extract entities and relations from unstructured text to populate or extend KGs, dramatically reducing the manual effort required for KG construction.
- **Bidirectional integration:** The most sophisticated configuration — LLMs and KGs iteratively improve each other; LLMs build the graph, graphs constrain LLM generation, and the loop continues.
- **Three methodology types:** Symbolic (rule-based, high precision, limited coverage), machine learning (data-hungry, generalizable), and hybrid (combine both for robustness in low-resource domains).
- **Knowledge-grounded generation:** Retrieving from a structured KG before generating text ensures outputs can be traced to verifiable knowledge sources — critical for high-stakes applications.

## Main Findings

- Across 77 reviewed papers, the dominant pattern is unidirectional: most work either uses KGs to augment LLMs or uses LLMs to build KGs, but not both.
- Bidirectional pipelines that use LLMs to construct and extend KGs while using those KGs to constrain LLM generation are rarer but show the strongest performance on factual reasoning tasks.
- Hybrid methodologies (symbolic + ML) outperform pure approaches in low-resource settings, where neither pure statistical learning nor pure rule-following alone is sufficient.
- KG-based retrieval reduces LLM hallucination rates significantly on multi-hop factual queries compared to unstructured retrieval (plain RAG).
- Open challenges include aligning entity representations across the KG and LLM, handling temporal knowledge updates, and scaling KG construction to low-resource languages.

## Relevance to Indigenous AI

For the IndigenousAI project, LLM-KG integration has two direct applications. First, a KG built from Mohawk linguistic knowledge (grammar rules, lexical entries, semantic relationships, cultural concepts) could ground a Mohawk-supporting language model and prevent culturally inappropriate outputs. Second, LLMs could assist in partially automating KG construction from existing Mohawk linguistic resources (dictionaries, grammars, annotated texts) — reducing the expert labor burden. The hybrid methodology finding is particularly relevant: for Mohawk, where both data and rule resources exist in limited quantities, neither pure ML nor pure rule-based approaches alone will suffice. The data sovereignty constraint means the KG would need to be community-owned, which aligns with KG architectures better than opaque LLM weights.

## Limitations & Critiques

- The 77-paper corpus focuses overwhelmingly on English and major languages; few papers address low-resource or morphologically complex languages.
- "Systematic review" methodology is not always rigorous — inclusion criteria, search strategy, and quality assessment are not always clearly described.
- The bidirectional integration approach, while promising, is the least documented and hardest to implement; the paper may overstate how ready it is for low-resource deployments.

## Questions & Follow-ups

- Are there examples of KG-LLM integration for any polysynthetic or morphologically complex language?
- How should a Mohawk KG be structured — as a lexical-semantic network, an ontology, or a cultural knowledge graph?
- Related work: Han et al. (2026) on RAG vs GraphRAG; Peng et al. (2025) on GraphRAG survey; Wang et al. (2024) on R3AG.
