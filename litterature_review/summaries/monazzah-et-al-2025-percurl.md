# PERCUL: A Story-Driven Cultural Evaluation of LLMs in Persian

**Citation:** Monazzah, E. M., Rahimzadeh, V., Yaghoobzadeh, Y., Shakery, A., & Pilehvar, M. T. (2025). PERCUL: A Story-Driven Cultural Evaluation of LLMs in Persian. In *Proceedings of the 2025 Conference of the North American Chapter of the Association for Computational Linguistics: Human Language Technologies (Volume 1: Long Papers)*, pages 12670–12687.

---

## Core Argument

Current LLM benchmarks fail to capture deep cultural understanding because they rely on surface-level factual recall. The authors argue that genuine cultural competence requires contextual reasoning — understanding cultural norms, practices, and values as they operate in realistic social situations. They introduce PERCUL, a story-driven multiple-choice benchmark that tests cultural comprehension through short narratives, not isolated factoids, grounded in Hall's Triad of Culture (technical, formal, and informal cultural knowledge).

---

## Key Concepts

- **Hall's Triad of Culture:** Three-level cultural model distinguishing technical (explicit, transmissible knowledge), formal (implicit societal norms), and informal (deeply internalized, largely unconscious cultural behavior). PERCUL covers all three.
- **Story-driven evaluation:** Each benchmark item embeds cultural knowledge inside a short Persian narrative; the model must comprehend the cultural context to answer correctly, preventing surface-level pattern matching.
- **Cultural categories:** 11 domains — institutions, music, dress, objects, visible behavior, art, iconic figures, appropriacy, rituals, architecture, and foods.
- **Translation degradation:** Performance drop when Persian cultural content is translated to English and back, used to measure language-vs-culture entanglement in models.
- **WEIRD bias:** Most existing cultural benchmarks favor Western, Educated, Industrialized, Rich, Democratic cultures; PERCUL addresses a non-WEIRD high-culture language.

---

## Main Findings

- Best overall model: Claude 3.5 Sonnet at 81.7%, versus a 93% human baseline — an 11.3 percentage point gap.
- Best open-weight model: LLaMA 3.1 405B at 71.7% — a 21.3 percentage point gap from human performance.
- Translation penalty: Translating test items to English degrades model performance by 6.6–14.5 percentage points, indicating models process Persian cultural knowledge better in the original language.
- Persian-specific fine-tuned models (PersianMind, Dorna) underperform their base models, suggesting that current fine-tuning approaches may overfit surface language patterns without deepening cultural understanding.
- Error analysis shows models rely on surface-level lexical cues rather than synthesizing narrative context for deep cultural reasoning.
- Performance varies across cultural categories; appropriacy and informal norms are hardest.

---

## Relevance to Indigenous AI

PERCUL offers a methodological template directly applicable to Indigenous language AI evaluation. Key transfers:

1. **Story-driven format:** Indigenous oral traditions and cultural knowledge are inherently narrative; embedding evaluation in stories (rather than isolated MCQs) is more culturally authentic and aligns with how knowledge is transmitted in many Indigenous communities.
2. **Non-WEIRD benchmark design:** The paper demonstrates that rigorous cultural evaluation can be built for any language/culture outside the dominant WEIRD paradigm — a proof of concept for Mohawk, Cree, Inuktitut, and other Indigenous languages.
3. **Hall's Triad as a framework:** The three-tier cultural model (technical/formal/informal) can structure what kinds of cultural knowledge should be tested for Indigenous languages, particularly the informal tier (deeply internalized protocols, relational knowledge, land-based knowledge).
4. **Translation degradation findings:** Directly relevant — they confirm that translating Indigenous content into English for processing by English-dominant models incurs systematic cultural loss, supporting the case for Indigenous-language-first models.
5. **Gap between fine-tuned and base models:** The finding that Persian-tuned models underperform base models warns against assuming that language fine-tuning transfers cultural understanding — an important caution for low-resource Indigenous language model development.

---

## Limitations & Critiques

- Persian is a high-resource, well-documented language with a large internet corpus; the benchmark creation process (crowdsourced stories + expert validation) may not be replicable at the same scale for extremely low-resource Indigenous languages.
- The 11 cultural categories reflect the authors' framework choices; other cultural dimensions (e.g., relational ethics, land-based knowledge, kinship protocols) are absent and would need to be added for Indigenous contexts.
- The multiple-choice format, even with narratives, still imposes a Western testing paradigm that may not capture performative or relational cultural knowledge.
- Human baseline (93%) is computed on a subset; it is unclear how representative the annotators are of the full diversity of Persian cultural knowledge.
- The paper does not address community consent or co-construction — the benchmark was built by academic researchers, not in partnership with Persian-speaking cultural knowledge holders.

---

## Questions & Follow-ups

- Can the story-driven format be adapted for oral Indigenous languages where written narrative norms differ significantly from Persian literary conventions?
- What would the equivalent of Hall's informal tier look like for Mohawk cultural knowledge — what domains would be most important to include?
- How does PERCUL's methodology compare to participatory evaluation approaches (cf. Qadri et al. 2025) in terms of who defines "correct" cultural understanding?
- Is there a threshold of training data below which even story-driven benchmarks become unreliable for model development (vs. evaluation)?
- The gap between fine-tuned Persian models and base models is concerning — has this pattern been observed in other culturally specific fine-tuning efforts?
