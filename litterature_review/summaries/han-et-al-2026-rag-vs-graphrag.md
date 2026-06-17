# RAG vs. GraphRAG: A Systematic Benchmark

**Authors:** Han et al.
**Year:** 2026
**Venue:** Preprint / conference proceedings (AI / NLP)

---

## Core Argument

RAG (Retrieval-Augmented Generation) and GraphRAG (graph-based retrieval) are not interchangeable — they have complementary strengths that depend on query type. RAG outperforms GraphRAG on single-hop factual questions; GraphRAG outperforms RAG on multi-hop reasoning that requires connecting multiple entities or facts. Hybrid strategies that combine both approaches outperform either alone. A secondary finding is that LLM-as-Judge evaluation frameworks exhibit position bias, which must be controlled for in any benchmark comparing these systems.

## Key Concepts

- **RAG (Retrieval-Augmented Generation):** Retrieve relevant text chunks from a dense vector store (embedding-based similarity search), then generate a response conditioned on those chunks. Best for single-hop queries where the answer is contained in a single passage.
- **GraphRAG:** Retrieve from a structured knowledge graph (KG) where entities and relations are nodes and edges; multi-hop queries traverse the graph to connect entities. Best for queries requiring relational reasoning across multiple facts.
- **Single-hop vs. multi-hop queries:** Single-hop: "What is X?" — answered by one passage. Multi-hop: "What is the relationship between X and Y, and how does that affect Z?" — requires chaining across multiple knowledge sources.
- **Hybrid RAG+GraphRAG:** Combines dense vector retrieval with graph-based retrieval; uses the KG for structural multi-hop reasoning while using dense retrieval for unstructured factual lookup. Outperforms either method alone.
- **Position bias in LLM-as-Judge:** When an LLM evaluates two system outputs side by side, it tends to prefer whichever appears first (or last), independent of actual quality. Any benchmark using LLM-as-Judge must randomize and counterbalance positions.

## Main Findings

- On single-hop factual QA benchmarks, RAG consistently outperforms GraphRAG; the structured graph adds overhead without benefit when the answer can be retrieved from a single chunk.
- On multi-hop reasoning benchmarks, GraphRAG consistently outperforms RAG; the graph's explicit relational structure enables the system to chain inferences that dense retrieval cannot.
- Hybrid approaches combining both methods outperform either alone on both benchmark types, though at higher system complexity and latency.
- Position bias in LLM-as-Judge evaluations is real and substantial; benchmarks that do not control for it systematically overstate the advantage of whichever system is evaluated first.
- The choice between RAG and GraphRAG should be driven by the query distribution of the target application, not by a blanket claim that one is "better."

## Relevance to Indigenous AI

For the IndigenousAI project, the RAG vs. GraphRAG decision depends on what kind of questions the system will need to answer. For Mohawk language learning (single-hop: "What does X mean?", "How do you say Y?"), RAG over a lexical and grammatical corpus may suffice. For cultural knowledge queries that require connecting concepts across multiple knowledge domains ("How are the clan system, longhouse ceremonies, and seasonal practices related?"), GraphRAG over a Mohawk cultural knowledge graph would be more appropriate. The hybrid finding suggests that a production system should probably combine both. This paper directly informs the architecture decision for any Mohawk knowledge retrieval system, and the KG construction challenge connects directly to Dehal et al. (2025) on LLM-KG integration. The position bias finding is a methodological caution for the project's own evaluation design.

## Limitations & Critiques

- The benchmark languages and knowledge bases are almost certainly dominated by English and high-resource content; performance for low-resource languages with sparse KGs is not studied.
- Building a GraphRAG system requires a pre-existing knowledge graph; for Mohawk, no such graph exists and constructing one is itself a major research contribution.
- The hybrid approach's superior performance comes at higher system complexity; in a community deployment with limited technical maintenance capacity, simpler RAG may be more sustainable.

## Questions & Follow-ups

- What does it take to build a Mohawk cultural and linguistic knowledge graph? Which existing resources (dictionaries, grammars, cultural archives) could seed it?
- Are there examples of GraphRAG for any Indigenous language or low-resource KG construction?
- Related work: Dehal et al. (2025) on LLM-KG integration; Peng et al. (2025) on GraphRAG survey; Wang et al. (2024) and Wang et al. (2025) on chain-of-retrieval and R3AG; Salemi and Zamani (2024) on RAG evaluation.
