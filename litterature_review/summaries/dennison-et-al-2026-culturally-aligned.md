# Deploying Culturally Aligned AI: The LISTED Framework

**Authors:** Dennison et al.
**Year:** 2026
**Venue:** CHI 2026 (ACM Conference on Human Factors in Computing Systems)

---

## Core Argument

Deploying AI systems that are genuinely culturally aligned requires more than technical customization — it demands a structured framework for attending to the social, institutional, and demographic dimensions of deployment. Drawing on 8 real-world AI deployments across 7 countries and 18 languages, the authors introduce the LISTED framework (Language, Institution, Safety, Task, End-User Demography, Domain) and 12 design guidelines. The central empirical insight is that human expert labor — particularly community and cultural knowledge — is a more critical bottleneck than technical complexity.

## Key Concepts

- **LISTED framework:** Six dimensions for characterizing and designing culturally aligned AI deployments:
  - **L**anguage: script, dialect, morphological complexity, resource availability
  - **I**nstitution: organizational context, governance, stakeholder power dynamics
  - **S**afety: cultural taboos, harm categories specific to context, content moderation needs
  - **T**ask: the specific application (Q&A, summarization, translation, dialogue)
  - **E**nd-User Demography: age, literacy, digital access, cultural identity of intended users
  - **D**omain: subject matter (health, legal, education, cultural heritage)
- **Human labor as the bottleneck:** Technical model adaptation (fine-tuning, prompting) is tractable; identifying what "culturally appropriate" means for a specific community requires irreplaceable human expertise that cannot be automated.
- **12 design guidelines:** Practical recommendations spanning all six LISTED dimensions; include involve community members in evaluation, define harm in local terms, and pilot with target demographic before full deployment.
- **Low-resource language challenges:** Across deployments, low-resource languages consistently required more human intervention and produced more alignment failures than high-resource ones — not primarily because of technical model limitations but because evaluation infrastructure was absent.

## Main Findings

- Across 8 deployments in diverse cultural and linguistic settings, the LISTED framework identified where deployments succeeded or failed along each dimension.
- Human expert labor — translators, cultural consultants, community validators — was the most consistently cited constraint; technical fine-tuning or prompting was rarely the binding limit.
- Safety dimension failures were most culturally specific: what counts as harmful, offensive, or inappropriate varies enormously across communities and could not be handled by generic content moderation.
- End-user demography — particularly literacy level and digital access — shaped usability more than language model quality in several deployments.
- The 12 design guidelines are organized by LISTED dimension and grounded in failure cases from the 8 deployments, making them more actionable than generic ethical principles.

## Relevance to Indigenous AI

The LISTED framework is directly applicable to the IndigenousAI project's Mohawk/Six Nations deployment context. Each dimension raises specific questions: Language (Mohawk's polysynthetic morphology, extremely low digital resource availability), Institution (Six Nations band council governance, relationship with Abundant Intelligence and Mila), Safety (cultural protocols around sacred knowledge, who has authority to share what), Task (language learning? Q&A? cultural heritage retrieval?), End-User Demography (community members, learners, elders with varying digital access), Domain (language education, cultural preservation). The finding that human labor is the binding constraint validates the IndigenousAI project's emphasis on community partnership over technical heroics. The 12 design guidelines provide a checklist to audit the project's current approach.

## Limitations & Critiques

- Eight deployments is a small sample for generalizing 12 design guidelines; the guidelines reflect the particular contexts studied.
- The LISTED framework is descriptive and analytical — it identifies dimensions but does not specify how to trade off between them when they conflict.
- The paper is from CHI 2026, meaning it is very recent and has not yet been widely tested or critiqued by other researchers.
- The framework does not specifically address Indigenous language contexts or decolonial considerations; the "Institution" dimension as described may not capture the sovereignty and self-determination concerns that are central to Indigenous AI ethics.

## Questions & Follow-ups

- How do the 12 design guidelines translate to a context where community governance (Six Nations) is the primary institution, rather than a corporation or government agency?
- What safety failures occurred in the language-related deployments studied? Were any of them relevant to Indigenous language contexts?
- Related work: Meighan (2021) on relational technology; Brinklow (2021) on anti-colonial Indigenous language technology; Ajani et al. (2024) on ethical consent in digital preservation; Pinhanez and Wornyo (2025) on co-development.
