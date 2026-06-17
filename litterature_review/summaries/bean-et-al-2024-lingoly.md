# LingOly: A Benchmark of Olympiad-Level Linguistic Reasoning Puzzles in Low-Resource and Extinct Languages

**Authors:** Andrew Bean, Simi Hellsten, Harry Mayne, Jabez Magomere, Ethan A. Chi, Ryan Chi, Scott A. Hale, Hannah Rose Kirk
**Year:** 2024
**Venue:** NeurIPS 2024 (University of Oxford, Stanford University, Meedan; arXiv:2406.06196)
**Link:** [github.com/am-bean/lingOly](https://github.com/am-bean/lingOly)

---

## Core Argument

LLMs perform poorly at genuine linguistic reasoning on low-resource and extinct languages, even when all necessary information is provided in context. LingOly provides a contamination-resistant benchmark of 1,133 Olympiad-style puzzles across 90+ languages drawn from the UK Linguistics Olympiad (UKLO), using a no-context baseline to distinguish true reasoning ability from memorization of language-specific knowledge.

## Key Concepts

- **LingOly benchmark:** 1,133 questions across 90+ mostly low-resource or extinct languages, organized into 6 formats (Rosetta, Pattern, Match-up, Monolingual, Computational, Text) and 5 difficulty levels (Breakthrough through Round 2).
- **No-context baseline (ΔNC):** The improvement in model score between a full prompt (with context) and a stripped prompt (preamble only, no linguistic examples). A high ΔNC indicates genuine use of in-context information rather than memorized knowledge.
- **Exact match evaluation:** Only exact answers are accepted; small morphological or ordering errors count as wrong, reflecting the precision required for linguistic correctness.
- **Language resourcing effect:** Performance on exact match correlates positively with the resource level of the tested language; ΔNC (true reasoning improvement) shows no relationship with resourcing for open models.
- **Rosetta format:** The most common puzzle type — pairs of translations in an unknown language are provided; the test-taker must deduce grammatical and semantic patterns and apply them.

## Main Findings

- The best-performing model (Claude Opus) achieves 46.3% exact match overall and only 38.7% on harder (Round 2) problems, with a ΔNC of 24.7% — indicating substantial room for improvement and confirming that current LLMs struggle with genuine linguistic reasoning.
- Large closed models (Claude Opus, GPT-4o) substantially outperform open models (Llama 3, Mixtral); the largest open models score well below the weakest closed models.
- Exact match scores correlate with language resourcing (higher-resource languages → better scores), but ΔNC does not — suggesting that score improvements on lower-resource languages are more likely to reflect genuine reasoning rather than memorization.
- Chain-of-thought prompting does not improve performance and can introduce errors by generating false assertions about word correspondences or assuming English-like word order.
- Morphology, phonology, and syntax are the most common question subjects; puzzles in polysynthetic or morphologically complex languages tend to be harder.

## Relevance to Indigenous AI

LingOly provides the most rigorous existing framework for evaluating LLM linguistic reasoning on unseen, low-resource languages — directly applicable to Mohawk. Because UKLO puzzles are designed so all information needed is in context, and because Mohawk is absent from LLM pretraining data, a Mohawk-specific LingOly-style evaluation would measure genuine structural reasoning about the language rather than statistical recall. The benchmark's subject taxonomy (morphology, syntax, phonology, evidentiality-adjacent semantics) maps onto Mohawk's key structural features. The finding that ΔNC does not correlate with language resourcing for open models is encouraging: genuine reasoning gains are possible even for the most low-resource languages, and are not gated by pretraining exposure. The UKLO framework — puzzles authored by linguists who research the languages — also suggests a community-linguist co-authoring model for Mohawk evaluation items.

## Limitations & Critiques

- Non-Latin script languages are excluded from LingOly, limiting coverage; Mohawk uses the Latin script and would be eligible, but is not currently represented.
- Exact match scoring is strict and may undercount partial linguistic understanding that community speakers would recognize as meaningful.
- UKLO puzzles cover many languages but not Haudenosaunee languages (Mohawk, Cayuga, Seneca, Onondaga); creating these puzzles would require UKLO author permission and community linguist involvement.
- The benchmark tests puzzle-solving reasoning, not culturally situated or pragmatically appropriate language use — an important limitation for the project's cultural fidelity goals.

## Questions & Follow-ups

- Could Mohawk-specific LingOly-style puzzles be co-authored with Six Nations community linguists and submitted for inclusion in UKLO or as a standalone evaluation set?
- Given that chain-of-thought does not improve LingOly performance, would structured morphological decomposition prompts (targeting Mohawk pronominal prefix patterns) perform better than generic CoT?
- How does LingOly complement the Linguini benchmark (Sánchez et al., 2025), which uses ILO (International Linguistics Olympiad) rather than UKLO source material?
