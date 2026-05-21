# Culturally Aware and Adapted NLP: A Taxonomy and a Survey of the State of the Art

**Authors:** Chen Cecilia Liu, Iryna Gurevych, Anna Korhonen
**Year:** 2025
**Venue:** Transactions of the Association for Computational Linguistics (TACL), vol. 13, pp. 652–689
**Link:** https://doi.org/10.1162/tacl_a_00760

---

## Core Argument

The surge of research on "culture" in NLP lacks a shared definition of the concept, making it difficult to evaluate progress or identify gaps. Drawing on anthropology and social sciences, this paper proposes a fine-grained three-branch taxonomy of cultural elements (ideational, linguistic, social) grounded in the working definition that culture encompasses "the collective ideas, shared language, and social practices that emerge from and evolve through human social interactions within a society." The taxonomy is then used to survey 127 papers, reveal where significant progress has been made (values/bias, knowledge benchmarks) and where major gaps remain (social elements, endangered dialects, community-driven resource acquisition, "deep" behavioral adaptation).

## Key Concepts

- **Ideational elements:** Non-material aspects of culture — concepts, knowledge, values, norms and morals, artifacts — that constitute a way of life.
- **Linguistic elements:** Dialects, styles, registers, and genres — cultural variations in language form that bridge ideational and social dimensions.
- **Social elements:** Relationships, context (situational, historical, non-verbal), communicative goals, and demographics — the social-interaction dimensions of culture largely absent from current NLP work.
- **WEIRD bias:** LLMs align disproportionately with Western, Educated, Industrialized, Rich, and Democratic values, documented across multiple evaluation frameworks.
- **Surface vs. deep cultural adaptation:** Surface = using the target language and recognizing explicit cultural differences; deep = behaving as a member of the culture would without explicit inquisition — analogous to a spectrum from recognition to behavioral competence.
- **CultureGLUE:** A proposed (currently absent) unified benchmark covering all cultural elements across diverse groups, analogous to GLUE for general NLP.
- **Data sovereignty and ethical acquisition:** The paper stresses that for Indigenous and marginalized communities, data ownership must be discussed from the outset and ethical practices are non-negotiable — citing Bird (2020), Smith (2021), Cooper et al. (2024).

## Main Findings

- Significant progress has been made on values/bias benchmarks (particularly gender bias in machine translation) and MMLU-style cultural knowledge benchmarks, but these are largely evaluation-focused and predominantly cover Western, Chinese, and Indian cultures.
- Social elements of culture (relationships, historical context, communicative goals, demographics) are substantially understudied in NLP — nearly no resources exist that capture, for example, speaker relationships in dialogue or how colonial history shapes language use.
- Community involvement in resource design is rare: native speakers are commonly consulted for annotation and quality checks, but the entire community is rarely involved at the task design stage.
- Current adaptation methods (prompting/persona modulation, continual pre-training, PEFT) treat cultural adaptation as a one-time technical fix focused on isolated elements rather than a systematic, ongoing process.
- A key unresolved question is whether cultural adaptation should occur within a "situated social context and structure" — i.e., whether models need to understand the social relationships and historical contexts that produce cultural practices, not just surface-level facts.
- Feedback learning (RLHF/DPO) holds promise for multicultural adaptation but requires large, culturally diverse preference datasets that do not currently exist for most non-WEIRD cultures.

## Relevance to Indigenous AI

This survey provides the broadest map of the culturally aware NLP landscape and is useful as a reference for positioning the IndigenousAI project. Several findings are directly pertinent: (1) The emphasis on "deep adaptation" — behaving as a cultural member, not just recognizing cultural facts — maps onto the core challenge of building AI that is genuinely useful for Mohawk language revitalization rather than producing superficial cultural labels. (2) The identification of social elements as a critical gap is relevant because Haudenosaunee culture is deeply relational and contextual (clan systems, ceremonial responsibilities, oral transmission through specific relationships) — dimensions that no current NLP taxonomy adequately captures. (3) The explicit call for ethical data acquisition and data sovereignty for Indigenous communities, citing Cooper et al. (2024) "it's how you do things that matters," provides literature support for process-centered methodology. (4) The absence of endangered Indigenous languages from any of the surveyed 127 papers confirms the size of the gap this research project is addressing.

## Limitations & Critiques

- The survey is restricted to main and findings papers from six *CL venues (ACL, EMNLP, NAACL, EACL, AACL, TACL) from 2020–2024, explicitly excluding non-*CL venues where much Indigenous language NLP work is published (e.g., ComputEL, AmericasNLP).
- The taxonomy, while more fine-grained than predecessors, still uses country as the default proxy for culture — a limitation the authors acknowledge but do not resolve, and which is particularly inadequate for nations whose cultural boundaries do not align with state borders.
- The survey's "culture" focus remains primarily descriptive (what cultures exist) rather than relational (how power, colonialism, and language contact shape cultural expression) — the political dimensions of cultural marginalization are largely absent.

## Questions & Follow-ups

- How would the proposed taxonomy need to be extended to capture Indigenous epistemological categories that do not map onto Western ideational/linguistic/social distinctions — for instance, the relationship between land, language, and ceremonial knowledge in Haudenosaunee traditions?
- What evaluation metrics could operationalize "deep cultural adaptation" for an AI system used in Mohawk language revitalization — and how would community members themselves judge whether the system has achieved it?
- Related work to explore: Cooper et al. (2024) "it's how you do things that matters: Attending to process to better serve indigenous communities with language technologies" (EACL 2024) — cited here as a best-practice reference.
