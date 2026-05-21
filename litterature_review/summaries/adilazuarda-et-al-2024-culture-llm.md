# Towards Measuring and Modeling "Culture" in LLMs: A Survey

**Authors:** Muhammad Farid Adilazuarda, Sagnik Mukherjee, Pradhyumna Lavania, Siddhant Singh, Alham Fikri Aji, Jacki O'Neill, Ashutosh Modi, Monojit Choudhury
**Year:** 2024
**Venue:** Proceedings of the 2024 Conference on Empirical Methods in Natural Language Processing (EMNLP), pages 15763–15784
**Link:** https://aclanthology.org/2024.emnlp-main.882

---

## Core Argument

None of the 90+ existing studies on culture in LLMs explicitly defines "culture"; instead, they probe models using datasets that stand as *proxies* for culture. The authors propose a two-dimensional taxonomy of these proxies — demographic (region, language, religion, gender, ethnicity, etc.) and semantic (emotions/values, food, kinship, social norms, etc.) — and identify three critical gaps: over-focus on values/norms, lack of interpretable probing methods, and absence of situated real-world studies.

## Key Concepts

- **Proxies of culture:** Concrete, measurable dataset features (food, names, norms, values, geography) used as stand-ins for the complex construct of culture, since culture itself resists direct operationalization.
- **Thick vs. thin description (Geertz):** Thin descriptions capture observable behaviors from an outsider view; thick descriptions include actors' own explanations of context and meaning. LLMs tend to produce only thin cultural representations.
- **Demographic proxies:** Region and language are the most common (37 and 35 out of 90 papers respectively), often used to contrast non-Western cultures against a Western/English baseline.
- **Semantic proxies:** Emotions and values dominate (25/55 papers on semantic proxies); many semantic domains (quantity, time, kinship, pronouns) remain entirely unstudied.
- **Aboutness:** The culturally-specific prioritization and relevance of topics — a key axis identified by Hershcovich et al. (2022) that is completely unexplored in current NLP research.
- **Black-box probing:** The dominant evaluation method, where LLMs are queried with culturally conditioned prompts and outputs are compared across conditions (discriminative or generative).

## Main Findings

- No study among the 90 surveyed explicitly defines culture; almost all rely on region or language as their primary demographic proxy.
- Virtually all studies conclude LLMs perform better for Western/English cultures than others, but probing robustness is limited — results may reflect prompt sensitivity rather than genuine cultural (mis)representation.
- The vast majority of studies use black-box approaches; white-box interpretability methods (gradient analysis, attention mapping) have not been applied to cultural bias research.
- Many semantic domains — quantity, time, kinship, function words, spatial relations — remain entirely absent from the literature.
- Situated studies (examining how cultural misrepresentation manifests in deployed applications) are almost entirely absent from the NLP literature.

## Relevance to Indigenous AI

This survey is foundational for the IndigenousAI project because it maps exactly where cultural gaps in LLM research exist. Indigenous languages (Mohawk, etc.) are severely under-represented in both demographic and semantic proxy coverage — they appear neither as regional proxies in current benchmarks nor in studies of semantic domains like kinship terms, which are culturally specific and structurally distinct in polysynthetic languages. The concept of "thick description" directly supports the project's commitment to community-centered co-construction: evaluating an LLM for Mohawk cultural competence requires insider, lived-experience perspectives, not outsider checklists. The call for interdisciplinarity (anthropology, HCI) mirrors decolonial AI methodology.

## Limitations & Critiques

- The survey focuses exclusively on LLMs and excludes speech and multimodal models, HCI research, and ICTD work — all directly relevant to Indigenous language technology.
- The taxonomy of proxies, while useful, is itself constructed from a Western academic literature; Indigenous communities might organize cultural categories very differently.
- The paper does not cover modeling or mitigation strategies, only measurement — leaving the action implications underdeveloped.
- Most surveyed papers treat "Western" culture as a monolithic baseline, which the authors critique but do not fully resolve in their own taxonomy.

## Questions & Follow-ups

- How can "aboutness" be operationalized for a language like Mohawk, where the relevant topics and priorities are determined by the community rather than external researchers?
- Is the proxy-of-culture framework inherently extractive when applied to Indigenous communities who have not consented to having their cultural practices treated as benchmark test cases?
- Related work to explore: Hershcovich et al. (2022) "Challenges and strategies in cross-cultural NLP"; Cooper et al. (2024) "It's how you do things that matters: Attending to process to better serve Indigenous communities with language technologies."
