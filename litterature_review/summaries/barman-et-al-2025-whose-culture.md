# Reinforcement Learning from Human Feedback in LLMs: Whose Culture, Whose Values, Whose Perspectives?

**Authors:** Kristian González Barman, Simon Lohse, Henk W. de Regt
**Year:** 2025
**Venue:** Philosophy & Technology, vol. 38, article 35
**Link:** https://doi.org/10.1007/s13347-025-00861-0

---

## Core Argument

The RLHF (Reinforcement Learning from Human Feedback) process that fine-tunes leading LLMs encodes the cultural values, biases, and perspectives of a narrow demographic of human evaluators — and this constitutes both an epistemic and ethical problem. Drawing on social epistemology (Longino, Harding, Feyerabend) and pluralist philosophy of science, the authors argue that making RLHF more pluralistic — through diversified evaluator selection, deliberative guidance panels, and aggregation methods that preserve minority viewpoints — would produce more robust and more just language models.

## Key Concepts

- **RLHF (Reinforcement Learning from Human Feedback):** The three-step fine-tuning pipeline (feedback collection → reward modelling → policy optimisation) used to align LLMs like ChatGPT with human preferences; the composition of the feedback group critically shapes model behavior.
- **Social cognition (Longino):** Knowledge production is a communal process; its quality depends on how the social process is organized. Inclusive feedback structures yield more reliable and less biased outcomes.
- **Pluralistic triangulation (Feyerabend):** Genuine understanding requires comparing and contrasting distinct viewpoints; homogeneous evaluator groups create systematic blind spots that only become visible through contrast with other perspectives.
- **Positionality (Harding):** People's social positions (gender, class, ethnicity, culture) systematically shape their epistemic perspectives; marginalized groups can detect hidden assumptions and harms that dominant groups cannot.
- **Sycophancy:** RLHF's tendency to amplify evaluators' biases; models learn to produce outputs that please evaluators rather than outputs that are accurate, fair, or cross-culturally valid.
- **Model drift:** The gradual shift in model behavior caused by RLHF, particularly when evaluators hold strong or culturally specific moral views that then get encoded into the reward model over time.

## Main Findings

- The initial InstructGPT/ChatGPT evaluator pool (40 contractors on Upwork and ScaleAI) was overwhelmingly educated (89% with university degrees), predominantly Southeast Asian (53%) and American (17%), and young (74% aged 18–34) — an extremely narrow demographic given the model's global deployment.
- RLHF systematically amplifies evaluator biases (sycophancy), produces politically unbalanced outputs correlated with evaluator demographics, and can degrade model performance over time through catastrophic forgetting.
- Current feedback aggregation (majority vote, averaging) erases minority viewpoints and creates pseudo-consensus; the authors advocate for aggregation methods that preserve the distribution of perspectives, including multi-objective optimization and Bayesian approaches.
- The authors propose four concrete agenda items: (1) transparent evaluator representation policies, (2) pluralistic guidance panels for instruction-writing, (3) feedback formats that preserve distinct viewpoints rather than forcing individual neutrality, and (4) nuanced reward models treating diversity as a resource.

## Relevance to Indigenous AI

This paper is directly relevant to understanding why general-purpose LLMs fail Indigenous communities: RLHF has systematically excluded Indigenous perspectives from the feedback process (zero Indigenous/Native American evaluators in the disclosed demographics). The paper's framework supports the argument that building AI tools for Mohawk language revitalization requires Indigenous community members to be evaluators and co-designers — not just end-users — of AI systems. The concept of positionality validates the epistemic standing of community knowledge holders. The "pluralistic triangulation" argument supports co-construction methodology where Indigenous and researcher perspectives are both preserved rather than averaged into a single model.

## Limitations & Critiques

- The paper remains largely theoretical/philosophical; it does not provide empirical evidence that more diverse RLHF panels actually produce more culturally inclusive outputs.
- The proposed "agenda for change" faces significant practical barriers: how to recruit genuinely diverse global evaluators, how to handle power imbalances in deliberation, how to define the boundaries of "legitimate" value pluralism without imposing another cultural framework.
- The authors use UDHR as a minimal ethical framework, but UDHR itself has been critiqued as Eurocentric and insufficient for Indigenous collective rights (UNDRIP articulates stronger Indigenous data sovereignty rights).
- The paper focuses on large commercial models; the implications for small, community-developed or community-fine-tuned models are not addressed.

## Questions & Follow-ups

- What would RLHF look like if Indigenous language communities were the primary evaluators for models trained on their own languages? What institutional structures would make this possible?
- How does UNDRIP (UN Declaration on the Rights of Indigenous Peoples) change the legal and ethical framework for what constitutes acceptable evaluator diversity in AI systems affecting Indigenous communities?
- Related work to explore: Kay et al. (2024) "Epistemic injustice in generative AI"; Bakker et al. (2022) "Fine-Tuning Language Models to Find Agreement Among Humans with Diverse Preferences."
