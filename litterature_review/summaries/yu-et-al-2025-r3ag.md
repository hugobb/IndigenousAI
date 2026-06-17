# R3AG 2025: The Second Workshop on Refined and Reliable Retrieval-Augmented Generation

**Authors:** Haitao Yu, Yubo Fang, Xuri Ge, Xin Xin, Zihan Wang, Junchen Fu, Joemon M. Jose, Weizhi Ma, Zhaochun Ren
**Year:** 2025
**Venue:** SIGIR-AP 2025 (University of Tsukuba, Shandong University, University of Glasgow, University of Amsterdam, Leiden University, Tsinghua University)

---

## Core Argument

This is the workshop overview paper (4 pages) for the second R³AG workshop at SIGIR-AP 2025. Building on the first workshop (Wang et al., 2024), R³AG 2025 expands the research agenda by adding **reinforcement learning for RAG** as a new topic alongside the original four themes (user intent, knowledge parsing, reliable retrieval, response evaluation). The addition reflects the emergence of RL-based reasoning models (OpenAI o1, DeepSeek-R1) and their nascent integration with RAG pipelines.

## Key Concepts

- **RL for RAG (new in 2025):** Inspired by o1/DeepSeek-R1's success with RL-based reasoning, recent work has begun training *policy models* to search for relevant information using RL rather than supervised fine-tuning. The workshop cites this as an open and challenging problem.
- **Continued agenda:** User intent comprehension (query expansion, rewrite, summarization), knowledge parsing (tables, figures, complex documents), reliable retrieval (robustness to noisy/counterfactual inputs), and response evaluation/refinement remain the core themes.
- **Hallucination and outdated knowledge:** These are framed as the two inherent LLM limitations that RAG addresses; the workshop seeks deeper investigation of both.
- **RL-based retrieval policy:** Training models to actively search and retrieve (rather than passively augmenting a single retrieval call) is positioned as the next frontier — CoRAG (Wang et al., 2025) and Search-R1 are cited as examples of this direction.
- **Multimodal RAG:** Continues as a topic from the first workshop; multimodal LLMs have advanced substantially and their RAG needs are even greater than unimodal models.

## Main Findings

This is a workshop overview paper; no empirical findings are reported. The paper describes the R³AG 2025 research agenda, notes that RAG has been widely applied since the first workshop, and observes that new challenges have emerged — particularly the RL-for-RAG direction. The "irrelevant documents +30% accuracy" counterintuitive finding from the first workshop is cited again as motivating continued robustness research.

## Relevance to Indigenous AI

The second R³AG workshop is less directly relevant to IndigenousAI than the first, but the addition of RL for RAG is noteworthy as a methodological direction. For a Mohawk knowledge retrieval system, RL-based retrieval policy training is likely out of scope given resource constraints — but understanding the direction helps contextualize where the RAG field is heading. The robustness theme (reliable retrieval against noise) is relevant because a Mohawk knowledge base will likely contain inconsistent, partially translated, or domain-specific text that introduces noise into retrieval.

## Limitations & Critiques

- Workshop overview paper (4 pages); no empirical content.
- The RL-for-RAG direction is nascent and not yet validated across diverse settings; its practical implications for low-resource NLP are unclear.
- Low-resource and indigenous language RAG remain outside the explicit scope of either R³AG workshop.

## Questions & Follow-ups

- Which accepted R³AG 2025 papers address robustness of RAG under low-resource or noisy-corpus conditions?
- Does the RL-for-RAG approach (training a retrieval policy) offer any practical path for a low-resource Mohawk RAG system, or is it only viable with large training corpora?
- Related work: Wang et al. (2024) R³AG first workshop (predecessor); Wang et al. (2025) CoRAG (RL/iterative retrieval direction this workshop references); Han et al. (2026) on RAG vs. GraphRAG; Salemi and Zamani (2024) on eRAG evaluation.
