# Linguini: A Benchmark for Language-Agnostic Linguistic Reasoning

**Authors:** Eduardo Sánchez, Belen Alastruey, Christophe Ropers, Arina Turkatenko, Pontus Stenetorp, Mikel Artetxe, Marta R. Costa-jussà
**Year:** 2025
**Venue:** NeurIPS 2025 (Meta AI, University College London, University of the Basque Country)

---

## Core Argument

Current LLMs perform poorly at linguistic reasoning tasks that require no prior knowledge of the language — a finding that exposes a fundamental gap between apparent multilingual fluency and genuine linguistic reasoning ability. The Linguini benchmark, derived from International Linguistic Olympiad (ILO) problems across 75 mostly extremely low-resource languages, provides a principled measure of this reasoning ability independent of language memorization.

## Key Concepts

- **Language-agnostic linguistic reasoning:** The ability to solve structured language puzzles using only information provided in context, without any prior knowledge of the language being analyzed.
- **International Linguistic Olympiad (ILO) corpus:** The source of Linguini's problems; ILO puzzles are specifically designed so that solvers with no prior language knowledge can deduce patterns from in-context examples.
- **Linguini benchmark:** 894 questions grouped into 160 problems across 75 mostly XLR languages; designed so all information needed to solve the puzzle is in the problem statement.
- **Open vs. closed model gap:** A significant performance difference between proprietary models (best: 24.05%) and open-source models (best: 8.84%), suggesting reasoning ability scales with model capability.

## Main Findings

- All tested models score below 25% on Linguini, indicating that even state-of-the-art LLMs struggle with language-agnostic linguistic reasoning.
- There is a large gap between proprietary models (Claude, GPT-4) and open-source models (Llama, Mistral), suggesting that linguistic reasoning requires capabilities that smaller open models currently lack.
- The benchmark explicitly controls for prior language knowledge, making it a purer measure of reasoning than multilingual benchmarks where performance conflates memorization and reasoning.
- Many of the 75 languages covered are Indigenous or severely endangered languages, making the benchmark directly relevant for evaluating models on unseen language structures.

## Relevance to Indigenous AI

Linguini provides a methodological tool for evaluating LLM linguistic reasoning on Mohawk and other Indigenous languages without requiring large amounts of Mohawk-specific training data. If an LLM can solve Mohawk morphological puzzles from in-context examples alone, it demonstrates genuine structural reasoning ability rather than statistical memorization. The benchmark's design — all needed information is in context — is also a model for constructing evaluation items for Mohawk that community linguists could author. The open/closed model gap has implications for choosing base models: if the project aims for community-deployable open models, current reasoning limitations must be factored into system design.

## Limitations & Critiques

- The benchmark uses ILO-style puzzles that may not capture culturally situated or pragmatically complex aspects of Indigenous language use.
- 75 languages are covered, but Mohawk and other Haudenosaunee languages are not confirmed to be among them.
- High scores could reflect pattern-matching on ILO puzzle formats rather than genuine linguistic reasoning ability.

## Questions & Follow-ups

- Are any Haudenosaunee languages (Mohawk, Cayuga, Seneca) represented in the Linguini benchmark? If not, could ILO-style puzzles be authored for Mohawk with community linguist involvement?
- Related work: Bean et al. (2024) (LingOly benchmark, NeurIPS 2024 — same ILO source material, complementary benchmark).
