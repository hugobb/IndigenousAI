
# MorphScore Tokenizer Evaluation

**Category:** ML Technique
**Data Regime:** any
**Applicable Languages:** all; designed for cross-linguistic comparison, especially agglutinative and polysynthetic languages

## Description

MorphScore is a tokenizer evaluation metric that measures the proportion of token boundaries that align with morpheme boundaries in a test set. It provides a language-level, single-number summary of morphological alignment that can be compared across tokenizers and across languages.

The metric was introduced to test the hypothesis that agglutinative languages underperform in language modeling because their tokenizers fail to align with morpheme boundaries. Counterintuitively, the study found the opposite: agglutinative languages score *higher* on MorphScore than fusional languages (66.3% vs. 53.3%), disconfirming the morphological alignment hypothesis. This is because longer words with more tokens per word are statistically more likely to have at least one token boundary fall on a morpheme boundary by chance.

**How MorphScore is computed:**
For each word in a test set that contains at least one token boundary (single-token words are excluded):
- Score **1** if the tokenizer places a token boundary at the morpheme boundary of interest
- Score **0** if no token boundary falls at the morpheme boundary

MorphScore for a language is the mean score across all scored items. Datasets use morpheme boundary annotations from Universal Dependencies (UD) or UniMorph; most datasets include one morpheme boundary annotation per word.

The key practical implication: MorphScore, as constructed, is an unreliable proxy for tokenizer quality for languages with longer words or higher fertility (tokens/word). Higher fertility mechanically inflates MorphScore. This makes it unsuitable for cross-typological comparisons without controlling for word length and fertility.

## When to Use

- When you need to compare the morphological alignment of two tokenizers for the same language
- When auditing whether an inherited tokenizer respects morpheme boundaries in a target language
- When contributing to multilingual tokenizer research and need a standardized metric
- **Do not use** as the sole quality signal when comparing tokenizers across languages of different morphological types — fertility and word-length confounds must be controlled
- **Do not use** when no morpheme-annotated dataset exists for the target language; the metric requires per-word morpheme boundary annotations

## How to Apply

**Step 1 — Obtain a morpheme-annotated dataset**
Collect or create a set of word forms with morpheme boundary annotations. Sources:
- Universal Dependencies (UD): https://universaldependencies.org/ — lemma + morphological features
- UniMorph: https://unimorph.github.io/ — morphological paradigms with boundary annotations
- Target: at least 100 items per language; 2,000 is ideal (larger samples are deduplicated to 2,000)

**Step 2 — Apply the tokenizer**
Tokenize each word in the dataset with the tokenizer under evaluation. Use the same tokenizer vocabulary and settings that would be used in production.

**Step 3 — Exclude one-token words**
Discard any word that the tokenizer represents as a single token with no internal boundaries. Including them would trivially score 0 and penalize the tokenizer for correctly representing common, short words as whole tokens. (A variant that counts one-token words as correct can also be computed as a sensitivity check.)

**Step 4 — Score each item**
For each remaining word:
```
if morpheme_boundary in token_boundaries:
    score = 1
else:
    score = 0
```
When a word has multiple morpheme boundaries annotated (e.g., Korean datasets), choose the leftmost boundary consistently.

**Step 5 — Aggregate**
MorphScore = mean(scores across all items for the language)

**Step 6 — Interpret with controls**
Report MorphScore alongside:
- Mean word length in characters
- Mean tokens per word (fertility)
- OOV rate (proportion of words in vocabulary)

Differences in MorphScore across languages are only interpretable for same-language tokenizer comparisons. Cross-typological comparisons require controlling for word length and fertility.

## Pseudocode

```
function compute_morphscore(tokenizer, morpheme_dataset):
    """
    morpheme_dataset: list of (word, morpheme_boundary_index) pairs
    Returns: float in [0, 1]
    """
    scores = []

    for word, boundary_index in morpheme_dataset:
        tokens = tokenizer.tokenize(word)

        # Skip one-token words (no internal boundaries)
        if len(tokens) == 1:
            continue

        # Recover character-level token boundary positions
        token_boundaries = get_token_boundary_positions(word, tokens)

        # Score: 1 if morpheme boundary is among token boundaries
        if boundary_index in token_boundaries:
            scores.append(1)
        else:
            scores.append(0)

    if len(scores) == 0:
        return None  # All words were one-token; cannot score

    return mean(scores)


function get_token_boundary_positions(word, tokens):
    """
    Returns a set of character indices where token splits occur.
    e.g. word="books", tokens=["book","s"] -> {4}
    """
    boundaries = set()
    pos = 0
    for token in tokens[:-1]:  # last token has no right boundary
        pos += len(token)
        boundaries.add(pos)
    return boundaries


function morphscore_with_controls(tokenizer, morpheme_dataset):
    score = compute_morphscore(tokenizer, morpheme_dataset)
    mean_word_length = mean([len(w) for w, _ in morpheme_dataset])
    mean_fertility = mean([
        len(tokenizer.tokenize(w)) for w, _ in morpheme_dataset
        if len(tokenizer.tokenize(w)) > 1
    ])
    return {
        "morphscore": score,
        "mean_word_length": mean_word_length,
        "mean_fertility": mean_fertility,
        "n_items": len(morpheme_dataset)
    }
```

## Evidence

Arnett & Bergen (COLING 2025) computed MorphScore for 22 languages using monolingual SentencePiece tokenizers (vocabulary size up to 32K, trained on 10K lines). Key results:

- Agglutinative languages: mean MorphScore = **66.3%**
- Fusional languages: mean MorphScore = **53.3%**
- Difference is statistically significant (t(20.874) = 2.393, p = 0.027)
- Correlation between MorphScore and language model perplexity: F(1,13) = 0.323, **p = 0.580** (not significant)

The second finding — no correlation between MorphScore and perplexity — is the key negative result: morphological alignment of the tokenizer does not predict language model performance. The performance gap between agglutinative and fusional languages is explained by data quantity (byte-premium-scaled), not by tokenizer morphological alignment.

When MorphScore is recalculated including one-token words as correct, agglutinative languages still have higher MorphScores than fusional languages (t(18.874) = 2.393, p = 0.027), ruling out one-token exclusion as a confound.

Regression analysis confirmed that word length in characters and fertility are both negatively correlated with MorphScore (p < 0.001 for both), but the effect sizes are small (adjusted R² = 0.021), meaning these confounds alone cannot explain the 20%+ difference in MorphScore between agglutinative and fusional languages.

## Variations & Configuration

- **Including one-token words:** Compute MorphScore where single-token words count as correct (score = 1). Use as a robustness check; results should be similar to the standard variant.
- **Multiple boundary annotations:** When a word has multiple annotated morpheme boundaries, scoring against each one separately and averaging provides a more complete picture, but most existing datasets annotate only one boundary per word.
- **Expanded language coverage:** Arnett et al. (2025, arXiv forthcoming) extended MorphScore to 70 languages; code and datasets are available at https://github.com/catherinearnett/morphscore
- **Tokenizer comparison:** Run MorphScore on two candidate tokenizers for the same language; compare scores. The relative difference is meaningful; the absolute score is a weaker signal.
- **Dataset quality:** UD datasets vary in boundary annotation consistency (inflectional vs. derivational boundaries); UniMorph is more consistent for paradigmatic forms. Use UD for text-representative coverage and UniMorph for paradigmatic depth.

## Code & Tools

- **MorphScore repository:** https://github.com/catherinearnett/morphscore — original code and datasets for 22 languages
- **Universal Dependencies:** https://universaldependencies.org/ — morpheme boundary annotations for 100+ languages
- **UniMorph:** https://unimorph.github.io/ — morphological paradigm data for 100+ languages
- **SentencePiece:** https://github.com/google/sentencepiece — standard tokenizer for low-resource languages; used in the original MorphScore experiments
- **tokenization-scorer:** https://github.com/zouharvi/tokenization-scorer — Rényi entropy and compression metrics to complement MorphScore

## Strengths & Weaknesses

| Strengths | Weaknesses |
| --- | --- |
| Simple, interpretable single number per language-tokenizer pair | Does not predict language model performance (no correlation with perplexity) |
| Language-agnostic; requires only a morpheme-annotated word list, not a full corpus | Mechanically confounded by word length and fertility; agglutinative languages appear better-aligned than they may be |
| Standardized datasets available for 22–70 languages | Requires morpheme boundary annotations, which do not exist for most indigenous / under-documented languages |
| Useful for same-language tokenizer comparison (relative differences are meaningful) | Cross-typological comparisons require controlling for word length and fertility, adding complexity |
| Faster to compute than downstream perplexity; runs on CPU in seconds | Does not capture whether tokens are undertrained, or whether alignment improves downstream task performance |
| Identifies systematic over-splitting or under-splitting patterns | Single boundary per word in most datasets; full morphological segmentation is not assessed |

## References

- Arnett, C. & Bergen, B. K. (2025). Why do language models perform worse for morphologically complex languages? COLING 2025, pages 6607–6623.
- Arnett, C., Hudspeth, M., & O'Connor, B. (2025). Evaluating morphological alignment of tokenizers in 70 languages. arXiv:2507.06378. https://github.com/catherinearnett/morphscore
- Zouhar, V., et al. (2023). Tokenization and the noiseless channel. ACL 2023. https://github.com/zouharvi/tokenization-scorer
- Kudo, T. & Richardson, J. (2018). SentencePiece: A simple and language independent subword tokenizer and detokenizer. EMNLP 2018.

??? note "📋 Self-Review Notes"
    **Reviewed:** 2026-06-11

    **Criterion 1 — Implementable from scratch:** PASS — The six-step How to Apply section plus the three pseudocode functions, dataset sources with URLs, and the controls checklist give a practitioner everything needed to implement the metric independently.

    **Criterion 2 — Empirical results with numbers:** PASS — Specific mean MorphScores (66.3% agglutinative vs. 53.3% fusional), t-statistic and p-value (t(20.874) = 2.393, p = 0.027), F-statistic for perplexity non-correlation (F(1,13) = 0.323, p = 0.580), adjusted R² for confound regression (0.021), number of languages (22), training-data size (10K lines), and vocabulary size (32K) are all cited with the source paper.

    **Criterion 3 — Data regime clarity:** PASS — Minimum (100 items) and ideal (2,000 items, deduplicated) dataset sizes are stated explicitly. Both UD and UniMorph are recommended with URLs and their trade-offs noted (text-representative vs. paradigmatic depth). The no-data-available case (no morpheme-annotated dataset exists) is called out as a hard blocker.

    **Criterion 4 — Pseudocode completeness:** PARTIAL — `compute_morphscore` and `get_token_boundary_positions` cover the main path completely, and the edge case of all-one-token words returning `None` is handled. However, the pseudocode assumes a single `boundary_index` per word; the multi-boundary case (mentioned in prose as "choose the leftmost boundary") is not reflected in the pseudocode signature or loop, which could cause confusion for practitioners with Korean or other multiply-annotated datasets. The `morphscore_with_controls` wrapper also recomputes tokenization twice per word, which is an inefficiency worth noting.

    **Criterion 5 — Failure modes:** PARTIAL — Three failure modes are well-documented: (1) cross-typological fertility confound, (2) absence of morpheme-annotated data, and (3) no correlation with downstream perplexity. Missing: the impact of subword-continuation markers (e.g., WordPiece `##` prefixes, SentencePiece `▁` start markers) on the character-position arithmetic in `get_token_boundary_positions` — tokenizers that use these markers require stripping them before computing `len(token)`, or boundary positions will be off-by-one. This is a practical implementation pitfall not mentioned anywhere in the doc.

    **Overall:** Strong documentation overall — empirical grounding and interpretive caveats are unusually thorough. Two gaps to address: (1) extend or annotate the pseudocode to handle the multi-boundary case, and (2) add a note in the pseudocode or How to Apply section about stripping subword-continuation markers before computing character-level token boundary positions.

