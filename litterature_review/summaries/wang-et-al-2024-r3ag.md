# R3AG: First Workshop on Refined and Reliable Retrieval-Augmented Generation

**Authors:** Zihan Wang, Xuri Ge, Joemon M. Jose, Haitao Yu, Weizhi Ma, Zhaochun Ren, Xin Xin
**Year:** 2024
**Venue:** SIGIR-AP 2024 (University of Amsterdam, University of Glasgow, University of Tsukuba, Tsinghua University, Leiden University, Shandong University)

---

## Core Argument

This is a workshop overview paper (4 pages) describing the first R³AG workshop at SIGIR-AP 2024. It argues that while RAG has become central to LLM-based applications, fundamental challenges in achieving *refined and reliable* RAG remain underexplored — specifically: user intent comprehension, parsing complex documents, reliable knowledge retrieval, response evaluation and refinement, and multimodal RAG. The workshop aims to catalyze research on these problems.

## Key Concepts

- **R³AG (Refined and Reliable RAG):** A framing that identifies multiple axes on which current RAG systems fail: imprecise query understanding, inability to parse complex documents (tables, figures), noisy or contradictory retrieval, and unrefined response quality (hallucination, faithfulness failures).
- **Query comprehension challenges:** Long/multi-turn dialogue context makes it hard to understand user intent; query expansion, summarization, and rewriting are important sub-problems.
- **Knowledge encoding misalignment:** Pre-trained encoders compress both queries and documents into fixed-size vectors; this architectural constraint limits the ability to handle complex, multi-faceted queries.
- **Complex document parsing:** Tables, figures, and non-text structures in documents are not handled by standard RAG retrieval pipelines.
- **Noisy retrieval finding:** Counterintuitively, including irrelevant documents can sometimes *increase* downstream accuracy by more than 30% — this challenges the simple assumption that retrieval quality directly determines generation quality.
- **Multimodal RAG:** The workshop explicitly calls for research on RAG for multimodal LLMs (images, structured data), not just text.

## Main Findings

This is a workshop overview, not an empirical paper. The paper describes the R³AG research agenda rather than reporting experimental findings. Key positions articulated:
- A complete RAG pipeline involves at least four stages (intent comprehension, knowledge parsing, knowledge retrieval, response generation), each with distinct failure modes.
- The correlation between retrieval quality and generation quality is not as simple as assumed — irrelevant documents can sometimes help, suggesting the LLM-RAG interface is complex.
- Reliable RAG requires specialised evaluation dimensions: relevance, faithfulness, negative rejection, information integration, creative generation, and error correction.

## Relevance to Indigenous AI

The R³AG workshop framework is useful context for the IndigenousAI project's RAG system design. The "noisy retrieval can help" finding is particularly relevant: in a Mohawk knowledge retrieval setting, there may be very few retrieved documents that are precisely relevant, and the retrieval quality will be inherently limited. The R³AG agenda's emphasis on reliability and faithfulness aligns with the project's need for accurate, community-verifiable outputs. The workshop also explicitly identifies the evaluation gap (response quality is multi-dimensional, not a single metric) — important for designing an evaluation methodology for Mohawk language generation.

## Limitations & Critiques

- This is a workshop call-for-papers/overview, not an empirical paper; it positions research questions rather than answering them.
- The workshop focuses on English and multilingual mainstream NLP; low-resource and indigenous language RAG are not explicitly addressed.
- The "irrelevant documents can increase accuracy" finding is cited from prior work without being a contribution of this paper itself.

## Questions & Follow-ups

- Which accepted papers at R³AG 2024 (SIGIR-AP) are most relevant to low-resource RAG for indigenous language applications?
- Does the noisy retrieval finding (irrelevant documents +30% accuracy) replicate in low-resource language settings, or is it specific to English QA benchmarks?
- Related work: Yu et al. (2025) R³AG second workshop (direct successor); Han et al. (2026) on RAG vs. GraphRAG benchmarks; Salemi and Zamani (2024) on eRAG evaluation; Mei et al. (2025) on context engineering survey; Peng et al. (2025) on GraphRAG survey.
