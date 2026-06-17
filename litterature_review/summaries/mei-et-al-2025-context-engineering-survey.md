# A Survey of Context Engineering for Large Language Models

**Authors:** Lingrui Mei, Jiayu Yao, Yuyao Ge, et al.
**Year:** 2025
**Venue:** arXiv preprint (Institute of Computing Technology, Chinese Academy of Sciences; July 2025)

---

## Core Argument

"Context engineering" is proposed as a formal discipline that subsumes prompt engineering, RAG, memory systems, and multi-agent coordination under a unified framework focused on systematically optimizing what information is provided to an LLM at inference time. Reviewing over 1,400 papers, the survey establishes a taxonomy of context components and system implementations, and identifies a critical asymmetry: current LLMs are far more capable at understanding complex contexts than at generating correspondingly complex long-form outputs.

## Key Concepts

- **Context engineering:** The systematic design and optimization of the information payload provided to an LLM during inference — including prompts, retrieved documents, memory contents, tool outputs, and agent communications. Distinct from "prompt engineering" in that it encompasses architecturally complex systems, not just prompt text.
- **Foundational components:**
  - *Context Retrieval and Generation:* Prompt-based generation, external knowledge retrieval (RAG), dynamic context assembly
  - *Context Processing:* Long-context handling, self-refinement, multimodal context, structured/relational context
  - *Context Management:* Memory hierarchies, context compression, optimization under token limits
- **System implementations:**
  - *RAG variants:* Modular RAG, agentic RAG, graph-enhanced RAG (GraphRAG)
  - *Memory systems:* Persistent memory enabling multi-turn interactions
  - *Tool-integrated reasoning:* Function calling, environment interaction
  - *Multi-agent systems:* Agent coordination, orchestration, communication protocols
- **Understanding-generation asymmetry:** LLMs augmented with context engineering excel at comprehending complex, long inputs; they remain significantly weaker at generating similarly complex long-form outputs — a fundamental research gap.

## Main Findings

- The field has organically developed a set of overlapping techniques (RAG, prompting, memory, agents) that benefit from being understood as a unified discipline with a shared design space.
- Context compression (reducing the token footprint of retrieved content) is a critical bottleneck: as retrieval scales up, context windows fill; compression methods must balance information retention against token budget.
- GraphRAG outperforms flat RAG for relational and multi-hop queries; flat RAG is sufficient for factual single-hop queries (consistent with Han et al. 2026).
- Multi-agent systems amplify context engineering's power by allowing different agents to specialize in different context roles (retrieval, reasoning, synthesis).
- The understanding-generation gap is identified as the defining open challenge: models can read a 100K-token context but cannot write at comparable length or complexity.

## Relevance to Indigenous AI

Context engineering is the practical framework for building a Mohawk language support system without large-scale pretraining. The core insight is that a general LLM (e.g., Claude, GPT-4) can be made more useful for Mohawk by engineering what context it receives at inference time — retrieved Mohawk examples, grammatical rules, glossary entries, cultural context. This avoids the prohibitive cost of pretraining from scratch. The RAG component is most immediately relevant: if a Mohawk language corpus, dictionary, and grammar are indexed, RAG can bring relevant content into the LLM's context window for translation, Q&A, or language learning support. The context compression and memory components matter for multi-turn educational interactions (language learning sessions). The understanding-generation asymmetry is a specific warning: an LLM may correctly understand a Mohawk input but generate poor Mohawk output — evaluation must test generation quality separately from comprehension.

## Limitations & Critiques

- The survey covers 1,400+ papers but focuses almost entirely on high-resource settings; low-resource and endangered language contexts are not specifically addressed.
- "Context engineering" as a discipline is a framing proposal by the authors; it is not yet established terminology in the field, and the unification it proposes may paper over important distinctions.
- The survey is from July 2025 and describes a very rapidly evolving field; specific system recommendations may be outdated within months.

## Questions & Follow-ups

- Are there any context engineering case studies for low-resource or endangered languages? What does RAG look like when the knowledge base has only a few thousand documents?
- How should a Mohawk language knowledge base be structured for optimal RAG retrieval — as raw text, morphologically segmented text, or structured grammar entries?
- Related work: Han et al. (2026) for RAG vs. GraphRAG benchmarks; Peng et al. (2025) for GraphRAG survey; Dehal et al. (2025) for LLM-KG integration; Wang et al. (2024, 2025) and Yu et al. (2025) for advanced RAG architectures; Salemi and Zamani (2024) for RAG evaluation.
