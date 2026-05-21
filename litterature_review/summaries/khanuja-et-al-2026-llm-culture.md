# Steering LLMs for Culturally Localized Generation

**Authors:** Simran Khanuja, Hongbin Liu, Shujian Zhang, John Lambert, Mingqing Chen, Rajiv Mathews, Lun Wang
**Year:** 2026
**Venue:** arXiv preprint (arXiv:2603.23301v1), March 2026; Google DeepMind / Carnegie Mellon University
**Link:** https://arxiv.org/abs/2603.23301

---

## Core Argument

Existing approaches to cultural localization in LLMs (prompting, post-training alignment) are black-box, hard to control, and cannot distinguish whether failures stem from missing knowledge or inadequate elicitation. This paper introduces Cultural Embeddings (CuE), a mechanistic interpretability framework that uses Sparse Autoencoders (SAEs) to identify and manipulate interpretable internal features encoding cultural knowledge. CuE-based steering produces outputs that are more culturally faithful and surface rarer, long-tail cultural concepts than prompting alone — including when applied on top of explicit cultural prompts — demonstrating that much cultural knowledge is latent in models but requires better elicitation.

## Key Concepts

- **Cultural Embeddings (CuE):** Sparse, interpretable vectors constructed from SAE features with high mutual information with country-level culture labels; they serve as compact representations of cultural knowledge encoded in a model.
- **Sparse Autoencoders (SAEs):** Neural network components that decompose model activations into largely monosemantic, human-interpretable features, enabling white-box access to internal representations.
- **Cultural localization:** Steering model generation to reflect the customs, cuisine, values, and practices of a specific target culture.
- **Implicit vs. explicit cultural prompting:** Implicit = no country cue in prompt; explicit = "I am from [country]" prepended. CuE steering improves on both baselines.
- **Cultural faithfulness:** How accurately generated text reflects the target culture's practices, beliefs, or values.
- **Rarity:** Whether generated content surfaces less common, long-tail cultural concepts rather than dominant stereotypes.
- **Bias concentration index:** A metric quantifying how unevenly cultural defaults are distributed across countries in underspecified generations.
- **Anglophone default bias:** Under implicit prompting, 60% of Gemma-2-9B's cultural defaults align with the US or UK.

## Main Findings

- LLMs encode culture-specific information in internal representations that are linearly decodable throughout the network (53.2% macro-F1 on a 22-country classification task for Gemma-2-9B, vs. 4.5% random baseline).
- Early transformer layers (0–15) capture lexical identity markers (country name tokens); later layers (33–41) encode compositional cultural semantics including cuisine, governance, and geopolitical framing.
- SAE features cluster along recognizable cultural-geographic boundaries: East Asian cluster, British Isles cluster, Continental European cluster, Mediterranean cluster, etc. Russia's dominant features encode geopolitical/sanctions themes rather than cultural practices, reflecting training data framing bias.
- CuE steering reduces the Anglophone default bias concentration index by 84.7% (from 0.333 to 0.051) compared to the implicit baseline; steering on top of explicit prompts achieves 0.045.
- Rarity improvement from steering is the most universal and robust effect across all 22 countries; cultural faithfulness gains are stronger for underrepresented cultures (Thailand, India, South Korea) where the model possesses latent knowledge not activated by default.
- Some cultures (Egypt, Israel, Russia) require explicit country cues combined with steering — the steering vector alone cannot identify the target culture, but amplifies it once anchored by the explicit cue.

## Relevance to Indigenous AI

CuE offers a promising diagnostic and intervention methodology for understanding what an LLM "knows" about Indigenous cultures and languages. For Mohawk or Six Nations contexts, the framework could reveal whether cultural knowledge is absent from internal representations (a data problem requiring new corpora) or merely unelicited (an inference problem addressable by steering). The authors explicitly note their method generalizes beyond country labels to any user-defined culture label — including linguistic communities — provided labeled data exist. The bias concentration analysis directly quantifies the Anglophone default problem that would systematically suppress Indigenous cultural outputs under underspecified prompts. The ethical consideration about dual-use and the need for participatory design with cultural stakeholders is directly applicable to Indigenous co-construction.

## Limitations & Critiques

- The paper uses country as a proxy for culture, which flattens intra-country diversity and is especially inadequate for Indigenous nations whose territory spans or sits within multiple countries (e.g., Six Nations territory across Canada and the US).
- The dataset (CANDLE + LLM-augmented assertions) covers 22 countries, none of which are Indigenous nations or small language communities; results may not transfer to contexts with very sparse representation in training data.
- The evaluation relies on LLM-as-a-judge paradigm, which inherits the cultural biases of the judge models and may favor familiar cultural concepts — the same cultures being steered toward may be evaluated more accurately.
- Steering requires hyperparameter tuning (alpha, layer selection) and may introduce instability or unintended side-effects for cultures with low baseline cultural scores.

## Questions & Follow-ups

- Could the CuE framework be applied to identify which SAE features, if any, encode Mohawk language or Haudenosaunee cultural concepts — and if none exist, quantify the magnitude of the knowledge gap?
- What minimum corpus size of cultural assertions is needed to construct a reliable CuE for a small language community, and how does data sparsity affect feature selection stability?
- Related work to explore: Veselovsky et al. (2025) "Localized cultural knowledge is conserved and controllable in large language models" — the closest prior work using contrastive cultural activation vectors.
