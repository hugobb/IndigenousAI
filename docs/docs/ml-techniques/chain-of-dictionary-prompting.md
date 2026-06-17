
# Chain-of-Dictionary (CoD) Prompting for Low-Resource MT

**Category:** ML Technique
**Data Regime:** zero-resource / &lt;1K sentences (requires only a bilingual or multilingual dictionary; no parallel corpus)
**Applicable Languages:** Any low-resource language pair for which a dictionary exists; especially effective for non-Latin-script languages and languages with baseline chrF++ < 20

## Description

Chain-of-Dictionary (CoD) Prompting is a prompting framework that augments an LLM's translation prompt with a **chained multilingual dictionary** — providing, for a subset of words in the source sentence, their meanings expressed across a chain of intermediate high-resource languages rather than only in the target language.

The key insight is that a single bilingual dictionary (source → target) gives the model one alignment signal per word, but many low-resource language words are opaque even with one mapping. Providing the same word's meaning in French, German, and Portuguese as well as the target language creates multiple cross-lingual anchors that the model can triangulate. The chain connects the source word through languages the model knows well before arriving at the target, reducing the information gap.

**Prompt structure.** Each CoD prompt has two parts:

```
(1) Standard translation instruction:
    "Translate the following text from <source-language> into <target-language>: <source-sentence>"

(2) Chained multilingual dictionary section:
    "<word> means <word-in-target> means <word-in-aux-lang-1> means <word-in-aux-lang-2>"
    (repeated for each content word in the source sentence, stopwords optionally excluded)
```

**Dictionary construction.** The offline dictionary is built by:
1. Extracting content keywords from the source sentence using an LLM prompt ("Extract the words from the following texts: &lt;sentence&gt;").
2. Translating each keyword to all target and auxiliary languages using an off-the-shelf MT system (e.g., NLLB 3.3B).
3. Filtering words where back-translation verification fails after 3 attempts (approx. 29% of words filtered; 71% pass).

**Auxiliary language selection.** The default chain uses French (fra_Latn), German (deu_Latn), and Portuguese (por_Latn) as auxiliary languages, creating a 5-language chain (source + target + 3 auxiliaries). Languages similar to the target (same script, same family) perform better as auxiliaries than arbitrary high-resource languages; using auxiliary languages from a different script than the target can degrade results.

**Chaining vs. decomposition.** Using a non-chained (decomposed) dictionary — where each word's mappings are listed separately rather than in a single chain — substantially degrades performance. The chain format avoids redundant source-language text that distracts the model.

## When to Use

- The target language is low-resource and the LLM scores below 20 chrF++ on a zero-shot translation baseline; CoD consistently improves languages in this range.
- A bilingual or multilingual dictionary exists for the language (even a partial lexicon); parallel sentence examples are unavailable or scarce.
- Non-Latin script languages where the model struggles to activate latent knowledge (e.g., Cyrillic, Arabic, Tamil scripts).
- As a drop-in improvement over standard zero-shot or few-shot prompting, without any fine-tuning.
- When few-shot ICL example retrieval is difficult because relevant demonstration sentences for the low-resource language are hard to find or not available.

**Less applicable when:**
- The language already achieves high baseline scores (> 40 chrF++) — gains are smaller for well-supported languages.
- No dictionary exists, even partial (CoD falls back to zero-shot if no word matches are found).
- The target language uses the same script as common auxiliary languages — the script-bridging benefit is absent.

## How to Apply

1. **Obtain or construct a bilingual dictionary.** Compile a list of content word → target-language translation pairs. Even a partial lexicon (high-frequency words, verb roots, nouns) is useful. For polysynthetic languages, consider listing root/stem forms rather than inflected forms, since dictionary coverage of inflected variants is sparse.

2. **Select auxiliary languages.** Start with French, German, and Portuguese (the default CoD set). If you know the target language is similar to another language family (e.g., a Slavic language), add that family's high-resource representative. Avoid auxiliary languages that share a script with the target language — this can confuse the model.

3. **Translate dictionary entries into auxiliary languages.** Use NLLB or another multilingual MT system to translate each source entry into all auxiliary languages. Filter entries where back-translation verification fails after 3 attempts.

4. **Build the prompt at inference time.** For each source sentence:
   a. Run keyword extraction (LLM prompt or simple stopword filtering).
   b. Look up each keyword in the dictionary; retrieve all chained translations.
   c. Construct the dictionary section: one chain per keyword, ordered by word appearance in the sentence.
   d. Prepend the dictionary section to the standard translation prompt.
   e. If the language has multiple script variants, specify the script explicitly (e.g., "Traditional Script" for Chinese).

5. **Call the LLM.** Feed the concatenated prompt. No fine-tuning is required; any instruction-following LLM works. Larger models benefit more from the dictionary chain.

6. **Evaluate.** Use chrF++ and BLEU via sacreBLEU. For X-En directions, CoD improvements are most reliable; for En-X, some mid-resource languages may not benefit.

## Pseudocode

```
# Offline: Build multilingual dictionary
def build_cod_dictionary(source_word_list, target_lang, aux_langs, mt_model):
    dictionary = {}
    for word in source_word_list:
        chains = {}
        valid = True
        for lang in [target_lang] + aux_langs:
            translation = mt_model.translate(word, src="eng", tgt=lang)
            # Back-translation verification
            back = mt_model.translate(translation, src=lang, tgt="eng")
            if not llm.check_equivalent(word, back):
                valid = False
                break
            chains[lang] = translation
        if valid:
            dictionary[word] = chains
    return dictionary  # ~71% of words pass

# Inference: Build CoD prompt
def cod_prompt(source_sentence, source_lang, target_lang, dictionary):
    keywords = extract_keywords(source_sentence)  # remove stopwords
    
    chain_lines = []
    for word in keywords:
        if word.lower() in dictionary:
            chains = dictionary[word.lower()]
            # Format: "word means <target> means <aux1> means <aux2> ..."
            chain_str = word
            for lang, translation in chains.items():
                chain_str += f" means '{translation}'"
            chain_lines.append(chain_str + ".")
    
    dict_section = "\n".join(chain_lines)
    translation_prompt = (
        f"Translate the following text from {source_lang} into {target_lang}: "
        f"{source_sentence}"
    )
    return dict_section + "\n" + translation_prompt

# Use with any LLM
response = llm.generate(cod_prompt(sentence, src, tgt, dictionary))
translation = extract_translation(response)
```

## Evidence

**Lu et al. (2024), EMNLP 2024 — FLORES-200 full devtest set (1,012 sentences, ~200 languages):**

Model: GPT-3.5-TURBO (ChatGPT) with CoD (chain length 5: source + target + French + German + Portuguese).

**En-X direction (Table 1 and Table 2):**
- 135/200 languages improved; 71/135 improved by > 5 chrF++ points; 13/135 improved by > 10 chrF++ points; 2/135 improved by > 20 points.
- Notable example: English → Serbian (Cyrillic script): 3.08 → 42.63 chrF++ (13× improvement).
- Average over 200 languages (Table 2): CoD Chain 5 = 38.27 chrF++ / 13.90 BLEU vs. GPT-3.5 baseline = 35.30 chrF++ / 12.52 BLEU.
- CoD (Chain 5) outperforms Few-shot ICL (3 examples): 38.27 vs. 36.93 chrF++.
- Bilingual Dictionary baseline: 36.37 chrF++ — CoD's multilingual chain adds +1.90 over a single bilingual dictionary.
- Decomposed Dictionary baseline: 31.20 chrF++ — chaining is essential; decomposition degrades below GPT-3.5 baseline.

**X-En direction (Table 5, FLORES-200 full devtest):**
- CoD = 66.12 chrF++ vs. GPT-3.5-TURBO = 44.98 chrF++; NLLB 3.3B = 54.77 chrF++.
- CoD outperforms NLLB 3.3B (the SOTA dedicated MT system) by +11.35 chrF++ in the X-En direction.

**COMET scores (Table 4, 99 supported languages):**
- CoD average COMET = 0.325 vs. GPT-3.5-TURBO baseline = 0.277.

**X-Y (non-English pivot) direction (Table 10, 30 language pairs):**
- CoD improves 25/30 translations; best gain: srp_Cyrl → kac_Latn: 1.33 → 14.48 chrF++ (>10×).

**Ablation — chain length:**
- Chain 1 (bilingual only): 31.58 chrF++ / 10.97 BLEU — equivalent to a bilingual dictionary baseline
- Chain 2: 36.37 chrF++ / 11.06 BLEU
- Chain 3: 35.47 chrF++ / 12.29 BLEU
- Chain 4: 37.90 chrF++ / 13.90 BLEU
- Chain 5 (best): 38.27 chrF++ / 13.90 BLEU

**BLOOM-7b (open-source, 10 low-resource languages, X-En, Table 3):**
CoD improves most languages. srp_Cyrl: 26.20 → 39.26 chrF++; smo_Latn: 15.09 → 16.01 chrF++. Gains are smaller than on ChatGPT, likely due to smaller model size reducing instruction-following fidelity.

**Relation to Pei et al. (2025):** Both papers confirm dictionary entries are the most impactful prompt component for LLM-based low-resource MT. Pei et al. further show that grammar book excerpts add minimal value beyond dictionaries — CoD's dictionary-only approach is empirically well-justified.

## Variations & Configuration

- **Chain length:** Default 5 (source + target + 3 auxiliaries). Increasing beyond 5 brings further gains but at higher token cost (~1.8× inference time). Empirically suggest starting at 5.
- **Stopword filtering:** Removing stopwords from dictionary lookups saves ~1/3 of dictionary prompt tokens with minimal quality loss. Recommended for production use.
- **Auxiliary language selection:** Use high-resource languages the LLM knows well. For target languages in non-Latin scripts, include at least one Latin-script auxiliary and one language from the same geographic/typological region if available.
- **Script specification:** For languages with multiple scripts (e.g., Chinese Simplified vs. Traditional, Serbian Latin vs. Cyrillic), explicitly specify the target script in the prompt.
- **Dictionary quality:** 71% of words pass back-translation verification with NLLB; for endangered languages with weaker NLLB coverage, manual curation of the dictionary may be needed.
- **CoD + morphological decomposition (proposed):** For polysynthetic languages where inflected word forms are absent from the dictionary, decompose words into morphemes first (FST or unsupervised segmentation), then look up morpheme roots in the dictionary. This combination is proposed but not yet empirically validated.

## Code & Tools

- **Official CoD implementation:** https://github.com/HongyuanLuke/Chain-of-Dictionary
- **NLLB 3.3B (for dictionary construction):** https://huggingface.co/facebook/nllb-200-3.3B — multilingual MT model used to translate dictionary entries; supports ~200 languages including many low-resource ones
- **FLORES-200 benchmark:** https://github.com/facebookresearch/flores — devtest evaluation set; 1,012 sentences in ~200 languages; used for CoD evaluation
- **sacreBLEU:** https://github.com/mjpost/sacrebleu — chrF++ and BLEU evaluation
- **COMET:** https://github.com/Unbabel/COMET — neural MT evaluation metric
- **Stopword list for dictionary filtering:** https://gist.github.com/sebleier/554280

## Strengths & Weaknesses

| Strengths | Weaknesses |
| --- | --- |
| No parallel corpus required — only a dictionary, which is more feasible to compile for endangered languages | Dictionary coverage is critical; polysynthetic languages have sparse coverage of inflected forms |
| Dramatically improves low-resource translation, especially for non-Latin scripts (up to 13× chrF++) | Requires intermediate-language dictionaries for the chain; for very rare languages, NLLB coverage may be weak |
| Outperforms few-shot ICL demonstrations for low-resource languages, avoiding the difficulty of finding relevant examples | Up to 1.8× inference time overhead due to longer prompts |
| Works with any instruction-following LLM; no fine-tuning needed | Small performance degradations on some mid-resource languages (2/65 En-X degraded by > 5 chrF++) |
| Chain structure provides multiple cross-lingual alignment signals, not just a single bilingual mapping | The chain must use high-resource auxiliary languages the LLM knows well; community languages cannot easily be used as auxiliaries |
| Stopword filtering saves ~1/3 of tokens with minimal quality loss | Does not address cultural fidelity or community-appropriate language use; purely a translation quality technique |

## References

- Lu, H., Yang, H., Huang, H., Zhang, D., Lam, W., & Wei, F. (2024). Chain-of-Dictionary Prompting Elicits Translation in Large Language Models. *Proceedings of EMNLP 2024*, pages 958–976.
- NLLB Team (2022). Scaling Neural Machine Translation to 200 Languages. *Nature*, 630(8018):841–846.
- Ghazvininejad, M., Gonen, H., & Zettlemoyer, L. (2023). Dictionary-based Phrase-level Prompting of Large Language Models for Machine Translation. *arXiv:2302.07856*.
- Zhang, J., & Zong, C. (2016). Incorporating word reordering knowledge into attention-based neural machine translation. *ACL 2016*.
- Pei, R., Liu, Y., Lin, P., Yvon, F., & Schütze, H. (2025). Understanding In-Context Machine Translation for Low-Resource Languages: A Case Study on Manchu. *ACL 2025*.

??? note "📋 Self-Review Notes"
    **Reviewed:** 2026-06-11

    **Criterion 1 — Implementable from scratch:** PASS — All steps are concretely described: dictionary construction (keyword extraction → MT translation → back-translation filtering), auxiliary language selection rationale, prompt format (chain structure vs. decomposed), inference-time assembly, and evaluation setup. A reader could reproduce the pipeline without consulting the original paper.

    **Criterion 2 — Empirical results with numbers:** PASS — FLORES-200 devtest (1,012 sentences, ~200 languages), GPT-3.5-TURBO. Full metric tables: chrF++ and BLEU for En-X (135/200 languages improved; avg 38.27 vs. 35.30 chrF++) and X-En (66.12 vs. 44.98 chrF++), COMET scores (0.325 vs. 0.277), ablation over chain lengths 1–5, BLOOM-7b results, and a striking example (srp_Cyrl 3.08 → 42.63 chrF++). Cross-paper comparison with Pei et al. is included.

    **Criterion 3 — Data regime clarity:** PASS — Explicitly stated as zero-resource / &lt;1K sentences; requires only a bilingual or multilingual dictionary, no parallel corpus. The ~29% filtering rate and ~71% pass rate for back-translation verification are quantified. Polysynthetic language caveat (root/stem vs. inflected forms) is noted.

    **Criterion 4 — Pseudocode completeness:** PASS — Two well-structured functions: `build_cod_dictionary` (offline) and `cod_prompt` (inference). Back-translation verification loop, chain string assembly, and stopword filtering are shown. Minor gap: `extract_keywords` and `llm.check_equivalent` are called but not defined; however, the surrounding prose makes their purpose unambiguous and they are standard utility steps.

    **Criterion 5 — Failure modes:** PASS — Multiple failure modes documented: decomposed vs. chained format (31.20 vs. 38.27 chrF++), wrong auxiliary script selection, weak NLLB coverage for very rare languages needing manual curation, smaller-model degradation (BLOOM-7b), mid-resource regression (2/65 languages degrade > 5 chrF++), and polysynthetic inflected-form coverage gaps. The Strengths & Weaknesses table reinforces these.

    **Overall:** Highly complete doc. The only minor gap is that `extract_keywords` in the pseudocode is a stub; adding a one-line comment pointing to the stopword list URL already in the Code section would close it. No meaningful gaps for implementation.

