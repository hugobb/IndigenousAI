# Progressing beyond Art Masterpieces or Touristic Clichés: how to assess your LLMs for cultural alignment?

**Authors:** António Branco, João Silva, Nuno Marques, Luis Gomes, Ricardo Campos, Raquel Sequeira, Sara Nerea, Rodrigo Silva, Miguel Marques, Rodrigo Duarte, Artur Putyato, Diogo Folques, Tiago Valente
**Year:** 2026
**Venue:** arXiv preprint arXiv:2604.25654v2 (submitted May 2026)
**Link:** https://arxiv.org/abs/2604.25654

---

## Core Argument

Existing datasets for evaluating LLM cultural alignment suffer from three interrelated problems: (1) they rely on generic, stereotyped, or touristic-cliché knowledge that is externally imposed on cultures; (2) they focus on encyclopedic "high culture" facts that are widely available on the web, giving all models equally good access and thus producing low discriminative power; and (3) many include explicit cultural identifiers (country names, proper nouns) in questions that act as "oracles" inflating model scores. The authors propose design guidelines that require endogenous, community-insider perspectives, factual single-answer questions without cultural cues, and empirically demonstrate these guidelines yield datasets with significantly greater discriminative power between culturally-specialized and general-purpose models.

## Key Concepts

- **Cultural alignment:** An LLM's ability to know, acknowledge, handle, deliver, respect, and support what a given group considers part of its own culture — assessed against the group's own insider understanding, not an external taxonomy.
- **Touristic clichés:** Questions and answers that reflect stereotyped outsider views of a culture (e.g., "What do people eat for New Year in Greece?") rather than lived insider knowledge; a recurring problem in benchmark datasets like BLEnD.
- **Encyclopedic/high culture bias:** Most existing datasets focus on publicly documented historical events, art masterpieces, geography, and prominent figures — information equally available in training data across all models, yielding poor discrimination.
- **Oracle effect:** The inflation of model scores when questions contain explicit cultural markers (country names, culture-specific proper nouns) that cue the correct cultural context, masking genuine misalignment. The authors show this effect reaching up to 42 percentage points for some models.
- **Endogenous point of view (guideline E series):** Dataset questions must be written in the target language as used in the target culture, require knowledge that any person raised in that culture would possess, avoid named entities and explicit cultural labels, and be answerable without specifying the cultural context.
- **Discriminative power:** The key metric for benchmark quality — the degree to which a dataset can distinguish between culturally fine-tuned models and their base counterparts. Current benchmarks often show near-identical scores for fine-tuned vs. base models.
- **Tuguesice-PT:** The 327-item Portuguese cultural alignment benchmark developed under the proposed guidelines, contrasted against BLEnD-PT (232 items adapted from BLEnD using the mainstream approach).

## Main Findings

- Under the mainstream approach (BLEnD-PT), the "oracle" system prompt providing cultural context adds only 0–3 percentage points to model scores — meaning questions already contain sufficient cultural cues to guide models regardless of genuine alignment.
- Under the proposed guidelines (Tuguesice-PT), the oracle prompt adds 20–42 percentage points — revealing that without the cue, models genuinely vary in their cultural alignment.
- The gap between the culturally fine-tuned Gervásio 70B and its base Llama 70B is 14.07 percentage points on Tuguesice-PT vs. only 1.72 on BLEnD-PT, demonstrating that the proposed dataset is far better at distinguishing specialized from general models.
- Top model scores on Tuguesice-PT (39.76% for Gervásio 70B) are much lower than on BLEnD-PT (55.17% for Gemini 2.5 Flash), confirming that the proposed approach is harder and less "exhausted."
- The proposed guidelines require: linguistically simple, factual, single-answer, context-independent questions; endogenous cultural perspective (written by insiders without external taxonomy); questions that general-purpose "bigtech" chatbots fail; and questions whose answers differ across closely related cultures (e.g., European vs. Brazilian Portuguese).

## Relevance to Indigenous AI

The methodological critique in this paper is essential for designing evaluation tools for Mohawk language and cultural AI. Any benchmark for an LLM trained or fine-tuned for Mohawk must avoid the three pitfalls identified: external taxonomies (non-community-defined "cultural categories"), encyclopedic focus (publicly available facts about Haudenosaunee history that any model scraping Wikipedia would know), and oracle inflation (embedding "Mohawk" or "Six Nations" in the question text). The requirement that questions be answerable only from genuine insider community knowledge — and that they stump general-purpose models — maps directly onto what authentic Indigenous cultural evaluation would require. The endogenous point of view guideline operationalizes community epistemic authority. The paper also implicitly reinforces why community members must be the annotators/evaluators, not external researchers.

## Limitations & Critiques

- The study is limited to a single language/culture (Portuguese) for empirical validation; whether the guidelines generalize to oral, under-documented, or structurally very different languages (like polysynthetic Mohawk) is not tested.
- The guideline requiring questions to "stump ChatGPT" (D2) is a practical heuristic, but it ties benchmark quality to the current state of commercial models — what stumps GPT-4 today may not stump future models, creating benchmark obsolescence.
- The benchmark is not publicly released (available only "upon justified request") to protect test set integrity, which limits community access and third-party replication.
- The paper does not address how to handle cultural knowledge that communities consider sensitive, sacred, or restricted — a major concern for any Indigenous cultural benchmark where some knowledge should not be in a publicly queryable dataset at all.

## Questions & Follow-ups

- How should the design guidelines be modified for a language community (like Six Nations/Mohawk) where some cultural knowledge is governed by protocols of access and where community consent for inclusion in a benchmark is required?
- Is the "questions that stump general models" heuristic (guideline D2) appropriate for Indigenous AI contexts, or does it risk inadvertently encouraging researchers to treat community knowledge as a "challenge dataset" rather than as sovereign cultural heritage?
- Related work to explore: Khan et al. (2025) "Randomness, not representation: The unreliability of evaluating cultural alignment in LLMs" (FAccT 2025 — directly critiques the approaches reviewed here); Chiu et al. (2025) "CulturalBench" (human-AI red-teaming approach to cultural knowledge benchmarking, referenced in this paper).
