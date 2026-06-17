# Towards Low-Resource Neural Machine Translation for Indigenous Languages in Canada

**Authors:** Ngoc Tan Le, Fatiha Sadat
**Year:** 2021
**Venue:** TAL (Traitement Automatique des Langues), Vol. 62, No. 3

---

## Core Argument

Inuktitut and Inuinnaqtun — two closely related polysynthetic languages of the Canadian Arctic — present extreme challenges for NMT due to polysynthesis, dialectal variation, noisy data, and scarce resources. A two-stage pipeline that builds a morphological segmenter first, then integrates it into an NMT system, outperforms state-of-the-art baselines for Inuktitut–English translation. The work is part of a larger research program to build NLP infrastructure for endangered Indigenous languages of Canada.

## Key Concepts

- **Inuktitut:** Eskimo-Aleut polysynthetic language; official language of Nunavut; ~39,770 speakers (2016 census); part of the Inuktut dialect continuum; the Nunavut Hansard corpus provides 1.3M aligned Inuktitut-English sentence pairs.
- **Inuinnaqtun:** Western Canadian Inuktun, closely related dialect group; ~675 mother-tongue speakers in Canada; much lower-resourced than Inuktitut; endangered (projected to disappear within two generations).
- **Inuktitut word structure:** Word base + lexical suffixes + grammatical ending suffixes; words can encode full English sentences in one form (e.g., "tusaatsiarunnanngittualuujunga" = "I can't hear very well", composed of 8 morphemes).
- **Morphological segmenter approaches compared:** (1) Supervised seq2seq (sequence labeling); (2) Adaptor Grammars (AG) semi-supervised fine-tuning; (3) unsupervised Morfessor; (4) BPE (used as baseline).
- **NMT integration:** Morphological segmentation is applied as source-side preprocessing before the NMT transformer, reducing effective vocabulary size and improving translation quality.
- **Morpheme composition:** In Inuktitut, word base + ~4-5 morphemes from ~450 affixes + 1,300 verb endings + 320 noun endings; most words in a given text are OOV for word-based models.

## Main Findings

- The proposed NMT model incorporating morphological segmentation outperforms the state of the art for Inuktitut–English machine translation.
- Among segmentation methods, supervised and semi-supervised approaches outperform purely unsupervised (Morfessor) and BPE on morphological segmentation quality.
- Integrating morphological segmentation into NMT as source-side preprocessing improves translation quality, confirming that handling polysynthetic morphology explicitly is beneficial for MT.
- Inuinnaqtun remains highly under-resourced even relative to Inuktitut; only a Bible parallel corpus is available for it, making it an extreme low-resource challenge.
- The study confirms that Inuktitut, while still polysynthetic, has reached a "medium-resource" level thanks to the Nunavut Hansard — a level Mohawk has not reached.

## Relevance to Indigenous AI

This paper establishes the two-stage pipeline (morphological segmenter → NMT) as the state-of-the-art approach for polysynthetic Indigenous language MT in Canada — directly informing what a Mohawk translation or language support system would need. Mohawk faces the same structural challenges as Inuktitut (polysynthesis, bound morphemes, OOV explosion) but at a much more severe data scarcity level (no equivalent of the Nunavut Hansard). The comparison across segmentation methods (supervised seq2seq vs. AG vs. Morfessor vs. BPE) provides a practical benchmark for what to expect when applying similar approaches to Mohawk. The encoding of full sentences as single words in Inuktitut (and Mohawk) is the key structural fact that makes standard NMT pipelines fail without morphological preprocessing.

## Limitations & Critiques

- The NMT work relies on the Nunavut Hansard corpus — a legislative domain dataset. Translation quality in conversational or pedagogical contexts would likely be lower.
- The paper focuses on text-to-text translation; speech recognition (which would need to precede transcription and translation in most real-world contexts) is out of scope.
- The work does not address community needs or deployment; it is a technical NLP contribution without discussion of how the tools would be used by Inuktitut or Inuinnaqtun speakers.
- Evaluation metrics (BLEU) are known to be inadequate for morphologically rich languages; the BLEU improvements reported may not reflect genuine usability improvements.

## Questions & Follow-ups

- Is the morphological segmenter developed here publicly available? Can it be adapted for Mohawk or other Canadian Indigenous languages?
- What Mohawk parallel data exists (even limited Bible data, pedagogical translations)? Is it sufficient to start an NMT experiment?
- Related work: Le et al. (2022) on deep learning segmentation for Innu-Aimun; Kuhn et al. (2020) on NRC Canada ILT project (which provided the Nunavut Hansard); Khandagale et al. (2022) on unsupervised segmentation for Inuktitut; Ngoc et al. (2021) on Inuinnaqtun.
