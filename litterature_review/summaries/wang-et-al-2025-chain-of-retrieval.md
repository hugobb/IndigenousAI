# CoRAG: Chain-of-Retrieval Augmented Generation

**Authors:** Liang Wang, Haonan Chen, Nan Yang, Xiaolong Huang, Zhicheng Dou, Furu Wei
**Year:** 2025
**Venue:** NeurIPS 2025 (Microsoft Research + Renmin University of China)

---

## Core Argument

Standard RAG performs a single retrieval step before generation, which fails on complex multi-hop queries because imperfect retrieval cannot be corrected mid-generation. CoRAG (Chain-of-Retrieval Augmented Generation) trains LLMs to retrieve and reason iteratively — decomposing complex queries into sub-queries, retrieving for each, and reformulating when retrieval fails — using rejection sampling to automatically generate intermediate retrieval chains as training data. CoRAG achieves more than 10 points improvement in EM over strong baselines on multi-hop QA and establishes new SOTA on the KILT benchmark.

## Key Concepts

- **Retrieval chain:** A sequence of sub-queries Q₁…Qₗ and sub-answers A₁…Aₗ generated before the final answer. Each sub-query is conditioned on all prior sub-queries and sub-answers, creating a chain of reasoning that progressively narrows toward the answer.
- **Rejection sampling for training data:** Most RAG datasets provide only (query, final answer) pairs with no intermediate retrieval steps. CoRAG uses a pretrained LLM to sample candidate retrieval chains, evaluates them by the log-likelihood of the correct final answer, and selects the best chain to augment the training set. This creates the intermediate supervision signal needed to train iterative retrieval.
- **Query reformulation on failure:** When a sub-query returns "no relevant information found," CoRAG learns to reformulate the query rather than giving up — mirroring human research behavior (if a search fails, rephrase and retry).
- **Test-time scaling:** Three decoding strategies control the compute/accuracy tradeoff:
  - *Greedy:* single chain, L sub-queries sequentially
  - *Best-of-N:* sample N chains, select the one where "no relevant information found" is least likely
  - *Tree search:* BFS with rollouts, scoring each state to expand the most promising branch
- **Pareto frontier:** CoRAG follows an approximate log-linear relationship between total token consumption and EM score — more compute at test time consistently improves accuracy across different datasets.
- **KILT benchmark:** A diverse knowledge-intensive task benchmark (NQ, TriviaQA, HotpotQA, FEVER, Wizard of Wikipedia, etc.) with a hidden test server; CoRAG achieves new SOTA across nearly all tasks.

## Main Findings

- CoRAG-8B (Llama-3.1-8B fine-tuned) achieves 72.5 EM on 2WikiMultihopQA with tree search (vs. 55.1 for the best fine-tuned baseline), 54.4 EM on MuSiQue (vs. 40.8), outperforming even GPT-4o in multi-hop settings.
- More than 10 EM points improvement over strong baselines on multi-hop QA datasets across multiple decoding strategies.
- Test-time scaling is effective: longer retrieval chains (L=10) and more samples (best-of-8) consistently improve performance over L=1 greedy, at the cost of increased token usage.
- Scaling benefits are dataset-dependent: for NQ (where a strong retriever already achieves high recall), CoRAG's iterative retrieval provides marginal gains — the benefit is concentrated in tasks where single-step retrieval is genuinely insufficient.
- CoRAG effectively learns to decompose complex queries and reformulate failed queries — these behaviors emerge from rejection sampling fine-tuning, not explicit supervision.
- Code, data, and trained models are publicly released.

## Relevance to Indigenous AI

CoRAG's contribution is primarily relevant to the RAG architecture choices for a Mohawk knowledge retrieval system. Two insights matter. First, for complex questions about Mohawk language, culture, or history — where answering requires connecting multiple pieces of information — single-step RAG will fail, and an iterative retrieval approach like CoRAG is more appropriate. Second, the rejection sampling approach to generating training data (automatically labeling intermediate retrieval chains from a pretrained LLM) provides a template for building iterative RAG training data without expensive human annotation of multi-hop reasoning chains. However, the rejection sampling process requires a capable pretrained LLM that already has some familiarity with the target domain — for Mohawk, where no capable Mohawk-language LLM exists, this approach would need to be adapted (e.g., using an English-language LLM to reason about Mohawk topics in English, or accepting a weaker intermediate supervision signal).

## Limitations & Critiques

- All experiments are on English Wikipedia and English-language QA benchmarks; CoRAG's behavior for cross-lingual or low-resource language RAG is not evaluated.
- The rejection sampling process requires a capable pretrained LLM (Llama-3.1-8B-Instruct); for languages with no capable base LLM, the intermediate supervision signal would be much weaker or unavailable.
- Test-time scaling increases latency substantially (multiple retrieval calls, multiple chain samples); this may be prohibitive for resource-constrained community deployments.
- The approach is evaluated on factoid QA; behavior on open-ended generation tasks (writing assistance, language learning), which are more relevant to Indigenous language tools, is not assessed.

## Questions & Follow-ups

- Could CoRAG's rejection sampling approach be adapted for Mohawk by using English-language reasoning about Mohawk topics (since much Mohawk linguistic knowledge is documented in English)?
- At what quality level of base retriever does CoRAG's iterative approach provide meaningful improvement over single-step RAG? This affects whether it is worth implementing for a small Mohawk knowledge base.
- Related work: Han et al. (2026) on RAG vs. GraphRAG benchmarks (evaluates different RAG architectures); Salemi and Zamani (2024) on eRAG (evaluates retrieval quality in RAG); Peng et al. (2025) on GraphRAG survey; Mei et al. (2025) on context engineering survey.
