# Graph Retrieval-Augmented Generation: A Survey

**Authors:** Boci Peng, Yun Zhu, Yongchao Liu, Xiaohe Bo, Haizhou Shi, Chuntao Hong, Yan Zhang, Siliang Tang
**Year:** 2025
**Venue:** ACM Transactions on Information Systems, Vol. 44, No. 2 (December 2025)

---

## Core Argument

Flat RAG — retrieving text chunks via embedding similarity — fails for tasks requiring relational reasoning across multiple entities, because it cannot model the structured relationships between entities that span documents. GraphRAG addresses this by constructing a graph (typically a knowledge graph) over the corpus, enabling graph-guided retrieval that captures multi-hop relational knowledge. This first comprehensive GraphRAG survey formalizes the workflow, categorizes methodologies, and maps the field's open questions.

## Key Concepts

- **GraphRAG workflow:** Three stages: (1) **G-Indexing** — decompose raw text into a graph (entities as nodes, relations as edges), typically via information extraction; (2) **G-Retrieval** — given a query, use graph search algorithms to retrieve relevant subgraphs, paths, or node neighborhoods; (3) **G-Generation** — convert retrieved graph structure into text the LLM can use for generation.
- **Advantages over flat RAG:** (1) explicit relational structure enables multi-hop reasoning without losing connections between entities; (2) graph summarization reduces verbosity versus concatenated text chunks; (3) global graph-level information enables query-focused summarization that flat RAG cannot do.
- **Knowledge graph (KG):** The most common graph substrate for GraphRAG; entities and their typed relations are extracted from text and stored as triples (subject, predicate, object). KG construction is itself a major bottleneck.
- **G-Retrieval methods:** Node retrieval, triple/path retrieval, subgraph retrieval, graph community retrieval; each captures a different scope of relational context.
- **G-Generation:** Retrieved graph elements must be serialized into text or structured prompts the LLM can process; this conversion step introduces information loss and is an active research area.
- **Applications:** Question answering, dialogue systems, knowledge base completion, recommendation, drug discovery, legal reasoning.

## Main Findings

- GraphRAG consistently outperforms flat RAG for multi-hop relational queries; flat RAG remains competitive for single-hop factual queries (aligning with Han et al. 2026).
- G-Indexing quality is the binding constraint on GraphRAG performance: if the KG is incomplete or contains extraction errors, downstream retrieval and generation degrade significantly.
- Graph neural networks (GNNs) improve G-Retrieval by learning entity representations that reflect graph structure, not just text similarity.
- The "lost in the middle" problem of long RAG contexts is partially mitigated by GraphRAG's graph summarization — shorter, denser graph representations carry more relational information per token.
- Industrial GraphRAG deployments exist at major tech companies (Microsoft's GraphRAG implementation being the most prominent); academic systems are beginning to transfer to production.

## Relevance to Indigenous AI

GraphRAG is the most promising retrieval architecture for the specific use case of Mohawk cultural knowledge QA. A Mohawk cultural knowledge graph — encoding entities (clans, ceremonies, historical figures, place names, seasonal practices) and their relationships — would enable queries like "What clans are connected to the Longhouse ceremony?" that flat RAG would fail at. G-Indexing for Mohawk would require careful, community-overseen information extraction to ensure cultural protocols govern what relations are represented and who can access them. The data sovereignty dimension is critical: a GraphRAG system built on a community-controlled KG respects community governance in a way that opaque vector embeddings do not — the KG makes the stored knowledge explicit and auditable. G-Retrieval quality for Mohawk depends on having a sufficiently rich and accurate KG; this is a prerequisite to building a GraphRAG system.

## Limitations & Critiques

- The survey covers high-resource English-centric applications; no GraphRAG systems for low-resource or Indigenous language contexts are described.
- KG construction for Mohawk requires significant linguistic and cultural expertise; the information extraction methods described assume English-language corpora with relatively standard entity types.
- G-Generation (converting graph elements into LLM prompts) assumes the LLM can read and generate in the target language — for Mohawk, this assumption fails with current models.
- The survey is from December 2025; the field is moving rapidly and some specific method recommendations may already be superseded.

## Questions & Follow-ups

- What minimum KG size and density is required for GraphRAG to outperform flat RAG meaningfully? What would this mean in terms of Mohawk cultural knowledge entries?
- How can cultural protocols (e.g., who may access ceremonial knowledge) be encoded in a KG used for GraphRAG, so that the retrieval system respects those protocols?
- Related work: Han et al. (2026) for empirical RAG vs. GraphRAG benchmarks; Dehal et al. (2025) for LLM-KG integration; Mei et al. (2025) for context engineering survey; Wang et al. (2024, 2025) for advanced RAG architectures.
