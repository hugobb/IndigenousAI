# Democratizing LLMs for Low-Resource Languages by Leveraging their English Dominant Abilities with Linguistically-Diverse Prompts

**Authors:** Xuan-Phi Nguyen, Sharifah Mahani Aljunied, Shafiq Joty, Lidong Bing
**Year:** 2024
**Venue:** Preprint (DAMO Academy, Alibaba Group; Nanyang Technological University)

---

## Core Argument

LLMs' strong English-centric capabilities can be redirected to low-resource languages without any supervised data by providing few-shot exemplars from a diverse set of high-resource languages rather than the target language itself. This Linguistically-Diverse Prompting (LDP) approach performs on par with supervised few-shot learning for translation between English and 34 Indic and African languages, and even surpasses supervised prompting on non-English tasks.

## Key Concepts

- **Linguistically-Diverse Prompting (LDP):** An unsupervised prompting method that assembles synthetic few-shot exemplars from multiple high-resource languages to elicit LLM performance in a low-resource target language; no labeled target-language data is required.
- **English dominant ability:** The observation that LLMs perform most strongly in English; LDP leverages this by using the model's English capabilities as an intermediate bridge to low-resource language generation.
- **Synthetic exemplar construction:** Creating few-shot examples by prompting the model itself in zero-shot mode across multiple high-resource languages, then assembling these as pseudo-demonstrations for the target language.
- **Unsupervised + pseudo-zero-shot setups:** LDP works in both unsupervised (base LLM, no instruction tuning) and pseudo-zero-shot (instruction-tuned LLM) settings.

## Main Findings

- LDP performs on par with supervised few-shot learning for English↔LRL translation across 34 Indic and African languages, without requiring any labeled data in the target language.
- LDP surpasses supervised prompting on non-English intra-lingual tasks (summarization, QA, instruction following), suggesting the linguistically diverse signals help the model generalize beyond translation.
- The method significantly improves low-resource performance across multiple task types: MT (FLORES), summarization (XLSum), question answering (XQUAD, TydiQA), and conversational instruction (Sea-Bench).
- LDP is especially effective for languages where the model confusedly responds in the wrong language or struggles with non-Latin scripts due to fragmented tokenization — the diverse exemplars ground the model in the correct language.

## Relevance to Indigenous AI

LDP offers a zero-labeled-data pathway to eliciting Mohawk language performance from existing LLMs, before any community-labeled data is collected. By constructing diverse exemplars from multiple high-resource languages (English, French, Spanish) and using them to prompt the model toward Mohawk outputs, it may be possible to achieve non-trivial task performance as a baseline. The method is also compatible with the project's early-stage constraints: no parallel Mohawk corpus, no community annotation, no fine-tuning compute. However, LDP's effectiveness is likely to be limited for Mohawk given its more extreme low-resource status compared to the 34 Indic/African languages tested.

## Limitations & Critiques

- Evaluated on Indic and African languages that, while low-resource, have more pretraining representation than Mohawk; performance on truly unseen languages (like Zhuang or Mohawk) is untested.
- The method relies on the model having some capability in the target language; for languages with near-zero pretraining coverage, LDP may produce wrong-language outputs rather than LRL outputs.
- Does not engage with Indigenous data sovereignty, community consent, or cultural fidelity concerns.

## Questions & Follow-ups

- At what minimum level of LLM pretraining exposure does LDP begin to work effectively? Is Mohawk above or below that threshold?
- Could LDP be combined with CoD (Lu et al., 2024) — using diverse high-resource exemplars alongside a Mohawk dictionary chain — to improve translation without any parallel data?
- Related work: Cahyawijaya et al. (2025) (X-ICL cross-lingual exemplars), Zhang et al. (2024) (teaching unseen languages via ICL), Lu et al. (2024) (Chain-of-Dictionary).
