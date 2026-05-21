# Randomness, Not Representation: The Unreliability of Evaluating Cultural Alignment in LLMs

**Authors:** Ariba Khan, Stephen Casper, Dylan Hadfield-Menell
**Year:** 2025
**Venue:** FAccT 2025 (ACM Conference on Fairness, Accountability, and Transparency), Athens, Greece
**Link:** https://doi.org/10.1145/3715275.3732147

---

## Core Argument

Current survey-based methods for evaluating the "cultural alignment" of LLMs rest on three unstated assumptions — stability, extrapolability, and steerability — that all fail under systematic empirical testing. LLM cultural preferences are highly sensitive to minor methodological choices (question direction, Likert scale size, framing, reasoning requirements), meaning that apparent cultural alignment is largely an artifact of evaluation design rather than a stable property of the model. Researchers should treat these evaluations with the same rigor applied in social science, including pre-registration and red-teaming of results.

## Key Concepts

- **Cultural alignment:** The degree to which an LLM's behaviors reflect common beliefs within a given culture about what is desirable and proper.
- **Stability assumption:** Cultural alignment should remain consistent across semantically equivalent variations in evaluation methodology.
- **Extrapolability assumption:** Alignment on a narrow set of cultural dimensions should predict alignment on held-out dimensions.
- **Steerability assumption:** LLMs can be reliably prompted to embody specific cultural perspectives (persona modulation).
- **WEIRD bias:** LLMs tend to reflect values of Western, Educated, Industrialized, Rich, and Democratic societies, misrepresenting non-WEIRD worldviews.
- **Liar's dividend (implicit):** Survey design artifacts can be exploited — or inadvertently triggered — to produce misleading conclusions about model biases (demonstrated through the forced-choice vs. neutral-option case study).

## Main Findings

- LLM responses on established cultural surveys (GQA, VSM/Hofstede) shift significantly when only presentation format changes (ascending vs. descending scale direction, identifier vs. full-text response type), with effect sizes often exceeding one standard deviation of real between-country human variation.
- Extrapolation from a small number of Hofstede cultural dimensions produces near-random clustering (ARI near chance); reliable clustering requires observing substantially all dimensions.
- Under both instruction-based and DSPy-optimized prompting, LLM responses cluster by model architecture, not by target country — human responses from other countries are better proxies for each other's cultural preferences than LLMs prompted to represent a specific culture.
- A case study replicating Mazeika et al. shows that GPT-4o expresses equal valuation of human lives from all countries when given a neutral "no preference" option; apparent nationality-based value hierarchies vanish when evaluation design permits neutrality.
- These instabilities can be exploited to paint arbitrary pictures of LLM cultural alignment through selective experiment design and cherry-picking.

## Relevance to Indigenous AI

This paper is a methodological warning for any project that evaluates whether an AI system "represents" or "aligns with" Indigenous epistemologies. Survey-based approaches borrowed from social science cannot straightforwardly characterize whether an LLM understands Mohawk cultural concepts or Six Nations values — the very metrics are unstable. For the IndigenousAI project, this implies that evaluation of culturally adapted language models must go beyond Likert-scale surveys and develop community-grounded, qualitative methods. The finding that humans from other cultures are better proxies for each other than LLMs are for any culture underscores the irreplaceability of direct community involvement in evaluation design and validation.

## Limitations & Critiques

- The paper acknowledges it also draws narrow empirical conclusions from a limited set of experiments — the critique of cherry-picking applies somewhat to the paper itself.
- The study focuses on well-resourced national cultures with large survey datasets (Hofstede, GQA); there is no discussion of how the evaluation problem compounds for communities with no existing survey infrastructure, such as Indigenous nations.
- The paper does not propose alternative evaluation frameworks, only critiquing existing ones and calling for pre-registration — a gap for practitioners who need actionable guidance.

## Questions & Follow-ups

- What evaluation methodologies are appropriate for Indigenous language AI, given that neither survey-based nor prompting-based approaches reliably capture cultural alignment?
- What does "cultural alignment" even mean for a small, orally-transmitted Indigenous language community — is alignment to a culture the right frame, or should the goal be framed as community utility and self-determination?
- Related work to explore: Adilazuarda et al. (2024) "Towards Measuring and Modeling Culture in LLMs: A Survey" and Pawar et al. (2024) survey on cultural awareness in language models.
