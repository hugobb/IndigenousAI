# IR-RAG @SIGIR25: The Second Edition of the Workshop on Information Retrieval's Role in RAG Systems

**Authors:** Negar Arabzadeh, Ziheng Chen, Fabio Petroni, Federico Siciliano, Fabrizio Silvestri, Giovanni Trappolini
**Year:** 2025
**Venue:** SIGIR 2025 — 48th International ACM SIGIR Conference, Workshop Description, pages 4168–4171

---

## Core Argument

This is a workshop description paper, not a research article. The workshop argues that in RAG (Retrieval-Augmented Generation) systems, the retrieval component has been systematically underemphasized relative to the generative component, and that advancing retrieval mechanisms is essential for improving RAG system quality, reliability, and fairness.

## Key Concepts

- **RAG (Retrieval-Augmented Generation):** Systems that combine a retrieval mechanism (fetching relevant documents from a knowledge base) with a generative language model to produce context-grounded outputs.
- **Lost-in-the-middle effect:** The empirical finding that LLM performance degrades when critical information appears in the middle of a retrieved context window, motivating better retrieval ordering and chunking strategies.
- **Cross-lingual retrieval:** Retrieval across documents and queries in different languages; flagged as an underexplored research direction in multilingual RAG.
- **Bias mitigation in retrieval:** Identifying and reducing bias in document ranking and retrieval processes to prevent downstream generation of misleading content.

## Main Findings

- The workshop identifies key open research directions: improving query representation, incorporating contextual information in retrieval, efficient database updating, reducing computational load, cross-lingual retrieval, multimodal retrieval, and bias mitigation.
- The inaugural SIGIR 2024 edition drew 80–100 concurrent participants, the highest attendance of any SIGIR 2024 workshop, indicating strong community interest.
- Cross-lingual retrieval for generative models is explicitly identified as a gap topic — current RAG systems predominantly assume monolingual (English) retrieval.

## Relevance to Indigenous AI

The IndigenousAI project's likely application of RAG — retrieving relevant Mohawk language documents or cultural knowledge to ground LLM outputs — is directly relevant to the retrieval research agenda this workshop promotes. Cross-lingual retrieval (English query → Mohawk documents, or Mohawk query → English documents) is flagged as an underexplored area; this is precisely the retrieval scenario for a Mohawk-English bilingual knowledge base. Bias mitigation in retrieval is also relevant: retrieval systems trained on majority-language data may rank culturally irrelevant or culturally distorting documents more highly for Indigenous language queries.

## Limitations & Critiques

- This is a workshop call-for-papers, not an empirical study; no original findings are reported.
- Indigenous or low-resource language contexts are not specifically addressed in the workshop scope beyond a brief mention of cross-lingual retrieval.

## Questions & Follow-ups

- What retrieval architectures are best suited for low-resource, bilingual (Mohawk/English) knowledge bases where document density is asymmetric?
- How does the "lost in the middle" effect interact with retrieval over long Mohawk texts with complex morphology — does morphological fragmentation in tokenization compound the positional degradation problem?
- Related work: Salemi & Zamani (2024) (RAG evaluation survey), Han et al. (2026) (RAG vs. GraphRAG comparison), Wang et al. (2024, 2025) (chain-of-retrieval and R3AG).
