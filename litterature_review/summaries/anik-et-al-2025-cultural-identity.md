# Preserving Cultural Identity with Context-Aware Translation Through Multi-Agent AI Systems

**Authors:** Mahfuz Ahmed Anik, Abdur Rahman, Azmine Toushik Wasi, Md Manjurul Ahsan
**Year:** 2025
**Venue:** LM4UC 2025 — 1st Workshop on Language Models for Underserved Communities (co-located with ACL 2025), pages 51–60

---

## Core Argument

Standard machine translation systems prioritize linguistic efficiency over cultural fidelity, losing up to 47% of contextual meaning for Indigenous and low-resource languages. A multi-agent AI framework — with specialized agents for translation, cultural interpretation, content synthesis, and bias evaluation — outperforms monolithic models like GPT-4o on culturally embedded translation by distributing the task across agents with distinct responsibilities.

## Key Concepts

- **Multi-agent AI framework:** An architecture in which multiple specialized AI agents collaborate sequentially (and iteratively) on a task, each contributing a distinct capability: grammatical translation, cultural interpretation, content synthesis, and quality/bias evaluation.
- **Translation Agent:** Responsible for grammatically accurate initial translation using neural machine translation techniques.
- **Interpretation Agent:** Enriches the translation with historical, social, and contextual markers; adapts idioms, cultural references, and regional nuances for the target community.
- **Content Synthesis Agent:** Structures the final output for coherence and readability while preserving cultural annotations and idiomatic choices from upstream agents.
- **Quality and Bias Evaluation Agent:** Reviews the translated text for fairness, cultural sensitivity, and factual accuracy; cross-references with DuckDuckGo search for real-time external validation.
- **CrewAI / LangChain:** Orchestration frameworks used to implement the multi-agent collaboration and task delegation.
- **Aya Expanse 8B:** The underlying multilingual LLM (Cohere for AI) used by the agents; optimized for 23 languages via multilingual preference training and model merging.

## Main Findings

- The multi-agent framework outperforms GPT-4o on culturally embedded translation for low-resource and Indigenous languages in comparative analysis.
- Distributing the translation task across specialized agents — rather than processing it in a single linear pass — improves both cultural fidelity and bias detection.
- The framework addresses the "English-centric AI hierarchy" problem by using a multilingual backbone model (Aya Expanse 8B) and building cultural context correction into the pipeline architecture.
- Real-time external validation (DuckDuckGo) by the Bias Evaluation Agent provides a lightweight mechanism for catching cultural misrepresentations.

## Relevance to Indigenous AI

The multi-agent architecture offers a promising design pattern for the Mohawk translation use case: rather than asking a single LLM to simultaneously handle morphological correctness, cultural fidelity, and quality assurance, the task can be decomposed across agents with distinct roles. The Interpretation Agent role is particularly relevant — Mohawk ceremonial speech, relational terms, and oral tradition conventions require exactly the kind of cultural-contextual adaptation that monolithic translation systems miss. The paper also demonstrates that small open-weight multilingual models (8B parameters) can serve as effective backbones for underserved language tasks, which aligns with community-deployable model constraints.

## Limitations & Critiques

- No Indigenous languages (including Mohawk) are evaluated; the framework is demonstrated on unspecified "low-resource languages" without disclosing which ones or providing quantitative metrics in the paper summary.
- The Quality/Bias Evaluation Agent's use of DuckDuckGo for cultural validation is a weak proxy — general web search cannot reliably validate culturally specific Indigenous language content.
- No community members or Indigenous language experts are involved in evaluation; cultural fidelity is assessed by the framework's own bias agent rather than by native speakers.
- Aya Expanse 8B supports 23 languages, none of which are Indigenous North American languages; Mohawk coverage is effectively zero.

## Questions & Follow-ups

- Could the Interpretation Agent role be filled by a Retrieval-Augmented Generation system grounded in Mohawk cultural knowledge rather than a generic LLM?
- What evaluation protocol would Mohawk community members use to assess whether an AI-generated translation is culturally appropriate, not just grammatically correct?
- Related work: Anik et al. (2025) is part of the LM4UC 2025 workshop; related papers include Hutson et al. (2024) (linguistic diversity and AI), and the broader literature on community-centered evaluation (Krasner et al., 2025).
