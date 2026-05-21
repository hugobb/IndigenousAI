# We Politely Insist: Your LLM Must Learn the Persian Art of Taarof

**Citation:** Sadr, N. G., Heidariasl, S., Megerdoomian, K., Seyyed-Kalantari, L., & Emami, A. (2025). We Politely Insist: Your LLM Must Learn the Persian Art of Taarof. In *Proceedings of the 2025 Conference on Empirical Methods in Natural Language Processing (EMNLP 2025)*, pages 1819–1838.

---

## Core Argument

LLMs systematically fail at taarof — the Iranian practice of ritual social politeness involving deference, modesty, and strategic indirectness — because they conflate surface linguistic politeness (grammatical politeness markers) with culturally appropriate behavior. The authors argue that a model can produce grammatically polite responses that are nonetheless culturally wrong, and that cultural pragmatic competence requires dedicated benchmarks and training interventions beyond general instruction-tuning. TAAROFBENCH provides the first systematic evaluation of LLMs on a culturally specific pragmatic norm.

---

## Key Concepts

- **Taarof:** A Persian cultural practice governing social interaction through ritualized deference, modesty, and indirect communication. Examples include refusing offers multiple times before accepting, understating one's own capabilities or possessions, and offering things one does not intend to give (which the recipient is expected to decline). Violation of taarof signals social ignorance or disrespect.
- **Cultural pragmatic competence:** The ability to understand and produce language that is not just grammatically or lexically correct but appropriate given a specific cultural context, social relationship, and communicative goal.
- **Surface vs. deep politeness:** Standard politeness classifiers measure grammatical and lexical markers of deference; taarof evaluation reveals that models can score as "polite" by standard metrics while producing culturally inappropriate responses.
- **TAAROFBENCH:** A benchmark of 450 role-play scenarios across 12 social interaction topics. Each scenario is a structured tuple: {E (event/situation), Ru (user role), Rm (model role), C (conversation context), U (user utterance), Aexp (expected culturally appropriate response)}.
- **Scenario topics:** Refusing offers, accepting compliments, responding to invitations, greetings, farewells, expressions of gratitude, and other common social interactions where taarof norms apply.
- **SFT (Supervised Fine-Tuning):** Training on TAAROFBENCH examples to teach culturally appropriate taarof responses. Yields +21.8% accuracy improvement.
- **DPO (Direct Preference Optimization):** Contrastive training aligning model outputs to culturally preferred responses over culturally inappropriate alternatives. Yields +42.3% accuracy improvement, bringing models close to native speaker performance (79.5% vs. 81.8% human baseline).
- **Gender bias in cultural AI:** Models perform better when the user role in the scenario is female, and rely on gender stereotypes when generating culturally appropriate responses.

---

## Main Findings

- Baseline LLM accuracy on taarof-expected scenarios: 34–42%, compared to 81.8% for native Persian speakers — a gap of ~40 percentage points.
- Standard politeness classifier performance: 84.5% of model outputs labeled "polite" by classifier, but only 41.7% are culturally appropriate — a 42.8 percentage point discrepancy, demonstrating that surface politeness metrics are inadequate for cultural evaluation.
- Persian prompts improve performance by up to +33.1 percentage points for GPT-4o versus English prompts, confirming that language of instruction matters for cultural pragmatic competence.
- Non-Iranian human evaluators (no cultural background in taarof) perform similarly to top LLMs (~40%), validating that taarof performance reflects genuine cultural knowledge rather than general language ability.
- SFT: +21.8% improvement over baseline; DPO: +42.3% improvement, reaching 79.5% accuracy — approaching native speaker performance (81.8%).
- Gender biases: Models systematically generate different taarof responses based on the assigned gender of the user role, relying on cultural gender stereotypes rather than situationally appropriate norms.
- Larger models do not uniformly outperform smaller models on taarof; cultural pragmatic competence does not scale straightforwardly with general model capability.

---

## Relevance to Indigenous AI

TAAROFBENCH provides a highly transferable methodology for evaluating AI on Indigenous social and communicative norms:

1. **Role-play scenario format:** The {situation, roles, context, utterance, expected response} tuple is directly adaptable for evaluating Mohawk social protocols — for example, appropriate greetings, thanksgiving address protocols (Ohén:ton Karihwatéhkwen), or respectful forms of address for elders and knowledge keepers.
2. **Surface vs. deep competence:** The paper demonstrates that an AI system can appear culturally competent using surface markers while violating deep norms — directly applicable to Indigenous language contexts where respectful language has layers (grammatical respect forms vs. relational appropriateness).
3. **DPO as alignment tool:** The strong DPO results (+42.3%) suggest that contrastive preference optimization on culturally appropriate vs. inappropriate responses is an efficient alignment strategy even with limited data — relevant for data-scarce Mohawk contexts.
4. **Non-community evaluators mirror LLM failures:** The finding that non-Iranian humans perform like LLMs validates using community member evaluations as the gold standard — supporting the case for centering Indigenous community evaluators rather than external annotators.
5. **Language of instruction matters:** Persian prompts outperform English prompts significantly; this supports building Mohawk-language interfaces and instructions rather than relying on English-mediated prompting.
6. **Gender and social role biases:** The gender bias findings suggest models will likely encode colonial-era gender norms when operating in Indigenous cultural contexts, requiring specific debiasing work.

---

## Limitations & Critiques

- **Single culture, single pragmatic phenomenon:** TAAROFBENCH covers only taarof within Iranian Persian culture; generalizability to other cultural pragmatic systems (including Indigenous protocols) requires significant adaptation and new data collection.
- **Scenario construction by researchers:** The 450 scenarios were created by academic researchers, not through participatory co-construction with Persian-speaking communities. Cultural nuances may be missed or homogenized.
- **12 topic categories:** The 12 social interaction topics reflect the researchers' choices; taarof norms apply in many more situational contexts that are absent from the benchmark.
- **Binary expected-response format:** Each scenario has a single expected culturally appropriate response (Aexp); in practice, taarof-appropriate responses vary by region, generation, and social context — a single gold answer oversimplifies.
- **Fine-tuning data scale:** SFT and DPO results are based on the 450-scenario benchmark; it is unclear whether these improvements generalize beyond taarof-specific test data or represent overfitting to the benchmark distribution.
- **Evaluation automation:** Cultural appropriateness judgments are made by human annotators and then used to train automated evaluation; the inter-annotator agreement process is described but the cultural homogeneity of annotators is not.

---

## Questions & Follow-ups

- What Mohawk social interaction protocols would be the highest priority to evaluate — Ohén:ton Karihwatéhkwen (Thanksgiving Address), appropriate forms of address, or elder-youth interaction norms?
- Can DPO be applied effectively with fewer than 450 training examples, given that Mohawk parallel cultural data is likely far scarcer?
- How should the scenario tuple format be adapted for contexts where the "expected response" is not a single answer but a range of acceptable responses graded by community members?
- Does the taarof benchmark methodology assume literacy and text-based interaction? How would it need to change for oral Indigenous language contexts?
- The gap between surface politeness (84.5%) and cultural appropriateness (41.7%) is striking — is there an analogous gap between grammatically correct Mohawk outputs and culturally appropriate ones that should be measured?
