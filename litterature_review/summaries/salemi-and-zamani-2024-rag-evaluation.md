# Evaluating Retrieval Quality in Retrieval-Augmented Generation

**Authors:** Alireza Salemi, Hamed Zamani
**Year:** 2024
**Venue:** SIGIR 2024 (University of Massachusetts Amherst)

---

## Core Argument

Standard methods for evaluating retrieval quality in RAG systems — human relevance judgments and end-to-end generation metrics — are either expensive, poorly correlated with actual RAG performance, or computationally prohibitive. The proposed eRAG method evaluates each retrieved document individually by running the LLM on it alone and using the resulting output quality as the document's relevance label. This achieves substantially higher correlation with downstream RAG performance at up to 50× less GPU memory than end-to-end evaluation.

## Key Concepts

- **eRAG (individual document evaluation):** For each document in the retrieved list, the LLM is run independently on that document + query, and the output is evaluated against the ground-truth answer. The resulting per-document score is used as its relevance label. This makes retrieval evaluation LLM-aware — a document is "relevant" if the LLM can use it to answer the query, not if it contains the query terms or matches human relevance judgments.
- **End-to-end evaluation problem:** Running the LLM on all k retrieved documents concatenated costs O(lk²d²) in computation; eRAG costs O(lkd²) — linear vs. quadratic in k. For k=50 documents, this is a 50× difference.
- **Human annotation misalignment:** Documents judged relevant by humans (provenance labels in KILT) show only minor correlation with downstream RAG performance — human judgments of relevance do not align with what actually helps the LLM.
- **Set-based and ranking metrics:** Once per-document relevance labels are obtained via eRAG, standard IR metrics (Precision, Recall, MAP, MRR, NDCG, Hit Rate) can be applied to aggregate them into a retrieval quality score.
- **Benchmarks:** Evaluated on Natural Questions, TriviaQA, HotpotQA (QA), FEVER (fact verification), and Wizard of Wikipedia (dialogue) from the KILT benchmark.

## Main Findings

- eRAG achieves absolute improvement in Kendall's τ correlation with downstream RAG performance of +0.168 to +0.494 across the five evaluated datasets, compared to human annotation-based retrieval evaluation.
- Human provenance labels show only minor correlation with actual RAG performance — confirming that what makes a document "relevant" for retrieval in a RAG system is LLM-specific, not universally agreed upon.
- eRAG consumes up to 50× less GPU memory than end-to-end evaluation, making it practical for iterative retriever development.
- The approach generalizes across different retrieval augmentation methods (BM25, dense retrieval with Contriever), different numbers of retrieved documents, and different LLM sizes.
- eRAG's advantage is largest on complex multi-hop QA datasets (HotpotQA) where human relevance judgments most diverge from LLM utility.

## Relevance to Indigenous AI

The IndigenousAI project will need to evaluate retrieval quality for any Mohawk knowledge retrieval system — whether RAG or GraphRAG. The eRAG insight has two implications. First, human relevance judgments for Mohawk-language documents will be expensive (requiring fluent Mohawk speakers) and may not align with what actually helps the LLM anyway; eRAG provides a cheaper alternative that better predicts LLM utility. Second, the memory efficiency of eRAG matters for a project likely running on limited compute. For a Mohawk system, the evaluation challenge is compounded by the absence of standard benchmarks; eRAG's framework (individual document scoring against ground-truth answers) provides a replicable evaluation methodology that could be applied to a small manually curated Mohawk QA test set.

## Limitations & Critiques

- eRAG's relevance labels are model-specific: what a T5-small model finds useful may differ from what a GPT-4 model finds useful. The evaluation is not model-agnostic.
- The approach assumes ground-truth answer labels exist for the evaluation queries; for Mohawk language knowledge retrieval, creating such a ground-truth set requires significant community expert time.
- All experiments are on English-language datasets; eRAG's behavior for cross-lingual RAG (query and documents in different languages, or both in a low-resource language) is untested.

## Questions & Follow-ups

- How would eRAG be applied to a Mohawk language QA evaluation set? What is the minimum viable test set size for meaningful Kendall's τ estimates?
- Does eRAG's advantage hold for GraphRAG systems, or only for flat document-based RAG?
- Related work: Han et al. (2026) on RAG vs. GraphRAG benchmarks; Mei et al. (2025) on context engineering survey; Arabzadeh et al. (2025) on IR's role in RAG (SIGIR workshop); Wang et al. (2024, 2025) and Yu et al. (2025) for advanced RAG architectures.
